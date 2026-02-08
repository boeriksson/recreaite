import { a } from '@aws-amplify/backend';

/**
 * BrandSeed - Brand style analysis from websites
 * Stores extracted brand characteristics from website scanning,
 * including visual style, color palette, and photography preferences.
 */
export const BrandSeed = a.model({
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
  recommendations: a.string(),
  strengths: a.string(),
  weaknesses: a.string(),
}).authorization((allow) => [
  allow.owner(),
  allow.authenticated(),
  allow.guest().to(['read']),
]);
