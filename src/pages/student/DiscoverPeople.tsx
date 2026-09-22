import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { 
  fetchUsers, fetchConnections, sendConnectionRequest, 
  getOrCreateConversation, subscribeToConnections 
} from '../../supabase/db';
import { UserProfile, Connection } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { 
  Search, UserPlus, Clock, MessageSquare, ArrowRight, 
  Loader2, Building2, X, RotateCcw, ChevronDown, UserCheck, Users 
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';

const DEPARTMENTS = [
  { id: 'All', label: 'All Departments' },
  { id: 'CSE', label: 'Computer Science (CSE)' },
  { id: 'CSE-DS', label: 'Data Science (CSE-DS)' },
  { id: 'ECE', label: 'Electronics (ECE)' },
  { id: 'EEE', label: 'Electrical (EEE)' },
  { id: 'Mechanical', label: 'Mechanical (ME)' },
  { id: 'Civil', label: 'Civil (CE)' },
];

export const DiscoverPeople: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');

  const loadData = async () => {
    try {
      const [allUsers, allConns] = await Promise.all([
        fetchUsers(),
        user ? fetchConnections(user.id) : Promise.resolve([])
      ]);
      // Filter out self and only show students
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

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesDept = 
        selectedDept === 'All' || 
        (u.department && u.department.toLowerCase().includes(selectedDept.toLowerCase()));

      const q = searchQuery.trim().toLowerCase();
      const matchesQuery = !q ||
        u.displayName.toLowerCase().includes(q) ||
        (u.department && u.department.toLowerCase().includes(q)) ||
        (u.rollNumber && u.rollNumber.toLowerCase().includes(q)) ||
        (u.bio && u.bio.toLowerCase().includes(q)) ||
        (u.skills && u.skills.some(s => s.toLowerCase().includes(q)));

      return matchesDept && matchesQuery;
    });
  }, [users, selectedDept, searchQuery]);

  const resetFilters = () => {
    setSelectedDept('All');
    setSearchQuery('');
  };

  const isFiltered = selectedDept !== 'All' || searchQuery.trim().length > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5">
      {/* Header & Filter Card */}
      <div className="bg-white dark:bg-[#111d15] rounded-2xl sm:rounded-3xl border border-gray-200/80 dark:border-[#1e3325] p-4 sm:p-6 shadow-card space-y-3.5 transition-colors">
        
        {/* Title */}
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2 tracking-tight">
            <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Discover Campus Students</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Connect with students, branch mates, and peers across EATM
          </p>
        </div>

        {/* Search & Department Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, branch, skills..."
              className="w-full pl-10 pr-9 py-2.5 bg-gray-50 dark:bg-[#16251c] border border-gray-200 dark:border-[#1e3325] rounded-xl text-xs sm:text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0b4627] dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-[#16251c] transition"
            />
            {searchQuery.length > 0 && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5 rounded-full"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Clean Department Dropdown Filter */}
          <div className="relative w-full sm:w-60 md:w-64">
            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600 dark:text-emerald-400 pointer-events-none" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-gray-50 dark:bg-[#16251c] border border-gray-200 dark:border-[#1e3325] hover:border-emerald-500/60 dark:hover:border-emerald-500/60 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0b4627] dark:focus:ring-emerald-500 transition cursor-pointer appearance-none truncate"
            >
              {DEPARTMENTS.map(d => (
                <option key={d.id} value={d.id} className="bg-white dark:bg-[#16251c] text-gray-900 dark:text-gray-100 py-1">
                  {d.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Clean Results & Reset Bar */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-1">
          <span>
            Showing <strong className="text-gray-900 dark:text-gray-100 font-bold">{filteredUsers.length}</strong> {filteredUsers.length === 1 ? 'student' : 'students'}
            {selectedDept !== 'All' && (
              <span> in <strong className="text-emerald-700 dark:text-emerald-400">{selectedDept}</strong></span>
            )}
          </span>

          {isFiltered && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset filter</span>
            </button>
          )}
        </div>
      </div>

      {/* Student Cards List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white dark:bg-[#111d15] rounded-2xl sm:rounded-3xl p-10 text-center text-gray-400 border border-gray-200 dark:border-[#1e3325]">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
            <p className="text-xs font-medium">Finding students...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white dark:bg-[#111d15] rounded-2xl sm:rounded-3xl p-10 text-center border border-gray-200 dark:border-[#1e3325] space-y-3">
            <Users className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto" />
            <div>
              <p className="font-bold text-sm text-gray-800 dark:text-gray-200">No students found</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Try selecting All Departments or clearing your search term.
              </p>
            </div>
            {isFiltered && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#0b4627] hover:bg-[#0f5132] text-white transition active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Show All Students</span>
              </button>
            )}
          </div>
        ) : (
          filteredUsers.map(student => {
            const { status } = getConnectionInfo(student.id);
            const isConnecting = connectingId === student.id;

            return (
              <div
                key={student.id}
                className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/80 dark:border-[#1e3325] p-4 sm:p-5 shadow-card hover:border-emerald-300/80 dark:hover:border-emerald-800 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Student Identity Link */}
                <Link
                  to={`/student/profile/${student.id}`}
                  className="flex items-start sm:items-center gap-3.5 min-w-0 group/student hover:opacity-95 transition"
                  title="View Student Profile"
                >
                  <Avatar
                    src={student.photoURL}
                    name={student.displayName}
                    size="lg"
                    online={true}
                  />
                  <div className="min-w-0">
                    {/* Name & Official Verified Student Tick */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100 group-hover/student:text-[#0b4627] dark:group-hover/student:text-emerald-400 transition-colors truncate">
                        {student.displayName}
                      </h3>
                      {student.verified !== false && (
                        <span 
                          title="Official Verified Student" 
                          className="inline-flex items-center shrink-0 cursor-default"
                        >
                          <svg 
                            className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-emerald-600 dark:text-emerald-400 drop-shadow-2xs" 
                            viewBox="0 0 24 24" 
                            fill="currentColor"
                          >
                            <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.79-4-4-4-.495 0-.965.084-1.4.238C14.45 2.475 13.08 1.6 11.5 1.6s-2.95.875-3.6 2.148c-.435-.154-.905-.238-1.4-.238-2.21 0-4 1.79-4 4 0 .495.084.965.238 1.4C1.475 9.55.6 10.92.6 12.5s.875 2.95 2.148 3.6c-.154.435-.238.905-.238 1.4 0 2.21 1.79 4 4 4 .495 0 .965-.084 1.4-.238 1.15 1.273 2.52 2.148 4.1 2.148s2.95-.875 3.6-2.148c.435.154.905.238 1.4.238 2.21 0 4-1.79 4-4 0-.495-.084-.965-.238-1.4 1.273-1.15 2.148-2.52 2.148-4.1z" />
                            <path d="M10.2 16.2l-3.5-3.5 1.4-1.4 2.1 2.1 5.3-5.3 1.4 1.4-6.7 6.7z" fill="#ffffff" />
                          </svg>
                        </span>
                      )}
                    </div>

                    {/* Academic Credentials Row */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {student.department}
                      </span>
                      <span>•</span>
                      <span>{student.year || 'Student'}</span>
                      {student.rollNumber && (
                        <>
                          <span>•</span>
                          <span className="text-[11px] font-mono text-gray-400 dark:text-gray-500">
                            {student.rollNumber}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Bio snippet if available */}
                    {student.bio && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mt-1 font-normal">
                        {student.bio}
                      </p>
                    )}

                    {/* Skill Badges */}
                    {student.skills && student.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {student.skills.slice(0, 4).map(skill => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 dark:bg-[#1e3325] text-gray-700 dark:text-gray-300 border border-gray-200/60 dark:border-[#2a4533]"
                          >
                            {skill}
                          </span>
                        ))}
                        {student.skills.length > 4 && (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium text-gray-400 dark:text-gray-500">
                            +{student.skills.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>

                {/* Connection Status / Official Social Media Action Buttons */}
                <div className="sm:self-center shrink-0">
                  {status === 'connected' ? (
                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/40 dark:border-emerald-500/30 select-none">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.2]" />
                        <span>Connected</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleStartChat(student.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-[#0b4627] via-[#0d4f2c] to-[#0b4627] hover:from-[#08351d] hover:to-[#093d22] text-white shadow-2xs active:scale-95 transition-all cursor-pointer border border-emerald-600/30"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-200 fill-emerald-200/20" />
                        <span>Message</span>
                      </button>
                    </div>
                  ) : status === 'pending_received' ? (
                    <Link
                      to="/student/connections"
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs active:scale-95 transition cursor-pointer"
                    >
                      <span>Respond</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </Link>
                  ) : status === 'pending_sent' ? (
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/40 dark:border-amber-500/30 select-none">
                      <Clock className="w-3.5 h-3.5 stroke-[2.2]" />
                      <span>Pending</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleConnect(student)}
                      disabled={isConnecting}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-[#0b4627] via-[#0d4f2c] to-[#0b4627] hover:from-[#08351d] hover:to-[#093d22] text-white shadow-2xs active:scale-95 transition-all cursor-pointer disabled:opacity-50 border border-emerald-600/30"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-200" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5 text-emerald-200" />
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
