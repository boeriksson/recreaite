# Multi-Tenant Architecture Plan

## Overview
Implement a Customer (brand) entity to enable multi-tenancy, where users belong to a customer and only see content within their customer scope.

## Status: IN PROGRESS (Saved to branch)

This branch contains Phase 1-2 implementation. Remaining phases documented below.

---

## New Entities Created

### 1. Customer (`amplify/data/models/Customer.ts`)
The paying brand/company - primary billing and isolation unit.

```typescript
Customer = a.model({
  name: a.string().required(),
  slug: a.string().required(),        // URL-safe unique identifier
  domain: a.string(),                 // e.g., "acme.com"
  logo_url: a.string(),

  // Subscription
  plan: a.enum(['free', 'starter', 'pro', 'enterprise']),
  plan_started_at: a.datetime(),
  plan_expires_at: a.datetime(),

  // Limits
  images_limit_monthly: a.integer().default(100),
  storage_limit_gb: a.integer().default(10),

  // Usage (reset monthly)
  images_generated_this_month: a.integer().default(0),
  usage_reset_date: a.datetime(),

  status: a.enum(['active', 'suspended', 'cancelled']),
});
```

### 2. UserProfile (`amplify/data/models/UserProfile.ts`)
Links Cognito users to customers with roles.

```typescript
UserProfile = a.model({
  cognito_sub: a.string().required(),  // Cognito user ID
  email: a.string().required(),
  display_name: a.string(),
  avatar_url: a.string(),

  customer_id: a.string().required(),  // FK to Customer

  // Super admin (cross-brand access)
  is_super_admin: a.boolean().default(false),

  // Brand-level role
  role: a.enum(['owner', 'admin', 'member', 'viewer']),
  permissions: a.json(),               // Fine-grained overrides

  status: a.enum(['active', 'invited', 'suspended']),
  invited_by: a.string(),
  joined_at: a.datetime(),
  last_active_at: a.datetime(),
});
```

### 3. UsageCost (`amplify/data/models/UsageCost.ts`)
Tracks costs per action for billing.

```typescript
UsageCost = a.model({
  customer_id: a.string().required(),
  user_profile_id: a.string().required(),

  action: a.enum(['image_generation', 'llm_invocation', 'custom_model_training', 'storage_upload', 'site_scan']),
  cost_usd: a.float().required(),
  credits_used: a.integer().default(1),

  resource_type: a.string(),
  resource_id: a.string(),
  metadata: a.json(),
});
```

### 4. InviteLink (`amplify/data/models/InviteLink.ts`)
Shareable signup links for brands.

```typescript
InviteLink = a.model({
  customer_id: a.string().required(),  // FK to Customer

  code: a.string().required(),         // Unique invite code
  role: a.enum(['admin', 'member', 'viewer']), // Role for new users

  created_by: a.string(),              // UserProfile ID
  expires_at: a.datetime(),
  max_uses: a.integer(),               // null = unlimited
  use_count: a.integer().default(0),

  status: a.enum(['active', 'expired', 'revoked']),
});
```

---

## Entities Modified

Added `customer_id: a.string().required()` to:
- GeneratedImage
- Garment
- Model
- Collection
- Template
- BrandSeed
- BatchJob
- CustomModel
- ActivityLog

**Removed:** UserSubscription (replaced by Customer.plan)

---

## Frontend Components Created

### CustomerContext (`src/lib/CustomerContext.jsx`)
- Loads customer + userProfile on auth
- Auto-creates Default customer on first user signup
- First user becomes super_admin + owner
- Subsequent users become members
- Provides permission helpers:
  - `hasPermission(permission)`
  - `canManageUsers()`
  - `canInviteUsers()`
  - `isOwner()`
  - `isAdmin()`
  - `isSuperAdmin()`
  - `canCreate()`
  - `canEdit(record)`
  - `canDelete(record)`

### Updated amplifyClient.js
- Added `setCustomerContext()` for setting current customer
- Auto-injects `customer_id` on create for customer-scoped models
- Auto-filters by `customer_id` on list/filter operations
- Added entity APIs for Customer, UserProfile, UsageCost, InviteLink

### Updated App.tsx
- Added CustomerProvider wrapper

### Updated Layout.jsx
- Now uses CustomerContext instead of old Subscription entity
- Displays customer plan/usage
- Plan upgrades update Customer entity

---

## Authorization Strategy

**Approach:** Add `customer_id` to all content entities + filter in code.

Why this approach:
- Amplify Gen 2 doesn't support dynamic Cognito groups well
- No Lambda authorizers needed for basic operations
- Easy to add cross-customer features later (marketplace, etc.)
- DynamoDB can use GSI on customer_id for efficient queries

---

## Role Permissions Matrix

| Action | Owner | Admin | Member | Viewer |
|--------|-------|-------|--------|--------|
| View content | Yes | Yes | Yes | Yes |
| Create/upload | Yes | Yes | Yes | No |
| Edit own content | Yes | Yes | Yes | No |
| Delete own content | Yes | Yes | Yes | No |
| Edit ANY content | Yes | Yes | No | No |
| Delete ANY content | Yes | Yes | No | No |
| Invite users | Yes | Yes | No | No |
| Manage users | Yes | Yes | No | No |
| View billing | Yes | No | No | No |
| Change plan | Yes | No | No | No |

---

## User Flows

### Normal Signup (Fresh Database)
1. User signs up with email/password
2. CustomerContext detects no customers exist
3. Creates "Default" Customer automatically
4. Creates UserProfile with `is_super_admin: true` and `role: 'owner'`
5. User is now super admin of Default brand

### Subsequent Signups
1. User signs up
2. CustomerContext finds existing Default customer
3. Creates UserProfile with `role: 'member'`
4. User can use app within Default brand scope

### Signup via Invite Link (Future)
1. Admin generates invite link for their brand
2. User clicks link → lands on signup with brand context
3. After signup, UserProfile links to that specific brand with specified role

---

## Remaining Work (Not Yet Implemented)

### Phase 3: Admin UI
- `src/pages/admin/Brands.jsx` - Super admin: manage all brands
- `src/pages/admin/TeamMembers.jsx` - Brand admin: manage users
- `src/pages/admin/InviteLinks.jsx` - Generate/manage invite links
- `src/pages/admin/CostDashboard.jsx` - Usage/cost tracking

### Phase 4: Invite System
- Update signup flow to handle invite codes from URL
- Create invite link generation UI
- Email invite functionality

### Phase 5: Enhanced Features
- Role-based UI elements (hide actions based on permissions)
- Cross-brand sharing (marketplace)
- Usage tracking and billing integration

---

## Utilities Created

### Secrets Backup/Restore Script (`scripts/secrets-backup-restore.sh`)
For backing up and restoring Amplify secrets when recreating sandbox.

```bash
./scripts/secrets-backup-restore.sh backup   # Before sandbox delete
./scripts/secrets-backup-restore.sh restore  # After sandbox recreate
```

---

## Fresh Start Deployment

To deploy with multi-tenant architecture:

```bash
# 1. Backup secrets
./scripts/secrets-backup-restore.sh backup

# 2. Delete and recreate sandbox
npx ampx sandbox delete
npx ampx sandbox

# 3. Restore secrets
./scripts/secrets-backup-restore.sh restore

# 4. Sign up - first user becomes super admin!
```

---

## Key Files Summary

### New Files
- `amplify/data/models/Customer.ts`
- `amplify/data/models/UserProfile.ts`
- `amplify/data/models/UsageCost.ts`
- `amplify/data/models/InviteLink.ts`
- `src/lib/CustomerContext.jsx`
- `scripts/secrets-backup-restore.sh`
- `docs/MULTI-TENANT-ARCHITECTURE.md` (this file)

### Modified Files
- `amplify/data/resource.ts`
- `amplify/data/models/index.ts`
- `amplify/data/models/*.ts` (added customer_id)
- `src/api/amplifyClient.js`
- `src/App.tsx`
- `src/Layout.jsx`
- `.gitignore`

### Deleted Files
- `amplify/data/models/UserSubscription.ts`
