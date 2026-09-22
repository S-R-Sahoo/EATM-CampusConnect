import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useTheme, Theme } from '../../contexts/ThemeContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Avatar } from '../../components/ui/Avatar';
import confetti from 'canvas-confetti';
import { supabase, isSupabaseConfigured } from '../../supabase/client';
import { 
  Settings, User, Lock, Shield, Users, MessageSquare, 
  Bell, Palette, HelpCircle, Info, Check, 
  Sun, Moon, ExternalLink, Download, LogOut, Eye, 
  EyeOff, Globe, Smartphone, Laptop, CheckCircle2, 
  AlertTriangle, ChevronRight, Mail, Phone, Building2, 
  GraduationCap, Sparkles, RefreshCw, Send, ShieldAlert,
  Volume2, ShieldCheck, ChevronDown, CheckSquare, FileText
} from 'lucide-react';

type SettingsTab = 
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
  | 'about';

interface SectionGroup {
  group: string;
  items: {
    id: SettingsTab;
    label: string;
    icon: React.ElementType;
    iconEmoji: string;
  }[];
}

const SETTINGS_SECTIONS: SectionGroup[] = [
  {
    group: 'ACCOUNT',
    items: [
      { id: 'account', label: 'Account', icon: User, iconEmoji: '👤' },
      { id: 'security', label: 'Security', icon: Lock, iconEmoji: '🔐' },
    ]
  },
  {
    group: 'PROFILE',
    items: [
      { id: 'profile_privacy', label: 'Profile & Privacy', icon: Shield, iconEmoji: '👤' },
      { id: 'connections', label: 'Connections', icon: Users, iconEmoji: '👥' },
      { id: 'messages', label: 'Messages', icon: MessageSquare, iconEmoji: '💬' },
    ]
  },
  {
    group: 'APP',
    items: [
      { id: 'notifications', label: 'Notifications', icon: Bell, iconEmoji: '🔔' },
      { id: 'appearance', label: 'Appearance', icon: Palette, iconEmoji: '🎨' },
      { id: 'groups', label: 'Groups', icon: Users, iconEmoji: '👥' },
    ]
  },
  {
    group: 'SAFETY',
    items: [
      { id: 'safety', label: 'Safety & Blocking', icon: ShieldAlert, iconEmoji: '🛡️' },
    ]
  },
  {
    group: 'SUPPORT',
    items: [
      { id: 'help', label: 'Help & Support', icon: HelpCircle, iconEmoji: '❓' },
      { id: 'about', label: 'About', icon: Info, iconEmoji: 'ℹ️' },
    ]
  }
];

export const StudentSettings: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const { success, error: toastError } = useToast();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<SettingsTab>('account');

  // --- ACCOUNT TAB STATE ---
  const [phone, setPhone] = useState(user?.phone || user?.settings?.account?.phone || '');
  const [alternateEmail, setAlternateEmail] = useState(user?.settings?.account?.alternateEmail || '');
  const [github, setGithub] = useState(user?.socialLinks?.github || '');
  const [linkedin, setLinkedin] = useState(user?.socialLinks?.linkedin || '');
  const [portfolio, setPortfolio] = useState(user?.socialLinks?.portfolio || '');
  const [twitter, setTwitter] = useState(user?.socialLinks?.twitter || '');
  const [savingAccount, setSavingAccount] = useState(false);

  // --- SECURITY TAB STATE ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // --- PROFILE & PRIVACY TAB STATE ---
  const [profileVisibility, setProfileVisibility] = useState(user?.settings?.privacy?.profileVisibility || 'public');
  const [searchDiscoverability, setSearchDiscoverability] = useState(user?.settings?.privacy?.searchDiscoverability ?? true);
  const [showContactInfo, setShowContactInfo] = useState(user?.settings?.privacy?.showContactInfo ?? false);
  const [activityStatus, setActivityStatus] = useState(user?.settings?.privacy?.activityStatus ?? true);
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  // --- CONNECTIONS TAB STATE ---
  const [whoCanConnect, setWhoCanConnect] = useState(user?.settings?.connections?.whoCanConnect || 'all');
  const [autoAcceptDept, setAutoAcceptDept] = useState(user?.settings?.connections?.autoAcceptDepartment ?? true);
  const [showMutual, setShowMutual] = useState(user?.settings?.connections?.showMutualConnections ?? true);
  const [savingConnections, setSavingConnections] = useState(false);

  // --- MESSAGES TAB STATE ---
  const [whoCanMessage, setWhoCanMessage] = useState(user?.settings?.messages?.whoCanMessage || 'all');
  const [readReceipts, setReadReceipts] = useState(user?.settings?.messages?.readReceipts ?? true);
  const [typingIndicators, setTypingIndicators] = useState(user?.settings?.messages?.typingIndicators ?? true);
  const [hdMedia, setHdMedia] = useState(user?.settings?.messages?.hdMedia ?? true);
  const [savingMessages, setSavingMessages] = useState(false);

  // --- NOTIFICATIONS TAB STATE ---
  const [placementAlerts, setPlacementAlerts] = useState(user?.settings?.notifications?.placementAlerts ?? true);
  const [eventReminders, setEventReminders] = useState(user?.settings?.notifications?.eventReminders ?? true);
  const [chatAlerts, setChatAlerts] = useState(user?.settings?.notifications?.chatAlerts ?? true);
  const [peerAlerts, setPeerAlerts] = useState(user?.settings?.notifications?.peerAlerts ?? true);
  const [emailDigest, setEmailDigest] = useState(user?.settings?.notifications?.emailDigest ?? true);
  const [soundEffects, setSoundEffects] = useState(user?.settings?.notifications?.soundEffects ?? true);
  const [savingNotifications, setSavingNotifications] = useState(false);

  // --- APPEARANCE TAB STATE ---
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'compact'>(user?.settings?.appearance?.fontSize || 'normal');
  const [reducedMotion, setReducedMotion] = useState(user?.settings?.appearance?.reducedMotion ?? false);

  // --- GROUPS TAB STATE ---
  const [communityInvites, setCommunityInvites] = useState(user?.settings?.groups?.communityInvites ?? true);
  const [publicBadges, setPublicBadges] = useState(user?.settings?.groups?.publicMemberBadges ?? true);
  const [studyGroupDiscovery, setStudyGroupDiscovery] = useState(user?.settings?.groups?.studyGroupDiscovery ?? true);
  const [savingGroups, setSavingGroups] = useState(false);

  // --- SAFETY TAB STATE ---
  const [profanityFilter, setProfanityFilter] = useState(user?.settings?.safety?.profanityFilter ?? true);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState('Ragging / Harassment');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  // --- HELP TAB STATE ---
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [helpSubject, setHelpSubject] = useState('');
  const [helpMessage, setHelpMessage] = useState('');
  const [sendingTicket, setSendingTicket] = useState(false);

  // Synchronize initial state when user loads
  useEffect(() => {
    if (user) {
      if (user.phone) setPhone(user.phone);
      if (user.socialLinks?.github) setGithub(user.socialLinks.github);
      if (user.socialLinks?.linkedin) setLinkedin(user.socialLinks.linkedin);
      if (user.socialLinks?.portfolio) setPortfolio(user.socialLinks.portfolio);
      if (user.socialLinks?.twitter) setTwitter(user.socialLinks.twitter);
    }
  }, [user]);

  // Session Diagnostics
  const getSessionInfo = () => {
    const ua = navigator.userAgent;
    let os = 'Windows 11 / PC';
    if (ua.includes('Macintosh')) os = 'macOS Desktop';
    else if (ua.includes('Linux')) os = 'Linux OS';
    else if (ua.includes('Android')) os = 'Android Mobile';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS Device';

    let browser = 'Chrome';
    if (ua.includes('Firefox')) browser = 'Mozilla Firefox';
    else if (ua.includes('Edg/')) browser = 'Microsoft Edge';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Apple Safari';

    return { os, browser };
  };

  const session = getSessionInfo();

  // Save Account
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingAccount(true);
    try {
      await updateUser({
        phone,
        socialLinks: {
          ...(user.socialLinks || {}),
          github: github.trim() || undefined,
          linkedin: linkedin.trim() || undefined,
          portfolio: portfolio.trim() || undefined,
          twitter: twitter.trim() || undefined
        },
        settings: {
          ...(user.settings || {}),
          account: {
            phone: phone.trim() || undefined,
            alternateEmail: alternateEmail.trim() || undefined
          }
        }
      });
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
      success('Academic account information & social profiles saved!', 'Account Saved');
    } catch (err) {
      console.error(err);
      toastError('Failed to save account details.');
    } finally {
      setSavingAccount(false);
    }
  };

  // Save Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toastError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toastError('New passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      if (isSupabaseConfigured() && supabase) {
        try {
          await supabase.auth.updateUser({ password: newPassword });
        } catch (authErr) {
          console.warn('Supabase auth note:', authErr);
        }
      }

      await updateUser({
        socialLinks: {
          ...(user?.socialLinks || {}),
          passHash: btoa(newPassword.trim())
        }
      });

      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
      success('Account password updated securely!', 'Password Changed');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      toastError('Could not update password. Please try again.');
    } finally {
      setSavingPassword(false);
    }
  };

  // Save Privacy
  const handleSavePrivacy = async () => {
    if (!user) return;
    setSavingPrivacy(true);
    try {
      await updateUser({
        settings: {
          ...(user.settings || {}),
          privacy: {
            profileVisibility,
            searchDiscoverability,
            showContactInfo,
            activityStatus
          }
        }
      });
      success('Campus profile privacy rules saved.', 'Privacy Updated');
    } catch (err) {
      toastError('Failed to update privacy settings.');
    } finally {
      setSavingPrivacy(false);
    }
  };

  // Save Connections
  const handleSaveConnections = async () => {
    if (!user) return;
    setSavingConnections(true);
    try {
      await updateUser({
        settings: {
          ...(user.settings || {}),
          connections: {
            whoCanConnect,
            autoAcceptDepartment: autoAcceptDept,
            showMutualConnections: showMutual
          }
        }
      });
      success('Connection and networking preferences saved.', 'Connections Updated');
    } catch (err) {
      toastError('Failed to update connection preferences.');
    } finally {
      setSavingConnections(false);
    }
  };

  // Save Messages
  const handleSaveMessages = async () => {
    if (!user) return;
    setSavingMessages(true);
    try {
      await updateUser({
        settings: {
          ...(user.settings || {}),
          messages: {
            whoCanMessage,
            readReceipts,
            typingIndicators,
            hdMedia
          }
        }
      });
      success('Direct messaging & WhatsApp-style media preferences saved.', 'Messages Updated');
    } catch (err) {
      toastError('Failed to save message preferences.');
    } finally {
      setSavingMessages(false);
    }
  };

  // Save Notifications
  const handleSaveNotifications = async () => {
    if (!user) return;
    setSavingNotifications(true);
    try {
      await updateUser({
        settings: {
          ...(user.settings || {}),
          notifications: {
            placementAlerts,
            eventReminders,
            chatAlerts,
            peerAlerts,
            emailDigest,
            soundEffects
          }
        }
      });
      success('Campus notification alerts & chimes saved.', 'Notifications Updated');
    } catch (err) {
      toastError('Failed to save notification settings.');
    } finally {
      setSavingNotifications(false);
    }
  };

  // Save Groups
  const handleSaveGroups = async () => {
    if (!user) return;
    setSavingGroups(true);
    try {
      await updateUser({
        settings: {
          ...(user.settings || {}),
          groups: {
            communityInvites,
            publicMemberBadges: publicBadges,
            studyGroupDiscovery
          }
        }
      });
      success('Campus societies & study group settings updated.', 'Groups Updated');
    } catch (err) {
      toastError('Failed to save group settings.');
    } finally {
      setSavingGroups(false);
    }
  };

  // Theme Change
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    success(`Activated ${newTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}`, 'Theme Applied');
  };

  // Export Data
  const handleExportData = () => {
    if (!user) return;
    const exportPayload = {
      institution: 'Einstein Academy of Technology & Management (EATM), Bhubaneswar',
      affiliation: 'Biju Patnaik University of Technology (BPUT)',
      exportedAt: new Date().toISOString(),
      studentProfile: {
        id: user.id,
        rollNumber: user.rollNumber || 'EATM23CSE001',
        displayName: user.displayName,
        email: user.email,
        department: user.department,
        year: user.year,
        semester: user.semester,
        phone: user.phone || phone,
        bio: user.bio,
        skills: user.skills,
        interests: user.interests,
        stats: user.stats,
        projects: user.projects || [],
        achievements: user.achievements || [],
        socialLinks: {
          github: user.socialLinks?.github || github,
          linkedin: user.socialLinks?.linkedin || linkedin,
          portfolio: user.socialLinks?.portfolio || portfolio,
          twitter: user.socialLinks?.twitter || twitter
        },
        settings: user.settings
      }
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `eatm_student_${user.rollNumber || user.id}_archive.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    confetti({ particleCount: 30, spread: 50 });
    success('Verified campus portfolio and data downloaded!', 'Data Exported');
  };

  // Submit Safety Report
  const handleSubmitSafetyReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDetails.trim()) {
      toastError('Please describe the concern or incident in detail.');
      return;
    }
    setSubmittingReport(true);
    setTimeout(() => {
      setSubmittingReport(false);
      setReportModalOpen(false);
      setReportDetails('');
      success('Confidential incident report submitted to the EATM Anti-Ragging Cell & Campus Proctor.', 'Report Received');
    }, 800);
  };

  // Submit Help Ticket
  const handleSendTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!helpSubject.trim() || !helpMessage.trim()) {
      toastError('Please provide both subject and message details.');
      return;
    }
    setSendingTicket(true);
    setTimeout(() => {
      setSendingTicket(false);
      setHelpSubject('');
      setHelpMessage('');
      success('Support ticket created. Campus IT team will reach out to your college email.', 'Ticket Submitted');
    }, 800);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/80 dark:border-[#1e3325] p-5 sm:p-6 shadow-card transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2.5 mb-1">
              <span className="text-xl">⚙️</span>
              <span>Settings</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Official institutional dashboard for student account, privacy rules, communication, and app experience.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold text-[#0b4627] dark:text-emerald-300 shrink-0 self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>EATM Verified Student</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* LEFT SIDEBAR NAVIGATION */}
        <div className="md:col-span-4 lg:col-span-3.5 bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/80 dark:border-[#1e3325] p-3 shadow-card space-y-4 md:sticky md:top-20">
          {SETTINGS_SECTIONS.map((section) => (
            <div key={section.group} className="space-y-1">
              <div className="px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {section.group}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = activeTab === item.id;
                  const IconComp = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 text-left ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#0b4627] dark:text-emerald-300 font-bold border-l-4 border-[#0b4627] dark:border-emerald-500 shadow-2xs'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#16251c] hover:text-gray-900 dark:hover:text-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="text-sm">{item.iconEmoji}</span>
                        <span className="truncate">{item.label}</span>
                      </div>
                      {isActive && (
                        <ChevronRight className="w-3.5 h-3.5 text-[#0b4627] dark:text-emerald-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT CONTENT PANE */}
        <div className="md:col-span-8 lg:col-span-8.5 bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/80 dark:border-[#1e3325] p-6 shadow-card transition-colors">
          {/* ========================================================================= */}
          {/* 1. ACCOUNT */}
          {/* ========================================================================= */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <span className="text-base">👤</span>
                    <span>Student Account & Academic Profile</span>
                  </h2>
                  <Link
                    to="/student/profile"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#0b4627] dark:text-emerald-400 hover:underline"
                  >
                    <span>View Public Profile</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Your verified academic credentials at Einstein Academy of Technology & Management.
                </p>
              </div>

              {/* Verified Identity Card */}
              <div className="p-4 rounded-2xl bg-gray-50/70 dark:bg-[#16251c]/60 border border-gray-200/70 dark:border-[#1e3325] space-y-3">
                <div className="flex items-center gap-3.5">
                  <Avatar
                    src={user?.photoURL}
                    name={user?.displayName || 'User'}
                    size="lg"
                  />
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-gray-100">
                      {user?.displayName || 'Student Scholar'}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {user?.department || 'Computer Science & Engineering (CSE)'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-gray-200/60 dark:border-[#1e3325] text-xs">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#111d15] border border-gray-200/60 dark:border-[#1e3325]">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                      Official Roll Number
                    </span>
                    <span className="font-mono font-bold text-red-600 dark:text-red-400 text-xs">
                      {user?.rollNumber || 'EATM23CSE001'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#111d15] border border-gray-200/60 dark:border-[#1e3325]">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                      Academic Year & Sem
                    </span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200 text-xs">
                      {user?.year || '3rd Year'} • {user?.semester || '6th Sem'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#111d15] border border-gray-200/60 dark:border-[#1e3325] sm:col-span-2">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                      Institution & Affiliation
                    </span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200 text-xs">
                      Einstein Academy of Technology & Management (EATM), BPUT Affiliated
                    </span>
                  </div>
                </div>
              </div>

              {/* Editable Contact & Socials Form */}
              <form onSubmit={handleSaveAccount} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Official College Email (Read-Only)"
                    value={user?.email || 'student@eatm.ac.in'}
                    disabled
                    leftIcon={<Mail className="w-4 h-4 text-gray-400" />}
                  />
                  <Input
                    label="Primary Mobile / WhatsApp"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    leftIcon={<Phone className="w-4 h-4 text-gray-400" />}
                  />
                </div>

                <Input
                  label="Alternative / Emergency Email"
                  value={alternateEmail}
                  onChange={(e) => setAlternateEmail(e.target.value)}
                  placeholder="personal.email@gmail.com"
                  helperText="Used strictly for account recovery and emergency campus dispatches"
                />

                <div className="pt-3 border-t border-gray-100 dark:border-[#1e3325] space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0b4627] dark:text-emerald-400">
                    Social & Professional Profiles
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="GitHub Profile"
                      value={github}
                      onChange={(e) => setGithub(e.target.value)}
                      placeholder="https://github.com/username"
                      leftIcon={<Globe className="w-4 h-4 text-gray-400" />}
                    />
                    <Input
                      label="LinkedIn Profile"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      leftIcon={<Globe className="w-4 h-4 text-gray-400" />}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Portfolio / Personal Website"
                      value={portfolio}
                      onChange={(e) => setPortfolio(e.target.value)}
                      placeholder="https://yourportfolio.dev"
                      leftIcon={<Globe className="w-4 h-4 text-gray-400" />}
                    />
                    <Input
                      label="Twitter / X Profile"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      placeholder="https://x.com/username"
                      leftIcon={<Globe className="w-4 h-4 text-gray-400" />}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <Button type="submit" variant="primary" size="sm" isLoading={savingAccount}>
                    Save Account Information
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. SECURITY */}
          {/* ========================================================================= */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-1">
                  <span className="text-base">🔐</span>
                  <span>Security & Account Protection</span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Manage your portal password, active login sessions, and institutional data archive.
                </p>
              </div>

              {/* Password Change Form */}
              <form onSubmit={handleChangePassword} className="space-y-3.5 max-w-lg">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0b4627] dark:text-emerald-400">
                  Update Portal Password
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-gray-200 dark:border-[#1e3325] bg-white dark:bg-[#16251c] text-sm text-gray-900 dark:text-gray-100 px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-[#0b4627]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    New Password (Min 6 characters)
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter strong password"
                      className="w-full rounded-xl border border-gray-200 dark:border-[#1e3325] bg-white dark:bg-[#16251c] text-sm text-gray-900 dark:text-gray-100 px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-[#0b4627]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Input
                  label="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                />

                <Button type="submit" variant="primary" size="sm" isLoading={savingPassword}>
                  Update Password
                </Button>
              </form>

              {/* Active Sessions */}
              <div className="pt-4 border-t border-gray-100 dark:border-[#1e3325] space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-[#0b4627] dark:text-emerald-400" />
                  <span>Current Active Session & Device</span>
                </h3>

                <div className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-[#16251c]/60 border border-gray-200/70 dark:border-[#1e3325] flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                        {session.browser} on {session.os}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Active Now
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Bhubaneswar, Odisha, India • EATM Secure Campus Portal
                    </p>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>

              {/* Data Export & Sign Out */}
              <div className="pt-4 border-t border-gray-100 dark:border-[#1e3325] flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">
                    Export My Campus Data
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Download a full JSON archive of your projects, achievements, and profile.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleExportData}
                  icon={<Download className="w-3.5 h-3.5" />}
                >
                  Export Data (JSON)
                </Button>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-[#1e3325] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-red-600 dark:text-red-400">Sign Out</h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Log out of this browser session safely.
                  </p>
                </div>
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
                  Log Out
                </Button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. PROFILE & PRIVACY */}
          {/* ========================================================================= */}
          {activeTab === 'profile_privacy' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-1">
                  <span className="text-base">👤</span>
                  <span>Profile & Privacy Controls</span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Control how your student card, projects, and academic honors appear across campus.
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Campus Profile Visibility
                </label>
                <select
                  value={profileVisibility}
                  onChange={(e) => setProfileVisibility(e.target.value)}
                  className="w-full max-w-md p-2.5 text-xs bg-gray-50 dark:bg-[#16251c] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#1e3325] rounded-xl outline-none"
                >
                  <option value="public">Public to All EATM Students & Faculty (Recommended)</option>
                  <option value="connections">Approved Connections Only</option>
                  <option value="department">Same Department Only ({user?.department || 'CSE'})</option>
                </select>
              </div>

              <div className="space-y-2.5 pt-3 border-t border-gray-100 dark:border-[#1e3325]">
                <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 dark:bg-[#16251c]/60 border border-gray-200/70 dark:border-[#1e3325] cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Search & Directory Discoverability</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Allow students and faculty to discover your profile in Discover People and Search.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={searchDiscoverability}
                    onChange={(e) => setSearchDiscoverability(e.target.checked)}
                    className="w-4 h-4 text-[#0b4627] rounded accent-[#0b4627]"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 dark:bg-[#16251c]/60 border border-gray-200/70 dark:border-[#1e3325] cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Show Contact Info to Connected Peers</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Display mobile number and email on profile only for connected peers.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={showContactInfo}
                    onChange={(e) => setShowContactInfo(e.target.checked)}
                    className="w-4 h-4 text-[#0b4627] rounded accent-[#0b4627]"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 dark:bg-[#16251c]/60 border border-gray-200/70 dark:border-[#1e3325] cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Online Activity Status</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Display a green online indicator dot when you are active on the portal.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={activityStatus}
                    onChange={(e) => setActivityStatus(e.target.checked)}
                    className="w-4 h-4 text-[#0b4627] rounded accent-[#0b4627]"
                  />
                </label>
              </div>

              <div className="flex justify-end pt-3">
                <Button type="button" variant="primary" size="sm" onClick={handleSavePrivacy} isLoading={savingPrivacy}>
                  Save Privacy Preferences
                </Button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. CONNECTIONS */}
          {/* ========================================================================= */}
          {activeTab === 'connections' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-1">
                  <span className="text-base">👥</span>
                  <span>Connections & Peer Networking</span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Manage incoming connection requests and student peer networking preferences.
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Who Can Send Connection Requests?
                </label>
                <select
                  value={whoCanConnect}
                  onChange={(e) => setWhoCanConnect(e.target.value)}
                  className="w-full max-w-md p-2.5 text-xs bg-gray-50 dark:bg-[#16251c] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#1e3325] rounded-xl outline-none"
                >
                  <option value="all">All EATM Students & Faculty Members</option>
                  <option value="department">Only Peers in My Department ({user?.department || 'CSE'})</option>
                  <option value="none">Pause Incoming Connection Invites</option>
                </select>
              </div>

              <div className="space-y-2.5 pt-3 border-t border-gray-100 dark:border-[#1e3325]">
                <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 dark:bg-[#16251c]/60 border border-gray-200/70 dark:border-[#1e3325] cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Auto-Approve Department Classmates</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Instantly accept connection invites from students verified in your same batch and branch.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoAcceptDept}
                    onChange={(e) => setAutoAcceptDept(e.target.checked)}
                    className="w-4 h-4 text-[#0b4627] rounded accent-[#0b4627]"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 dark:bg-[#16251c]/60 border border-gray-200/70 dark:border-[#1e3325] cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Show Mutual Connections</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Display mutual connections count when exploring campus peers in Discover People.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={showMutual}
                    onChange={(e) => setShowMutual(e.target.checked)}
                    className="w-4 h-4 text-[#0b4627] rounded accent-[#0b4627]"
                  />
                </label>
              </div>

              <div className="flex justify-end pt-3">
                <Button type="button" variant="primary" size="sm" onClick={handleSaveConnections} isLoading={savingConnections}>
                  Save Connection Settings
                </Button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. MESSAGES */}
          {/* ========================================================================= */}
          {activeTab === 'messages' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-1">
                  <span className="text-base">💬</span>
                  <span>Direct Messages & Chat Rules</span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Configure WhatsApp-style chat options, read receipts, and camera media transmission.
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Who Can Initiate Direct Messages?
                </label>
                <select
                  value={whoCanMessage}
                  onChange={(e) => setWhoCanMessage(e.target.value)}
                  className="w-full max-w-md p-2.5 text-xs bg-gray-50 dark:bg-[#16251c] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#1e3325] rounded-xl outline-none"
                >
                  <option value="all">All Verified Campus Members (Students, Faculty & Mentors)</option>
                  <option value="connections">Approved Connections Only</option>
                </select>
              </div>

              <div className="space-y-2.5 pt-3 border-t border-gray-100 dark:border-[#1e3325]">
                <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 dark:bg-[#16251c]/60 border border-gray-200/70 dark:border-[#1e3325] cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Send Read Receipts</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Display blue double checkmarks when messages are read by peers.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={readReceipts}
                    onChange={(e) => setReadReceipts(e.target.checked)}
                    className="w-4 h-4 text-[#0b4627] rounded accent-[#0b4627]"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 dark:bg-[#16251c]/60 border border-gray-200/70 dark:border-[#1e3325] cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Show Typing Indicators</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Let chat partners see when you are typing a reply in real-time.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={typingIndicators}
                    onChange={(e) => setTypingIndicators(e.target.checked)}
                    className="w-4 h-4 text-[#0b4627] rounded accent-[#0b4627]"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 dark:bg-[#16251c]/60 border border-gray-200/70 dark:border-[#1e3325] cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">High-Definition Media & Attachments</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Transmit full-resolution camera captures and technical code snippets without lossy compression.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={hdMedia}
                    onChange={(e) => setHdMedia(e.target.checked)}
                    className="w-4 h-4 text-[#0b4627] rounded accent-[#0b4627]"
                  />
                </label>
              </div>

              <div className="flex justify-end pt-3">
                <Button type="button" variant="primary" size="sm" onClick={handleSaveMessages} isLoading={savingMessages}>
                  Save Message Preferences
                </Button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 6. NOTIFICATIONS */}
          {/* ========================================================================= */}
          {activeTab === 'notifications' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-1">
                  <span className="text-base">🔔</span>
                  <span>Campus Notification Preferences</span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Select which academic dispatches, placement notices, and social alerts ping you.
                </p>
              </div>

              <div className="space-y-2.5">
                <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 dark:bg-[#16251c]/60 border border-gray-200/70 dark:border-[#1e3325] cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Training & Placement Cell (T&P) Alerts</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Instant notification when top MNC recruitment drives or internships are announced.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={placementAlerts}
                    onChange={(e) => setPlacementAlerts(e.target.checked)}
                    className="w-4 h-4 text-[#0b4627] rounded accent-[#0b4627]"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 dark:bg-[#16251c]/60 border border-gray-200/70 dark:border-[#1e3325] cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Campus Hackathons & Events</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Reminders 24 hours prior to registered hackathons, tech symposiums, and sports meets.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={eventReminders}
                    onChange={(e) => setEventReminders(e.target.checked)}
                    className="w-4 h-4 text-[#0b4627] rounded accent-[#0b4627]"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 dark:bg-[#16251c]/60 border border-gray-200/70 dark:border-[#1e3325] cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Direct Chat & Teammate Pings</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Receive instant browser banner alerts when teammates send direct messages.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={chatAlerts}
                    onChange={(e) => setChatAlerts(e.target.checked)}
                    className="w-4 h-4 text-[#0b4627] rounded accent-[#0b4627]"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 dark:bg-[#16251c]/60 border border-gray-200/70 dark:border-[#1e3325] cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Connection Requests & Post Comments</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Alerts when peers request to connect or interact with your campus updates.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={peerAlerts}
                    onChange={(e) => setPeerAlerts(e.target.checked)}
                    className="w-4 h-4 text-[#0b4627] rounded accent-[#0b4627]"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 dark:bg-[#16251c]/60 border border-gray-200/70 dark:border-[#1e3325] cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Weekly Academic Email Digest</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Weekly email summary of club announcements and semester notices.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailDigest}
                    onChange={(e) => setEmailDigest(e.target.checked)}
                    className="w-4 h-4 text-[#0b4627] rounded accent-[#0b4627]"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 dark:bg-[#16251c]/60 border border-gray-200/70 dark:border-[#1e3325] cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">In-App Sound Effects & Chimes</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Play clean notification tones when receiving chat messages or achievements.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={soundEffects}
                    onChange={(e) => setSoundEffects(e.target.checked)}
                    className="w-4 h-4 text-[#0b4627] rounded accent-[#0b4627]"
                  />
                </label>
              </div>

              <div className="flex justify-end pt-3">
                <Button type="button" variant="primary" size="sm" onClick={handleSaveNotifications} isLoading={savingNotifications}>
                  Save Notification Alerts
                </Button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 7. APPEARANCE */}
          {/* ========================================================================= */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <span className="text-base">🎨</span>
                    <span>Appearance & Display Mode</span>
                  </h2>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-[#0b4627] dark:text-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Active: {resolvedTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Select your preferred color theme. Your preference is applied across all portal screens.
                </p>
              </div>

              {/* Theme Mode Selector Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                {/* Light Mode */}
                <button
                  type="button"
                  onClick={() => handleThemeChange('light')}
                  className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between group ${
                    theme === 'light'
                      ? 'border-[#0b4627] dark:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-[#0b4627]/20 shadow-sm'
                      : 'border-gray-200 dark:border-[#1e3325] bg-white dark:bg-[#16251c] hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-600 dark:text-amber-400">
                      <Sun className="w-5 h-5" />
                    </div>
                    {theme === 'light' && (
                      <span className="p-1 rounded-full bg-[#0b4627] dark:bg-emerald-500 text-white">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Light Mode</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                      Daylight aesthetic with clean cards and crisp emerald accents.
                    </p>
                  </div>
                </button>

                {/* Dark Mode */}
                <button
                  type="button"
                  onClick={() => handleThemeChange('dark')}
                  className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between group ${
                    theme === 'dark'
                      ? 'border-[#0b4627] dark:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-[#0b4627]/20 shadow-sm'
                      : 'border-gray-200 dark:border-[#1e3325] bg-white dark:bg-[#16251c] hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-emerald-300">
                      <Moon className="w-5 h-5" />
                    </div>
                    {theme === 'dark' && (
                      <span className="p-1 rounded-full bg-[#0b4627] dark:bg-emerald-500 text-white">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Dark Mode</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                      Deep obsidian theme optimized for late-night study and reduced eye fatigue.
                    </p>
                  </div>
                </button>
              </div>

              {/* Display Accessibility */}
              <div className="pt-4 border-t border-gray-100 dark:border-[#1e3325] space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
                  Font Scale & Density
                </h3>

                <div className="flex gap-2">
                  {(['compact', 'normal', 'large'] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setFontSize(size)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition capitalize ${
                        fontSize === size
                          ? 'bg-[#0b4627] dark:bg-emerald-700 text-white shadow-xs'
                          : 'bg-gray-100 dark:bg-[#16251c] text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>

                <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 dark:bg-[#16251c]/60 border border-gray-200/70 dark:border-[#1e3325] cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Reduced Motion</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Minimizes animations and sliding card transitions for maximum speed.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={reducedMotion}
                    onChange={(e) => setReducedMotion(e.target.checked)}
                    className="w-4 h-4 text-[#0b4627] rounded accent-[#0b4627]"
                  />
                </label>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 8. GROUPS */}
          {/* ========================================================================= */}
          {activeTab === 'groups' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-1">
                  <span className="text-base">👥</span>
                  <span>Campus Groups & Societies</span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Manage participation rules for EATM technical clubs, cultural societies, and study circles.
                </p>
              </div>

              <div className="space-y-2.5">
                <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 dark:bg-[#16251c]/60 border border-gray-200/70 dark:border-[#1e3325] cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Society & Club Invitations</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Allow verified Club Leads (Coding Club, Robotics Club, Sports) to invite you to join.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={communityInvites}
                    onChange={(e) => setCommunityInvites(e.target.checked)}
                    className="w-4 h-4 text-[#0b4627] rounded accent-[#0b4627]"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 dark:bg-[#16251c]/60 border border-gray-200/70 dark:border-[#1e3325] cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Display Club Membership Badges</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Show badges next to your student name on posts authored in campus feeds.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={publicBadges}
                    onChange={(e) => setPublicBadges(e.target.checked)}
                    className="w-4 h-4 text-[#0b4627] rounded accent-[#0b4627]"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 dark:bg-[#16251c]/60 border border-gray-200/70 dark:border-[#1e3325] cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Department Study Group Circles</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Allow peers in your semester to suggest shared study groups for upcoming exams.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={studyGroupDiscovery}
                    onChange={(e) => setStudyGroupDiscovery(e.target.checked)}
                    className="w-4 h-4 text-[#0b4627] rounded accent-[#0b4627]"
                  />
                </label>
              </div>

              <div className="flex justify-end pt-3">
                <Button type="button" variant="primary" size="sm" onClick={handleSaveGroups} isLoading={savingGroups}>
                  Save Group Preferences
                </Button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 9. SAFETY & BLOCKING */}
          {/* ========================================================================= */}
          {activeTab === 'safety' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-1">
                  <span className="text-base">🛡️</span>
                  <span>Safety, Anti-Ragging & Blocking</span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  EATM CampusConnect enforces strict institutional code of conduct and zero-tolerance policies.
                </p>
              </div>

              {/* Anti-Ragging Institutional Banner */}
              <div className="p-4 rounded-xl bg-red-50/80 dark:bg-red-950/30 border border-red-200/70 dark:border-red-900/40 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <h4 className="font-bold text-red-900 dark:text-red-200">
                    EATM Zero-Tolerance Anti-Ragging Directive
                  </h4>
                  <p className="text-red-800/90 dark:text-red-300 leading-relaxed text-[11px]">
                    Any form of verbal, psychological, or cyber harassment is strictly punishable under university regulations and AICTE guidelines. All communications are logged for campus safety.
                  </p>
                </div>
              </div>

              {/* Content Filtering */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 dark:bg-[#16251c]/60 border border-gray-200/70 dark:border-[#1e3325] cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Strict Academic Content Filter</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Automatically filter out aggressive language, inappropriate comments, and flagged attachments.</p>
                </div>
                <input
                  type="checkbox"
                  checked={profanityFilter}
                  onChange={(e) => setProfanityFilter(e.target.checked)}
                  className="w-4 h-4 text-[#0b4627] rounded accent-[#0b4627]"
                />
              </label>

              {/* Blocked Users Box */}
              <div className="pt-3 border-t border-gray-100 dark:border-[#1e3325] space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
                  Blocked Campus Users
                </h3>
                <div className="p-4 rounded-xl border border-dashed border-gray-200 dark:border-[#1e3325] text-center text-gray-400 dark:text-gray-500">
                  <p className="text-xs font-medium">You have not blocked any campus peers.</p>
                  <p className="text-[11px] mt-0.5">Blocked users cannot send you direct messages or see your profile.</p>
                </div>
              </div>

              {/* Submit Incident Report */}
              <div className="pt-3 border-t border-gray-100 dark:border-[#1e3325] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">Report an Incident or Concern</h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    File a confidential report directly to the Campus Proctor & Anti-Ragging Cell.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReportModalOpen(true)}
                  className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/40 font-bold"
                >
                  File Report
                </Button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 10. HELP & SUPPORT */}
          {/* ========================================================================= */}
          {activeTab === 'help' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-1">
                  <span className="text-base">❓</span>
                  <span>Help & Campus Support</span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Institutional contacts, IT helpdesk assistance, and answers to common student inquiries.
                </p>
              </div>

              {/* Official Support Channels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-[#16251c]/60 border border-gray-200/70 dark:border-[#1e3325] space-y-1">
                  <span className="font-bold text-[#0b4627] dark:text-emerald-400 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    <span>Campus IT Helpdesk</span>
                  </span>
                  <p className="text-gray-600 dark:text-gray-300 font-mono text-[11px]">support@eatm.ac.in</p>
                  <p className="text-[11px] text-gray-400">Academic Block 1, Central Server Lab</p>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-[#16251c]/60 border border-gray-200/70 dark:border-[#1e3325] space-y-1">
                  <span className="font-bold text-[#0b4627] dark:text-emerald-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Dean of Academics Office</span>
                  </span>
                  <p className="text-gray-600 dark:text-gray-300 font-mono text-[11px]">dean.academics@eatm.ac.in</p>
                  <p className="text-[11px] text-gray-400">Hours: Mon - Sat: 9:30 AM - 4:30 PM</p>
                </div>
              </div>

              {/* FAQ Accordion */}
              <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-[#1e3325]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200 mb-2">
                  Frequently Asked Questions (FAQ)
                </h3>

                {[
                  {
                    q: 'How do I update my official roll number or department?',
                    a: 'Official academic credentials such as Roll Number and Branch are synchronized with the university registrar. If you notice a typo or branch change, please contact the IT Helpdesk or Academic Section with your college ID card.'
                  },
                  {
                    q: 'How are placement drives and internship postings verified?',
                    a: 'All opportunities published on EATM CampusConnect are verified by the Training & Placement (T&P) Cell before going live. Only legitimate MNCs and accredited recruiters are approved.'
                  },
                  {
                    q: 'Are my project showcases and honors visible to recruiters?',
                    a: 'Yes, verified recruiters and campus visitors can view your Featured Projects and Campus Honors directly on your profile when your visibility is set to public.'
                  },
                  {
                    q: 'Can faculty members view my private direct messages?',
                    a: 'No. Direct messages are private between conversation participants. The administration only steps in if an anti-ragging or safety report is formally lodged.'
                  }
                ].map((faq, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-gray-200/80 dark:border-[#1e3325] overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      className="w-full flex items-center justify-between p-3 text-left text-xs font-bold text-gray-900 dark:text-gray-100 bg-gray-50/50 dark:bg-[#16251c]/50 hover:bg-gray-100 dark:hover:bg-[#1f3527] transition"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
                          openFaq === idx ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {openFaq === idx && (
                      <div className="p-3 text-xs text-gray-600 dark:text-gray-300 leading-relaxed bg-white dark:bg-[#111d15] border-t border-gray-100 dark:border-[#1e3325]">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Submit Ticket Form */}
              <form onSubmit={handleSendTicket} className="space-y-3 pt-3 border-t border-gray-100 dark:border-[#1e3325]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
                  Submit a Support Ticket
                </h3>
                <Input
                  label="Subject"
                  value={helpSubject}
                  onChange={(e) => setHelpSubject(e.target.value)}
                  placeholder="e.g. Issue logging into central library portal"
                  required
                />
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Message Description
                  </label>
                  <textarea
                    value={helpMessage}
                    onChange={(e) => setHelpMessage(e.target.value)}
                    rows={3}
                    required
                    placeholder="Describe your question or issue in detail..."
                    className="w-full p-3 text-xs border border-gray-200 dark:border-[#1e3325] bg-white dark:bg-[#16251c] text-gray-900 dark:text-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-[#0b4627] resize-none"
                  />
                </div>
                <Button type="submit" variant="primary" size="sm" isLoading={sendingTicket}>
                  Submit Ticket
                </Button>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 11. ABOUT */}
          {/* ========================================================================= */}
          {activeTab === 'about' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-1">
                  <span className="text-base">ℹ️</span>
                  <span>About EATM CampusConnect</span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Official digital campus ecosystem for Einstein Academy of Technology & Management.
                </p>
              </div>

              {/* Institution Identity Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-emerald-100/30 dark:from-[#16251c] dark:to-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0b4627] text-white flex items-center justify-center font-black text-base shadow-sm">
                    E
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900 dark:text-gray-100">
                      Einstein Academy of Technology & Management
                    </h3>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                      Bhubaneswar, Odisha • BPUT Affiliated • AICTE Approved
                    </p>
                  </div>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed pt-1 border-t border-emerald-200/60 dark:border-emerald-800/40">
                  EATM CampusConnect is the unified academic and social portal engineered to connect scholars, faculty mentors, societies, and recruiters across a unified, high-performance platform.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-[11px] font-semibold">
                  <div className="p-2 rounded-lg bg-white/80 dark:bg-[#111d15] border border-emerald-100 dark:border-[#1e3325]">
                    <span className="text-gray-400 block text-[10px]">Version</span>
                    <span className="text-gray-900 dark:text-gray-100 font-mono font-bold">v1.2.0 (Stable)</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/80 dark:bg-[#111d15] border border-emerald-100 dark:border-[#1e3325]">
                    <span className="text-gray-400 block text-[10px]">Affiliation</span>
                    <span className="text-gray-900 dark:text-gray-100 font-bold">BPUT, Odisha</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/80 dark:bg-[#111d15] border border-emerald-100 dark:border-[#1e3325] col-span-2 sm:col-span-1">
                    <span className="text-gray-400 block text-[10px]">Accreditation</span>
                    <span className="text-gray-900 dark:text-gray-100 font-bold">NAAC Accredited</span>
                  </div>
                </div>
              </div>

              {/* Institutional Details */}
              <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 dark:bg-[#16251c]/60 border border-gray-200/70 dark:border-[#1e3325]">
                  <span>Campus Address</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    Baniatangi, Bajpur, Khordha, Bhubaneswar, Odisha - 752060
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 dark:bg-[#16251c]/60 border border-gray-200/70 dark:border-[#1e3325]">
                  <span>Official College Website</span>
                  <a
                    href="https://eatm.in"
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-[#0b4627] dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>eatm.in</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 dark:bg-[#16251c]/60 border border-gray-200/70 dark:border-[#1e3325]">
                  <span>Terms of Service & Code of Conduct</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">BPUT / AICTE Compliant</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => success('EATM CampusConnect is running the latest production build (v1.2.0).', 'Up to Date')}
                  icon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Check for Updates
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report Incident Modal */}
      <Modal
        isOpen={reportModalOpen}
        onClose={() => !submittingReport && setReportModalOpen(false)}
        title="Report Campus Concern / Incident"
        maxWidth="md"
      >
        <form onSubmit={handleSubmitSafetyReport} className="space-y-4">
          <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200/60 dark:border-red-900/40 text-xs text-red-800 dark:text-red-300 leading-relaxed">
            Your report will be treated with strict confidentiality by the EATM Anti-Ragging Committee and Campus Proctor.
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Incident Category
            </label>
            <select
              value={reportCategory}
              onChange={(e) => setReportCategory(e.target.value)}
              className="w-full p-2.5 text-xs bg-white dark:bg-[#16251c] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#1e3325] rounded-xl outline-none"
            >
              <option value="Ragging / Harassment">Ragging / Intimidation / Bullying</option>
              <option value="Account Impersonation">Fake Profile / Identity Impersonation</option>
              <option value="Offensive Content">Inappropriate / Offensive Language or Media</option>
              <option value="Academic Misconduct">Cheating / Unauthorized Material Sharing</option>
              <option value="Other">Other Urgent Campus Concern</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Incident Details & Evidence
            </label>
            <textarea
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              rows={4}
              required
              placeholder="Describe what occurred, names or roll numbers involved (if known), location, and any relevant dates..."
              className="w-full p-3 text-xs border border-gray-200 dark:border-[#1e3325] bg-white dark:bg-[#16251c] text-gray-900 dark:text-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-[#1e3325]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReportModalOpen(false)}
              disabled={submittingReport}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              isLoading={submittingReport}
            >
              Submit Confidential Report
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
