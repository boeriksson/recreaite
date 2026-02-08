/**
 * Amplify Client - Drop-in replacement for base44Client
 *
 * This file provides the same API shape as base44Client but uses
 * real Amplify backend services (Data, Auth, Storage).
 */

import { generateClient } from 'aws-amplify/data';
import { getCurrentUser, fetchUserAttributes, signOut, fetchAuthSession } from 'aws-amplify/auth';
import { uploadData, getUrl } from 'aws-amplify/storage';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

// Cache for signed URLs to avoid re-signing on every render
const urlCache = new Map();
const URL_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Helper to get a fresh signed URL from an S3 path or existing URL
export const getSignedUrl = async (pathOrUrl) => {
  if (!pathOrUrl) return null;

  // Check if this is an S3 URL that needs signing
  const isS3Url = pathOrUrl.includes('.s3.') && pathOrUrl.includes('.amazonaws.com');
  const isAmplifyPath = pathOrUrl.startsWith('images/') || pathOrUrl.startsWith('public/');

  // If not an S3 URL or Amplify path, return as-is (e.g., Supabase, external URLs)
  if (!isS3Url && !isAmplifyPath) {
    return pathOrUrl;
  }

  // Extract the path from a full S3 URL if needed
  let path = pathOrUrl;
  if (isS3Url) {
    // Extract path from URL like: https://bucket.s3.region.amazonaws.com/images/file.png
    const match = pathOrUrl.match(/\.amazonaws\.com\/(.+?)(\?|$)/);
    if (match) {
      path = decodeURIComponent(match[1]);
    }
  }

  // Check cache
  const cached = urlCache.get(path);
  if (cached && Date.now() - cached.timestamp < URL_CACHE_DURATION) {
    return cached.url;
  }

  try {
    const { url } = await getUrl({ path });
    const signedUrl = url.toString();
    urlCache.set(path, { url: signedUrl, timestamp: Date.now() });
    return signedUrl;
  } catch (error) {
    console.error('Failed to get signed URL for:', path, error);
    return pathOrUrl; // Return original as fallback
  }
};

// Lazy-initialize the Amplify Data client (after Amplify.configure() is called)
// Use userPool auth mode which matches our schema's defaultAuthorizationMode
let _client = null;
const getClient = () => {
  if (!_client) {
    _client = generateClient({
      authMode: 'userPool',
    });
  }
  return _client;
};

// Helper to invoke the AI Lambda function
const invokeAIFunction = async (action, args) => {
  try {
    // Get credentials from Amplify Auth
    const session = await fetchAuthSession();
    const credentials = session.credentials;

    if (!credentials) {
      throw new Error('Not authenticated');
    }

    // Get the function name from Amplify outputs (imported at app startup)
    // The custom outputs are available via the amplify_outputs.json
    let functionName;
    let region = 'eu-north-1';

    try {
      const outputs = await import('../../amplify_outputs.json');
      functionName = outputs.default?.custom?.aiFunction || outputs.custom?.aiFunction;
      // Get region from auth config
      const userPoolId = outputs.default?.auth?.user_pool_id || outputs.auth?.user_pool_id;
      if (userPoolId) {
        region = userPoolId.split('_')[0];
      }
    } catch (e) {
      console.error('Failed to load amplify outputs:', e);
    }

    if (!functionName) {
      throw new Error('AI function not configured. Make sure the backend is deployed.');
    }

    // Create Lambda client with Amplify credentials
    const lambdaClient = new LambdaClient({
      region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
      },
    });

    // Invoke the function
    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify({ action, arguments: args }),
    });

    const response = await lambdaClient.send(command);

    // Parse the response
    const payload = JSON.parse(new TextDecoder().decode(response.Payload));

    if (response.FunctionError) {
      throw new Error(payload.errorMessage || 'Lambda function error');
    }

    return payload;
  } catch (error) {
    console.error('AI Function error:', error);
    throw error;
  }
};

// Helper to check if error is an auth error
const isAuthError = (error) => {
  const message = error?.message || error?.errors?.[0]?.message || String(error);
  return message.includes('NoValidAuthTokens') ||
         message.includes('not authenticated') ||
         message.includes('Unauthorized') ||
         message.includes('No federated jwt');
};

// Helper to create entity API with CRUD + subscribe operations
const createEntityAPI = (modelName) => {
  // Helper to get the model lazily
  const getModel = () => {
    const client = getClient();
    const model = client.models[modelName];
    if (!model) {
      console.warn(`Model "${modelName}" not found in Amplify schema`);
      return null;
    }
    return model;
  };

  return {
    list: async () => {
      try {
        const model = getModel();
        if (!model) return [];
        const { data, errors } = await model.list();
        if (errors) {
          if (isAuthError({ errors })) {
            console.warn(`${modelName}.list: User not authenticated, returning empty list`);
            return [];
          }
          throw new Error(errors[0]?.message || 'List failed');
        }
        return data;
      } catch (error) {
        if (isAuthError(error)) {
          console.warn(`${modelName}.list: User not authenticated, returning empty list`);
          return [];
        }
        throw error;
      }
    },

    filter: async (filters) => {
      try {
        const model = getModel();
        if (!model) return [];

        // For owner-based models, 'created_by' filter should just list (auto-filtered by owner)
        // Remove created_by as it's not a real field in Amplify - owner auth handles this
        const filteredFilters = { ...filters };
        delete filteredFilters.created_by;
        delete filteredFilters.owner;

        // If no filters left, just list all (owner-filtered automatically)
        if (Object.keys(filteredFilters).length === 0) {
          const { data, errors } = await model.list();
          if (errors) {
            if (isAuthError({ errors })) {
              console.warn(`${modelName}.filter: User not authenticated, returning empty list`);
              return [];
            }
            throw new Error(errors[0]?.message || 'Filter failed');
          }
          return data;
        }

        // Convert remaining filters to Amplify filter format
        const filterConditions = {};
        Object.entries(filteredFilters).forEach(([key, value]) => {
          filterConditions[key] = { eq: value };
        });

        const { data, errors } = await model.list({ filter: filterConditions });
        if (errors) {
          if (isAuthError({ errors })) {
            console.warn(`${modelName}.filter: User not authenticated, returning empty list`);
            return [];
          }
          throw new Error(errors[0]?.message || 'Filter failed');
        }
        return data;
      } catch (error) {
        if (isAuthError(error)) {
          console.warn(`${modelName}.filter: User not authenticated, returning empty list`);
          return [];
        }
        throw error;
      }
    },

    get: async (id) => {
      const model = getModel();
      if (!model) throw new Error(`${modelName} not found: ${id}`);
      const { data, errors } = await model.get({ id });
      if (errors) throw new Error(errors[0]?.message || 'Get failed');
      if (!data) throw new Error(`${modelName} not found: ${id}`);
      return data;
    },

    create: async (input) => {
      const model = getModel();
      if (!model) throw new Error(`Cannot create ${modelName}: model not found`);

      // Sanitize input - remove undefined values
      // Also stringify JSON fields that might have complex objects
      const sanitizedInput = {};
      const jsonFields = ['ai_analysis', 'metadata', 'configuration'];

      for (const [key, value] of Object.entries(input)) {
        if (value === undefined || value === null) {
          continue; // Skip undefined/null values
        }
        // Stringify JSON fields if they're objects
        if (jsonFields.includes(key) && typeof value === 'object') {
          sanitizedInput[key] = JSON.stringify(value);
        } else {
          sanitizedInput[key] = value;
        }
      }

      const { data, errors } = await model.create(sanitizedInput);
      if (errors) throw new Error(errors[0]?.message || 'Create failed');
      return data;
    },

    update: async (id, input) => {
      const model = getModel();
      if (!model) throw new Error(`Cannot update ${modelName}: model not found`);

      // Sanitize input - remove undefined values
      const sanitizedInput = { id };
      const jsonFields = ['ai_analysis', 'metadata', 'configuration'];

      for (const [key, value] of Object.entries(input)) {
        if (value === undefined || value === null) {
          continue;
        }
        if (jsonFields.includes(key) && typeof value === 'object') {
          sanitizedInput[key] = JSON.stringify(value);
        } else {
          sanitizedInput[key] = value;
        }
      }

      const { data, errors } = await model.update(sanitizedInput);
      if (errors) throw new Error(errors[0]?.message || 'Update failed');
      return data;
    },

    delete: async (id) => {
      const model = getModel();
      if (!model) throw new Error(`Cannot delete ${modelName}: model not found`);
      const { data, errors } = await model.delete({ id });
      if (errors) throw new Error(errors[0]?.message || 'Delete failed');
      return { success: true, data };
    },

    subscribe: (callback) => {
      // Check auth before setting up subscriptions
      getCurrentUser().then(() => {
        const model = getModel();
        if (!model) {
          console.warn(`Cannot subscribe to ${modelName}: model not found`);
          return;
        }
        console.log(`Setting up subscriptions for ${modelName}...`);
        // Set up subscriptions for create, update, and delete
        const createSub = model.onCreate().subscribe({
          next: (data) => {
            console.log(`${modelName} onCreate event:`, data?.id);
            callback({ type: 'create', data });
          },
          error: (err) => console.error(`${modelName} onCreate error:`, err),
        });

        const updateSub = model.onUpdate().subscribe({
          next: (data) => {
            console.log(`${modelName} onUpdate event:`, data?.id);
            callback({ type: 'update', data });
          },
          error: (err) => console.error(`${modelName} onUpdate error:`, err),
        });

        const deleteSub = model.onDelete().subscribe({
          next: (data) => {
            console.log(`${modelName} onDelete event:`, data?.id);
            callback({ type: 'delete', data, id: data.id });
          },
          error: (err) => console.error(`${modelName} onDelete error:`, err),
        });

        console.log(`${modelName} subscriptions set up successfully`);
        // Store for cleanup - this won't work well, but subscriptions require auth anyway
        callback._subscriptions = [createSub, updateSub, deleteSub];
      }).catch((err) => {
        // User not authenticated - skip subscriptions silently
        console.debug(`${modelName}.subscribe: Skipping - user not authenticated`, err);
      });

      // Return unsubscribe function
      return () => {
        if (callback._subscriptions) {
          callback._subscriptions.forEach(sub => sub.unsubscribe());
        }
      };
    },
  };
};

// Auth methods matching base44 API shape
const authMethods = {
  isAuthenticated: async () => {
    try {
      await getCurrentUser();
      return true;
    } catch {
      return false;
    }
  },

  me: async () => {
    try {
      const user = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      return {
        id: user.userId,
        username: user.username,
        email: attributes.email,
        full_name: attributes.name || attributes.email,
        email_verified: attributes.email_verified === 'true',
      };
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw error;
    }
  },

  logout: async (redirectUrl) => {
    try {
      await signOut();
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  redirectToLogin: (returnUrl) => {
    // This will be handled by the AuthContext showing a login modal
    // Store the return URL for post-login redirect
    if (returnUrl) {
      sessionStorage.setItem('amplify_return_url', returnUrl);
    }
    // Dispatch custom event to trigger login modal
    window.dispatchEvent(new CustomEvent('amplify:showLogin'));
  },
};

// Helper to convert base64 data URL to a Blob
const dataURLtoBlob = (dataURL) => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

// Integration methods (Core features)
const integrations = {
  Core: {
    UploadFile: async ({ file }) => {
      try {
        const filename = `images/${Date.now()}-${file.name}`;
        const result = await uploadData({
          path: filename,
          data: file,
          options: {
            contentType: file.type,
          },
        }).result;

        // Get the URL for the uploaded file
        const { url } = await getUrl({ path: result.path });
        return { file_url: url.toString() };
      } catch (error) {
        console.error('Upload error:', error);
        throw error;
      }
    },

    // AI integrations via Lambda + Gemini API (Nano Banana)
    GenerateImage: async (params) => {
      try {
        console.log('GenerateImage: Starting...');

        // Refresh signed URLs before sending to Lambda
        let imageUrls = params.existing_image_urls || [];
        if (imageUrls.length > 0) {
          imageUrls = await Promise.all(imageUrls.map(url => getSignedUrl(url)));
          console.log('GenerateImage: Refreshed', imageUrls.length, 'signed URLs');
        }

        const result = await invokeAIFunction('generateImage', {
          prompt: params.prompt,
          existing_image_urls: imageUrls,
        });
        console.log('GenerateImage: Lambda returned, url length:', result?.url?.length || 0);

        // If we got a data URL, upload it to S3 first
        if (result && result.url && result.url.startsWith('data:')) {
          console.log('GenerateImage: Converting data URL to blob...');
          const blob = dataURLtoBlob(result.url);
          console.log('GenerateImage: Blob size:', blob.size);
          const filename = `images/generated/${Date.now()}-${Math.random().toString(36).substring(7)}.png`;

          console.log('GenerateImage: Uploading to S3...');
          const uploadResult = await uploadData({
            path: filename,
            data: blob,
            options: {
              contentType: blob.type,
            },
          }).result;
          console.log('GenerateImage: S3 upload done, path:', uploadResult.path);

          // Get the URL for the uploaded file
          const { url } = await getUrl({ path: uploadResult.path });
          console.log('GenerateImage: Got S3 URL:', url.toString().substring(0, 100));
          return { url: url.toString(), status: 'completed' };
        }

        console.log('GenerateImage: No data URL, returning result as-is');
        return result || { url: '', status: 'failed' };
      } catch (error) {
        console.error('GenerateImage error:', error);
        throw error;
      }
    },

    InvokeLLM: async (params) => {
      try {
        // Refresh signed URLs before sending to Lambda
        let fileUrls = params.file_urls || [];
        if (fileUrls.length > 0) {
          fileUrls = await Promise.all(fileUrls.map(url => getSignedUrl(url)));
        }

        const result = await invokeAIFunction('invokeLLM', {
          prompt: params.prompt,
          file_urls: fileUrls,
          response_json_schema: params.response_json_schema || null,
        });
        return result || { response: '' };
      } catch (error) {
        console.error('InvokeLLM error:', error);
        throw error;
      }
    },
  },
};

// Activity logging via ActivityLog entity
const appLogs = {
  logUserInApp: async (pageName) => {
    try {
      const client = getClient();
      const activityLog = client.models.ActivityLog;
      if (activityLog) {
        await activityLog.create({
          action: 'page_view',
          page_name: pageName,
          metadata: {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
          },
        });
      }
      return { success: true };
    } catch (error) {
      // Don't throw on logging errors, just warn
      console.warn('Activity log error:', error);
      return { success: false, error: error.message };
    }
  },
};

// Main export - matches base44 API shape
export const base44 = {
  auth: authMethods,
  entities: {
    GeneratedImage: createEntityAPI('GeneratedImage'),
    Garment: createEntityAPI('Garment'),
    Model: createEntityAPI('Model'),
    Collection: createEntityAPI('Collection'),
    BatchJob: createEntityAPI('BatchJob'),
    Subscription: createEntityAPI('UserSubscription'),  // Renamed: 'Subscription' is reserved in GraphQL
    UserSubscription: createEntityAPI('UserSubscription'),
    Template: createEntityAPI('Template'),
    BrandSeed: createEntityAPI('BrandSeed'),
    CustomModel: createEntityAPI('CustomModel'),
    ActivityLog: createEntityAPI('ActivityLog'),
  },
  integrations,
  appLogs,
};

// Also export individual parts for direct access
export const amplify = {
  getClient,
  auth: authMethods,
  storage: { uploadData, getUrl },
};

export default amplify;
