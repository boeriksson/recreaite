import { a } from '@aws-amplify/backend';

/**
 * SystemSettings - Global system configuration
 * Stores system-wide settings that only super admins can modify.
 * Uses a singleton pattern - there should only be one record with key="global".
 */
export const SystemSettings = a.model({
  key: a.string().required(),           // "global" for the main settings record

  // Currency settings
  usd_to_sek_rate: a.float().default(10.50),

  // Storage pricing (USD per GB per month)
  s3_price_per_gb: a.float().default(0.023),

  // DynamoDB pricing (USD per write request unit - on-demand)
  dynamodb_price_per_write: a.float().default(0.00000125),  // $1.25 per million

  // Future settings can be added here
  // e.g., default_plan, max_users_per_customer, etc.

  metadata: a.json(),                   // For any additional settings
}).authorization((allow) => [
  allow.authenticated().to(['read']),   // Anyone can read settings
  // Only super admins can update (enforced in code)
]);
