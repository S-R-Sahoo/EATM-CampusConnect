import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
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

  const adminLinks = [
    { to: '/admin/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/admin/students', icon: Users, label: 'Students' },
    { to: '/admin/faculty', icon: Users, label: 'Faculty' },
    { to: '/admin/posts', icon: FileText, label: 'Posts' },
    { to: '/admin/communities', icon: Award, label: 'Clubs' },
    { to: '/admin/events', icon: Calendar, label: 'Events' },
    { to: '/admin/reports', icon: Shield, label: 'Reports' },
    { to: '/admin/announcements', icon: Bell, label: 'Announcements' },
  ];

  const links = user?.role === 'admin' 
    ? adminLinks 
    : user?.role === 'faculty' 
    ? facultyLinks 
    : studentLinks;

  return (
    <aside className="w-64 bg-white border-r border-gray-200/80 flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-gray-100 flex items-center gap-2.5">
        <img src={EATM_EMBLEM} alt="EATM Logo" className="w-10 h-10 object-contain shrink-0" />
        <div className="flex flex-col">
          <span className="font-extrabold text-[#0b4627] text-base leading-tight tracking-tight">
            EATM
          </span>
          <span className="text-xs font-semibold text-gray-500 tracking-wider">
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
                    ? 'bg-[#0b4627] text-white shadow-sm'
                    : 'text-gray-600 hover:text-[#0b4627] hover:bg-emerald-50/70'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-[#0b4627]'}`} />
                  <span className="truncate">{link.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Logout */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition duration-150"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
