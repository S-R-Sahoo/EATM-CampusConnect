import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchUsers } from '../../supabase/db';
import { UserProfile } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { Search, Users, Mail, Phone, GraduationCap, CheckCircle2 } from 'lucide-react';

export const FacultyStudents: React.FC = () => {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');

  useEffect(() => {
    fetchUsers().then(users => {
      setStudents(users.filter(u => u.role === 'student'));
    });
  }, []);

  const filtered = students.filter(s => {
    const matchesDept = selectedDept === 'All' || s.department.toLowerCase() === selectedDept.toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesQuery = !q ||
      s.displayName.toLowerCase().includes(q) ||
      (s.rollNumber && s.rollNumber.toLowerCase().includes(q)) ||
      s.department.toLowerCase().includes(q);
    return matchesDept && matchesQuery;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/80 dark:border-[#1e3325] p-6 shadow-card space-y-4 transition-colors">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0b4627] dark:text-emerald-400" />
            <span>Enrolled Students Directory</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            View student academic records, active standing, and departmental cohorts
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name or roll number..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-[#16251c] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 border border-gray-200 dark:border-[#1e3325] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0b4627] dark:focus:ring-emerald-500"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs bg-gray-50 dark:bg-[#16251c] border border-gray-200 dark:border-[#1e3325] rounded-xl px-3 py-2 text-gray-700 dark:text-gray-300 outline-none"
          >
            <option value="All">All Departments</option>
            <option value="CSE">Computer Science (CSE)</option>
            <option value="ECE">Electronics (ECE)</option>
            <option value="EEE">Electrical (EEE)</option>
            <option value="Mechanical">Mechanical (ME)</option>
            <option value="Civil">Civil (CE)</option>
          </select>
        </div>
      </div>

      {/* Student Records List */}
      <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/80 dark:border-[#1e3325] shadow-card divide-y divide-gray-100 dark:divide-[#1e3325] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400 dark:text-gray-500 text-xs">
            No students found matching your query.
          </div>
        ) : (
          filtered.map(st => (
            <div key={st.id} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-[#16251c]/60 transition">
              <Link
                to={`/faculty/profile/${st.id}`}
                className="flex items-center gap-3.5 group/student hover:opacity-95 transition"
                title="View Student Academic Profile"
              >
                <Avatar src={st.photoURL} name={st.displayName} size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 group-hover/student:text-[#0b4627] dark:group-hover/student:text-emerald-400 transition-colors">
                      {st.displayName}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {st.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Roll: <strong className="text-gray-700 dark:text-gray-200">{st.rollNumber || 'EATM23000'}</strong> • {st.department} • {st.year || '3rd Year'}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{st.email}</p>
                </div>
              </Link>

              <div className="text-right">
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 block">
                  {st.stats?.achievements || 2} Campus Honors
                </span>
                <span className="text-[11px] text-gray-400">
                  {st.stats?.connections || 45} Connections
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
