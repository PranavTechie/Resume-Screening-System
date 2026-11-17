import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

type ResetStatus = 'checking' | 'ready' | 'updating' | 'success' | 'invalid_session';

interface ResetPasswordPageProps {
  onOpenAuth?: (mode: 'login' | 'signup' | 'forgot-password') => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onOpenAuth }) => {
  const navigate = useNavigate();
  const { updatePassword, signOut } = useAuth();

  const [status, setStatus] = useState<ResetStatus>('checking');
  const statusRef = useRef<ResetStatus>('checking');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  const updateStatus = (newStatus: ResetStatus) => {
    // CRITICAL: Once success is reached in this mounted instance, do not allow async checks to overwrite it
    if (statusRef.current === 'success') {
      return;
    }
    statusRef.current = newStatus;
    setStatus(newStatus);
  };

  useEffect(() => {
    if (statusRef.current === 'success') {
      return;
    }

    let isCancelled = false;
    let sessionTimeoutId: ReturnType<typeof setTimeout> | null = null;

    const hash = window.location.hash;
    const searchParams = new URLSearchParams(window.location.search);

    // Check URL hash/query for recovery errors (e.g. #error=access_denied&error_code=otp_expired)
    if (hash.includes('error=') || searchParams.has('error')) {
      const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
      const errorCode = hashParams.get('error_code') || searchParams.get('error_code');
      const errorDesc = hashParams.get('error_description') || searchParams.get('error_description');

      if (errorCode === 'otp_expired' || (errorDesc && errorDesc.toLowerCase().includes('expired'))) {
        setSessionError('This password reset link is invalid or has expired. Please request a new one.');
      } else {
        setSessionError(errorDesc?.replace(/\+/g, ' ') || 'This password reset link is invalid or has expired.');
      }
      updateStatus('invalid_session');
      return;
    }

    const verifyInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isCancelled || statusRef.current === 'success') return;

        if (session || hash.includes('access_token') || hash.includes('type=recovery')) {
          updateStatus('ready');
          return;
        }

        // Give Supabase a short window to parse hash params
        sessionTimeoutId = setTimeout(async () => {
          if (isCancelled || statusRef.current === 'success') return;
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (isCancelled || statusRef.current === 'success') return;

          if (retrySession || window.location.hash.includes('access_token')) {
            updateStatus('ready');
          } else {
            setSessionError('No active password reset session found. Please request a new reset link.');
            updateStatus('invalid_session');
          }
        }, 800);
      } catch (err) {
        if (!isCancelled && statusRef.current !== 'success') {
          setSessionError('No active password reset session found. Please request a new reset link.');
          updateStatus('invalid_session');
        }
      }
    };

    verifyInitialSession();

    // Listen for Supabase auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (isCancelled || statusRef.current === 'success') return;

      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && currentSession)) {
        setSessionError(null);
        updateStatus('ready');
      }
    });

    return () => {
      isCancelled = true;
      if (sessionTimeoutId) {
        clearTimeout(sessionTimeoutId);
      }
      subscription.unsubscribe();
    };
  }, []);

  const validate = (): boolean => {
    const newErrors: { password?: string; confirmPassword?: string } = {};

    if (!newPassword) {
      newErrors.password = 'New password is required';
    } else if (newPassword.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    updateStatus('updating');
    const result = await updatePassword(newPassword);

    if (result.success) {
      // Authoritative success: lock into success status
      statusRef.current = 'success';
      setStatus('success');
    } else {
      if (statusRef.current !== 'success') {
        updateStatus('ready');
      }
    }
  };

  const handleContinueToSignIn = async () => {
    statusRef.current = 'checking';
    setStatus('checking');
    await signOut();
    navigate('/login', { replace: true });
    if (onOpenAuth) {
      onOpenAuth('login');
    }
  };

  const handleRequestNewLink = () => {
    statusRef.current = 'checking';
    setStatus('checking');
    navigate('/forgot-password', { replace: true });
    if (onOpenAuth) {
      onOpenAuth('forgot-password');
    }
  };

  const isSubmitting = status === 'updating';

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-neutral-900/10">
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden p-8">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-600/10 border border-purple-500/20 text-neutral-900 dark:text-neutral-100 font-semibold text-xs mb-4">
            <img src="/apple-touch-icon.png" alt="Resume Screening System Logo" className="w-5 h-5 rounded object-contain" />
            Resume Screening System Security
          </div>

          <h2 className="text-2xl font-serif-title font-normal tracking-tight text-neutral-900 dark:text-white">
            {status === 'success'
              ? 'Password updated'
              : status === 'invalid_session'
                ? 'Invalid Reset Link'
                : 'Create a new password'
            }
          </h2>
          
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5">
            {status === 'success'
              ? 'Your Resume Screening System password has been changed successfully.'
              : status === 'invalid_session'
                ? (sessionError || 'No active password reset session found. Please request a new reset link.')
                : 'Enter a new password for your Resume Screening System account.'
            }
          </p>
        </div>

        {/* 1. CHECKING LOADING STATE */}
        {status === 'checking' && (
          <div className="flex flex-col items-center justify-center py-10 space-y-3">
            <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Verifying secure reset token...</p>
          </div>
        )}

        {/* 2. INVALID / EXPIRED SESSION STATE */}
        {status === 'invalid_session' && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center justify-center text-center p-6 rounded-xl bg-red-500/5 border border-red-500/20 space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                {sessionError || 'No active password reset session found. Please request a new reset link.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleRequestNewLink}
              className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Request New Reset Link</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 3. SUCCESS STATE */}
        {status === 'success' && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center justify-center text-center p-6 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-3">
              <div className="w-12 h-12 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                You can now sign in to your Resume Screening System account using your updated password.
              </p>
            </div>

            <button
              type="button"
              onClick={handleContinueToSignIn}
              className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Continue to Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 4. READY / UPDATING FORM */}
        {(status === 'ready' || status === 'updating') && (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* New Password */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                  }}
                  placeholder="At least 6 characters"
                  className={`w-full px-3 py-2 pr-10 bg-neutral-50 dark:bg-neutral-800/80 border rounded-lg text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 transition-all ${
                    errors.password 
                      ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' 
                      : 'border-neutral-200 dark:border-neutral-700 focus:ring-purple-500/50 focus:border-purple-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1 font-medium">{errors.password}</p>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                  }}
                  placeholder="Re-enter your new password"
                  className={`w-full px-3 py-2 pr-10 bg-neutral-50 dark:bg-neutral-800/80 border rounded-lg text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 transition-all ${
                    errors.confirmPassword 
                      ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' 
                      : 'border-neutral-200 dark:border-neutral-700 focus:ring-purple-500/50 focus:border-purple-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1 font-medium">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-2.5 px-4 font-medium text-xs rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 ${
                isSubmitting
                  ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating password...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
