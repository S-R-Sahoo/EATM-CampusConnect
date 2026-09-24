import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Home, Compass, Award, MessageSquare, User } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { user } = useAuth();
  const { unreadMessagesCount, markMessageNotificationsAsRead } = useNotifications();

  const rolePath = user?.role || 'student';

  const navItems = [
    { to: `/${rolePath}/dashboard`, icon: Home, label: 'Home' },
    { to: `/${rolePath}/discover`, icon: Compass, label: 'Discover' },
    { to: `/${rolePath}/communities`, icon: Award, label: 'Clubs' },
    { 
      to: `/${rolePath}/messages`, 
      icon: MessageSquare, 
      label: 'Messages', 
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
      badgeColor: 'bg-[#25d366]' 
    },
    { to: `/${rolePath}/profile`, icon: User, label: 'Profile' },
  ];

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#111d15]/95 backdrop-blur-md border-t border-gray-200 dark:border-[#1e3325] px-2 py-1.5 transition-colors duration-150 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] dark:shadow-[0_-2px_10px_rgba(0,0,0,0.2)]"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
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
                `flex flex-col items-center justify-center relative p-1.5 flex-1 min-w-0 transition-colors ${
                  isActive 
                    ? 'text-[#0b4627] dark:text-emerald-400 font-bold' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon className={`w-5 h-5 transition-transform duration-150 ${isActive ? 'scale-110' : ''}`} />
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 text-[10px] font-bold text-white ${item.badgeColor || 'bg-[#25d366]'} rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#111d15] shadow-xs leading-none`}>
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] truncate max-w-full mt-1 ${isActive ? 'font-bold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
