import { a } from '@aws-amplify/backend';

/**
 * ActivityLog - User activity tracking
 * Records user actions and page views for analytics
 * and debugging purposes.
 */
export const ActivityLog = a.model({
  customer_id: a.string().required(),  // FK to Customer
  action: a.string().required(),
  page_name: a.string(),
  metadata: a.json(),
}).authorization((allow) => [
  allow.owner(),
  allow.authenticated(),
]);
