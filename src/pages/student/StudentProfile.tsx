import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { uploadFile } from '../../supabase/storage';
import { 
  fetchConnections, 
  fetchUserById, 
  fetchPostsByUser,
  fetchUserStats,
  sendConnectionRequest, 
  updateConnectionStatus, 
  cancelConnectionRequest, 
  getOrCreateConversation 
} from '../../supabase/db';
import { supabase, isSupabaseConfigured } from '../../supabase/client';
import { Post, UserProfile } from '../../types';
import { PostCard } from '../../components/posts/PostCard';
import confetti from 'canvas-confetti';
import { 
  Edit3, Calendar, Award, Code, CheckCircle, 
  ExternalLink, GraduationCap, Building2, IdCard, 
  Camera, Upload, Image as ImageIcon, Loader2,
  User, Cpu, Compass, Trophy, BookOpen, Radio,
  ArrowLeft, Check, Clock, UserPlus, MessageSquare, X,
  Plus, Trash2, Globe, Pencil, UserCheck, ShieldCheck,
  AlertCircle, RefreshCw, Sparkles, Share2
} from 'lucide-react';
import { isCustomPhoto } from '../../constants/assets';
import { Avatar } from '../../components/ui/Avatar';
import { isUserOnline, getUserLastSeen, formatLastSeen, subscribeToPresence } from '../../supabase/presence';

const DEPARTMENT_OPTIONS = [
  { label: 'Computer Science & Engineering (CSE)', value: 'CSE' },
  { label: 'CSE - Artificial Intelligence & Machine Learning (AIML)', value: 'CSE-AIML' },
  { label: 'CSE - Data Science (CSE-DS)', value: 'CSE-DS' },
  { label: 'Electronics & Communication Engineering (ECE)', value: 'ECE' },
  { label: 'Electrical & Electronics Engineering (EEE)', value: 'EEE' },
  { label: 'Mechanical Engineering (ME)', value: 'Mechanical' },
  { label: 'Civil Engineering (CE)', value: 'Civil' },
  { label: 'Master of Business Administration (MBA)', value: 'MBA' },
  { label: 'Master of Computer Applications (MCA)', value: 'MCA' },
  { label: 'Diploma in Engineering (Polytechnic)', value: 'Diploma' }
];

const YEAR_OPTIONS = [
  { label: '1st Year (Fresher)', value: '1st Year' },
  { label: '2nd Year (Sophomore)', value: '2nd Year' },
  { label: '3rd Year (Junior)', value: '3rd Year' },
  { label: '4th Year (Senior)', value: '4th Year' }
];

const SEMESTER_OPTIONS = [
  { label: '1st Semester', value: '1st' },
  { label: '2nd Semester', value: '2nd' },
  { label: '3rd Semester', value: '3rd' },
  { label: '4th Semester', value: '4th' },
  { label: '5th Semester', value: '5th' },
  { label: '6th Semester', value: '6th' },
  { label: '7th Semester', value: '7th' },
  { label: '8th Semester', value: '8th' }
];

const OFFICIAL_COVER_PRESETS = [
  {
    name: 'Academic Campus',
    url: 'https://images.unsplash.com/photo-1562774053-701939374585?w=1600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Innovation Tech Lab',
    url: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Central Digital Library',
    url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Campus Lawns & Greenery',
    url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&auto=format&fit=crop&q=80'
  }
];

export const StudentProfile: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { success, error: toastError } = useToast();

  const isOwnProfile = !id || id === user?.id || id === user?.uid;

  const [viewedUser, setViewedUser] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(!isOwnProfile);
  const [profileFetchError, setProfileFetchError] = useState<string | null>(null);

  const [connectionInfo, setConnectionInfo] = useState<{
    status: 'connected' | 'pending_sent' | 'pending_received' | 'none';
    connectionId?: string;
  }>({ status: 'none' });
  const [connecting, setConnecting] = useState(false);

  // Dynamic profile statistics
  const [stats, setStats] = useState<{
    connections: number;
    posts: number;
    clubs: number;
    achievements: number;
  }>({ connections: 0, posts: 0, clubs: 0, achievements: 0 });

  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Edit form state
  const [displayName, setDisplayName] = useState('');
  const [department, setDepartment] = useState('CSE');
  const [year, setYear] = useState('3rd Year');
  const [semester, setSemester] = useState('6th');
  const [rollNumber, setRollNumber] = useState('EATM23CSE001');
  const [bio, setBio] = useState('');
  const [skillsStr, setSkillsStr] = useState('');
  const [interestsStr, setInterestsStr] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [coverURL, setCoverURL] = useState('');
  const [saving, setSaving] = useState(false);

  // Upload state
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [photoProgress, setPhotoProgress] = useState(0);
  const [coverProgress, setCoverProgress] = useState(0);

  // File input refs
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);
  const modalAvatarFileRef = useRef<HTMLInputElement>(null);
  const modalCoverFileRef = useRef<HTMLInputElement>(null);

  // User posts state
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Projects management state
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProjectIdx, setEditingProjectIdx] = useState<number | null>(null);
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    link: '',
    technologies: ''
  });
  const [savingProject, setSavingProject] = useState(false);

  // Honors & Achievements management state
  const [achievementModalOpen, setAchievementModalOpen] = useState(false);
  const [editingAchievementIdx, setEditingAchievementIdx] = useState<number | null>(null);
  const [achievementForm, setAchievementForm] = useState({
    title: '',
    description: '',
    date: ''
  });
  const [savingAchievement, setSavingAchievement] = useState(false);

  // Delete confirmation modal state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'project' | 'achievement' | null;
    idx: number | null;
    title: string;
  }>({ type: null, idx: null, title: '' });

  const activeUser = isOwnProfile ? user : viewedUser;

  // Load user posts targeted by author ID respecting visibility
  const loadUserPosts = useCallback(async (targetUserId: string) => {
    if (!targetUserId) return;
    setLoadingPosts(true);
    try {
      const posts = await fetchPostsByUser(targetUserId, user?.id);
      setUserPosts(posts);
    } catch (e) {
      console.error('Failed to load user posts:', e);
    } finally {
      setLoadingPosts(false);
    }
  }, [user?.id]);

  // Load dynamic profile stats
  const loadUserStats = useCallback(async (targetUserId: string) => {
    if (!targetUserId) return;
    try {
      const liveStats = await fetchUserStats(targetUserId);
      setStats(liveStats);
    } catch (e) {
      console.warn('Failed to load live stats:', e);
    }
  }, []);

  // Fetch profile and connection state
  const loadProfile = useCallback(async () => {
    setProfileFetchError(null);

    if (isOwnProfile) {
      setViewedUser(null);
      setLoadingProfile(false);
      if (user) {
        setDisplayName(user.displayName || '');
        setDepartment(user.department || 'CSE');
        setYear(user.year || '3rd Year');
        setSemester(user.semester || '6th');
        setRollNumber(user.rollNumber || 'EATM23CSE001');
        setBio(user.bio || '');
        setSkillsStr(user.skills?.join(', ') || '');
        setInterestsStr(user.interests?.join(', ') || '');
        setPhotoURL(user.photoURL || '');
        setCoverURL(user.coverURL || '');
        loadUserPosts(user.id);
        loadUserStats(user.id);
      }
    } else if (id) {
      setLoadingProfile(true);
      try {
        const target = await fetchUserById(id);
        if (!target) {
          setViewedUser(null);
          setLoadingProfile(false);
          return;
        }

        setViewedUser(target);
        setLoadingProfile(false);

        loadUserPosts(target.id);
        loadUserStats(target.id);

        if (user) {
          try {
            const conns = await fetchConnections(user.id);
            const conn = conns.find(c => 
              (c.requesterId === user.id && c.recipientId === target.id) ||
              (c.requesterId === target.id && c.recipientId === user.id)
            );
            if (conn) {
              if (conn.status === 'accepted') {
                setConnectionInfo({ status: 'connected', connectionId: conn.id });
              } else if (conn.requesterId === user.id) {
                setConnectionInfo({ status: 'pending_sent', connectionId: conn.id });
              } else {
                setConnectionInfo({ status: 'pending_received', connectionId: conn.id });
              }
            } else {
              setConnectionInfo({ status: 'none' });
            }
          } catch (connErr) {
            console.warn('Failed to fetch connection status:', connErr);
          }
        }
      } catch (err: any) {
        console.error('Error fetching target profile:', err);
        setProfileFetchError(err.message || 'Could not load student profile.');
        setLoadingProfile(false);
      }
    }
  }, [id, user, isOwnProfile, loadUserPosts, loadUserStats]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Realtime subscription for live profile updates across browsers
  useEffect(() => {
    const targetId = isOwnProfile ? user?.id : id;
    if (!targetId || !isSupabaseConfigured() || !supabase) return;

    const channel = supabase
      .channel(`profile-sync-${targetId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${targetId}`
        },
        (payload) => {
          if (payload.new) {
            const updated = payload.new as UserProfile;
            if (!isOwnProfile) {
              setViewedUser(prev => prev ? ({ ...prev, ...updated }) : updated);
            }
          }
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [id, user?.id, isOwnProfile]);

  // Presence subscription
  const [, setPresenceTick] = useState(0);
  useEffect(() => {
    const unsub = subscribeToPresence(() => {
      setPresenceTick(t => t + 1);
    });
    return () => unsub();
  }, []);

  // Connection Handlers
  const handleConnect = async () => {
    if (!user || !activeUser) return;
    setConnecting(true);
    try {
      const newConn = await sendConnectionRequest(user.id, activeUser.id);
      setConnectionInfo({ status: 'pending_sent', connectionId: newConn.id });
      success(`Connection request sent to ${activeUser.displayName}!`, 'Request Sent');
    } catch (err: any) {
      toastError(err?.message || 'Could not send connection request.');
    } finally {
      setConnecting(false);
    }
  };

  const handleAcceptConnection = async () => {
    if (!user || !connectionInfo.connectionId) return;
    setConnecting(true);
    try {
      await updateConnectionStatus(connectionInfo.connectionId, 'accepted', user.id);
      setConnectionInfo(prev => ({ ...prev, status: 'connected' }));
      success(`You and ${activeUser?.displayName} are now campus connections!`, 'Connected');
      setStats(prev => ({ ...prev, connections: prev.connections + 1 }));
    } catch (err: any) {
      toastError(err?.message || 'Could not accept connection request.');
    } finally {
      setConnecting(false);
    }
  };

  const handleRejectConnection = async () => {
    if (!user || !connectionInfo.connectionId) return;
    setConnecting(true);
    try {
      await updateConnectionStatus(connectionInfo.connectionId, 'rejected', user.id);
      setConnectionInfo({ status: 'none' });
      success('Connection request declined.', 'Declined');
    } catch (err: any) {
      toastError(err?.message || 'Could not decline connection request.');
    } finally {
      setConnecting(false);
    }
  };

  const handleCancelConnection = async () => {
    if (!user || !connectionInfo.connectionId) return;
    setConnecting(true);
    try {
      await cancelConnectionRequest(connectionInfo.connectionId, user.id);
      setConnectionInfo({ status: 'none' });
      success('Connection request withdrawn.', 'Cancelled');
    } catch (err: any) {
      toastError(err?.message || 'Could not cancel connection request.');
    } finally {
      setConnecting(false);
    }
  };

  const handleStartDirectChat = async () => {
    if (!user || !activeUser) return;
    try {
      const conv = await getOrCreateConversation(user.id, activeUser.id);
      navigate('/student/messages', { state: { conversationId: conv.id } });
    } catch (err: any) {
      toastError(err.message || 'Could not initiate conversation.');
      navigate('/student/messages');
    }
  };

  const effectivePhoto = isCustomPhoto(activeUser?.photoURL) ? activeUser?.photoURL : undefined;

  const handleOpenEdit = () => {
    if (!user) return;
    setDisplayName(user.displayName || '');
    setDepartment(user.department || 'CSE');
    setYear(user.year || '3rd Year');
    setSemester(user.semester || '6th');
    setRollNumber(user.rollNumber || 'EATM23CSE001');
    setBio(user.bio || '');
    setSkillsStr(user.skills?.join(', ') || '');
    setInterestsStr(user.interests?.join(', ') || '');
    setPhotoURL(isCustomPhoto(user.photoURL) ? (user.photoURL || '') : '');
    setCoverURL(user.coverURL || '');
    setEditModalOpen(true);
  };

  // Avatar Upload Handler
  const handleAvatarUpload = async (file: File, isModal = false) => {
    if (!file || !user) return;
    setUploadingPhoto(true);
    setPhotoProgress(0);
    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const url = await uploadFile(
        `profiles/${user.id}/avatar_${Date.now()}_${sanitizedName}`,
        file,
        (p) => setPhotoProgress(p)
      );
      setPhotoURL(url);
      await updateUser({ photoURL: url });
      success('Profile photo updated successfully in Supabase Storage!', 'Photo Updated');
    } catch (err: any) {
      console.error(err);
      toastError(err?.message || 'Failed to upload profile photo to storage.');
    } finally {
      setUploadingPhoto(false);
      setPhotoProgress(0);
    }
  };

  // Cover Upload Handler
  const handleCoverUpload = async (file: File, isModal = false) => {
    if (!file || !user) return;
    setUploadingCover(true);
    setCoverProgress(0);
    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const url = await uploadFile(
        `profiles/${user.id}/cover_${Date.now()}_${sanitizedName}`,
        file,
        (p) => setCoverProgress(p)
      );
      setCoverURL(url);
      if (!isModal) {
        await updateUser({ coverURL: url });
        success('Cover banner updated successfully!', 'Cover Updated');
      } else {
        success('Cover image uploaded and ready to save!', 'Upload Ready');
      }
    } catch (err: any) {
      console.error(err);
      toastError(err?.message || 'Failed to upload cover banner.');
    } finally {
      setUploadingCover(false);
      setCoverProgress(0);
    }
  };

  // Profile Save Handler (Authoritative Supabase)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await updateUser({
        displayName: displayName.trim(),
        department,
        year,
        semester,
        bio: bio.trim(),
        skills: skillsStr.split(',').map(s => s.trim()).filter(Boolean),
        interests: interestsStr.split(',').map(i => i.trim()).filter(Boolean),
        photoURL: isCustomPhoto(photoURL) ? photoURL : (isCustomPhoto(user.photoURL) ? user.photoURL : undefined),
        coverURL
      });
      success('Student profile updated securely in Supabase!', 'Changes Saved');
      setEditModalOpen(false);
    } catch (err: any) {
      toastError(err?.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  // --- Project Management Actions ---
  const openAddProjectModal = () => {
    setEditingProjectIdx(null);
    setProjectForm({
      title: '',
      description: '',
      link: '',
      technologies: ''
    });
    setProjectModalOpen(true);
  };

  const openEditProjectModal = (idx: number) => {
    const proj = activeUser?.projects?.[idx];
    if (!proj) return;
    setEditingProjectIdx(idx);
    setProjectForm({
      title: proj.title || '',
      description: proj.description || '',
      link: proj.link || '',
      technologies: (proj.technologies || []).join(', ')
    });
    setProjectModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeUser) return;
    if (!projectForm.title.trim()) {
      toastError('Project title is required.');
      return;
    }
    if (!projectForm.description.trim()) {
      toastError('Project description is required.');
      return;
    }

    setSavingProject(true);
    try {
      const currentProjects = activeUser.projects ? [...activeUser.projects] : [];
      const techList = projectForm.technologies
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      let cleanLink = projectForm.link.trim();
      if (cleanLink && !/^https?:\/\//i.test(cleanLink)) {
        cleanLink = `https://${cleanLink}`;
      }

      const itemData = {
        title: projectForm.title.trim(),
        description: projectForm.description.trim(),
        link: cleanLink || undefined,
        technologies: techList.length > 0 ? techList : ['Engineering Project']
      };

      let updatedProjects: typeof currentProjects;
      if (editingProjectIdx !== null && editingProjectIdx >= 0 && editingProjectIdx < currentProjects.length) {
        updatedProjects = [...currentProjects];
        updatedProjects[editingProjectIdx] = itemData;
      } else {
        updatedProjects = [itemData, ...currentProjects];
      }

      await updateUser({ projects: updatedProjects });
      confetti({ particleCount: 35, spread: 55, origin: { y: 0.7 } });
      success(
        editingProjectIdx !== null
          ? 'Project updated in portfolio!'
          : 'Project added to portfolio!',
        'Project Saved'
      );
      setProjectModalOpen(false);
    } catch (err: any) {
      toastError(err?.message || 'Failed to save project.');
    } finally {
      setSavingProject(false);
    }
  };

  const confirmDeleteProject = async (idx: number) => {
    if (!user || !activeUser) return;
    try {
      const currentProjects = activeUser.projects ? [...activeUser.projects] : [];
      const updatedProjects = currentProjects.filter((_, i) => i !== idx);
      await updateUser({ projects: updatedProjects });
      success('Project removed from portfolio.', 'Project Deleted');
      setDeleteConfirm({ type: null, idx: null, title: '' });
    } catch (err: any) {
      toastError(err?.message || 'Failed to remove project.');
    }
  };

  // --- Honor & Achievement Actions ---
  const openAddAchievementModal = () => {
    setEditingAchievementIdx(null);
    setAchievementForm({
      title: '',
      description: '',
      date: new Date().getFullYear().toString()
    });
    setAchievementModalOpen(true);
  };

  const openEditAchievementModal = (idx: number) => {
    const ach = activeUser?.achievements?.[idx];
    if (!ach) return;
    setEditingAchievementIdx(idx);
    setAchievementForm({
      title: ach.title || '',
      description: ach.description || '',
      date: ach.date || ''
    });
    setAchievementModalOpen(true);
  };

  const handleSaveAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeUser) return;
    if (!achievementForm.title.trim()) {
      toastError('Honor / Award title is required.');
      return;
    }
    if (!achievementForm.description.trim()) {
      toastError('Achievement citation is required.');
      return;
    }

    setSavingAchievement(true);
    try {
      const currentAch = activeUser.achievements ? [...activeUser.achievements] : [];
      const itemData = {
        title: achievementForm.title.trim(),
        description: achievementForm.description.trim(),
        date: achievementForm.date.trim() || new Date().getFullYear().toString()
      };

      let updatedAch: typeof currentAch;
      if (editingAchievementIdx !== null && editingAchievementIdx >= 0 && editingAchievementIdx < currentAch.length) {
        updatedAch = [...currentAch];
        updatedAch[editingAchievementIdx] = itemData;
      } else {
        updatedAch = [itemData, ...currentAch];
      }

      await updateUser({
        achievements: updatedAch
      });
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
      success(
        editingAchievementIdx !== null
          ? 'Honor & Distinction record updated!'
          : 'Achievement cataloged in your campus record!',
        'Honor Saved'
      );
      setAchievementModalOpen(false);
      setStats(prev => ({ ...prev, achievements: updatedAch.length }));
    } catch (err: any) {
      toastError(err?.message || 'Failed to save achievement.');
    } finally {
      setSavingAchievement(false);
    }
  };

  const confirmDeleteAchievement = async (idx: number) => {
    if (!user || !activeUser) return;
    try {
      const currentAch = activeUser.achievements ? [...activeUser.achievements] : [];
      const updatedAch = currentAch.filter((_, i) => i !== idx);
      await updateUser({
        achievements: updatedAch
      });
      success('Honor removed from records.', 'Achievement Removed');
      setDeleteConfirm({ type: null, idx: null, title: '' });
      setStats(prev => ({ ...prev, achievements: updatedAch.length }));
    } catch (err: any) {
      toastError(err?.message || 'Failed to remove achievement.');
    }
  };

  // Loading View
  if (loadingProfile) {
    return (
      <div className="max-w-5xl mx-auto p-12 text-center bg-white dark:bg-[#111d15] rounded-3xl border border-gray-200/80 dark:border-[#1e3325] shadow-xs space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#0b4627] dark:text-emerald-400" />
        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Loading Student Profile...</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Fetching verified academic credentials and portfolio records</p>
      </div>
    );
  }

  // Error State
  if (profileFetchError) {
    return (
      <div className="max-w-xl mx-auto p-10 text-center bg-white dark:bg-[#111d15] rounded-3xl border border-red-200/80 dark:border-red-900/40 shadow-xs space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-black text-gray-900 dark:text-gray-100">Database Connection Issue</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">{profileFetchError}</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadProfile} icon={<RefreshCw className="w-3.5 h-3.5" />}>
          Retry Connection
        </Button>
      </div>
    );
  }

  // Not Found View
  if (!activeUser) {
    return (
      <div className="max-w-xl mx-auto p-12 text-center bg-white dark:bg-[#111d15] rounded-3xl border border-gray-200/80 dark:border-[#1e3325] shadow-xs space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-[#16251c] text-gray-500 dark:text-gray-400 flex items-center justify-center mx-auto">
          <User className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-black text-gray-900 dark:text-gray-100">Student Profile Not Found</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
          The requested campus scholar does not exist or may have been updated.
        </p>
        <Button variant="primary" size="sm" onClick={() => navigate('/student/discover')}>
          Explore Campus Directory
        </Button>
      </div>
    );
  }

  // Privacy Gating Enforcement
  const isProfilePrivate = !isOwnProfile && activeUser.settings?.privacy?.profileVisibility === 'private';
  const isConnectionsOnlyRestricted = !isOwnProfile && 
    activeUser.settings?.privacy?.profileVisibility === 'connections' && 
    connectionInfo.status !== 'connected';

  if (isProfilePrivate) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#111d15] border border-gray-200/80 dark:border-[#1e3325] text-xs font-bold text-gray-700 dark:text-gray-200 shadow-xs hover:bg-gray-50 dark:hover:bg-[#16251c] transition active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="p-8 sm:p-12 text-center bg-white dark:bg-[#111d15] rounded-3xl border border-gray-200/80 dark:border-[#1e3325] shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-[#16251c] text-[#0b4627] dark:text-emerald-400 flex items-center justify-center mx-auto">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black text-gray-900 dark:text-gray-100">{activeUser.displayName}</h2>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            {activeUser.department} • EATM CampusConnect
          </p>
          <div className="max-w-sm mx-auto p-3.5 rounded-2xl bg-gray-50 dark:bg-[#16251c] border border-gray-200/60 dark:border-[#1e3325] text-xs text-gray-600 dark:text-gray-300">
            🔒 This user has set their profile to <strong>Private</strong>. Only basic directory info is visible.
          </div>
        </div>
      </div>
    );
  }

  if (isConnectionsOnlyRestricted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#111d15] border border-gray-200/80 dark:border-[#1e3325] text-xs font-bold text-gray-700 dark:text-gray-200 shadow-xs hover:bg-gray-50 dark:hover:bg-[#16251c] transition active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="p-8 sm:p-12 text-center bg-white dark:bg-[#111d15] rounded-3xl border border-gray-200/80 dark:border-[#1e3325] shadow-xs space-y-4">
          <div className="w-20 h-20 rounded-full mx-auto overflow-hidden ring-4 ring-emerald-100 dark:ring-emerald-950">
            <Avatar src={effectivePhoto} name={activeUser.displayName} size="xl" className="w-full h-full" />
          </div>
          <h2 className="text-lg font-black text-gray-900 dark:text-gray-100">{activeUser.displayName}</h2>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            {activeUser.department} • EATM Student Scholar
          </p>
          <div className="max-w-sm mx-auto p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300">
            🤝 This profile is visible to <strong>Connections only</strong>. Connect with {activeUser.displayName} to view their full portfolio, academic credentials, and projects.
          </div>
          <div className="pt-2 flex justify-center">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleConnect}
              isLoading={connecting}
              disabled={connectionInfo.status === 'pending_sent'}
            >
              {connectionInfo.status === 'pending_sent' ? 'Connection Request Sent' : 'Connect with Student'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 px-3 sm:px-6">
      {/* Top Back Navigation (When viewing someone else) */}
      {!isOwnProfile && (
        <div className="flex items-center justify-between pb-1">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#111d15] border border-gray-200/80 dark:border-[#1e3325] text-xs font-bold text-gray-700 dark:text-gray-200 shadow-xs hover:bg-gray-50 dark:hover:bg-[#16251c] transition active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>
      )}

      {/* Main Profile Header Card */}
      <div className="bg-white dark:bg-[#111d15] rounded-3xl border border-gray-200/80 dark:border-[#1e3325] shadow-xs overflow-hidden transition-colors">
        {/* Cover Photo Banner */}
        <div className="h-44 sm:h-56 md:h-64 relative bg-emerald-950 overflow-hidden group">
          <img
            src={activeUser.coverURL || 'https://images.unsplash.com/photo-1562774053-701939374585?w=1600&auto=format&fit=crop&q=80'}
            alt="Campus Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          {/* Institutional Emblem Badge Top-Right */}
          <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white text-[11px] font-semibold">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>EATM Digital Campus</span>
          </div>

          {/* Quick Cover Change Action (Own profile only) */}
          {isOwnProfile && (
            <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 z-10">
              <input
                type="file"
                ref={coverFileRef}
                onChange={(e) => {
                  if (e.target.files?.[0]) handleCoverUpload(e.target.files[0], false);
                }}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => coverFileRef.current?.click()}
                disabled={uploadingCover}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs font-semibold transition shadow-sm active:scale-95 disabled:opacity-50"
              >
                {uploadingCover ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    <span>Uploading... {coverProgress}%</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Change Cover</span>
                    <span className="sm:hidden">Cover</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Profile Content Section */}
        <div className="px-5 sm:px-8 pb-6 sm:pb-8 pt-0">
          {/* Avatar & Primary Action Bar */}
          <div className="flex items-end justify-between -mt-14 sm:-mt-20 mb-4 gap-3 sm:gap-4 flex-wrap">
            {/* Avatar with Thick Ring & Upload Button */}
            <div className="relative group shrink-0">
              {isOwnProfile && (
                <input
                  type="file"
                  ref={avatarFileRef}
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleAvatarUpload(e.target.files[0], false);
                  }}
                  accept="image/*"
                  className="hidden"
                />
              )}
              <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-full ring-4 ring-white dark:ring-[#111d15] shadow-lg overflow-hidden bg-white dark:bg-[#16251c] flex items-center justify-center relative">
                <Avatar
                  src={effectivePhoto}
                  name={activeUser.displayName}
                  size="2xl"
                  online={!isOwnProfile && isUserOnline(activeUser.id)}
                  className="w-full h-full"
                />
                {uploadingPhoto && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white text-[10px] font-bold z-10">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-400 mb-1" />
                    <span>{photoProgress}%</span>
                  </div>
                )}
              </div>

              {/* Direct Camera Button on Avatar (Own profile only) */}
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => avatarFileRef.current?.click()}
                  disabled={uploadingPhoto}
                  title="Upload Profile Photo"
                  className="absolute bottom-1 right-1 p-2 rounded-full bg-[#0b4627] hover:bg-emerald-800 text-white shadow-md border-2 border-white dark:border-[#111d15] transition hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Header Action Buttons */}
            <div className="pb-1 sm:pb-2 shrink-0 flex items-center gap-2">
              {isOwnProfile ? (
                <button
                  type="button"
                  onClick={handleOpenEdit}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-100 bg-white dark:bg-[#16251c] border border-gray-300 dark:border-emerald-700/40 hover:bg-gray-50 dark:hover:bg-[#1e3426] hover:border-emerald-600/60 shadow-xs active:scale-95 transition"
                >
                  <Edit3 className="w-4 h-4 text-[#0b4627] dark:text-emerald-400" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  {connectionInfo.status === 'connected' ? (
                    <>
                      <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300/60 dark:border-emerald-800/60 select-none">
                        <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Connected</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleStartDirectChat}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#0b4627] hover:bg-[#08351d] text-white shadow-xs active:scale-95 transition"
                      >
                        <MessageSquare className="w-4 h-4 text-emerald-200" />
                        <span>Message</span>
                      </button>
                    </>
                  ) : connectionInfo.status === 'pending_received' ? (
                    <>
                      <button
                        type="button"
                        disabled={connecting}
                        onClick={handleAcceptConnection}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#0b4627] hover:bg-[#08351d] text-white shadow-xs active:scale-95 transition disabled:opacity-50"
                      >
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>Accept</span>
                      </button>
                      <button
                        type="button"
                        disabled={connecting}
                        onClick={handleRejectConnection}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-[#16251c] border border-gray-300 dark:border-[#2a4533] hover:bg-gray-50 shadow-xs active:scale-95 transition disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        <span>Ignore</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleStartDirectChat}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 bg-white dark:bg-[#16251c] border border-gray-300 dark:border-[#2a4533] hover:bg-gray-50 shadow-xs active:scale-95 transition"
                      >
                        <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Message</span>
                      </button>
                    </>
                  ) : connectionInfo.status === 'pending_sent' ? (
                    <>
                      <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-300/60 dark:border-amber-800/60 select-none">
                        <Clock className="w-4 h-4" />
                        <span>Pending</span>
                      </div>
                      <button
                        type="button"
                        disabled={connecting}
                        onClick={handleCancelConnection}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-[#16251c] border border-gray-300 dark:border-[#2a4533] hover:bg-gray-50 hover:text-red-600 shadow-xs active:scale-95 transition disabled:opacity-50"
                        title="Cancel Request"
                      >
                        <X className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleStartDirectChat}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 bg-white dark:bg-[#16251c] border border-gray-300 dark:border-[#2a4533] hover:bg-gray-50 shadow-xs active:scale-95 transition"
                      >
                        <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Message</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={connecting}
                        onClick={handleConnect}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#0b4627] hover:bg-[#08351d] text-white shadow-xs active:scale-95 transition disabled:opacity-50"
                      >
                        <UserPlus className="w-4 h-4 text-emerald-200" />
                        <span>Connect</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleStartDirectChat}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 bg-white dark:bg-[#16251c] border border-gray-300 dark:border-[#2a4533] hover:bg-gray-50 shadow-xs active:scale-95 transition"
                      >
                        <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Message</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Student Identity & Academic Details */}
          <div className="space-y-3">
            {/* Full Name & Verified Badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                {activeUser.displayName}
              </h1>
              {activeUser.verified && (
                <span title="Verified EATM Campus Member" className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-300/50 dark:border-emerald-800/60">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Verified</span>
                </span>
              )}
            </div>

            {/* Unified Academic Metadata Group (Clean EATM styling without excessive badges) */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-gray-600 dark:text-gray-300 pt-0.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-[#16251c] border border-gray-200/80 dark:border-[#1e3325] font-semibold">
                <GraduationCap className="w-3.5 h-3.5 text-[#0b4627] dark:text-emerald-400 shrink-0" />
                <span>{activeUser.department}</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-[#16251c] border border-gray-200/80 dark:border-[#1e3325] font-semibold">
                <Calendar className="w-3.5 h-3.5 text-[#0b4627] dark:text-emerald-400 shrink-0" />
                <span>{activeUser.year || '3rd Year'} {(isOwnProfile || activeUser.settings?.privacy?.showSemester !== false) && activeUser.semester ? `• Sem ${activeUser.semester}` : ''}</span>
              </div>

              {activeUser.rollNumber && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 font-mono font-bold text-emerald-800 dark:text-emerald-300">
                  <IdCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{activeUser.rollNumber}</span>
                </div>
              )}

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-[#16251c] border border-gray-200/80 dark:border-[#1e3325] font-medium text-gray-500 dark:text-gray-400">
                <Building2 className="w-3.5 h-3.5 text-[#0b4627] dark:text-emerald-400 shrink-0" />
                <span>Einstein Academy of Technology & Management</span>
              </div>

              {!isOwnProfile && (
                isUserOnline(activeUser.id) ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300/80 dark:border-emerald-800/80 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Online</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center px-2.5 py-1 rounded-xl bg-gray-50 dark:bg-[#16251c] border border-gray-200/80 dark:border-[#1e3325] text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    <span>{formatLastSeen(activeUser.lastSeen || getUserLastSeen(activeUser.id))}</span>
                  </div>
                )
              )}
            </div>

            {/* Short Bio */}
            {activeUser.bio && (
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 pt-1 leading-relaxed max-w-3xl">
                {activeUser.bio}
              </p>
            )}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3.5 mt-5 border-y border-gray-100 dark:border-[#1e3325] text-center bg-gray-50/50 dark:bg-[#16251c]/40 rounded-2xl">
            <div>
              <div className="text-lg sm:text-xl font-black text-gray-900 dark:text-gray-100">
                {stats.connections}
              </div>
              <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Connections</div>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-black text-gray-900 dark:text-gray-100">
                {userPosts.length > 0 ? userPosts.length : stats.posts}
              </div>
              <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Posts</div>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-black text-gray-900 dark:text-gray-100">
                {stats.clubs}
              </div>
              <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Clubs</div>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-black text-gray-900 dark:text-gray-100">
                {activeUser.achievements ? activeUser.achievements.length : stats.achievements}
              </div>
              <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Achievements</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: About, Skills, Interests */}
        <div className="space-y-6">
          {/* About Me */}
          <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/80 dark:border-[#1e3325] p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-xs text-gray-900 dark:text-gray-100 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-[#0b4627] dark:text-emerald-400" />
              <span>About Scholar</span>
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {activeUser.bio || 'Passionate engineer learning and building technical systems at Einstein Academy of Technology & Management.'}
            </p>
          </div>

          {/* Skills & Technologies */}
          <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/80 dark:border-[#1e3325] p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-xs text-gray-900 dark:text-gray-100 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#0b4627] dark:text-emerald-400" />
              <span>Skills & Technologies</span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {activeUser.skills && activeUser.skills.length > 0 ? (
                activeUser.skills.map(skill => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-[#0b4627] dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-xs text-gray-400">No skills added yet.</p>
              )}
            </div>
          </div>

          {/* Interests & Societies */}
          {(isOwnProfile || activeUser.settings?.privacy?.showInterests !== false) && (
            <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/80 dark:border-[#1e3325] p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-xs text-gray-900 dark:text-gray-100 uppercase tracking-wider flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#0b4627] dark:text-emerald-400" />
                <span>Interests & Clubs</span>
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {activeUser.interests && activeUser.interests.length > 0 ? (
                  activeUser.interests.map(int => (
                    <span
                      key={int}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-[#16251c] text-gray-700 dark:text-gray-300 border border-gray-200/60 dark:border-[#1e3325]"
                    >
                      {int}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-gray-400">No interests listed.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (2-Cols): Projects, Achievements, Posts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Featured Projects & Portfolio */}
          {(isOwnProfile || activeUser.settings?.privacy?.showProjects !== false) && (
            <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/80 dark:border-[#1e3325] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-[#0b4627] dark:text-emerald-400">
                    <Code className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <span>Technical Portfolio & Projects</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100/70 dark:bg-emerald-950/70 text-[#0b4627] dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                      {activeUser.projects?.length || 0}
                    </span>
                  </h3>
                </div>

                {isOwnProfile && (
                  <button
                    type="button"
                    onClick={openAddProjectModal}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl text-[#0b4627] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200/80 dark:border-emerald-800/80 transition shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Project</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {activeUser.projects && activeUser.projects.length > 0 ? (
                  activeUser.projects.map((proj, idx) => (
                    <div
                      key={idx}
                      className="group relative p-4 rounded-xl border border-gray-100 dark:border-[#1e3325] bg-gray-50/60 dark:bg-[#16251c]/60 hover:border-emerald-300 dark:hover:border-emerald-700/60 transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 group-hover:text-[#0b4627] dark:group-hover:text-emerald-400 transition">
                              {proj.title}
                            </h4>
                            {proj.link && (
                              <a
                                href={proj.link}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline bg-emerald-50/80 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60"
                                title="Open Project Link"
                              >
                                <Globe className="w-3 h-3" />
                                <span>View Code</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Owner Edit Actions */}
                        {isOwnProfile && (
                          <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition">
                            <button
                              type="button"
                              onClick={() => openEditProjectModal(idx)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-[#111d15] transition"
                              title="Edit Project"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm({ type: 'project', idx, title: proj.title })}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-[#111d15] transition"
                              title="Delete Project"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 leading-relaxed whitespace-pre-line">
                        {proj.description}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-gray-100 dark:border-[#1e3325]">
                        {proj.technologies && proj.technologies.map((t, tIdx) => (
                          <span
                            key={tIdx}
                            className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 bg-white dark:bg-[#111d15] rounded-md border border-gray-200/80 dark:border-[#1e3325] text-gray-700 dark:text-gray-300"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 border border-dashed border-gray-200 dark:border-[#1e3325] rounded-xl text-gray-400">
                    <p className="text-xs font-medium">
                      {isOwnProfile ? 'No featured projects added yet.' : 'No technical projects listed.'}
                    </p>
                    {isOwnProfile && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={openAddProjectModal}
                        icon={<Plus className="w-3.5 h-3.5" />}
                        className="mt-2.5"
                      >
                        Add Project
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Campus Honors & Achievements */}
          {(isOwnProfile || activeUser.settings?.privacy?.showAchievements !== false) && (
            <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/80 dark:border-[#1e3325] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                    <Award className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <span>Honors & Achievements</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100/70 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                      {activeUser.achievements?.length || 0}
                    </span>
                  </h3>
                </div>

                {isOwnProfile && (
                  <button
                    type="button"
                    onClick={openAddAchievementModal}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200/80 dark:border-amber-800/80 transition shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Honor</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {activeUser.achievements && activeUser.achievements.length > 0 ? (
                  activeUser.achievements.map((ach, idx) => (
                    <div
                      key={idx}
                      className="group relative flex items-start gap-3.5 p-4 rounded-xl border border-amber-100/90 dark:border-[#1e3325] bg-gradient-to-r from-amber-50/30 via-white to-transparent dark:from-amber-950/20 dark:via-[#16251c]/40 dark:to-transparent hover:border-amber-300 dark:hover:border-amber-800/60 transition"
                    >
                      <div className="p-2.5 rounded-xl bg-amber-100/80 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/40 shrink-0">
                        <Trophy className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                              {ach.title}
                            </h4>
                            {ach.date && (
                              <span className="inline-block text-[11px] font-semibold text-amber-700 dark:text-amber-400 mt-0.5">
                                • {ach.date}
                              </span>
                            )}
                          </div>

                          {/* Owner Actions */}
                          {isOwnProfile && (
                            <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition">
                              <button
                                type="button"
                                onClick={() => openEditAchievementModal(idx)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-amber-700 dark:hover:text-amber-400 hover:bg-white dark:hover:bg-[#111d15] transition"
                                title="Edit Honor"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirm({ type: 'achievement', idx, title: ach.title })}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-[#111d15] transition"
                                title="Delete Honor"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed whitespace-pre-line">
                          {ach.description}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 border border-dashed border-gray-200 dark:border-[#1e3325] rounded-xl text-gray-400">
                    <p className="text-xs font-medium">
                      {isOwnProfile ? 'No campus honors cataloged yet.' : 'No honors recorded.'}
                    </p>
                    {isOwnProfile && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={openAddAchievementModal}
                        icon={<Plus className="w-3.5 h-3.5" />}
                        className="mt-2.5"
                      >
                        Add Honor
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Published Posts */}
          <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/80 dark:border-[#1e3325] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#0b4627] dark:text-emerald-400" />
                <span>{isOwnProfile ? 'My Published Posts' : `${activeUser.displayName}'s Posts`} ({userPosts.length})</span>
              </h3>
            </div>

            {loadingPosts ? (
              <p className="text-xs text-gray-400 py-4 text-center">Loading campus posts...</p>
            ) : userPosts.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-gray-200 dark:border-[#1e3325] rounded-xl text-gray-400">
                <p className="text-xs font-medium">
                  {isOwnProfile ? "You haven't published any posts yet." : "No posts published yet."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {userPosts.map(p => (
                  <PostCard 
                    key={p.id} 
                    post={p} 
                    onPostDeleted={() => activeUser && loadUserPosts(activeUser.id)} 
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Edit Profile Modal */}
      {isOwnProfile && (
        <Modal 
          isOpen={editModalOpen} 
          onClose={() => setEditModalOpen(false)} 
          title="Edit Student Profile"
          maxWidth="lg"
        >
          <form onSubmit={handleSaveProfile} className="space-y-5 max-h-[78vh] overflow-y-auto pr-1">
            {/* SECTION 1: Academic Information */}
            <div className="bg-gray-50/70 dark:bg-[#16251c]/60 p-4 rounded-2xl border border-gray-200/70 dark:border-[#1e3325] space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0b4627] dark:text-emerald-400 uppercase tracking-wider">
                <GraduationCap className="w-4 h-4" />
                <span>Academic Information</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Full Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Student Full Name"
                  required
                />
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Official Roll Number
                  </label>
                  <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800/80 border border-gray-200 dark:border-[#1e3325] font-mono text-xs font-bold text-gray-700 dark:text-gray-300 select-none">
                    {rollNumber || 'EATM23CSE001'} (Protected)
                  </div>
                </div>
              </div>

              <Select
                label="Branch / Department"
                options={DEPARTMENT_OPTIONS}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Year of Study"
                  options={YEAR_OPTIONS}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  required
                />
                <Select
                  label="Semester"
                  options={SEMESTER_OPTIONS}
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                />
              </div>
            </div>

            {/* SECTION 2: Profile Media */}
            <div className="bg-gray-50/70 dark:bg-[#16251c]/60 p-4 rounded-2xl border border-gray-200/70 dark:border-[#1e3325] space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0b4627] dark:text-emerald-400 uppercase tracking-wider">
                <Camera className="w-4 h-4" />
                <span>Profile Photo & Cover Banner</span>
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Student Avatar
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full ring-2 ring-emerald-600/30 overflow-hidden bg-gray-200 dark:bg-gray-800 shrink-0 relative flex items-center justify-center">
                    <Avatar
                      src={photoURL}
                      name={displayName || user?.displayName || 'User'}
                      size="lg"
                    />
                    {uploadingPhoto && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                        <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <input
                      type="file"
                      ref={modalAvatarFileRef}
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleAvatarUpload(e.target.files[0], true);
                      }}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => modalAvatarFileRef.current?.click()}
                      disabled={uploadingPhoto}
                      icon={<Upload className="w-3.5 h-3.5 text-[#0b4627] dark:text-emerald-400" />}
                    >
                      {uploadingPhoto ? `Uploading... ${photoProgress}%` : 'Upload New Photo'}
                    </Button>
                    <p className="text-[11px] text-gray-400">
                      Square JPG, PNG, or WebP photo recommended.
                    </p>
                  </div>
                </div>
              </div>

              {/* Cover Banner Upload */}
              <div className="pt-2 border-t border-gray-200/60 dark:border-[#1e3325]">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Campus Cover Banner
                </label>
                <div className="space-y-2.5">
                  <div className="h-24 w-full rounded-xl overflow-hidden relative bg-emerald-950 border border-gray-200 dark:border-[#1e3325]">
                    <img
                      src={coverURL || 'https://images.unsplash.com/photo-1562774053-701939374585?w=1600&auto=format&fit=crop&q=80'}
                      alt="Cover Preview"
                      className="w-full h-full object-cover"
                    />
                    {uploadingCover && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-bold gap-2">
                        <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                        <span>Uploading banner... {coverProgress}%</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <input
                      type="file"
                      ref={modalCoverFileRef}
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleCoverUpload(e.target.files[0], true);
                      }}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => modalCoverFileRef.current?.click()}
                      disabled={uploadingCover}
                      icon={<ImageIcon className="w-3.5 h-3.5 text-[#0b4627] dark:text-emerald-400" />}
                    >
                      {uploadingCover ? `Uploading... ${coverProgress}%` : 'Upload Custom Banner'}
                    </Button>
                  </div>

                  {/* Preset Campus Covers */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                      Official EATM Campus Presets:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {OFFICIAL_COVER_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => setCoverURL(preset.url)}
                          className={`group text-left rounded-lg overflow-hidden border p-1 transition-all ${
                            coverURL === preset.url
                              ? 'border-emerald-600 ring-2 ring-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/30'
                              : 'border-gray-200 dark:border-[#1e3325] hover:border-emerald-400'
                          }`}
                        >
                          <div className="h-10 w-full rounded overflow-hidden mb-1">
                            <img src={preset.url} alt={preset.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                          </div>
                          <p className="text-[10px] font-bold text-gray-700 dark:text-gray-300 truncate">{preset.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: About & Specializations */}
            <div className="bg-gray-50/70 dark:bg-[#16251c]/60 p-4 rounded-2xl border border-gray-200/70 dark:border-[#1e3325] space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0b4627] dark:text-emerald-400 uppercase tracking-wider">
                <BookOpen className="w-4 h-4" />
                <span>About & Specializations</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  About Me / Short Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full p-3 text-xs border border-gray-200 dark:border-[#1e3325] bg-white dark:bg-[#16251c] text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-[#0b4627] dark:focus:ring-emerald-500 outline-none resize-none transition"
                  placeholder="Tell campus peers about your engineering focus, project goals, and interests..."
                />
              </div>

              <Input
                label="Skills & Technologies (comma separated)"
                value={skillsStr}
                onChange={(e) => setSkillsStr(e.target.value)}
                placeholder="e.g. React, Python, Java, C++, TypeScript, Machine Learning"
              />

              <Input
                label="Interests & Societies (comma separated)"
                value={interestsStr}
                onChange={(e) => setInterestsStr(e.target.value)}
                placeholder="e.g. Coding Club, Robotics, Hackathons, Cricket, Music"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-[#1e3325]">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={saving}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add / Edit Project Modal */}
      {isOwnProfile && (
        <Modal
          isOpen={projectModalOpen}
          onClose={() => !savingProject && setProjectModalOpen(false)}
          title={editingProjectIdx !== null ? 'Edit Featured Project' : 'Add Project to Portfolio'}
          maxWidth="lg"
        >
          <form onSubmit={handleSaveProject} className="space-y-4 max-h-[78vh] overflow-y-auto pr-1">
            <div className="p-3 bg-emerald-50/80 dark:bg-[#16251c] rounded-xl border border-emerald-100 dark:border-[#1e3325] flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#0b4627] text-white shrink-0">
                <Code className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                  Engineering Portfolio Record
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Document capstone systems, hackathon builds, web applications, or research implementations.
                </p>
              </div>
            </div>

            <Input
              label="Project Title"
              value={projectForm.title}
              onChange={(e) => setProjectForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Smart Campus Navigation & Attendance AI"
              required
            />

            <Input
              label="Technologies & Tools (comma separated)"
              value={projectForm.technologies}
              onChange={(e) => setProjectForm(prev => ({ ...prev, technologies: e.target.value }))}
              placeholder="e.g. React, TypeScript, Python, TensorFlow, PostgreSQL"
              required
            />

            <Input
              label="Live Demo or Source Code Link (optional)"
              value={projectForm.link}
              onChange={(e) => setProjectForm(prev => ({ ...prev, link: e.target.value }))}
              placeholder="https://github.com/username/project"
              leftIcon={<Globe className="w-4 h-4 text-gray-400" />}
            />

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Project Description & Impact
              </label>
              <textarea
                value={projectForm.description}
                onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                required
                className="w-full p-3 text-xs border border-gray-200 dark:border-[#1e3325] bg-white dark:bg-[#16251c] text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-[#0b4627] dark:focus:ring-emerald-500 outline-none resize-none transition"
                placeholder="Highlight your system's architecture, problem statement, and key technical contributions..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-[#1e3325]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setProjectModalOpen(false)}
                disabled={savingProject}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={savingProject}
              >
                {editingProjectIdx !== null ? 'Update Project' : 'Save Project'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add / Edit Honor & Achievement Modal */}
      {isOwnProfile && (
        <Modal
          isOpen={achievementModalOpen}
          onClose={() => !savingAchievement && setAchievementModalOpen(false)}
          title={editingAchievementIdx !== null ? 'Edit Honor & Achievement' : 'Record Honor & Achievement'}
          maxWidth="lg"
        >
          <form onSubmit={handleSaveAchievement} className="space-y-4 max-h-[78vh] overflow-y-auto pr-1">
            <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-900/40 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-600 text-white shrink-0">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                  Campus Distinction & Honors
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Catalog competitive hackathons, academic merit, sports recognitions, paper publications, and awards.
                </p>
              </div>
            </div>

            <Input
              label="Honor / Award Title"
              value={achievementForm.title}
              onChange={(e) => setAchievementForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. 1st Place - Smart Odisha Hackathon 2024"
              required
            />

            <Input
              label="Date / Issuing Authority"
              value={achievementForm.date}
              onChange={(e) => setAchievementForm(prev => ({ ...prev, date: e.target.value }))}
              placeholder="e.g. March 2024 • BPUT Odisha Innovation Conclave"
              leftIcon={<Calendar className="w-4 h-4 text-gray-400" />}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Citation & Description
              </label>
              <textarea
                value={achievementForm.description}
                onChange={(e) => setAchievementForm(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                required
                className="w-full p-3 text-xs border border-gray-200 dark:border-[#1e3325] bg-white dark:bg-[#16251c] text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-[#0b4627] dark:focus:ring-emerald-500 outline-none resize-none transition"
                placeholder="Describe the recognition, competing teams, presenting dignitaries, and significance..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-[#1e3325]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAchievementModalOpen(false)}
                disabled={savingAchievement}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={savingAchievement}
              >
                {editingAchievementIdx !== null ? 'Update Honor' : 'Save Honor'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {isOwnProfile && (
        <Modal
          isOpen={deleteConfirm.type !== null}
          onClose={() => setDeleteConfirm({ type: null, idx: null, title: '' })}
          title="Confirm Removal"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                  Are you sure you want to remove this {deleteConfirm.type === 'project' ? 'project' : 'honor'}?
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300 font-semibold mt-1 line-clamp-2">
                  "{deleteConfirm.title}"
                </p>
                <p className="text-[11px] text-red-600 dark:text-red-400 mt-2">
                  This item will be permanently removed from your student portfolio records in Supabase.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-[#1e3325]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirm({ type: null, idx: null, title: '' })}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => {
                  if (deleteConfirm.type === 'project' && deleteConfirm.idx !== null) {
                    confirmDeleteProject(deleteConfirm.idx);
                  } else if (deleteConfirm.type === 'achievement' && deleteConfirm.idx !== null) {
                    confirmDeleteAchievement(deleteConfirm.idx);
                  }
                }}
              >
                Delete Entry
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
