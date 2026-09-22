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
  Loader2, Building2, GraduationCap, SlidersHorizontal, X, 
  RotateCcw, ChevronDown, UserCheck, Users 
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';

const DEPARTMENTS = [
  { id: 'All', label: 'All Departments (Campus-wide)' },
  { id: 'CSE', label: 'Computer Science & Engineering (CSE)' },
  { id: 'CSE-DS', label: 'CSE - Data Science (CSE-DS)' },
  { id: 'ECE', label: 'Electronics & Communication (ECE)' },
  { id: 'EEE', label: 'Electrical & Electronics (EEE)' },
  { id: 'Mechanical', label: 'Mechanical Engineering (ME)' },
  { id: 'Civil', label: 'Civil Engineering (CE)' },
];

const YEARS = [
  { id: 'All', label: 'All Academic Years' },
  { id: '1st Year', label: '1st Year' },
  { id: '2nd Year', label: '2nd Year' },
  { id: '3rd Year', label: '3rd Year' },
  { id: '4th Year', label: '4th Year' },
];

const STATUS_OPTIONS = [
  { id: 'all', label: 'All Relationships' },
  { id: 'not_connected', label: 'Not Connected' },
  { id: 'connected', label: 'Connected Friends' },
  { id: 'pending', label: 'Pending Requests' },
];

export const DiscoverPeople: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

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

  // Filtered students computation
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      // 1. Department match
      const matchesDept = 
        selectedDept === 'All' || 
        (u.department && u.department.toLowerCase().includes(selectedDept.toLowerCase()));

      // 2. Year match
      const matchesYear = 
        selectedYear === 'All' || 
        (u.year && u.year.toLowerCase().includes(selectedYear.toLowerCase()));

      // 3. Status match
      const { status } = getConnectionInfo(u.id);
      const matchesStatus = 
        selectedStatus === 'all' ||
        (selectedStatus === 'connected' && status === 'connected') ||
        (selectedStatus === 'pending' && (status === 'pending_sent' || status === 'pending_received')) ||
        (selectedStatus === 'not_connected' && status === 'none');

      // 4. Query match
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery = !q ||
        u.displayName.toLowerCase().includes(q) ||
        (u.department && u.department.toLowerCase().includes(q)) ||
        (u.rollNumber && u.rollNumber.toLowerCase().includes(q)) ||
        (u.bio && u.bio.toLowerCase().includes(q)) ||
        (u.skills && u.skills.some(s => s.toLowerCase().includes(q))) ||
        (u.interests && u.interests.some(i => i.toLowerCase().includes(q)));

      return matchesDept && matchesYear && matchesStatus && matchesQuery;
    });
  }, [users, connections, selectedDept, selectedYear, selectedStatus, searchQuery, user]);

  const activeFiltersCount = 
    (selectedDept !== 'All' ? 1 : 0) + 
    (selectedYear !== 'All' ? 1 : 0) + 
    (selectedStatus !== 'all' ? 1 : 0);

  const hasAnyFilterActive = activeFiltersCount > 0 || searchQuery.trim().length > 0;

  const resetAllFilters = () => {
    setSelectedDept('All');
    setSelectedYear('All');
    setSelectedStatus('all');
    setSearchQuery('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Official Directory Header & Filter Center */}
      <div className="bg-white dark:bg-[#111d15] rounded-3xl border border-gray-200/80 dark:border-[#1e3325] p-5 sm:p-6 shadow-card space-y-4 transition-colors">
        
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2 tracking-tight">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" />
              <span>Discover Campus Students</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
              Official student directory, batchmates, and research collaborators across EATM
            </p>
          </div>

          {/* Student Population Counter Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold shrink-0 self-start sm:self-center">
            <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{users.length} Students</span>
          </div>
        </div>

        {/* Search & Main Department Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, branch, skills, or roll no..."
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

          {/* Official Department Dropdown */}
          <div className="relative w-full sm:w-64 md:w-72">
            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600 dark:text-emerald-400 pointer-events-none" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-gray-50 dark:bg-[#16251c] border border-gray-200 dark:border-[#1e3325] hover:border-emerald-500/50 dark:hover:border-emerald-500/50 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0b4627] dark:focus:ring-emerald-500 transition cursor-pointer appearance-none truncate"
            >
              {DEPARTMENTS.map(d => (
                <option key={d.id} value={d.id} className="bg-white dark:bg-[#16251c] text-gray-900 dark:text-gray-100 py-1">
                  {d.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Secondary Filters Toggle Button */}
          <button
            type="button"
            onClick={() => setShowAdvancedFilters(prev => !prev)}
            className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition active:scale-95 cursor-pointer shrink-0 ${
              showAdvancedFilters || (selectedYear !== 'All' || selectedStatus !== 'all')
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#0b4627] dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60 shadow-2xs'
                : 'bg-gray-50 dark:bg-[#16251c] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#1e3325] hover:bg-gray-100 dark:hover:bg-[#1c3024]'
            }`}
            title="Filter by Academic Year and Connection Status"
          >
            <SlidersHorizontal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Filters</span>
            {(selectedYear !== 'All' || selectedStatus !== 'all') && (
              <span className="w-5 h-5 rounded-full bg-[#0b4627] text-white text-[10px] font-bold flex items-center justify-center">
                {(selectedYear !== 'All' ? 1 : 0) + (selectedStatus !== 'all' ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* Secondary Filter Panel (Year & Connection Status) */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-gray-100 dark:border-[#1e3325] grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fadeIn">
            
            {/* Academic Year Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Academic Year / Cohort</span>
              </label>
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full pl-3.5 pr-8 py-2 bg-gray-50 dark:bg-[#16251c] border border-gray-200 dark:border-[#1e3325] rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0b4627] appearance-none cursor-pointer"
                >
                  {YEARS.map(y => (
                    <option key={y.id} value={y.id} className="bg-white dark:bg-[#16251c] text-gray-900 dark:text-gray-100">
                      {y.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Connection Status Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Relationship Status</span>
              </label>
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full pl-3.5 pr-8 py-2 bg-gray-50 dark:bg-[#16251c] border border-gray-200 dark:border-[#1e3325] rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0b4627] appearance-none cursor-pointer"
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s.id} value={s.id} className="bg-white dark:bg-[#16251c] text-gray-900 dark:text-gray-100">
                      {s.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {/* Active Filter Chips & Summary Bar */}
        {hasAnyFilterActive && (
          <div className="pt-3 border-t border-gray-100 dark:border-[#1e3325] flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-gray-400 dark:text-gray-500 font-semibold text-[11px] mr-0.5">Active Filters:</span>
              
              {selectedDept !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100/90 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800/60">
                  <span>Branch: {selectedDept}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedDept('All')}
                    className="hover:text-emerald-700 dark:hover:text-emerald-100 cursor-pointer"
                    title="Remove Department filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedYear !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100/90 dark:bg-blue-950/70 text-blue-900 dark:text-blue-300 border border-blue-300/60 dark:border-blue-800/60">
                  <span>Batch: {selectedYear}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedYear('All')}
                    className="hover:text-blue-700 dark:hover:text-blue-100 cursor-pointer"
                    title="Remove Year filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedStatus !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100/90 dark:bg-purple-950/70 text-purple-900 dark:text-purple-300 border border-purple-300/60 dark:border-purple-800/60">
                  <span>Status: {STATUS_OPTIONS.find(s => s.id === selectedStatus)?.label}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedStatus('all')}
                    className="hover:text-purple-700 dark:hover:text-purple-100 cursor-pointer"
                    title="Remove Status filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {searchQuery.trim().length > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-200/90 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300/60 dark:border-gray-700">
                  <span>Query: "{searchQuery}"</span>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="hover:text-gray-900 dark:hover:text-white cursor-pointer"
                    title="Clear search query"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 ml-1 cursor-pointer transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset All</span>
              </button>
            </div>

            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Showing <strong className="text-gray-900 dark:text-gray-100 font-bold">{filteredUsers.length}</strong> of {users.length} students
            </div>
          </div>
        )}
      </div>

      {/* Student Cards List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white dark:bg-[#111d15] rounded-3xl p-12 text-center text-gray-400 border border-gray-200 dark:border-[#1e3325]">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
            <p className="text-xs font-medium">Finding students across EATM campus directory...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white dark:bg-[#111d15] rounded-3xl p-12 text-center border border-gray-200 dark:border-[#1e3325] space-y-3">
            <Users className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto" />
            <div>
              <p className="font-bold text-sm text-gray-800 dark:text-gray-200">No students match your filter criteria</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Try selecting a different department, academic year, or clearing your search term.
              </p>
            </div>
            {hasAnyFilterActive && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0b4627] hover:bg-[#0f5132] text-white shadow-2xs transition active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
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
                      <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-full text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/40 dark:border-emerald-500/30 shadow-2xs select-none">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.2]" />
                        <span>Connected</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleStartChat(student.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-[#0b4627] via-[#0d4f2c] to-[#0b4627] hover:from-[#08351d] hover:to-[#093d22] text-white shadow-2xs hover:shadow-xs active:scale-95 transition-all cursor-pointer border border-emerald-600/30"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-200 fill-emerald-200/20" />
                        <span>Message</span>
                      </button>
                    </div>
                  ) : status === 'pending_received' ? (
                    <Link
                      to="/student/connections"
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 sm:py-2 rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs active:scale-95 transition cursor-pointer"
                    >
                      <span>Respond</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </Link>
                  ) : status === 'pending_sent' ? (
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-full text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/40 dark:border-amber-500/30 shadow-2xs select-none">
                      <Clock className="w-3.5 h-3.5 stroke-[2.2]" />
                      <span>Pending Approval</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleConnect(student)}
                      disabled={isConnecting}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 sm:py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-[#0b4627] via-[#0d4f2c] to-[#0b4627] hover:from-[#08351d] hover:to-[#093d22] text-white shadow-2xs hover:shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50 border border-emerald-600/30"
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
