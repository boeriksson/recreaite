import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { storage } from './storage/resource';

/**
 * Define the backend for your Amplify app
 */
const backend = defineBackend({
  auth,
  storage,
});
