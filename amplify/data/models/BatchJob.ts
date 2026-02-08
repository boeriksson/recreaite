import { a } from '@aws-amplify/backend';

/**
 * BatchJob - Batch image generation processing
 * Manages queued batch jobs for generating multiple images,
 * with progress tracking, scheduling, and error handling.
 */
export const BatchJob = a.model({
  name: a.string().required(),
  status: a.enum(['pending', 'processing', 'completed', 'failed', 'paused']),
  garment_ids: a.string().array(),
  configuration: a.json(),
  scheduled_for: a.datetime(),
  // Progress tracking
  total_items: a.integer().default(0),
  processed_items: a.integer().default(0),
  successful_items: a.integer().default(0),
  failed_items: a.integer().default(0),
  failed_garment_ids: a.string().array(),
  error_log: a.json(),
  // Scheduling
  priority: a.integer().default(5),
  started_at: a.datetime(),
  completed_at: a.datetime(),
}).authorization((allow) => [
  allow.owner(),
  allow.authenticated(),
]);
