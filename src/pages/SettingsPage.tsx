import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { apiClient } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Sliders,
  CreditCard,
  Shield,
  Check,
  Save,
  Sun,
  Moon,
  Monitor,
  Laptop,
  Zap,
  ChevronDown,
  Lock,
  AlertTriangle,
  Loader2,
  Trash2
} from 'lucide-react';

type SectionId = 'account' | 'preferences' | 'billing' | 'security';

interface NavGroup {
  groupLabel: string;
  items: {
    id: SectionId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    groupLabel: 'PERSONAL',
    items: [
      { id: 'account', label: 'Account', icon: User },
      { id: 'preferences', label: 'Preferences', icon: Sliders },
    ],
  },
  {
    groupLabel: 'BILLING',
    items: [
      { id: 'billing', label: 'Billing & Credits', icon: CreditCard },
    ],
  },
  {
    groupLabel: 'SECURITY',
    items: [
      { id: 'security', label: 'Privacy & Security', icon: Shield },
    ],
  },
];

export const SettingsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, credits, plan, signOut } = useAuth();
  const { toast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Read section from query params if available
  const queryParams = new URLSearchParams(location.search);
  const initialSectionParam = queryParams.get('section') as SectionId;
  const initialSection = ['account', 'preferences', 'billing', 'security'].includes(initialSectionParam)
    ? initialSectionParam
    : 'account';

  const [activeSection, setActiveSection] = useState<SectionId>(initialSection);

  // Central Theme & Preferences Context
  const {
    themeMode: contextThemeMode,
    setPreviewThemeMode,
    autoSaveDrafts: contextAutoSaveDrafts,
    confirmBeforeAnalysis: contextConfirmBeforeAnalysis,
    savePreferences,
  } = useTheme();

  // Revert any uncommitted theme previews when Settings page unmounts
  useEffect(() => {
    return () => {
      setPreviewThemeMode(null);
    };
  }, [setPreviewThemeMode]);

  // ==========================================
  // 1. ACCOUNT TAB (SAVED VS DRAFT STATE)
  // ==========================================
  const [savedProfile, setSavedProfile] = useState({
    fullName: '',
    roleTitle: 'AI Software Engineer',
    avatarUrl: null as string | null,
  });

  const [email, setEmail] = useState('');

  // Draft Account form state
  const [draftFullName, setDraftFullName] = useState('');
  const [draftRoleTitle, setDraftRoleTitle] = useState('');
  const [draftAvatarUrl, setDraftAvatarUrl] = useState<string | null>(null);
  const [draftAvatarFile, setDraftAvatarFile] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSavedSuccess, setProfileSavedSuccess] = useState(false);

  // Load persisted user profile data from Supabase Auth & profiles table
  useEffect(() => {
    if (!user) return;
    
    const meta = user.user_metadata || {};
    const initialEmail = user.email || '';
    const initialName = meta.full_name || meta.name || user.email?.split('@')[0] || '';
    const initialRole = meta.professional_role || meta.role_title || 'AI Software Engineer';
    const initialAvatar = meta.avatar_url || meta.picture || null;

    setEmail(initialEmail);
    setSavedProfile({ fullName: initialName, roleTitle: initialRole, avatarUrl: initialAvatar });
    setDraftFullName(initialName);
    setDraftRoleTitle(initialRole);
    setDraftAvatarUrl(initialAvatar);
    setDraftAvatarFile(null);

    // Fetch persisted profiles table data if available
    supabase
      .from('profiles')
      .select('full_name, professional_role, avatar_url')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data) {
          const fetchedName = data.full_name || initialName;
          const fetchedRole = data.professional_role || initialRole;
          const fetchedAvatar = data.avatar_url || initialAvatar;

          setSavedProfile({ fullName: fetchedName, roleTitle: fetchedRole, avatarUrl: fetchedAvatar });
          setDraftFullName(fetchedName);
          setDraftRoleTitle(fetchedRole);
          setDraftAvatarUrl(fetchedAvatar);
        }
      });
  }, [user]);

  // Account Dirty State Check
  const isAccountDirty =
    draftFullName.trim() !== savedProfile.fullName.trim() ||
    draftRoleTitle.trim() !== savedProfile.roleTitle.trim() ||
    draftAvatarUrl !== savedProfile.avatarUrl ||
    draftAvatarFile !== null;

  // Handle Photo Picker (Updates ONLY Local Draft State — NO Supabase calls!)
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      toast.error('Invalid image format. Please upload JPG, PNG, or GIF.', { title: 'Upload Error' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Maximum file size allowed is 2MB.', { title: 'File Too Large' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setDraftAvatarUrl(reader.result as string);
      setDraftAvatarFile(file);
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  // Save Profile Handler (Explicitly commits draft -> Supabase -> savedProfile)
  const handleSaveProfile = async () => {
    if (!draftFullName.trim()) {
      toast.error('Full Name cannot be empty.', { title: 'Validation Error' });
      return;
    }

    if (!user || !isAccountDirty) return;

    setSavingProfile(true);
    try {
      let finalAvatarUrl = draftAvatarUrl;

      // Upload file to Supabase Storage only upon explicit Save
      if (draftAvatarFile) {
        const fileExt = draftAvatarFile.name.split('.').pop() || 'png';
        const fileName = `${user.id}_${Date.now()}.${fileExt}`;

        const { error: storageError } = await supabase.storage
          .from('avatars')
          .upload(fileName, draftAvatarFile, { upsert: true });

        if (!storageError) {
          const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
          finalAvatarUrl = data.publicUrl;
        }
      }

      // Update Auth user_metadata (ONLY full_name and professional_role - NEVER email)
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: draftFullName.trim(),
          professional_role: draftRoleTitle.trim(),
          avatar_url: finalAvatarUrl
        }
      });

      if (authError) throw authError;

      // Update profiles table in Supabase
      await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        full_name: draftFullName.trim(),
        professional_role: draftRoleTitle.trim(),
        avatar_url: finalAvatarUrl,
        updated_at: new Date().toISOString()
      });

      setSavedProfile({
        fullName: draftFullName.trim(),
        roleTitle: draftRoleTitle.trim(),
        avatarUrl: finalAvatarUrl
      });
      setDraftAvatarUrl(finalAvatarUrl);
      setDraftAvatarFile(null);

      setProfileSavedSuccess(true);
      toast.success('Profile updated successfully.', { title: 'Success' });
      setTimeout(() => setProfileSavedSuccess(false), 2500);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      toast.error(err.message || "Couldn't update your profile. Please try again.", { title: 'Update Failed' });
    } finally {
      setSavingProfile(false);
    }
  };

  // ==========================================
  // 2. PREFERENCES TAB (SAVED VS DRAFT STATE)
  // ==========================================
  const [savedPreferences, setSavedPreferences] = useState({
    themeMode: contextThemeMode,
    autoSaveDrafts: contextAutoSaveDrafts,
    confirmBeforeAnalysis: contextConfirmBeforeAnalysis,
  });

  const [draftThemeMode, setDraftThemeMode] = useState<ThemeMode>(contextThemeMode);
  const [draftAutoSaveDrafts, setDraftAutoSaveDrafts] = useState<boolean>(contextAutoSaveDrafts);
  const [draftConfirmBeforeAnalysis, setDraftConfirmBeforeAnalysis] = useState<boolean>(contextConfirmBeforeAnalysis);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [prefsSavedSuccess, setPrefsSavedSuccess] = useState(false);

  useEffect(() => {
    setSavedPreferences({
      themeMode: contextThemeMode,
      autoSaveDrafts: contextAutoSaveDrafts,
      confirmBeforeAnalysis: contextConfirmBeforeAnalysis,
    });
    setDraftThemeMode(contextThemeMode);
    setDraftAutoSaveDrafts(contextAutoSaveDrafts);
    setDraftConfirmBeforeAnalysis(contextConfirmBeforeAnalysis);
  }, [contextThemeMode, contextAutoSaveDrafts, contextConfirmBeforeAnalysis]);

  // Preferences Dirty State Check
  const isPreferencesDirty =
    draftThemeMode !== savedPreferences.themeMode ||
    draftAutoSaveDrafts !== savedPreferences.autoSaveDrafts ||
    draftConfirmBeforeAnalysis !== savedPreferences.confirmBeforeAnalysis;

  // Visual Theme Selector Preview (Updates local draft and DOM preview without persisting!)
  const handleSelectThemeModePreview = (mode: ThemeMode) => {
    setDraftThemeMode(mode);
    setPreviewThemeMode(mode);
  };

  // Save Preferences Handler (Explicitly commits draft -> localStorage & Supabase)
  const handleSavePreferences = async () => {
    if (!isPreferencesDirty) return;

    setSavingPreferences(true);
    try {
      const updatedPrefs = {
        themeMode: draftThemeMode,
        autoSaveDrafts: draftAutoSaveDrafts,
        confirmBeforeAnalysis: draftConfirmBeforeAnalysis,
      };

      await savePreferences(updatedPrefs);
      setSavedPreferences(updatedPrefs);

      setPrefsSavedSuccess(true);
      toast.success('UI Preferences saved successfully.', { title: 'Preferences Saved' });
      setTimeout(() => setPrefsSavedSuccess(false), 2500);
    } catch (err: any) {
      toast.error('Failed to save preferences.', { title: 'Save Failed' });
    } finally {
      setSavingPreferences(false);
    }
  };

  // ==========================================
  // 3. SECURITY TAB & AUTH PROVIDER DETECTION
  // ==========================================
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [signingOutOthers, setSigningOutOthers] = useState(false);

  // Delete Account Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Detect Google OAuth user vs Email/Password user
  const isGoogleUser = useMemo(() => {
    if (!user) return false;
    if (user.app_metadata?.provider === 'google') return true;
    if (Array.isArray(user.app_metadata?.providers) && user.app_metadata.providers.includes('google')) {
      if (user.app_metadata.provider === 'google' || !user.app_metadata.providers.includes('email')) {
        return true;
      }
    }
    if (user.identities?.some((id: any) => id.provider === 'google')) {
      return true;
    }
    return false;
  }, [user]);

  // Detect browser / platform details for current device
  const browserDetails = useMemo(() => {
    const ua = navigator.userAgent;
    let browser = 'Web Browser';
    if (ua.includes('Chrome')) browser = 'Google Chrome';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Apple Safari';
    else if (ua.includes('Firefox')) browser = 'Mozilla Firefox';
    else if (ua.includes('Edg')) browser = 'Microsoft Edge';

    let os = 'Desktop Platform';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    else if (ua.includes('Android')) os = 'Android';

    return `${os} — ${browser}`;
  }, []);

  // Update Password Handler (Only for email/password users)
  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Please enter and confirm your new password.', { title: 'Validation Error' });
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.', { title: 'Password Too Short' });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match.', { title: 'Password Mismatch' });
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Your password has been updated successfully.', { title: 'Password Updated' });
    } catch (err: any) {
      console.error('Error updating password:', err);
      toast.error(err.message || 'Couldn\'t update password. Please try again.', { title: 'Update Failed' });
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Sign out all other sessions handler
  const handleSignOutOtherSessions = async () => {
    const confirmSignOut = window.confirm(
      'Are you sure you want to sign out all other active sessions across other devices?'
    );
    if (!confirmSignOut) return;

    setSigningOutOthers(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: 'others' });
      if (error) throw error;
      toast.success('All other active sessions have been signed out.', { title: 'Sessions Revoked' });
    } catch (err: any) {
      console.error('Error signing out other sessions:', err);
      toast.error(err.message || 'Failed to sign out other sessions. Please try again.', { title: 'Action Failed' });
    } finally {
      setSigningOutOthers(false);
    }
  };

  // ==========================================
  // DELETE ACCOUNT HANDLER
  // ==========================================
  const handleConfirmDeleteAccount = async () => {
    setDeletingAccount(true);
    setDeleteError(null);

    try {
      if (!user) throw new Error('No active authenticated user session.');

      // 1. Call backend API to delete user profile, resumes, jobs, reports & auth user
      try {
        await apiClient.deleteAccount();
      } catch (apiErr) {
        console.warn('API endpoint deletion notice, executing direct Supabase cleanup:', apiErr);
        await supabase.from('profiles').delete().eq('id', user.id);
        await supabase.from('user_preferences').delete().eq('user_id', user.id);
        await supabase.from('resumes').delete().eq('user_id', user.id);
        await supabase.from('jobs').delete().eq('user_id', user.id);
        await supabase.from('reports').delete().eq('user_id', user.id);
      }

      // 2. Clear local storage and session storage tokens
      localStorage.clear();
      sessionStorage.clear();

      // 3. Sign out via Supabase auth context
      await supabase.auth.signOut();

      // 4. Display toast notification
      toast.info('Your Resume Screening System account and all data have been deleted.', { title: 'Account Deleted' });

      // 5. Immediately redirect to public landing page "/"
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('Delete account failed:', err);
      setDeleteError('Unable to delete your account. Please try again.');
      setDeletingAccount(false);
    }
  };

  // ==========================================
  // SECTION SWITCHING & UNSAVED CHANGES GUARD
  // ==========================================
  useEffect(() => {
    const querySec = new URLSearchParams(location.search).get('section') as SectionId;
    if (querySec && ['account', 'preferences', 'billing', 'security'].includes(querySec)) {
      setActiveSection(querySec);
    }
  }, [location.search]);

  const handleSelectSection = (nextSec: SectionId) => {
    if (nextSec === activeSection) return;

    let activeIsDirty = false;
    if (activeSection === 'account') activeIsDirty = isAccountDirty;
    if (activeSection === 'preferences') activeIsDirty = isPreferencesDirty;

    if (activeIsDirty) {
      const confirmLeave = window.confirm(
        'You have unsaved changes in this section. Navigating away will discard your draft edits. Continue?'
      );
      if (!confirmLeave) return;

      // Discard unsaved draft states for previous active section
      if (activeSection === 'account') {
        setDraftFullName(savedProfile.fullName);
        setDraftRoleTitle(savedProfile.roleTitle);
        setDraftAvatarUrl(savedProfile.avatarUrl);
        setDraftAvatarFile(null);
      }
      if (activeSection === 'preferences') {
        setDraftThemeMode(savedPreferences.themeMode);
        setDraftAutoSaveDrafts(savedPreferences.autoSaveDrafts);
        setDraftConfirmBeforeAnalysis(savedPreferences.confirmBeforeAnalysis);
        setPreviewThemeMode(null);
      }
    }

    setActiveSection(nextSec);
    navigate(`/settings?section=${nextSec}`, { replace: true });
  };

  return (
    <div className="min-h-screen selection:bg-purple-100 selection:text-purple-900 pb-20 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-6 sm:pt-8 md:pt-10 space-y-6 sm:space-y-8">
        
        {/* Page Header */}
        <div className="border-b border-neutral-200/50 dark:border-neutral-800/50 pb-5 sm:pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 text-xs font-semibold mb-2">
              <Sliders className="w-3.5 h-3.5" />
              <span>SYSTEM SETTINGS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif-title font-normal text-neutral-900 dark:text-white tracking-tight leading-snug sm:leading-none">
              Settings & Account Preferences
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-2xl">
              Manage your personal profile credentials, UI themes, billing subscription, and privacy controls.
            </p>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        <div className="md:hidden space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block">
            Settings Section
          </label>
          <div className="relative">
            <select
              value={activeSection}
              onChange={(e) => handleSelectSection(e.target.value as SectionId)}
              className="w-full appearance-none bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800/90 rounded-xl px-4 py-2.5 pr-10 text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white shadow-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all cursor-pointer"
            >
              {NAV_GROUPS.map((group) => (
                <optgroup label={group.groupLabel} key={group.groupLabel} className="font-bold text-neutral-400 dark:text-neutral-500 bg-neutral-50 dark:bg-neutral-950">
                  {group.items.map((item) => (
                    <option key={item.id} value={item.id} className="text-neutral-900 dark:text-white font-medium py-1">
                      {item.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 dark:text-neutral-500">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Main Grid: Left Sidebar + Right Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start">
          
          {/* Desktop Left Sidebar */}
          <div className="hidden md:block md:col-span-4 lg:col-span-3 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xs border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl p-4 shadow-xs space-y-6 sticky top-24">
            {NAV_GROUPS.map((group) => (
              <div key={group.groupLabel} className="space-y-1.5">
                <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  {group.groupLabel}
                </span>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectSection(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          isActive
                            ? 'bg-purple-500/10 text-purple-900 dark:bg-purple-500/20 dark:text-purple-200 font-bold border border-purple-500/20 shadow-xs'
                            : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-neutral-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        {isActive && (
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Right Section Content */}
          <div className="md:col-span-8 lg:col-span-9 bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl p-4 sm:p-6 md:p-8 shadow-xs min-h-[480px] sm:min-h-[520px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="space-y-8"
              >
                
                {/* 1. ACCOUNT SECTION */}
                {activeSection === 'account' && (
                  <div className="space-y-8">
                    <div className="border-b border-neutral-100 dark:border-neutral-800 pb-4">
                      <h2 className="text-xl font-serif-title font-normal text-neutral-900 dark:text-white">
                        Account Details
                      </h2>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        Manage your user credentials, personal details, and professional role.
                      </p>
                    </div>

                    {/* Profile Avatar (Draft Preview) */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-xl bg-neutral-50/60 dark:bg-neutral-950/60 border border-neutral-200/60 dark:border-neutral-800/60">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleAvatarChange}
                        accept="image/jpeg,image/png,image/gif"
                        className="hidden"
                      />
                      <div className="w-16 h-16 rounded-2xl bg-neutral-900 text-white font-bold text-xl flex items-center justify-center shadow-sm overflow-hidden shrink-0 border border-neutral-300 dark:border-neutral-700">
                        {draftAvatarUrl ? (
                          <img src={draftAvatarUrl} alt="Profile Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="uppercase text-lg font-bold">
                            {(draftFullName || email || 'U').slice(0, 2)}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                          <span>Profile Avatar</span>
                          {draftAvatarFile && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                              Unsaved Photo Draft
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          Recommended format: JPG, PNG or GIF up to 2MB. Photo updates apply upon clicking Save Changes.
                        </p>
                        <div className="flex items-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-semibold border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
                          >
                            <span>Change Photo</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Name & Email inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={draftFullName}
                          onChange={(e) => setDraftFullName(e.target.value)}
                          placeholder="e.g. Alex Morgan"
                          className="w-full bg-neutral-50/80 dark:bg-neutral-950/80 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm font-medium text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">
                            Email Address
                          </label>
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-400">
                            <Lock className="w-3 h-3" />
                            <span>Read-Only</span>
                          </span>
                        </div>
                        <input
                          type="email"
                          value={email}
                          readOnly
                          disabled
                          aria-readonly="true"
                          className="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm font-medium text-neutral-500 dark:text-neutral-400 cursor-not-allowed select-none opacity-85"
                        />
                      </div>
                    </div>

                    {/* Professional Role / Title */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">
                        Professional Role / Title
                      </label>
                      <input
                        type="text"
                        value={draftRoleTitle}
                        onChange={(e) => setDraftRoleTitle(e.target.value)}
                        placeholder="e.g. AI Software Engineer / Lead Recruiter"
                        className="w-full bg-neutral-50/80 dark:bg-neutral-950/80 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm font-medium text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                      />
                    </div>

                    {/* Read-only Account Information */}
                    <div className="p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/40 dark:bg-neutral-950/40 space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                        Account Information
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 sm:gap-4 text-xs">
                        <div>
                          <span className="text-neutral-400 block">Account Status</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Verified Active
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-400 block">Member Since</span>
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                            {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Active'}
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-400 block">Current Plan</span>
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                            {plan === 'pro' ? 'Pro Plan' : plan === 'career_max' ? 'Pro Max Plan' : 'Free Starter Plan'}
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-400 block">Credits Balance</span>
                          <span className="font-semibold text-purple-600 dark:text-purple-400">
                            {credits} Credits
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                      <span className="text-xs text-neutral-400 font-medium">
                        {isAccountDirty ? 'Unsaved profile changes pending' : 'All changes saved'}
                      </span>

                      <button
                        type="button"
                        disabled={!isAccountDirty || savingProfile}
                        onClick={handleSaveProfile}
                        className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                          !isAccountDirty
                            ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
                            : 'bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 text-white'
                        }`}
                      >
                        {savingProfile ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-purple-400 dark:text-purple-600" />
                            <span>Saving Changes...</span>
                          </>
                        ) : profileSavedSuccess ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-500" />
                            <span>Saved</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. PREFERENCES SECTION */}
                {activeSection === 'preferences' && (
                  <div className="space-y-8">
                    <div className="border-b border-neutral-100 dark:border-neutral-800 pb-4">
                      <h2 className="text-xl font-serif-title font-normal text-neutral-900 dark:text-white">
                        User Interface Preferences
                      </h2>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        Customize appearance themes, auto-save options, and analysis confirmation prompts.
                      </p>
                    </div>

                    {/* Appearance theme mode selector */}
                    <div className="space-y-3">
                      <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">
                        Appearance Mode
                      </label>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { id: 'light', label: 'Light', icon: Sun },
                          { id: 'dark', label: 'Dark', icon: Moon },
                          { id: 'system', label: 'System', icon: Monitor },
                        ].map((item) => {
                          const Icon = item.icon;
                          const selected = draftThemeMode === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleSelectThemeModePreview(item.id as ThemeMode)}
                              className={`p-4 rounded-xl border text-left flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                                selected
                                  ? 'border-purple-600 bg-purple-500/10 text-neutral-900 dark:text-white ring-2 ring-purple-600/20 font-bold'
                                  : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                              }`}
                            >
                              <Icon className={`w-5 h-5 ${selected ? 'text-purple-600 dark:text-purple-400' : 'text-neutral-400'}`} />
                              <span className="text-xs">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Theme changes preview immediately. Click Save Preferences below to commit your theme preference.
                      </p>
                    </div>

                    {/* Preference Toggles */}
                    <div className="space-y-3 sm:space-y-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                      
                      {/* Auto-save drafts */}
                      <div className="flex items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/30 dark:bg-neutral-950/30">
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <span className="text-xs font-semibold text-neutral-900 dark:text-white block leading-snug">
                            Auto-Save Analysis Drafts
                          </span>
                          <span className="text-xs sm:text-xs text-neutral-500 dark:text-neutral-400 leading-snug block">
                            Automatically save in-progress resume match reports and custom job descriptions.
                          </span>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={draftAutoSaveDrafts}
                          onClick={() => setDraftAutoSaveDrafts(!draftAutoSaveDrafts)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500/30 ${
                            draftAutoSaveDrafts ? 'bg-purple-600' : 'bg-neutral-200 dark:bg-neutral-800'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                              draftAutoSaveDrafts ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Confirm Before Analysis */}
                      <div className="flex items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/30 dark:bg-neutral-950/30">
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <span className="text-xs font-semibold text-neutral-900 dark:text-white block leading-snug">
                            Confirm Before Analysis
                          </span>
                          <span className="text-xs sm:text-xs text-neutral-500 dark:text-neutral-400 leading-snug block">
                            Ask before starting a new analysis that uses credits.
                          </span>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={draftConfirmBeforeAnalysis}
                          onClick={() => setDraftConfirmBeforeAnalysis(!draftConfirmBeforeAnalysis)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500/30 ${
                            draftConfirmBeforeAnalysis ? 'bg-purple-600' : 'bg-neutral-200 dark:bg-neutral-800'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                              draftConfirmBeforeAnalysis ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                    </div>

                    {/* Action button */}
                    <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                      <span className="text-xs text-neutral-400 font-medium">
                        {isPreferencesDirty ? 'Unsaved preference changes pending' : 'All preferences saved'}
                      </span>

                      <button
                        type="button"
                        disabled={!isPreferencesDirty || savingPreferences}
                        onClick={handleSavePreferences}
                        className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                          !isPreferencesDirty
                            ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
                            : 'bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 text-white'
                        }`}
                      >
                        {savingPreferences ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-purple-400 dark:text-purple-600" />
                            <span>Saving Preferences...</span>
                          </>
                        ) : prefsSavedSuccess ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-500" />
                            <span>Saved</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Save Preferences</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. BILLING & CREDITS SECTION */}
                {activeSection === 'billing' && (
                  <div className="space-y-8">
                    <div className="border-b border-neutral-100 dark:border-neutral-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-serif-title font-normal text-neutral-900 dark:text-white">
                          Billing & Neural Credits
                        </h2>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          Manage your active workspace plan, monitor credit consumption, and review invoices.
                        </p>
                      </div>

                      <Link
                        to="/pricing"
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>Get More Credits</span>
                      </Link>
                    </div>

                    {/* Current Plan Card */}
                    <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 space-y-6">
                      <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 block mb-1">
                            Current Active Plan
                          </span>
                          <div className="text-2xl font-serif-title font-normal text-neutral-900 dark:text-white">
                            {plan === 'pro' ? 'Pro Plan' : plan === 'career_max' ? 'Pro Max Plan' : 'Free Starter Plan'}
                          </div>
                          <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            {credits} AI Credits Included
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-500/20">
                            Active Subscription
                          </span>
                        </div>
                      </div>

                      {/* Credit Usage Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                          <span className="flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-purple-600 fill-current" />
                            <span>Available AI Analysis Credits</span>
                          </span>
                          <span>{credits} Credits Available</span>
                        </div>
                        <div className="w-full h-3 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden p-0.5 border border-neutral-300 dark:border-neutral-700">
                          <div
                            className="h-full bg-purple-600 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(0, (credits / 10) * 100))}%` }}
                          />
                        </div>
                        <p className="text-xs text-neutral-500">
                          Credits are deducted on explicit AI operations (Resume analysis: 1 credit, Candidate ranking: 1 credit/candidate, AI Job Description: 1 credit).
                        </p>
                      </div>
                    </div>

                    {/* Subscription & Billing Notice */}
                    <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs space-y-1">
                      <h4 className="font-bold text-neutral-900 dark:text-white">Subscription & Payment Gateway</h4>
                      <p className="text-neutral-500 dark:text-neutral-400 text-xs">
                        Payment gateway integration is being finalized. Paid subscription tiers and credit top-up purchases will become active in an upcoming release.
                      </p>
                    </div>

                  </div>
                )}

                {/* 4. PRIVACY & SECURITY SECTION */}
                {activeSection === 'security' && (
                  <div className="space-y-8">
                    <div className="border-b border-neutral-100 dark:border-neutral-800 pb-4">
                      <h2 className="text-xl font-serif-title font-normal text-neutral-900 dark:text-white">
                        Privacy & Security Controls
                      </h2>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        Manage authentication credentials, password security, and active login sessions.
                      </p>
                    </div>

                    {/* AUTHENTICATION & PASSWORD MANAGEMENT */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Authentication & Security</span>
                      </h3>
                      
                      {isGoogleUser ? (
                        <div className="p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/60 dark:bg-neutral-950/60 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-lg shrink-0">
                            G
                          </div>
                          <div className="space-y-0.5">
                            <div className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                              <span>Signed in with Google</span>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] border border-emerald-500/20">
                                Google OAuth Active
                              </span>
                            </div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              Your account authentication and password security are managed directly through your Google Account.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4 max-w-md">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">
                              Current Password
                            </label>
                            <input
                              type="password"
                              placeholder="••••••••••••"
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              className="w-full bg-neutral-50/80 dark:bg-neutral-950/80 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">
                                New Password
                              </label>
                              <input
                                type="password"
                                placeholder="••••••••••••"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-neutral-50/80 dark:bg-neutral-950/80 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">
                                Confirm New Password
                              </label>
                              <input
                                type="password"
                                placeholder="••••••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-neutral-50/80 dark:bg-neutral-950/80 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={!newPassword || !confirmPassword || updatingPassword}
                            onClick={handleUpdatePassword}
                            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updatingPassword ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin text-purple-400 dark:text-purple-600" />
                                <span>Updating Password...</span>
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4" />
                                <span>Update Password</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* ACTIVE LOGIN SESSIONS */}
                    <div className="space-y-4 pt-6 border-t border-neutral-100 dark:border-neutral-800">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                            Active Login Sessions
                          </h3>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                            Monitor devices currently logged into your Resume Screening System account.
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={signingOutOthers}
                          onClick={handleSignOutOtherSessions}
                          className="px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-semibold border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-50"
                        >
                          {signingOutOthers ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                          ) : (
                            <Shield className="w-3.5 h-3.5 text-purple-600" />
                          )}
                          <span>{signingOutOthers ? 'Signing Out...' : 'Sign Out All Other Devices'}</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div className="p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/40 dark:bg-neutral-950/40 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3.5">
                            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0">
                              <Laptop className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-semibold text-neutral-900 dark:text-white">
                                {browserDetails}
                              </p>
                              <p className="text-[11px] text-neutral-400 mt-0.5">Active Session • Authenticated</p>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] border border-emerald-500/20">
                            Current Device
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* DANGER ZONE: DELETE ACCOUNT */}
                    <div className="pt-6 border-t border-rose-200 dark:border-rose-950/50 space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Danger Zone</span>
                      </h3>

                      <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold text-neutral-900 dark:text-white">
                            Delete Account & Workspace Data
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                            Permanently erase your account, candidate analysis history, and active credit balances.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError(null);
                            setShowDeleteModal(true);
                          }}
                          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-2xs shrink-0 cursor-pointer text-center flex items-center justify-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Account</span>
                        </button>
                      </div>
                    </div>

                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>

        </div>

      </div>

      {/* Delete Account Modal Confirmation */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => {
            if (!deletingAccount) {
              setShowDeleteModal(false);
              setDeleteError(null);
            }
          }}
        >
          <div
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-serif-title font-normal text-neutral-900 dark:text-white">
                Delete your account?
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                This action is permanent. Your account, profile, resume data, analysis history, and remaining credits will be permanently deleted.
              </p>
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400 pt-1">
                This cannot be undone.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                disabled={deletingAccount}
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deletingAccount}
                onClick={handleConfirmDeleteAccount}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingAccount ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Deleting Account...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Yes, Delete Account</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
