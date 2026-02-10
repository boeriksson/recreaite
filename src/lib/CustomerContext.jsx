import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { base44, setCustomerContext } from '@/api/amplifyClient';

const CustomerContext = createContext();

// Key for storing invite code in sessionStorage
const INVITE_CODE_KEY = 'pending_invite_code';

// Permission definitions by role
const ROLE_PERMISSIONS = {
  owner: {
    canView: true,
    canCreate: true,
    canEditOwn: true,
    canDeleteOwn: true,
    canEditAny: true,
    canDeleteAny: true,
    canInviteUsers: true,
    canManageUsers: true,
    canViewBilling: true,
    canChangePlan: true,
  },
  admin: {
    canView: true,
    canCreate: true,
    canEditOwn: true,
    canDeleteOwn: true,
    canEditAny: true,
    canDeleteAny: true,
    canInviteUsers: true,
    canManageUsers: true,
    canViewBilling: false,
    canChangePlan: false,
  },
  member: {
    canView: true,
    canCreate: true,
    canEditOwn: true,
    canDeleteOwn: true,
    canEditAny: false,
    canDeleteAny: false,
    canInviteUsers: false,
    canManageUsers: false,
    canViewBilling: false,
    canChangePlan: false,
  },
  viewer: {
    canView: true,
    canCreate: false,
    canEditOwn: false,
    canDeleteOwn: false,
    canEditAny: false,
    canDeleteAny: false,
    canInviteUsers: false,
    canManageUsers: false,
    canViewBilling: false,
    canChangePlan: false,
  },
};

export const CustomerProvider = ({ children }) => {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(true);
  const [customerError, setCustomerError] = useState(null);

  // Capture invite code from URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteCode = urlParams.get('invite');
    if (inviteCode) {
      console.log('Storing invite code:', inviteCode);
      sessionStorage.setItem(INVITE_CODE_KEY, inviteCode);
      // Clean up URL (remove invite param)
      urlParams.delete('invite');
      const newUrl = urlParams.toString()
        ? `${window.location.pathname}?${urlParams.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  // Validate and consume an invite code
  const consumeInviteCode = useCallback(async (code) => {
    try {
      console.log('Looking up invite code:', code);

      // Find invite by code
      const invites = await base44.entities.InviteLink.filter({ code });
      const invite = invites[0];

      if (!invite) {
        console.log('Invite code not found');
        return null;
      }

      // Validate invite
      if (invite.status !== 'active') {
        console.log('Invite is not active:', invite.status);
        return null;
      }

      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        console.log('Invite has expired');
        return null;
      }

      if (invite.max_uses && invite.use_count >= invite.max_uses) {
        console.log('Invite has reached max uses');
        return null;
      }

      // Increment use count
      await base44.entities.InviteLink.update(invite.id, {
        use_count: (invite.use_count || 0) + 1,
      });

      console.log('Invite validated, customer_id:', invite.customer_id, 'role:', invite.role);
      return {
        customer_id: invite.customer_id,
        role: invite.role,
        invited_by: invite.created_by,
      };
    } catch (error) {
      console.error('Error consuming invite code:', error);
      return null;
    }
  }, []);

  // Create default customer (called when no customer exists)
  const createDefaultCustomer = useCallback(async () => {
    console.log('Creating Default customer...');
    const newCustomer = await base44.entities.Customer.create({
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
    console.log('Default customer created:', newCustomer.id);
    return newCustomer;
  }, []);

  // Create user profile for the current user
  const createUserProfile = useCallback(async (customerId, options = {}) => {
    const {
      isFirstUser = false,
      role = isFirstUser ? 'owner' : 'member',
      invited_by = null,
    } = options;

    console.log('Creating UserProfile for user:', user?.id, 'isFirstUser:', isFirstUser, 'role:', role);
    const newProfile = await base44.entities.UserProfile.create({
      cognito_sub: user.id,
      email: user.email,
      display_name: user.full_name || user.email,
      customer_id: customerId,
      is_super_admin: isFirstUser, // First user is super admin
      role: role,
      status: 'active',
      invited_by: invited_by,
      joined_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
    });
    console.log('UserProfile created:', newProfile.id);
    return newProfile;
  }, [user?.id, user?.email, user?.full_name]);

  // Load customer and user profile when authenticated
  const loadCustomerData = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setCustomer(null);
      setUserProfile(null);
      setIsLoadingCustomer(false);
      // Clear customer context in amplifyClient
      setCustomerContext(null, null);
      return;
    }

    try {
      setIsLoadingCustomer(true);
      setCustomerError(null);

      // Find the user's profile by cognito_sub
      const profiles = await base44.entities.UserProfile.filter({
        cognito_sub: user.id,
      });

      let profile = profiles[0];
      let customerData = null;

      if (!profile) {
        // No profile found - need to set up user
        console.log('No UserProfile found, checking for invite code...');

        // Check for pending invite code
        const pendingInviteCode = sessionStorage.getItem(INVITE_CODE_KEY);
        let inviteData = null;

        if (pendingInviteCode) {
          console.log('Found pending invite code:', pendingInviteCode);
          inviteData = await consumeInviteCode(pendingInviteCode);
          // Clear the invite code from storage (whether valid or not)
          sessionStorage.removeItem(INVITE_CODE_KEY);
        }

        if (inviteData) {
          // User is joining via invite link
          console.log('User joining via invite, customer_id:', inviteData.customer_id, 'role:', inviteData.role);
          try {
            customerData = await base44.entities.Customer.get(inviteData.customer_id);
            profile = await createUserProfile(customerData.id, {
              isFirstUser: false,
              role: inviteData.role,
              invited_by: inviteData.invited_by,
            });
          } catch (err) {
            console.error('Failed to load customer from invite:', err);
            // Fall through to default behavior
            inviteData = null;
          }
        }

        if (!inviteData) {
          // No valid invite - use default behavior
          console.log('No valid invite, checking for existing customers...');

          // Check if any customer exists
          const customers = await base44.entities.Customer.list();

          if (customers.length === 0) {
            // No customers exist - this is a fresh database
            // Create Default customer and make this user the super admin + owner
            console.log('No customers found - creating Default customer and first user as super admin');
            customerData = await createDefaultCustomer();
            profile = await createUserProfile(customerData.id, { isFirstUser: true });
          } else {
            // Customers exist - add user to Default customer as member
            // Find the Default customer or use the first one
            customerData = customers.find(c => c.slug === 'default') || customers[0];
            console.log('Found existing customer:', customerData.name, '- creating user as member');
            profile = await createUserProfile(customerData.id, { isFirstUser: false });
          }
        }
      } else {
        // Profile exists - load the customer
        if (profile.customer_id) {
          try {
            customerData = await base44.entities.Customer.get(profile.customer_id);
          } catch (err) {
            console.error('Failed to load customer:', err);
            setCustomerError({ type: 'customer_not_found', message: 'Customer not found' });
            setIsLoadingCustomer(false);
            return;
          }
        }

        // Update last_active_at
        try {
          await base44.entities.UserProfile.update(profile.id, {
            last_active_at: new Date().toISOString(),
          });
        } catch (err) {
          // Non-critical, just log
          console.warn('Failed to update last_active_at:', err);
        }
      }

      setUserProfile(profile);
      setCustomer(customerData);

      // Set customer context in amplifyClient for auto-filtering
      if (customerData && profile) {
        setCustomerContext(customerData.id, profile.id);
      }
    } catch (error) {
      console.error('Failed to load customer data:', error);
      setCustomerError({ type: 'load_error', message: error.message });
    } finally {
      setIsLoadingCustomer(false);
    }
  }, [isAuthenticated, user?.id, user?.email, user?.full_name, createDefaultCustomer, createUserProfile]);

  useEffect(() => {
    if (!isLoadingAuth) {
      loadCustomerData();
    }
  }, [isLoadingAuth, loadCustomerData]);

  // Permission helpers
  const hasPermission = useCallback((permission) => {
    // Super admins have all permissions
    if (userProfile?.is_super_admin) {
      return true;
    }

    const role = userProfile?.role;
    if (!role || !ROLE_PERMISSIONS[role]) {
      return false;
    }

    // Check fine-grained overrides first
    if (userProfile?.permissions && typeof userProfile.permissions === 'object') {
      const override = userProfile.permissions[permission];
      if (override !== undefined) {
        return Boolean(override);
      }
    }

    return ROLE_PERMISSIONS[role][permission] || false;
  }, [userProfile]);

  const canManageUsers = useCallback(() => {
    return hasPermission('canManageUsers');
  }, [hasPermission]);

  const canInviteUsers = useCallback(() => {
    return hasPermission('canInviteUsers');
  }, [hasPermission]);

  const isOwner = useCallback(() => {
    return userProfile?.role === 'owner';
  }, [userProfile]);

  const isAdmin = useCallback(() => {
    return userProfile?.role === 'admin' || userProfile?.role === 'owner';
  }, [userProfile]);

  const isSuperAdmin = useCallback(() => {
    return userProfile?.is_super_admin === true;
  }, [userProfile]);

  const canCreate = useCallback(() => {
    return hasPermission('canCreate');
  }, [hasPermission]);

  const canEdit = useCallback((record) => {
    if (hasPermission('canEditAny')) {
      return true;
    }
    if (hasPermission('canEditOwn') && record?.owner === user?.id) {
      return true;
    }
    return false;
  }, [hasPermission, user?.id]);

  const canDelete = useCallback((record) => {
    if (hasPermission('canDeleteAny')) {
      return true;
    }
    if (hasPermission('canDeleteOwn') && record?.owner === user?.id) {
      return true;
    }
    return false;
  }, [hasPermission, user?.id]);

  // Get current customer_id for creating records
  const getCustomerId = useCallback(() => {
    return customer?.id || userProfile?.customer_id || null;
  }, [customer?.id, userProfile?.customer_id]);

  // Refresh customer data
  const refreshCustomerData = useCallback(() => {
    return loadCustomerData();
  }, [loadCustomerData]);

  return (
    <CustomerContext.Provider value={{
      // Data
      customer,
      userProfile,
      isLoadingCustomer,
      customerError,

      // Permission helpers
      hasPermission,
      canManageUsers,
      canInviteUsers,
      isOwner,
      isAdmin,
      isSuperAdmin,
      canCreate,
      canEdit,
      canDelete,

      // Utilities
      getCustomerId,
      refreshCustomerData,
    }}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
};
