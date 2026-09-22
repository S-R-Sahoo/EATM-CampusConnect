import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import { useToast } from '../../contexts/ToastContext';
import { Avatar } from '../../components/ui/Avatar';
import { 
  Bell, Heart, UserPlus, UserCheck, Calendar, 
  CheckCheck, MessageSquare, Trash2, X, ArrowRight,
  Sparkles, CheckCircle2, Inbox
} from 'lucide-react';

function formatNotificationTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHour / 24);

    if (isNaN(date.getTime())) return 'Recently';
    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteOne, clearAll, loading } = useNotifications();
  const { success } = useToast();
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'message' | 'connection' | 'event'>('all');

  // Filter out any system notifications for now as requested
  const visibleNotifications = notifications.filter(n => n.type !== 'system');

  const unreadTotal = visibleNotifications.filter(n => !n.read).length;
  const messageTotal = visibleNotifications.filter(n => n.type.toLowerCase().includes('message')).length;
  const connectionTotal = visibleNotifications.filter(n => n.type.toLowerCase().includes('connection')).length;
  const eventTotal = visibleNotifications.filter(n => n.type.toLowerCase().includes('event')).length;

  const filtered = visibleNotifications.filter(n => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'message') return n.type.toLowerCase().includes('message');
    if (activeTab === 'connection') return n.type.toLowerCase().includes('connection');
    if (activeTab === 'event') return n.type.toLowerCase().includes('event');
    return true;
  });

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    success('All notifications marked as read', 'Updated');
  };

  const handleClearRead = async () => {
    await clearAll(true);
    success('Cleared already-read notifications', 'Cleaned up');
  };

  const handleItemClick = async (id: string, link?: string) => {
    await markAsRead(id);
    if (link) {
      navigate(link);
    }
  };

  const getNotificationIcon = (type: string) => {
    if (type.includes('message')) {
      return (
        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-[#0b4627] dark:text-emerald-400 shrink-0 shadow-2xs">
          <MessageSquare className="w-5 h-5" />
        </div>
      );
    }
    if (type.includes('connection_accepted')) {
      return (
        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-[#0b4627] dark:text-emerald-400 shrink-0 shadow-2xs">
          <UserCheck className="w-5 h-5 stroke-[2.2]" />
        </div>
      );
    }
    if (type.includes('connection')) {
      return (
        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-[#0b4627] dark:text-emerald-400 shrink-0 shadow-2xs">
          <UserPlus className="w-5 h-5" />
        </div>
      );
    }
    if (type.includes('event')) {
      return (
        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center text-blue-700 dark:text-blue-400 shrink-0 shadow-2xs">
          <Calendar className="w-5 h-5" />
        </div>
      );
    }
    if (type.includes('like')) {
      return (
        <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 shadow-2xs">
          <Heart className="w-5 h-5 fill-current" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-[#0b4627] dark:text-emerald-400 shrink-0 shadow-2xs">
        <Bell className="w-5 h-5" />
      </div>
    );
  };

  const getActionLabel = (type: string) => {
    if (type.includes('message')) return 'Open Chat';
    if (type.includes('connection_accepted')) return 'Message';
    if (type.includes('connection_request')) return 'View Request';
    if (type.includes('event')) return 'View Event';
    return 'View';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Official Header Card */}
      <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/90 dark:border-[#1e3325] p-5 sm:p-6 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center text-[#0b4627] dark:text-emerald-400">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-2">
                  <span>Campus Alerts & Notifications</span>
                  {unreadTotal > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#dc2626] text-white">
                      {unreadTotal} new
                    </span>
                  )}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Real-time activity updates for messages, peer connections, and campus events.
                </p>
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {unreadTotal > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-[#0b4627] dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 active:scale-95 transition-all cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Mark all read</span>
              </button>
            )}

            {visibleNotifications.some(n => n.read) && (
              <button
                type="button"
                onClick={handleClearRead}
                title="Clear all already read notifications"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-[#16251c] border border-gray-300 dark:border-[#2a4533] hover:bg-gray-50 dark:hover:bg-[#1f3527] active:scale-95 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-gray-500" />
                <span>Clear read</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs (System removed as requested) */}
        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-[#1e3325] flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#0b4627] text-white shadow-2xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#16251c]'
            }`}
          >
            <span>All</span>
            <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
              activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-[#1e3325] text-gray-600 dark:text-gray-400'
            }`}>
              {visibleNotifications.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('unread')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'unread'
                ? 'bg-[#0b4627] text-white shadow-2xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#16251c]'
            }`}
          >
            <span>Unread</span>
            {unreadTotal > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] rounded-full font-bold bg-[#dc2626] text-white">
                {unreadTotal}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('message')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'message'
                ? 'bg-[#0b4627] text-white shadow-2xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#16251c]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Messages</span>
            {messageTotal > 0 && (
              <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                activeTab === 'message' ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-[#1e3325] text-gray-600 dark:text-gray-400'
              }`}>
                {messageTotal}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('connection')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'connection'
                ? 'bg-[#0b4627] text-white shadow-2xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#16251c]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>Connections</span>
            {connectionTotal > 0 && (
              <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                activeTab === 'connection' ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-[#1e3325] text-gray-600 dark:text-gray-400'
              }`}>
                {connectionTotal}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('event')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'event'
                ? 'bg-[#0b4627] text-white shadow-2xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#16251c]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Events</span>
            {eventTotal > 0 && (
              <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                activeTab === 'event' ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-[#1e3325] text-gray-600 dark:text-gray-400'
              }`}>
                {eventTotal}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Notifications List Container */}
      <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/90 dark:border-[#1e3325] shadow-xs divide-y divide-gray-100 dark:divide-[#1a2d21] overflow-hidden transition-colors">
        {loading ? (
          <div className="p-12 text-center text-gray-400 dark:text-gray-500 text-xs">
            <div className="w-6 h-6 border-2 border-[#0b4627] dark:border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading campus alerts...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-14 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-[#16251c] border border-gray-200/80 dark:border-[#1e3325] flex items-center justify-center mx-auto mb-3 text-gray-400 dark:text-gray-500">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
              {activeTab === 'unread' ? 'All caught up!' : 'No notifications in this category'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
              {activeTab === 'unread' 
                ? 'You have read all pending notifications. New connection requests, messages, and events will appear here in real-time.' 
                : 'Activity for this category will appear here as soon as it happens.'}
            </p>
          </div>
        ) : (
          filtered.map(notif => {
            const timeAgo = formatNotificationTime(notif.createdAt);
            const isUnread = !notif.read;

            return (
              <div
                key={notif.id}
                onClick={() => handleItemClick(notif.id, notif.link)}
                className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-all duration-150 cursor-pointer group ${
                  isUnread 
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/35 border-l-4 border-l-[#0b4627] dark:border-l-emerald-400' 
                    : 'hover:bg-gray-50/80 dark:hover:bg-[#15231a]'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {/* Avatar or Dedicated Type Icon */}
                  {notif.senderAvatar ? (
                    <div className="relative shrink-0">
                      <Avatar 
                        src={notif.senderAvatar} 
                        name={notif.senderName || 'Student'} 
                        size="md" 
                      />
                      {isUnread && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#111d15]" />
                      )}
                    </div>
                  ) : (
                    <div className="relative shrink-0">
                      {getNotificationIcon(notif.type)}
                      {isUnread && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#111d15]" />
                      )}
                    </div>
                  )}

                  {/* Notification Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`text-xs sm:text-sm tracking-tight ${
                        isUnread 
                          ? 'font-extrabold text-[#0b4627] dark:text-emerald-300' 
                          : 'font-semibold text-gray-900 dark:text-gray-100'
                      }`}>
                        {notif.title}
                      </h4>
                      {isUnread && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#0b4627] dark:bg-emerald-600 text-white shrink-0">
                          NEW
                        </span>
                      )}
                    </div>

                    <p className={`text-xs leading-relaxed ${
                      isUnread ? 'text-gray-800 dark:text-gray-200 font-medium' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {notif.message}
                    </p>

                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">
                      <span>{timeAgo}</span>
                      <span>•</span>
                      <span className="capitalize">{notif.type.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                </div>

                {/* Right Side Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0 self-center">
                  {notif.link && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemClick(notif.id, notif.link);
                      }}
                      className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-[#16251c] text-[#0b4627] dark:text-emerald-400 border border-gray-200 dark:border-[#2a4533] hover:border-emerald-400 dark:hover:border-emerald-600 shadow-2xs active:scale-95 transition-all"
                    >
                      <span>{getActionLabel(notif.type)}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}

                  {/* Dismiss / Delete button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteOne(notif.id);
                    }}
                    title="Dismiss alert"
                    className="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
