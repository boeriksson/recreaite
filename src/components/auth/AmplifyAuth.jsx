import React from 'react';
import { Authenticator, ThemeProvider } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useAuth } from '@/lib/AuthContext';
import { Sparkles, X } from 'lucide-react';

// Custom theme to match HeyLook branding
const theme = {
  name: 'heylook-theme',
  tokens: {
    colors: {
      brand: {
        primary: {
          10: '#f5f3ff',
          20: '#ede9fe',
          40: '#c4b5fd',
          60: '#8b5cf6',
          80: '#392599',
          90: '#2e1f7a',
          100: '#1e1454',
        },
      },
      font: {
        interactive: '#392599',
      },
    },
    components: {
      authenticator: {
        router: {
          boxShadow: 'none',
          borderWidth: '0',
        },
      },
      button: {
        primary: {
          backgroundColor: '#392599',
          _hover: {
            backgroundColor: '#4a2fb3',
          },
          _focus: {
            backgroundColor: '#4a2fb3',
          },
          _active: {
            backgroundColor: '#2e1f7a',
          },
        },
        link: {
          color: '#392599',
          _hover: {
            color: '#4a2fb3',
          },
        },
      },
      fieldcontrol: {
        borderRadius: '12px',
        _focus: {
          borderColor: '#392599',
          boxShadow: '0 0 0 2px rgba(57, 37, 153, 0.2)',
        },
      },
      tabs: {
        item: {
          color: '#666',
          _active: {
            color: '#392599',
            borderColor: '#392599',
          },
          _hover: {
            color: '#4a2fb3',
          },
        },
      },
    },
    radii: {
      small: '8px',
      medium: '12px',
      large: '16px',
    },
  },
};

// Custom CSS overrides
const customStyles = `
  [data-amplify-authenticator] {
    --amplify-components-authenticator-router-box-shadow: none;
    --amplify-components-authenticator-router-border-width: 0;
    --amplify-components-button-primary-background-color: #392599;
    --amplify-components-button-primary-hover-background-color: #4a2fb3;
    --amplify-components-button-link-color: #392599;
    --amplify-components-fieldcontrol-border-radius: 12px;
    --amplify-components-fieldcontrol-focus-border-color: #392599;
    width: 100%;
    max-width: 100%;
  }

  [data-amplify-authenticator] [data-amplify-router] {
    background: transparent;
    box-shadow: none;
    border: none;
    padding: 0;
    width: 100%;
    max-width: 100%;
  }

  [data-amplify-authenticator] [data-amplify-form] {
    padding: 0;
  }

  [data-amplify-authenticator] .amplify-flex {
    width: 100%;
  }

  [data-amplify-authenticator] button[type="submit"] {
    border-radius: 9999px;
    padding: 12px 24px;
    font-weight: 500;
    width: 100%;
  }

  [data-amplify-authenticator] input {
    border-radius: 12px;
    padding: 12px 16px;
    width: 100%;
    box-sizing: border-box;
  }

  [data-amplify-authenticator] .amplify-input {
    width: 100%;
  }

  [data-amplify-authenticator] .amplify-field {
    width: 100%;
  }

  [data-amplify-authenticator] .amplify-tabs {
    border-bottom: 1px solid #e5e5e5;
    width: 100%;
  }

  [data-amplify-authenticator] .amplify-tabs-item {
    font-weight: 500;
    flex: 1;
    text-align: center;
  }

  [data-amplify-authenticator] .amplify-tabs-item[data-state="active"] {
    color: #392599;
    border-bottom-color: #392599;
  }

  [data-amplify-authenticator] a {
    color: #392599;
  }

  [data-amplify-authenticator] a:hover {
    color: #4a2fb3;
  }

  [data-amplify-authenticator] .amplify-button--link {
    font-size: 14px;
  }

  /* Force all containers to respect parent width */
  [data-amplify-authenticator] > div,
  [data-amplify-authenticator] [data-amplify-container] {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
  }

  /* Override default Amplify min-width on form */
  [data-amplify-authenticator] [data-amplify-router] > div {
    min-width: 0 !important;
    width: 100% !important;
  }

  /* Ensure fieldset takes full width */
  [data-amplify-authenticator] fieldset {
    width: 100%;
    min-width: 0;
  }

  /* Password field with show/hide button */
  [data-amplify-authenticator] .amplify-field-group {
    width: 100%;
  }

  [data-amplify-authenticator] .amplify-field-group__outer-end {
    right: 0;
  }
`;

const AmplifyAuth = () => {
  const { showLoginModal, closeLoginModal, onAuthSuccess } = useAuth();

  React.useEffect(() => {
    // Inject custom styles
    const styleEl = document.createElement('style');
    styleEl.textContent = customStyles;
    document.head.appendChild(styleEl);
    return () => styleEl.remove();
  }, []);

  if (!showLoginModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-[380px] overflow-hidden">
        {/* Close button */}
        <button
          onClick={closeLoginModal}
          className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-black/5 transition-colors text-gray-500 hover:text-gray-700"
          aria-label="Stäng"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="text-center pt-6 pb-3 px-6">
          <div className="h-12 w-12 rounded-full bg-[#392599] flex items-center justify-center mx-auto mb-3">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Välkommen till HeyLook</h2>
          <p className="text-gray-500 text-sm">Logga in för att fortsätta</p>
        </div>

        {/* Authenticator component */}
        <div className="px-5 pb-4 w-full overflow-hidden">
          <ThemeProvider theme={theme}>
            <Authenticator
              hideSignUp={true}
              loginMechanisms={['email']}
              formFields={{
                signIn: {
                  username: {
                    label: 'E-post',
                    placeholder: 'din@email.com',
                  },
                  password: {
                    label: 'Lösenord',
                    placeholder: 'Ange ditt lösenord',
                  },
                },
                signUp: {
                  email: {
                    label: 'E-post',
                    placeholder: 'din@email.com',
                    order: 1,
                  },
                  password: {
                    label: 'Lösenord',
                    placeholder: 'Skapa ett lösenord',
                    order: 2,
                  },
                  confirm_password: {
                    label: 'Bekräfta lösenord',
                    placeholder: 'Bekräfta ditt lösenord',
                    order: 3,
                  },
                },
                confirmSignUp: {
                  confirmation_code: {
                    label: 'Bekräftelsekod',
                    placeholder: 'Ange koden från din e-post',
                  },
                },
                resetPassword: {
                  username: {
                    label: 'E-post',
                    placeholder: 'din@email.com',
                  },
                },
                confirmResetPassword: {
                  confirmation_code: {
                    label: 'Bekräftelsekod',
                    placeholder: 'Ange koden från din e-post',
                  },
                  password: {
                    label: 'Nytt lösenord',
                    placeholder: 'Ange nytt lösenord',
                  },
                  confirm_password: {
                    label: 'Bekräfta lösenord',
                    placeholder: 'Bekräfta nytt lösenord',
                  },
                },
              }}
              components={{
                Header() {
                  return null; // We have our own header
                },
                SignIn: {
                  Header() {
                    return null;
                  },
                  Footer() {
                    return null;
                  },
                },
                SignUp: {
                  Header() {
                    return null;
                  },
                  Footer() {
                    return null;
                  },
                },
              }}
            >
              {({ user }) => {
                if (user) {
                  setTimeout(() => onAuthSuccess(), 0);
                }
                return null;
              }}
            </Authenticator>
          </ThemeProvider>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <p className="text-xs text-center text-gray-400">
            Genom att fortsätta godkänner du våra användarvillkor
          </p>
        </div>
      </div>
    </div>
  );
};

export default AmplifyAuth;
