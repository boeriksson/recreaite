# Post-Migration TODO: Make Fields Required

After running the data migration in production (`/admin/data-migration`), update these fields to `.required()`:

## Fields to change

| File | Field | Current | Change to |
|------|-------|---------|-----------|
| `amplify/data/models/GeneratedImage.ts` | `customer_id` | `a.string()` | `a.string().required()` |
| `amplify/data/models/Garment.ts` | `customer_id` | `a.string()` | `a.string().required()` |
| `amplify/data/models/Garment.ts` | `name` | `a.string()` | `a.string().required()` |
| `amplify/data/models/Model.ts` | `customer_id` | `a.string()` | `a.string().required()` |
| `amplify/data/models/Model.ts` | `name` | `a.string()` | `a.string().required()` |
| `amplify/data/models/Collection.ts` | `customer_id` | `a.string()` | `a.string().required()` |
| `amplify/data/models/BatchJob.ts` | `customer_id` | `a.string()` | `a.string().required()` |
| `amplify/data/models/Template.ts` | `customer_id` | `a.string()` | `a.string().required()` |
| `amplify/data/models/BrandSeed.ts` | `customer_id` | `a.string()` | `a.string().required()` |
| `amplify/data/models/CustomModel.ts` | `customer_id` | `a.string()` | `a.string().required()` |
| `amplify/data/models/ActivityLog.ts` | `customer_id` | `a.string()` | `a.string().required()` |

## Steps

1. Deploy current code to production
2. Login as first user (becomes super admin)
3. Navigate to `/admin/data-migration`
4. Click "Run Migration" to backfill `customer_id` on all records
5. Verify all records show "X OK" with 0 needing update
6. Update the fields above to `.required()`
7. Deploy again

## Notes

- The `customer_id` field is already enforced in code via `amplifyClient.js`
- Making it `.required()` in schema adds GraphQL-level validation
- This is a non-breaking change once all records have `customer_id`
