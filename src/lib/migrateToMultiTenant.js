/**
 * Migration Script: Backfill customer_id on existing records
 *
 * This script:
 * 1. Creates a "Default" Customer if it doesn't exist
 * 2. Creates UserProfiles for existing Cognito users
 * 3. Backfills customer_id on all existing content records
 *
 * Run this once after deploying the multi-tenant schema.
 */

import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';

// Models that need customer_id backfilled
const CONTENT_MODELS = [
  'GeneratedImage',
  'Garment',
  'Model',
  'Collection',
  'BatchJob',
  'Template',
  'BrandSeed',
  'CustomModel',
  'ActivityLog',
];

/**
 * Run the migration
 * @returns {Object} Migration results with counts
 */
export async function runMigration() {
  const client = generateClient({ authMode: 'userPool' });
  const results = {
    customer: null,
    userProfile: null,
    backfilled: {},
    errors: [],
  };

  try {
    // Step 1: Get or create Default Customer
    console.log('Step 1: Checking for Default customer...');
    const { data: customers } = await client.models.Customer.list();

    let defaultCustomer = customers?.find(c => c.slug === 'default');

    if (!defaultCustomer) {
      console.log('Creating Default customer...');
      const { data: newCustomer, errors } = await client.models.Customer.create({
        name: 'Default',
        slug: 'default',
        plan: 'free',
        plan_started_at: new Date().toISOString(),
        images_limit_monthly: 100,
        storage_limit_gb: 10,
        images_generated_this_month: 0,
        usage_reset_date: new Date().toISOString(),
        status: 'active',
      });

      if (errors) {
        throw new Error(`Failed to create Default customer: ${errors[0]?.message}`);
      }

      defaultCustomer = newCustomer;
      results.customer = { created: true, id: defaultCustomer.id };
      console.log('Default customer created:', defaultCustomer.id);
    } else {
      results.customer = { created: false, id: defaultCustomer.id };
      console.log('Default customer exists:', defaultCustomer.id);
    }

    // Step 2: Check/create UserProfile for current user
    console.log('Step 2: Checking UserProfile for current user...');
    const currentUser = await getCurrentUser();

    const { data: profiles } = await client.models.UserProfile.list({
      filter: { cognito_sub: { eq: currentUser.userId } }
    });

    let userProfile = profiles?.[0];

    if (!userProfile) {
      console.log('Creating UserProfile for current user...');

      // Check if this is the first user (make them super admin)
      const { data: allProfiles } = await client.models.UserProfile.list();
      const isFirstUser = !allProfiles || allProfiles.length === 0;

      const { data: newProfile, errors } = await client.models.UserProfile.create({
        cognito_sub: currentUser.userId,
        email: currentUser.signInDetails?.loginId || 'unknown@example.com',
        display_name: currentUser.username,
        customer_id: defaultCustomer.id,
        is_super_admin: isFirstUser,
        role: isFirstUser ? 'owner' : 'member',
        status: 'active',
        joined_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
      });

      if (errors) {
        throw new Error(`Failed to create UserProfile: ${errors[0]?.message}`);
      }

      userProfile = newProfile;
      results.userProfile = { created: true, id: userProfile.id, isFirstUser };
      console.log('UserProfile created:', userProfile.id, isFirstUser ? '(super admin)' : '(member)');
    } else {
      results.userProfile = { created: false, id: userProfile.id };
      console.log('UserProfile exists:', userProfile.id);
    }

    // Step 3: Backfill customer_id on all content models
    console.log('Step 3: Backfilling customer_id on existing records...');

    for (const modelName of CONTENT_MODELS) {
      const model = client.models[modelName];
      if (!model) {
        console.warn(`Model ${modelName} not found, skipping...`);
        continue;
      }

      try {
        // List all records (no filter to get records without customer_id)
        const { data: records, errors: listErrors } = await model.list();

        if (listErrors) {
          results.errors.push({ model: modelName, error: listErrors[0]?.message });
          continue;
        }

        // Find records missing customer_id
        const needsUpdate = records?.filter(r => !r.customer_id) || [];
        results.backfilled[modelName] = { total: records?.length || 0, updated: 0 };

        if (needsUpdate.length === 0) {
          console.log(`${modelName}: All ${records?.length || 0} records have customer_id`);
          continue;
        }

        console.log(`${modelName}: Updating ${needsUpdate.length} of ${records?.length} records...`);

        // Update each record
        for (const record of needsUpdate) {
          try {
            await model.update({
              id: record.id,
              customer_id: defaultCustomer.id,
            });
            results.backfilled[modelName].updated++;
          } catch (updateError) {
            results.errors.push({
              model: modelName,
              id: record.id,
              error: updateError.message
            });
          }
        }

        console.log(`${modelName}: Updated ${results.backfilled[modelName].updated} records`);
      } catch (modelError) {
        results.errors.push({ model: modelName, error: modelError.message });
      }
    }

    console.log('Migration complete!', results);
    return results;

  } catch (error) {
    console.error('Migration failed:', error);
    results.errors.push({ general: error.message });
    return results;
  }
}

/**
 * Check migration status without making changes
 */
export async function checkMigrationStatus() {
  const client = generateClient({ authMode: 'userPool' });
  const status = {
    hasDefaultCustomer: false,
    customerId: null,
    currentUserHasProfile: false,
    recordsNeedingMigration: {},
  };

  try {
    // Check for Default customer
    const { data: customers } = await client.models.Customer.list();
    const defaultCustomer = customers?.find(c => c.slug === 'default');
    status.hasDefaultCustomer = !!defaultCustomer;
    status.customerId = defaultCustomer?.id;

    // Check for current user's profile
    const currentUser = await getCurrentUser();
    const { data: profiles } = await client.models.UserProfile.list({
      filter: { cognito_sub: { eq: currentUser.userId } }
    });
    status.currentUserHasProfile = profiles?.length > 0;

    // Check each model for records without customer_id
    for (const modelName of CONTENT_MODELS) {
      const model = client.models[modelName];
      if (!model) {
        status.recordsNeedingMigration[modelName] = { error: 'Model not found in schema' };
        continue;
      }

      try {
        const { data: records, errors } = await model.list();
        if (errors && errors.length > 0) {
          console.error(`${modelName} list errors:`, errors);
          status.recordsNeedingMigration[modelName] = {
            error: errors[0]?.message || 'Unknown error'
          };
          continue;
        }
        const needsUpdate = records?.filter(r => !r.customer_id) || [];
        status.recordsNeedingMigration[modelName] = {
          total: records?.length || 0,
          needsUpdate: needsUpdate.length,
        };
      } catch (e) {
        console.error(`${modelName} exception:`, e);
        status.recordsNeedingMigration[modelName] = { error: e.message };
      }
    }

    return status;
  } catch (error) {
    console.error('Status check failed:', error);
    return { error: error.message };
  }
}
