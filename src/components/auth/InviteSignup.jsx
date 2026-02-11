import React, { useState, useEffect } from 'react';
import { signUp, confirmSignUp, signIn } from 'aws-amplify/auth';
import { motion } from 'framer-motion';
import { Sparkles, X, Loader2, Building2, Mail, Lock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { base44 } from '@/api/amplifyClient';

// Key for storing invite code in sessionStorage
const INVITE_CODE_KEY = 'pending_invite_code';

export default function InviteSignup({ onClose, onSuccess }) {
  const [inviteData, setInviteData] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Confirmation code state
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');

  // Load invite data on mount
  useEffect(() => {
    const loadInvite = async () => {
      try {
        // Get invite code from URL or sessionStorage
        const urlParams = new URLSearchParams(window.location.search);
        let code = urlParams.get('invite');

        if (!code) {
          code = sessionStorage.getItem(INVITE_CODE_KEY);
        }

        if (!code) {
          setError('No invite code found');
          setLoading(false);
          return;
        }

        // Store the code for later use
        sessionStorage.setItem(INVITE_CODE_KEY, code);

        // Look up the invite using guest access (no auth required)
        try {
          const invites = await base44.entities.InviteLink.list({
            skipCustomerFilter: true,
            useGuest: true
          });
          const invite = invites.find(i => i.code === code);

          // If no invites returned, might be an issue with guest access
          if (invites.length === 0) {
            console.log('No invites returned, showing basic form');
            setCustomerName('your organization');
            setInviteData({ code });
            setLoading(false);
            return;
          }

          if (!invite) {
            setError('Invalid invite code');
            setLoading(false);
            return;
          }

          // Validate invite
          if (invite.status !== 'active') {
            setError('This invite link is no longer active');
            setLoading(false);
            return;
          }

          if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
            setError('This invite link has expired');
            setLoading(false);
            return;
          }

          if (invite.max_uses && invite.use_count >= invite.max_uses) {
            setError('This invite link has reached its maximum uses');
            setLoading(false);
            return;
          }

          // Load customer name using guest access
          try {
            const customer = await base44.entities.Customer.get(invite.customer_id, { useGuest: true });
            setCustomerName(customer.name);
          } catch {
            setCustomerName('your organization');
          }

          setInviteData(invite);
        } catch (fetchErr) {
          // Could not fetch invite details
          console.log('Could not fetch invite details, showing basic form:', fetchErr);
          setCustomerName('your organization');
          setInviteData({ code }); // Minimal invite data
        }

        setLoading(false);
      } catch (err) {
        console.error('Failed to load invite:', err);
        setError('Failed to load invite details');
        setLoading(false);
      }
    };

    loadInvite();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Use invite email if set, otherwise use entered email
    const signupEmail = inviteData.email || email;

    if (!signupEmail) {
      setError('Please enter your email address');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setSubmitting(true);

    try {
      // Sign up with Amplify Auth
      const { isSignUpComplete, nextStep } = await signUp({
        username: signupEmail,
        password,
        options: {
          userAttributes: {
            email: signupEmail,
          },
        },
      });

      if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        setNeedsConfirmation(true);
      } else if (isSignUpComplete) {
        // Auto sign in
        await signIn({ username: signupEmail, password });
        onSuccess?.();
      }
    } catch (err) {
      console.error('Sign up error:', err);
      if (err.name === 'UsernameExistsException') {
        setError('An account with this email already exists. Please sign in instead.');
      } else {
        setError(err.message || 'Failed to create account');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmSignUp = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const signupEmail = inviteData.email || email;
    console.log('Confirming signup for:', signupEmail);

    try {
      console.log('Calling confirmSignUp...');
      await confirmSignUp({
        username: signupEmail,
        confirmationCode,
      });
      console.log('confirmSignUp successful');

      // Auto sign in after confirmation
      console.log('Calling signIn...');
      await signIn({ username: signupEmail, password });
      console.log('signIn successful, calling onSuccess');
      onSuccess?.();
    } catch (err) {
      console.error('Confirmation error:', err);
      setError(err.message || 'Failed to confirm account');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#392599]" />
        </div>
      </div>
    );
  }

  if (error && !inviteData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-[400px] p-8"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="text-center">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <X className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Invalid Invite</h2>
            <p className="text-gray-500 mb-6">{error}</p>
            <Button onClick={onClose} variant="outline" className="w-full">
              Close
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-[400px] overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-black/5 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="text-center pt-6 pb-4 px-6">
          <div className="h-12 w-12 rounded-full bg-[#392599] flex items-center justify-center mx-auto mb-3">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            {needsConfirmation ? 'Verify Your Email' : 'Create Your Account'}
          </h2>
          <p className="text-gray-500 text-sm">
            {needsConfirmation
              ? `Enter the code sent to ${inviteData.email || email}`
              : `You've been invited to join ${customerName}`}
          </p>
        </div>

        {/* Form */}
        <div className="px-6 pb-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {needsConfirmation ? (
            <form onSubmit={handleConfirmSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label>Confirmation Code</Label>
                <Input
                  type="text"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  required
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#392599] hover:bg-[#4a2fb3] rounded-full py-6"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verify & Continue
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Customer (locked) */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Organization
                </Label>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl text-gray-700">
                  {customerName}
                </div>
              </div>

              {/* Email - locked if specified in invite, editable otherwise */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                {inviteData.email ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl text-gray-700">
                    {inviteData.email}
                  </div>
                ) : (
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="rounded-xl"
                  />
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  minLength={8}
                  className="rounded-xl"
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Confirm Password
                </Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  minLength={8}
                  className="rounded-xl"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#392599] hover:bg-[#4a2fb3] rounded-full py-6"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          )}

          <p className="text-xs text-center text-gray-400 mt-4">
            By continuing, you agree to our terms of service
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// Hook to check if there's a pending invite
export function usePendingInvite() {
  const [hasInvite, setHasInvite] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteCode = urlParams.get('invite') || sessionStorage.getItem(INVITE_CODE_KEY);
    setHasInvite(!!inviteCode);
  }, []);

  return hasInvite;
}
