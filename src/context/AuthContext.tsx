import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { apiClient } from '../lib/api';
import { useToast } from './ToastContext';

export type UserPlan = 'free' | 'pro' | 'career_max';

export interface SubscriptionInfo {
  planId: UserPlan;
  status: 'active' | 'inactive';
  credits: number;
  mode: 'test' | 'live';
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isLoggedIn: boolean;
  credits: number;
  plan: UserPlan;
  isPlanLocked: boolean;
  subscription: SubscriptionInfo;
  refreshCredits: () => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ success: boolean; error?: string; code?: 'USER_EXISTS'; session?: any; user?: any }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; code?: 'EMAIL_NOT_CONFIRMED' | 'INVALID_CREDENTIALS' }>;
  resendConfirmation: (email: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [credits, setCredits] = useState<number>(10);
  const [plan, setPlan] = useState<UserPlan>('free');
  const { toast } = useToast();
  // Under the credit-only model, all features are unlocked for all plans.
  const isPlanLocked = false;

  const fetchUserSubscriptionAndCredits = useCallback(async (userId: string, userMetadataPlan?: string) => {
    try {
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('plan_id, status, updated_at')
        .eq('user_id', userId)
        .maybeSingle();

      let { data: profileData } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .maybeSingle();

      if (!profileData) {
        // If database was freshly reset or profile is missing, recover via ensure_user_profile RPC
        try {
          const { data: recovered } = await supabase.rpc('ensure_user_profile', { p_user_id: userId });
          if (recovered && typeof recovered.credits === 'number') {
            profileData = { credits: recovered.credits };
          }
        } catch (rpcErr) {
          console.warn('Notice ensuring user profile:', rpcErr);
        }
      }

      let detectedPlan: UserPlan = 'free';
      if (subData?.plan_id && ['free', 'pro', 'career_max', 'starter'].includes(subData.plan_id)) {
        detectedPlan = (subData.plan_id === 'starter' ? 'free' : subData.plan_id) as UserPlan;
      } else if (userMetadataPlan && ['free', 'pro', 'career_max', 'starter'].includes(userMetadataPlan)) {
        detectedPlan = (userMetadataPlan === 'starter' ? 'free' : userMetadataPlan) as UserPlan;
      }

      setPlan(detectedPlan);

      if (profileData && typeof profileData.credits === 'number') {
        setCredits(profileData.credits);
      } else {
        const defaultCreds = detectedPlan === 'pro' ? 50 : detectedPlan === 'career_max' ? 150 : 10;
        setCredits(defaultCreds);
      }
    } catch (err) {
      console.warn('Error retrieving subscription or credits:', err);
    }
  }, []);

  const refreshCredits = useCallback(async () => {
    if (!user) return;
    try {
      const meData = await apiClient.getMe();
      if (meData && typeof meData.credits === 'number') {
        setCredits(meData.credits);
        return;
      }

      let { data } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .maybeSingle();

      if (!data) {
        try {
          const { data: recovered } = await supabase.rpc('ensure_user_profile', { p_user_id: user.id });
          if (recovered && typeof recovered.credits === 'number') {
            data = { credits: recovered.credits };
          }
        } catch {
          // ignore
        }
      }

      if (data && typeof data.credits === 'number') {
        setCredits(data.credits);
      }
    } catch (err) {
      console.warn('Could not refresh credits from backend:', err);
    }
  }, [user]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userError || !userData.user) {
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setPlan('free');
            setCredits(10);
            localStorage.removeItem('supabase_access_token');
            localStorage.removeItem('resumeiq_is_logged_in');
          } else {
            setSession(session);
            setUser(userData.user);
            if (session.access_token) {
              localStorage.setItem('supabase_access_token', session.access_token);
              localStorage.setItem('resumeiq_is_logged_in', 'true');
            }
            await fetchUserSubscriptionAndCredits(userData.user.id, userData.user.user_metadata?.plan);
          }
        } else {
          setSession(null);
          setUser(null);
          setPlan('free');
          setCredits(10);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.access_token) {
        localStorage.setItem('supabase_access_token', currentSession.access_token);
        localStorage.setItem('resumeiq_is_logged_in', 'true');
      } else {
        localStorage.removeItem('supabase_access_token');
        localStorage.removeItem('resumeiq_is_logged_in');
      }

      if (currentSession?.user) {
        await fetchUserSubscriptionAndCredits(currentSession.user.id, currentSession.user.user_metadata?.plan);
      } else {
        setPlan('free');
        setCredits(10);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserSubscriptionAndCredits]);

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = fullName?.trim() || cleanEmail.split('@')[0];

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: cleanName,
          },
        },
      });

      if (error) {
        const msg = error.message.toLowerCase().includes('already registered')
          ? 'An account with this email already exists. Please log in instead.'
          : error.message.toLowerCase().includes('rate limit')
          ? 'Too many attempts. Please wait a few minutes and try again.'
          : error.message;
        toast.error(msg, { title: 'Signup Failed' });
        return { success: false, error: msg };
      }

      // Supabase (with email confirmation ON) does NOT return an error for an
      // already-registered email; it returns a fake user with no identities.
      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        const msg = 'An account with this email already exists. Please log in, or use "Forgot password".';
        toast.error(msg, { title: 'Email already registered' });
        return { success: false, error: msg, code: 'USER_EXISTS' as const };
      }

      // Profile, subscription and the 10 free credits are created by the
      // DB trigger `handle_new_user`, so the client does not write them.

      if (data?.session) {
        toast.success('Your account is ready.', { title: 'Welcome' });
        return { success: true, session: data.session, user: data.user };
      }

      toast.success('Please check your email and confirm your email address to continue.', { title: 'Signup successful' });
      return { success: true, session: data?.session, user: data?.user };
    } catch (err: any) {
      toast.error(err.message || 'An error occurred during signup.', { title: 'Signup Error' });
      return { success: false, error: err.message };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const targetEmail = email.trim().toLowerCase();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password,
      });

      if (error) {
        const code = (error as any).code as string | undefined;
        if (code === 'email_not_confirmed' || error.message.toLowerCase().includes('not confirmed')) {
          const msg = 'Please verify your email first. Check your inbox (and spam), or resend the link.';
          toast.error(msg, { title: 'Email not verified' });
          return { success: false, error: msg, code: 'EMAIL_NOT_CONFIRMED' as const };
        }
        if (code === 'invalid_credentials' || error.message.toLowerCase().includes('invalid login')) {
          const msg = 'Email or password is incorrect. If you forgot it, use "Forgot password".';
          toast.error(msg, { title: 'Login failed' });
          return { success: false, error: msg, code: 'INVALID_CREDENTIALS' as const };
        }
        toast.error(error.message, { title: 'Authentication Failed' });
        return { success: false, error: error.message };
      }

      if (data?.session?.access_token) {
        localStorage.setItem('supabase_access_token', data.session.access_token);
        localStorage.setItem('resumeiq_is_logged_in', 'true');
      }

      if (data?.user) {
        await fetchUserSubscriptionAndCredits(data.user.id, data.user.user_metadata?.plan);
      }

      toast.success('Successfully logged into Resume Screening System.', { title: 'Welcome Back' });
      return { success: true };
    } catch (err: any) {
      toast.error(err.message || 'Failed to sign in.', { title: 'Sign In Error' });
      return { success: false, error: err.message };
    }
  };

  const resendConfirmation = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      if (error) {
        const msg = error.message.toLowerCase().includes('rate limit')
          ? 'Too many emails sent. Please wait a few minutes and try again.'
          : error.message;
        toast.error(msg, { title: 'Could not resend' });
        return { success: false, error: msg };
      }
      toast.success('Verification link sent again. Check inbox and spam.', { title: 'Email sent' });
      return { success: true };
    } catch (err: any) {
      toast.error(err.message || 'Could not resend email.');
      return { success: false, error: err.message };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        }
      });
      if (error) {
        toast.error(error.message, { title: 'Google Sign In Failed' });
      }
    } catch (err: any) {
      toast.error(err.message || 'Google Sign In failed.');
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('supabase_access_token');
      localStorage.removeItem('resumeiq_is_logged_in');
      setUser(null);
      setSession(null);
      setPlan('free');
      setCredits(10);
      toast.info('Signed out of Resume Screening System.');
    } catch (err: any) {
      console.error('Error signing out:', err);
    }
  };

  const resetPasswordForEmail = async (email: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo,
      });

      if (error) {
        let userMsg = 'Unable to send reset email. Please try again.';
        if (error.message.toLowerCase().includes('rate limit')) {
          userMsg = 'Too many reset requests. Please wait a moment before trying again.';
        } else if (error.message.toLowerCase().includes('valid email')) {
          userMsg = 'Please enter a valid email address.';
        }
        toast.error(userMsg, { title: 'Reset Request Failed' });
        return { success: false, error: userMsg };
      }

      toast.success("We've sent a password reset link to your email address.", { title: 'Check your email' });
      return { success: true };
    } catch (err: any) {
      const userMsg = 'Unable to send reset email. Please try again.';
      toast.error(userMsg, { title: 'Reset Request Failed' });
      return { success: false, error: userMsg };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        let userMsg = error.message || 'Unable to update password. Please try again.';
        if (error.message.toLowerCase().includes('same as')) {
          userMsg = 'New password cannot be the same as your old password.';
        } else if (error.message.toLowerCase().includes('expired') || error.message.toLowerCase().includes('invalid')) {
          userMsg = 'This reset link is invalid or has expired. Please request a new one.';
        } else if (error.message.toLowerCase().includes('characters')) {
          userMsg = 'Password must be at least 6 characters long.';
        }
        toast.error(userMsg, { title: 'Update Failed' });
        return { success: false, error: userMsg };
      }

      toast.success('Your Resume Screening System password has been changed successfully.', { title: 'Password updated' });
      return { success: true };
    } catch (err: any) {
      const userMsg = err.message || 'Unable to update password. Please try again.';
      toast.error(userMsg, { title: 'Update Failed' });
      return { success: false, error: userMsg };
    }
  };

  const subscription: SubscriptionInfo = {
    planId: plan,
    status: 'active',
    credits,
    mode: 'test',
    updatedAt: new Date().toISOString()
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isLoggedIn: !!user,
        credits,
        plan,
        isPlanLocked,
        subscription,
        refreshCredits,
        signUp,
        signIn,
        resendConfirmation,
        signInWithGoogle,
        signOut,
        resetPasswordForEmail,
        updatePassword,
      }}
    >
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
