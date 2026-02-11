import { a } from '@aws-amplify/backend';

/**
 * GeneratedImage - AI-generated fashion images
 * Stores the output from AI image generation with metadata,
 * collection organization, and tagging support.
 */
export const GeneratedImage = a.model({
  customer_id: a.string(),  // FK to Customer - optional until migration complete (see MIGRATION_TODO.md)
  status: a.enum(['pending', 'processing', 'completed', 'failed']),
  error_message: a.string(),            // User-friendly error message if failed
  image_url: a.string(),
  garment_id: a.string(),
  model_id: a.string(),
  model_type: a.string(),
  prompt_used: a.string(),
  garment_urls: a.string().array(),
  ai_analysis: a.json(),
  created_date: a.datetime(),
  // Collection and tagging
  collection_id: a.string(),
  tags: a.string().array(),
  ai_categories: a.string().array(),
  ai_tags: a.string().array(),
}).authorization((allow) => [
  allow.owner(),
  allow.authenticated(),
  allow.guest().to(['read']),
]);
