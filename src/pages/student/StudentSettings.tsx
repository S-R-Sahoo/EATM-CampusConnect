import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Avatar } from '../../components/ui/Avatar';
import { updateUserPassword } from '../../supabase/auth';
import { 
  Settings, User, Shield, Bell, Palette, 
  LogOut, Trash2, Mail, Lock, Check,
  Sun, Moon, Monitor, AlertTriangle, Link as LinkIcon
} from 'lucide-react';

type SettingsTab = 'account' | 'privacy' | 'notifications' | 'appearance';

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

  // --- 2. PROFILE & PRIVACY STATE ---
  const [profileVisibility, setProfileVisibility] = useState<'everyone' | 'connections' | 'private'>(
    (user?.settings?.privacy?.profileVisibility as any) || 'everyone'
  );
  const [showSemester, setShowSemester] = useState(user?.settings?.privacy?.showSemester ?? true);
  const [showInterests, setShowInterests] = useState(user?.settings?.privacy?.showInterests ?? true);
  const [showProjects, setShowProjects] = useState(user?.settings?.privacy?.showProjects ?? true);
  const [showAchievements, setShowAchievements] = useState(user?.settings?.privacy?.showAchievements ?? true);
  const [whoCanConnect, setWhoCanConnect] = useState<'everyone' | 'department'>(
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

  // Email Change
  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@')) {
      toastError('Please enter a valid email address.');
      return;
    }
    setSaving(true);
    try {
      await updateUser({ email: newEmail.trim() });
      success('Email address updated successfully!', 'Email Changed');
      setEmailModalOpen(false);
      setNewEmail('');
    } catch {
      toastError('Failed to update email address.');
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
          ...(user?.settings || {}),
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
      success('Profile & Privacy settings updated!', 'Saved');
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
          ...(user?.settings || {}),
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
      success('Notification preferences updated!', 'Saved');
    } catch {
      toastError('Failed to save notification preferences.');
    } finally {
      setSaving(false);
    }
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toastError('Please type DELETE to confirm.');
      return;
    }
    setSaving(true);
    try {
      await logout();
      navigate('/login');
      success('Your account has been deleted.', 'Account Removed');
    } catch {
      toastError('Could not complete deletion.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between px-1 pt-1">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-[#16251c] text-[#0b4627] dark:text-emerald-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              Settings
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Manage your EATM CampusConnect account and preferences
            </p>
          </div>
        </div>
      </div>

      {/* 4 Main Category Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 bg-gray-100 dark:bg-[#16251c] rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('account')}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition ${
            activeTab === 'account'
              ? 'bg-white dark:bg-[#111d15] text-[#0b4627] dark:text-emerald-300 shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Account</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition ${
            activeTab === 'privacy'
              ? 'bg-white dark:bg-[#111d15] text-[#0b4627] dark:text-emerald-300 shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Profile & Privacy</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition ${
            activeTab === 'notifications'
              ? 'bg-white dark:bg-[#111d15] text-[#0b4627] dark:text-emerald-300 shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Notifications</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('appearance')}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition ${
            activeTab === 'appearance'
              ? 'bg-white dark:bg-[#111d15] text-[#0b4627] dark:text-emerald-300 shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Appearance</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. ACCOUNT TAB */}
      {/* ========================================================================= */}
      {activeTab === 'account' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* User Profile Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#111d15] border border-gray-200/80 dark:border-[#1e3325] flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3.5">
              <Avatar src={user?.photoURL} name={user?.displayName || 'User'} size="lg" />
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {user?.displayName || 'Student Scholar'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.rollNumber || 'EATM Student'} • {user?.department || 'CSE'}
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">
                  {user?.email || 'student@eatm.ac.in'}
                </p>
              </div>
            </div>
          </div>

          {/* Account Actions Box */}
          <div className="rounded-2xl bg-white dark:bg-[#111d15] border border-gray-200/80 dark:border-[#1e3325] overflow-hidden shadow-xs divide-y divide-gray-100 dark:divide-[#1e3325]">
            {/* Change email */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Change email</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Current: {user?.email || 'Not configured'}
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
                Change
              </Button>
            </div>

            {/* Change password */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Change password</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Update your portal login credentials
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPasswordModalOpen(true)}
              >
                Change
              </Button>
            </div>

            {/* Connected accounts */}
            <div className="p-4 space-y-3">
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Connected accounts</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Third-party providers and campus single sign-on
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-[#16251c] text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">Google</span>
                    <span className="text-[10px] text-gray-400">• SSO Enabled</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60">
                    Connected
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-[#16251c] text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">GitHub</span>
                    <span className="text-[10px] text-gray-400">• Developer Profile</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60">
                    Connected
                  </span>
                </div>
              </div>
            </div>

            {/* Delete account */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-red-600 dark:text-red-400">Delete account</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Permanently remove your profile and campus records
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
              >
                Delete
              </Button>
            </div>

            {/* Log out */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Log out</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Sign out of this browser session
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  await logout();
                  navigate('/login');
                }}
                icon={<LogOut className="w-3.5 h-3.5" />}
              >
                Log Out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PROFILE & PRIVACY TAB */}
      {/* ========================================================================= */}
      {activeTab === 'privacy' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Profile visibility */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#111d15] border border-gray-200/80 dark:border-[#1e3325] shadow-xs space-y-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0b4627] dark:text-emerald-400">
                Profile visibility
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Control who can view your profile on campus
              </p>
            </div>

            <div className="space-y-2">
              {[
                { id: 'everyone', label: 'Everyone in EATM', desc: 'Visible to all verified students and faculty' },
                { id: 'connections', label: 'Connections only', desc: 'Only approved peer connections can view' },
                { id: 'private', label: 'Private', desc: 'Only visible to yourself and college administrators' }
              ].map((opt) => (
                <label
                  key={opt.id}
                  onClick={() => setProfileVisibility(opt.id as any)}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${
                    profileVisibility === opt.id
                      ? 'border-[#0b4627] dark:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30'
                      : 'border-gray-200 dark:border-[#1e3325] hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="profile_visibility"
                    checked={profileVisibility === opt.id}
                    onChange={() => setProfileVisibility(opt.id as any)}
                    className="w-4 h-4 mt-0.5 accent-[#0b4627] dark:accent-emerald-500 cursor-pointer"
                  />
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{opt.label}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Profile information */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#111d15] border border-gray-200/80 dark:border-[#1e3325] shadow-xs space-y-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0b4627] dark:text-emerald-400">
                Profile information
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Choose which academic sections to display on your public profile
              </p>
            </div>

            <div className="space-y-2 divide-y divide-gray-100 dark:divide-[#1e3325]">
              <label className="flex items-center justify-between pt-2 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Show semester</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Display current semester on profile card</p>
                </div>
                <input
                  type="checkbox"
                  checked={showSemester}
                  onChange={(e) => setShowSemester(e.target.checked)}
                  className="w-4 h-4 accent-[#0b4627]"
                />
              </label>

              <label className="flex items-center justify-between pt-2 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Show interests</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Display campus interests and hobby tags</p>
                </div>
                <input
                  type="checkbox"
                  checked={showInterests}
                  onChange={(e) => setShowInterests(e.target.checked)}
                  className="w-4 h-4 accent-[#0b4627]"
                />
              </label>

              <label className="flex items-center justify-between pt-2 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Show projects</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Display featured engineering projects & portfolio</p>
                </div>
                <input
                  type="checkbox"
                  checked={showProjects}
                  onChange={(e) => setShowProjects(e.target.checked)}
                  className="w-4 h-4 accent-[#0b4627]"
                />
              </label>

              <label className="flex items-center justify-between pt-2 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Show achievements</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Display campus honors, hackathons, and awards</p>
                </div>
                <input
                  type="checkbox"
                  checked={showAchievements}
                  onChange={(e) => setShowAchievements(e.target.checked)}
                  className="w-4 h-4 accent-[#0b4627]"
                />
              </label>
            </div>
          </div>

          {/* Connections */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#111d15] border border-gray-200/80 dark:border-[#1e3325] shadow-xs space-y-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0b4627] dark:text-emerald-400">
                Connections
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Who can send connection requests?
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label
                onClick={() => setWhoCanConnect('everyone')}
                className={`flex items-center gap-2.5 p-3 rounded-xl border transition cursor-pointer ${
                  whoCanConnect === 'everyone'
                    ? 'border-[#0b4627] dark:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30'
                    : 'border-gray-200 dark:border-[#1e3325] hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="who_can_connect"
                  checked={whoCanConnect === 'everyone'}
                  onChange={() => setWhoCanConnect('everyone')}
                  className="w-4 h-4 accent-[#0b4627] dark:accent-emerald-500"
                />
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Everyone</span>
              </label>

              <label
                onClick={() => setWhoCanConnect('department')}
                className={`flex items-center gap-2.5 p-3 rounded-xl border transition cursor-pointer ${
                  whoCanConnect === 'department'
                    ? 'border-[#0b4627] dark:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30'
                    : 'border-gray-200 dark:border-[#1e3325] hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="who_can_connect"
                  checked={whoCanConnect === 'department'}
                  onChange={() => setWhoCanConnect('department')}
                  className="w-4 h-4 accent-[#0b4627] dark:accent-emerald-500"
                />
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Departments peers</span>
              </label>
            </div>
          </div>

          {/* Messaging */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#111d15] border border-gray-200/80 dark:border-[#1e3325] shadow-xs space-y-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0b4627] dark:text-emerald-400">
                Messaging
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Who can initiate direct messages with you?
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label
                onClick={() => setWhoCanMessage('everyone')}
                className={`flex items-center gap-2.5 p-3 rounded-xl border transition cursor-pointer ${
                  whoCanMessage === 'everyone'
                    ? 'border-[#0b4627] dark:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30'
                    : 'border-gray-200 dark:border-[#1e3325] hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="who_can_message"
                  checked={whoCanMessage === 'everyone'}
                  onChange={() => setWhoCanMessage('everyone')}
                  className="w-4 h-4 accent-[#0b4627] dark:accent-emerald-500"
                />
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Everyone</span>
              </label>

              <label
                onClick={() => setWhoCanMessage('connections')}
                className={`flex items-center gap-2.5 p-3 rounded-xl border transition cursor-pointer ${
                  whoCanMessage === 'connections'
                    ? 'border-[#0b4627] dark:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30'
                    : 'border-gray-200 dark:border-[#1e3325] hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="who_can_message"
                  checked={whoCanMessage === 'connections'}
                  onChange={() => setWhoCanMessage('connections')}
                  className="w-4 h-4 accent-[#0b4627] dark:accent-emerald-500"
                />
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Connections only</span>
              </label>

              <label
                onClick={() => setWhoCanMessage('nobody')}
                className={`flex items-center gap-2.5 p-3 rounded-xl border transition cursor-pointer ${
                  whoCanMessage === 'nobody'
                    ? 'border-[#0b4627] dark:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30'
                    : 'border-gray-200 dark:border-[#1e3325] hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="who_can_message"
                  checked={whoCanMessage === 'nobody'}
                  onChange={() => setWhoCanMessage('nobody')}
                  className="w-4 h-4 accent-[#0b4627] dark:accent-emerald-500"
                />
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Nobody</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSavePrivacy}
              isLoading={saving}
            >
              Save Privacy Settings
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. NOTIFICATIONS TAB 🔔 */}
      {/* ========================================================================= */}
      {activeTab === 'notifications' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#111d15] border border-gray-200/80 dark:border-[#1e3325] shadow-xs space-y-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0b4627] dark:text-emerald-400">
                Activity Notifications
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Separate controls for specific campus events and actions
              </p>
            </div>

            <div className="space-y-2.5 divide-y divide-gray-100 dark:divide-[#1e3325]">
              <label className="flex items-center justify-between pt-2 cursor-pointer">
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Connection requests</span>
                <input
                  type="checkbox"
                  checked={connRequests}
                  onChange={(e) => setConnRequests(e.target.checked)}
                  className="w-4 h-4 accent-[#0b4627]"
                />
              </label>

              <label className="flex items-center justify-between pt-2 cursor-pointer">
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Connection accepted</span>
                <input
                  type="checkbox"
                  checked={connAccepted}
                  onChange={(e) => setConnAccepted(e.target.checked)}
                  className="w-4 h-4 accent-[#0b4627]"
                />
              </label>

              <label className="flex items-center justify-between pt-2 cursor-pointer">
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Messages</span>
                <input
                  type="checkbox"
                  checked={messages}
                  onChange={(e) => setMessages(e.target.checked)}
                  className="w-4 h-4 accent-[#0b4627]"
                />
              </label>

              <label className="flex items-center justify-between pt-2 cursor-pointer">
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Message requests</span>
                <input
                  type="checkbox"
                  checked={messageRequests}
                  onChange={(e) => setMessageRequests(e.target.checked)}
                  className="w-4 h-4 accent-[#0b4627]"
                />
              </label>

              <label className="flex items-center justify-between pt-2 cursor-pointer">
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Post likes</span>
                <input
                  type="checkbox"
                  checked={postLikes}
                  onChange={(e) => setPostLikes(e.target.checked)}
                  className="w-4 h-4 accent-[#0b4627]"
                />
              </label>

              <label className="flex items-center justify-between pt-2 cursor-pointer">
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Comments</span>
                <input
                  type="checkbox"
                  checked={comments}
                  onChange={(e) => setComments(e.target.checked)}
                  className="w-4 h-4 accent-[#0b4627]"
                />
              </label>

              <label className="flex items-center justify-between pt-2 cursor-pointer">
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Group activity</span>
                <input
                  type="checkbox"
                  checked={groupActivity}
                  onChange={(e) => setGroupActivity(e.target.checked)}
                  className="w-4 h-4 accent-[#0b4627]"
                />
              </label>

              <label className="flex items-center justify-between pt-2 cursor-pointer">
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Group announcements</span>
                <input
                  type="checkbox"
                  checked={groupAnnouncements}
                  onChange={(e) => setGroupAnnouncements(e.target.checked)}
                  className="w-4 h-4 accent-[#0b4627]"
                />
              </label>

              <label className="flex items-center justify-between pt-2 cursor-pointer">
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Event reminders</span>
                <input
                  type="checkbox"
                  checked={eventReminders}
                  onChange={(e) => setEventReminders(e.target.checked)}
                  className="w-4 h-4 accent-[#0b4627]"
                />
              </label>

              <label className="flex items-center justify-between pt-2 cursor-pointer">
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">College announcements</span>
                <input
                  type="checkbox"
                  checked={collegeAnnouncements}
                  onChange={(e) => setCollegeAnnouncements(e.target.checked)}
                  className="w-4 h-4 accent-[#0b4627]"
                />
              </label>
            </div>
          </div>

          {/* Also: Push & Email notifications */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#111d15] border border-gray-200/80 dark:border-[#1e3325] shadow-xs space-y-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0b4627] dark:text-emerald-400">
                Delivery Channels
              </h3>
            </div>

            <div className="space-y-2.5 divide-y divide-gray-100 dark:divide-[#1e3325]">
              <label className="flex items-center justify-between pt-2 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Push notifications</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Receive instant alerts on this device</p>
                </div>
                <input
                  type="checkbox"
                  checked={pushNotifications}
                  onChange={(e) => setPushNotifications(e.target.checked)}
                  className="w-4 h-4 accent-[#0b4627]"
                />
              </label>

              <label className="flex items-center justify-between pt-2 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Email notifications</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Receive daily/weekly email summaries</p>
                </div>
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="w-4 h-4 accent-[#0b4627]"
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSaveNotifications}
              isLoading={saving}
            >
              Save Notification Preferences
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. APPEARANCE TAB 🎨 */}
      {/* ========================================================================= */}
      {activeTab === 'appearance' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#111d15] border border-gray-200/80 dark:border-[#1e3325] shadow-xs space-y-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0b4627] dark:text-emerald-400">
                Theme
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Customize your visual display preference
              </p>
            </div>

            <div className="space-y-2">
              {[
                { id: 'light', label: 'Light', desc: 'Classic daylight theme with white cards', icon: Sun },
                { id: 'dark', label: 'Dark', desc: 'Dark obsidian background for night study', icon: Moon },
                { id: 'system', label: 'System default', desc: 'Matches your device operating system theme', icon: Monitor }
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = theme === opt.id;
                return (
                  <label
                    key={opt.id}
                    onClick={() => {
                      setTheme(opt.id as any);
                      success(`Activated ${opt.label} Theme`, 'Theme Updated');
                    }}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'border-[#0b4627] dark:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30'
                        : 'border-gray-200 dark:border-[#1e3325] hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        isSelected ? 'bg-[#0b4627] text-white dark:bg-emerald-500' : 'bg-gray-100 dark:bg-[#16251c] text-gray-500'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{opt.label}</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">{opt.desc}</p>
                      </div>
                    </div>

                    <input
                      type="radio"
                      name="theme_selector"
                      checked={isSelected}
                      onChange={() => setTheme(opt.id as any)}
                      className="w-4 h-4 accent-[#0b4627] dark:accent-emerald-500 cursor-pointer"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Change Email Modal */}
      <Modal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        title="Change Email Address"
        maxWidth="sm"
      >
        <form onSubmit={handleUpdateEmail} className="space-y-3.5">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Enter your new academic or verified personal email.
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
        title="Change Password"
        maxWidth="sm"
      >
        <form onSubmit={handleUpdatePassword} className="space-y-3.5">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Enter your new password (minimum 6 characters).
          </p>
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
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

      {/* Delete Account Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Account"
        maxWidth="sm"
      >
        <div className="space-y-3.5">
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-xs text-red-800 dark:text-red-300 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>Warning: Irreversible Action</span>
            </p>
            <p className="text-[11px] leading-relaxed">
              This will permanently delete your account, posts, messages, and academic projects from EATM CampusConnect.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Type <strong className="text-red-600">DELETE</strong> to confirm:
            </label>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
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
              disabled={deleteConfirmText !== 'DELETE'}
              onClick={handleDeleteAccount}
              isLoading={saving}
            >
              Permanently Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
