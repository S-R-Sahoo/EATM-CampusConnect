import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Home, Compass, MessageSquare, Bell, User } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { user } = useAuth();
  const { unreadCount, unreadMessagesCount, markMessageNotificationsAsRead } = useNotifications();

  const navItems = [
    { to: `/${user?.role || 'student'}/dashboard`, icon: Home, label: 'Home' },
    { to: `/${user?.role || 'student'}/discover`, icon: Compass, label: 'Discover' },
    { to: `/${user?.role || 'student'}/messages`, icon: MessageSquare, label: 'Messages', badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined },
    { to: `/${user?.role || 'student'}/notifications`, icon: Bell, label: 'Alerts', badge: unreadCount > 0 ? unreadCount : undefined },
    { to: `/${user?.role || 'student'}/profile`, icon: User, label: 'Profile' },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#111d15]/95 backdrop-blur-md border-t border-gray-200 dark:border-[#1e3325] px-3 py-2 transition-colors duration-150">
      <div className="flex items-center justify-around">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => {
                if (item.to.includes('messages')) {
                  markMessageNotificationsAsRead();
                }
              }}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center relative p-1 transition-colors ${
                  isActive ? 'text-[#0b4627] dark:text-emerald-400 font-bold' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`
              }
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 px-1 text-[9px] font-bold bg-[#dc2626] text-white rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};
