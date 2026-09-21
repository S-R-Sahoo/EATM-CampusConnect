import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { 
  fetchConnections, updateConnectionStatus, fetchUsers, 
  getOrCreateConversation, subscribeToConnections 
} from '../../supabase/db';
import { Connection, UserProfile } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { Tabs } from '../../components/ui/Tabs';
import { Button } from '../../components/ui/Button';
import { Users, Check, X, Clock, MessageSquare, Loader2, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';

export const ConnectionsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('all');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [usersMap, setUsersMap] = useState<{ [id: string]: UserProfile }>({});
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    try {
      const [allConns, allUsers] = await Promise.all([
        fetchConnections(user.id),
        fetchUsers()
      ]);
      setConnections(allConns);
      const map: { [id: string]: UserProfile } = {};
      allUsers.forEach(u => {
        map[u.id] = u;
      });
      setUsersMap(map);
    } catch (err) {
      console.error('Failed to load connections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    if (!user) return;
    // Live realtime WebSocket subscription to connections table
    const unsubscribe = subscribeToConnections(user.id, () => {
      loadData();
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  const handleAccept = async (connId: string) => {
    setActionLoadingId(connId);
    try {
      await updateConnectionStatus(connId, 'accepted');
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      success('Connection request accepted! You are now campus friends 🎉', 'Friend Connected');
      await refreshUser();
      await loadData();
    } catch (err: any) {
      toastError('Could not accept connection request. Please try again.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (connId: string) => {
    setActionLoadingId(connId);
    try {
      await updateConnectionStatus(connId, 'rejected');
      success('Connection request declined.', 'Request Ignored');
      await loadData();
    } catch (err: any) {
      toastError('Could not decline request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleStartChat = async (otherUserId: string) => {
    if (!user) return;
    try {
      const conv = await getOrCreateConversation(user.id, otherUserId);
      navigate('/student/messages', { state: { conversationId: conv.id } });
    } catch (err) {
      navigate('/student/messages');
    }
  };

  if (!user) return null;

  const acceptedConns = connections.filter(c => c.status === 'accepted');
  const receivedRequests = connections.filter(c => c.status === 'pending' && c.recipientId === user.id);
  const sentRequests = connections.filter(c => c.status === 'pending' && c.requesterId === user.id);

  const tabs = [
    { id: 'all', label: 'All Friends', count: acceptedConns.length },
    { id: 'received', label: 'Requests Received', count: receivedRequests.length },
    { id: 'sent', label: 'Requests Sent', count: sentRequests.length },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-[#111d15] rounded-3xl border border-gray-200/80 dark:border-[#1e3325] p-6 shadow-card transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#0b4627] dark:text-emerald-400" />
              <span>Campus Connections & Friends</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Connect, chat, and collaborate with your peers and branch mates at EATM
            </p>
          </div>
          <Link to="/student/discover">
            <Button variant="primary" size="sm" icon={<Sparkles className="w-3.5 h-3.5" />}>
              Discover Students
            </Button>
          </Link>
        </div>

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />
      </div>

      {/* Lists */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white dark:bg-[#111d15] rounded-3xl p-12 text-center text-gray-400 border border-gray-200 dark:border-[#1e3325]">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
            <p className="text-xs font-medium">Syncing campus connections...</p>
          </div>
        ) : activeTab === 'all' && (
          acceptedConns.length === 0 ? (
            <div className="bg-white dark:bg-[#111d15] rounded-3xl p-12 text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#1e3325]">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-[#0b4627] dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <p className="font-bold text-sm text-gray-900 dark:text-gray-100">No campus friends connected yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-sm mx-auto">
                Head to the Discover page to connect with classmates, branch seniors, and project collaborators!
              </p>
              <Link to="/student/discover" className="inline-block mt-4">
                <Button variant="outline" size="sm">
                  Find Classmates
                </Button>
              </Link>
            </div>
          ) : (
            acceptedConns.map(conn => {
              const otherId = conn.requesterId === user.id ? conn.recipientId : conn.requesterId;
              const otherUser = usersMap[otherId];
              if (!otherUser) return null;

              return (
                <div
                  key={conn.id}
                  className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/80 dark:border-[#1e3325] p-4 shadow-card hover:border-emerald-200 dark:hover:border-emerald-800 transition-all flex items-center justify-between gap-4"
                >
                  <Link
                    to={`/student/profile/${otherId}`}
                    className="flex items-center gap-3.5 min-w-0 group/friend hover:opacity-95 transition"
                    title="View Student Profile"
                  >
                    <Avatar src={otherUser.photoURL} name={otherUser.displayName} size="md" online={true} />
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 group-hover/friend:text-[#0b4627] dark:group-hover/friend:text-emerald-400 transition-colors truncate">
                        {otherUser.displayName}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {otherUser.department} • {otherUser.year || 'Student'}
                      </p>
                    </div>
                  </Link>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStartChat(otherId)}
                    icon={<MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                    className="shrink-0"
                  >
                    Message
                  </Button>
                </div>
              );
            })
          )
        )}

        {!loading && activeTab === 'received' && (
          receivedRequests.length === 0 ? (
            <div className="bg-white dark:bg-[#111d15] rounded-3xl p-12 text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#1e3325]">
              <p className="font-semibold text-sm">No pending connection requests</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                When students want to connect with you, their requests will appear here.
              </p>
            </div>
          ) : (
            receivedRequests.map(conn => {
              const requester = usersMap[conn.requesterId];
              if (!requester) return null;
              const isActioning = actionLoadingId === conn.id;

              return (
                <div
                  key={conn.id}
                  className="bg-white dark:bg-[#111d15] rounded-2xl border border-emerald-100 dark:border-[#1e3325] p-4 shadow-card flex items-center justify-between gap-4"
                >
                  <Link
                    to={`/student/profile/${conn.requesterId}`}
                    className="flex items-center gap-3.5 min-w-0 group/requester hover:opacity-95 transition"
                    title="View Student Profile"
                  >
                    <Avatar src={requester.photoURL} name={requester.displayName} size="md" />
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 group-hover/requester:text-[#0b4627] dark:group-hover/requester:text-emerald-400 transition-colors truncate">
                        {requester.displayName}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {requester.department} • {requester.year || 'Student'}
                      </p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={isActioning}
                      onClick={() => handleAccept(conn.id)}
                      icon={isActioning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isActioning}
                      onClick={() => handleReject(conn.id)}
                      icon={<X className="w-3.5 h-3.5" />}
                    >
                      Ignore
                    </Button>
                  </div>
                </div>
              );
            })
          )
        )}

        {!loading && activeTab === 'sent' && (
          sentRequests.length === 0 ? (
            <div className="bg-white dark:bg-[#111d15] rounded-3xl p-12 text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#1e3325]">
              <p className="font-semibold text-sm">No sent requests pending</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Explore the campus community to connect with other students.
              </p>
            </div>
          ) : (
            sentRequests.map(conn => {
              const recipient = usersMap[conn.recipientId];
              if (!recipient) return null;

              return (
                <div
                  key={conn.id}
                  className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/80 dark:border-[#1e3325] p-4 shadow-card flex items-center justify-between gap-4"
                >
                  <Link
                    to={`/student/profile/${conn.recipientId}`}
                    className="flex items-center gap-3.5 min-w-0 group/recipient hover:opacity-95 transition"
                    title="View Student Profile"
                  >
                    <Avatar src={recipient.photoURL} name={recipient.displayName} size="md" />
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 group-hover/recipient:text-[#0b4627] dark:group-hover/recipient:text-emerald-400 transition-colors truncate">
                        {recipient.displayName}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {recipient.department} • {recipient.year || 'Student'}
                      </p>
                    </div>
                  </Link>

                  <span className="text-xs font-semibold px-3 py-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-full border border-amber-200/70 dark:border-amber-800/60 flex items-center gap-1.5 shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Pending Approval</span>
                  </span>
                </div>
              );
            })
          )
        )}
      </div>
    </div>
  );
};
