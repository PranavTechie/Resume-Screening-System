import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, Loader2, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface ToastOptions {
  title?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastMessage extends ToastOptions {
  id: string;
  type: ToastType;
  message: string;
  createdAt: number;
}

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (type: ToastType, message: string, options?: ToastOptions) => string;
  updateToast: (id: string, updates: Partial<ToastMessage>) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
  toast: {
    success: (message: string, options?: ToastOptions) => string;
    error: (message: string, options?: ToastOptions) => string;
    warning: (message: string, options?: ToastOptions) => string;
    info: (message: string, options?: ToastOptions) => string;
    loading: (message: string, options?: ToastOptions) => string;
    dismiss: (id?: string) => void;
    promise: <T>(
      promise: Promise<T>,
      messages: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((err: any) => string);
      },
      options?: ToastOptions
    ) => Promise<T>;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 3000,
  error: 6000,
  warning: 5000,
  info: 3500,
  loading: 0, // infinite until updated/dismissed
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const recentToastsRef = useRef<Map<string, number>>(new Map());

  // Clean up stale de-duplication entries
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      recentToastsRef.current.forEach((time, key) => {
        if (now - time > 2000) {
          recentToastsRef.current.delete(key);
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, options?: ToastOptions): string => {
      // Prevent duplicate identical toasts within 1.5s
      const dedupKey = `${type}:${message}`;
      const lastTime = recentToastsRef.current.get(dedupKey);
      const now = Date.now();

      if (lastTime && now - lastTime < 1500 && type !== 'loading') {
        // Return existing matching toast ID if present
        const existing = toasts.find((t) => t.type === type && t.message === message);
        if (existing) return existing.id;
      }

      recentToastsRef.current.set(dedupKey, now);

      const id = `toast-${now}-${Math.random().toString(36).substring(2, 7)}`;
      const duration = options?.duration ?? DEFAULT_DURATIONS[type];

      const newToast: ToastMessage = {
        id,
        type,
        message,
        createdAt: now,
        ...options,
      };

      setToasts((prev) => {
        // Max 5 toasts visible at once, keep newest
        const updated = [...prev, newToast];
        if (updated.length > 5) {
          return updated.slice(updated.length - 5);
        }
        return updated;
      });

      // Auto-dismiss if duration > 0
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [toasts, removeToast]
  );

  const updateToast = useCallback((id: string, updates: Partial<ToastMessage>) => {
    setToasts((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updated = { ...t, ...updates };
          const duration = updates.duration ?? (updates.type ? DEFAULT_DURATIONS[updates.type] : t.duration);
          if (duration && duration > 0) {
            setTimeout(() => {
              removeToast(id);
            }, duration);
          }
          return updated;
        }
        return t;
      })
    );
  }, [removeToast]);

  const toastHelpers = {
    success: useCallback((message: string, options?: ToastOptions) => addToast('success', message, options), [addToast]),
    error: useCallback((message: string, options?: ToastOptions) => addToast('error', message, options), [addToast]),
    warning: useCallback((message: string, options?: ToastOptions) => addToast('warning', message, options), [addToast]),
    info: useCallback((message: string, options?: ToastOptions) => addToast('info', message, options), [addToast]),
    loading: useCallback((message: string, options?: ToastOptions) => addToast('loading', message, options), [addToast]),
    dismiss: useCallback((id?: string) => {
      if (id) removeToast(id);
      else clearAll();
    }, [removeToast, clearAll]),
    promise: useCallback(
      async <T,>(
        promise: Promise<T>,
        messages: {
          loading: string;
          success: string | ((data: T) => string);
          error: string | ((err: any) => string);
        },
        options?: ToastOptions
      ): Promise<T> => {
        const id = addToast('loading', messages.loading, options);
        try {
          const data = await promise;
          const successMsg = typeof messages.success === 'function' ? messages.success(data) : messages.success;
          updateToast(id, { type: 'success', message: successMsg, duration: DEFAULT_DURATIONS.success });
          return data;
        } catch (err: any) {
          const errorMsg = typeof messages.error === 'function' ? messages.error(err) : messages.error;
          updateToast(id, { type: 'error', message: errorMsg, duration: DEFAULT_DURATIONS.error });
          throw err;
        }
      },
      [addToast, updateToast]
    ),
  };

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        updateToast,
        removeToast,
        clearAll,
        toast: toastHelpers,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Global standalone toast exporter for non-React or direct calls
let globalToastRef: ToastContextType['toast'] | null = null;

export const setGlobalToastRef = (toastObj: ToastContextType['toast']) => {
  globalToastRef = toastObj;
};

export const toast = {
  success: (message: string, options?: ToastOptions) => globalToastRef?.success(message, options) || '',
  error: (message: string, options?: ToastOptions) => globalToastRef?.error(message, options) || '',
  warning: (message: string, options?: ToastOptions) => globalToastRef?.warning(message, options) || '',
  info: (message: string, options?: ToastOptions) => globalToastRef?.info(message, options) || '',
  loading: (message: string, options?: ToastOptions) => globalToastRef?.loading(message, options) || '',
  dismiss: (id?: string) => globalToastRef?.dismiss(id),
  promise: <T,>(
    promise: Promise<T>,
    messages: { loading: string; success: string | ((data: T) => string); error: string | ((err: any) => string) },
    options?: ToastOptions
  ) => globalToastRef?.promise(promise, messages, options) ?? promise,
};

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  // Check reduced motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-[9999] pointer-events-none flex flex-col-reverse gap-2.5 max-w-full sm:max-w-md w-full"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ToastItem
            key={t.id}
            toast={t}
            onDismiss={onDismiss}
            prefersReducedMotion={prefersReducedMotion}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastItem: React.FC<{
  toast: ToastMessage;
  onDismiss: (id: string) => void;
  prefersReducedMotion: boolean;
}> = ({ toast: t, onDismiss, prefersReducedMotion }) => {
  const getIcon = () => {
    switch (t.type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 shrink-0" />;
      case 'info':
        return <Info className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400 shrink-0" />;
      case 'loading':
        return <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400 shrink-0 animate-spin" />;
    }
  };

  const getBorderColor = () => {
    switch (t.type) {
      case 'success':
        return 'border-emerald-500/30 dark:border-emerald-500/20';
      case 'error':
        return 'border-rose-500/30 dark:border-rose-500/20';
      case 'warning':
        return 'border-amber-500/30 dark:border-amber-500/20';
      case 'info':
      case 'loading':
        return 'border-purple-500/30 dark:border-purple-500/20';
    }
  };

  return (
    <motion.div
      layout={!prefersReducedMotion}
      initial={
        prefersReducedMotion
          ? { opacity: 0 }
          : { opacity: 0, y: 16, scale: 0.96 }
      }
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={
        prefersReducedMotion
          ? { opacity: 0 }
          : { opacity: 0, y: 8, scale: 0.95 }
      }
      transition={{
        duration: 0.25,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={`pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 rounded-xl bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border ${getBorderColor()} shadow-lg shadow-neutral-950/10 dark:shadow-black/60 relative overflow-hidden group w-full`}
    >
      {/* Subtle indicator bar on left */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${
          t.type === 'success'
            ? 'bg-emerald-500'
            : t.type === 'error'
            ? 'bg-rose-500'
            : t.type === 'warning'
            ? 'bg-amber-500'
            : 'bg-purple-600 dark:bg-purple-400'
        }`}
      />

      <div className="pt-0.5 pl-1">{getIcon()}</div>

      <div className="flex-1 min-w-0 pr-1">
        {t.title && (
          <h4 className="text-xs font-bold text-neutral-900 dark:text-white leading-tight mb-0.5">
            {t.title}
          </h4>
        )}
        <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-snug break-words">
          {t.message}
        </p>

        {t.action && (
          <button
            onClick={() => {
              t.action?.onClick();
              onDismiss(t.id);
            }}
            className="mt-2 text-xs font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 underline underline-offset-2 transition-colors cursor-pointer"
          >
            {t.action.label}
          </button>
        )}
      </div>

      <button
        onClick={() => onDismiss(t.id)}
        className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0 cursor-pointer"
        aria-label="Close notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
};

// Component helper to sync ref
export const ToastRefRegister: React.FC = () => {
  const { toast: toastObj } = useToast();
  useEffect(() => {
    setGlobalToastRef(toastObj);
  }, [toastObj]);
  return null;
};
