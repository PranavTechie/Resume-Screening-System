import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface PreferencesState {
  themeMode: ThemeMode;
  autoSaveDrafts: boolean;
  confirmBeforeAnalysis: boolean;
}

export interface ConfirmAnalysisOptions {
  title?: string;
  message?: string;
  creditCost?: number;
  onConfirm: () => Promise<void> | void;
}

interface ThemeContextType {
  themeMode: ThemeMode;
  previewThemeMode: ThemeMode | null;
  setPreviewThemeMode: (mode: ThemeMode | null) => void;
  resolvedTheme: 'light' | 'dark';
  autoSaveDrafts: boolean;
  confirmBeforeAnalysis: boolean;
  savePreferences: (newPrefs: PreferencesState) => Promise<void>;
  triggerWithConfirmation: (options: ConfirmAnalysisOptions) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'resumeiq_theme_preference';
const PREFS_STORAGE_KEY = 'resumeiq_user_preferences';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Persisted Theme State
  const [savedThemeMode, setSavedThemeMode] = useState<ThemeMode>(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
      return savedTheme as ThemeMode;
    }
    return 'light';
  });

  // Temporary preview theme mode (null means use savedThemeMode)
  const [previewThemeMode, setPreviewThemeMode] = useState<ThemeMode | null>(null);

  // Active theme being rendered on DOM
  const activeThemeMode = previewThemeMode || savedThemeMode;

  const [autoSaveDrafts, setAutoSaveDrafts] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(PREFS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.autoSaveDrafts === 'boolean') return parsed.autoSaveDrafts;
      }
    } catch (e) {}
    return true;
  });

  const [confirmBeforeAnalysis, setConfirmBeforeAnalysis] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(PREFS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.confirmBeforeAnalysis === 'boolean') return parsed.confirmBeforeAnalysis;
      }
    } catch (e) {}
    return true;
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Confirmation Modal state for credit-consuming operations
  const [confirmModalOptions, setConfirmModalOptions] = useState<ConfirmAnalysisOptions | null>(null);

  // Explicitly commit and persist preferences to localStorage and Supabase
  const savePreferences = async (newPrefs: PreferencesState) => {
    setSavedThemeMode(newPrefs.themeMode);
    setPreviewThemeMode(null);
    setAutoSaveDrafts(newPrefs.autoSaveDrafts);
    setConfirmBeforeAnalysis(newPrefs.confirmBeforeAnalysis);

    localStorage.setItem(THEME_STORAGE_KEY, newPrefs.themeMode);
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(newPrefs));

    // Sync to Supabase user_preferences table for logged-in user
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await supabase.from('user_preferences').upsert({
          user_id: session.user.id,
          theme: newPrefs.themeMode,
          auto_save_drafts: newPrefs.autoSaveDrafts,
          confirm_before_analysis: newPrefs.confirmBeforeAnalysis,
          preferences_json: newPrefs,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('Notice syncing user preferences to Supabase:', err);
    }
  };

  // Trigger action with optional credit consumption confirmation
  const triggerWithConfirmation = (options: ConfirmAnalysisOptions) => {
    if (confirmBeforeAnalysis) {
      setConfirmModalOptions(options);
    } else {
      options.onConfirm();
    }
  };

  // Load user preferences from Supabase if user is logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) {
        supabase
          .from('user_preferences')
          .select('theme, auto_save_drafts, confirm_before_analysis, preferences_json')
          .eq('user_id', session.user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data) {
              if (data.theme) {
                setSavedThemeMode(data.theme as ThemeMode);
                localStorage.setItem(THEME_STORAGE_KEY, data.theme);
              }
              if (typeof data.auto_save_drafts === 'boolean') setAutoSaveDrafts(data.auto_save_drafts);
              if (typeof data.confirm_before_analysis === 'boolean') setConfirmBeforeAnalysis(data.confirm_before_analysis);
              localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify({
                themeMode: data.theme || savedThemeMode,
                autoSaveDrafts: typeof data.auto_save_drafts === 'boolean' ? data.auto_save_drafts : autoSaveDrafts,
                confirmBeforeAnalysis: typeof data.confirm_before_analysis === 'boolean' ? data.confirm_before_analysis : confirmBeforeAnalysis,
              }));
            }
          });
      }
    });
  }, []);

  // DOM Theme application effect (listens to activeThemeMode = previewThemeMode || savedThemeMode)
  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      let active: 'light' | 'dark' = 'light';
      if (activeThemeMode === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        active = systemPrefersDark ? 'dark' : 'light';
      } else {
        active = activeThemeMode;
      }

      setResolvedTheme(active);

      if (active === 'dark') {
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
      } else {
        root.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
      }
    };

    applyTheme();

    if (activeThemeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        applyTheme();
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [activeThemeMode]);

  return (
    <ThemeContext.Provider
      value={{
        themeMode: savedThemeMode,
        previewThemeMode,
        setPreviewThemeMode,
        resolvedTheme,
        autoSaveDrafts,
        confirmBeforeAnalysis,
        savePreferences,
        triggerWithConfirmation,
      }}
    >
      {children}

      {/* Confirmation Modal for Credit-Consuming Analysis */}
      {confirmModalOptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                ⚡
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  {confirmModalOptions.title || 'Confirm AI Analysis'}
                </h3>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  {confirmModalOptions.creditCost !== undefined
                    ? `${confirmModalOptions.creditCost} Credit(s) Required`
                    : 'Credit-Consuming Action'}
                </span>
              </div>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {confirmModalOptions.message ||
                'Starting this AI analysis will evaluate candidate data and consume neural analysis credits from your account balance.'}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setConfirmModalOptions(null)}
                className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const opts = confirmModalOptions;
                  setConfirmModalOptions(null);
                  if (opts) {
                    await opts.onConfirm();
                  }
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Continue Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
