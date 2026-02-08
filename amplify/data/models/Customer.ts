import { a } from '@aws-amplify/backend';

/**
 * Customer - Brand/company entity for multi-tenancy
 * The primary billing and isolation unit. All content
 * belongs to a customer and users see only their customer's content.
 */
export const Customer = a.model({
  name: a.string().required(),
  slug: a.string().required(),        // URL-safe unique identifier
  domain: a.string(),                 // e.g., "acme.com"
  logo_url: a.string(),

  // Subscription
  plan: a.enum(['free', 'starter', 'pro', 'enterprise']),
  plan_started_at: a.datetime(),
  plan_expires_at: a.datetime(),

  // Limits
  images_limit_monthly: a.integer().default(100),
  storage_limit_gb: a.integer().default(10),

  // Usage (reset monthly)
  images_generated_this_month: a.integer().default(0),
  usage_reset_date: a.datetime(),

  status: a.enum(['active', 'suspended', 'cancelled']),
}).authorization((allow) => [
  allow.owner(),
  allow.authenticated(),
]);
