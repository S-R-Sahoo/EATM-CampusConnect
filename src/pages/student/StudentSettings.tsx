import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Avatar } from '../../components/ui/Avatar';
import { 
  updateUserPassword, 
  updateUserEmail, 
  getConnectedProviders, 
  deleteUserAccount,
  loginWithGoogle,
  loginWithGithub
} from '../../supabase/auth';
import { 
  Settings, User, Shield, Bell, Palette, 
  LogOut, Trash2, Mail, Lock, Check,
  Sun, Moon, Monitor, AlertTriangle, Globe, Users,
  CheckCircle2, ShieldCheck, KeyRound, Laptop,
  ChevronRight, GraduationCap, Building2, Sparkles,
  Info, ExternalLink, RefreshCw, BellRing, Eye,
  Radio, Smartphone
} from 'lucide-react';

type SettingsTab = 'account' | 'privacy' | 'notifications' | 'appearance';

// Sleek iOS-style Toggle Switch Component
const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}> = ({ checked, onChange, disabled = false }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0b4627] dark:focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-[#111d15] ${
        checked ? 'bg-[#0b4627] dark:bg-emerald-600' : 'bg-gray-200 dark:bg-gray-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
};

export const StudentSettings: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const { success, error: toastError } = useToast();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [saving, setSaving] = useState(false);

  // --- 1. ACCOUNT STATE ---
  const [newEmail, setNewEmail] = useState('');
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  // Connected OAuth Providers State
  const [providers, setProviders] = useState<{ google: boolean; github: boolean; email: boolean }>({
    google: false,
    github: false,
    email: true
  });
  const [loadingProviders, setLoadingProviders] = useState(false);

  // Browser Push Permission State
  const [browserPushPermission, setBrowserPushPermission] = useState<string>('default');

  // --- 2. PROFILE & PRIVACY STATE ---
  const [profileVisibility, setProfileVisibility] = useState<'everyone' | 'connections' | 'private'>(
    (user?.settings?.privacy?.profileVisibility as any) || 'everyone'
  );
  const [showSemester, setShowSemester] = useState(user?.settings?.privacy?.showSemester ?? true);
  const [showInterests, setShowInterests] = useState(user?.settings?.privacy?.showInterests ?? true);
  const [showProjects, setShowProjects] = useState(user?.settings?.privacy?.showProjects ?? true);
  const [showAchievements, setShowAchievements] = useState(user?.settings?.privacy?.showAchievements ?? true);
  const [whoCanConnect, setWhoCanConnect] = useState<'everyone' | 'department' | 'none'>(
    (user?.settings?.connections?.whoCanConnect as any) || 'everyone'
  );
  const [whoCanMessage, setWhoCanMessage] = useState<'everyone' | 'connections' | 'nobody'>(
    (user?.settings?.messages?.whoCanMessage as any) || 'everyone'
  );

  // --- 3. NOTIFICATIONS STATE ---
  const [connRequests, setConnRequests] = useState(user?.settings?.notifications?.connRequests ?? true);
  const [connAccepted, setConnAccepted] = useState(user?.settings?.notifications?.connAccepted ?? true);
  const [messages, setMessages] = useState(user?.settings?.notifications?.messages ?? true);
  const [messageRequests, setMessageRequests] = useState(user?.settings?.notifications?.messageRequests ?? true);
  const [postLikes, setPostLikes] = useState(user?.settings?.notifications?.postLikes ?? true);
  const [comments, setComments] = useState(user?.settings?.notifications?.comments ?? true);
  const [groupActivity, setGroupActivity] = useState(user?.settings?.notifications?.groupActivity ?? true);
  const [groupAnnouncements, setGroupAnnouncements] = useState(user?.settings?.notifications?.groupAnnouncements ?? true);
  const [eventReminders, setEventReminders] = useState(user?.settings?.notifications?.eventReminders ?? true);
  const [collegeAnnouncements, setCollegeAnnouncements] = useState(user?.settings?.notifications?.collegeAnnouncements ?? true);
  const [pushNotifications, setPushNotifications] = useState(user?.settings?.notifications?.pushNotifications ?? true);
  const [emailNotifications, setEmailNotifications] = useState(user?.settings?.notifications?.emailNotifications ?? true);

  // Load connected OAuth providers and browser notification permission on mount
  useEffect(() => {
    let isMounted = true;
    const fetchProviders = async () => {
      setLoadingProviders(true);
      try {
        const p = await getConnectedProviders();
        if (isMounted) setProviders(p);
      } catch (err) {
        console.warn('Failed to detect linked providers:', err);
      } finally {
        if (isMounted) setLoadingProviders(false);
      }
    };

    fetchProviders();

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserPushPermission(Notification.permission);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Email Change
  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      toastError('Please enter a valid email address.');
      return;
    }
    setSaving(true);
    try {
      const res = await updateUserEmail(cleanEmail);
      await updateUser({ email: cleanEmail });
      if (res?.needsEmailConfirmation) {
        success('Confirmation link sent! Please check your new inbox to complete verification.', 'Verification Sent');
      } else {
        success('Email address updated successfully!', 'Email Changed');
      }
      setEmailModalOpen(false);
      setNewEmail('');
    } catch (err: any) {
      toastError(err.message || 'Failed to update email address.');
    } finally {
      setSaving(false);
    }
  };

  // Password Change
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toastError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toastError('Passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      await updateUserPassword(newPassword.trim());
      success('Account password updated securely in Supabase Auth!', 'Password Changed');
      setPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toastError(err.message || 'Failed to update password.');
    } finally {
      setSaving(false);
    }
  };

  // Save Privacy
  const handleSavePrivacy = async () => {
    setSaving(true);
    try {
      await updateUser({
        settings: {
          privacy: {
            profileVisibility,
            showSemester,
            showInterests,
            showProjects,
            showAchievements
          },
          connections: {
            whoCanConnect
          },
          messages: {
            whoCanMessage
          }
        }
      });
      success('Profile & Privacy settings saved!', 'Preferences Saved');
    } catch {
      toastError('Failed to save privacy settings.');
    } finally {
      setSaving(false);
    }
  };

  // Save Notifications
  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      await updateUser({
        settings: {
          notifications: {
            connRequests,
            connAccepted,
            messages,
            messageRequests,
            postLikes,
            comments,
            groupActivity,
            groupAnnouncements,
            eventReminders,
            collegeAnnouncements,
            pushNotifications,
            emailNotifications
          }
        }
      });
      success('Notification preferences updated!', 'Preferences Saved');
    } catch {
      toastError('Failed to save notification preferences.');
    } finally {
      setSaving(false);
    }
  };

  // Request Push Permission
  const handleRequestPushPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setBrowserPushPermission(perm);
        if (perm === 'granted') {
          setPushNotifications(true);
          success('Push notifications permission granted!', 'Enabled');
        } else if (perm === 'denied') {
          toastError('Notifications permission was blocked in your browser settings.');
        }
      } catch {
        toastError('Could not request notification permission.');
      }
    } else {
      toastError('Browser notifications are not supported on this device.');
    }
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim() !== 'DELETE') {
      toastError('Please type DELETE to confirm.');
      return;
    }
    if (!user?.id) {
      toastError('Active session not found.');
      return;
    }
    setSaving(true);
    try {
      await deleteUserAccount(user.id);
      await logout();
      navigate('/login');
      success('Your account and associated campus records have been removed.', 'Account Removed');
    } catch (err: any) {
      toastError(err.message || 'Could not complete deletion.');
    } finally {
      setSaving(false);
    }
  };

  // Navigation Items
  const navTabs = [
    {
      id: 'account' as SettingsTab,
      label: 'Account & Security',
      shortLabel: 'Account',
      desc: 'Credentials, SSO & session',
      icon: User
    },
    {
      id: 'privacy' as SettingsTab,
      label: 'Profile & Privacy',
      shortLabel: 'Privacy',
      desc: 'Visibility & access controls',
      icon: Shield
    },
    {
      id: 'notifications' as SettingsTab,
      label: 'Notifications',
      shortLabel: 'Notifications',
      desc: 'Social & campus alerts',
      icon: Bell
    },
    {
      id: 'appearance' as SettingsTab,
      label: 'Appearance',
      shortLabel: 'Appearance',
      desc: 'Theme & visual display',
      icon: Palette
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-3 sm:px-6 lg:px-8">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-900/10 via-[#0b4627]/10 to-emerald-800/5 dark:from-[#111d15] dark:via-[#16251c] dark:to-[#111d15] border border-emerald-900/15 dark:border-[#1e3325] shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#0b4627] dark:bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                Settings & Preferences
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-300/50 dark:border-emerald-800/60">
                <Sparkles className="w-3 h-3" />
                EATM Portal
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              Manage your credentials, privacy settings, campus alerts, and visual interface
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-white/80 dark:bg-[#16251c] px-3 py-1.5 rounded-xl border border-gray-200 dark:border-[#1e3325] shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Active Session: {user?.role === 'faculty' ? 'Faculty' : 'Student'}
          </span>
        </div>
      </div>

      {/* Mobile Horizontal Segmented Selector (Visible on small screens) */}
      <div className="lg:hidden">
        <div className="flex overflow-x-auto no-scrollbar gap-1.5 p-1.5 bg-gray-100 dark:bg-[#16251c] rounded-2xl border border-gray-200/80 dark:border-[#1e3325]">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-1 ${
                  isActive
                    ? 'bg-white dark:bg-[#111d15] text-[#0b4627] dark:text-emerald-300 shadow-sm border border-emerald-900/10 dark:border-emerald-500/20'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/40 dark:hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#0b4627] dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`} />
                <span>{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sticky Sidebar (Desktop) */}
        <aside className="hidden lg:block lg:col-span-4 space-y-4 sticky top-20">
          {/* User Mini Profile Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#111d15] border border-gray-200/80 dark:border-[#1e3325] shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="relative shrink-0">
                <Avatar src={user?.photoURL} name={user?.displayName || 'User'} size="lg" />
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#111d15]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-black text-gray-900 dark:text-gray-100 truncate">
                    {user?.displayName || 'Campus Scholar'}
                  </h3>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.rollNumber ? `Roll: ${user.rollNumber}` : (user?.employeeId ? `Emp ID: ${user.employeeId}` : 'EATM Campus Member')}
                </p>
                <p className="text-[11px] font-semibold text-[#0b4627] dark:text-emerald-400 mt-0.5 truncate">
                  {user?.department || 'CSE'} • {user?.role === 'faculty' ? 'Faculty' : 'Student'}
                </p>
              </div>
            </div>
          </div>

          {/* Nav Links Card */}
          <nav className="p-2 rounded-2xl bg-white dark:bg-[#111d15] border border-gray-200/80 dark:border-[#1e3325] shadow-xs space-y-1">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-[#16251c] text-[#0b4627] dark:text-emerald-300 font-bold border border-emerald-200/60 dark:border-emerald-500/30 shadow-xs'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#16251c]/60 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-[#0b4627] dark:bg-emerald-500 text-white'
                        : 'bg-gray-100 dark:bg-[#16251c] text-gray-500 dark:text-gray-400'
                    }`}>
                      <Icon className="w-4 h-4 shrink-0" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold leading-none">{tab.label}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 font-normal truncate">
                        {tab.desc}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform shrink-0 ${
                    isActive ? 'text-[#0b4627] dark:text-emerald-400 translate-x-0.5' : 'text-gray-400 opacity-50'
                  }`} />
                </button>
              );
            })}
          </nav>

          {/* Quick Help Card */}
          <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-[#16251c]/60 border border-gray-200/60 dark:border-[#1e3325] text-xs text-gray-600 dark:text-gray-400 space-y-2">
            <div className="flex items-center gap-2 text-gray-900 dark:text-gray-200 font-bold">
              <Info className="w-4 h-4 text-[#0b4627] dark:text-emerald-400 shrink-0" />
              <span>Campus Security</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              All settings are synced authoritatively with Supabase. Platform administration is managed directly via the official Supabase console.
            </p>
          </div>
        </aside>

        {/* Right Active Content Column */}
        <main className="lg:col-span-8 space-y-6 min-w-0">
          {/* ========================================================================= */}
          {/* 1. ACCOUNT TAB */}
          {/* ========================================================================= */}
          {activeTab === 'account' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* User Overview Profile Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#111d15] border border-gray-200/80 dark:border-[#1e3325] shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-[#1e3325]">
                  <div className="flex items-center gap-4">
                    <Avatar src={user?.photoURL} name={user?.displayName || 'User'} size="xl" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-gray-100">
                          {user?.displayName || 'Student Scholar'}
                        </h2>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60">
                          <ShieldCheck className="w-3 h-3" />
                          Verified
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {user?.email || 'student@eatm.ac.in'}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-gray-600 dark:text-gray-400 mt-1 flex-wrap">
                        <span className="font-semibold text-gray-900 dark:text-gray-200">
                          {user?.department || 'CSE'}
                        </span>
                        {user?.semester && <span>• Sem {user.semester}</span>}
                        {user?.rollNumber && <span>• Roll: {user.rollNumber}</span>}
                        {user?.employeeId && <span>• ID: {user.employeeId}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#16251c] text-center">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Role</p>
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100 capitalize mt-0.5">
                      {user?.role || 'Student'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#16251c] text-center">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Department</p>
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                      {user?.department || 'CSE'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#16251c] text-center">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Connections</p>
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                      {user?.stats?.connections || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#16251c] text-center">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Status</p>
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center justify-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active
                    </p>
                  </div>
                </div>
              </div>

              {/* Account Security Card */}
              <div className="rounded-2xl bg-white dark:bg-[#111d15] border border-gray-200/80 dark:border-[#1e3325] shadow-xs overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-[#1e3325] bg-gray-50/50 dark:bg-[#16251c]/30">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-[#0b4627] dark:text-emerald-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#0b4627] dark:text-emerald-400">
                      Account Security & Credentials
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Manage your email login and Supabase Auth credentials
                  </p>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-[#1e3325]">
                  {/* Email Row */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-gray-500" />
                        Campus Email Address
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                        {user?.email || 'Not configured'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setNewEmail(user?.email || '');
                        setEmailModalOpen(true);
                      }}
                    >
                      Change Email
                    </Button>
                  </div>

                  {/* Password Row */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-gray-500" />
                        Account Password
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        •••••••••••• (Protected via Supabase Auth)
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setNewPassword('');
                        setConfirmPassword('');
                        setPasswordModalOpen(true);
                      }}
                    >
                      Change Password
                    </Button>
                  </div>
                </div>
              </div>

              {/* Connected Accounts Card */}
              <div className="rounded-2xl bg-white dark:bg-[#111d15] border border-gray-200/80 dark:border-[#1e3325] shadow-xs overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-[#1e3325] bg-gray-50/50 dark:bg-[#16251c]/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-[#0b4627] dark:text-emerald-400" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#0b4627] dark:text-emerald-400">
                          Connected Accounts & Single Sign-On
                        </h3>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Third-party OAuth authentication providers linked to your identity
                      </p>
                    </div>
                    {loadingProviders && (
                      <RefreshCw className="w-3.5 h-3.5 text-gray-400 animate-spin" />
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {/* Google SSO */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#16251c] border border-gray-100 dark:border-[#1e3325]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-xs border border-gray-200 dark:border-gray-700">
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Google Workspace / SSO</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">Institutional campus sign-on</p>
                      </div>
                    </div>
                    {providers.google ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200/60 dark:border-emerald-800/60">
                        <Check className="w-3 h-3" />
                        Connected
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-lg">
                        Not Linked
                      </span>
                    )}
                  </div>

                  {/* GitHub SSO */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#16251c] border border-gray-100 dark:border-[#1e3325]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-900 dark:bg-gray-800 text-white flex items-center justify-center shadow-xs">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-gray-100">GitHub Developer</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">Engineering profile & project sync</p>
                      </div>
                    </div>
                    {providers.github ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200/60 dark:border-emerald-800/60">
                        <Check className="w-3 h-3" />
                        Connected
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-lg">
                        Not Linked
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Session Management */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#111d15] border border-gray-200/80 dark:border-[#1e3325] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-[#16251c] text-gray-600 dark:text-gray-300">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Active Web Session</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Logged in as <span className="font-mono">{user?.email}</span>
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setLogoutModalOpen(true)}
                  icon={<LogOut className="w-3.5 h-3.5" />}
                >
                  Sign Out
                </Button>
              </div>

              {/* Danger Zone */}
              <div className="p-5 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50/30 dark:bg-red-950/10 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-xs uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span>Danger Zone</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Delete EATM Account</p>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">
                      Permanently remove your profile, campus connections, posts, and personal data from EATM CampusConnect.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setDeleteConfirmText('');
                      setDeleteModalOpen(true);
                    }}
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. PROFILE & PRIVACY TAB */}
          {/* ========================================================================= */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Profile Visibility */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#111d15] border border-gray-200/80 dark:border-[#1e3325] shadow-xs space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-[#0b4627] dark:text-emerald-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#0b4627] dark:text-emerald-400">
                      Profile Visibility
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Choose who can view your full campus scholar profile
                  </p>
                </div>

                <div className="space-y-2.5">
                  {[
                    {
                      id: 'everyone',
                      label: 'Everyone in EATM',
                      desc: 'Visible to all verified students, faculty, and campus staff members.',
                      icon: Globe
                    },
                    {
                      id: 'connections',
                      label: 'Connections only',
                      desc: 'Only approved peer connections can view your full profile and academic activity.',
                      icon: Users
                    },
                    {
                      id: 'private',
                      label: 'Private',
                      desc: 'Hidden from public directory. Only visible to yourself and college administration.',
                      icon: Lock
                    }
                  ].map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = profileVisibility === opt.id;
                    return (
                      <label
                        key={opt.id}
                        onClick={() => setProfileVisibility(opt.id as any)}
                        className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#0b4627] dark:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 ring-1 ring-[#0b4627]/20 dark:ring-emerald-500/30'
                            : 'border-gray-200 dark:border-[#1e3325] hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-[#111d15]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="profile_visibility"
                          checked={isSelected}
                          onChange={() => setProfileVisibility(opt.id as any)}
                          className="w-4 h-4 mt-0.5 accent-[#0b4627] dark:accent-emerald-500 cursor-pointer shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#0b4627] dark:text-emerald-400' : 'text-gray-500'}`} />
                            <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{opt.label}</p>
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{opt.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Academic Profile Fields Visibility */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#111d15] border border-gray-200/80 dark:border-[#1e3325] shadow-xs space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-[#0b4627] dark:text-emerald-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#0b4627] dark:text-emerald-400">
                      Academic Details Display
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Toggle which academic sections appear on your public profile card
                  </p>
                </div>

                <div className="space-y-3 divide-y divide-gray-100 dark:divide-[#1e3325]">
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Show semester</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">Display current semester on profile header</p>
                    </div>
                    <ToggleSwitch checked={showSemester} onChange={setShowSemester} />
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Show interests & clubs</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">Display campus interests, hobby tags, and joined clubs</p>
                    </div>
                    <ToggleSwitch checked={showInterests} onChange={setShowInterests} />
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Show engineering projects</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">Display portfolio projects, code repositories, and descriptions</p>
                    </div>
                    <ToggleSwitch checked={showProjects} onChange={setShowProjects} />
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Show honors & achievements</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">Display hackathon victories, academic honors, and certificates</p>
                    </div>
                    <ToggleSwitch checked={showAchievements} onChange={setShowAchievements} />
                  </div>
                </div>
              </div>

              {/* Connections Permission */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#111d15] border border-gray-200/80 dark:border-[#1e3325] shadow-xs space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#0b4627] dark:text-emerald-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#0b4627] dark:text-emerald-400">
                      Connection Requests
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Who is authorized to send you peer connection requests?
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'everyone', label: 'Everyone in EATM', desc: 'Any verified student or faculty member' },
                    { id: 'department', label: 'Department peers', desc: `Only peers in ${user?.department || 'your department'}` },
                    { id: 'none', label: 'Nobody', desc: 'Disable incoming connection requests' }
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      onClick={() => setWhoCanConnect(opt.id as any)}
                      className={`flex flex-col justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                        whoCanConnect === opt.id
                          ? 'border-[#0b4627] dark:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 ring-1 ring-[#0b4627]/20 dark:ring-emerald-500/30'
                          : 'border-gray-200 dark:border-[#1e3325] hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-[#111d15]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{opt.label}</span>
                        <input
                          type="radio"
                          name="who_can_connect"
                          checked={whoCanConnect === opt.id}
                          onChange={() => setWhoCanConnect(opt.id as any)}
                          className="w-4 h-4 accent-[#0b4627] dark:accent-emerald-500"
                        />
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">{opt.desc}</p>
                    </label>
                  ))}
                </div>
              </div>

              {/* Messaging Permission */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#111d15] border border-gray-200/80 dark:border-[#1e3325] shadow-xs space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#0b4627] dark:text-emerald-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#0b4627] dark:text-emerald-400">
                      Direct Messaging
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Who can initiate direct messages with you in CampusConnect?
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'everyone', label: 'Everyone', desc: 'Any verified campus member' },
                    { id: 'connections', label: 'Connections only', desc: 'Only your approved connections' },
                    { id: 'nobody', label: 'Nobody', desc: 'Disable new incoming direct chats' }
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      onClick={() => setWhoCanMessage(opt.id as any)}
                      className={`flex flex-col justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                        whoCanMessage === opt.id
                          ? 'border-[#0b4627] dark:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 ring-1 ring-[#0b4627]/20 dark:ring-emerald-500/30'
                          : 'border-gray-200 dark:border-[#1e3325] hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-[#111d15]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{opt.label}</span>
                        <input
                          type="radio"
                          name="who_can_message"
                          checked={whoCanMessage === opt.id}
                          onChange={() => setWhoCanMessage(opt.id as any)}
                          className="w-4 h-4 accent-[#0b4627] dark:accent-emerald-500"
                        />
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">{opt.desc}</p>
                    </label>
                  ))}
                </div>
              </div>

              {/* Save Privacy Button */}
              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleSavePrivacy}
                  isLoading={saving}
                  icon={<Check className="w-4 h-4" />}
                >
                  Save Privacy Preferences
                </Button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. NOTIFICATIONS TAB */}
          {/* ========================================================================= */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Social Activity Alerts */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#111d15] border border-gray-200/80 dark:border-[#1e3325] shadow-xs space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <BellRing className="w-4 h-4 text-[#0b4627] dark:text-emerald-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#0b4627] dark:text-emerald-400">
                      Social Activity Alerts
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Real-time notifications for direct student interactions
                  </p>
                </div>

                <div className="space-y-3 divide-y divide-gray-100 dark:divide-[#1e3325]">
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Connection requests</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">When someone invites you to connect</p>
                    </div>
                    <ToggleSwitch checked={connRequests} onChange={setConnRequests} />
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Connection accepted</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">When a peer accepts your connection invitation</p>
                    </div>
                    <ToggleSwitch checked={connAccepted} onChange={setConnAccepted} />
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Direct messages</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">When you receive an instant message</p>
                    </div>
                    <ToggleSwitch checked={messages} onChange={setMessages} />
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Message requests</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">When a new student initiates a direct chat</p>
                    </div>
                    <ToggleSwitch checked={messageRequests} onChange={setMessageRequests} />
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Post likes</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">When peers like or react to your campus posts</p>
                    </div>
                    <ToggleSwitch checked={postLikes} onChange={setPostLikes} />
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Comments & replies</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">When peers comment on your updates or answers</p>
                    </div>
                    <ToggleSwitch checked={comments} onChange={setComments} />
                  </div>
                </div>
              </div>

              {/* Community & Campus Life Alerts */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#111d15] border border-gray-200/80 dark:border-[#1e3325] shadow-xs space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#0b4627] dark:text-emerald-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#0b4627] dark:text-emerald-400">
                      Community & Campus Events
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Updates from your enrolled clubs, study circles, and college administration
                  </p>
                </div>

                <div className="space-y-3 divide-y divide-gray-100 dark:divide-[#1e3325]">
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Community discussions & posts</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">New threads in clubs you have joined</p>
                    </div>
                    <ToggleSwitch checked={groupActivity} onChange={setGroupActivity} />
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Club announcements</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">Important notices pinned by community leads</p>
                    </div>
                    <ToggleSwitch checked={groupAnnouncements} onChange={setGroupAnnouncements} />
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Campus event reminders</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">Alerts for registered workshops, tech fests, and hackathons</p>
                    </div>
                    <ToggleSwitch checked={eventReminders} onChange={setEventReminders} />
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Official college notices</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">Broadcasts from EATM administration and department heads</p>
                    </div>
                    <ToggleSwitch checked={collegeAnnouncements} onChange={setCollegeAnnouncements} />
                  </div>
                </div>
              </div>

              {/* Delivery Channels */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#111d15] border border-gray-200/80 dark:border-[#1e3325] shadow-xs space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#0b4627] dark:text-emerald-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#0b4627] dark:text-emerald-400">
                      Delivery Channels
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    How and where you receive notifications
                  </p>
                </div>

                <div className="space-y-3 divide-y divide-gray-100 dark:divide-[#1e3325]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Browser push notifications</p>
                        {browserPushPermission === 'granted' ? (
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60">
                            Allowed
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleRequestPushPermission}
                            className="text-[10px] font-bold text-[#0b4627] dark:text-emerald-400 underline hover:opacity-80"
                          >
                            Enable in browser
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">Receive instant alerts even when the tab is backgrounded</p>
                    </div>
                    <ToggleSwitch checked={pushNotifications} onChange={setPushNotifications} />
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Email digests</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">Weekly campus summaries sent to {user?.email}</p>
                    </div>
                    <ToggleSwitch checked={emailNotifications} onChange={setEmailNotifications} />
                  </div>
                </div>
              </div>

              {/* Save Notifications Button */}
              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleSaveNotifications}
                  isLoading={saving}
                  icon={<Check className="w-4 h-4" />}
                >
                  Save Notification Preferences
                </Button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. APPEARANCE TAB */}
          {/* ========================================================================= */}
          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-5 rounded-2xl bg-white dark:bg-[#111d15] border border-gray-200/80 dark:border-[#1e3325] shadow-xs space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-[#0b4627] dark:text-emerald-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#0b4627] dark:text-emerald-400">
                      Visual Display Theme
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Select your preferred interface color mode for EATM CampusConnect
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  {[
                    {
                      id: 'light',
                      label: 'Light Mode',
                      desc: 'Clean daylight theme with crisp white cards and emerald accents',
                      icon: Sun,
                      previewBg: 'bg-gray-100 border-gray-300',
                      previewCard: 'bg-white border-gray-200 text-gray-800'
                    },
                    {
                      id: 'dark',
                      label: 'Dark Mode',
                      desc: 'Dark obsidian & forest green slate for low-light night study',
                      icon: Moon,
                      previewBg: 'bg-[#0a120d] border-[#1e3325]',
                      previewCard: 'bg-[#111d15] border-[#1e3325] text-gray-100'
                    },
                    {
                      id: 'system',
                      label: 'System Default',
                      desc: 'Automatically synchronizes with your device operating system',
                      icon: Monitor,
                      previewBg: 'bg-gradient-to-r from-gray-200 to-[#0a120d] border-gray-300 dark:border-[#1e3325]',
                      previewCard: 'bg-white/90 dark:bg-[#111d15]/90 border-gray-200 dark:border-[#1e3325] text-gray-800 dark:text-gray-100'
                    }
                  ].map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = theme === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setTheme(opt.id as any);
                          success(`Activated ${opt.label}`, 'Theme Updated');
                        }}
                        className={`flex flex-col p-4 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'border-[#0b4627] dark:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 ring-2 ring-[#0b4627]/20 dark:ring-emerald-500/30 shadow-xs'
                            : 'border-gray-200 dark:border-[#1e3325] hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-[#111d15]'
                        }`}
                      >
                        {/* Theme Mockup Visual */}
                        <div className={`w-full h-24 rounded-xl border p-2 mb-3 flex flex-col justify-between ${opt.previewBg}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-red-400" />
                              <span className="w-2 h-2 rounded-full bg-amber-400" />
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            </div>
                            <span className="text-[9px] font-mono opacity-60">EATM UI</span>
                          </div>
                          <div className={`p-2 rounded-lg border shadow-xs text-[10px] font-medium flex items-center justify-between ${opt.previewCard}`}>
                            <span>Campus Feed</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${
                              isSelected
                                ? 'bg-[#0b4627] dark:bg-emerald-500 text-white'
                                : 'bg-gray-100 dark:bg-[#16251c] text-gray-600 dark:text-gray-400'
                            }`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                              {opt.label}
                            </span>
                          </div>

                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-[#0b4627] dark:border-emerald-500 bg-[#0b4627] dark:bg-emerald-500 text-white'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>

                        <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                          {opt.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Campus Brand Color Palette Preview */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#111d15] border border-gray-200/80 dark:border-[#1e3325] shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0b4627] dark:text-emerald-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0b4627] dark:text-emerald-400">
                    Official College Palette
                  </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-[#0b4627] text-white flex flex-col justify-between h-20 shadow-xs">
                    <span className="text-[10px] font-mono opacity-80">Primary</span>
                    <span className="text-xs font-bold">EATM Forest</span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-600 text-white flex flex-col justify-between h-20 shadow-xs">
                    <span className="text-[10px] font-mono opacity-80">Accent</span>
                    <span className="text-xs font-bold">Emerald Glow</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#111d15] text-emerald-400 border border-[#1e3325] flex flex-col justify-between h-20 shadow-xs">
                    <span className="text-[10px] font-mono opacity-80">Surface</span>
                    <span className="text-xs font-bold">Obsidian Dark</span>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#16251c] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#1e3325] flex flex-col justify-between h-20 shadow-xs">
                    <span className="text-[10px] font-mono opacity-80">Neutral</span>
                    <span className="text-xs font-bold">Canvas Slate</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Change Email Modal */}
      <Modal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        title="Change Campus Email Address"
        maxWidth="sm"
      >
        <form onSubmit={handleUpdateEmail} className="space-y-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Enter your new academic or personal email. A confirmation email will be sent to complete verification with Supabase Auth.
          </p>
          <Input
            label="New Email Address"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="student@eatm.ac.in"
            leftIcon={<Mail className="w-4 h-4 text-gray-400" />}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setEmailModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={saving}>
              Save Email
            </Button>
          </div>
        </form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title="Change Account Password"
        maxWidth="sm"
      >
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Enter your new secure password (minimum 6 characters). This immediately updates your credentials in Supabase Auth.
          </p>
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            leftIcon={<Lock className="w-4 h-4 text-gray-400" />}
            required
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            leftIcon={<Lock className="w-4 h-4 text-gray-400" />}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setPasswordModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={saving}>
              Update Password
            </Button>
          </div>
        </form>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        title="Confirm Sign Out"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            Are you sure you want to sign out of EATM CampusConnect on this device?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setLogoutModalOpen(false)}>
              Stay Signed In
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
              icon={<LogOut className="w-3.5 h-3.5" />}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete EATM Account"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200/60 dark:border-red-900/50 text-xs text-red-800 dark:text-red-300 space-y-1.5">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>Warning: Irreversible Action</span>
            </p>
            <p className="text-[11px] leading-relaxed">
              This will permanently delete your account profile, posts, comments, messages, and academic projects from Supabase and EATM CampusConnect.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Type <strong className="text-red-600 dark:text-red-400 font-mono">DELETE</strong> to confirm:
            </label>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={deleteConfirmText.trim() !== 'DELETE'}
              onClick={handleDeleteAccount}
              isLoading={saving}
              icon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Permanently Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
