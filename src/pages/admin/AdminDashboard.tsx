import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Users, GraduationCap, Award, Calendar, 
  ShieldCheck, ArrowUpRight, TrendingUp, AlertTriangle, FileText, CheckCircle2 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  const recentActivities = [
    { text: 'New student registered: Soumyaranjan Sahoo (CSE)', time: '2m ago', type: 'student' },
    { text: 'New club initiated: AI & Data Science Society', time: '15m ago', type: 'club' },
    { text: 'Event published: Hackathon 2025 by Coding Club', time: '1h ago', type: 'event' },
    { text: 'Post reported for inappropriate content by 2 students', time: '3h ago', type: 'report' },
    { text: 'Placement opportunity added: SDE Intern - Google', time: '5h ago', type: 'opp' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Admin Greeting */}
      <div className="bg-gradient-to-r from-[#062615] via-[#0b4627] to-[#14532d] rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full border border-white/20">
            Dean Office • Campus Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-2">
            Campus Operations Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 mt-1">
            Real-time analytics, user accounts, content moderation, and university events
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/reports">
            <button className="px-4 py-2.5 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-bold shadow-md flex items-center gap-2 transition">
              <ShieldCheck className="w-4 h-4" />
              <span>Moderation Queue</span>
            </button>
          </Link>
        </div>
      </div>

      {/* 4 Stats Cards (Matching reference bottom-center 3 panel) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">Students</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0b4627] flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">1,248</div>
          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" /> +14% this semester
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">Faculty</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">86</div>
          <span className="text-[10px] text-gray-400 font-medium block mt-1">Across 6 Departments</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">Active Clubs</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">24</div>
          <span className="text-[10px] text-purple-600 font-semibold block mt-1">100% Chartered</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">Recent Activities</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-[#dc2626] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">18</div>
          <span className="text-[10px] text-emerald-600 font-semibold block mt-1">Real-time actions</span>
        </div>
      </div>

      {/* Main Grid: User Growth Graph + Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Growth Chart (SVG Line Visual) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/80 p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-gray-900">User Growth & Engagement</h3>
              <p className="text-xs text-gray-500">Monthly student registrations across academic years</p>
            </div>
            <span className="text-xs font-bold text-[#0b4627] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              2024 - 2025
            </span>
          </div>

          {/* Clean SVG Area Chart */}
          <div className="w-full h-56 pt-4">
            <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0b4627" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#0b4627" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="180" x2="600" y2="180" stroke="#f1f5f3" strokeWidth="1" />
              <line x1="0" y1="130" x2="600" y2="130" stroke="#f1f5f3" strokeWidth="1" />
              <line x1="0" y1="80" x2="600" y2="80" stroke="#f1f5f3" strokeWidth="1" />
              <line x1="0" y1="30" x2="600" y2="30" stroke="#f1f5f3" strokeWidth="1" />

              {/* Area */}
              <polygon
                points="30,170 110,150 190,160 270,120 350,130 430,90 510,70 580,40 580,180 30,180"
                fill="url(#chartGrad)"
              />

              {/* Smooth Path Line */}
              <polyline
                fill="none"
                stroke="#0b4627"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="30,170 110,150 190,160 270,120 350,130 430,90 510,70 580,40"
              />

              {/* Data points */}
              {[
                { cx: 30, cy: 170, val: 'Jul' },
                { cx: 110, cy: 150, val: 'Aug' },
                { cx: 190, cy: 160, val: 'Sep' },
                { cx: 270, cy: 120, val: 'Oct' },
                { cx: 350, cy: 130, val: 'Nov' },
                { cx: 430, cy: 90, val: 'Dec' },
                { cx: 510, cy: 70, val: 'Jan' },
                { cx: 580, cy: 40, val: 'Feb' },
              ].map((pt, i) => (
                <g key={i}>
                  <circle cx={pt.cx} cy={pt.cy} r="4" fill="#ffffff" stroke="#0b4627" strokeWidth="2.5" />
                  <text x={pt.cx} y="198" fontSize="10" fill="#9ca3af" textAnchor="middle" fontWeight="600">
                    {pt.val}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Recent Activities List (Matching Reference) */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-card space-y-4">
          <h3 className="font-extrabold text-base text-gray-900">Recent Activities</h3>
          <div className="space-y-3 divide-y divide-gray-100">
            {recentActivities.map((act, i) => (
              <div key={i} className="pt-3 first:pt-0 flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-gray-800 leading-snug font-medium">{act.text}</p>
                  <span className="text-[10px] text-gray-400 mt-0.5 block">{act.time}</span>
                </div>
              </div>
            ))}
          </div>

          <Link to="/admin/students" className="block pt-2">
            <button className="w-full py-2 text-xs font-bold text-[#0b4627] hover:bg-emerald-50 rounded-xl transition">
              Manage All Users →
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};
