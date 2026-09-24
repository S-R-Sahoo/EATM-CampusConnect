import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { 
  fetchConnectionsWithProfiles, 
  updateConnectionStatus, 
  cancelConnectionRequest, 
  removeConnection,
  getOrCreateConversation, 
  subscribeToConnections 
} from '../../supabase/db';
import { Connection, UserProfile } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { 
  Users, 
  Check, 
  X, 
  Clock, 
  MessageSquare, 
  Loader2, 
  Search, 
  UserCheck, 
  UserPlus, 
  Send, 
  UserX, 
  AlertCircle, 
  ExternalLink,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { isUserOnline, subscribeToPresence } from '../../supabase/presence';

export const ConnectionsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('all');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [, setPresenceTick] = useState(0);

  // Unfriend modal state
  const [unfriendTarget, setUnfriendTarget] = useState<{ connId: string; user: UserProfile } | null>(null);
  const [unfriendLoading, setUnfriendLoading] = useState(false);

  const loadData = async () => {
    if (!user) return;
    try {
      setErrorMsg(null);
      const { connections: conns, usersMap: map } = await fetchConnectionsWithProfiles(user.id);
      setConnections(conns);
      setUsersMap(map);
    } catch (err: any) {
      console.error('Failed to load connections:', err);
      setErrorMsg(err?.message || 'Could not load your connections. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    if (!user) return;
    // Live realtime WebSocket and broadcast subscription
    const unsubscribeConns = subscribeToConnections(user.id, () => {
      loadData();
    });

    const unsubscribePresence = subscribeToPresence(() => {
      setPresenceTick(t => t + 1);
    });

    return () => {
      unsubscribeConns();
      unsubscribePresence();
    };
  }, [user?.id]);

  const handleAccept = async (connId: string) => {
    if (!user) return;
    setActionLoadingId(connId);
    try {
      await updateConnectionStatus(connId, 'accepted', user.id);
      success('Connection request accepted! You are now campus friends.', 'Friend Connected');
      await refreshUser();
      await loadData();
    } catch (err: any) {
      toastError(err?.message || 'Could not accept connection request. Please try again.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDecline = async (connId: string) => {
    if (!user) return;
    setActionLoadingId(connId);
    try {
      await updateConnectionStatus(connId, 'rejected', user.id);
      success('Connection request declined.', 'Request Declined');
      await loadData();
    } catch (err: any) {
      toastError(err?.message || 'Could not decline request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelRequest = async (connId: string) => {
    if (!user) return;
    setActionLoadingId(connId);
    try {
      await cancelConnectionRequest(connId, user.id);
      success('Connection request withdrawn.', 'Request Cancelled');
      await loadData();
    } catch (err: any) {
      toastError(err?.message || 'Could not cancel connection request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmUnfriend = async () => {
    if (!user || !unfriendTarget) return;
    setUnfriendLoading(true);
    try {
      await removeConnection(unfriendTarget.connId, user.id);
      success(`Removed ${unfriendTarget.user.displayName} from your friends.`, 'Friend Removed');
      setUnfriendTarget(null);
      await refreshUser();
      await loadData();
    } catch (err: any) {
      toastError(err?.message || 'Could not remove connection.');
    } finally {
      setUnfriendLoading(false);
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

  // Filtered lists based on search query
  const query = searchQuery.trim().toLowerCase();

  const filteredAccepted = acceptedConns.filter(conn => {
    const otherId = conn.requesterId === user.id ? conn.recipientId : conn.requesterId;
    const otherUser = usersMap[otherId];
    if (!otherUser) return true;
    if (!query) return true;
    return (
      otherUser.displayName.toLowerCase().includes(query) ||
      (otherUser.department && otherUser.department.toLowerCase().includes(query)) ||
      (otherUser.rollNumber && otherUser.rollNumber.toLowerCase().includes(query)) ||
      (otherUser.year && otherUser.year.toLowerCase().includes(query)) ||
      (otherUser.skills && otherUser.skills.some(s => s.toLowerCase().includes(query)))
    );
  });

  const filteredReceived = receivedRequests.filter(conn => {
    const requester = usersMap[conn.requesterId];
    if (!requester) return true;
    if (!query) return true;
    return (
      requester.displayName.toLowerCase().includes(query) ||
      (requester.department && requester.department.toLowerCase().includes(query)) ||
      (requester.rollNumber && requester.rollNumber.toLowerCase().includes(query))
    );
  });

  const filteredSent = sentRequests.filter(conn => {
    const recipient = usersMap[conn.recipientId];
    if (!recipient) return true;
    if (!query) return true;
    return (
      recipient.displayName.toLowerCase().includes(query) ||
      (recipient.department && recipient.department.toLowerCase().includes(query)) ||
      (recipient.rollNumber && recipient.rollNumber.toLowerCase().includes(query))
    );
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* 1. Header Banner & Interactive Filter Metrics */}
      <div className="bg-white dark:bg-[#111d15] rounded-3xl border border-gray-200/80 dark:border-[#1e3325] p-5 sm:p-7 shadow-card transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0b4627]/10 dark:bg-emerald-950/60 text-[#0b4627] dark:text-emerald-400 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                Campus Connections
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Connect, chat, and collaborate with your peers and branch mates at EATM
              </p>
            </div>
          </div>

          <Link to="/student/discover">
            <Button variant="primary" size="sm" icon={<Users className="w-4 h-4" />}>
              Discover Students
            </Button>
          </Link>
        </div>

        {/* Interactive Filter Metric Boxes: Friends, Received, Sent */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-5 border-t border-gray-100 dark:border-[#1e3325]">
          <button 
            type="button"
            onClick={() => setActiveTab('all')}
            className={`text-left rounded-2xl p-3.5 sm:p-4 border transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500/80 dark:border-emerald-600 shadow-xs'
                : 'bg-gray-50/70 dark:bg-[#16251c]/60 border-gray-200/70 dark:border-[#1e3325] hover:border-emerald-300 dark:hover:border-emerald-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 ${
                activeTab === 'all' ? 'text-emerald-800 dark:text-emerald-300' : 'text-gray-500 dark:text-gray-400'
              }`}>
                <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Friends
              </span>
              <span className={`text-base sm:text-xl font-black ${
                activeTab === 'all' ? 'text-[#0b4627] dark:text-emerald-400' : 'text-gray-900 dark:text-gray-100'
              }`}>
                {acceptedConns.length}
              </span>
            </div>
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('received')}
            className={`text-left rounded-2xl p-3.5 sm:p-4 border transition-all cursor-pointer ${
              activeTab === 'received'
                ? 'bg-amber-50/80 dark:bg-amber-950/50 border-amber-500/80 dark:border-amber-600 shadow-xs'
                : 'bg-gray-50/70 dark:bg-[#16251c]/60 border-gray-200/70 dark:border-[#1e3325] hover:border-amber-300 dark:hover:border-amber-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 ${
                activeTab === 'received' ? 'text-amber-800 dark:text-amber-300' : 'text-gray-500 dark:text-gray-400'
              }`}>
                <UserPlus className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                Received
              </span>
              <span className={`text-base sm:text-xl font-black ${
                receivedRequests.length > 0 
                  ? 'text-amber-600 dark:text-amber-400' 
                  : activeTab === 'received' ? 'text-amber-700 dark:text-amber-300' : 'text-gray-900 dark:text-gray-100'
              }`}>
                {receivedRequests.length}
              </span>
            </div>
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('sent')}
            className={`text-left rounded-2xl p-3.5 sm:p-4 border transition-all cursor-pointer ${
              activeTab === 'sent'
                ? 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-500/80 dark:border-blue-600 shadow-xs'
                : 'bg-gray-50/70 dark:bg-[#16251c]/60 border-gray-200/70 dark:border-[#1e3325] hover:border-blue-300 dark:hover:border-blue-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 ${
                activeTab === 'sent' ? 'text-blue-800 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'
              }`}>
                <Send className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                Sent
              </span>
              <span className={`text-base sm:text-xl font-black ${
                activeTab === 'sent' ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'
              }`}>
                {sentRequests.length}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Section Header & Live Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            {activeTab === 'all' && <span>Connected Friends ({filteredAccepted.length})</span>}
            {activeTab === 'received' && <span>Pending Requests Received ({filteredReceived.length})</span>}
            {activeTab === 'sent' && <span>Pending Requests Sent ({filteredSent.length})</span>}
          </h2>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'all'
                ? 'Search friends...'
                : activeTab === 'received'
                ? 'Search received requests...'
                : 'Search sent requests...'
            }
            className="w-full pl-9 pr-8 py-2 bg-white dark:bg-[#111d15] border border-gray-200 dark:border-[#1e3325] rounded-2xl text-xs sm:text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0b4627]/30 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Error Banner */}
      {errorMsg && (
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 rounded-2xl p-4 flex items-center justify-between gap-3 text-red-700 dark:text-red-300 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadData}>
            Retry
          </Button>
        </div>
      )}

      {/* 4. Main Lists / Skeleton States */}
      <div className="space-y-3">
        {loading ? (
          // Loading Skeletons
          <div className="space-y-3">
            {[1, 2, 3, 4].map(idx => (
              <div
                key={idx}
                className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/80 dark:border-[#1e3325] p-4 flex items-center justify-between gap-4 animate-pulse"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-[#1e3325]" />
                  <div className="space-y-1.5">
                    <div className="w-32 h-4 bg-gray-200 dark:bg-[#1e3325] rounded" />
                    <div className="w-24 h-3 bg-gray-100 dark:bg-[#16251c] rounded" />
                  </div>
                </div>
                <div className="w-20 h-8 bg-gray-200 dark:bg-[#1e3325] rounded-xl" />
              </div>
            ))}
          </div>
        ) : activeTab === 'all' && (
          filteredAccepted.length === 0 ? (
            <div className="bg-white dark:bg-[#111d15] rounded-3xl p-12 text-center text-gray-500 dark:text-gray-400 border border-gray-200/80 dark:border-[#1e3325]">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-[#0b4627] dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <Users className="w-7 h-7" />
              </div>
              <p className="font-bold text-base text-gray-900 dark:text-gray-100">
                {searchQuery ? 'No matching friends found' : 'No campus friends connected yet'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? `No friends matched "${searchQuery}". Try a different keyword.`
                  : 'Head to the Discover page to connect with classmates, branch seniors, and faculty!'}
              </p>
              {!searchQuery && (
                <Link to="/student/discover" className="inline-block mt-4">
                  <Button variant="outline" size="sm" icon={<Users className="w-3.5 h-3.5" />}>
                    Find Classmates
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            filteredAccepted.map(conn => {
              const otherId = conn.requesterId === user.id ? conn.recipientId : conn.requesterId;
              const otherUser = usersMap[otherId];
              if (!otherUser) return null;

              const isOnline = isUserOnline(otherId);

              return (
                <div
                  key={conn.id}
                  className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/80 dark:border-[#1e3325] p-4 shadow-card hover:border-emerald-300 dark:hover:border-emerald-800 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Link to={`/student/profile/${otherId}`} className="shrink-0 group">
                      <Avatar
                        src={otherUser.photoURL}
                        name={otherUser.displayName}
                        size="md"
                        online={isOnline ? true : undefined}
                      />
                    </Link>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Link
                          to={`/student/profile/${otherId}`}
                          className="font-bold text-sm text-gray-900 dark:text-gray-100 hover:text-[#0b4627] dark:hover:text-emerald-400 transition truncate"
                        >
                          {otherUser.displayName}
                        </Link>
                        {otherUser.verified && (
                          <span title="Verified Student">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          </span>
                        )}
                        {isOnline && (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded-full">
                            Online
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3 h-3 text-gray-400" />
                          {otherUser.department || 'General'}
                        </span>
                        {otherUser.year && <span>• {otherUser.year}</span>}
                        {otherUser.rollNumber && <span className="font-mono text-[11px] opacity-75">• {otherUser.rollNumber}</span>}
                      </div>

                      {otherUser.skills && otherUser.skills.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {otherUser.skills.slice(0, 3).map((skill, sIdx) => (
                            <span
                              key={sIdx}
                              className="text-[10px] font-medium bg-gray-100 dark:bg-[#16251c] text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-md border border-gray-200/50 dark:border-[#1e3325]"
                            >
                              {skill}
                            </span>
                          ))}
                          {otherUser.skills.length > 3 && (
                            <span className="text-[10px] text-gray-400">+{otherUser.skills.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStartChat(otherId)}
                      icon={<MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                    >
                      Message
                    </Button>
                    <Link to={`/student/profile/${otherId}`}>
                      <Button variant="ghost" size="sm" icon={<ExternalLink className="w-3.5 h-3.5 text-gray-400" />} title="View Profile" />
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUnfriendTarget({ connId: conn.id, user: otherUser })}
                      icon={<UserX className="w-3.5 h-3.5 text-gray-400 hover:text-red-500 transition-colors" />}
                      title="Remove Friend"
                    />
                  </div>
                </div>
              );
            })
          )
        )}

        {!loading && activeTab === 'received' && (
          filteredReceived.length === 0 ? (
            <div className="bg-white dark:bg-[#111d15] rounded-3xl p-12 text-center text-gray-500 dark:text-gray-400 border border-gray-200/80 dark:border-[#1e3325]">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
                <UserPlus className="w-7 h-7" />
              </div>
              <p className="font-bold text-base text-gray-900 dark:text-gray-100">
                {searchQuery ? 'No matching requests' : 'No pending connection requests'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-sm mx-auto">
                When students want to connect with you, their requests will appear here with instant accept/decline actions.
              </p>
            </div>
          ) : (
            filteredReceived.map(conn => {
              const requester = usersMap[conn.requesterId];
              if (!requester) return null;
              const isActioning = actionLoadingId === conn.id;

              return (
                <div
                  key={conn.id}
                  className="bg-white dark:bg-[#111d15] rounded-2xl border border-emerald-100 dark:border-[#1e3325] p-4 shadow-card hover:border-emerald-300 dark:hover:border-emerald-800 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Link to={`/student/profile/${conn.requesterId}`} className="shrink-0">
                      <Avatar src={requester.photoURL} name={requester.displayName} size="md" />
                    </Link>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Link
                          to={`/student/profile/${conn.requesterId}`}
                          className="font-bold text-sm text-gray-900 dark:text-gray-100 hover:text-[#0b4627] dark:hover:text-emerald-400 transition truncate"
                        >
                          {requester.displayName}
                        </Link>
                        {requester.verified && (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {requester.department} • {requester.year || 'Student'}
                        {requester.rollNumber && ` • ${requester.rollNumber}`}
                      </p>
                      {conn.createdAt && (
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Sent {new Date(conn.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
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
                      onClick={() => handleDecline(conn.id)}
                      icon={<X className="w-3.5 h-3.5" />}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              );
            })
          )
        )}

        {!loading && activeTab === 'sent' && (
          filteredSent.length === 0 ? (
            <div className="bg-white dark:bg-[#111d15] rounded-3xl p-12 text-center text-gray-500 dark:text-gray-400 border border-gray-200/80 dark:border-[#1e3325]">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
                <Send className="w-7 h-7" />
              </div>
              <p className="font-bold text-base text-gray-900 dark:text-gray-100">
                {searchQuery ? 'No matching sent requests' : 'No sent requests pending'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-sm mx-auto">
                Explore campus peers on Discover and send connection requests to collaborate.
              </p>
              {!searchQuery && (
                <Link to="/student/discover" className="inline-block mt-4">
                  <Button variant="outline" size="sm">
                    Find Classmates
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            filteredSent.map(conn => {
              const recipient = usersMap[conn.recipientId];
              if (!recipient) return null;
              const isActioning = actionLoadingId === conn.id;

              return (
                <div
                  key={conn.id}
                  className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/80 dark:border-[#1e3325] p-4 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Link to={`/student/profile/${conn.recipientId}`} className="shrink-0">
                      <Avatar src={recipient.photoURL} name={recipient.displayName} size="md" />
                    </Link>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Link
                          to={`/student/profile/${conn.recipientId}`}
                          className="font-bold text-sm text-gray-900 dark:text-gray-100 hover:text-[#0b4627] dark:hover:text-emerald-400 transition truncate"
                        >
                          {recipient.displayName}
                        </Link>
                        {recipient.verified && (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {recipient.department} • {recipient.year || 'Student'}
                        {recipient.rollNumber && ` • ${recipient.rollNumber}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <span className="text-xs font-semibold px-3 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-full border border-amber-200/70 dark:border-amber-800/60 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      <span>Pending Approval</span>
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isActioning}
                      onClick={() => handleCancelRequest(conn.id)}
                      icon={isActioning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                      className="text-gray-500 hover:text-red-600 hover:border-red-200"
                    >
                      Cancel Request
                    </Button>
                  </div>
                </div>
              );
            })
          )
        )}
      </div>

      {/* 5. Unfriend Confirmation Modal */}
      {unfriendTarget && (
        <Modal
          isOpen={true}
          onClose={() => !unfriendLoading && setUnfriendTarget(null)}
          title="Remove Connection"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#16251c] rounded-2xl border border-gray-100 dark:border-[#1e3325]">
              <Avatar src={unfriendTarget.user.photoURL} name={unfriendTarget.user.displayName} size="md" />
              <div>
                <p className="font-bold text-sm text-gray-900 dark:text-gray-100">{unfriendTarget.user.displayName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{unfriendTarget.user.department}</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Are you sure you want to remove <strong>{unfriendTarget.user.displayName}</strong> from your campus connections? You will need to send a new connection request to reconnect.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={unfriendLoading}
                onClick={() => setUnfriendTarget(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={unfriendLoading}
                onClick={handleConfirmUnfriend}
                icon={unfriendLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
              >
                {unfriendLoading ? 'Removing...' : 'Remove Friend'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
