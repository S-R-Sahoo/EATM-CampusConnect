import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { fetchStudyMaterials, createStudyMaterial } from '../../firebase/firestore';
import { StudyMaterial } from '../../types';
import { Tabs } from '../../components/ui/Tabs';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { 
  BookOpen, Download, FileText, Search, Plus, 
  FileCode, Layers, CheckCircle2 
} from 'lucide-react';

export const StudyMaterialsPage: React.FC = () => {
  const { user } = useAuth();
  const { success } = useToast();

  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Upload state
  const [newTitle, setNewTitle] = useState('');
  const [newDept, setNewDept] = useState('CSE');
  const [newSemester, setNewSemester] = useState('6th');
  const [newSubject, setNewSubject] = useState('');
  const [newType, setNewType] = useState<'PDF' | 'PPT' | 'Notes' | 'Question Papers'>('PDF');
  const [uploading, setUploading] = useState(false);

  const tabs = [
    { id: 'All', label: 'All' },
    { id: 'Notes', label: 'Notes' },
    { id: 'PPT', label: 'PPT' },
    { id: 'PDF', label: 'PDF' },
    { id: 'Question Papers', label: 'Question Papers' },
  ];

  const loadData = async () => {
    const data = await fetchStudyMaterials();
    setMaterials(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDownload = (mat: StudyMaterial) => {
    success(`Downloading "${mat.title}" (${mat.fileSize})...`, 'Download Started');
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTitle.trim()) return;

    setUploading(true);
    try {
      await createStudyMaterial({
        title: newTitle.trim(),
        department: newDept,
        semester: newSemester,
        subject: newSubject.trim() || 'General Engineering',
        fileType: newType,
        fileSize: '3.8 MB',
        downloadUrl: '#',
        uploadedBy: user.id,
        uploadedByName: user.displayName
      });

      success('Study material published to department repository!', 'Upload Complete');
      setUploadModalOpen(false);
      setNewTitle('');
      setNewSubject('');
      loadData();
    } finally {
      setUploading(false);
    }
  };

  const filteredMaterials = materials.filter(m => {
    const matchesTab = activeTab === 'All' || m.fileType.toLowerCase() === activeTab.toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      m.title.toLowerCase().includes(q) ||
      m.subject.toLowerCase().includes(q) ||
      m.department.toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">PDF</div>;
      case 'ppt':
        return <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">PPT</div>;
      case 'notes':
        return <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">NOTE</div>;
      default:
        return <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">DOC</div>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#0b4627]" />
              <span>Study Materials & Question Banks</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Verified lecture slides, handwritten notes, and BPUT previous year papers
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subject, notes..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0b4627]"
              />
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setUploadModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
              className="whitespace-nowrap"
            >
              Upload Material
            </Button>
          </div>
        </div>

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />
      </div>

      {/* Materials List Table Style (matching reference bottom-left 2 panel) */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-card divide-y divide-gray-100 overflow-hidden">
        {filteredMaterials.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-xs">
            No study materials found for this filter.
          </div>
        ) : (
          filteredMaterials.map(mat => (
            <div
              key={mat.id}
              className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-gray-50 transition group"
            >
              <div className="flex items-center gap-3.5">
                {getTypeIcon(mat.fileType)}
                <div>
                  <h3 className="font-bold text-sm text-gray-900 group-hover:text-[#0b4627] transition-colors">
                    {mat.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {mat.department} • {mat.semester} Semester • <span className="font-semibold text-gray-600">{mat.fileSize}</span> • By {mat.uploadedByName}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleDownload(mat)}
                className="p-2.5 rounded-xl text-gray-500 hover:text-[#0b4627] hover:bg-emerald-50 transition border border-gray-200/60 group-hover:border-emerald-200"
                title="Download Material"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Upload Material Modal */}
      <Modal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} title="Upload Study Material">
        <form onSubmit={handleUpload} className="space-y-4">
          <Input
            label="Document / Material Title"
            placeholder="e.g. Operating Systems Chapter 4 Notes"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Department
              </label>
              <select
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
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
                File Type
              </label>
              <select
                value={newType}
                onChange={(e: any) => setNewType(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b4627] outline-none"
              >
                <option value="PDF">PDF Document</option>
                <option value="PPT">Presentation (PPT)</option>
                <option value="Notes">Lecture Notes</option>
                <option value="Question Papers">Question Paper</option>
              </select>
            </div>
          </div>

          <Input
            label="Subject"
            placeholder="e.g. Distributed Systems"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={uploading}>
              Publish Material
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
