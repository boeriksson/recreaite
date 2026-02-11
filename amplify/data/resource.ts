import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

// Import all models from separate files
// Multi-tenant entities
import { Customer } from './models/Customer';
import { UserProfile } from './models/UserProfile';
import { UsageCost } from './models/UsageCost';
import { InviteLink } from './models/InviteLink';
import { SystemSettings } from './models/SystemSettings';
// Content entities
import { GeneratedImage } from './models/GeneratedImage';
import { Garment } from './models/Garment';
import { Collection } from './models/Collection';
import { BatchJob } from './models/BatchJob';
import { Model } from './models/Model';
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
 *
 * Multi-tenancy:
 * - Customer: Brand/company entity - primary billing and isolation unit
 * - UserProfile: Links Cognito users to customers with roles
 * - All content entities have customer_id for tenant isolation
 */
const schema = a.schema({
  // Multi-tenant entities
  Customer,
  UserProfile,
  UsageCost,
  InviteLink,
  // System configuration
  SystemSettings,
  // Content entities
  GeneratedImage,
  Garment,
  Collection,
  BatchJob,
  Model,
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
