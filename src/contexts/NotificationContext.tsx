import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { 
  fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead,
  deleteNotification, clearNotifications, subscribeToNotifications
} from '../supabase/db';
import { NotificationItem } from '../types';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  unreadMessagesCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markMessageNotificationsAsRead: () => Promise<void>;
  deleteOne: (id: string) => Promise<void>;
  clearAll: (onlyRead?: boolean) => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifs = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    try {
      const list = await fetchNotifications(user.id);
      // For now remove system notifications as requested
      setNotifications(list.filter(n => n.type !== 'system'));
    } catch (err) {
      console.warn('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadNotifs();

    // 1. Listen to local storage changes across tabs and windows
    const handleLocalChange = () => {
      loadNotifs();
    };
    window.addEventListener('eatm_notifications_changed', handleLocalChange);

    // 2. Listen to Supabase Realtime channel
    let unsubscribeSupabase = () => {};
    if (user?.id) {
      unsubscribeSupabase = subscribeToNotifications(user.id, () => {
        loadNotifs();
      });
    }

    return () => {
      window.removeEventListener('eatm_notifications_changed', handleLocalChange);
      unsubscribeSupabase();
    };
  }, [user?.id, loadNotifs]);

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await markNotificationAsRead(id);
    } catch (e) {
      console.warn('Error marking notification as read:', e);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await markAllNotificationsAsRead(user.id);
    } catch (e) {
      console.warn('Error marking all notifications as read:', e);
    }
  };

  const deleteOne = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await deleteNotification(id);
    } catch (e) {
      console.warn('Error deleting notification:', e);
    }
  };

  const clearAll = async (onlyRead = false) => {
    if (!user?.id) return;
    setNotifications(prev => onlyRead ? prev.filter(n => !n.read) : []);
    try {
      await clearNotifications(user.id, onlyRead);
    } catch (e) {
      console.warn('Error clearing notifications:', e);
    }
  };

  const markMessageNotificationsAsRead = async () => {
    const unreadMsgNotifs = notifications.filter(n => !n.read && n.type === 'message');
    if (unreadMsgNotifs.length === 0) return;
    setNotifications(prev =>
      prev.map(n => n.type === 'message' ? { ...n, read: true } : n)
    );
    for (const n of unreadMsgNotifs) {
      try {
        await markNotificationAsRead(n.id);
      } catch (err) {
        console.warn('Failed to mark message notification as read:', err);
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const unreadMessagesCount = notifications.filter(n => !n.read && n.type === 'message').length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        unreadMessagesCount,
        loading,
        markAsRead,
        markAllAsRead,
        markMessageNotificationsAsRead,
        deleteOne,
        clearAll,
        refresh: loadNotifs
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
