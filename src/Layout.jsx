import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { useAuth } from '@/lib/AuthContext';
import { useCustomer } from '@/lib/CustomerContext';
import {
  Shirt,
  Image,
  Upload,
  LayoutDashboard,
  Menu,
  X,
  Sparkles,
  User,
  LogOut,
  Database
} from 'lucide-react';
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LoginModal from './components/auth/LoginModal';
import InviteSignup from './components/auth/InviteSignup';
import { GenerationStatusProvider } from './components/generation/GenerationStatusProvider';
import FloatingGenerationBar from './components/generation/FloatingGenerationBar';

// Key for storing invite code in sessionStorage
const INVITE_CODE_KEY = 'pending_invite_code';
const INVITE_FRESH_KEY = 'invite_fresh'; // Flag to indicate we just arrived with an invite

export default function Layout({ children, currentPageName }) {
  const { user, isAuthenticated, isLoadingAuth, logout } = useAuth();
  const { customer, userProfile } = useCustomer();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showInviteSignup, setShowInviteSignup] = useState(false);

  // Check if we're on the landing page
  const isLandingPage = currentPageName === 'Landing' || location.pathname === '/' || location.pathname === '/Landing';

  // Redirect to landing page if not authenticated and not on landing page
  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated && !isLandingPage) {
      // Check if there's an invite code - allow staying on page with invite
      const urlParams = new URLSearchParams(window.location.search);
      const hasInvite = urlParams.get('invite') || sessionStorage.getItem(INVITE_CODE_KEY);
      if (!hasInvite) {
        navigate(createPageUrl('Landing'));
      }
    }
  }, [isAuthenticated, isLoadingAuth, isLandingPage, navigate]);

  // Handle logout with redirect
  const handleLogout = () => {
    logout();
    navigate(createPageUrl('Landing'));
  };

  // Check for invite code and show invite signup if not authenticated
  useEffect(() => {
    // Wait for auth to finish loading
    if (isLoadingAuth) return;

    if (isAuthenticated) {
      setShowInviteSignup(false);
      // Clear the fresh flag when authenticated
      sessionStorage.removeItem(INVITE_FRESH_KEY);
      return;
    }

    // Check URL first - if invite in URL, mark as fresh
    const urlParams = new URLSearchParams(window.location.search);
    const inviteCodeInUrl = urlParams.get('invite');

    if (inviteCodeInUrl) {
      // Fresh invite from URL - store and mark as fresh
      sessionStorage.setItem(INVITE_CODE_KEY, inviteCodeInUrl);
      sessionStorage.setItem(INVITE_FRESH_KEY, 'true');
      setShowInviteSignup(true);
    } else {
      // Check if we have a fresh invite in storage (CustomerContext may have captured it)
      const isFresh = sessionStorage.getItem(INVITE_FRESH_KEY);
      const inviteCodeInStorage = sessionStorage.getItem(INVITE_CODE_KEY);

      if (isFresh && inviteCodeInStorage) {
        setShowInviteSignup(true);
      }
    }
  }, [isAuthenticated, isLoadingAuth]);

  const navItems = [
    { name: 'Dashboard', page: 'Dashboard', icon: LayoutDashboard },
    { name: 'Generera', page: 'Upload', icon: Upload },
    { name: 'Plagg', page: 'Garments', icon: Shirt },
    { name: 'Galleri', page: 'Gallery', icon: Image },
    { name: 'Modeller', page: 'Models', icon: Sparkles },
    { name: 'Mallar', page: 'Templates', icon: Sparkles },
    { name: 'Träning', page: 'ModelTraining', icon: Sparkles },
  ];

  return (
    <GenerationStatusProvider>
      <div className={cn("min-h-screen transition-colors", darkMode ? "dark bg-black text-white" : "bg-white text-black")}>
        <style>{`
        :root {
          --accent: #0071e3;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .fade-in-up {
          animation: fadeInUp 0.6s ease-out;
        }
      `}</style>

      {/* Navigation */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b transition-colors",
        darkMode
          ? "bg-black/80 border-white/10"
          : "bg-white/80 border-black/5"
      )}>
        <div className="max-w-[980px] mx-auto px-5">
          <div className="flex items-center justify-between h-11">
            {/* Logo */}
            <Link to={createPageUrl('Landing')} className="flex items-center">
              <img
                src={darkMode ? "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694a63448589b28fcfe35847/27e727d8d_Heylooknegpng.png" : "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694a63448589b28fcfe35847/3800fa98f_HeyLookLogoPos.png"}
                alt="HeyLook"
                className="h-8"
              />
            </Link>

            {/* Desktop Nav - only show menu items when authenticated */}
            <div className="hidden md:flex items-center gap-8">
              {isAuthenticated && navItems.map((item) => {
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    className={cn(
                      "text-xs transition-opacity",
                      darkMode
                        ? (isActive ? "text-white" : "text-white/60 hover:text-white")
                        : (isActive ? "text-black" : "text-black/60 hover:text-black")
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}

              {/* Dark Mode Toggle - only when authenticated */}
              {isAuthenticated && (
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={cn(
                    "ml-4 px-3 py-1.5 rounded-full text-xs transition-colors",
                    darkMode
                      ? "bg-white/10 text-white hover:bg-white/20"
                      : "bg-black/5 text-black hover:bg-black/10"
                  )}
                >
                  {darkMode ? '☀️' : '🌙'}
                </button>
              )}

              {/* User Menu or Login Button */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={cn(
                      "ml-4 h-9 w-9 rounded-full flex items-center justify-center transition-colors",
                      darkMode ? "bg-white/10 hover:bg-white/20" : "bg-black/5 hover:bg-black/10"
                    )}>
                      <User className="h-5 w-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className={darkMode ? "bg-[#1a1a1a] border-white/10" : "bg-white border-black/10"}>
                    <div className="px-2 py-1.5">
                      <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                        {user?.full_name || user?.email}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-white/60' : 'text-black/60'}`}>
                        {customer?.name || 'No organization'}
                      </p>
                    </div>
                    {(userProfile?.is_super_admin || userProfile?.role === 'owner' || userProfile?.role === 'admin') && (
                      <>
                        <DropdownMenuSeparator className={darkMode ? "bg-white/10" : "bg-black/10"} />
                        <Link to={createPageUrl('admin')}>
                          <DropdownMenuItem className={darkMode ? "text-white" : "text-black"}>
                            <Database className="h-4 w-4 mr-2" />
                            Admin
                          </DropdownMenuItem>
                        </Link>
                      </>
                    )}
                    <DropdownMenuItem onClick={handleLogout} className={darkMode ? "text-white" : "text-black"}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Logga ut
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2 ml-4">
                  <a
                    href="https://calendly.com/heylook/demo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-7 px-4 flex items-center border border-[#392599] text-[#392599] hover:bg-[#392599]/10 rounded-full text-xs font-medium transition-colors"
                  >
                    Book demo
                  </a>
                  <button
                    onClick={() => setShowLogin(true)}
                    className="h-7 px-4 flex items-center bg-[#392599] hover:bg-[#4a2fb3] text-white rounded-full text-xs font-medium transition-colors"
                  >
                    Log in
                  </button>
                </div>
              )}
            </div>

            {/* Mobile: Login button when not authenticated, Menu button when authenticated */}
            {isAuthenticated ? (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            ) : (
              <div className="md:hidden flex items-center gap-2">
                <a
                  href="https://calendly.com/heylook/demo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-7 px-3 flex items-center border border-[#392599] text-[#392599] hover:bg-[#392599]/10 rounded-full text-xs font-medium transition-colors"
                >
                  Book demo
                </a>
                <button
                  onClick={() => setShowLogin(true)}
                  className="h-7 px-3 flex items-center bg-[#392599] hover:bg-[#4a2fb3] text-white rounded-full text-xs font-medium transition-colors"
                >
                  Log in
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu - only when authenticated */}
        {isAuthenticated && mobileMenuOpen && (
          <div className={cn(
            "md:hidden border-t transition-colors",
            darkMode ? "border-white/10 bg-black" : "border-black/10 bg-white"
          )}>
            <div className="px-5 py-2">
              {navItems.map((item) => {
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "block py-3 text-sm border-b",
                      darkMode
                        ? (isActive ? "text-white border-white/5" : "text-white/60 border-white/5")
                        : (isActive ? "text-black border-black/5" : "text-black/60 border-black/5")
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}

              {/* Dark Mode Toggle Mobile */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={cn(
                  "w-full py-3 text-left text-sm",
                  darkMode ? "text-white/60" : "text-black/60"
                )}
              >
                {darkMode ? '☀️ Light mode' : '🌙 Dark mode'}
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="pt-11 min-h-screen">
        {children}
      </main>

      {/* Footer */}
      {isLandingPage ? (
        <footer className="relative z-40 backdrop-blur-xl bg-white/80 border-t border-black/5 px-6 py-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694a63448589b28fcfe35847/3800fa98f_HeyLookLogoPos.png"
                alt="HeyLook"
                className="h-10"
              />
              <p className="text-base text-black/60 hidden sm:block">
                AI-driven produktfotografering för e-handel
              </p>
            </div>
            <div className="text-base text-black/40">
              © 2026 HeyLook
            </div>
          </div>
        </footer>
      ) : (
        <footer className={cn(
          "border-t transition-colors py-16 px-5",
          darkMode ? "border-white/10" : "border-black/10"
        )}>
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
              <div>
                <div className="mb-4">
                  <img
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694a63448589b28fcfe35847/27e727d8d_Heylooknegpng.png"
                    alt="HeyLook"
                    className="h-8"
                  />
                </div>
                <p className={cn("text-sm", darkMode ? "text-white/60" : "text-black/60")}>
                  AI-driven produktfotografering för e-handel
                </p>
              </div>
              <div>
                <h4 className={cn("font-medium mb-4", darkMode ? "text-white" : "text-black")}>Produkt</h4>
                <ul className={cn("space-y-2 text-sm", darkMode ? "text-white/60" : "text-black/60")}>
                  <li><Link to={createPageUrl('Upload')} className={cn("transition", darkMode ? "hover:text-white" : "hover:text-black")}>Generera</Link></li>
                  <li><Link to={createPageUrl('Gallery')} className={cn("transition", darkMode ? "hover:text-white" : "hover:text-black")}>Galleri</Link></li>
                  <li><Link to={createPageUrl('Dashboard')} className={cn("transition", darkMode ? "hover:text-white" : "hover:text-black")}>Dashboard</Link></li>
                </ul>
              </div>
              <div>
                <h4 className={cn("font-medium mb-4", darkMode ? "text-white" : "text-black")}>Företag</h4>
                <ul className={cn("space-y-2 text-sm", darkMode ? "text-white/60" : "text-black/60")}>
                  <li><a href="#" className={cn("transition", darkMode ? "hover:text-white" : "hover:text-black")}>Om oss</a></li>
                  <li><a href="#" className={cn("transition", darkMode ? "hover:text-white" : "hover:text-black")}>Kontakt</a></li>
                  <li><a href="#" className={cn("transition", darkMode ? "hover:text-white" : "hover:text-black")}>Karriär</a></li>
                </ul>
              </div>
              <div>
                <h4 className={cn("font-medium mb-4", darkMode ? "text-white" : "text-black")}>Legal</h4>
                <ul className={cn("space-y-2 text-sm", darkMode ? "text-white/60" : "text-black/60")}>
                  <li><a href="#" className={cn("transition", darkMode ? "hover:text-white" : "hover:text-black")}>Integritetspolicy</a></li>
                  <li><a href="#" className={cn("transition", darkMode ? "hover:text-white" : "hover:text-black")}>Användarvillkor</a></li>
                  <li><a href="#" className={cn("transition", darkMode ? "hover:text-white" : "hover:text-black")}>Cookies</a></li>
                </ul>
              </div>
            </div>
            <div className={cn(
              "pt-8 border-t text-center text-sm",
              darkMode ? "border-white/10 text-white/40" : "border-black/10 text-black/40"
              )}>
              © 2026 HeyLook. All rights reserved.
              </div>
          </div>
        </footer>
      )}

      {/* Modals */}
      {showInviteSignup && (
        <InviteSignup
          onClose={() => {
            setShowInviteSignup(false);
            sessionStorage.removeItem(INVITE_CODE_KEY);
            sessionStorage.removeItem(INVITE_FRESH_KEY);
          }}
          onSuccess={() => {
            setShowInviteSignup(false);
            // Don't remove INVITE_CODE_KEY here - let CustomerContext consume it after reload
            sessionStorage.removeItem(INVITE_FRESH_KEY);
            window.location.reload();
          }}
        />
      )}

      {showLogin && !showInviteSignup && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          darkMode={darkMode}
        />
      )}

      {/* Floating Generation Status Bar */}
      <FloatingGenerationBar darkMode={darkMode} />
      </div>
      </GenerationStatusProvider>
      );
      }