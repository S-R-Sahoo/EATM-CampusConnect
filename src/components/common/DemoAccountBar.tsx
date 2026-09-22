import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { isSupabaseConfigured } from '../../supabase/client';
import { ShieldCheck, UserCheck, GraduationCap, ChevronDown, ChevronUp, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DemoAccountBar: React.FC = () => {
  const { user, switchDemoPersona } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const isLive = isSupabaseConfigured();

  const handleSwitch = async (role: 'student' | 'faculty') => {
    await switchDemoPersona(role);
    success(`Switched active persona to ${role.toUpperCase()}`, 'Persona Changed');
    if (role === 'student') navigate('/student/dashboard');
    else if (role === 'faculty') navigate('/faculty/dashboard');
  };

  return (
    <div className="bg-[#062615] text-white text-xs border-b border-emerald-900/60 transition-all duration-300 z-40 relative">
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-900/80 border border-emerald-700/50">
            <Database className={`w-3 h-3 ${isLive ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className="font-medium text-[11px]">
              {isLive ? 'Live Supabase Mode' : 'Sandbox Persistence Mode'}
            </span>
          </div>
          <span className="hidden sm:inline text-gray-400">|</span>
          <span className="hidden sm:inline text-gray-300">
            Active: <strong className="text-white font-semibold">{user?.displayName || 'Guest'}</strong> ({user?.role?.toUpperCase() || 'NONE'})
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-gray-300 hidden md:inline text-[11px] mr-1">Switch Persona:</span>
          <button
            onClick={() => handleSwitch('student')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
              user?.role === 'student'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-950/80 text-emerald-200 hover:bg-emerald-900'
            }`}
          >
            <GraduationCap className="w-3 h-3" />
            <span>Student</span>
          </button>

          <button
            onClick={() => handleSwitch('faculty')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
              user?.role === 'faculty'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-950/80 text-emerald-200 hover:bg-emerald-900'
            }`}
          >
            <UserCheck className="w-3 h-3" />
            <span>Faculty</span>
          </button>
        </div>
      </div>
    </div>
  );
};
