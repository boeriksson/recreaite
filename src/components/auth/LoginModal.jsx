import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { Button } from "@/components/ui/button";
import { X, Mail, Sparkles } from 'lucide-react';

export default function LoginModal({ onClose, darkMode }) {
  const { isAuthenticated, navigateToLogin } = useAuth();

  // If already authenticated, close modal and proceed
  React.useEffect(() => {
    if (isAuthenticated) {
      onClose();
    }
  }, [isAuthenticated, onClose]);

  const handleContinue = () => {
    // Show the Amplify Authenticator
    navigateToLogin();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`relative ${darkMode ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-black/10'} rounded-3xl max-w-md w-full border p-8`}
      >
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-full ${darkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'} transition-colors`}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-full bg-[#392599] flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Välkommen till HeyLook</h2>
          <p className={darkMode ? 'text-white/60' : 'text-black/60'}>
            Logga in för att börja generera bilder
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleContinue}
            className="w-full bg-[#392599] hover:bg-[#4a2fb3] text-white rounded-full py-6 text-lg"
          >
            <Mail className="h-5 w-5 mr-2" />
            Fortsätt med Email
          </Button>
        </div>

        <p className={`text-xs text-center mt-6 ${darkMode ? 'text-white/40' : 'text-black/40'}`}>
          Genom att fortsätta godkänner du våra användarvillkor
        </p>
      </motion.div>
    </div>
  );
}
