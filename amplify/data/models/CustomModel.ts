import { a } from '@aws-amplify/backend';

/**
 * CustomModel - User-trained custom AI models
 * Allows users to train custom models for specific poses,
 * styles, or compositions using their own reference images.
 */
export const CustomModel = a.model({
  customer_id: a.string(),  // FK to Customer - optional until migration complete (see MIGRATION_TODO.md)
  name: a.string().required(),
  description: a.string(),
  type: a.enum(['pose', 'style', 'composition']),
  training_prompt: a.string(),
  training_images: a.string().array(),
  status: a.enum(['uploading', 'training', 'ready', 'failed']),
  model_id: a.string(),
}).authorization((allow) => [
  allow.owner(),
  allow.authenticated(),
]);
