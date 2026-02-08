import { a } from '@aws-amplify/backend';

/**
 * Collection - Organize generated images into groups
 * Allows users to create named collections with color coding
 * for organizing their generated fashion images.
 */
export const Collection = a.model({
  name: a.string().required(),
  description: a.string(),
  color: a.string(),
  image_count: a.integer().default(0),
}).authorization((allow) => [
  allow.owner(),
  allow.authenticated(),
  allow.guest().to(['read']),
]);
