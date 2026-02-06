import React from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useAuth } from '@/lib/AuthContext';

const AmplifyAuth = () => {
  const { showLoginModal, closeLoginModal, onAuthSuccess } = useAuth();

  if (!showLoginModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Close button */}
        <button
          onClick={closeLoginModal}
          className="absolute top-4 right-4 z-10 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Authenticator component */}
        <div className="p-6">
          <Authenticator
            signUpAttributes={['email']}
            loginMechanisms={['email']}
            components={{
              Header() {
                return (
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Welcome</h2>
                    <p className="text-gray-600 mt-1">Sign in to your account</p>
                  </div>
                );
              },
            }}
          >
            {({ user }) => {
              // User is authenticated, trigger success callback
              if (user) {
                // Use setTimeout to avoid state update during render
                setTimeout(() => onAuthSuccess(), 0);
              }
              return null;
            }}
          </Authenticator>
        </div>
      </div>
    </div>
  );
};

export default AmplifyAuth;
