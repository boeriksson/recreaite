import { defineBackend } from '@aws-amplify/backend';
import { storage } from './storage/resource';

/**
 * Define the backend for your Amplify app
 */
const backend = defineBackend({
  storage,
});
