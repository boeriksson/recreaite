import { a } from '@aws-amplify/backend';

/**
 * UsageCost - Tracks costs per action for billing
 * Records each billable action with its cost and the
 * customer/user who performed it.
 */
export const UsageCost = a.model({
  customer_id: a.string().required(),
  user_profile_id: a.string().required(),

  action: a.enum(['image_generation', 'llm_invocation', 'custom_model_training', 'storage_upload', 'site_scan', 'dynamodb_write']),
  cost_sek: a.float().required(),       // Cost in Swedish Kronor
  exchange_rate: a.float(),              // USD to SEK rate used at time of tracking
  credits_used: a.integer().default(1),

  resource_type: a.string(),
  resource_id: a.string(),
  metadata: a.json(),
}).authorization((allow) => [
  allow.owner(),
  allow.authenticated(),
]);
