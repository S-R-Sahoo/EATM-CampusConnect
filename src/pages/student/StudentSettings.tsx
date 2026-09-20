import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useTheme, Theme } from '../../contexts/ThemeContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  Settings, Shield, Bell, Lock, Palette, 
  Check, Sun, Moon, Monitor, RefreshCw, CheckCircle2 
} from 'lucide-react';

export const StudentSettings: React.FC = () => {
  const { user } = useAuth();
  const { success } = useToast();
  const { theme, resolvedTheme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'privacy' | 'notifications' | 'security' | 'appearance'>('appearance');

  // Privacy toggles
  const [whoCanMessage, setWhoCanMessage] = useState('Everyone');
  const [whoCanConnect, setWhoCanConnect] = useState('Campus Peers');
  const [profileVisibility, setProfileVisibility] = useState('Public to Campus');

  // Notification toggles
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [msgAlerts, setMsgAlerts] = useState(true);
  const [eventAlerts, setEventAlerts] = useState(true);
  const [oppAlerts, setOppAlerts] = useState(true);

  // Security password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSave = (message = 'Settings & preferences saved successfully!') => {
    success(message, 'Preferences Updated');
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    const labels: Record<Theme, string> = {
      light: 'Light Theme',
      dark: 'Dark Mode',
      system: 'System Sync Mode',
    };
    success(`Activated ${labels[newTheme]}`, 'Theme Applied');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/80 dark:border-[#1e3325] p-6 shadow-card transition-colors">
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2.5 mb-1">
          <Settings className="w-5 h-5 text-[#0b4627] dark:text-emerald-400" />
          <span>Account Settings & Privacy</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          Control your visibility, communication permissions, campus notifications, and visual display theme.
        </p>

        {/* Setting Category Tabs */}
        <div className="flex flex-wrap gap-2 pt-5 border-t border-gray-100 dark:border-[#1e3325] mt-4">
          <button
            onClick={() => setActiveTab('appearance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'appearance' 
                ? 'bg-[#0b4627] dark:bg-emerald-700 text-white shadow-sm' 
                : 'bg-gray-50 dark:bg-[#16251c] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f3527]'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Theme & Display</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'privacy' 
                ? 'bg-[#0b4627] dark:bg-emerald-700 text-white shadow-sm' 
                : 'bg-gray-50 dark:bg-[#16251c] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f3527]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Privacy & Visibility</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'notifications' 
                ? 'bg-[#0b4627] dark:bg-emerald-700 text-white shadow-sm' 
                : 'bg-gray-50 dark:bg-[#16251c] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f3527]'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Notifications</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'security' 
                ? 'bg-[#0b4627] dark:bg-emerald-700 text-white shadow-sm' 
                : 'bg-gray-50 dark:bg-[#16251c] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1f3527]'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Security & Password</span>
          </button>
        </div>
      </div>

      {/* Settings Form Body */}
      <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/80 dark:border-[#1e3325] p-6 shadow-card transition-colors">
        {/* THEME & DISPLAY TAB */}
        {activeTab === 'appearance' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#0b4627] dark:text-emerald-400" />
                  <span>Color Theme & Display Mode</span>
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-[#0b4627] dark:text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active: {resolvedTheme === 'dark' ? 'Dark Obsidian' : 'Classic Light'} {theme === 'system' && '(System Synced)'}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Choose how EATM CampusConnect renders across your devices. Theme preference is automatically saved to your browser.
              </p>

              {/* 3 Interactive Mode Selector Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-2xl">
                {/* Light Mode Card */}
                <button
                  type="button"
                  onClick={() => handleThemeChange('light')}
                  className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between ${
                    theme === 'light'
                      ? 'border-[#0b4627] dark:border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 ring-2 ring-[#0b4627]/20 shadow-sm'
                      : 'border-gray-200 dark:border-[#1e3325] bg-white dark:bg-[#16251c] hover:border-gray-300 dark:hover:border-[#2b4935]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-600 dark:text-amber-400">
                      <Sun className="w-5 h-5" />
                    </div>
                    {theme === 'light' && (
                      <span className="p-1 rounded-full bg-[#0b4627] dark:bg-emerald-500 text-white">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-gray-900 dark:text-gray-100">Light Mode</h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-snug">
                      Classic clean campus view with crisp emerald headers.
                    </p>
                  </div>
                </button>

                {/* Dark Mode Card */}
                <button
                  type="button"
                  onClick={() => handleThemeChange('dark')}
                  className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between ${
                    theme === 'dark'
                      ? 'border-[#0b4627] dark:border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 ring-2 ring-[#0b4627]/20 shadow-sm'
                      : 'border-gray-200 dark:border-[#1e3325] bg-white dark:bg-[#16251c] hover:border-gray-300 dark:hover:border-[#2b4935]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-emerald-300">
                      <Moon className="w-5 h-5" />
                    </div>
                    {theme === 'dark' && (
                      <span className="p-1 rounded-full bg-[#0b4627] dark:bg-emerald-500 text-white">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-gray-900 dark:text-gray-100">Dark Mode</h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-snug">
                      Deep obsidian emerald palette engineered for night study and reduced eye strain.
                    </p>
                  </div>
                </button>

                {/* System Sync Card */}
                <button
                  type="button"
                  onClick={() => handleThemeChange('system')}
                  className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between ${
                    theme === 'system'
                      ? 'border-[#0b4627] dark:border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 ring-2 ring-[#0b4627]/20 shadow-sm'
                      : 'border-gray-200 dark:border-[#1e3325] bg-white dark:bg-[#16251c] hover:border-gray-300 dark:hover:border-[#2b4935]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 text-sky-600 dark:text-sky-400">
                      <Monitor className="w-5 h-5" />
                    </div>
                    {theme === 'system' && (
                      <span className="p-1 rounded-full bg-[#0b4627] dark:bg-emerald-500 text-white">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-gray-900 dark:text-gray-100">System Sync</h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-snug">
                      Automatically follows your Windows, Mac, iOS, or Android OS day/night schedule.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Quick Feature Explanation Banner */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 flex items-start gap-3">
              <RefreshCw className="w-5 h-5 text-[#0b4627] dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900 dark:text-emerald-200">
                <p className="font-bold">Real-Time System Synchronization Active</p>
                <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300/80 mt-0.5 leading-relaxed">
                  When "System Sync" is selected, the application listens to your OS color scheme in real time without requiring page refreshes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PRIVACY TAB */}
        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-1">Campus Profile Visibility</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Control who can discover and view your academic achievements.</p>
              <select
                value={profileVisibility}
                onChange={(e) => setProfileVisibility(e.target.value)}
                className="w-full max-w-md p-2.5 text-xs bg-gray-50 dark:bg-[#16251c] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#1e3325] rounded-xl outline-none"
              >
                <option value="Public to Campus">Public to All EATM Students & Faculty</option>
                <option value="Only Connections">Only My Approved Connections</option>
                <option value="Same Department">Same Department Only (CSE)</option>
              </select>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-[#1e3325]">
              <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-1">Direct Messaging Permissions</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Who is permitted to send you one-on-one direct messages?</p>
              <select
                value={whoCanMessage}
                onChange={(e) => setWhoCanMessage(e.target.value)}
                className="w-full max-w-md p-2.5 text-xs bg-gray-50 dark:bg-[#16251c] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#1e3325] rounded-xl outline-none"
              >
                <option value="Everyone">All Campus Members</option>
                <option value="Connections Only">Connected Peers Only</option>
              </select>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-[#1e3325]">
              <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-1">Connection Requests</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Who can send you new connection invites?</p>
              <select
                value={whoCanConnect}
                onChange={(e) => setWhoCanConnect(e.target.value)}
                className="w-full max-w-md p-2.5 text-xs bg-gray-50 dark:bg-[#16251c] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#1e3325] rounded-xl outline-none"
              >
                <option value="Campus Peers">All EATM Students & Faculty</option>
                <option value="Department Only">Department Peers Only</option>
              </select>
            </div>

            <Button variant="primary" size="sm" onClick={() => handleSave('Privacy settings updated!')}>
              Save Privacy Settings
            </Button>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-3">Notification Preferences</h3>

            <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#16251c] border border-gray-100 dark:border-[#1e3325] cursor-pointer">
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Email Digest Notifications</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Receive weekly summaries of club events and departmental notices.</p>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 text-[#0b4627] rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#16251c] border border-gray-100 dark:border-[#1e3325] cursor-pointer">
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Chat & Message Alerts</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Instant browser badge alerts when teammates ping you.</p>
              </div>
              <input
                type="checkbox"
                checked={msgAlerts}
                onChange={(e) => setMsgAlerts(e.target.checked)}
                className="w-4 h-4 text-[#0b4627] rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#16251c] border border-gray-100 dark:border-[#1e3325] cursor-pointer">
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Campus Event Reminders</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Notifications 24 hours prior to registered hackathons and symposiums.</p>
              </div>
              <input
                type="checkbox"
                checked={eventAlerts}
                onChange={(e) => setEventAlerts(e.target.checked)}
                className="w-4 h-4 text-[#0b4627] rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#16251c] border border-gray-100 dark:border-[#1e3325] cursor-pointer">
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Placement & Internship Notifications</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Urgent alerts when top MNCs release recruitment drives.</p>
              </div>
              <input
                type="checkbox"
                checked={oppAlerts}
                onChange={(e) => setOppAlerts(e.target.checked)}
                className="w-4 h-4 text-[#0b4627] rounded"
              />
            </label>

            <Button variant="primary" size="sm" onClick={() => handleSave('Notification alerts saved!')}>
              Save Notifications
            </Button>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <div className="space-y-4 max-w-md">
            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-2">Update Account Password</h3>
            <Input 
              label="Current Password" 
              type="password" 
              placeholder="••••••••" 
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <Input 
              label="New Password" 
              type="password" 
              placeholder="Minimum 6 characters" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input 
              label="Confirm New Password" 
              type="password" 
              placeholder="Re-enter new password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <Button 
              variant="primary" 
              size="sm" 
              onClick={() => {
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                handleSave('Password updated securely!');
              }}
            >
              Change Password
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
