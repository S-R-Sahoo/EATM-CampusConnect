import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { 
  fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead 
} from '../../firebase/firestore';
import { NotificationItem } from '../../types';
import { Tabs } from '../../components/ui/Tabs';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { 
  Bell, Heart, UserPlus, Calendar, AlertTriangle, 
  Check, CheckCheck, Clock, Award, MessageSquare 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const { success } = useToast();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'All', label: 'All' },
    { id: 'message', label: 'Messages' },
    { id: 'connection', label: 'Connections' },
    { id: 'event', label: 'Events' },
    { id: 'system', label: 'System' },
  ];

  const loadNotifs = async () => {
    if (!user) return;
    try {
      const list = await fetchNotifications(user.id);
      setNotifications(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifs();
  }, [user]);

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllNotificationsAsRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    success('All notifications marked as read.');
  };

  const handleReadSingle = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <div className="p-2 rounded-xl bg-red-100 text-[#dc2626]"><Heart className="w-4 h-4 fill-current" /></div>;
      case 'connection_request':
      case 'connection_accepted':
        return <div className="p-2 rounded-xl bg-emerald-100 text-[#0b4627]"><UserPlus className="w-4 h-4" /></div>;
      case 'event_registration':
        return <div className="p-2 rounded-xl bg-blue-100 text-blue-700"><Calendar className="w-4 h-4" /></div>;
      case 'club_invite':
        return <div className="p-2 rounded-xl bg-purple-100 text-purple-700"><Award className="w-4 h-4" /></div>;
      case 'message':
        return <div className="p-2 rounded-xl bg-emerald-100 text-[#0b4627]"><MessageSquare className="w-4 h-4" /></div>;
      default:
        return <div className="p-2 rounded-xl bg-amber-100 text-amber-700"><AlertTriangle className="w-4 h-4" /></div>;
    }
  };

  const filtered = notifications.filter(n => {
    if (activeTab === 'All') return true;
    return n.type.toLowerCase().includes(activeTab.toLowerCase());
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#0b4627]" />
              <span>Campus Notifications</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Stay on top of connection requests, upcoming deadlines, and activity on your posts
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            icon={<CheckCheck className="w-4 h-4" />}
          >
            Mark all as read
          </Button>
        </div>

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-card divide-y divide-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-xs">
            No notifications in this category.
          </div>
        ) : (
          filtered.map(notif => (
            <div
              key={notif.id}
              onClick={() => handleReadSingle(notif.id)}
              className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors cursor-pointer ${
                !notif.read ? 'bg-emerald-50/40 hover:bg-emerald-50/70' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-3.5">
                {notif.senderAvatar ? (
                  <Avatar src={notif.senderAvatar} name={notif.senderName || 'Sender'} size="md" />
                ) : (
                  getIcon(notif.type)
                )}

                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className={`text-xs font-bold ${!notif.read ? 'text-[#0b4627]' : 'text-gray-900'}`}>
                      {notif.title}
                    </h4>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-[#dc2626]" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {notif.message}
                  </p>
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Today
                  </span>
                </div>
              </div>

              {notif.link && (
                <Link
                  to={notif.link}
                  className="text-xs font-semibold text-[#0b4627] hover:underline shrink-0 self-center"
                >
                  View
                </Link>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
