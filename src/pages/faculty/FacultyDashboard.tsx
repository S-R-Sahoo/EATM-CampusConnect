import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { 
  fetchAnnouncements, createAnnouncement, 
  fetchEvents, fetchStudyMaterials, fetchAssignments 
} from '../../supabase/db';
import { Announcement } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { 
  Users, Calendar, CheckSquare, AlertCircle, 
  Plus, Bell, BookOpen, ArrowRight, ShieldCheck 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const FacultyDashboard: React.FC = () => {
  const { user } = useAuth();
  const { success } = useToast();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [createAnnModal, setCreateAnnModal] = useState(false);

  // New announcement form
  const [annTitle, setAnnTitle] = useState('');
  const [annDesc, setAnnDesc] = useState('');
  const [annCategory, setAnnCategory] = useState<'Academic' | 'Examination' | 'Placement' | 'Events' | 'General' | 'Emergency'>('Academic');
  const [annPriority, setAnnPriority] = useState<'normal' | 'important' | 'urgent'>('important');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    const data = await fetchAnnouncements();
    setAnnouncements(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !annTitle.trim()) return;

    setSubmitting(true);
    try {
      await createAnnouncement({
        title: annTitle.trim(),
        description: annDesc.trim(),
        category: annCategory,
        priority: annPriority,
        authorName: user.displayName,
        authorRole: user.designation || 'Faculty Member'
      });

      success('Campus announcement published and broadcasted to students!', 'Notice Published');
      setCreateAnnModal(false);
      setAnnTitle('');
      setAnnDesc('');
      loadData();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Faculty Header Card */}
      <div className="bg-gradient-to-r from-[#062615] to-[#0b4627] rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full border border-white/20">
            Faculty Portal • {user?.department || 'CSE'} Department
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-2">
            Welcome, {user?.displayName}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 mt-1">
            {user?.designation || 'Head of Department'} • EATM Campus Operations
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="crimson"
            size="sm"
            onClick={() => setCreateAnnModal(true)}
            icon={<Plus className="w-4 h-4" />}
            className="shadow-sm"
          >
            Create Announcement
          </Button>
          <Link to="/faculty/assignments">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              New Assignment
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Stats Cards (Matching reference bottom-center 2 panel) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">Total Students</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0b4627] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">324</div>
          <span className="text-[10px] text-emerald-600 font-semibold">Active in Department</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">Active Events</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-[#dc2626] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">8</div>
          <span className="text-[10px] text-gray-400 font-medium">Departmental fests</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">Assignments</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">12</div>
          <span className="text-[10px] text-blue-600 font-semibold">42 Submissions pending</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">Pending Reports</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">3</div>
          <span className="text-[10px] text-amber-600 font-semibold">Under Dean Review</span>
        </div>
      </div>

      {/* Main Faculty Section: Recent Announcements */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#0b4627]" />
              <span>Recent Campus Announcements</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Notices visible to all enrolled students and staff</p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCreateAnnModal(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Post Notice
          </Button>
        </div>

        <div className="space-y-3 divide-y divide-gray-100">
          {announcements.map(ann => (
            <div key={ann.id} className="pt-3 first:pt-0 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      ann.priority === 'urgent'
                        ? 'bg-red-100 text-red-800'
                        : ann.priority === 'important'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {ann.priority}
                  </span>
                  <span className="text-xs font-semibold text-gray-500">{ann.category}</span>
                  <span className="text-[11px] text-gray-400">• Posted on {new Date(ann.createdAt).toLocaleDateString()}</span>
                </div>

                <h3 className="text-sm font-bold text-gray-900">{ann.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed max-w-2xl">{ann.description}</p>
                <span className="text-[11px] text-gray-500 block">Issued by: {ann.authorName} ({ann.authorRole})</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Announcement Modal */}
      <Modal isOpen={createAnnModal} onClose={() => setCreateAnnModal(false)} title="Publish Official Notice">
        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
          <Input
            label="Announcement Title"
            placeholder="e.g. Schedule for Mid-Term Examination 2025"
            value={annTitle}
            onChange={(e) => setAnnTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={annCategory}
                onChange={(e: any) => setAnnCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b4627] outline-none"
              >
                <option value="Academic">Academic</option>
                <option value="Examination">Examination</option>
                <option value="Placement">Placement</option>
                <option value="Events">Events</option>
                <option value="General">General</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={annPriority}
                onChange={(e: any) => setAnnPriority(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b4627] outline-none"
              >
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Notice Content
            </label>
            <textarea
              value={annDesc}
              onChange={(e) => setAnnDesc(e.target.value)}
              rows={4}
              placeholder="Provide complete details, instructions, dates, and classroom locations..."
              className="w-full p-3 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b4627] outline-none resize-none"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setCreateAnnModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
              Broadcast Notice
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
