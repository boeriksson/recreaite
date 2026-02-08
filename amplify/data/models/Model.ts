import { a } from '@aws-amplify/backend';

/**
 * Model - AI model personas for image generation
 * Defines the characteristics of virtual models used
 * in fashion image generation (appearance, body type, etc.)
 */
export const Model = a.model({
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
]);
