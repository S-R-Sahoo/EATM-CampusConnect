import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { 
  fetchUsers, fetchConnections, sendConnectionRequest, 
  getOrCreateConversation, subscribeToConnections 
} from '../../supabase/db';
import { UserProfile, Connection } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { Tabs } from '../../components/ui/Tabs';
import { Search, UserPlus, Check, Clock, MessageSquare, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';

export const DiscoverPeople: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedDept, setSelectedDept] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const departments = [
    { id: 'All', label: 'All' },
    { id: 'CSE', label: 'CSE' },
    { id: 'ECE', label: 'ECE' },
    { id: 'EEE', label: 'EEE' },
    { id: 'Mechanical', label: 'Mech' },
    { id: 'Civil', label: 'Civil' },
  ];

  const loadData = async () => {
    try {
      const [allUsers, allConns] = await Promise.all([
        fetchUsers(),
        user ? fetchConnections(user.id) : Promise.resolve([])
      ]);
      // Filter out self
      setUsers(allUsers.filter(u => u.id !== user?.id && u.role === 'student'));
      setConnections(allConns);
    } catch (err) {
      console.error('Failed to load discover data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    if (!user) return;
    const unsub = subscribeToConnections(user.id, () => {
      loadData();
    });

    return () => {
      unsub();
    };
  }, [user]);

  const getConnectionInfo = (targetId: string): { status: 'none' | 'pending_sent' | 'pending_received' | 'connected'; conn?: Connection } => {
    const conn = connections.find(c =>
      (c.requesterId === user?.id && c.recipientId === targetId) ||
      (c.requesterId === targetId && c.recipientId === user?.id)
    );
    if (!conn) return { status: 'none' };
    if (conn.status === 'accepted') return { status: 'connected', conn };
    if (conn.requesterId === user?.id) return { status: 'pending_sent', conn };
    return { status: 'pending_received', conn };
  };

  const handleConnect = async (targetUser: UserProfile) => {
    if (!user) return;
    setConnectingId(targetUser.id);
    try {
      const newConn = await sendConnectionRequest(user.id, targetUser.id);
      setConnections(prev => [...prev.filter(c => c.id !== newConn.id), newConn]);
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 } });
      success(`Connection request sent to ${targetUser.displayName}!`, 'Request Sent');
    } catch (err: any) {
      toastError('Could not send connection request. Please try again.');
    } finally {
      setConnectingId(null);
    }
  };

  const handleStartChat = async (targetUserId: string) => {
    if (!user) return;
    try {
      const conv = await getOrCreateConversation(user.id, targetUserId);
      navigate('/student/messages', { state: { conversationId: conv.id } });
    } catch (err) {
      navigate('/student/messages');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesDept = selectedDept === 'All' || u.department.toLowerCase().includes(selectedDept.toLowerCase());
    const q = searchQuery.toLowerCase();
    const matchesQuery = !q ||
      u.displayName.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q) ||
      (u.skills && u.skills.some(s => s.toLowerCase().includes(q)));
    return matchesDept && matchesQuery;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Controls */}
      <div className="bg-white dark:bg-[#111d15] rounded-3xl border border-gray-200/80 dark:border-[#1e3325] p-6 shadow-card space-y-4 transition-colors">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Discover Campus Students</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Connect with students, branch mates, and research collaborators across EATM
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, department, skills..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#16251c] border border-gray-200 dark:border-[#1e3325] rounded-xl text-xs sm:text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0b4627] focus:bg-white dark:focus:bg-[#16251c] transition"
          />
        </div>

        {/* Department Filter Pills */}
        <Tabs
          tabs={departments}
          activeTab={selectedDept}
          onChange={setSelectedDept}
          variant="pills"
        />
      </div>

      {/* Student Cards List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white dark:bg-[#111d15] rounded-3xl p-12 text-center text-gray-400 border border-gray-200 dark:border-[#1e3325]">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
            <p className="text-xs">Finding students across EATM campus...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white dark:bg-[#111d15] rounded-3xl p-12 text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#1e3325]">
            <p className="font-semibold text-sm">No students found matching your criteria</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try switching departments or adjusting your search term.</p>
          </div>
        ) : (
          filteredUsers.map(student => {
            const { status } = getConnectionInfo(student.id);
            const isConnecting = connectingId === student.id;

            return (
              <div
                key={student.id}
                className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/80 dark:border-[#1e3325] p-4 sm:p-5 shadow-card hover:border-emerald-200 dark:hover:border-emerald-800 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <Avatar
                    src={student.photoURL}
                    name={student.displayName}
                    size="lg"
                    online={true}
                  />
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate">
                      {student.displayName}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
                      {student.department} • {student.year || 'Student'}
                    </p>

                    {/* Skill Badges */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {student.skills?.slice(0, 4).map(skill => (
                        <span
                          key={skill}
                          className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 dark:bg-[#1e3325] text-gray-700 dark:text-gray-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Connection Status / Action Buttons */}
                <div className="sm:self-center shrink-0">
                  {status === 'connected' ? (
                    <div className="flex items-center gap-2">
                      <span className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60 flex items-center justify-center gap-1.5 cursor-default">
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Connected</span>
                      </span>
                      <button
                        onClick={() => handleStartChat(student.id)}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0b4627] hover:bg-[#0f5132] text-white shadow-sm flex items-center justify-center gap-1.5 transition active:scale-95"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Message</span>
                      </button>
                    </div>
                  ) : status === 'pending_received' ? (
                    <Link
                      to="/student/connections"
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center justify-center gap-1.5 transition active:scale-95"
                    >
                      <span>Respond</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : status === 'pending_sent' ? (
                    <button
                      disabled
                      className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60 flex items-center justify-center gap-1.5 cursor-default"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Pending Approval</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnect(student)}
                      disabled={isConnecting}
                      className="w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-bold bg-[#0b4627] hover:bg-[#0f5132] text-white shadow-sm flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Connect</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
