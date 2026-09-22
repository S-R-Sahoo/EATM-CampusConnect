import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Avatar } from '../../components/ui/Avatar';
import { 
  Settings, ChevronRight, Check, Sun, Moon, 
  LogOut, Phone, Mail, ShieldAlert, ExternalLink
} from 'lucide-react';

type ModalType = 
  | 'account'
  | 'security'
  | 'profile_privacy'
  | 'connections'
  | 'messages'
  | 'notifications'
  | 'appearance'
  | 'groups'
  | 'safety'
  | 'help'
  | 'about'
  | null;

export const StudentSettings: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const { success, error: toastError } = useToast();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [phone, setPhone] = useState(user?.phone || '');
  const [alternateEmail, setAlternateEmail] = useState(user?.settings?.account?.alternateEmail || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileVisibility, setProfileVisibility] = useState(user?.settings?.privacy?.profileVisibility || 'public');
  const [activityStatus, setActivityStatus] = useState(user?.settings?.privacy?.activityStatus ?? true);
  const [searchDiscoverability, setSearchDiscoverability] = useState(user?.settings?.privacy?.searchDiscoverability ?? true);
  const [whoCanConnect, setWhoCanConnect] = useState(user?.settings?.connections?.whoCanConnect || 'all');
  const [autoAcceptDept, setAutoAcceptDept] = useState(user?.settings?.connections?.autoAcceptDepartment ?? true);
  const [whoCanMessage, setWhoCanMessage] = useState(user?.settings?.messages?.whoCanMessage || 'all');
  const [readReceipts, setReadReceipts] = useState(user?.settings?.messages?.readReceipts ?? true);
  const [typingIndicators, setTypingIndicators] = useState(user?.settings?.messages?.typingIndicators ?? true);
  const [chatAlerts, setChatAlerts] = useState(user?.settings?.notifications?.chatAlerts ?? true);
  const [placementAlerts, setPlacementAlerts] = useState(user?.settings?.notifications?.placementAlerts ?? true);
  const [soundEffects, setSoundEffects] = useState(user?.settings?.notifications?.soundEffects ?? true);
  const [communityInvites, setCommunityInvites] = useState(user?.settings?.groups?.communityInvites ?? true);
  const [publicBadges, setPublicBadges] = useState(user?.settings?.groups?.publicMemberBadges ?? true);
  const [profanityFilter, setProfanityFilter] = useState(user?.settings?.safety?.profanityFilter ?? true);

  // Report concern state
  const [reportText, setReportText] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  // Save Account
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUser({
        phone: phone.trim() || undefined,
        settings: {
          ...(user?.settings || {}),
          account: {
            phone: phone.trim() || undefined,
            alternateEmail: alternateEmail.trim() || undefined
          }
        }
      });
      success('Account details updated successfully!', 'Saved');
      setActiveModal(null);
    } catch {
      toastError('Failed to update account.');
    } finally {
      setSaving(false);
    }
  };

  // Save Password
  const handleSavePassword = async (e: React.FormEvent) => {
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
      await updateUser({
        socialLinks: {
          ...(user?.socialLinks || {}),
          passHash: btoa(newPassword.trim())
        }
      });
      success('Password changed securely!', 'Password Updated');
      setNewPassword('');
      setConfirmPassword('');
      setActiveModal(null);
    } catch {
      toastError('Could not update password.');
    } finally {
      setSaving(false);
    }
  };

  // Generic settings saver
  const handleSaveSection = async (section: string, data: any, msg: string) => {
    setSaving(true);
    try {
      await updateUser({
        settings: {
          ...(user?.settings || {}),
          [section]: data
        }
      });
      success(msg, 'Preferences Saved');
      setActiveModal(null);
    } catch {
      toastError('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-12">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-1 pt-1">
        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-[#16251c] text-[#0b4627] dark:text-emerald-400">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
            Settings
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            EATM CampusConnect Preferences
          </p>
        </div>
      </div>

      {/* Top Profile Card */}
      <Link
        to="/student/profile"
        className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#111d15] border border-gray-200/80 dark:border-[#1e3325] hover:border-emerald-300 dark:hover:border-emerald-700 transition shadow-xs group"
      >
        <div className="flex items-center gap-3">
          <Avatar src={user?.photoURL} name={user?.displayName || 'User'} size="md" />
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-[#0b4627] dark:group-hover:text-emerald-400 transition">
              {user?.displayName || 'Student Scholar'}
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {user?.rollNumber || 'EATM Student'} • {user?.department || 'CSE'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 group-hover:text-[#0b4627] dark:group-hover:text-emerald-400 transition">
          <span>Profile</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </Link>

      {/* 1. ACCOUNT */}
      <div className="space-y-1">
        <div className="text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3">
          ACCOUNT
        </div>
        <div className="rounded-2xl bg-white dark:bg-[#111d15] border border-gray-200/80 dark:border-[#1e3325] overflow-hidden shadow-xs divide-y divide-gray-100 dark:divide-[#1e3325]">
          <button
            type="button"
            onClick={() => setActiveModal('account')}
            className="w-full flex items-center justify-between p-3.5 hover:bg-gray-50/80 dark:hover:bg-[#16251c]/60 transition text-left group"
          >
            <div className="flex items-center gap-3">
              <span className="text-base shrink-0">👤</span>
              <div>
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-[#0b4627] dark:group-hover:text-emerald-400 transition block">
                  Account
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  Credentials, contact phone, recovery email
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('security')}
            className="w-full flex items-center justify-between p-3.5 hover:bg-gray-50/80 dark:hover:bg-[#16251c]/60 transition text-left group"
          >
            <div className="flex items-center gap-3">
              <span className="text-base shrink-0">🔐</span>
              <div>
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-[#0b4627] dark:group-hover:text-emerald-400 transition block">
                  Security
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  Password, portal credentials
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition shrink-0" />
          </button>
        </div>
      </div>

      {/* 2. PROFILE */}
      <div className="space-y-1">
        <div className="text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3">
          PROFILE
        </div>
        <div className="rounded-2xl bg-white dark:bg-[#111d15] border border-gray-200/80 dark:border-[#1e3325] overflow-hidden shadow-xs divide-y divide-gray-100 dark:divide-[#1e3325]">
          <button
            type="button"
            onClick={() => setActiveModal('profile_privacy')}
            className="w-full flex items-center justify-between p-3.5 hover:bg-gray-50/80 dark:hover:bg-[#16251c]/60 transition text-left group"
          >
            <div className="flex items-center gap-3">
              <span className="text-base shrink-0">👤</span>
              <div>
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-[#0b4627] dark:group-hover:text-emerald-400 transition block">
                  Profile & Privacy
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  Visibility, search discoverability, online status
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('connections')}
            className="w-full flex items-center justify-between p-3.5 hover:bg-gray-50/80 dark:hover:bg-[#16251c]/60 transition text-left group"
          >
            <div className="flex items-center gap-3">
              <span className="text-base shrink-0">👥</span>
              <div>
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-[#0b4627] dark:group-hover:text-emerald-400 transition block">
                  Connections
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  Who can connect, batch peer networking
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('messages')}
            className="w-full flex items-center justify-between p-3.5 hover:bg-gray-50/80 dark:hover:bg-[#16251c]/60 transition text-left group"
          >
            <div className="flex items-center gap-3">
              <span className="text-base shrink-0">💬</span>
              <div>
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-[#0b4627] dark:group-hover:text-emerald-400 transition block">
                  Messages
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  Read receipts, typing indicators, permissions
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition shrink-0" />
          </button>
        </div>
      </div>

      {/* 3. APP */}
      <div className="space-y-1">
        <div className="text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3">
          APP
        </div>
        <div className="rounded-2xl bg-white dark:bg-[#111d15] border border-gray-200/80 dark:border-[#1e3325] overflow-hidden shadow-xs divide-y divide-gray-100 dark:divide-[#1e3325]">
          <button
            type="button"
            onClick={() => setActiveModal('notifications')}
            className="w-full flex items-center justify-between p-3.5 hover:bg-gray-50/80 dark:hover:bg-[#16251c]/60 transition text-left group"
          >
            <div className="flex items-center gap-3">
              <span className="text-base shrink-0">🔔</span>
              <div>
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-[#0b4627] dark:group-hover:text-emerald-400 transition block">
                  Notifications
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  Chat alerts, placements, sound chimes
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('appearance')}
            className="w-full flex items-center justify-between p-3.5 hover:bg-gray-50/80 dark:hover:bg-[#16251c]/60 transition text-left group"
          >
            <div className="flex items-center gap-3">
              <span className="text-base shrink-0">🎨</span>
              <div>
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-[#0b4627] dark:group-hover:text-emerald-400 transition block">
                  Appearance
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  Theme: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-[#16251c] text-gray-600 dark:text-gray-300">
                {theme === 'dark' ? 'Dark' : 'Light'}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('groups')}
            className="w-full flex items-center justify-between p-3.5 hover:bg-gray-50/80 dark:hover:bg-[#16251c]/60 transition text-left group"
          >
            <div className="flex items-center gap-3">
              <span className="text-base shrink-0">👥</span>
              <div>
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-[#0b4627] dark:group-hover:text-emerald-400 transition block">
                  Groups
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  Campus clubs, societies, membership badges
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition shrink-0" />
          </button>
        </div>
      </div>

      {/* 4. SAFETY */}
      <div className="space-y-1">
        <div className="text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3">
          SAFETY
        </div>
        <div className="rounded-2xl bg-white dark:bg-[#111d15] border border-gray-200/80 dark:border-[#1e3325] overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => setActiveModal('safety')}
            className="w-full flex items-center justify-between p-3.5 hover:bg-gray-50/80 dark:hover:bg-[#16251c]/60 transition text-left group"
          >
            <div className="flex items-center gap-3">
              <span className="text-base shrink-0">🛡️</span>
              <div>
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-[#0b4627] dark:group-hover:text-emerald-400 transition block">
                  Safety & Blocking
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  Anti-ragging policy, content filters, report concern
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition shrink-0" />
          </button>
        </div>
      </div>

      {/* 5. SUPPORT */}
      <div className="space-y-1">
        <div className="text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3">
          SUPPORT
        </div>
        <div className="rounded-2xl bg-white dark:bg-[#111d15] border border-gray-200/80 dark:border-[#1e3325] overflow-hidden shadow-xs divide-y divide-gray-100 dark:divide-[#1e3325]">
          <button
            type="button"
            onClick={() => setActiveModal('help')}
            className="w-full flex items-center justify-between p-3.5 hover:bg-gray-50/80 dark:hover:bg-[#16251c]/60 transition text-left group"
          >
            <div className="flex items-center gap-3">
              <span className="text-base shrink-0">❓</span>
              <div>
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-[#0b4627] dark:group-hover:text-emerald-400 transition block">
                  Help & Support
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  IT helpdesk, FAQs, academic contacts
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('about')}
            className="w-full flex items-center justify-between p-3.5 hover:bg-gray-50/80 dark:hover:bg-[#16251c]/60 transition text-left group"
          >
            <div className="flex items-center gap-3">
              <span className="text-base shrink-0">ℹ️</span>
              <div>
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-[#0b4627] dark:group-hover:text-emerald-400 transition block">
                  About
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  EATM CampusConnect v1.2.0 • BPUT
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition shrink-0" />
          </button>
        </div>
      </div>

      {/* Log Out */}
      <div className="pt-2">
        <button
          type="button"
          onClick={async () => {
            await logout();
            navigate('/login');
          }}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-red-50/70 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 text-xs font-bold transition border border-red-200/60 dark:border-red-900/40"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MODALS FOR EACH SETTING */}
      {/* ========================================================================= */}

      {/* 👤 Account Modal */}
      <Modal
        isOpen={activeModal === 'account'}
        onClose={() => setActiveModal(null)}
        title="Account Information"
        maxWidth="sm"
      >
        <form onSubmit={handleSaveAccount} className="space-y-3.5">
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#16251c] text-xs space-y-1">
            <p className="font-bold text-gray-900 dark:text-gray-100">{user?.displayName}</p>
            <p className="text-[11px] text-gray-500">Roll: {user?.rollNumber || 'EATM Student'}</p>
            <p className="text-[11px] text-gray-500">Dept: {user?.department || 'CSE'}</p>
          </div>

          <Input
            label="College Email"
            value={user?.email || ''}
            disabled
            leftIcon={<Mail className="w-4 h-4 text-gray-400" />}
          />

          <Input
            label="Mobile Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            leftIcon={<Phone className="w-4 h-4 text-gray-400" />}
          />

          <Input
            label="Recovery / Alternate Email"
            value={alternateEmail}
            onChange={(e) => setAlternateEmail(e.target.value)}
            placeholder="personal@gmail.com"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={saving}>
              Save
            </Button>
          </div>
        </form>
      </Modal>

      {/* 🔐 Security Modal */}
      <Modal
        isOpen={activeModal === 'security'}
        onClose={() => setActiveModal(null)}
        title="Security & Password"
        maxWidth="sm"
      >
        <form onSubmit={handleSavePassword} className="space-y-3.5">
          <p className="text-xs text-gray-500">
            Change your portal login password. Minimum 6 characters.
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
            <Button type="button" variant="outline" size="sm" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={saving}>
              Update Password
            </Button>
          </div>
        </form>
      </Modal>

      {/* 👤 Profile & Privacy Modal */}
      <Modal
        isOpen={activeModal === 'profile_privacy'}
        onClose={() => setActiveModal(null)}
        title="Profile & Privacy"
        maxWidth="sm"
      >
        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              Profile Visibility
            </label>
            <select
              value={profileVisibility}
              onChange={(e) => setProfileVisibility(e.target.value)}
              className="w-full p-2.5 text-xs bg-gray-50 dark:bg-[#16251c] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#1e3325] rounded-xl outline-none"
            >
              <option value="public">Public to All Campus</option>
              <option value="connections">Approved Connections Only</option>
              <option value="department">My Department Only</option>
            </select>
          </div>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-[#16251c] cursor-pointer">
            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
              Online Activity Status
            </span>
            <input
              type="checkbox"
              checked={activityStatus}
              onChange={(e) => setActivityStatus(e.target.checked)}
              className="w-4 h-4 accent-[#0b4627]"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-[#16251c] cursor-pointer">
            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
              Campus Search Discoverability
            </span>
            <input
              type="checkbox"
              checked={searchDiscoverability}
              onChange={(e) => setSearchDiscoverability(e.target.checked)}
              className="w-4 h-4 accent-[#0b4627]"
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={saving}
              onClick={() => handleSaveSection('privacy', { profileVisibility, activityStatus, searchDiscoverability }, 'Privacy updated!')}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* 👥 Connections Modal */}
      <Modal
        isOpen={activeModal === 'connections'}
        onClose={() => setActiveModal(null)}
        title="Connections"
        maxWidth="sm"
      >
        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              Who Can Send Connection Requests
            </label>
            <select
              value={whoCanConnect}
              onChange={(e) => setWhoCanConnect(e.target.value)}
              className="w-full p-2.5 text-xs bg-gray-50 dark:bg-[#16251c] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#1e3325] rounded-xl outline-none"
            >
              <option value="all">Everyone on Campus</option>
              <option value="department">Department Peers Only</option>
              <option value="none">Nobody (Pause Invites)</option>
            </select>
          </div>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-[#16251c] cursor-pointer">
            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
              Auto-Approve Batch Classmates
            </span>
            <input
              type="checkbox"
              checked={autoAcceptDept}
              onChange={(e) => setAutoAcceptDept(e.target.checked)}
              className="w-4 h-4 accent-[#0b4627]"
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={saving}
              onClick={() => handleSaveSection('connections', { whoCanConnect, autoAcceptDepartment: autoAcceptDept }, 'Connections updated!')}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* 💬 Messages Modal */}
      <Modal
        isOpen={activeModal === 'messages'}
        onClose={() => setActiveModal(null)}
        title="Messages"
        maxWidth="sm"
      >
        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              Who Can Message You
            </label>
            <select
              value={whoCanMessage}
              onChange={(e) => setWhoCanMessage(e.target.value)}
              className="w-full p-2.5 text-xs bg-gray-50 dark:bg-[#16251c] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#1e3325] rounded-xl outline-none"
            >
              <option value="all">All Campus Members</option>
              <option value="connections">Connections Only</option>
            </select>
          </div>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-[#16251c] cursor-pointer">
            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
              Read Receipts (Blue Ticks)
            </span>
            <input
              type="checkbox"
              checked={readReceipts}
              onChange={(e) => setReadReceipts(e.target.checked)}
              className="w-4 h-4 accent-[#0b4627]"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-[#16251c] cursor-pointer">
            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
              Typing Indicators
            </span>
            <input
              type="checkbox"
              checked={typingIndicators}
              onChange={(e) => setTypingIndicators(e.target.checked)}
              className="w-4 h-4 accent-[#0b4627]"
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={saving}
              onClick={() => handleSaveSection('messages', { whoCanMessage, readReceipts, typingIndicators }, 'Message settings saved!')}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* 🔔 Notifications Modal */}
      <Modal
        isOpen={activeModal === 'notifications'}
        onClose={() => setActiveModal(null)}
        title="Notifications"
        maxWidth="sm"
      >
        <div className="space-y-3">
          <label className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-[#16251c] cursor-pointer">
            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
              Chat & Direct Message Alerts
            </span>
            <input
              type="checkbox"
              checked={chatAlerts}
              onChange={(e) => setChatAlerts(e.target.checked)}
              className="w-4 h-4 accent-[#0b4627]"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-[#16251c] cursor-pointer">
            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
              T&P Placement & Internship Drives
            </span>
            <input
              type="checkbox"
              checked={placementAlerts}
              onChange={(e) => setPlacementAlerts(e.target.checked)}
              className="w-4 h-4 accent-[#0b4627]"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-[#16251c] cursor-pointer">
            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
              In-App Sound Chimes
            </span>
            <input
              type="checkbox"
              checked={soundEffects}
              onChange={(e) => setSoundEffects(e.target.checked)}
              className="w-4 h-4 accent-[#0b4627]"
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={saving}
              onClick={() => handleSaveSection('notifications', { chatAlerts, placementAlerts, soundEffects }, 'Notifications saved!')}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* 🎨 Appearance Modal */}
      <Modal
        isOpen={activeModal === 'appearance'}
        onClose={() => setActiveModal(null)}
        title="Appearance"
        maxWidth="sm"
      >
        <div className="space-y-3">
          <p className="text-xs text-gray-500">Choose your display theme:</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setTheme('light');
                success('Activated Light Mode', 'Theme Changed');
              }}
              className={`p-4 rounded-xl border text-center transition flex flex-col items-center gap-2 ${
                theme === 'light'
                  ? 'border-[#0b4627] bg-emerald-50 text-[#0b4627] font-bold ring-2 ring-[#0b4627]/20'
                  : 'border-gray-200 dark:border-[#1e3325] text-gray-600 dark:text-gray-300'
              }`}
            >
              <Sun className="w-5 h-5 text-amber-500" />
              <span className="text-xs">Light Mode</span>
              {theme === 'light' && <Check className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setTheme('dark');
                success('Activated Dark Mode', 'Theme Changed');
              }}
              className={`p-4 rounded-xl border text-center transition flex flex-col items-center gap-2 ${
                theme === 'dark'
                  ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 font-bold ring-2 ring-emerald-500/20'
                  : 'border-gray-200 dark:border-[#1e3325] text-gray-600 dark:text-gray-300'
              }`}
            >
              <Moon className="w-5 h-5 text-emerald-400" />
              <span className="text-xs">Dark Mode</span>
              {theme === 'dark' && <Check className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="button" variant="primary" size="sm" onClick={() => setActiveModal(null)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* 👥 Groups Modal */}
      <Modal
        isOpen={activeModal === 'groups'}
        onClose={() => setActiveModal(null)}
        title="Groups & Clubs"
        maxWidth="sm"
      >
        <div className="space-y-3">
          <label className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-[#16251c] cursor-pointer">
            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
              Club & Society Invitations
            </span>
            <input
              type="checkbox"
              checked={communityInvites}
              onChange={(e) => setCommunityInvites(e.target.checked)}
              className="w-4 h-4 accent-[#0b4627]"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-[#16251c] cursor-pointer">
            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
              Show Club Membership Badges
            </span>
            <input
              type="checkbox"
              checked={publicBadges}
              onChange={(e) => setPublicBadges(e.target.checked)}
              className="w-4 h-4 accent-[#0b4627]"
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={saving}
              onClick={() => handleSaveSection('groups', { communityInvites, publicMemberBadges: publicBadges }, 'Groups saved!')}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* 🛡️ Safety & Blocking Modal */}
      <Modal
        isOpen={activeModal === 'safety'}
        onClose={() => setActiveModal(null)}
        title="Safety & Blocking"
        maxWidth="sm"
      >
        <div className="space-y-3.5">
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-xs text-red-800 dark:text-red-300 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <span>EATM Anti-Ragging Policy</span>
            </p>
            <p className="text-[11px] leading-relaxed">
              Harassment or bullying is strictly prohibited under university guidelines.
            </p>
          </div>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-[#16251c] cursor-pointer">
            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
              Strict Academic Content Filter
            </span>
            <input
              type="checkbox"
              checked={profanityFilter}
              onChange={(e) => setProfanityFilter(e.target.checked)}
              className="w-4 h-4 accent-[#0b4627]"
            />
          </label>

          <div className="pt-2 border-t border-gray-100 dark:border-[#1e3325]">
            <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-1.5">
              Report an Incident
            </p>
            {reportSubmitted ? (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                ✓ Confidential report submitted to Proctor Cell.
              </p>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="Describe concern or names involved..."
                  rows={2}
                  className="w-full p-2.5 text-xs rounded-xl border border-gray-200 dark:border-[#1e3325] bg-white dark:bg-[#16251c] outline-none"
                />
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    if (reportText.trim()) {
                      setReportSubmitted(true);
                      success('Report sent to Campus Proctor.', 'Report Received');
                    }
                  }}
                >
                  Submit Confidential Report
                </Button>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setActiveModal(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* ❓ Help & Support Modal */}
      <Modal
        isOpen={activeModal === 'help'}
        onClose={() => setActiveModal(null)}
        title="Help & Support"
        maxWidth="sm"
      >
        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#16251c] space-y-1">
            <p className="font-bold text-[#0b4627] dark:text-emerald-400">Campus IT Helpdesk</p>
            <p className="font-mono text-[11px] text-gray-600 dark:text-gray-300">support@eatm.ac.in</p>
            <p className="text-[10px] text-gray-400">Academic Block 1, Central Lab</p>
          </div>

          <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#16251c] space-y-1">
            <p className="font-bold text-[#0b4627] dark:text-emerald-400">Academic Section</p>
            <p className="font-mono text-[11px] text-gray-600 dark:text-gray-300">dean.academics@eatm.ac.in</p>
            <p className="text-[10px] text-gray-400">Hours: Mon-Sat 9:30 AM - 4:30 PM</p>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="button" variant="primary" size="sm" onClick={() => setActiveModal(null)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* ℹ️ About Modal */}
      <Modal
        isOpen={activeModal === 'about'}
        onClose={() => setActiveModal(null)}
        title="About"
        maxWidth="sm"
      >
        <div className="space-y-3 text-xs">
          <div className="text-center py-2 space-y-1">
            <h3 className="font-black text-sm text-gray-900 dark:text-gray-100">
              EATM CampusConnect
            </h3>
            <p className="text-[11px] text-gray-500 font-mono">Version 1.2.0 (Official Build)</p>
          </div>

          <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#16251c] text-[11px] space-y-1.5 text-gray-600 dark:text-gray-300">
            <p><strong>Institution:</strong> Einstein Academy of Technology & Management</p>
            <p><strong>Affiliation:</strong> Biju Patnaik University of Technology (BPUT)</p>
            <p><strong>Accreditation:</strong> NAAC Accredited • AICTE Approved</p>
            <p><strong>Location:</strong> Bhubaneswar, Odisha - 752060</p>
          </div>

          <div className="text-center pt-1">
            <a
              href="https://eatm.in"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-[#0b4627] dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
            >
              <span>Visit Official College Website (eatm.in)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="button" variant="primary" size="sm" onClick={() => setActiveModal(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
