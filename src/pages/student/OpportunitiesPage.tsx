import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { fetchOpportunities, toggleSaveOpportunity } from '../../supabase/db';
import { Opportunity } from '../../types';
import { Tabs } from '../../components/ui/Tabs';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { 
  Briefcase, MapPin, DollarSign, Calendar, 
  Bookmark, CheckCircle2, ArrowUpRight 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const OpportunitiesPage: React.FC = () => {
  const { user } = useAuth();
  const { success } = useToast();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [activeTab, setActiveTab] = useState('All');
  const [applyModalOpp, setApplyModalOpp] = useState<Opportunity | null>(null);
  const [applying, setApplying] = useState(false);

  // Apply form state
  const [resumeLink, setResumeLink] = useState('https://drive.google.com/my-eatm-resume.pdf');
  const [coverNote, setCoverNote] = useState('');

  const tabs = [
    { id: 'All', label: 'All' },
    { id: 'internship', label: 'Internships' },
    { id: 'placement', label: 'Placements' },
    { id: 'hackathon', label: 'Hackathons' },
  ];

  const loadData = async () => {
    const data = await fetchOpportunities();
    setOpportunities(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (oppId: string) => {
    if (!user) return;
    const isSaved = await toggleSaveOpportunity(oppId, user.id);
    setOpportunities(prev =>
      prev.map(o => {
        if (o.id === oppId) {
          return {
            ...o,
            savedBy: isSaved ? [...o.savedBy, user.id] : o.savedBy.filter(id => id !== user.id)
          };
        }
        return o;
      })
    );
    success(isSaved ? 'Opportunity saved to your profile.' : 'Opportunity removed from bookmarks.');
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyModalOpp) return;

    setApplying(true);
    setTimeout(() => {
      setApplying(false);
      confetti({ particleCount: 50, spread: 60 });
      success(`Application submitted to ${applyModalOpp.company} for ${applyModalOpp.role}!`, 'Application Sent');
      setApplyModalOpp(null);
    }, 600);
  };

  const filteredOpportunities = opportunities.filter(o =>
    activeTab === 'All' ? true : o.type.toLowerCase() === activeTab.toLowerCase()
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-card space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#0b4627]" />
            <span>Internship & Placement Opportunities</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Verified corporate hiring, campus recruitment, and regional hackathon drives
          </p>
        </div>

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />
      </div>

      {/* Opportunity Cards List (Matching reference bottom-center 1 panel) */}
      <div className="space-y-4">
        {filteredOpportunities.map(opp => {
          const isSaved = user ? opp.savedBy.includes(user.id) : false;

          return (
            <div
              key={opp.id}
              className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-card hover:border-emerald-200 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 p-2 flex items-center justify-center shrink-0">
                  <img
                    src={opp.logoUrl}
                    alt={opp.company}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-gray-900">{opp.role}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-[#0b4627] border border-emerald-200 uppercase">
                      {opp.type}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-gray-600">
                    {opp.company} • {opp.duration || 'Full-time'}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 pt-1">
                    <span className="font-semibold text-emerald-700">{opp.stipend}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      {opp.location}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      Deadline: {opp.deadline}
                    </span>
                  </div>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {opp.skills.map(s => (
                      <span key={s} className="px-2 py-0.5 text-[10px] bg-gray-100 rounded-md font-medium text-gray-600">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto self-end sm:self-center">
                <button
                  onClick={() => handleSave(opp.id)}
                  className={`p-2.5 rounded-xl border transition ${
                    isSaved
                      ? 'border-emerald-300 bg-emerald-50 text-[#0b4627]'
                      : 'border-gray-200 text-gray-400 hover:text-gray-700'
                  }`}
                  aria-label="Save opportunity"
                >
                  <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                </button>

                <button
                  onClick={() => setApplyModalOpp(opp)}
                  className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-xs font-bold bg-[#0b4627] hover:bg-[#0f5132] text-white shadow-sm flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <span>Apply</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Apply Modal */}
      {applyModalOpp && (
        <Modal
          isOpen={!!applyModalOpp}
          onClose={() => setApplyModalOpp(null)}
          title={`Apply to ${applyModalOpp.company}`}
        >
          <form onSubmit={handleApplySubmit} className="space-y-4">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-3">
              <img src={applyModalOpp.logoUrl} alt={applyModalOpp.company} className="w-10 h-10 object-contain" />
              <div>
                <h4 className="font-bold text-xs text-gray-900">{applyModalOpp.role}</h4>
                <p className="text-[11px] text-gray-500">{applyModalOpp.company} • {applyModalOpp.location}</p>
              </div>
            </div>

            <Input
              label="Resume / Portfolio Link"
              type="url"
              value={resumeLink}
              onChange={(e) => setResumeLink(e.target.value)}
              placeholder="https://drive.google.com/..."
              required
            />

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Brief Cover Note (Why are you a strong fit?)
              </label>
              <textarea
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                rows={3}
                placeholder="Highlight your relevant coursework, projects, or hackathon honors..."
                className="w-full p-3 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b4627] outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setApplyModalOpp(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={applying}>
                Submit Application
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
