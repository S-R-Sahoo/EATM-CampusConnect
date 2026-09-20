import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  Settings, Shield, Bell, Lock, Palette, 
  User, Check, Eye, EyeOff, Smartphone 
} from 'lucide-react';

export const StudentSettings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { success } = useToast();

  const [activeTab, setActiveTab] = useState<'privacy' | 'notifications' | 'security' | 'appearance'>('privacy');

  // Privacy toggles
  const [whoCanMessage, setWhoCanMessage] = useState('Everyone');
  const [whoCanConnect, setWhoCanConnect] = useState('Campus Peers');
  const [profileVisibility, setProfileVisibility] = useState('Public to Campus');

  // Notification toggles
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [msgAlerts, setMsgAlerts] = useState(true);
  const [eventAlerts, setEventAlerts] = useState(true);
  const [oppAlerts, setOppAlerts] = useState(true);

  // Appearance
  const [theme, setTheme] = useState('light');

  const handleSave = () => {
    success('Settings & preferences saved successfully!', 'Preferences Updated');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-card">
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2 mb-1">
          <Settings className="w-5 h-5 text-[#0b4627]" />
          <span>Account Settings & Privacy</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Control your visibility, communication permissions, and campus notifications
        </p>

        {/* Setting Category Tabs */}
        <div className="flex flex-wrap gap-2 pt-5 border-t border-gray-100 mt-4">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'privacy' ? 'bg-[#0b4627] text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Privacy & Visibility</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'notifications' ? 'bg-[#0b4627] text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Notifications</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'security' ? 'bg-[#0b4627] text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Security & Password</span>
          </button>

          <button
            onClick={() => setActiveTab('appearance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'appearance' ? 'bg-[#0b4627] text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Theme & Display</span>
          </button>
        </div>
      </div>

      {/* Settings Form Body */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-card">
        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-sm text-gray-900 mb-1">Campus Profile Visibility</h3>
              <p className="text-xs text-gray-500 mb-3">Control who can discover and view your academic achievements.</p>
              <select
                value={profileVisibility}
                onChange={(e) => setProfileVisibility(e.target.value)}
                className="w-full max-w-md p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none"
              >
                <option value="Public to Campus">Public to All EATM Students & Faculty</option>
                <option value="Only Connections">Only My Approved Connections</option>
                <option value="Same Department">Same Department Only (CSE)</option>
              </select>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <h3 className="font-bold text-sm text-gray-900 mb-1">Direct Messaging Permissions</h3>
              <p className="text-xs text-gray-500 mb-3">Who is permitted to send you one-on-one direct messages?</p>
              <select
                value={whoCanMessage}
                onChange={(e) => setWhoCanMessage(e.target.value)}
                className="w-full max-w-md p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none"
              >
                <option value="Everyone">All Campus Members</option>
                <option value="Connections Only">Connected Peers Only</option>
              </select>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <h3 className="font-bold text-sm text-gray-900 mb-1">Connection Requests</h3>
              <p className="text-xs text-gray-500 mb-3">Who can send you new connection invites?</p>
              <select
                value={whoCanConnect}
                onChange={(e) => setWhoCanConnect(e.target.value)}
                className="w-full max-w-md p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none"
              >
                <option value="Campus Peers">All EATM Students & Faculty</option>
                <option value="Department Only">Department Peers Only</option>
              </select>
            </div>

            <Button variant="primary" size="sm" onClick={handleSave}>
              Save Privacy Settings
            </Button>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-gray-900 mb-3">Notification Preferences</h3>

            <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 cursor-pointer">
              <div>
                <p className="text-xs font-bold text-gray-900">Email Digest Notifications</p>
                <p className="text-[11px] text-gray-500">Receive weekly summaries of club events and departmental notices.</p>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 text-[#0b4627] rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 cursor-pointer">
              <div>
                <p className="text-xs font-bold text-gray-900">Chat & Message Alerts</p>
                <p className="text-[11px] text-gray-500">Instant browser badge alerts when teammates ping you.</p>
              </div>
              <input
                type="checkbox"
                checked={msgAlerts}
                onChange={(e) => setMsgAlerts(e.target.checked)}
                className="w-4 h-4 text-[#0b4627] rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 cursor-pointer">
              <div>
                <p className="text-xs font-bold text-gray-900">Campus Event Reminders</p>
                <p className="text-[11px] text-gray-500">Notifications 24 hours prior to registered hackathons and symposiums.</p>
              </div>
              <input
                type="checkbox"
                checked={eventAlerts}
                onChange={(e) => setEventAlerts(e.target.checked)}
                className="w-4 h-4 text-[#0b4627] rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 cursor-pointer">
              <div>
                <p className="text-xs font-bold text-gray-900">Placement & Internship Notifications</p>
                <p className="text-[11px] text-gray-500">Urgent alerts when top MNCs release recruitment drives.</p>
              </div>
              <input
                type="checkbox"
                checked={oppAlerts}
                onChange={(e) => setOppAlerts(e.target.checked)}
                className="w-4 h-4 text-[#0b4627] rounded"
              />
            </label>

            <Button variant="primary" size="sm" onClick={handleSave}>
              Save Notifications
            </Button>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-4 max-w-md">
            <h3 className="font-bold text-sm text-gray-900 mb-2">Update Account Password</h3>
            <Input label="Current Password" type="password" placeholder="••••••••" />
            <Input label="New Password" type="password" placeholder="Minimum 6 characters" />
            <Input label="Confirm New Password" type="password" placeholder="Re-enter new password" />
            <Button variant="primary" size="sm" onClick={handleSave}>
              Change Password
            </Button>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-gray-900 mb-3">Color Theme</h3>
            <div className="grid grid-cols-3 gap-3 max-w-md">
              <button
                onClick={() => setTheme('light')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                  theme === 'light' ? 'border-[#0b4627] bg-emerald-50 text-[#0b4627]' : 'border-gray-200'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-white border border-gray-300" />
                <span>Light (Default)</span>
              </button>

              <button
                onClick={() => setTheme('dark')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                  theme === 'dark' ? 'border-[#0b4627] bg-emerald-50 text-[#0b4627]' : 'border-gray-200'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-gray-900 border border-gray-700" />
                <span>Dark Mode</span>
              </button>

              <button
                onClick={() => setTheme('system')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                  theme === 'system' ? 'border-[#0b4627] bg-emerald-50 text-[#0b4627]' : 'border-gray-200'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-white to-gray-900 border border-gray-400" />
                <span>System Sync</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
