import { a } from '@aws-amplify/backend';

/**
 * Template - Saved generation configurations
 * Allows users to save and reuse image generation settings
 * including model, environment, and prompt configurations.
 */
export const Template = a.model({
  customer_id: a.string().required(),  // FK to Customer
  name: a.string().required(),
  description: a.string(),
  category: a.enum(['campaign', 'product_category', 'seasonal', 'brand_style', 'custom']),
  thumbnail_url: a.string(),
  configuration: a.json().required(),
  usage_count: a.integer().default(0),
  last_used: a.datetime(),
}).authorization((allow) => [
  allow.owner(),
  allow.authenticated(),
  allow.guest().to(['read']),
]);
