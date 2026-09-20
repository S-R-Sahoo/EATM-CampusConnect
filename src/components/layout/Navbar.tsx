import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../ui/Avatar';
import { 
  Search, Bell, MessageSquare, Menu, LogOut, 
  User, Settings, ChevronDown, Check, Shield, BookOpen 
} from 'lucide-react';
import { fetchNotifications } from '../../firebase/firestore';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
  onOpenSearch?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu, onOpenSearch }) => {
  const { user, logout } = useAuth();
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
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/80 px-4 lg:px-8 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Mobile menu toggle & Brand (visible on small screens) */}
        <div className="flex items-center gap-3 lg:hidden">
          <button
            onClick={onToggleMobileMenu}
            className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <img src="/eatm-emblem.png" alt="EATM Logo" className="w-8 h-8 object-contain shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold text-[#0b4627] text-sm leading-tight">EATM</span>
              <span className="text-[10px] text-gray-500 leading-tight">CampusConnect</span>
            </div>
          </Link>
        </div>

        {/* Global Search bar */}
        <div className="flex-1 max-w-xl hidden sm:block">
          <div 
            onClick={onOpenSearch}
            className="relative flex items-center cursor-pointer group"
          >
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-hover:text-emerald-700 transition-colors">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              readOnly
              onClick={onOpenSearch}
              placeholder="Search for people, clubs, events..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-emerald-300 rounded-xl cursor-pointer text-gray-700 placeholder:text-gray-400 transition"
            />
            <div className="absolute right-3 hidden md:flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 bg-white border border-gray-200 rounded">Ctrl</kbd>
              <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 bg-white border border-gray-200 rounded">K</kbd>
            </div>
          </div>
        </div>

        {/* Right action icons & user profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile search button */}
          <button
            onClick={onOpenSearch}
            className="sm:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Messages shortcut */}
          <Link
            to={`/${user?.role || 'student'}/messages`}
            className="relative p-2 text-gray-600 hover:text-[#0b4627] hover:bg-emerald-50 rounded-xl transition"
            aria-label="Messages"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#dc2626] rounded-full ring-2 ring-white" />
          </Link>

          {/* Notifications shortcut */}
          <Link
            to={`/${user?.role || 'student'}/notifications`}
            className="relative p-2 text-gray-600 hover:text-[#0b4627] hover:bg-emerald-50 rounded-xl transition"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifs > 0 && (
              <span className="absolute top-1 right-1 px-1.5 py-0.2 text-[10px] font-bold text-white bg-[#dc2626] rounded-full ring-2 ring-white">
                {unreadNotifs}
              </span>
            )}
          </Link>

          {/* User profile dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 p-1 pl-1.5 rounded-xl hover:bg-gray-100 transition focus:outline-none"
            >
              <Avatar
                src={user?.photoURL}
                name={user?.displayName || 'User'}
                size="sm"
                online={true}
              />
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-gray-900 leading-tight">
                  {user?.displayName || 'User Profile'}
                </span>
                <span className="text-[11px] text-gray-500 capitalize leading-tight">
                  {user?.role === 'admin' ? 'Admin Officer' : user?.role === 'faculty' ? 'Faculty Member' : 'Student'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2.5 border-b border-gray-100 bg-[#f8faf9] rounded-t-2xl">
                  <p className="text-xs font-semibold text-gray-900">{user?.displayName}</p>
                  <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 text-[#0b4627] uppercase">
                    {user?.role}
                  </span>
                </div>

                <div className="py-1">
                  <Link
                    to={`/${user?.role || 'student'}/profile`}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-[#0b4627] transition"
                  >
                    <User className="w-4 h-4 text-gray-400" />
                    My Profile
                  </Link>

                  {user?.role === 'student' && (
                    <Link
                      to="/student/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-[#0b4627] transition"
                    >
                      <Settings className="w-4 h-4 text-gray-400" />
                      Settings & Privacy
                    </Link>
                  )}

                  {user?.role === 'admin' && (
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-[#0b4627] transition"
                    >
                      <Shield className="w-4 h-4 text-emerald-600" />
                      Admin Control Panel
                    </Link>
                  )}
                </div>

                <div className="border-t border-gray-100 py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition text-left"
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
