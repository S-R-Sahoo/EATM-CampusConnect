import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { fetchCommunities, toggleJoinCommunity, createCommunity } from '../../firebase/firestore';
import { Community } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Search, Plus, Users, Award, Check, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export const CommunitiesPage: React.FC = () => {
  const { user } = useAuth();
  const { success } = useToast();

  const [communities, setCommunities] = useState<Community[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Create club form
  const [newClubName, setNewClubName] = useState('');
  const [newClubCategory, setNewClubCategory] = useState('Technical');
  const [newClubDesc, setNewClubDesc] = useState('');
  const [newClubLogo, setNewClubLogo] = useState('');
  const [creating, setCreating] = useState(false);

  const loadData = async () => {
    const data = await fetchCommunities();
    setCommunities(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleJoin = async (club: Community) => {
    if (!user) return;
    const isMember = club.members.includes(user.id);
    const res = await toggleJoinCommunity(club.id, user.id);

    setCommunities(prev =>
      prev.map(c => {
        if (c.id === club.id) {
          return {
            ...c,
            memberCount: res.count,
            members: res.joined
              ? [...c.members, user.id]
              : c.members.filter(id => id !== user.id)
          };
        }
        return c;
      })
    );

    if (res.joined) {
      confetti({ particleCount: 50, spread: 60 });
      success(`Welcome to ${club.name}! You are now an active member.`, 'Club Joined');
    } else {
      success(`You left ${club.name}.`);
    }
  };

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newClubName.trim()) return;

    setCreating(true);
    try {
      await createCommunity(
        {
          name: newClubName.trim(),
          category: newClubCategory,
          description: newClubDesc.trim(),
          logoUrl: newClubLogo || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&auto=format&fit=crop&q=80',
          admins: [user.id]
        },
        user.id
      );

      confetti({ particleCount: 60, spread: 70 });
      success(`Community "${newClubName}" has been created!`, 'Club Created');
      setCreateModalOpen(false);
      setNewClubName('');
      setNewClubDesc('');
      loadData();
    } finally {
      setCreating(false);
    }
  };

  const filteredClubs = communities.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-700" />
            <span>Clubs & Communities</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Discover student societies, technical chapters, and cultural forums at EATM
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clubs..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0b4627]"
            />
          </div>

          <Button
            variant="crimson"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
            className="shadow-sm whitespace-nowrap"
          >
            Create Club
          </Button>
        </div>
      </div>

      {/* Grid of Clubs */}
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-4 px-1 flex items-center justify-between">
          <span>Active Societies ({filteredClubs.length})</span>
          <span className="text-xs text-gray-400 font-normal">Auto-enrolling verified members</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClubs.map(club => {
            const isMember = user ? club.members.includes(user.id) : false;

            return (
              <div
                key={club.id}
                className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-card hover:shadow-card-hover hover:border-emerald-200 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <img
                      src={club.logoUrl}
                      alt={club.name}
                      className="w-14 h-14 rounded-2xl object-cover shadow-sm ring-1 ring-gray-100"
                    />
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#0b4627] border border-emerald-200/60 uppercase">
                      {club.category}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-gray-900 mb-1">{club.name}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-4">
                    {club.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>{club.memberCount} members</span>
                  </div>

                  <button
                    onClick={() => handleJoin(club)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      isMember
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-[#0b4627] hover:bg-[#0f5132] text-white shadow-sm'
                    }`}
                  >
                    {isMember ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Joined</span>
                      </>
                    ) : (
                      <span>Join</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Club Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Register a New Student Society">
        <form onSubmit={handleCreateClub} className="space-y-4">
          <Input
            label="Club Name"
            placeholder="e.g. AI & Data Science Society"
            value={newClubName}
            onChange={(e) => setNewClubName(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={newClubCategory}
              onChange={(e) => setNewClubCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b4627] outline-none"
            >
              <option value="Technical">Technical</option>
              <option value="Cultural">Cultural</option>
              <option value="Athletics">Athletics / Sports</option>
              <option value="Creative Arts">Creative Arts / Media</option>
              <option value="Innovation">Innovation & Entrepreneurship</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Description & Objectives
            </label>
            <textarea
              value={newClubDesc}
              onChange={(e) => setNewClubDesc(e.target.value)}
              rows={3}
              placeholder="State the mission, regular activities, and leadership..."
              className="w-full p-3 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0b4627] outline-none resize-none"
              required
            />
          </div>

          <Input
            label="Logo Image URL (Optional)"
            type="url"
            placeholder="https://..."
            value={newClubLogo}
            onChange={(e) => setNewClubLogo(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={creating}>
              Create Society
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
