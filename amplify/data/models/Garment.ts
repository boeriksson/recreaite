import { a } from '@aws-amplify/backend';

/**
 * Garment - Uploaded clothing items
 * Stores user-uploaded garment images with categorization,
 * brand info, and AI-generated descriptions.
 */
export const Garment = a.model({
  customer_id: a.string(),  // FK to Customer - optional until migration complete (see MIGRATION_TODO.md)
  name: a.string(),  // Optional until migration complete (see MIGRATION_TODO.md)
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
  // Customer-specific custom field values (JSON object keyed by field ID)
  custom_field_values: a.json(),
}).authorization((allow) => [
  allow.owner(),
  allow.authenticated(),
  allow.guest().to(['read']),
]);
