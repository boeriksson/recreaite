import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // Data models - authenticated users have full CRUD, guests can only read public data
  GeneratedImage: a.model({
    status: a.enum(['pending', 'processing', 'completed', 'failed']),
    image_url: a.string(),
    garment_id: a.string(),
    model_id: a.string(),
    model_type: a.string(),
    prompt_used: a.string(),
    garment_urls: a.string().array(),
    ai_analysis: a.json(),
    created_date: a.datetime(),
    // New fields for collections and tagging
    collection_id: a.string(),
    tags: a.string().array(),
    ai_categories: a.string().array(),
    ai_tags: a.string().array(),
  }).authorization((allow) => [
    allow.owner(),
    allow.authenticated(),
    allow.guest().to(['read']),
  ]),

  Garment: a.model({
    name: a.string().required(),
    image_url: a.string(),
    category: a.enum(['tops', 'bottoms', 'dresses', 'outerwear', 'accessories']),
    brand: a.string(),
    sku: a.string(),
    description: a.string(),
    // New fields for AI analysis
    ai_description: a.string(),
    original_image_url: a.string(),
  }).authorization((allow) => [
    allow.owner(),
    allow.authenticated(),
    allow.guest().to(['read']),
  ]),

  // New: Collection for organizing images
  Collection: a.model({
    name: a.string().required(),
    description: a.string(),
    color: a.string(),
    image_count: a.integer().default(0),
  }).authorization((allow) => [
    allow.owner(),
    allow.authenticated(),
    allow.guest().to(['read']),
  ]),

  // New: BatchJob for batch processing
  BatchJob: a.model({
    name: a.string().required(),
    status: a.enum(['pending', 'processing', 'completed', 'failed', 'paused']),
    garment_ids: a.string().array(),
    configuration: a.json(),
    scheduled_for: a.datetime(),
    total_items: a.integer().default(0),
    processed_items: a.integer().default(0),
    successful_items: a.integer().default(0),
    failed_items: a.integer().default(0),
    failed_garment_ids: a.string().array(),
    error_log: a.json(),
    priority: a.integer().default(5),
    started_at: a.datetime(),
    completed_at: a.datetime(),
  }).authorization((allow) => [
    allow.owner(),
    allow.authenticated(),
  ]),

  Model: a.model({
    name: a.string().required(),
    portrait_url: a.string(),
    image_url: a.string(),
    gender: a.enum(['female', 'male', 'neutral']),
    age: a.integer(),
    ethnicity: a.enum(['caucasian', 'african', 'asian', 'hispanic', 'middle_eastern', 'mixed']),
    body_type: a.enum(['slim', 'athletic', 'average', 'curvy', 'plus']),
    hair_style: a.string(),
    hair_color: a.string(),
    skin_tone: a.string(),
    height: a.integer(),
    prompt: a.string(),
  }).authorization((allow) => [
    allow.owner(),
    allow.authenticated(),
    allow.guest().to(['read']),
  ]),

  UserSubscription: a.model({
    plan: a.enum(['free', 'basic', 'pro', 'enterprise']),
    images_generated: a.integer().default(0),
    images_limit: a.integer().default(10),
    period_start: a.datetime(),
    period_end: a.datetime(),
  }).authorization((allow) => [
    allow.owner(),
    allow.authenticated(),
  ]),

  Template: a.model({
    name: a.string().required(),
    description: a.string(),
    category: a.enum(['campaign', 'product_category', 'seasonal', 'brand_style', 'custom']),
    thumbnail_url: a.string(),
    configuration: a.json().required(),
    usage_count: a.integer().default(0),
    last_used: a.datetime(),
  }).authorization((allow) => [
    allow.owner(),
    allow.authenticated(),
    allow.guest().to(['read']),
  ]),

  BrandSeed: a.model({
    name: a.string().required(),
    domain: a.string(),
    brand_style: a.string(),
    overall_style_summary: a.string(),
    character: a.enum(['luxury', 'minimalist', 'urban', 'sporty', 'bohemian', 'classic', 'edgy', 'casual']),
    typical_gender: a.enum(['female', 'male', 'neutral']),
    environment: a.enum(['studio', 'urban_street', 'minimalist_interior', 'nature', 'cafe', 'rooftop', 'beach', 'industrial', 'ugc']),
    typography: a.string(),
    image_style: a.string(),
    visual_analysis: a.string(),
    color_palette: a.string(),
    photography_style: a.string(),
  }).authorization((allow) => [
    allow.owner(),
    allow.authenticated(),
    allow.guest().to(['read']),
  ]),

  CustomModel: a.model({
    name: a.string().required(),
    description: a.string(),
    type: a.enum(['pose', 'style', 'composition']),
    training_prompt: a.string(),
    training_images: a.string().array(),
    status: a.enum(['uploading', 'training', 'ready', 'failed']),
    model_id: a.string(),
  }).authorization((allow) => [
    allow.owner(),
    allow.authenticated(),
  ]),

  ActivityLog: a.model({
    action: a.string().required(),
    page_name: a.string(),
    metadata: a.json(),
  }).authorization((allow) => [
    allow.owner(),
    allow.authenticated(),
  ]),
});

export type Schema = ClientSchema<typeof schema>;
export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',  // Authenticated users use Cognito User Pool
    apiKeyAuthorizationMode: { expiresInDays: 30 },  // Backup for public data
  },
});
