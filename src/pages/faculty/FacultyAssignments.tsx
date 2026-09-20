import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { fetchAssignments, createAssignment } from '../../firebase/firestore';
import { Assignment } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { CheckSquare, Plus, Calendar, FileText, Users, Clock } from 'lucide-react';

export const FacultyAssignments: React.FC = () => {
  const { user } = useAuth();
  const { success } = useToast();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [createModal, setCreateModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [department, setDepartment] = useState(user?.department || 'CSE');
  const [semester, setSemester] = useState('6th');
  const [deadline, setDeadline] = useState('2025-10-30T23:59');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    const data = await fetchAssignments();
    setAssignments(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    setSubmitting(true);
    try {
      await createAssignment({
        title: title.trim(),
        subject: subject.trim(),
        department,
        semester,
        deadline,
        description: description.trim(),
        createdBy: user.id,
        createdByName: user.displayName
      });

      success('New assignment assigned to students!', 'Assignment Created');
      setCreateModal(false);
      setTitle('');
      setSubject('');
      setDescription('');
      loadData();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-card flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[#0b4627]" />
            <span>Coursework & Assignments</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Post project rubrics, problem sets, and evaluate semester student submissions
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setCreateModal(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Create Assignment
        </Button>
      </div>

      {/* Assignment List */}
      <div className="space-y-4">
        {assignments.map(asg => (
          <div
            key={asg.id}
            className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-card space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-[#0b4627] border border-emerald-200 uppercase">
                    {asg.department} • {asg.semester} Sem
                  </span>
                  <span className="text-xs font-semibold text-gray-500">{asg.subject}</span>
                </div>
                <h3 className="text-base font-black text-gray-900 mt-1">{asg.title}</h3>
              </div>

              <div className="text-right">
                <span className="text-xs font-semibold text-red-600 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Due: {new Date(asg.deadline).toLocaleDateString()}
                </span>
                <span className="text-xs text-gray-500 font-medium block mt-0.5">
                  {asg.submissionsCount} Submissions Received
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">{asg.description}</p>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-400">Created by {asg.createdByName}</span>
              <button
                onClick={() => success(`Viewing ${asg.submissionsCount} submissions for ${asg.title}`)}
                className="font-bold text-[#0b4627] hover:underline"
              >
                Review Submissions →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Create New Assignment">
        <form onSubmit={handleCreateAssignment} className="space-y-4">
          <Input
            label="Assignment Title"
            placeholder="e.g. Lab Project: Compiler Syntax Analyzer"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Subject Name"
              placeholder="e.g. Compiler Design"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
            <Input
              label="Due Date & Time"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b4627] outline-none"
              >
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="EEE">EEE</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Civil">Civil</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Target Semester
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b4627] outline-none"
              >
                <option value="1st">1st Semester</option>
                <option value="2nd">2nd Semester</option>
                <option value="3rd">3rd Semester</option>
                <option value="4th">4th Semester</option>
                <option value="5th">5th Semester</option>
                <option value="6th">6th Semester</option>
                <option value="7th">7th Semester</option>
                <option value="8th">8th Semester</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Instructions & Problem Statement
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Detail required inputs, expected outputs, test cases, and formatting..."
              className="w-full p-3 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b4627] outline-none resize-none"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
              Publish Assignment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
