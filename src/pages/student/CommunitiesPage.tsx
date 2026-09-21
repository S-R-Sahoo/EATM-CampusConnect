import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { fetchCommunities, toggleJoinCommunity, createCommunity } from '../../supabase/db';
import { uploadFile } from '../../supabase/storage';
import { Community } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Search, Plus, Users, Award, Check, Upload, X, Image as ImageIcon } from 'lucide-react';
import confetti from 'canvas-confetti';

export const CommunitiesPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [communities, setCommunities] = useState<Community[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Create club form
  const [newClubName, setNewClubName] = useState('');
  const [newClubCategory, setNewClubCategory] = useState('Technical');
  const [newClubDesc, setNewClubDesc] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [creating, setCreating] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    const data = await fetchCommunities();
    setCommunities(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const resetForm = () => {
    setNewClubName('');
    setNewClubCategory('Technical');
    setNewClubDesc('');
    removeLogo();
    setUploadProgress(0);
  };

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
      let uploadedLogoUrl = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&auto=format&fit=crop&q=80';
      if (logoFile) {
        uploadedLogoUrl = await uploadFile(
          `communities/${Date.now()}_${logoFile.name}`,
          logoFile,
          (prog) => setUploadProgress(prog)
        );
      }

      await createCommunity(
        {
          name: newClubName.trim(),
          category: newClubCategory,
          description: newClubDesc.trim(),
          logoUrl: uploadedLogoUrl,
          admins: [user.id]
        },
        user.id
      );

      confetti({ particleCount: 60, spread: 70 });
      success(`Community "${newClubName}" has been created!`, 'Club Created');
      setCreateModalOpen(false);
      resetForm();
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to create club.');
    } finally {
      setCreating(false);
      setUploadProgress(0);
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
      <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/80 dark:border-[#1e3325] p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-[#0b4627] dark:text-emerald-400" />
            <span>Clubs & Communities</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
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
              className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-[#16251c] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#1e3325] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0b4627]"
            />
          </div>

          <Button
            variant="crimson"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
            className="shadow-sm whitespace-nowrap font-semibold"
          >
            Create Club
          </Button>
        </div>
      </div>

      {/* Grid of Clubs */}
      <div>
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4 px-1 flex items-center justify-between">
          <span>Active Societies ({filteredClubs.length})</span>
          <span className="text-xs text-gray-400 dark:text-gray-500 font-normal">Auto-enrolling verified members</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClubs.map(club => {
            const isMember = user ? club.members.includes(user.id) : false;

            return (
              <div
                key={club.id}
                className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/80 dark:border-[#1e3325] p-6 shadow-card hover:shadow-card-hover hover:border-emerald-200 dark:hover:border-emerald-800 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <img
                      src={club.logoUrl}
                      alt={club.name}
                      className="w-14 h-14 rounded-2xl object-cover shadow-sm ring-1 ring-gray-100 dark:ring-[#1e3325]"
                    />
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#0b4627] dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 uppercase">
                      {club.category}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-gray-900 dark:text-gray-100 mb-1">{club.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-4">
                    {club.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-[#1e3325] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-semibold">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>{club.memberCount} members</span>
                  </div>

                  <button
                    onClick={() => handleJoin(club)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      isMember
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900'
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
      <Modal 
        isOpen={createModalOpen} 
        onClose={() => {
          setCreateModalOpen(false);
          resetForm();
        }} 
        title="Register a New Student Society"
        maxWidth="md"
      >
        <form onSubmit={handleCreateClub} className="space-y-4">
          <Input
            label="Club / Society Name"
            placeholder="e.g. AI & Data Science Society"
            value={newClubName}
            onChange={(e) => setNewClubName(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={newClubCategory}
              onChange={(e) => setNewClubCategory(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-white dark:bg-[#16251c] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#1e3325] rounded-xl focus:ring-2 focus:ring-[#0b4627] outline-none"
            >
              <option value="Technical">Technical</option>
              <option value="Cultural">Cultural</option>
              <option value="Athletics">Athletics / Sports</option>
              <option value="Creative Arts">Creative Arts / Media</option>
              <option value="Innovation">Innovation & Entrepreneurship</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              Description & Objectives
            </label>
            <textarea
              value={newClubDesc}
              onChange={(e) => setNewClubDesc(e.target.value)}
              rows={3}
              placeholder="State the mission, regular activities, and leadership..."
              className="w-full p-3 text-xs bg-white dark:bg-[#16251c] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#1e3325] rounded-xl focus:ring-2 focus:ring-[#0b4627] outline-none resize-none leading-relaxed"
              required
            />
          </div>

          {/* Official Society Logo Upload */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Society Logo
            </label>
            <input
              type="file"
              ref={logoInputRef}
              onChange={handleLogoSelect}
              accept="image/*"
              className="hidden"
            />

            {logoPreview ? (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-[#16251c] border border-gray-200 dark:border-[#1e3325]">
                <img
                  src={logoPreview}
                  alt="Logo Preview"
                  className="w-14 h-14 rounded-xl object-cover border border-gray-200 dark:border-[#2b4935] shadow-sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                    {logoFile?.name || 'Selected Logo'}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                    {logoFile ? `${(logoFile.size / 1024).toFixed(1)} KB` : 'Ready to upload'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="px-2.5 py-1 text-xs font-semibold text-[#0b4627] dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-[#1f3527] rounded-lg transition"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="p-1 text-gray-400 hover:text-red-500 rounded-lg transition"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="w-full flex items-center gap-3.5 p-3.5 border-2 border-dashed border-gray-200 dark:border-[#1e3325] hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl bg-gray-50/70 dark:bg-[#16251c] text-left transition group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-[#0b4627] dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                    Upload Official Society Logo
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                    Click to choose a logo from your device (PNG, JPG, WebP)
                  </p>
                </div>
              </button>
            )}

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full bg-gray-100 dark:bg-[#1e3325] rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-[#0b4627] dark:bg-emerald-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-[#1e3325]">
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setCreateModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              size="sm" 
              isLoading={creating}
              className="px-5 font-semibold"
            >
              Register Society
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
