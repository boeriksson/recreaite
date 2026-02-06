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

        for (const url of request.existing_image_urls) {
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

      // Use Gemini 3 Pro Image model (Nano Banana Pro) for high-quality image generation
      const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: contents,
        config: {
          responseModalities: ['Text', 'Image'],
          imageConfig: {
            imageSize: '1K',
          },
        },
      }));

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
        // If no image was generated, return the text response for debugging
        const errorMsg = textResponse || response.text || 'No image generated - check model capabilities';
        console.error('No image in response. Text response:', errorMsg);
        throw new Error(`Image generation failed: ${errorMsg}`);
      }

      return { url: imageUrl, status: 'completed' };

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

      // Try to parse as JSON if schema was provided
      if (jsonSchema) {
        try {
          // Extract JSON from response (handle markdown code blocks)
          let jsonStr = text;
          const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
          }
          return JSON.parse(jsonStr);
        } catch {
          // Return raw text if JSON parsing fails
          return { response: text };
        }
      }

      return { response: text };

    } else {
      throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('AI Handler Error:', error);
    throw error;
  }
};
