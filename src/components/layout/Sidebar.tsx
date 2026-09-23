import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { 
  Home, Compass, Users, MessageSquare, 
  Calendar, BookOpen, Briefcase, Bell, 
  User, Settings, LogOut, Shield, FileText, CheckSquare, Award
} from 'lucide-react';
import { EATM_EMBLEM } from '../../constants/assets';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { user, logout } = useAuth();
  const { unreadCount, unreadMessagesCount } = useNotifications();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (onCloseMobile) onCloseMobile();
    await logout();
    navigate('/login');
  };

  const studentLinks = [
    { to: '/student/dashboard', icon: Home, label: 'Home' },
    { to: '/student/discover', icon: Compass, label: 'Discover' },
    { to: '/student/connections', icon: Users, label: 'Connections' },
    { to: '/student/messages', icon: MessageSquare, label: 'Messages' },
    { to: '/student/communities', icon: Award, label: 'Communities' },
    { to: '/student/events', icon: Calendar, label: 'Events' },
    { to: '/student/study-materials', icon: BookOpen, label: 'Study Materials' },
    { to: '/student/opportunities', icon: Briefcase, label: 'Opportunities' },
    { to: '/student/notifications', icon: Bell, label: 'Notifications' },
    { to: '/student/profile', icon: User, label: 'Profile' },
    { to: '/student/settings', icon: Settings, label: 'Settings' },
  ];

  const facultyLinks = [
    { to: '/faculty/dashboard', icon: Home, label: 'Overview' },
    { to: '/faculty/announcements', icon: Bell, label: 'Announcements' },
    { to: '/faculty/students', icon: Users, label: 'Students' },
    { to: '/faculty/events', icon: Calendar, label: 'Events' },
    { to: '/faculty/study-materials', icon: BookOpen, label: 'Study Materials' },
    { to: '/faculty/assignments', icon: CheckSquare, label: 'Assignments' },
    { to: '/faculty/communities', icon: Award, label: 'Communities' },
    { to: '/faculty/profile', icon: User, label: 'Profile' },
  ];

  const links = user?.role === 'faculty' ? facultyLinks : studentLinks;

  return (
    <aside className="w-64 bg-white dark:bg-[#111d15] border-r border-gray-200/80 dark:border-[#1e3326] flex flex-col h-full select-none transition-colors duration-150">
      {/* Brand Header */}
      <div className="p-4 border-b border-gray-100 dark:border-[#1e3326] flex items-center gap-2.5">
        <img src={EATM_EMBLEM} alt="EATM Logo" className="w-10 h-10 object-contain shrink-0" />
        <div className="flex flex-col">
          <span className="font-extrabold text-[#0b4627] dark:text-emerald-400 text-base leading-tight tracking-tight">
            EATM
          </span>
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wider">
            CampusConnect
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                  isActive
                    ? 'bg-[#0b4627] dark:bg-emerald-700 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-[#0b4627] dark:hover:text-emerald-300 hover:bg-emerald-50/70 dark:hover:bg-[#16251c]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-[#0b4627] dark:group-hover:text-emerald-400'}`} />
                  <span className="truncate">{link.label}</span>
                  {link.to.includes('notifications') && unreadCount > 0 && (
                    <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold text-white bg-[#dc2626] rounded-full">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                  {link.to.includes('messages') && unreadMessagesCount > 0 && (
                    <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold text-white bg-[#dc2626] rounded-full">
                      {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Logout */}
      <div className="p-3 border-t border-gray-100 dark:border-[#1e3326]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition duration-150"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
