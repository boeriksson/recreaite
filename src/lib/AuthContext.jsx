import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { getCurrentUser, fetchUserAttributes, signOut } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Check user authentication status
  const checkUserAuth = useCallback(async () => {
    try {
      setIsLoadingAuth(true);
      const currentUser = await getCurrentUser();
      
      // Only fetch attributes if we have a current user
      // This avoids unnecessary Identity Pool credential requests for unauthenticated users
      let attributes = {};
      try {
        attributes = await fetchUserAttributes();
      } catch (attrError) {
        // If fetching attributes fails, we still have a user, so continue with basic info
        console.debug('Could not fetch user attributes:', attrError.message);
      }

      setUser({
        id: currentUser.userId,
        username: currentUser.username,
        email: attributes.email,
        full_name: attributes.name || attributes.email,
        email_verified: attributes.email_verified === 'true',
      });
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (error) {
      // Not authenticated - this is expected for guests
      // Silently handle authentication errors
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  // Initialize app state
  const checkAppState = useCallback(async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);

      // Set app public settings (can be extended to fetch from backend)
      setAppPublicSettings({ id: 'recreaite-app', public_settings: {} });
      setIsLoadingPublicSettings(false);

      await checkUserAuth();
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  }, [checkUserAuth]);

  // Listen for auth events from Amplify Hub
  useEffect(() => {
    const hubListener = Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
          console.log('User signed in');
          checkUserAuth();
          setShowLoginModal(false);
          // Redirect to Dashboard after login if on Landing page
          if (window.location.pathname === '/' || window.location.pathname === '/Landing') {
            window.location.href = '/Dashboard';
          }
          break;
        case 'signedOut':
          console.log('User signed out');
          setUser(null);
          setIsAuthenticated(false);
          break;
        case 'tokenRefresh':
          console.log('Token refreshed');
          break;
        case 'tokenRefresh_failure':
          console.error('Token refresh failed');
          setUser(null);
          setIsAuthenticated(false);
          break;
        default:
          break;
      }
    });

    // Listen for custom login modal event
    const showLoginHandler = () => setShowLoginModal(true);
    window.addEventListener('amplify:showLogin', showLoginHandler);

    // Initial auth check
    checkAppState();

    return () => {
      hubListener();
      window.removeEventListener('amplify:showLogin', showLoginHandler);
    };
  }, [checkAppState, checkUserAuth]);

  const logout = async (shouldRedirect = true) => {
    try {
      await signOut();
      setUser(null);
      setIsAuthenticated(false);

      if (shouldRedirect) {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navigateToLogin = () => {
    // Store return URL for post-login redirect
    sessionStorage.setItem('amplify_return_url', window.location.href);
    setShowLoginModal(true);
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
  };

  const onAuthSuccess = async () => {
    setShowLoginModal(false);
    await checkUserAuth();

    // Redirect to stored return URL if exists, otherwise go to Dashboard
    const returnUrl = sessionStorage.getItem('amplify_return_url');
    sessionStorage.removeItem('amplify_return_url');

    // Default to Dashboard after login
    const targetUrl = returnUrl && !returnUrl.endsWith('/') && !returnUrl.endsWith('/Landing')
      ? returnUrl
      : '/Dashboard';
    window.location.href = targetUrl;
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState,
      showLoginModal,
      closeLoginModal,
      onAuthSuccess,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
