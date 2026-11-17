import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowRight, ArrowLeft, Loader2, Sparkles, Mail, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence, useAnimate, useReducedMotion, type Variants } from 'motion/react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { LogoMark } from './Logo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup' | 'forgot-password';
  onLoginSuccess?: () => void;
}

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/* ---------- Text field: focus ring, inline error (slide + one shake), optional show/hide ---------- */
interface AuthFieldProps {
  id: string;
  label: string;
  type: 'text' | 'email' | 'password';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  error?: string;
  autoComplete: string;
  inputRef?: React.Ref<HTMLInputElement>;
  reduceMotion: boolean;
}

const AuthField: React.FC<AuthFieldProps> = ({
  id, label, type, value, onChange, placeholder, error, autoComplete, inputRef, reduceMotion,
}) => {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === 'password';
  const errorId = `${id}-error`;

  // one tiny horizontal shake each time a new error message appears
  useEffect(() => {
    if (error && !reduceMotion && scope.current) {
      animate(scope.current, { x: [0, -5, 5, -3, 2, 0] }, { duration: 0.34, ease: 'easeOut' });
    }
  }, [error, reduceMotion, animate, scope]);

  return (
    <div>
      <label htmlFor={id} className="block text-[13px] font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
        {label}
      </label>
      <div ref={scope} className="relative">
        <input
          id={id}
          ref={inputRef}
          type={isPassword && revealed ? 'text' : type}
          required
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`w-full h-11 px-3.5 ${isPassword ? 'pr-11' : ''} rounded-xl border bg-white dark:bg-neutral-950/50 text-base sm:text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-[border-color,box-shadow,background-color] duration-200 focus:ring-4 ${
            error
              ? 'border-red-500/80 dark:border-red-500/70 focus:border-red-500 focus:ring-red-500/15'
              : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500/15 dark:focus:ring-purple-400/20'
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? 'Hide password' : 'Show password'}
            aria-pressed={revealed}
            aria-controls={id}
            className="absolute inset-y-0 right-0 w-11 flex items-center justify-center rounded-r-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 focus-visible:outline-none focus-visible:text-purple-600 dark:focus-visible:text-purple-400 cursor-pointer"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={revealed ? 'hide' : 'show'}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6, rotate: -30 }}
                animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, rotate: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6, rotate: 30 }}
                transition={{ duration: 0.14 }}
                className="flex"
              >
                {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </motion.span>
            </AnimatePresence>
          </button>
        )}
      </div>
      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            id={errorId}
            role="alert"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4, height: 0 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, height: 'auto' }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
            className="text-red-600 dark:text-red-400 text-xs font-medium overflow-hidden"
          >
            <span className="block pt-1.5">{error}</span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ---------- Primary CTA: brand accent, hover lift, press scale, spinner swap ---------- */
interface PrimaryButtonProps {
  disabled: boolean;
  loading: boolean;
  label: string;
  type?: 'submit' | 'button';
  onClick?: () => void;
  icon?: 'arrow-right' | 'arrow-left';
  reduceMotion: boolean;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({ disabled, loading, label, type = 'submit', onClick, icon = 'arrow-right', reduceMotion }) => {
  const idle = !disabled && !loading;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`group relative w-full h-11 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-[background-color,box-shadow,transform,color] duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-500/25 ${
        loading
          ? 'bg-purple-600 text-white/90 cursor-wait shadow-sm'
          : disabled
            ? 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700/60 cursor-not-allowed'
            : 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.14)] hover:shadow-[0_6px_16px_-4px_rgba(126,34,206,0.45)] motion-safe:hover:-translate-y-px motion-safe:active:translate-y-0 motion-safe:active:scale-[0.98]'
      }`}
    >
      {icon === 'arrow-left' && !loading && <ArrowLeft className="w-4 h-4" />}
      <span>{label}</span>
      {icon === 'arrow-right' && (
        <span className="relative flex w-4 h-4 items-center justify-center">
          <AnimatePresence mode="wait" initial={false}>
            {loading ? (
              <motion.span key="spin" className="flex" initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.14 }}>
                <Loader2 className="w-4 h-4 animate-spin" />
              </motion.span>
            ) : (
              <motion.span key="arrow" className="flex" initial={{ opacity: 0, x: reduceMotion ? 0 : -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.14 }}>
                <ArrowRight className={`w-4 h-4 transition-transform duration-200 ${idle ? 'motion-safe:group-hover:translate-x-0.5' : ''}`} />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      )}
    </button>
  );
};

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login', onLoginSuccess }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot-password'>(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedConsent, setAcceptedConsent] = useState(false);
  const [showGoogleComingSoon, setShowGoogleComingSoon] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);

  // UI-only refs/state (no auth logic)
  const reduceMotion = !!useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | 'auto'>('auto');
  const firstRevealRef = useRef(true);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const { toast } = useToast();
  const { signIn, signUp, resetPasswordForEmail, resendConfirmation } = useAuth();

  useEffect(() => {
    setMode(initialMode);
    setResetEmailSent(false);
  }, [initialMode, isOpen]);

  // Esc to close, focus trap, restore focus on close
  useEffect(() => {
    if (!isOpen) {
      firstRevealRef.current = true;
      return;
    }
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !cardRef.current) return;
      const nodes: HTMLElement[] = [];
      cardRef.current.querySelectorAll<HTMLElement>(FOCUSABLE).forEach((n) => {
        if (n.offsetParent !== null) nodes.push(n);
      });
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && (document.activeElement === first || !cardRef.current.contains(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [isOpen]);

  // Autofocus the first field whenever the modal opens or the view changes
  useEffect(() => {
    if (!isOpen) return;
    const t = window.setTimeout(() => {
      const target =
        cardRef.current?.querySelector<HTMLElement>('input:not([type="checkbox"])') ?? cardRef.current;
      target?.focus({ preventScroll: true });
    }, reduceMotion ? 0 : 180);
    return () => window.clearTimeout(t);
  }, [isOpen, mode, resetEmailSent, reduceMotion]);

  // Measure content so the card height animates smoothly between views
  useLayoutEffect(() => {
    if (!isOpen || !contentRef.current) return;
    const el = contentRef.current;
    const ro = new ResizeObserver(() => setContentHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [isOpen]);

  const handleSwitchMode = (newMode: 'login' | 'signup' | 'forgot-password') => {
    setMode(newMode);
    setAcceptedConsent(false);
    setShowGoogleComingSoon(false);
    setResetEmailSent(false);
    setErrors({});
    setPassword('');
    setConfirmPassword('');
  };

  const handleGoogleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowGoogleComingSoon(true);
  };

  const handleContinueWithEmail = () => {
    setShowGoogleComingSoon(false);
    setTimeout(() => {
      emailInputRef.current?.focus();
    }, 50);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (mode === 'signup') {
      if (!fullName.trim()) {
        newErrors.fullName = 'Full name is required';
      }
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (mode === 'forgot-password') {
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (mode === 'signup') {
      if (!confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode !== 'forgot-password' && !acceptedConsent) {
      return; // Block authentication if consent checkbox is unchecked
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    if (mode === 'forgot-password') {
      const result = await resetPasswordForEmail(email.trim());
      setIsSubmitting(false);
      if (result.success) {
        setResetEmailSent(true);
      }
      return;
    }

    if (mode === 'login') {
      const result = await signIn(email, password);
      setIsSubmitting(false);
      if (!result.success && result.code === 'EMAIL_NOT_CONFIRMED') {
        void resendConfirmation(email);
      }
      if (result.success) {
        onClose();
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      }
    } else {
      const result = await signUp(email, password, fullName.trim());
      setIsSubmitting(false);
      if (!result.success && result.code === 'USER_EXISTS') {
        // Keep the email, move the user to the login view
        setMode('login');
        setPassword('');
        setConfirmPassword('');
        return;
      }
      if (result.success) {
        if (result.session) {
          onClose();
          if (onLoginSuccess) {
            onLoginSuccess();
          }
        } else {
          // Email confirmation is required before sign in
          setMode('login');
          setPassword('');
          setConfirmPassword('');
          setAcceptedConsent(false);
        }
      }
    }
  };

  /* ---------- Motion variants (reduced motion = opacity only) ---------- */
  const backdropVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.22, ease: 'easeOut' } },
    exit: { opacity: 0, transition: { duration: 0.18, ease: 'easeIn', when: 'afterChildren' } },
  };
  const cardVariants: Variants = reduceMotion
    ? {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { duration: 0.2 } },
        exit: { opacity: 0, transition: { duration: 0.12 } },
      }
    : {
        hidden: { opacity: 0, scale: 0.97, y: 12 },
        show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 420, damping: 34, mass: 0.9 } },
        exit: { opacity: 0, scale: 0.98, y: 8, transition: { duration: 0.15, ease: 'easeIn' } },
      };
  const firstReveal = firstRevealRef.current;
  const viewVariants: Variants = {
    hidden: reduceMotion ? { opacity: 0 } : { opacity: 0, x: 10 },
    show: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.2,
        ease: EASE_OUT,
        staggerChildren: firstReveal ? 0.05 : 0,
        delayChildren: firstReveal ? 0.06 : 0,
      },
    },
    exit: reduceMotion
      ? { opacity: 0, transition: { duration: 0.12 } }
      : { opacity: 0, x: -10, transition: { duration: 0.14, ease: 'easeIn' } },
  };
  const itemVariants: Variants = {
    hidden: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 },
    show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE_OUT } },
  };

  const viewKey = mode === 'forgot-password' ? (resetEmailSent ? 'forgot-sent' : 'forgot') : mode;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="auth-backdrop"
          variants={backdropVariants}
          initial="hidden"
          animate="show"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-sm"
        >
          <motion.div
            ref={cardRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
            aria-describedby="auth-modal-desc"
            tabIndex={-1}
            variants={cardVariants}
            className="relative w-full max-w-[420px] max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-[0_1px_2px_rgba(28,25,23,0.04),0_12px_32px_-8px_rgba(28,25,23,0.14),0_40px_80px_-24px_rgba(28,25,23,0.22)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_12px_32px_-8px_rgba(0,0,0,0.5),0_40px_80px_-24px_rgba(0,0,0,0.6)] outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* faint top highlight */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-neutral-300/70 to-transparent dark:via-white/15" />

            <button
              type="button"
              onClick={onClose}
              className="absolute top-2.5 right-2.5 z-10 w-11 h-11 flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-500/20 cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-[18px] h-[18px]" />
            </button>

            {/* height animates between views; padding lives inside so focus rings never clip */}
            <motion.div
              initial={false}
              animate={{ height: contentHeight }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.26, ease: EASE_OUT }}
              className="overflow-hidden"
            >
              <div ref={contentRef} className="px-6 pt-8 pb-6 sm:px-8 sm:pt-9 sm:pb-7">
                {/* Brand mark */}
                <motion.div
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, ease: EASE_OUT, delay: 0.04 }}
                  className="flex justify-center mb-5"
                >
                  <LogoMark className="w-12 h-12 drop-shadow-[0_4px_10px_rgba(99,102,241,0.18)]" />
                </motion.div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={viewKey}
                    variants={viewVariants}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    onAnimationComplete={(def) => {
                      if (def === 'show') firstRevealRef.current = false;
                    }}
                  >
                    {/* Heading */}
                    <motion.div variants={itemVariants} className="text-center mb-6">
                      <h2 id="auth-modal-title" className="text-[28px] leading-tight font-serif-title font-normal tracking-tight text-neutral-900 dark:text-white">
                        {mode === 'forgot-password'
                          ? (resetEmailSent ? 'Check your email' : 'Reset your password')
                          : mode === 'login'
                            ? 'Sign in to your account'
                            : 'Create your Resume Screening System account'
                        }
                      </h2>
                      <p id="auth-modal-desc" className="text-sm text-neutral-600 dark:text-neutral-400 mt-1.5">
                        {mode === 'forgot-password'
                          ? (resetEmailSent
                              ? 'We have sent password reset instructions to your email.'
                              : "Enter your email and we'll send you a secure password reset link.")
                          : mode === 'login'
                            ? 'Access your AI resume reports and job matches'
                            : 'Start with 10 free AI analysis credits today'
                        }
                      </p>
                    </motion.div>

                    {/* FORGOT PASSWORD: SUCCESS STATE */}
                    {mode === 'forgot-password' && resetEmailSent ? (
                      <div className="space-y-5">
                        <motion.div variants={itemVariants} className="flex flex-col items-center justify-center text-center p-6 rounded-xl bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200/80 dark:border-neutral-800 space-y-3">
                          <div className="w-12 h-12 rounded-full bg-white dark:bg-neutral-900 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-neutral-200 dark:border-neutral-800 shadow-sm">
                            <Mail className="w-5 h-5" />
                          </div>
                          <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                            We've sent a password reset link to <span className="font-semibold text-neutral-900 dark:text-white break-all">{email}</span>. Click the link in the email to set a new password.
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            If you don't see the email, please check your spam or junk folder.
                          </p>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                          <PrimaryButton
                            type="button"
                            onClick={() => handleSwitchMode('login')}
                            disabled={false}
                            loading={false}
                            label="Back to Sign In"
                            icon="arrow-left"
                            reduceMotion={reduceMotion}
                          />
                        </motion.div>
                      </div>
                    ) : mode === 'forgot-password' ? (
                      /* FORGOT PASSWORD FORM */
                      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                        <motion.div variants={itemVariants}>
                          <AuthField
                            id="auth-email"
                            label="Email address"
                            type="email"
                            inputRef={emailInputRef}
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                            }}
                            placeholder="name@company.com"
                            autoComplete="email"
                            error={errors.email}
                            reduceMotion={reduceMotion}
                          />
                        </motion.div>

                        <motion.div variants={itemVariants}>
                          <PrimaryButton
                            disabled={isSubmitting}
                            loading={isSubmitting}
                            label={isSubmitting ? 'Sending reset link...' : 'Send Reset Link'}
                            reduceMotion={reduceMotion}
                          />
                        </motion.div>

                        <motion.div variants={itemVariants} className="text-center pt-1">
                          <button
                            type="button"
                            onClick={() => handleSwitchMode('login')}
                            className="inline-flex items-center gap-1.5 min-h-11 px-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white font-medium rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-500/20 cursor-pointer"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Back to Sign In</span>
                          </button>
                        </motion.div>
                      </form>
                    ) : (
                      /* LOGIN & SIGNUP FORMS */
                      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                        {/* Google OAuth Button */}
                        <motion.div variants={itemVariants}>
                          <button
                            type="button"
                            onClick={handleGoogleClick}
                            className="w-full h-11 flex items-center justify-center gap-2.5 px-4 rounded-xl bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 text-sm font-medium border border-neutral-200 dark:border-neutral-700/80 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-neutral-300 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 hover:shadow-md transition-[border-color,box-shadow,background-color] duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-500/20 cursor-pointer"
                          >
                            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" aria-hidden="true">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                            </svg>
                            <span>Continue with Google</span>
                          </button>
                        </motion.div>

                        {/* Google Sign-In Coming Soon Notification Card */}
                        <AnimatePresence>
                          {showGoogleComingSoon && (
                            <motion.div
                              initial={{ opacity: 0, y: -6, height: 0 }}
                              animate={{ opacity: 1, y: 0, height: 'auto' }}
                              exit={{ opacity: 0, y: -6, height: 0 }}
                              transition={{ duration: 0.18, ease: 'easeInOut' }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-white dark:bg-neutral-900 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-neutral-200 dark:border-neutral-800">
                                      <Sparkles className="w-3.5 h-3.5" />
                                    </div>
                                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                                      Google Sign-In Coming Soon
                                    </h4>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setShowGoogleComingSoon(false)}
                                    className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors p-1.5 -m-1 rounded-md cursor-pointer"
                                    aria-label="Dismiss notice"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                                  Google sign-in is currently being finalized. Please sign in manually using your email and password for now.
                                </p>

                                <button
                                  type="button"
                                  onClick={handleContinueWithEmail}
                                  className="w-full h-10 px-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 hover:border-purple-400 dark:hover:border-purple-500 text-neutral-900 dark:text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <span>Continue with Email</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <motion.div variants={itemVariants} className="flex items-center gap-3 py-1" aria-hidden="true">
                          <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
                          <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-neutral-500 dark:text-neutral-400">
                            or
                          </span>
                          <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
                        </motion.div>

                        {/* Full Name (Sign Up only) */}
                        {mode === 'signup' && (
                          <motion.div variants={itemVariants}>
                            <AuthField
                              id="auth-full-name"
                              label="Full Name"
                              type="text"
                              value={fullName}
                              onChange={(e) => {
                                setFullName(e.target.value);
                                if (errors.fullName) setErrors(prev => ({ ...prev, fullName: '' }));
                              }}
                              placeholder="Enter your name"
                              autoComplete="name"
                              error={errors.fullName}
                              reduceMotion={reduceMotion}
                            />
                          </motion.div>
                        )}

                        {/* Email Address */}
                        <motion.div variants={itemVariants}>
                          <AuthField
                            id="auth-email"
                            label="Email address"
                            type="email"
                            inputRef={emailInputRef}
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                            }}
                            placeholder="name@company.com"
                            autoComplete="email"
                            error={errors.email}
                            reduceMotion={reduceMotion}
                          />
                        </motion.div>

                        {/* Password */}
                        <motion.div variants={itemVariants}>
                          <AuthField
                            id="auth-password"
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value);
                              if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                            }}
                            placeholder={mode === 'signup' ? 'Create a strong password' : '••••••••'}
                            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                            error={errors.password}
                            reduceMotion={reduceMotion}
                          />
                        </motion.div>

                        {/* Confirm Password (Sign Up only) */}
                        {mode === 'signup' && (
                          <motion.div variants={itemVariants}>
                            <AuthField
                              id="auth-confirm-password"
                              label="Confirm Password"
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
                              }}
                              placeholder="Confirm your password"
                              autoComplete="new-password"
                              error={errors.confirmPassword}
                              reduceMotion={reduceMotion}
                            />
                          </motion.div>
                        )}

                        {mode === 'login' && (
                          <motion.div variants={itemVariants} className="flex justify-end -mt-1">
                            <button
                              type="button"
                              onClick={() => handleSwitchMode('forgot-password')}
                              className="text-[13px] font-medium text-purple-700 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 rounded-md px-1 py-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-500/20 cursor-pointer"
                            >
                              Forgot password?
                            </button>
                          </motion.div>
                        )}

                        {/* Consent (unchanged logic: required before submit) */}
                        <motion.div variants={itemVariants}>
                          <label className="flex items-start gap-3 py-1 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={acceptedConsent}
                              onChange={(e) => setAcceptedConsent(e.target.checked)}
                              className="mt-0.5 w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 accent-purple-600 dark:[color-scheme:dark] shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-500/25"
                            />
                            <span>
                              By {mode === 'login' ? 'signing in' : 'signing up'}, you agree to our{' '}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  onClose();
                                  navigate('/terms');
                                }}
                                className="underline underline-offset-2 decoration-neutral-300 dark:decoration-neutral-600 text-neutral-800 dark:text-neutral-200 hover:text-purple-700 dark:hover:text-purple-400 hover:decoration-current cursor-pointer font-medium"
                              >
                                Terms of Service
                              </button>{' '}
                              &{' '}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  onClose();
                                  navigate('/privacy');
                                }}
                                className="underline underline-offset-2 decoration-neutral-300 dark:decoration-neutral-600 text-neutral-800 dark:text-neutral-200 hover:text-purple-700 dark:hover:text-purple-400 hover:decoration-current cursor-pointer font-medium"
                              >
                                Privacy Policy
                              </button>
                              .
                            </span>
                          </label>
                        </motion.div>

                        {/* Submit Button (Disabled unless consent checkbox is checked) */}
                        <motion.div variants={itemVariants}>
                          <PrimaryButton
                            disabled={!acceptedConsent || isSubmitting}
                            loading={isSubmitting}
                            label={isSubmitting
                              ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
                              : (mode === 'login' ? 'Sign In' : 'Create Account')}
                            reduceMotion={reduceMotion}
                          />
                        </motion.div>

                        {/* Form Footer Switch */}
                        <motion.div variants={itemVariants} className="pt-4 mt-1 border-t border-neutral-100 dark:border-neutral-800/70 text-center">
                          <button
                            type="button"
                            onClick={() => handleSwitchMode(mode === 'login' ? 'signup' : 'login')}
                            className="min-h-11 px-2 text-sm text-neutral-600 dark:text-neutral-400 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-500/20 cursor-pointer"
                          >
                            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                            <span className="font-semibold text-neutral-900 dark:text-white underline-offset-4 hover:underline">
                              {mode === 'login' ? 'Sign up' : 'Sign in'}
                            </span>
                          </button>
                        </motion.div>
                      </form>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
