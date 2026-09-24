import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { 
  fetchCommunities, joinCommunity, leaveCommunity, createCommunity, subscribeToAllCommunities 
} from '../../supabase/db';
import { uploadFile } from '../../supabase/storage';
import { Community, CommunityType } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { 
  Search, Plus, Users, Award, Check, Upload, X, ShieldCheck, 
  Lock, Globe, Sparkles, Filter, ArrowRight, BookOpen, 
  Flame, Calendar, ExternalLink, ChevronRight, Layers, HelpCircle,
  AlertTriangle, RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';

const CATEGORIES = [
  'All',
  'Academic',
  'Technical',
  'Cultural',
  'Sports',
  'Creative Arts',
  'Innovation',
  'Entrepreneurship',
  'Gaming',
  'Study'
];

export const CommunitiesPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error, info } = useToast();
  const navigate = useNavigate();

  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'members'>('popular');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Create club form states
  const [newClubName, setNewClubName] = useState('');
  const [newClubCategory, setNewClubCategory] = useState('Technical');
  const [newClubType, setNewClubType] = useState<CommunityType>('public');
  const [newClubDesc, setNewClubDesc] = useState('');
  const [newClubRules, setNewClubRules] = useState('');
  const [newClubMeeting, setNewClubMeeting] = useState('');
  const [newClubRoom, setNewClubRoom] = useState('');
  const [isOfficialReq, setIsOfficialReq] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [creating, setCreating] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const loadData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setFetchError(null);
      const data = await fetchCommunities();
      setCommunities(data);
    } catch (err: any) {
      console.error('Failed to load communities:', err);
      setFetchError(err.message || 'Unable to connect to campus community directory.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    const unsub = subscribeToAllCommunities(() => {
      loadData(false);
    });
    return () => unsub();
  }, []);

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const removeCover = () => {
    setCoverFile(null);
    setCoverPreview(null);
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  const resetForm = () => {
    setNewClubName('');
    setNewClubCategory('Technical');
    setNewClubType('public');
    setNewClubDesc('');
    setNewClubRules('');
    setNewClubMeeting('');
    setNewClubRoom('');
    setIsOfficialReq(false);
    removeLogo();
    removeCover();
    setUploadProgress(0);
  };

  const handleJoinToggle = async (e: React.MouseEvent, club: Community) => {
    e.stopPropagation();
    if (!user) return;

    const isMember = club.members.includes(user.id);
    const hasPending = club.pendingRequests?.includes(user.id);

    if (isMember) {
      // Leave flow
      const res = await leaveCommunity(club.id, user.id);
      if (res.isOwnerMustTransfer) {
        info('As the community owner, please transfer ownership before leaving or delete the society from settings.', 'Owner Action Required');
        return;
      }
      setCommunities(prev =>
        prev.map(c => c.id === club.id ? { ...c, memberCount: res.count, members: c.members.filter(id => id !== user.id) } : c)
      );
      success(`You left ${club.name}.`);
    } else if (hasPending) {
      info('Your join request is currently under review by the society leadership.', 'Request Pending');
    } else {
      // Join / Request flow
      const res = await joinCommunity(club.id, user.id);
      if (res.status === 'banned') {
        error('You are restricted from joining this community.', 'Access Restricted');
        return;
      }
      if (res.status === 'requested') {
        setCommunities(prev =>
          prev.map(c => c.id === club.id ? { ...c, pendingRequests: [...(c.pendingRequests || []), user.id] } : c)
        );
        success(`Request to join "${club.name}" sent to leadership for approval!`, 'Request Sent');
      } else if (res.status === 'joined') {
        setCommunities(prev =>
          prev.map(c => c.id === club.id ? { ...c, memberCount: res.count, members: [...c.members, user.id] } : c)
        );
        confetti({ particleCount: 50, spread: 60 });
        success(`Welcome to ${club.name}! You are now an active member.`, 'Society Joined');
      }
    }
  };

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newClubName.trim()) return;

    setCreating(true);
    try {
      let uploadedLogoUrl = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&auto=format&fit=crop&q=80';
      let uploadedCoverUrl = 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80';

      if (logoFile) {
        uploadedLogoUrl = await uploadFile(
          `communities/logos/${Date.now()}_${logoFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
          logoFile,
          (prog) => setUploadProgress(prog * 0.5)
        );
      }

      if (coverFile) {
        uploadedCoverUrl = await uploadFile(
          `communities/covers/${Date.now()}_${coverFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
          coverFile,
          (prog) => setUploadProgress(50 + prog * 0.5)
        );
      }

      // Check if user is admin/faculty to allow official status
      const canBeOfficial = (user.role === 'admin' || user.role === 'faculty') && isOfficialReq;

      const parsedRules = newClubRules
        .split('\n')
        .map(r => r.trim().replace(/^[0-9]+[.)]\s*/, ''))
        .filter(r => r.length > 0);

      const created = await createCommunity(
        {
          name: newClubName.trim(),
          category: newClubCategory,
          type: newClubType,
          description: newClubDesc.trim(),
          logoUrl: uploadedLogoUrl,
          coverUrl: uploadedCoverUrl,
          isOfficial: canBeOfficial,
          verificationStatus: canBeOfficial ? 'verified' : 'student',
          rules: parsedRules.length > 0 ? parsedRules : undefined,
          meetingTime: newClubMeeting.trim() || undefined,
          room: newClubRoom.trim() || undefined
        },
        user.id
      );

      confetti({ particleCount: 70, spread: 80 });
      success(`Community "${newClubName}" has been established!`, 'Society Registered');
      setCreateModalOpen(false);
      resetForm();
      await loadData();
      navigate(`/${user.role || 'student'}/communities/${created.id}`);
    } catch (err: any) {
      error(err.message || 'Failed to create society.');
    } finally {
      setCreating(false);
      setUploadProgress(0);
    }
  };

  // User's joined communities
  const myCommunities = useMemo(() => {
    if (!user) return [];
    return communities.filter(c => c.members.includes(user.id));
  }, [communities, user]);

  // Filtered and sorted communities
  const filteredClubs = useMemo(() => {
    return communities
      .filter(c => {
        const matchesSearch = 
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCat = selectedCategory === 'All' || c.category.toLowerCase() === selectedCategory.toLowerCase();
        return matchesSearch && matchesCat;
      })
      .sort((a, b) => {
        if (sortBy === 'popular' || sortBy === 'members') {
          return (b.memberCount || 0) - (a.memberCount || 0);
        }
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return a.name.localeCompare(b.name);
      });
  }, [communities, searchQuery, selectedCategory, sortBy]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/90 dark:border-[#1e3325] p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center text-[#0b4627] dark:text-emerald-400 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
              Clubs & Communities
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Discover student societies, technical chapters, and cultural forums at EATM.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search societies..."
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

      {/* "My Communities" Strip (If user belongs to any) */}
      {myCommunities.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50/70 via-white to-emerald-50/30 dark:from-[#132219] dark:via-[#111d15] dark:to-[#132219] rounded-2xl border border-emerald-100 dark:border-[#1e3325] p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0b4627] dark:bg-emerald-400 animate-pulse"></span>
              <h2 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                My Communities ({myCommunities.length})
              </h2>
            </div>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Quick Access</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {myCommunities.map(club => (
              <div
                key={club.id}
                onClick={() => navigate(`/${user?.role || 'student'}/communities/${club.id}`)}
                className="group bg-white dark:bg-[#16251c] rounded-xl border border-gray-200/80 dark:border-[#1f3627] p-3 hover:border-[#0b4627] dark:hover:border-emerald-500 hover:shadow-sm cursor-pointer transition-all flex items-center gap-2.5"
              >
                <img
                  src={club.logoUrl}
                  alt={club.name}
                  className="w-9 h-9 rounded-xl object-cover ring-1 ring-gray-100 dark:ring-[#1e3325] shrink-0 group-hover:scale-105 transition-transform"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-[#0b4627] dark:group-hover:text-emerald-400 transition-colors">
                    {club.name}
                  </h4>
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>Member</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Sorting Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0b4627] text-white shadow-2xs'
                    : 'bg-white dark:bg-[#111d15] text-gray-600 dark:text-gray-400 border border-gray-200/90 dark:border-[#1e3325] hover:bg-gray-50 dark:hover:bg-[#16251c]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1 text-xs font-semibold bg-white dark:bg-[#111d15] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#1e3325] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0b4627]"
          >
            <option value="popular">Popular (Most Members)</option>
            <option value="newest">Newest First</option>
            <option value="alphabetical">Alphabetical (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Grid of Active Societies */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span>Explore Societies</span>
            <span className="text-xs font-normal text-gray-500 dark:text-gray-400">({filteredClubs.length} available)</span>
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200 dark:border-[#1e3325] p-6 animate-pulse space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
                  <div className="w-16 h-5 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        ) : fetchError && communities.length === 0 ? (
          <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-rose-200 dark:border-rose-900/50 p-10 text-center shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center mb-3">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Unable to load societies directory</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
              {fetchError}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(true)}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              className="mt-4"
            >
              Retry Connection
            </Button>
          </div>
        ) : filteredClubs.length === 0 ? (
          <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200 dark:border-[#1e3325] p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-[#0b4627] dark:text-emerald-400 mx-auto flex items-center justify-center mb-3">
              <Award className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
              {searchQuery || selectedCategory !== 'All' ? 'No matching communities found' : 'No student societies established yet'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== 'All'
                ? 'No societies match your current search or category filter. Try clearing your filters or create a new student club!'
                : 'Be the first pioneer to establish and lead a student community at EATM Campus!'}
            </p>
            {searchQuery || selectedCategory !== 'All' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="mt-4"
              >
                Reset Filters
              </Button>
            ) : (
              <Button
                variant="crimson"
                size="sm"
                onClick={() => setCreateModalOpen(true)}
                icon={<Plus className="w-4 h-4" />}
                className="mt-4 font-semibold"
              >
                Create First Club
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClubs.map(club => {
              const isMember = user ? club.members.includes(user.id) : false;
              const hasPending = user ? club.pendingRequests?.includes(user.id) : false;
              const isPrivate = club.type === 'private';
              const isOwner = user && club.ownerId === user.id;

              return (
                <div
                  key={club.id}
                  onClick={() => navigate(`/${user?.role || 'student'}/communities/${club.id}`)}
                  className="group bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/90 dark:border-[#1e3325] hover:border-[#0b4627] dark:hover:border-emerald-500 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer"
                >
                  {/* Card Cover Header */}
                  <div className="relative h-24 bg-gray-100 dark:bg-[#16251c] overflow-hidden">
                    <img
                      src={club.coverUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80'}
                      alt={club.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                    
                    {/* Category & Privacy Pill on Top-Right */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                      {isPrivate ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/80 text-amber-300 backdrop-blur-md border border-amber-400/40">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Private</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/80 text-emerald-300 backdrop-blur-md border border-emerald-400/40">
                          <Globe className="w-2.5 h-2.5" />
                          <span>Public</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 pt-0 relative flex-1 flex flex-col justify-between">
                    <div>
                      {/* Logo Avatar overlapping cover */}
                      <div className="-mt-7 mb-3 flex items-end justify-between">
                        <img
                          src={club.logoUrl}
                          alt={club.name}
                          className="w-14 h-14 rounded-2xl object-cover shadow-md ring-3 ring-white dark:ring-[#111d15] bg-white"
                        />
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#0b4627] dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 uppercase tracking-wide">
                          {club.category}
                        </span>
                      </div>

                      {/* Name & Official Verification */}
                      <div className="mb-2">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-extrabold text-base text-gray-900 dark:text-gray-100 group-hover:text-[#0b4627] dark:group-hover:text-emerald-400 transition-colors leading-tight">
                            {club.name}
                          </h3>
                        </div>

                        {club.isOfficial ? (
                          <p className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 mt-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#0b4627] dark:text-emerald-400" />
                            <span>✓ EATM Verified</span>
                          </p>
                        ) : (
                          <p className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-1">
                            <span>Student Community</span>
                          </p>
                        )}
                      </div>

                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed mb-4">
                        {club.description}
                      </p>
                    </div>

                    {/* Bottom Metadata & Join Button */}
                    <div className="pt-3.5 border-t border-gray-100 dark:border-[#1e3325] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-semibold">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>{club.memberCount} members</span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleJoinToggle(e, club)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                          isMember
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/60'
                            : hasPending
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 cursor-default'
                            : 'bg-[#0b4627] hover:bg-[#0f5132] text-white shadow-xs'
                        }`}
                      >
                        {isMember ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Joined ✓</span>
                          </>
                        ) : hasPending ? (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Request Sent</span>
                          </>
                        ) : isPrivate ? (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Request</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Join</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Club Modal */}
      <Modal 
        isOpen={createModalOpen} 
        onClose={() => {
          setCreateModalOpen(false);
          resetForm();
        }} 
        title="Register a New Student Society"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateClub} className="space-y-4">
          <Input
            label="Society / Club Name *"
            placeholder="e.g. AI & Machine Learning Community"
            value={newClubName}
            onChange={(e) => setNewClubName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                Category *
              </label>
              <select
                value={newClubCategory}
                onChange={(e) => setNewClubCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-[#16251c] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#1e3325] rounded-xl focus:ring-2 focus:ring-[#0b4627] outline-none"
              >
                {CATEGORIES.filter(c => c !== 'All').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                Privacy / Access Type *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewClubType('public')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition ${
                    newClubType === 'public'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#0b4627] dark:text-emerald-300 border-[#0b4627] dark:border-emerald-500'
                      : 'bg-white dark:bg-[#16251c] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-[#1e3325]'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Public</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewClubType('private')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition ${
                    newClubType === 'private'
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-500'
                      : 'bg-white dark:bg-[#16251c] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-[#1e3325]'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Private</span>
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              Description & Objectives *
            </label>
            <textarea
              value={newClubDesc}
              onChange={(e) => setNewClubDesc(e.target.value)}
              rows={3}
              placeholder="State the mission, regular activities, target audience, and leadership goals..."
              className="w-full p-3 text-xs bg-white dark:bg-[#16251c] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#1e3325] rounded-xl focus:ring-2 focus:ring-[#0b4627] outline-none resize-none leading-relaxed"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                Meeting Schedule (Optional)
              </label>
              <input
                type="text"
                value={newClubMeeting}
                onChange={(e) => setNewClubMeeting(e.target.value)}
                placeholder="e.g. Every Wednesday at 4:30 PM"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-[#16251c] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#1e3325] rounded-xl focus:ring-2 focus:ring-[#0b4627] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                Room / Venue (Optional)
              </label>
              <input
                type="text"
                value={newClubRoom}
                onChange={(e) => setNewClubRoom(e.target.value)}
                placeholder="e.g. CS Lab 3, 2nd Floor"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-[#16251c] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#1e3325] rounded-xl focus:ring-2 focus:ring-[#0b4627] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              Community Rules (One per line)
            </label>
            <textarea
              value={newClubRules}
              onChange={(e) => setNewClubRules(e.target.value)}
              rows={2}
              placeholder="1. Respect all members and college policies.&#10;2. No spam or self-promotion."
              className="w-full p-2.5 text-xs bg-white dark:bg-[#16251c] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#1e3325] rounded-xl focus:ring-2 focus:ring-[#0b4627] outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Logo & Cover Upload Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Logo */}
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
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-gray-50 dark:bg-[#16251c] border border-gray-200 dark:border-[#1e3325]">
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-[#2b4935]"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-gray-900 dark:text-gray-100 truncate">
                      {logoFile?.name || 'Selected Logo'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="p-1 text-gray-400 hover:text-red-500 rounded-lg"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="w-full flex items-center gap-2.5 p-2.5 border border-dashed border-gray-300 dark:border-[#1e3325] hover:border-[#0b4627] rounded-xl bg-gray-50/70 dark:bg-[#16251c] text-left transition"
                >
                  <Upload className="w-4 h-4 text-[#0b4627] dark:text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Select Logo</p>
                    <p className="text-[10px] text-gray-500">PNG, JPG, WebP</p>
                  </div>
                </button>
              )}
            </div>

            {/* Cover */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Cover Banner
              </label>
              <input
                type="file"
                ref={coverInputRef}
                onChange={handleCoverSelect}
                accept="image/*"
                className="hidden"
              />

              {coverPreview ? (
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-gray-50 dark:bg-[#16251c] border border-gray-200 dark:border-[#1e3325]">
                  <img
                    src={coverPreview}
                    alt="Cover Preview"
                    className="w-14 h-10 rounded-lg object-cover border border-gray-200 dark:border-[#2b4935]"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-gray-900 dark:text-gray-100 truncate">
                      {coverFile?.name || 'Selected Banner'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={removeCover}
                    className="p-1 text-gray-400 hover:text-red-500 rounded-lg"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="w-full flex items-center gap-2.5 p-2.5 border border-dashed border-gray-300 dark:border-[#1e3325] hover:border-[#0b4627] rounded-xl bg-gray-50/70 dark:bg-[#16251c] text-left transition"
                >
                  <Upload className="w-4 h-4 text-[#0b4627] dark:text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Select Cover</p>
                    <p className="text-[10px] text-gray-500">16:9 Landscape</p>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Official Verification Toggle for Faculty / Admin */}
          {(user?.role === 'admin' || user?.role === 'faculty') && (
            <div className="p-3 bg-emerald-50/80 dark:bg-[#14261b] rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#0b4627] dark:text-emerald-400" />
                  <span>Grant Official EATM Verification</span>
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  Tag this society with the official verified badge.
                </p>
              </div>
              <input
                type="checkbox"
                checked={isOfficialReq}
                onChange={(e) => setIsOfficialReq(e.target.checked)}
                className="w-4 h-4 accent-[#0b4627] rounded cursor-pointer"
              />
            </div>
          )}

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full bg-gray-100 dark:bg-[#1e3325] rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-[#0b4627] dark:bg-emerald-500 h-1.5 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

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
              Create Community
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
