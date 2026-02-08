import { a } from '@aws-amplify/backend';

/**
 * UserProfile - Links Cognito users to customers with roles
 * Each Cognito user has one UserProfile that determines their
 * customer membership and permissions within that customer.
 */
export const UserProfile = a.model({
  cognito_sub: a.string().required(),  // Cognito user ID
  email: a.string().required(),
  display_name: a.string(),
  avatar_url: a.string(),

  customer_id: a.string().required(),  // FK to Customer

  // Super admin (cross-brand access)
  is_super_admin: a.boolean().default(false),

  // Brand-level role
  role: a.enum(['owner', 'admin', 'member', 'viewer']),
  permissions: a.json(),               // Fine-grained overrides

  status: a.enum(['active', 'invited', 'suspended']),
  invited_by: a.string(),
  joined_at: a.datetime(),
  last_active_at: a.datetime(),
}).authorization((allow) => [
  allow.owner(),
  allow.authenticated(),
]);
