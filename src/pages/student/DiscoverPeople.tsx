import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { fetchUsers, fetchConnections, sendConnectionRequest } from '../../firebase/firestore';
import { UserProfile, Connection } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { Tabs } from '../../components/ui/Tabs';
import { Search, UserPlus, Check, Clock, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export const DiscoverPeople: React.FC = () => {
  const { user } = useAuth();
  const { success } = useToast();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedDept, setSelectedDept] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const getConnectionStatus = (targetId: string): 'none' | 'pending' | 'connected' => {
    const conn = connections.find(c =>
      (c.requesterId === user?.id && c.recipientId === targetId) ||
      (c.requesterId === targetId && c.recipientId === user?.id)
    );
    if (!conn) return 'none';
    if (conn.status === 'accepted') return 'connected';
    return 'pending';
  };

  const handleConnect = async (targetUser: UserProfile) => {
    if (!user) return;
    const newConn = await sendConnectionRequest(user.id, targetUser.id);
    setConnections(prev => [...prev, newConn]);
    confetti({ particleCount: 40, spread: 50 });
    success(`Connection request sent to ${targetUser.displayName}!`, 'Request Sent');
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
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-card space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <span>Discover People</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
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
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0b4627] focus:bg-white transition"
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
          <div className="bg-white rounded-2xl p-10 text-center text-gray-400">
            <p className="text-xs">Finding students across EATM campus...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-gray-500 border border-gray-200">
            <p className="font-semibold text-sm">No students found matching your criteria</p>
            <p className="text-xs text-gray-400 mt-1">Try switching departments or adjusting your search term.</p>
          </div>
        ) : (
          filteredUsers.map(student => {
            const status = getConnectionStatus(student.id);

            return (
              <div
                key={student.id}
                className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 shadow-card hover:border-emerald-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <Avatar
                    src={student.photoURL}
                    name={student.displayName}
                    size="lg"
                    online={true}
                  />
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-gray-900">
                      {student.displayName}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                      {student.department} • {student.year || '3rd Year'}
                    </p>

                    {/* Skill Badges */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {student.skills?.slice(0, 4).map(skill => (
                        <span
                          key={skill}
                          className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-gray-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Connect Button */}
                <div className="sm:self-center">
                  {status === 'connected' ? (
                    <button
                      disabled
                      className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center justify-center gap-1.5 cursor-default"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Connected</span>
                    </button>
                  ) : status === 'pending' ? (
                    <button
                      disabled
                      className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center gap-1.5 cursor-default"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Pending</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnect(student)}
                      className="w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-bold bg-[#0b4627] hover:bg-[#0f5132] text-white shadow-sm flex items-center justify-center gap-1.5 transition active:scale-95"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Connect</span>
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
