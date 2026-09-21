import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Avatar } from '../ui/Avatar';
import { 
  Search, Bell, MessageSquare, Menu, LogOut, 
  User, Settings, ChevronDown, Check, Shield, BookOpen,
  Sun, Moon 
} from 'lucide-react';
import { fetchNotifications } from '../../supabase/db';
import { EATM_EMBLEM } from '../../constants/assets';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
  onOpenSearch?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu, onOpenSearch }) => {
  const { user, logout } = useAuth();
  const { theme, resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState<number>(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications(user.id).then(notifs => {
        setUnreadNotifs(notifs.filter(n => !n.read).length);
      });
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [user]);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0f1b14]/95 backdrop-blur-md border-b border-gray-200/80 dark:border-[#1e3326] px-4 lg:px-8 py-2.5 transition-colors duration-150">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Mobile menu toggle & Brand (visible on small screens) */}
        <div className="flex items-center gap-3 lg:hidden">
          <button
            onClick={onToggleMobileMenu}
            className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#182b20] hover:text-gray-900 dark:hover:text-white transition"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <img src={EATM_EMBLEM} alt="EATM Logo" className="w-8 h-8 object-contain shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold text-[#0b4627] dark:text-emerald-400 text-sm leading-tight">EATM</span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">CampusConnect</span>
            </div>
          </Link>
        </div>

        {/* Global Search bar */}
        <div className="flex-1 max-w-xl hidden sm:block">
          <div 
            onClick={onOpenSearch}
            className="relative flex items-center cursor-pointer group"
          >
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              readOnly
              onClick={onOpenSearch}
              placeholder="Search for people, clubs, events..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-[#16251c] hover:bg-gray-100 dark:hover:bg-[#1b2f23] border border-gray-200 dark:border-[#1e3326] hover:border-emerald-300 dark:hover:border-emerald-700 rounded-xl cursor-pointer text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition"
            />
            <div className="absolute right-3 hidden md:flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 dark:text-gray-400 bg-white dark:bg-[#111d15] border border-gray-200 dark:border-[#1e3326] rounded">Ctrl</kbd>
              <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 dark:text-gray-400 bg-white dark:bg-[#111d15] border border-gray-200 dark:border-[#1e3326] rounded">K</kbd>
            </div>
          </div>
        </div>

        {/* Right action icons & user profile */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Mobile search button */}
          <button
            onClick={onOpenSearch}
            className="sm:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#182b20] rounded-xl transition"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Quick Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-[#0b4627] dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-[#182b20] rounded-xl transition focus:outline-none"
            title={`Current: ${resolvedTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}. Click to switch.`}
            aria-label="Toggle visual theme"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400 transition-transform duration-200 hover:rotate-45" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600 transition-transform duration-200 hover:-rotate-12" />
            )}
          </button>

          {/* Messages shortcut */}
          <Link
            to={`/${user?.role || 'student'}/messages`}
            className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-[#0b4627] dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-[#182b20] rounded-xl transition"
            aria-label="Messages"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#dc2626] rounded-full ring-2 ring-white dark:ring-[#0f1b14]" />
          </Link>

          {/* Notifications shortcut */}
          <Link
            to={`/${user?.role || 'student'}/notifications`}
            className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-[#0b4627] dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-[#182b20] rounded-xl transition"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifs > 0 && (
              <span className="absolute top-1 right-1 px-1.5 py-0.2 text-[10px] font-bold text-white bg-[#dc2626] rounded-full ring-2 ring-white dark:ring-[#0f1b14]">
                {unreadNotifs}
              </span>
            )}
          </Link>

          {/* User profile dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 p-1 pl-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-[#182b20] transition focus:outline-none"
            >
              <Avatar
                src={user?.photoURL}
                name={user?.displayName || 'User'}
                size="sm"
                online={true}
              />
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100 leading-tight">
                  {user?.displayName || 'User Profile'}
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 capitalize leading-tight">
                  {user?.role === 'admin' ? 'Admin Officer' : user?.role === 'faculty' ? 'Faculty Member' : 'Student'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#111d15] rounded-2xl shadow-xl border border-gray-100 dark:border-[#1e3326] py-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2.5 border-b border-gray-100 dark:border-[#1e3326] bg-[#f8faf9] dark:bg-[#16251c] rounded-t-2xl">
                  <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{user?.displayName}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 dark:bg-emerald-950 text-[#0b4627] dark:text-emerald-300 uppercase">
                    {user?.role}
                  </span>
                </div>

                <div className="py-1">
                  <Link
                    to={`/${user?.role || 'student'}/profile`}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#16251c] hover:text-[#0b4627] dark:hover:text-emerald-400 transition"
                  >
                    <User className="w-4 h-4 text-gray-400" />
                    My Profile
                  </Link>

                  {user?.role === 'student' && (
                    <Link
                      to="/student/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#16251c] hover:text-[#0b4627] dark:hover:text-emerald-400 transition"
                    >
                      <Settings className="w-4 h-4 text-gray-400" />
                      Settings & Privacy
                    </Link>
                  )}

                  {user?.role === 'admin' && (
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#16251c] hover:text-[#0b4627] dark:hover:text-emerald-400 transition"
                    >
                      <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Admin Control Panel
                    </Link>
                  )}
                </div>

                <div className="border-t border-gray-100 dark:border-[#1e3326] py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
