import { a } from '@aws-amplify/backend';

/**
 * Garment - Uploaded clothing items
 * Stores user-uploaded garment images with categorization,
 * brand info, and AI-generated descriptions.
 */
export const Garment = a.model({
  customer_id: a.string().required(),  // FK to Customer
  name: a.string().required(),
  image_url: a.string(),
  category: a.enum(['tops', 'bottoms', 'dresses', 'outerwear', 'accessories']),
  brand: a.string(),
  sku: a.string(),
  description: a.string(),
  // AI analysis fields
  ai_description: a.string(),
  original_image_url: a.string(),
  // Enhanced AI analysis fields
  color: a.string(),
  material: a.string(),
  style: a.string(),
  colors: a.json(),           // Array of colors
  materials: a.json(),        // Array of materials
  style_details: a.json(),    // Style details object
  subcategory: a.string(),    // Specific garment type (e.g., hoodie, blazer)
  suggested_gender: a.string(), // Suggested model gender
  fit: a.string(),            // Fit description
  complementary_items: a.json(), // Array of complementary items
}).authorization((allow) => [
  allow.owner(),
  allow.authenticated(),
  allow.guest().to(['read']),
]);
