import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

// Import all models from separate files
import { GeneratedImage } from './models/GeneratedImage';
import { Garment } from './models/Garment';
import { Collection } from './models/Collection';
import { BatchJob } from './models/BatchJob';
import { Model } from './models/Model';
import { UserSubscription } from './models/UserSubscription';
import { Template } from './models/Template';
import { BrandSeed } from './models/BrandSeed';
import { CustomModel } from './models/CustomModel';
import { ActivityLog } from './models/ActivityLog';

/**
 * Amplify Data Schema
 *
 * Combines all model definitions into a single schema.
 * Each model is defined in its own file under ./models/
 * for better organization and maintainability.
 *
 * Authorization modes:
 * - owner: Full CRUD for the record creator
 * - authenticated: Access for logged-in users
 * - guest: Read-only access for public data
 */
const schema = a.schema({
  GeneratedImage,
  Garment,
  Collection,
  BatchJob,
  Model,
  UserSubscription,
  Template,
  BrandSeed,
  CustomModel,
  ActivityLog,
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: { expiresInDays: 30 },
  },
});
