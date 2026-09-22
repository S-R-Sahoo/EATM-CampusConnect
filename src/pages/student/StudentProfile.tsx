import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { uploadFile } from '../../supabase/storage';
import { 
  fetchPosts, fetchConnections, fetchUserById, 
  sendConnectionRequest, updateConnectionStatus, getOrCreateConversation 
} from '../../supabase/db';
import { Post, UserProfile } from '../../types';
import { PostCard } from '../../components/posts/PostCard';
import confetti from 'canvas-confetti';
import { 
  Edit3, Calendar, Award, Code, CheckCircle, 
  ExternalLink, GraduationCap, Building2, IdCard, 
  Camera, Upload, Image as ImageIcon, Loader2,
  User, Cpu, Compass, Trophy, BookOpen, Radio,
  ArrowLeft, Check, Clock, UserPlus, MessageSquare, X
} from 'lucide-react';
import { isCustomPhoto } from '../../constants/assets';
import { Avatar } from '../../components/ui/Avatar';

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
  const [connectionInfo, setConnectionInfo] = useState<{
    status: 'connected' | 'pending_sent' | 'pending_received' | 'none';
    connectionId?: string;
  }>({ status: 'none' });
  const [connecting, setConnecting] = useState(false);

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
  const [liveConnectionsCount, setLiveConnectionsCount] = useState<number | null>(null);

  const activeUser = isOwnProfile ? user : viewedUser;

  const loadUserPosts = async (targetUserId?: string) => {
    const idToFetch = targetUserId || (isOwnProfile ? user?.id : id);
    if (!idToFetch) return;
    try {
      const allPosts = await fetchPosts();
      const myPosts = allPosts.filter(p => p.authorId === idToFetch || (isOwnProfile && user?.uid && p.authorId === user.uid));
      setUserPosts(myPosts);
    } catch (e) {
      console.error('Failed to load user posts:', e);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
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
        fetchConnections(user.id).then(conns => {
          const accepted = conns.filter(c => c.status === 'accepted').length;
          setLiveConnectionsCount(accepted);
        }).catch(() => {});
      }
    } else if (id) {
      setLoadingProfile(true);
      fetchUserById(id).then(async (target) => {
        setViewedUser(target);
        setLoadingProfile(false);
        if (target) {
          loadUserPosts(target.id);
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

              const targetConns = await fetchConnections(target.id);
              setLiveConnectionsCount(targetConns.filter(c => c.status === 'accepted').length);
            } catch (err) {
              console.warn('Failed to fetch connections for target user:', err);
            }
          }
        }
      }).catch(err => {
        console.error('Error fetching user profile:', err);
        setLoadingProfile(false);
      });
    }
  }, [id, user?.id, isOwnProfile]);

  const handleConnect = async () => {
    if (!user || !activeUser) return;
    setConnecting(true);
    try {
      const newConn = await sendConnectionRequest(user.id, activeUser.id);
      setConnectionInfo({ status: 'pending_sent', connectionId: newConn.id });
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 } });
      success(`Connection request sent to ${activeUser.displayName}!`, 'Request Sent');
    } catch (err) {
      toastError('Could not send connection request.');
    } finally {
      setConnecting(false);
    }
  };

  const handleAcceptConnection = async () => {
    if (!connectionInfo.connectionId) return;
    setConnecting(true);
    try {
      await updateConnectionStatus(connectionInfo.connectionId, 'accepted');
      setConnectionInfo(prev => ({ ...prev, status: 'connected' }));
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      success(`You and ${activeUser?.displayName} are now campus friends 🎉`, 'Friend Connected');
      setLiveConnectionsCount(prev => (prev ?? 0) + 1);
    } catch (err) {
      toastError('Could not accept connection request.');
    } finally {
      setConnecting(false);
    }
  };

  const handleRejectConnection = async () => {
    if (!connectionInfo.connectionId) return;
    setConnecting(true);
    try {
      await updateConnectionStatus(connectionInfo.connectionId, 'rejected');
      setConnectionInfo({ status: 'none' });
      success('Connection request declined.', 'Request Ignored');
    } catch (err) {
      toastError('Could not decline connection request.');
    } finally {
      setConnecting(false);
    }
  };

  const handleStartDirectChat = async () => {
    if (!user || !activeUser) return;
    try {
      const conv = await getOrCreateConversation(user.id, activeUser.id);
      navigate('/student/messages', { state: { conversationId: conv.id } });
    } catch (err) {
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
      success('Profile photo updated successfully! It is now visible everywhere.', 'Photo Updated');
    } catch (err) {
      console.error(err);
      toastError('Failed to upload profile photo');
    } finally {
      setUploadingPhoto(false);
      setPhotoProgress(0);
    }
  };

  const handleCoverUpload = async (file: File, isModal = false) => {
    if (!file || !user) return;
    setUploadingCover(true);
    setCoverProgress(0);
    try {
      const url = await uploadFile(
        `profiles/${user.id}/cover_${Date.now()}_${file.name}`,
        file,
        (p) => setCoverProgress(p)
      );
      setCoverURL(url);
      if (!isModal) {
        await updateUser({ coverURL: url });
        success('Cover banner updated successfully!', 'Cover Updated');
      } else {
        success('Cover image uploaded and ready to save!', 'Upload Complete');
      }
    } catch (err) {
      console.error(err);
      toastError('Failed to upload cover banner');
    } finally {
      setUploadingCover(false);
      setCoverProgress(0);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await updateUser({
        displayName,
        department,
        year,
        semester,
        rollNumber,
        bio,
        skills: skillsStr.split(',').map(s => s.trim()).filter(Boolean),
        interests: interestsStr.split(',').map(i => i.trim()).filter(Boolean),
        photoURL: isCustomPhoto(photoURL) ? photoURL : (isCustomPhoto(user.photoURL) ? user.photoURL : undefined),
        coverURL
      });
      success('Official student credentials and profile saved!', 'Changes Saved');
      setEditModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="max-w-5xl mx-auto p-12 text-center bg-white dark:bg-[#111d15] rounded-3xl border border-gray-200/80 dark:border-[#1e3325] shadow-card space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600 dark:text-emerald-400" />
        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Loading Student Profile...</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Fetching verified academic credentials and campus records</p>
      </div>
    );
  }

  if (!activeUser) {
    return (
      <div className="max-w-xl mx-auto p-12 text-center bg-white dark:bg-[#111d15] rounded-3xl border border-gray-200/80 dark:border-[#1e3325] shadow-card space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-[#16251c] text-gray-500 dark:text-gray-400 flex items-center justify-center mx-auto">
          <User className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-black text-gray-900 dark:text-gray-100">Student Profile Not Found</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
          The requested profile does not exist or may have been updated.
        </p>
        <Button variant="primary" size="sm" onClick={() => navigate('/student/discover')}>
          Explore Campus Directory
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top back navigation button when viewing someone else */}
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

      {/* Profile Cover & Main Identity Card */}
      <div className="bg-white dark:bg-[#111d15] rounded-3xl border border-gray-200/80 dark:border-[#1e3325] shadow-card overflow-hidden transition-colors duration-150">
        {/* Cover Photo Banner */}
        <div className="h-44 sm:h-56 md:h-64 relative bg-emerald-950 overflow-hidden group">
          <img
            src={activeUser.coverURL || 'https://images.unsplash.com/photo-1562774053-701939374585?w=1600&auto=format&fit=crop&q=80'}
            alt="Campus Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          {/* Top Right Campus Identity Tag on Cover */}
          <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white text-[11px] font-semibold">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">EATM Digital Campus</span>
            <span className="sm:hidden">EATM</span>
          </div>

          {/* Quick Change Cover Action Button (Only for own profile) */}
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50"
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

        {/* Profile Content Section (Completely Below Banner - Zero Overlap) */}
        <div className="px-5 sm:px-8 pb-6 sm:pb-8 pt-0">
          {/* Row 1: Floating Avatar & Edit Profile / Connect Button */}
          <div className="flex items-end justify-between -mt-14 sm:-mt-20 mb-4 sm:mb-5">
            {/* Avatar with Thick Border & Quick Upload Button */}
            <div className="relative group">
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
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full ring-4 ring-white dark:ring-[#111d15] shadow-xl overflow-hidden bg-white dark:bg-[#16251c] flex items-center justify-center relative">
                <Avatar
                  src={effectivePhoto}
                  name={activeUser.displayName}
                  size="2xl"
                  className="w-full h-full"
                />
                {uploadingPhoto && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white text-[10px] font-bold z-10">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-400 mb-1" />
                    <span>{photoProgress}%</span>
                  </div>
                )}
              </div>

              {/* Direct Camera Action on Avatar (Only for own profile) */}
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => avatarFileRef.current?.click()}
                  disabled={uploadingPhoto}
                  title="Upload Profile Photo"
                  className="absolute top-1 right-1 p-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white shadow-lg border-2 border-white dark:border-[#111d15] transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              )}

              {activeUser.verified && (
                <div 
                  className="absolute bottom-1 right-1 p-1 sm:p-1.5 rounded-full bg-white dark:bg-[#111d15] shadow-md border border-gray-100 dark:border-[#1e3325]"
                  title="Official Verified Student"
                >
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950" />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pb-1 sm:pb-2">
              {isOwnProfile ? (
                <Button
                  variant="crimson"
                  size="sm"
                  onClick={handleOpenEdit}
                  icon={<Edit3 className="w-3.5 h-3.5" />}
                  className="shadow-sm font-bold text-xs sm:text-sm"
                >
                  Edit Profile
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  {connectionInfo.status === 'connected' ? (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200/90 dark:border-emerald-800/70 shadow-xs">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Connected</span>
                    </span>
                  ) : connectionInfo.status === 'pending_received' ? (
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={connecting}
                        onClick={handleAcceptConnection}
                        icon={<Check className="w-3.5 h-3.5" />}
                        className="shadow-sm font-bold text-xs"
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={connecting}
                        onClick={handleRejectConnection}
                        icon={<X className="w-3.5 h-3.5" />}
                        className="shadow-sm font-bold text-xs"
                      >
                        Ignore
                      </Button>
                    </div>
                  ) : connectionInfo.status === 'pending_sent' ? (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200/90 dark:border-amber-800/70 shadow-xs">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Pending</span>
                    </span>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={connecting}
                      onClick={handleConnect}
                      icon={<UserPlus className="w-3.5 h-3.5" />}
                      className="shadow-sm font-bold text-xs"
                    >
                      Connect
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStartDirectChat}
                    icon={<MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                    className="shadow-sm font-bold text-xs"
                  >
                    Message
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Student Identity & Academic Details */}
          <div className="space-y-3.5">
            {/* Name and Verified Campus Scholar Badge */}
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight leading-tight">
                {activeUser.displayName}
              </h1>
              {activeUser.verified && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/90 dark:border-emerald-800/70 text-[#0b4627] dark:text-emerald-300 shadow-xs">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950 shrink-0" />
                  <span>Verified Student</span>
                </span>
              )}
            </div>

            {/* Academic Credentials Badges: Branch, Year, Roll No, College */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-0.5">
              {/* Branch / Department Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-[#16251c] border border-gray-200/80 dark:border-[#1e3325] text-xs font-semibold text-gray-700 dark:text-gray-300 shadow-xs">
                <GraduationCap className="w-4 h-4 text-[#0b4627] dark:text-emerald-400 shrink-0" />
                <span>Branch: <strong className="font-extrabold text-[#0b4627] dark:text-emerald-400">{activeUser.department}</strong></span>
              </div>

              {/* Year & Semester Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-[#16251c] border border-gray-200/80 dark:border-[#1e3325] text-xs font-semibold text-gray-700 dark:text-gray-300 shadow-xs">
                <Calendar className="w-4 h-4 text-[#0b4627] dark:text-emerald-400 shrink-0" />
                <span>Year: <strong className="font-extrabold text-gray-900 dark:text-gray-100">{activeUser.year || '3rd Year'}</strong> {activeUser.semester ? `(${activeUser.semester} Sem)` : ''}</span>
              </div>

              {/* Official Roll Number Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50/90 dark:bg-red-950/40 border border-red-200/90 dark:border-red-900/60 text-xs font-bold text-[#dc2626] dark:text-red-300 shadow-xs">
                <IdCard className="w-4 h-4 text-[#dc2626] dark:text-red-400 shrink-0" />
                <span>Roll No: <strong className="font-black tracking-wide text-[#b91c1c] dark:text-red-300">{activeUser.rollNumber || 'EATM23CSE001'}</strong></span>
              </div>

              {/* College Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/90 dark:border-emerald-800/60 text-xs font-bold text-[#0b4627] dark:text-emerald-300 shadow-xs">
                <Building2 className="w-4 h-4 text-[#0b4627] dark:text-emerald-400 shrink-0" />
                <span>College: <strong className="font-extrabold">Einstein Academy of Technology & Management (EATM)</strong></span>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 mt-6 border-y border-gray-100 dark:border-[#1e3325] text-center bg-gray-50/50 dark:bg-[#16251c]/50 rounded-2xl">
            <div>
              <div className="text-xl font-black text-gray-900 dark:text-gray-100">
                {liveConnectionsCount !== null ? liveConnectionsCount : (activeUser.stats?.connections ?? 0)}
              </div>
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Connections</div>
            </div>
            <div>
              <div className="text-xl font-black text-gray-900 dark:text-gray-100">{userPosts.length > 0 ? userPosts.length : (activeUser.stats?.posts ?? 0)}</div>
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Posts</div>
            </div>
            <div>
              <div className="text-xl font-black text-gray-900 dark:text-gray-100">{activeUser.stats?.clubs ?? 0}</div>
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Clubs</div>
            </div>
            <div>
              <div className="text-xl font-black text-gray-900 dark:text-gray-100">{activeUser.stats?.achievements ?? 0}</div>
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Achievements</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Profile Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: About, Skills, Interests */}
        <div className="space-y-6">
          {/* About Me */}
          <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/80 dark:border-[#1e3325] p-6 shadow-card transition-colors duration-150">
            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-[#0b4627] dark:text-emerald-400" />
              <span>About Me</span>
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              {activeUser.bio || 'Passionate about building innovative engineering solutions and exploring new technologies.'}
            </p>
          </div>

          {/* Skills */}
          <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/80 dark:border-[#1e3325] p-6 shadow-card transition-colors duration-150">
            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#0b4627] dark:text-emerald-400" />
              <span>Skills & Technologies</span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {activeUser.skills && activeUser.skills.length > 0 ? (
                activeUser.skills.map(skill => (
                  <span
                    key={skill}
                    className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-[#0b4627] dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-xs text-gray-400">No skills listed yet.</p>
              )}
            </div>
          </div>

          {/* Interests */}
          <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/80 dark:border-[#1e3325] p-6 shadow-card transition-colors duration-150">
            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#0b4627] dark:text-emerald-400" />
              <span>Interests & Hobbies</span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {activeUser.interests && activeUser.interests.length > 0 ? (
                activeUser.interests.map(int => (
                  <span
                    key={int}
                    className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-[#16251c] text-gray-700 dark:text-gray-300 border border-gray-200/60 dark:border-[#1e3325]"
                  >
                    {int}
                  </span>
                ))
              ) : (
                <p className="text-xs text-gray-400">No interests added yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right 2-Cols: Projects & Achievements */}
        <div className="lg:col-span-2 space-y-6">
          {/* Projects */}
          <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/80 dark:border-[#1e3325] p-6 shadow-card transition-colors duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Code className="w-4 h-4 text-[#0b4627] dark:text-emerald-400" />
                <span>Featured Projects</span>
              </h3>
            </div>

            <div className="space-y-4">
              {activeUser.projects && activeUser.projects.length > 0 ? (
                activeUser.projects.map((proj, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-gray-100 dark:border-[#1e3325] bg-gray-50/50 dark:bg-[#16251c]/50 hover:border-emerald-200 dark:hover:border-emerald-800 transition">
                    <div className="flex items-start justify-between">
                      <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">{proj.title}</h4>
                      {proj.link && (
                        <a href={proj.link} target="_blank" rel="noreferrer" className="text-gray-400 dark:text-gray-500 hover:text-[#0b4627] dark:hover:text-emerald-400">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">{proj.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {proj.technologies.map(t => (
                        <span key={t} className="text-[10px] font-semibold px-2 py-0.5 bg-white dark:bg-[#111d15] rounded border border-gray-200 dark:border-[#1e3325] text-gray-600 dark:text-gray-300">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500">No projects added yet.</p>
              )}
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/80 dark:border-[#1e3325] p-6 shadow-card transition-colors duration-150">
            <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Campus Honors & Achievements</span>
            </h3>

            <div className="space-y-3">
              {activeUser.achievements && activeUser.achievements.length > 0 ? (
                activeUser.achievements.map((ach, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-100 dark:border-[#1e3325] bg-amber-50/30 dark:bg-amber-950/20">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 shrink-0">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-gray-900 dark:text-gray-100">{ach.title}</h4>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">• {ach.date}</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">{ach.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500">No honors or achievements added yet.</p>
              )}
            </div>
          </div>

          {/* Campus Posts */}
          <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/80 dark:border-[#1e3325] p-6 shadow-card transition-colors duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#0b4627] dark:text-emerald-400" />
                <span>{isOwnProfile ? 'My Published Posts' : `${activeUser.displayName}'s Posts`} ({userPosts.length})</span>
              </h3>
            </div>

            {loadingPosts ? (
              <p className="text-xs text-gray-400">Loading posts...</p>
            ) : userPosts.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-gray-200 dark:border-[#1e3325] rounded-xl text-gray-400 dark:text-gray-500">
                <p className="text-xs font-medium">
                  {isOwnProfile ? "You haven't published any posts yet." : "No posts published yet."}
                </p>
                {isOwnProfile && (
                  <p className="text-[11px] mt-1 text-gray-400">Share updates, questions, or achievements with peers from the Campus Feed!</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {userPosts.map(p => (
                  <PostCard key={p.id} post={p} onPostDeleted={() => loadUserPosts(activeUser.id)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal (Only for own profile) */}
      {isOwnProfile && (
        <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Student Profile">
        <form onSubmit={handleSaveProfile} className="space-y-5 max-h-[78vh] overflow-y-auto pr-1">
          {/* Section 1: Academic Identity */}
          <div className="bg-gray-50/70 dark:bg-[#16251c]/60 p-4 rounded-2xl border border-gray-200/70 dark:border-[#1e3325] space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0b4627] dark:text-emerald-400 uppercase tracking-wider">
              <GraduationCap className="w-4 h-4" />
              <span>Official Academic Credentials</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Full Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Student Full Name"
                required
              />
              <Input
                label="Official Roll Number"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="e.g. EATM23CSE001"
                required
              />
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

          {/* Section 2: Profile Photo & Cover Media */}
          <div className="bg-gray-50/70 dark:bg-[#16251c]/60 p-4 rounded-2xl border border-gray-200/70 dark:border-[#1e3325] space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-[#0b4627] dark:text-emerald-400 uppercase tracking-wider">
              <span className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                <span>Profile Photo & Cover Banner</span>
              </span>
            </div>

            {/* Profile Photo Uploader */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                Student Profile Photo
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
                    className="text-xs font-semibold"
                  >
                    {uploadingPhoto ? `Uploading... ${photoProgress}%` : 'Upload New Photo'}
                  </Button>
                  <p className="text-[11px] text-gray-400 dark:text-gray-400">
                    PNG, JPG, or WebP (square photo recommended).
                  </p>
                </div>
              </div>
            </div>

            {/* Cover Banner Uploader */}
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
                    className="text-xs font-semibold"
                  >
                    {uploadingCover ? `Uploading... ${coverProgress}%` : 'Upload Banner Image'}
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

          {/* Section 3: Bio, Skills & Interests */}
          <div className="bg-gray-50/70 dark:bg-[#16251c]/60 p-4 rounded-2xl border border-gray-200/70 dark:border-[#1e3325] space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0b4627] dark:text-emerald-400 uppercase tracking-wider">
              <BookOpen className="w-4 h-4" />
              <span>Bio & Specializations</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                About Me / Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full p-3 text-xs border border-gray-200 dark:border-[#1e3325] bg-white dark:bg-[#16251c] text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-[#0b4627] dark:focus:ring-emerald-500 outline-none resize-none transition"
                placeholder="Tell peers about your academic interests, projects, and goals..."
              />
            </div>

            <Input
              label="Skills & Technologies (comma separated)"
              value={skillsStr}
              onChange={(e) => setSkillsStr(e.target.value)}
              placeholder="e.g. C++, Java, Python, React, Data Structures"
            />

            <Input
              label="Interests & Societies (comma separated)"
              value={interestsStr}
              onChange={(e) => setInterestsStr(e.target.value)}
              placeholder="e.g. Coding Club, Robotics, Photography, Cricket"
            />
          </div>

          {/* Action Buttons */}
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
    </div>
  );
};
