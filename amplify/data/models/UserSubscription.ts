import { a } from '@aws-amplify/backend';

/**
 * UserSubscription - User plan and usage tracking
 * Tracks subscription tier, image generation limits,
 * and billing period for each user.
 */
export const UserSubscription = a.model({
  plan: a.enum(['free', 'basic', 'pro', 'enterprise']),
  images_generated: a.integer().default(0),
  images_limit: a.integer().default(10),
  period_start: a.datetime(),
  period_end: a.datetime(),
}).authorization((allow) => [
  allow.owner(),
  allow.authenticated(),
]);
