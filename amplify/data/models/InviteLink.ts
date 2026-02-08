import { a } from '@aws-amplify/backend';

/**
 * InviteLink - Shareable signup links for brands
 * Allows brand admins to generate invite links that
 * automatically assign new users to their brand.
 */
export const InviteLink = a.model({
  customer_id: a.string().required(),  // FK to Customer

  code: a.string().required(),         // Unique invite code
  role: a.enum(['admin', 'member', 'viewer']), // Role for new users

  created_by: a.string(),              // UserProfile ID
  expires_at: a.datetime(),
  max_uses: a.integer(),               // null = unlimited
  use_count: a.integer().default(0),

  status: a.enum(['active', 'expired', 'revoked']),
}).authorization((allow) => [
  allow.owner(),
  allow.authenticated(),
]);
