import { GoogleGenAI } from '@google/genai';

// Helper to retry with exponential backoff on rate limit errors
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelayMs = 2000
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const isRateLimit = error?.message?.includes('429') ||
                          error?.message?.includes('RESOURCE_EXHAUSTED') ||
                          error?.status === 429;

      if (isRateLimit && attempt < maxRetries) {
        const delay = initialDelayMs * Math.pow(2, attempt);
        console.log(`Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw lastError;
}

// Helper to fetch image as base64
async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string }> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch image: HTTP ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg';

  // Check if we got an actual image, not an error page
  if (contentType.includes('xml') || contentType.includes('html') || contentType.includes('text')) {
    throw new Error(`Invalid image response: got ${contentType} instead of image`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  return { data: base64, mimeType: contentType };
}

interface GenerateImageArgs {
  prompt: string;
  existing_image_urls?: string[];
}

interface InvokeLLMArgs {
  prompt: string;
  file_urls?: string[];
  response_json_schema?: string | object;
}

interface LambdaEvent {
  action: 'generateImage' | 'invokeLLM';
  arguments: GenerateImageArgs | InvokeLLMArgs;
}

export const handler = async (event: LambdaEvent): Promise<unknown> => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const ai = new GoogleGenAI({ apiKey });
    const { action, arguments: args } = event;

    console.log('Action:', action);

    if (action === 'generateImage') {
      const request = args as GenerateImageArgs;
      console.log('Image generation prompt:', request.prompt?.substring(0, 200) + '...');
      console.log('Reference images:', request.existing_image_urls?.length || 0);

      // Build the prompt with reference images if provided
      let contents: any[] = [request.prompt];

      // Add reference images if provided
      if (request.existing_image_urls && request.existing_image_urls.length > 0) {
        const parts: any[] = [{ text: request.prompt }];

        for (let i = 0; i < request.existing_image_urls.length; i++) {
          const url = request.existing_image_urls[i];
          if (!url) continue;
          try {
            // Add a label before each image to help the model understand the purpose
            if (i === 0) {
              parts.push({ text: '\n\n[REFERENCE IMAGE 1 - MODEL FACE: The person in this image is the EXACT model to use. Copy this face EXACTLY - same eyes, nose, mouth, skin tone, hair color, hair style. This is the PRIMARY identity reference.]' });
            } else {
              parts.push({ text: `\n\n[REFERENCE IMAGE ${i + 1} - GARMENT: This is a clothing item to put on the model. Reproduce this garment exactly as shown.]` });
            }

            const imageData = await fetchImageAsBase64(url);
            parts.push({
              inlineData: {
                mimeType: imageData.mimeType,
                data: imageData.data,
              },
            });
          } catch (err) {
            console.warn(`Failed to fetch image: ${url}`, err);
          }
        }
        contents = parts;
      }

      // Try Nano Banana Pro first, fall back to Flash if it fails
      console.log('Contents type:', typeof contents, 'is array:', Array.isArray(contents));
      if (Array.isArray(contents)) {
        console.log('Contents parts:', contents.length, 'has images:', contents.some((p: any) => p.inlineData));
      }

      let response;
      const models = ['gemini-3-pro-image-preview', 'gemini-2.5-flash-image'];

      for (const modelName of models) {
        try {
          console.log(`Trying model: ${modelName}`);

          // Build config based on model capabilities
          // Gemini 3 Pro Image supports 1K, 2K, 4K output
          // Gemini 2.5 Flash only supports default resolution
          const isPro = modelName.includes('pro');
          const config: any = {
            responseModalities: ['TEXT', 'IMAGE'],
          };

          if (isPro) {
            config.imageConfig = {
              imageSize: '2K', // 2048x2048 - good balance of quality and speed
            };
          }

          response = await withRetry(() => ai.models.generateContent({
            model: modelName,
            contents: contents,
            config,
          }), 1); // Only 1 retry per model before trying next

          // Check if we got an image
          if (response.candidates?.[0]?.content?.parts?.some((p: any) => p.inlineData?.data)) {
            console.log(`Success with model: ${modelName}`);
            break;
          } else {
            console.log(`Model ${modelName} returned no image, trying next...`);
          }
        } catch (modelError: any) {
          console.log(`Model ${modelName} failed: ${modelError.message}`);
          if (modelName === models[models.length - 1]) {
            throw modelError; // Re-throw if last model fails
          }
        }
      }

      console.log('Gemini raw response keys:', Object.keys(response || {}));

      // Log response summary (not full data to avoid huge logs)
      console.log('Gemini response received, candidates:', response.candidates?.length || 0);
      // Log prompt feedback if blocked
      if ((response as any).promptFeedback) {
        console.log('Prompt feedback:', JSON.stringify((response as any).promptFeedback));
      }

      // Extract generated image from response
      let imageUrl = '';
      let textResponse = '';

      if (response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        console.log('Candidate has content:', !!candidate.content, 'parts:', candidate.content?.parts?.length || 0);
        // Log finish reason and safety ratings if present
        if (candidate.finishReason) {
          console.log('Finish reason:', candidate.finishReason);
        }
        if (candidate.safetyRatings) {
          console.log('Safety ratings:', JSON.stringify(candidate.safetyRatings));
        }

        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            console.log('Part type:', part.text ? 'text' : part.inlineData ? 'inlineData' : 'unknown');
            // Log the actual inlineData structure to debug
            if (part.inlineData) {
              console.log('inlineData keys:', Object.keys(part.inlineData));
              console.log('inlineData.mimeType:', part.inlineData.mimeType);
              console.log('inlineData.data exists:', !!part.inlineData.data);
              console.log('inlineData.data length:', part.inlineData.data?.length || 0);
            }
            if (part.inlineData && part.inlineData.data) {
              const { mimeType, data } = part.inlineData;
              // Return as data URL - frontend will upload to S3
              imageUrl = `data:${mimeType || 'image/png'};base64,${data}`;
              break;
            }
            if (part.text) {
              textResponse += part.text;
            }
          }
        }
      } else {
        console.log('No candidates in response');
      }

      if (!imageUrl) {
        // Determine the failure reason
        let errorCode = 'GENERATION_FAILED';
        let errorMessage = 'Bildgenerering misslyckades';

        // Check for content moderation / safety issues
        const candidate = response.candidates?.[0];
        const finishReason = candidate?.finishReason;
        const promptFeedback = (response as any).promptFeedback;

        console.log('Analyzing failure - finishReason:', finishReason, 'promptFeedback:', JSON.stringify(promptFeedback));

        if (finishReason === 'SAFETY' || finishReason === 'BLOCKED') {
          errorCode = 'CONTENT_BLOCKED';
          errorMessage = 'Innehållet blockerades av säkerhetsskäl (t.ex. kända personer, varumärken)';
        } else if (promptFeedback?.blockReason) {
          errorCode = 'PROMPT_BLOCKED';
          errorMessage = `Prompten blockerades: ${promptFeedback.blockReason}`;
        } else if (textResponse.toLowerCase().includes('sorry') ||
                   textResponse.toLowerCase().includes('cannot') ||
                   textResponse.toLowerCase().includes("can't")) {
          errorCode = 'CONTENT_REFUSED';
          errorMessage = 'AI-modellen vägrade generera bilden (innehållet kan bryta mot riktlinjer)';
        } else if (!response.candidates || response.candidates.length === 0) {
          errorCode = 'NO_RESPONSE';
          errorMessage = 'Ingen respons från AI-modellen';
        }

        console.error(`Image generation failed [${errorCode}]:`, textResponse || 'No text response');

        // Return structured error instead of throwing
        return {
          url: '',
          status: 'failed',
          errorCode,
          errorMessage,
          debugInfo: textResponse || 'No additional info',
        };
      }

      // Extract usage metadata for cost tracking
      const usageMetadata = (response as any).usageMetadata || {};
      console.log('Usage metadata:', JSON.stringify(usageMetadata));

      return {
        url: imageUrl,
        status: 'completed',
        usage: {
          promptTokens: usageMetadata.promptTokenCount || 0,
          outputTokens: usageMetadata.candidatesTokenCount || 0,
          totalTokens: usageMetadata.totalTokenCount || 0,
          model: 'gemini-image',
        },
      };

    } else if (action === 'invokeLLM') {
      const request = args as InvokeLLMArgs;

      let promptText = request.prompt;

      // Parse JSON schema if provided
      let jsonSchema = null;
      if (request.response_json_schema) {
        try {
          jsonSchema = typeof request.response_json_schema === 'string'
            ? JSON.parse(request.response_json_schema)
            : request.response_json_schema;
        } catch {
          jsonSchema = null;
        }
      }

      // Add JSON schema instruction if provided
      if (jsonSchema) {
        promptText = `${request.prompt}\n\nRespond ONLY with valid JSON matching this schema:\n${JSON.stringify(jsonSchema, null, 2)}`;
      }

      // Build contents with images if provided
      let contents: any = promptText;

      if (request.file_urls && request.file_urls.length > 0) {
        const parts: any[] = [{ text: promptText }];

        for (const url of request.file_urls) {
          if (!url) continue;
          try {
            const imageData = await fetchImageAsBase64(url);
            parts.push({
              inlineData: {
                mimeType: imageData.mimeType,
                data: imageData.data,
              },
            });
          } catch (err) {
            console.warn(`Failed to fetch image: ${url}`, err);
          }
        }
        contents = parts;
      }

      // Use Gemini 2.0 Flash for text/vision
      const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: contents,
      }));

      const text = response.text || '';

      // Extract usage metadata for cost tracking
      const usageMetadata = (response as any).usageMetadata || {};
      console.log('Usage metadata:', JSON.stringify(usageMetadata));

      const usage = {
        promptTokens: usageMetadata.promptTokenCount || 0,
        outputTokens: usageMetadata.candidatesTokenCount || 0,
        totalTokens: usageMetadata.totalTokenCount || 0,
        model: 'gemini-2.0-flash',
      };

      // Try to parse as JSON if schema was provided
      if (jsonSchema) {
        try {
          // Extract JSON from response (handle markdown code blocks)
          let jsonStr = text;
          const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
          }
          const parsed = JSON.parse(jsonStr);
          return { ...parsed, usage };
        } catch {
          // Return raw text if JSON parsing fails
          return { response: text, usage };
        }
      }

      return { response: text, usage };

    } else {
      throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('AI Handler Error:', error);
    throw error;
  }
};
