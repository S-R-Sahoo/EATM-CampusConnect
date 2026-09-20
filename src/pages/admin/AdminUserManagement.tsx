import React, { useState, useEffect } from 'react';
import { fetchUsers, updateUserProfile } from '../../firebase/firestore';
import { UserProfile } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../contexts/ToastContext';
import { Search, Shield, UserCheck, UserX, CheckCircle, Ban, Filter } from 'lucide-react';

export const AdminUserManagement: React.FC = () => {
  const { success, warning } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  const loadData = async () => {
    const data = await fetchUsers();
    setUsers(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (user: UserProfile) => {
    const newStatus = user.status === 'active' ? 'disabled' : 'active';
    await updateUserProfile(user.id, { status: newStatus });
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
    if (newStatus === 'disabled') {
      warning(`Account for ${user.displayName} has been deactivated.`, 'Account Suspended');
    } else {
      success(`Account for ${user.displayName} has been restored to active standing.`, 'Account Activated');
    }
  };

  const handleToggleVerified = async (user: UserProfile) => {
    const newVerified = !user.verified;
    await updateUserProfile(user.id, { verified: newVerified });
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, verified: newVerified } : u));
    success(`Verification badge ${newVerified ? 'granted to' : 'removed from'} ${user.displayName}.`);
  };

  const filteredUsers = users.filter(u => {
    const matchesRole = roleFilter === 'All' || u.role.toLowerCase() === roleFilter.toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesQuery = !q ||
      u.displayName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.rollNumber && u.rollNumber.toLowerCase().includes(q)) ||
      u.department.toLowerCase().includes(q);
    return matchesRole && matchesQuery;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-card space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#0b4627]" />
            <span>Campus Directory & User Governance</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Admin oversight, activate/suspend campus accounts, and assign verification badges
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, roll number, email..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0b4627]"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-700 outline-none"
          >
            <option value="All">All Roles</option>
            <option value="student">Students Only</option>
            <option value="faculty">Faculty Only</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200/80 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Role & Dept</th>
                <th className="py-3.5 px-4">ID / Roll No</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/80 transition">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar src={u.photoURL} name={u.displayName} size="sm" />
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-gray-900">
                          <span>{u.displayName}</span>
                          {u.verified && <CheckCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-50" />}
                        </div>
                        <span className="text-[11px] text-gray-400">{u.email}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                      u.role === 'admin' ? 'bg-red-100 text-red-800' :
                      u.role === 'faculty' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {u.role}
                    </span>
                    <span className="block text-[11px] text-gray-500 mt-0.5">{u.department}</span>
                  </td>

                  <td className="py-3.5 px-4 font-mono font-medium text-gray-600">
                    {u.rollNumber || u.employeeId || 'N/A'}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${
                      u.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {u.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleVerified(u)}
                        className={`p-1.5 rounded-lg border transition ${
                          u.verified ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'text-gray-400 hover:text-gray-600'
                        }`}
                        title="Toggle verification badge"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>

                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                            u.status === 'active'
                              ? 'text-red-700 hover:bg-red-50 border border-red-200'
                              : 'text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                          }`}
                        >
                          {u.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
