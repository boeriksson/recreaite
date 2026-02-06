import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // Data models
  // NOTE: Guest access enabled temporarily for testing - remove for production!
  GeneratedImage: a.model({
    status: a.enum(['pending', 'processing', 'completed', 'failed']),
    image_url: a.string(),
    garment_id: a.string(),
    model_id: a.string(),
    model_type: a.string(),  // Used by frontend code
    prompt_used: a.string(),
    garment_urls: a.string().array(),
    ai_analysis: a.json(),
    created_date: a.datetime(),
  }).authorization((allow) => [allow.owner(), allow.guest(), allow.authenticated().to(['read'])]),

  Garment: a.model({
    name: a.string().required(),
    image_url: a.string(),
    category: a.enum(['tops', 'bottoms', 'dresses', 'outerwear', 'accessories']),
    brand: a.string(),
    sku: a.string(),
    description: a.string(),
  }).authorization((allow) => [allow.owner(), allow.guest(), allow.authenticated().to(['read'])]),

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
  }).authorization((allow) => [allow.owner(), allow.guest(), allow.authenticated().to(['read'])]),

  UserSubscription: a.model({
    plan: a.enum(['free', 'basic', 'pro', 'enterprise']),
    images_generated: a.integer().default(0),
    images_limit: a.integer().default(10),
    period_start: a.datetime(),
    period_end: a.datetime(),
  }).authorization((allow) => [allow.owner(), allow.guest()]),

  Template: a.model({
    name: a.string().required(),
    description: a.string(),
    category: a.enum(['campaign', 'product_category', 'seasonal', 'brand_style', 'custom']),
    thumbnail_url: a.string(),
    configuration: a.json().required(),
    usage_count: a.integer().default(0),
    last_used: a.datetime(),
  }).authorization((allow) => [allow.owner(), allow.guest(), allow.authenticated().to(['read'])]),

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
  }).authorization((allow) => [allow.owner(), allow.guest(), allow.authenticated().to(['read'])]),

  CustomModel: a.model({
    name: a.string().required(),
    description: a.string(),
    type: a.enum(['pose', 'style', 'composition']),
    training_prompt: a.string(),
    training_images: a.string().array(),
    status: a.enum(['uploading', 'training', 'ready', 'failed']),
    model_id: a.string(),
  }).authorization((allow) => [allow.owner(), allow.guest()]),

  ActivityLog: a.model({
    action: a.string().required(),
    page_name: a.string(),
    metadata: a.json(),
  }).authorization((allow) => [allow.owner(), allow.guest()]),
});

export type Schema = ClientSchema<typeof schema>;
export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'identityPool',  // Allow IAM-based auth (includes guest)
    apiKeyAuthorizationMode: { expiresInDays: 30 },  // Backup API key auth
  },
});
