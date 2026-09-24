import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { 
  fetchCommunityById, joinCommunity, leaveCommunity,
  handleCommunityJoinRequest, updateCommunityMemberRole, 
  removeCommunityMember, banCommunityMember, unbanCommunityMember,
  transferCommunityOwnership, updateCommunity, deleteCommunity,
  fetchCommunityPosts, createCommunityPost, deleteCommunityPost, toggleCommunityPostLike,
  fetchCommunityComments, createCommunityComment,
  fetchCommunityDiscussions, createCommunityDiscussion, toggleCommunityDiscussionLike,
  fetchCommunityDiscussionComments, createCommunityDiscussionComment,
  fetchCommunityMessages, sendCommunityMessage, subscribeToCommunityMessages,
  fetchCommunityResources, uploadCommunityResource, deleteCommunityResource,
  fetchCommunityEvents, createCommunityEvent, rsvpCommunityEvent,
  voteCommunityPoll, submitCommunityReport, fetchCommunityReports, resolveCommunityReport,
  fetchCommunityModerationActions, fetchUsers, subscribeToCommunityLiveEvents
} from '../../supabase/db';
import { uploadFile } from '../../supabase/storage';
import { 
  Community, CommunityPost, CommunityComment, CommunityDiscussion, 
  CommunityDiscussionComment, CommunityMessage, CommunityResource, 
  CommunityEventItem, CommunityReport, CommunityModerationAction,
  CommunityRole, CommunityType, UserProfile 
} from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { 
  Award, Users, ShieldCheck, Lock, Globe, MessageSquare, 
  Share2, Settings, Plus, Heart, MessageCircle, Send, 
  Calendar, FileText, Download, Check, X, Trash2, Edit3, 
  Pin, Sparkles, AlertTriangle, Flag, ArrowLeft, Search, 
  Paperclip, Image as ImageIcon, CornerUpLeft, MoreVertical, 
  UserPlus, UserMinus, ShieldAlert, CheckCircle2, UserCheck, 
  ExternalLink, Code2, BarChart2, Eye, Clock, MapPin, Smile, BookOpen, 
  Flame, ChevronRight, HelpCircle, FileCheck, ThumbsUp, LogOut
} from 'lucide-react';
import confetti from 'canvas-confetti';

type TabType = 'home' | 'discussions' | 'chat' | 'members' | 'events' | 'resources' | 'projects' | 'about' | 'manage';

export const CommunityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error, info } = useToast();

  const [community, setCommunity] = useState<Community | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('home');

  // Sub-entity collections
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [discussions, setDiscussions] = useState<CommunityDiscussion[]>([]);
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [resources, setResources] = useState<CommunityResource[]>([]);
  const [events, setEvents] = useState<CommunityEventItem[]>([]);
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [actions, setActions] = useState<CommunityModerationAction[]>([]);

  // Post composer state
  const [postContent, setPostContent] = useState('');
  const [postType, setPostType] = useState<'text' | 'image' | 'announcement' | 'poll' | 'project'>('text');
  const [postMediaFile, setPostMediaFile] = useState<File | null>(null);
  const [postMediaPreview, setPostMediaPreview] = useState<string | null>(null);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectTechs, setProjectTechs] = useState('');
  const [projectGithub, setProjectGithub] = useState('');
  const [projectDemo, setProjectDemo] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<{ [postId: string]: CommunityComment[] }>({});
  const [commentInputMap, setCommentInputMap] = useState<{ [postId: string]: string }>({});

  // Discussion state
  const [discussionModalOpen, setDiscussionModalOpen] = useState(false);
  const [discTitle, setDiscTitle] = useState('');
  const [discContent, setDiscContent] = useState('');
  const [discCategory, setDiscCategory] = useState<'General' | 'Questions' | 'Projects' | 'Help' | 'Announcements'>('General');
  const [selectedDiscCategory, setSelectedDiscCategory] = useState<string>('All');
  const [discCommentsMap, setDiscCommentsMap] = useState<{ [discId: string]: CommunityDiscussionComment[] }>({});
  const [discCommentInputMap, setDiscCommentInputMap] = useState<{ [discId: string]: string }>({});
  const [openDiscId, setOpenDiscId] = useState<string | null>(null);

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatAttachment, setChatAttachment] = useState<File | null>(null);
  const [chatAttachmentPreview, setChatAttachmentPreview] = useState<string | null>(null);
  const [replyingToMsg, setReplyingToMsg] = useState<CommunityMessage | null>(null);
  const [isChatSending, setIsChatSending] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  // Resources state
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [resTitle, setResTitle] = useState('');
  const [resDesc, setResDesc] = useState('');
  const [resFile, setResFile] = useState<File | null>(null);
  const [resIsMemberOnly, setResIsMemberOnly] = useState(true);
  const [resUploading, setResUploading] = useState(false);

  // Events state
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventCoverFile, setEventCoverFile] = useState<File | null>(null);
  const [eventCoverPreview, setEventCoverPreview] = useState<string | null>(null);
  const [eventCreating, setEventCreating] = useState(false);

  // Members search
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // Report modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTargetType, setReportTargetType] = useState<CommunityReport['targetType']>('post');
  const [reportTargetId, setReportTargetId] = useState('');
  const [reportPreview, setReportPreview] = useState('');
  const [reportReason, setReportReason] = useState<CommunityReport['reason']>('Spam');
  const [reportDesc, setReportDesc] = useState('');

  // Settings & Management state
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editType, setEditType] = useState<CommunityType>('public');
  const [editRules, setEditRules] = useState('');
  const [editMeeting, setEditMeeting] = useState('');
  const [editRoom, setEditRoom] = useState('');
  const [transferUserId, setTransferUserId] = useState('');
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const postMediaInputRef = useRef<HTMLInputElement>(null);

  // Load community and collections
  const loadCommunityData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [commData, usersData] = await Promise.all([
        fetchCommunityById(id),
        fetchUsers()
      ]);

      if (!commData) {
        error('Community not found.');
        navigate('/student/communities');
        return;
      }

      setCommunity(commData);
      setAllUsers(usersData);

      // Initialize edit fields
      setEditName(commData.name);
      setEditDesc(commData.description);
      setEditCategory(commData.category);
      setEditType(commData.type || 'public');
      setEditRules((commData.rules || []).join('\n'));
      setEditMeeting(commData.meetingTime || '');
      setEditRoom(commData.room || '');

      // Load sub-entities
      const [p, d, m, r, e, rep, act] = await Promise.all([
        fetchCommunityPosts(id),
        fetchCommunityDiscussions(id),
        fetchCommunityMessages(id),
        fetchCommunityResources(id),
        fetchCommunityEvents(id),
        fetchCommunityReports(id),
        fetchCommunityModerationActions(id)
      ]);

      setPosts(p);
      setDiscussions(d);
      setMessages(m);
      setResources(r);
      setEvents(e);
      setReports(rep);
      setActions(act);
    } catch (err) {
      console.error('Failed to load community details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommunityData();
  }, [id]);

  // Live updates across devices for posts, discussions, members, events
  useEffect(() => {
    if (!id) return;
    const unsubLive = subscribeToCommunityLiveEvents(id, () => {
      fetchCommunityById(id).then(c => c && setCommunity(c));
      fetchCommunityPosts(id).then(setPosts);
      fetchCommunityDiscussions(id).then(setDiscussions);
      fetchCommunityResources(id).then(setResources);
      fetchCommunityEvents(id).then(setEvents);
      fetchCommunityReports(id).then(setReports);
      fetchCommunityModerationActions(id).then(setActions);
    });
    return () => {
      unsubLive();
    };
  }, [id]);

  // Realtime chat subscription
  useEffect(() => {
    if (!id) return;
    const unsubscribe = subscribeToCommunityMessages(id, (newMsg) => {
      setMessages(prev => {
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      }, 50);
    });

    return () => {
      unsubscribe();
    };
  }, [id]);

  // Auto-scroll chat on load
  useEffect(() => {
    if (activeTab === 'chat' && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [activeTab, messages]);

  // Derived user roles & permissions
  const isMember = useMemo(() => {
    if (!user || !community) return false;
    return community.members.includes(user.id);
  }, [user, community]);

  const hasPendingRequest = useMemo(() => {
    if (!user || !community) return false;
    return community.pendingRequests?.includes(user.id);
  }, [user, community]);

  const isBanned = useMemo(() => {
    if (!user || !community) return false;
    return community.bannedUsers?.includes(user.id);
  }, [user, community]);

  const isOwner = useMemo(() => {
    if (!user || !community) return false;
    return community.ownerId === user.id;
  }, [user, community]);

  const isAdmin = useMemo(() => {
    if (!user || !community) return false;
    return isOwner || (community.admins || []).includes(user.id) || user.role === 'admin';
  }, [user, community, isOwner]);

  const isModerator = useMemo(() => {
    if (!user || !community) return false;
    return isAdmin || (community.moderators || []).includes(user.id);
  }, [user, community, isAdmin]);

  // User membership lookup helper
  const getUserRole = (userId: string): CommunityRole => {
    if (!community) return 'member';
    if (community.ownerId === userId) return 'owner';
    if (community.admins?.includes(userId)) return 'admin';
    if (community.moderators?.includes(userId)) return 'moderator';
    return 'member';
  };

  // Join / Leave Handler
  const handleJoinToggle = async () => {
    if (!user || !community) return;

    if (isMember) {
      const res = await leaveCommunity(community.id, user.id);
      if (res.isOwnerMustTransfer) {
        info('As the owner, please transfer ownership to another admin before leaving, or delete the society.', 'Owner Action Required');
        setActiveTab('manage');
        return;
      }
      setCommunity(prev => prev ? { ...prev, memberCount: res.count, members: prev.members.filter(uid => uid !== user.id) } : null);
      success(`You left ${community.name}.`);
    } else if (hasPendingRequest) {
      info('Your request to join is pending approval by the society leadership.', 'Request Pending');
    } else {
      const res = await joinCommunity(community.id, user.id);
      if (res.status === 'banned') {
        error('You are restricted from joining this community.', 'Access Restricted');
        return;
      }
      if (res.status === 'requested') {
        setCommunity(prev => prev ? { ...prev, pendingRequests: [...(prev.pendingRequests || []), user.id] } : null);
        success(`Request to join "${community.name}" sent to admins!`, 'Request Sent');
      } else if (res.status === 'joined') {
        setCommunity(prev => prev ? { ...prev, memberCount: res.count, members: [...prev.members, user.id] } : null);
        confetti({ particleCount: 50, spread: 60 });
        success(`Welcome to ${community.name}! You are now an approved member.`, 'Welcome!');
      }
    }
  };

  // Create Community Post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !community || !postContent.trim()) return;

    setIsPosting(true);
    try {
      let uploadedUrl: string | undefined = undefined;
      if (postMediaFile) {
        uploadedUrl = await uploadFile(
          `communities/${community.id}/posts/${Date.now()}_${postMediaFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
          postMediaFile
        );
      }

      let pollData = undefined;
      if (postType === 'poll' && pollQuestion.trim()) {
        const validOpts = pollOptions.filter(o => o.trim().length > 0);
        if (validOpts.length >= 2) {
          pollData = {
            id: 'cpoll_' + Date.now(),
            communityId: community.id,
            question: pollQuestion.trim(),
            options: validOpts.map((opt, i) => ({
              id: 'opt_' + i + '_' + Date.now(),
              text: opt.trim(),
              votes: []
            })),
            createdBy: user.id,
            createdAt: new Date().toISOString()
          };
        }
      }

      let projectData = undefined;
      if (postType === 'project' && projectName.trim()) {
        projectData = {
          id: 'cproj_' + Date.now(),
          communityId: community.id,
          name: projectName.trim(),
          description: projectDesc.trim(),
          technologies: projectTechs.split(',').map(t => t.trim()).filter(Boolean),
          teamMembers: [{ name: user.displayName, role: 'Lead Author' }],
          githubUrl: projectGithub.trim() || undefined,
          demoUrl: projectDemo.trim() || undefined,
          createdBy: user.id,
          createdAt: new Date().toISOString()
        };
      }

      const newPost = await createCommunityPost({
        communityId: community.id,
        authorId: user.id,
        authorName: user.displayName,
        authorAvatar: user.photoURL,
        authorRole: user.role,
        authorDept: user.department ? `${user.department} ${user.year || ''}` : 'EATM Member',
        content: postContent.trim(),
        postType,
        mediaUrl: uploadedUrl,
        mediaUrls: uploadedUrl ? [uploadedUrl] : [],
        isPinned: postType === 'announcement' && isAdmin,
        poll: pollData,
        project: projectData
      });

      setPosts(prev => [newPost, ...prev]);
      setPostContent('');
      setPostMediaFile(null);
      setPostMediaPreview(null);
      setPollQuestion('');
      setPollOptions(['', '']);
      setProjectName('');
      setProjectDesc('');
      setProjectTechs('');
      setProjectGithub('');
      setProjectDemo('');
      setPostType('text');
      success('Post published to society feed!', 'Published');
    } catch (err: any) {
      error(err.message || 'Failed to publish post.');
    } finally {
      setIsPosting(false);
    }
  };

  // Like Post
  const handleLikePost = async (postId: string) => {
    if (!user) return;
    const res = await toggleCommunityPostLike(postId, user.id);
    setPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            likesCount: res.count,
            likes: res.liked ? [...p.likes, user.id] : p.likes.filter(uid => uid !== user.id)
          };
        }
        return p;
      })
    );
  };

  // Delete Post
  const handleDeletePost = async (postId: string) => {
    if (!user) return;
    await deleteCommunityPost(postId, user.id);
    setPosts(prev => prev.filter(p => p.id !== postId));
    success('Post removed from community feed.');
  };

  // Load & Submit Post Comments
  const handleToggleComments = async (postId: string) => {
    if (activeCommentPostId === postId) {
      setActiveCommentPostId(null);
      return;
    }
    setActiveCommentPostId(postId);
    if (!commentsMap[postId]) {
      const cmts = await fetchCommunityComments(postId);
      setCommentsMap(prev => ({ ...prev, [postId]: cmts }));
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = commentInputMap[postId]?.trim();
    if (!user || !community || !text) return;

    const newComment = await createCommunityComment({
      postId,
      communityId: community.id,
      authorId: user.id,
      authorName: user.displayName,
      authorAvatar: user.photoURL,
      authorDept: user.department,
      content: text
    });

    setCommentsMap(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newComment]
    }));
    setCommentInputMap(prev => ({ ...prev, [postId]: '' }));
    setPosts(prev =>
      prev.map(p => p.id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p)
    );
  };

  // Discussion Handlers
  const handleCreateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !community || !discTitle.trim() || !discContent.trim()) return;

    try {
      const newDisc = await createCommunityDiscussion({
        communityId: community.id,
        authorId: user.id,
        authorName: user.displayName,
        authorAvatar: user.photoURL,
        authorRole: user.role,
        authorDept: user.department,
        title: discTitle.trim(),
        content: discContent.trim(),
        category: discCategory
      });

      setDiscussions(prev => [newDisc, ...prev]);
      setDiscTitle('');
      setDiscContent('');
      setDiscussionModalOpen(false);
      success('Discussion thread opened!', 'Started');
    } catch (err: any) {
      error(err.message || 'Failed to start discussion.');
    }
  };

  const handleLikeDiscussion = async (discId: string) => {
    if (!user) return;
    const res = await toggleCommunityDiscussionLike(discId, user.id);
    setDiscussions(prev =>
      prev.map(d => {
        if (d.id === discId) {
          return {
            ...d,
            likesCount: res.count,
            likes: res.liked ? [...d.likes, user.id] : d.likes.filter(uid => uid !== user.id)
          };
        }
        return d;
      })
    );
  };

  const handleToggleDiscComments = async (discId: string) => {
    if (openDiscId === discId) {
      setOpenDiscId(null);
      return;
    }
    setOpenDiscId(discId);
    if (!discCommentsMap[discId]) {
      const cmts = await fetchCommunityDiscussionComments(discId);
      setDiscCommentsMap(prev => ({ ...prev, [discId]: cmts }));
    }
  };

  const handleAddDiscComment = async (discId: string) => {
    const text = discCommentInputMap[discId]?.trim();
    if (!user || !community || !text) return;

    const newComment = await createCommunityDiscussionComment({
      discussionId: discId,
      communityId: community.id,
      authorId: user.id,
      authorName: user.displayName,
      authorAvatar: user.photoURL,
      content: text
    });

    setDiscCommentsMap(prev => ({
      ...prev,
      [discId]: [...(prev[discId] || []), newComment]
    }));
    setDiscCommentInputMap(prev => ({ ...prev, [discId]: '' }));
    setDiscussions(prev =>
      prev.map(d => d.id === discId ? { ...d, commentsCount: (d.commentsCount || 0) + 1 } : d)
    );
  };

  // Chat Send Handler
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !community || (!chatInput.trim() && !chatAttachment)) return;

    setIsChatSending(true);
    try {
      let uploadedUrl: string | undefined = undefined;
      let mediaType: 'image' | 'file' | undefined = undefined;
      let fileName: string | undefined = undefined;
      let fileSize: string | undefined = undefined;

      if (chatAttachment) {
        uploadedUrl = await uploadFile(
          `communities/${community.id}/chat/${Date.now()}_${chatAttachment.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
          chatAttachment
        );
        mediaType = chatAttachment.type.startsWith('image/') ? 'image' : 'file';
        fileName = chatAttachment.name;
        fileSize = `${(chatAttachment.size / 1024).toFixed(1)} KB`;
      }

      await sendCommunityMessage({
        communityId: community.id,
        senderId: user.id,
        senderName: user.displayName,
        senderAvatar: user.photoURL,
        text: chatInput.trim(),
        mediaUrl: uploadedUrl,
        mediaType,
        fileName,
        fileSize,
        replyTo: replyingToMsg ? {
          id: replyingToMsg.id,
          text: replyingToMsg.text || 'Attachment',
          senderName: replyingToMsg.senderName
        } : undefined
      });

      setChatInput('');
      setChatAttachment(null);
      setChatAttachmentPreview(null);
      setReplyingToMsg(null);
    } catch (err: any) {
      error('Failed to send message.');
    } finally {
      setIsChatSending(false);
    }
  };

  // Upload Resource Handler
  const handleUploadResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !community || !resTitle.trim() || !resFile) return;

    setResUploading(true);
    try {
      const fileUrl = await uploadFile(
        `communities/${community.id}/resources/${Date.now()}_${resFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
        resFile
      );

      const ext = resFile.name.split('.').pop()?.toUpperCase() || 'FILE';
      const sizeStr = `${(resFile.size / (1024 * 1024)).toFixed(1)} MB`;

      const newRes = await uploadCommunityResource({
        communityId: community.id,
        title: resTitle.trim(),
        description: resDesc.trim(),
        fileUrl,
        fileType: ext,
        fileSize: sizeStr,
        uploadedBy: user.id,
        uploadedByName: user.displayName,
        uploadedByAvatar: user.photoURL,
        isMemberOnly: resIsMemberOnly
      });

      setResources(prev => [newRes, ...prev]);
      setResTitle('');
      setResDesc('');
      setResFile(null);
      setResourceModalOpen(false);
      success('Resource uploaded to community library!', 'Resource Added');
    } catch (err: any) {
      error(err.message || 'Failed to upload resource.');
    } finally {
      setResUploading(false);
    }
  };

  // Create Event Handler
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !community || !eventTitle.trim() || !eventDate || !eventTime) return;

    setEventCreating(true);
    try {
      let coverUrl = 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80';
      if (eventCoverFile) {
        coverUrl = await uploadFile(
          `communities/${community.id}/events/${Date.now()}_${eventCoverFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
          eventCoverFile
        );
      }

      const newEvent = await createCommunityEvent({
        communityId: community.id,
        title: eventTitle.trim(),
        description: eventDesc.trim(),
        date: eventDate,
        time: eventTime,
        location: eventLocation.trim() || 'EATM Campus',
        imageUrl: coverUrl,
        creatorId: user.id,
        creatorName: user.displayName
      }, user.id);

      setEvents(prev => [newEvent, ...prev]);
      setEventTitle('');
      setEventDesc('');
      setEventDate('');
      setEventTime('');
      setEventLocation('');
      setEventCoverFile(null);
      setEventCoverPreview(null);
      setEventModalOpen(false);
      success('Event scheduled and notified to members!', 'Event Created');
    } catch (err: any) {
      error(err.message || 'Failed to create event.');
    } finally {
      setEventCreating(false);
    }
  };

  // RSVP Event Handler
  const handleRsvp = async (eventId: string, status: 'going' | 'interested' | 'not_going') => {
    if (!user) return;
    const updated = await rsvpCommunityEvent(eventId, user.id, status);
    if (updated) {
      setEvents(prev => prev.map(e => e.id === eventId ? updated : e));
      success(status === 'going' ? 'RSVP Confirmed!' : 'Status updated.');
    }
  };

  // Poll Vote Handler
  const handleVotePoll = async (pollId: string, optionId: string, postId?: string) => {
    if (!user || !community) return;
    const updatedPost = await voteCommunityPoll(pollId, optionId, user.id, community.id, postId);
    if (updatedPost) {
      setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
      success('Vote recorded!', 'Voted');
    }
  };

  // Report Content Handler
  const handleOpenReport = (targetType: CommunityReport['targetType'], targetId: string, preview: string) => {
    setReportTargetType(targetType);
    setReportTargetId(targetId);
    setReportPreview(preview);
    setReportReason('Spam');
    setReportDesc('');
    setReportModalOpen(true);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !community) return;

    try {
      await submitCommunityReport({
        communityId: community.id,
        reporterId: user.id,
        reporterName: user.displayName,
        targetType: reportTargetType,
        targetId: reportTargetId,
        targetContentPreview: reportPreview,
        reason: reportReason,
        description: reportDesc.trim() || undefined
      });

      setReportModalOpen(false);
      success('Report submitted for moderator review. Thank you for keeping our community safe.', 'Report Received');
    } catch (err) {
      error('Failed to submit report.');
    }
  };

  // Join Request Management (Owner/Admin)
  const handleJoinReqAction = async (targetUserId: string, action: 'approve' | 'reject') => {
    if (!user || !community) return;
    const res = await handleCommunityJoinRequest(community.id, targetUserId, action, user.id);
    if (res.success && res.community) {
      setCommunity(res.community);
      success(action === 'approve' ? 'Applicant accepted into society!' : 'Join request declined.');
    }
  };

  // Member Management Actions
  const handleMemberRoleChange = async (targetUserId: string, newRole: CommunityRole) => {
    if (!user || !community) return;
    const res = await updateCommunityMemberRole(community.id, targetUserId, newRole, user.id);
    if (res.success && res.community) {
      setCommunity(res.community);
      success(`Updated member role to ${newRole.toUpperCase()}.`);
    }
  };

  const handleMemberRemove = async (targetUserId: string) => {
    if (!user || !community) return;
    const res = await removeCommunityMember(community.id, targetUserId, user.id);
    if (res.success && res.community) {
      setCommunity(res.community);
      success('Member removed from community.');
    }
  };

  const handleMemberBan = async (targetUserId: string) => {
    if (!user || !community) return;
    const res = await banCommunityMember(community.id, targetUserId, 'Banned by admin', user.id);
    if (res.success && res.community) {
      setCommunity(res.community);
      success('User has been banned and restricted from the community.');
    }
  };

  const handleMemberUnban = async (targetUserId: string) => {
    if (!user || !community) return;
    const res = await unbanCommunityMember(community.id, targetUserId, user.id);
    if (res.success && res.community) {
      setCommunity(res.community);
      success('User ban lifted.');
    }
  };

  // Settings: Update Community
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !community || !editName.trim()) return;

    try {
      const parsedRules = editRules.split('\n').map(r => r.trim()).filter(Boolean);
      const res = await updateCommunity(community.id, {
        name: editName.trim(),
        description: editDesc.trim(),
        category: editCategory,
        type: editType,
        rules: parsedRules,
        meetingTime: editMeeting.trim() || undefined,
        room: editRoom.trim() || undefined
      }, user.id);

      if (res.success && res.community) {
        setCommunity(res.community);
        success('Community settings saved successfully!', 'Settings Updated');
      }
    } catch (err) {
      error('Failed to update community settings.');
    }
  };

  // Ownership Transfer
  const handleTransferOwnership = async () => {
    if (!user || !community || !transferUserId) return;
    const res = await transferCommunityOwnership(community.id, transferUserId, user.id);
    if (res.success) {
      setCommunity(prev => prev ? { ...prev, ownerId: transferUserId } : null);
      setTransferModalOpen(false);
      success('Ownership transferred successfully.', 'Ownership Transferred');
    } else {
      error(res.error || 'Failed to transfer ownership.');
    }
  };

  // Delete Community
  const handleDeleteCommunity = async () => {
    if (!user || !community) return;
    const res = await deleteCommunity(community.id, user.id);
    if (res.success) {
      success(`Community "${community.name}" was deleted.`);
      navigate('/student/communities');
    } else {
      error(res.error || 'Failed to delete community.');
    }
  };

  // Filtered discussions by category
  const filteredDiscussions = useMemo(() => {
    if (selectedDiscCategory === 'All') return discussions;
    return discussions.filter(d => d.category.toLowerCase() === selectedDiscCategory.toLowerCase());
  }, [discussions, selectedDiscCategory]);

  // Filtered members list
  const filteredMemberList = useMemo(() => {
    if (!community) return [];
    return community.members
      .map(uid => allUsers.find(u => u.id === uid) || { id: uid, displayName: 'Student Member', department: 'EATM' } as UserProfile)
      .filter(m => m.displayName.toLowerCase().includes(memberSearchQuery.toLowerCase()) || m.department?.toLowerCase().includes(memberSearchQuery.toLowerCase()));
  }, [community, allUsers, memberSearchQuery]);

  // Pending applicant list
  const pendingApplicants = useMemo(() => {
    if (!community || !community.pendingRequests) return [];
    return community.pendingRequests.map(uid => 
      allUsers.find(u => u.id === uid) || { id: uid, displayName: 'Applicant Student', department: 'CSE' } as UserProfile
    );
  }, [community, allUsers]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-pulse p-4">
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl w-full"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl w-1/3"></div>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 h-96 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
          <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Community Not Found</h2>
        <Button onClick={() => navigate('/student/communities')} className="mt-4">
          Back to Communities
        </Button>
      </div>
    );
  }

  const isPrivateRestricted = community.type === 'private' && !isMember && !isAdmin;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/student/communities')}
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-[#0b4627] dark:hover:text-emerald-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Communities</span>
        </button>

        {isBanned && (
          <div className="px-3 py-1 bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 text-xs font-bold rounded-full border border-red-300 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" />
            <span>You are banned from this society</span>
          </div>
        )}
      </div>

      {/* Community Hero Header Banner */}
      <div className="relative bg-white dark:bg-[#111d15] rounded-3xl border border-gray-200/90 dark:border-[#1e3325] shadow-card overflow-hidden transition-colors">
        {/* Full Cover Banner */}
        <div className="relative h-48 sm:h-64 w-full bg-slate-900 overflow-hidden">
          <img
            src={community.coverUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80'}
            alt={community.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent"></div>

          {/* Top Badges */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {community.isOfficial ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-emerald-600/90 text-white backdrop-blur-md shadow-sm border border-emerald-400/40">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>✓ EATM Verified Society</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full bg-slate-900/80 text-gray-200 backdrop-blur-md border border-white/20">
                <span>Student Community</span>
              </span>
            )}

            {community.type === 'private' ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-amber-500/90 text-white backdrop-blur-md shadow-sm">
                <Lock className="w-3.5 h-3.5" />
                <span>Private Society</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-slate-900/80 text-emerald-300 backdrop-blur-md border border-emerald-400/40">
                <Globe className="w-3.5 h-3.5" />
                <span>Public Community</span>
              </span>
            )}
          </div>
        </div>

        {/* Profile & Info Section */}
        <div className="p-6 sm:p-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 -mt-14 sm:-mt-16 mb-5">
            {/* Logo Avatar */}
            <div className="flex items-end gap-4">
              <img
                src={community.logoUrl}
                alt={community.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover shadow-xl ring-4 ring-white dark:ring-[#111d15] bg-white shrink-0"
              />
              <div className="mb-1">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight leading-tight">
                  {community.name}
                </h1>
                <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-400 font-bold uppercase tracking-wider mt-0.5">
                  {community.category} Chapter
                </p>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <Button
                variant={isMember ? 'outline' : 'primary'}
                size="md"
                onClick={handleJoinToggle}
                icon={isMember ? <Check className="w-4 h-4 stroke-[2.5]" /> : hasPendingRequest ? <Lock className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                className="font-bold shadow-xs"
              >
                {isMember ? 'Joined ✓' : hasPendingRequest ? 'Request Sent (Pending)' : community.type === 'private' ? 'Request to Join' : 'Join Society'}
              </Button>

              {isAdmin && (
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setActiveTab('manage')}
                  icon={<Settings className="w-4 h-4" />}
                  className="font-semibold"
                >
                  Manage
                </Button>
              )}

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  success('Community link copied to clipboard!', 'Link Copied');
                }}
                className="p-2.5 rounded-xl border border-gray-200 dark:border-[#1e3325] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#16251c] transition"
                title="Share Community"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => handleOpenReport('member', community.id, community.name)}
                className="p-2.5 rounded-xl border border-gray-200 dark:border-[#1e3325] text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                title="Report Society"
              >
                <Flag className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-4xl mb-6">
            {community.description}
          </p>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-6 text-xs text-gray-500 dark:text-gray-400 font-semibold border-t border-gray-100 dark:border-[#1e3325] pt-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#0b4627] dark:text-emerald-400" />
              <span className="font-bold text-gray-900 dark:text-gray-100">{community.memberCount}</span>
              <span>Active Members</span>
            </div>
            {community.meetingTime && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>{community.meetingTime}</span>
              </div>
            )}
            {community.room && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-600" />
                <span>{community.room}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation Navigation Bar */}
        <div className="border-t border-gray-200/80 dark:border-[#1e3325] bg-gray-50/60 dark:bg-[#14261b] px-6 sm:px-8 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {[
            { id: 'home', label: 'Home', icon: Flame },
            { id: 'discussions', label: 'Discussions', icon: MessageSquare, count: discussions.length },
            { id: 'chat', label: 'Realtime Chat', icon: MessageCircle, highlight: true },
            { id: 'members', label: 'Members', icon: Users, count: community.memberCount },
            { id: 'events', label: 'Events', icon: Calendar, count: events.length },
            { id: 'resources', label: 'Resources', icon: BookOpen, count: resources.length },
            { id: 'about', label: 'About & Rules', icon: HelpCircle },
            ...(isAdmin ? [{ id: 'manage', label: 'Manage Society', icon: Settings, count: (community.pendingRequests?.length || 0) + reports.filter(r => r.status === 'pending').length }] : [])
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-[#0b4627] dark:border-emerald-400 text-[#0b4627] dark:text-emerald-400 font-extrabold'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${tab.highlight && !isActive ? 'text-emerald-600 animate-pulse' : ''}`} />
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && tab.count > 0 && (
                  <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                    isActive ? 'bg-[#0b4627] text-white dark:bg-emerald-500' : 'bg-gray-200 dark:bg-[#1f3627] text-gray-700 dark:text-gray-300'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Private Restriction Screen for non-members on private societies */}
      {isPrivateRestricted && activeTab !== 'about' && (
        <div className="bg-white dark:bg-[#111d15] rounded-3xl border border-amber-200 dark:border-amber-900/60 p-10 text-center shadow-card max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 mx-auto flex items-center justify-center border border-amber-200 dark:border-amber-800">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-gray-100">Private Community Content Restricted</h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
            This is an exclusive private student society at EATM. Internal discussions, chat streams, study resources, and posts are restricted to approved members.
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              onClick={handleJoinToggle}
              icon={hasPendingRequest ? <Check className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              className="px-6 font-bold"
            >
              {hasPendingRequest ? 'Join Request Under Review' : 'Request to Join Society'}
            </Button>
          </div>
        </div>
      )}

      {/* TAB CONTENT AREAS */}
      {(!isPrivateRestricted || activeTab === 'about') && (
        <>
          {/* 1. HOME TAB */}
          {activeTab === 'home' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Feed & Composer */}
              <div className="lg:col-span-2 space-y-6">
                {/* Pinned Announcement Highlight */}
                {posts.find(p => p.isPinned) && (
                  <div className="bg-gradient-to-r from-emerald-600 to-[#0b4627] text-white rounded-2xl p-5 shadow-card relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-2 text-emerald-200 text-xs font-bold uppercase tracking-wider">
                      <Pin className="w-3.5 h-3.5 fill-current rotate-45" />
                      <span>Official Pinned Announcement</span>
                    </div>
                    <h3 className="font-extrabold text-base mb-1.5">
                      {posts.find(p => p.isPinned)?.content.slice(0, 100)}...
                    </h3>
                    <p className="text-xs text-emerald-100 leading-relaxed line-clamp-3">
                      {posts.find(p => p.isPinned)?.content}
                    </p>
                  </div>
                )}

                {/* Create Post Card (if Member) */}
                {isMember && (
                  <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/90 dark:border-[#1e3325] p-5 shadow-card transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar src={user?.photoURL} name={user?.displayName || 'User'} size="md" />
                      <div className="flex-1">
                        <span className="text-xs font-bold text-gray-900 dark:text-gray-100 block">
                          Share with {community.name}
                        </span>
                        <span className="text-[10px] text-gray-400">Post updates, project showcases, polls, or questions</span>
                      </div>
                    </div>

                    <form onSubmit={handleCreatePost} className="space-y-3">
                      <textarea
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        rows={3}
                        placeholder={`What would you like to share or discuss in ${community.name}?`}
                        className="w-full p-3 text-xs bg-gray-50 dark:bg-[#16251c] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#1e3325] rounded-xl focus:ring-2 focus:ring-[#0b4627] outline-none resize-none leading-relaxed"
                        required
                      />

                      {/* Poll Builder View */}
                      {postType === 'poll' && (
                        <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#16251c] border border-gray-200 dark:border-[#1e3325] space-y-2.5">
                          <Input
                            label="Poll Question"
                            placeholder="e.g. Which topic should we cover in the next workshop?"
                            value={pollQuestion}
                            onChange={(e) => setPollQuestion(e.target.value)}
                            required
                          />
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Poll Options</label>
                            {pollOptions.map((opt, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder={`Option ${i + 1}`}
                                  value={opt}
                                  onChange={(e) => {
                                    const next = [...pollOptions];
                                    next[i] = e.target.value;
                                    setPollOptions(next);
                                  }}
                                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#111d15] border border-gray-200 dark:border-[#1e3325] rounded-lg"
                                />
                                {pollOptions.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}
                                    className="text-gray-400 hover:text-red-500"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                            {pollOptions.length < 5 && (
                              <button
                                type="button"
                                onClick={() => setPollOptions([...pollOptions, ''])}
                                className="text-xs font-bold text-[#0b4627] dark:text-emerald-400 hover:underline"
                              >
                                + Add Option
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Project Showcase Builder View */}
                      {postType === 'project' && (
                        <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#16251c] border border-gray-200 dark:border-[#1e3325] space-y-2.5">
                          <Input
                            label="Project Name"
                            placeholder="e.g. Smart Campus Navigation App"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            required
                          />
                          <Input
                            label="Technologies (Comma separated)"
                            placeholder="e.g. React, Node.js, Supabase, Python"
                            value={projectTechs}
                            onChange={(e) => setProjectTechs(e.target.value)}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              label="GitHub URL"
                              placeholder="https://github.com/..."
                              value={projectGithub}
                              onChange={(e) => setProjectGithub(e.target.value)}
                            />
                            <Input
                              label="Live Demo URL"
                              placeholder="https://..."
                              value={projectDemo}
                              onChange={(e) => setProjectDemo(e.target.value)}
                            />
                          </div>
                        </div>
                      )}

                      {/* Media Preview */}
                      {postMediaPreview && (
                        <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-[#1e3325] max-h-60">
                          <img src={postMediaPreview} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              setPostMediaFile(null);
                              setPostMediaPreview(null);
                            }}
                            className="absolute top-2 right-2 p-1 bg-black/70 text-white rounded-full hover:bg-red-600 transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      <input
                        type="file"
                        ref={postMediaInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            setPostMediaFile(file);
                            setPostMediaPreview(URL.createObjectURL(file));
                          }
                        }}
                      />

                      {/* Composer Footer Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-[#1e3325]">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => postMediaInputRef.current?.click()}
                            className="p-2 text-gray-500 hover:text-[#0b4627] dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-[#16251c] rounded-lg transition"
                            title="Attach Photo"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPostType(postType === 'poll' ? 'text' : 'poll')}
                            className={`p-2 rounded-lg transition ${
                              postType === 'poll' ? 'bg-emerald-100 text-[#0b4627] dark:bg-emerald-950' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-[#16251c]'
                            }`}
                            title="Create Poll"
                          >
                            <BarChart2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPostType(postType === 'project' ? 'text' : 'project')}
                            className={`p-2 rounded-lg transition ${
                              postType === 'project' ? 'bg-emerald-100 text-[#0b4627] dark:bg-emerald-950' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-[#16251c]'
                            }`}
                            title="Share Project"
                          >
                            <Code2 className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => setPostType(postType === 'announcement' ? 'text' : 'announcement')}
                              className={`p-2 rounded-lg transition ${
                                postType === 'announcement' ? 'bg-emerald-100 text-[#0b4627] dark:bg-emerald-950' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-[#16251c]'
                              }`}
                              title="Official Announcement"
                            >
                              <Pin className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <Button
                          type="submit"
                          variant="primary"
                          size="sm"
                          isLoading={isPosting}
                          className="px-5 font-semibold"
                        >
                          Post
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Posts Feed */}
                <div className="space-y-5">
                  {posts.length === 0 ? (
                    <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200 dark:border-[#1e3325] p-10 text-center">
                      <MessageSquare className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">No community posts yet</h4>
                      <p className="text-xs text-gray-500 mt-1">Be the first to share an update or start a conversation!</p>
                    </div>
                  ) : (
                    posts.map(post => {
                      const isLiked = user ? post.likes.includes(user.id) : false;
                      const canDelete = isOwner || isAdmin || (user && post.authorId === user.id);

                      return (
                        <div
                          key={post.id}
                          className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/90 dark:border-[#1e3325] p-5 shadow-card transition-colors"
                        >
                          {/* Post Header */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              <Avatar src={post.authorAvatar} name={post.authorName} size="md" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <Link
                                    to={`/profile/${post.authorId}`}
                                    className="font-bold text-xs sm:text-sm text-gray-900 dark:text-gray-100 hover:text-[#0b4627] transition"
                                  >
                                    {post.authorName}
                                  </Link>
                                  {post.isPinned && (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-[#0b4627] dark:text-emerald-300">
                                      PINNED
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-gray-400">
                                  {post.authorDept || 'Student'} • {new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => handleDeletePost(post.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
                                  title="Delete Post"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleOpenReport('post', post.id, post.content)}
                                className="p-1.5 text-gray-400 hover:text-amber-600 rounded-lg"
                                title="Report Post"
                              >
                                <Flag className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Post Content */}
                          <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed mb-3 whitespace-pre-line">
                            {post.content}
                          </p>

                          {/* Post Image */}
                          {post.mediaUrl && (
                            <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-[#1e3325] mb-3 max-h-96">
                              <img src={post.mediaUrl} alt="Media" className="w-full h-full object-cover" />
                            </div>
                          )}

                          {/* Interactive Poll */}
                          {post.poll && (
                            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#16251c] border border-gray-200 dark:border-[#1e3325] mb-3 space-y-2.5">
                              <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                                <BarChart2 className="w-3.5 h-3.5 text-[#0b4627] dark:text-emerald-400" />
                                <span>{post.poll.question}</span>
                              </h4>
                              {post.poll.options.map(opt => {
                                const totalVotes = post.poll?.options.reduce((sum, o) => sum + (o.votes?.length || 0), 0) || 0;
                                const optVotes = opt.votes?.length || 0;
                                const pct = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
                                const hasVoted = user && opt.votes?.includes(user.id);

                                return (
                                  <div
                                    key={opt.id}
                                    onClick={() => isMember && handleVotePoll(post.poll!.id, opt.id, post.id)}
                                    className={`relative p-2.5 rounded-xl border transition-all cursor-pointer overflow-hidden ${
                                      hasVoted
                                        ? 'border-[#0b4627] bg-emerald-50/70 dark:bg-emerald-950/40 font-bold'
                                        : 'border-gray-200 dark:border-[#1e3325] bg-white dark:bg-[#111d15] hover:border-gray-300'
                                    }`}
                                  >
                                    <div
                                      className="absolute left-0 top-0 bottom-0 bg-emerald-100/60 dark:bg-emerald-900/40 transition-all duration-300"
                                      style={{ width: `${pct}%` }}
                                    />
                                    <div className="relative flex items-center justify-between text-xs z-10">
                                      <span className="text-gray-900 dark:text-gray-100">{opt.text}</span>
                                      <span className="text-gray-500 font-semibold">{pct}% ({optVotes})</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Project Showcase Card */}
                          {post.project && (
                            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50/70 to-white dark:from-[#16251c] dark:to-[#111d15] border border-emerald-100 dark:border-[#1e3325] mb-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-[#0b4627] dark:text-emerald-400" />
                                  <span>{post.project.name}</span>
                                </h4>
                                <div className="flex items-center gap-2">
                                  {post.project.githubUrl && (
                                    <a
                                      href={post.project.githubUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 bg-gray-900 text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
                                    >
                                      <Code2 className="w-3 h-3" />
                                      <span>Code</span>
                                    </a>
                                  )}
                                  {post.project.demoUrl && (
                                    <a
                                      href={post.project.demoUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 bg-[#0b4627] text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      <span>Demo</span>
                                    </a>
                                  )}
                                </div>
                              </div>
                              <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
                                {post.project.description}
                              </p>
                              {post.project.technologies && post.project.technologies.length > 0 && (
                                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                  {post.project.technologies.map(t => (
                                    <span key={t} className="px-2 py-0.5 text-[9px] font-bold bg-white dark:bg-[#111d15] border border-gray-200 dark:border-[#1e3325] rounded-full text-gray-700 dark:text-gray-300">
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Post Action Buttons */}
                          <div className="flex items-center gap-4 pt-3 border-t border-gray-100 dark:border-[#1e3325] text-xs">
                            <button
                              type="button"
                              onClick={() => handleLikePost(post.id)}
                              className={`flex items-center gap-1.5 font-semibold transition ${
                                isLiked ? 'text-rose-600' : 'text-gray-500 hover:text-[#0b4627]'
                              }`}
                            >
                              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current text-rose-600' : ''}`} />
                              <span>{post.likesCount}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleComments(post.id)}
                              className="flex items-center gap-1.5 font-semibold text-gray-500 hover:text-[#0b4627] transition"
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span>{post.commentsCount || 0} Comments</span>
                            </button>
                          </div>

                          {/* Threaded Comments Section */}
                          {activeCommentPostId === post.id && (
                            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-[#1e3325] space-y-3">
                              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                                {(commentsMap[post.id] || []).map(cmt => (
                                  <div key={cmt.id} className="flex items-start gap-2.5 bg-gray-50/80 dark:bg-[#16251c] p-2.5 rounded-xl text-xs">
                                    <Avatar src={cmt.authorAvatar} name={cmt.authorName} size="xs" />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-gray-900 dark:text-gray-100">{cmt.authorName}</span>
                                        <span className="text-[10px] text-gray-400">
                                          {new Date(cmt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                      <p className="text-gray-700 dark:text-gray-300 mt-0.5">{cmt.content}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Comment Input */}
                              {isMember && (
                                <div className="flex items-center gap-2 pt-1">
                                  <input
                                    type="text"
                                    value={commentInputMap[post.id] || ''}
                                    onChange={(e) => setCommentInputMap({ ...commentInputMap, [post.id]: e.target.value })}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                                    placeholder="Write a comment..."
                                    className="flex-1 px-3 py-1.5 text-xs bg-gray-50 dark:bg-[#16251c] border border-gray-200 dark:border-[#1e3325] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0b4627]"
                                  />
                                  <Button size="sm" onClick={() => handleAddComment(post.id)} className="px-3">
                                    <Send className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Widgets */}
              <div className="space-y-6">
                {/* About Society Card */}
                <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/90 dark:border-[#1e3325] p-5 shadow-card space-y-3.5 transition-colors">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#0b4627] dark:text-emerald-400" />
                    <span>Society Guidelines</span>
                  </h3>
                  <div className="space-y-2">
                    {(community.rules || [
                      'Respect all members and campus policies.',
                      'Constructive technical and academic discussions only.'
                    ]).map((r, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#0b4627] dark:text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p>{r}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upcoming Events Widget */}
                <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/90 dark:border-[#1e3325] p-5 shadow-card space-y-3.5 transition-colors">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#0b4627] dark:text-emerald-400" />
                      <span>Upcoming Events</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('events')}
                      className="text-[11px] font-bold text-[#0b4627] dark:text-emerald-400 hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  {events.length === 0 ? (
                    <p className="text-xs text-gray-400">No events scheduled right now.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {events.slice(0, 2).map(ev => (
                        <div key={ev.id} className="p-3 rounded-xl bg-gray-50 dark:bg-[#16251c] border border-gray-200/80 dark:border-[#1e3325] space-y-1.5">
                          <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{ev.title}</h4>
                          <p className="text-[10px] text-gray-500">{ev.date} • {ev.time}</p>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                              {ev.attendees?.length || 0} Attending
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRsvp(ev.id, 'going')}
                              className="px-2.5 py-1 bg-[#0b4627] text-white text-[10px] font-bold rounded-lg"
                            >
                              RSVP
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Featured Study Resources */}
                <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/90 dark:border-[#1e3325] p-5 shadow-card space-y-3.5 transition-colors">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#0b4627] dark:text-emerald-400" />
                      <span>Study Resources</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('resources')}
                      className="text-[11px] font-bold text-[#0b4627] dark:text-emerald-400 hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  {resources.length === 0 ? (
                    <p className="text-xs text-gray-400">No resources uploaded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {resources.slice(0, 3).map(res => (
                        <div key={res.id} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-[#16251c] text-xs">
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="font-bold text-gray-900 dark:text-gray-100 truncate">{res.title}</p>
                            <span className="text-[10px] text-gray-400">{res.fileType} • {res.fileSize}</span>
                          </div>
                          <a
                            href={res.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-[#0b4627] dark:text-emerald-400 hover:bg-emerald-50 rounded-lg shrink-0"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. DISCUSSIONS TAB */}
          {activeTab === 'discussions' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#111d15] p-5 rounded-2xl border border-gray-200/90 dark:border-[#1e3325]">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {['All', 'General', 'Questions', 'Projects', 'Help', 'Announcements'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedDiscCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
                        selectedDiscCategory === cat
                          ? 'bg-[#0b4627] text-white'
                          : 'bg-gray-100 dark:bg-[#16251c] text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {isMember && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setDiscussionModalOpen(true)}
                    icon={<Plus className="w-4 h-4" />}
                    className="font-bold shrink-0"
                  >
                    Start Discussion
                  </Button>
                )}
              </div>

              {/* Discussions List */}
              <div className="space-y-4">
                {filteredDiscussions.length === 0 ? (
                  <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200 dark:border-[#1e3325] p-12 text-center">
                    <MessageSquare className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">No discussions in this category</h4>
                    <p className="text-xs text-gray-500 mt-1">Start a discussion thread to brainstorm with your peers!</p>
                  </div>
                ) : (
                  filteredDiscussions.map(disc => {
                    const isLiked = user ? disc.likes.includes(user.id) : false;
                    const isOpen = openDiscId === disc.id;

                    return (
                      <div
                        key={disc.id}
                        className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/90 dark:border-[#1e3325] p-5 shadow-card transition-colors space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar src={disc.authorAvatar} name={disc.authorName} size="sm" />
                            <div>
                              <span className="font-bold text-xs text-gray-900 dark:text-gray-100">{disc.authorName}</span>
                              <span className="text-[10px] text-gray-400 block">
                                {disc.authorDept || 'Student'} • {new Date(disc.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </div>

                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-[#0b4627] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {disc.category}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-sm font-extrabold text-gray-900 dark:text-gray-100 mb-1">
                            {disc.title}
                          </h3>
                          <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                            {disc.content}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-[#1e3325] text-xs">
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => handleLikeDiscussion(disc.id)}
                              className={`flex items-center gap-1.5 font-bold ${
                                isLiked ? 'text-rose-600' : 'text-gray-500 hover:text-[#0b4627]'
                              }`}
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span>{disc.likesCount}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleDiscComments(disc.id)}
                              className="flex items-center gap-1.5 font-bold text-gray-500 hover:text-[#0b4627]"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>{disc.commentsCount} Replies</span>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleOpenReport('discussion', disc.id, disc.title)}
                            className="text-gray-400 hover:text-amber-600"
                            title="Report Thread"
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Threaded Discussion Comments */}
                        {isOpen && (
                          <div className="pt-3 border-t border-gray-100 dark:border-[#1e3325] space-y-3">
                            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                              {(discCommentsMap[disc.id] || []).map(cmt => (
                                <div key={cmt.id} className="p-3 rounded-xl bg-gray-50 dark:bg-[#16251c] text-xs space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-gray-900 dark:text-gray-100">{cmt.authorName}</span>
                                    <span className="text-[10px] text-gray-400">
                                      {new Date(cmt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className="text-gray-700 dark:text-gray-300">{cmt.content}</p>
                                </div>
                              ))}
                            </div>

                            {isMember && (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={discCommentInputMap[disc.id] || ''}
                                  onChange={(e) => setDiscCommentInputMap({ ...discCommentInputMap, [disc.id]: e.target.value })}
                                  onKeyDown={(e) => e.key === 'Enter' && handleAddDiscComment(disc.id)}
                                  placeholder="Reply to discussion..."
                                  className="flex-1 px-3 py-2 text-xs bg-gray-50 dark:bg-[#16251c] border border-gray-200 dark:border-[#1e3325] rounded-xl focus:ring-1 focus:ring-[#0b4627]"
                                />
                                <Button size="sm" onClick={() => handleAddDiscComment(disc.id)}>
                                  Reply
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* 3. REALTIME CHAT TAB */}
          {activeTab === 'chat' && (
            <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/90 dark:border-[#1e3325] shadow-card overflow-hidden h-[650px] flex flex-col transition-colors">
              {/* Chat Stream Header */}
              <div className="p-4 border-b border-gray-200 dark:border-[#1e3325] bg-gray-50/70 dark:bg-[#16251c] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={community.logoUrl}
                    alt={community.name}
                    className="w-10 h-10 rounded-xl object-cover ring-1 ring-gray-200"
                  />
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900 dark:text-gray-100">{community.name} Live Chat</h3>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>{community.memberCount} members in channel</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Message Stream */}
              <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#f8faf9] dark:bg-[#0c1610]">
                {messages.length === 0 ? (
                  <div className="text-center py-16">
                    <MessageCircle className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-gray-600 dark:text-gray-300">Welcome to the live chat room!</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Send a message to start conversing with society members.</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMe = user?.id === msg.senderId;
                    const senderRole = getUserRole(msg.senderId);

                    return (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isMe && <Avatar src={msg.senderAvatar} name={msg.senderName} size="sm" />}
                        <div className={`max-w-[80%] sm:max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                          {!isMe && (
                            <div className="flex items-center gap-1.5 mb-1 px-1">
                              <span className="text-[11px] font-bold text-gray-900 dark:text-gray-100">{msg.senderName}</span>
                              {senderRole === 'owner' && (
                                <span className="px-1.5 py-0.2 text-[8px] font-black bg-amber-100 text-amber-900 rounded-full">OWNER</span>
                              )}
                              {senderRole === 'admin' && (
                                <span className="px-1.5 py-0.2 text-[8px] font-black bg-emerald-100 text-emerald-900 rounded-full">ADMIN</span>
                              )}
                            </div>
                          )}

                          {/* Reply preview if any */}
                          {msg.replyTo && (
                            <div className="mb-1 p-2 rounded-lg bg-black/5 dark:bg-white/5 border-l-2 border-[#0b4627] text-[10px] text-gray-500">
                              <span className="font-bold block text-gray-700 dark:text-gray-300">{msg.replyTo.senderName}</span>
                              <span className="truncate block">{msg.replyTo.text}</span>
                            </div>
                          )}

                          {/* Chat Bubble */}
                          <div
                            className={`p-3 rounded-2xl text-xs leading-relaxed ${
                              isMe
                                ? 'bg-[#0b4627] text-white rounded-br-xs shadow-xs'
                                : 'bg-white dark:bg-[#16251c] text-gray-900 dark:text-gray-100 border border-gray-200/80 dark:border-[#1f3627] rounded-bl-xs shadow-xs'
                            }`}
                          >
                            {/* Attached Image / File */}
                            {msg.mediaUrl && (
                              <div className="mb-2 rounded-xl overflow-hidden">
                                {msg.mediaType === 'image' ? (
                                  <img src={msg.mediaUrl} alt="Attached" className="max-h-60 rounded-xl object-cover" />
                                ) : (
                                  <a
                                    href={msg.mediaUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2.5 rounded-lg bg-black/10 dark:bg-white/10 flex items-center gap-2 text-xs font-bold"
                                  >
                                    <FileText className="w-4 h-4" />
                                    <span className="truncate">{msg.fileName || 'Attached Document'}</span>
                                  </a>
                                )}
                              </div>
                            )}

                            <p className="whitespace-pre-line">{msg.text}</p>
                            <span className={`text-[9px] block text-right mt-1 ${isMe ? 'text-emerald-200' : 'text-gray-400'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Composer */}
              {isMember ? (
                <div className="p-3 bg-white dark:bg-[#111d15] border-t border-gray-200 dark:border-[#1e3325]">
                  {replyingToMsg && (
                    <div className="flex items-center justify-between p-2 mb-2 bg-emerald-50 dark:bg-[#16251c] rounded-xl text-xs">
                      <div className="flex items-center gap-2">
                        <CornerUpLeft className="w-3.5 h-3.5 text-[#0b4627]" />
                        <span className="text-gray-600 dark:text-gray-300">Replying to <b>{replyingToMsg.senderName}</b></span>
                      </div>
                      <button onClick={() => setReplyingToMsg(null)} className="text-gray-400 hover:text-red-500">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {chatAttachmentPreview && (
                    <div className="flex items-center gap-2 p-2 mb-2 bg-gray-50 dark:bg-[#16251c] rounded-xl">
                      <img src={chatAttachmentPreview} alt="Attached" className="w-10 h-10 object-cover rounded-lg" />
                      <span className="text-xs text-gray-700 truncate">{chatAttachment?.name}</span>
                      <button onClick={() => { setChatAttachment(null); setChatAttachmentPreview(null); }} className="ml-auto text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <input
                    type="file"
                    ref={chatFileInputRef}
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        setChatAttachment(file);
                        if (file.type.startsWith('image/')) {
                          setChatAttachmentPreview(URL.createObjectURL(file));
                        }
                      }
                    }}
                  />

                  <form onSubmit={handleSendChatMessage} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => chatFileInputRef.current?.click()}
                      className="p-2 text-gray-500 hover:text-[#0b4627] rounded-xl hover:bg-gray-100 dark:hover:bg-[#16251c] transition"
                      title="Attach File"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type your message to community..."
                      className="flex-1 px-4 py-2.5 text-xs bg-gray-50 dark:bg-[#16251c] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#1e3325] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0b4627]"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={isChatSending}
                      className="px-4 py-2.5"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 dark:bg-[#16251c] border-t border-gray-200 dark:border-[#1e3325] text-center text-xs text-gray-500">
                  Join {community.name} to participate in live group conversations.
                </div>
              )}
            </div>
          )}

          {/* 4. MEMBERS TAB */}
          {activeTab === 'members' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#111d15] p-5 rounded-2xl border border-gray-200/90 dark:border-[#1e3325]">
                <div className="relative flex-1 sm:max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    placeholder="Search society members..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-[#16251c] border border-gray-200 dark:border-[#1e3325] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0b4627]"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                  <span>Total Members: {filteredMemberList.length}</span>
                </div>
              </div>

              {/* Members Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMemberList.map(mem => {
                  const role = getUserRole(mem.id);
                  const isThisOwner = role === 'owner';
                  const isThisAdmin = role === 'admin';
                  const isThisMod = role === 'moderator';

                  return (
                    <div
                      key={mem.id}
                      className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/90 dark:border-[#1e3325] p-4 shadow-card flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar src={mem.photoURL} name={mem.displayName} size="md" />
                        <div className="min-w-0 flex-1">
                          <Link
                            to={`/profile/${mem.id}`}
                            className="font-bold text-xs sm:text-sm text-gray-900 dark:text-gray-100 hover:text-[#0b4627] truncate block"
                          >
                            {mem.displayName}
                          </Link>
                          <p className="text-[10px] text-gray-400 truncate">
                            {mem.department || 'Student'} {mem.year ? `• ${mem.year}` : ''}
                          </p>
                          <div className="mt-1">
                            {isThisOwner && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                                OWNER
                              </span>
                            )}
                            {isThisAdmin && !isThisOwner && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                                ADMIN
                              </span>
                            )}
                            {isThisMod && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300">
                                MODERATOR
                              </span>
                            )}
                            {!isThisOwner && !isThisAdmin && !isThisMod && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-gray-100 text-gray-700 dark:bg-[#16251c] dark:text-gray-300">
                                MEMBER
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Member Actions */}
                      <div className="flex items-center gap-1.5">
                        <Link
                          to={`/student/messages?userId=${mem.id}`}
                          className="p-2 text-gray-500 hover:text-[#0b4627] hover:bg-gray-100 dark:hover:bg-[#16251c] rounded-xl transition"
                          title="Direct Message"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </Link>

                        {/* Admin / Owner moderation actions */}
                        {isAdmin && mem.id !== user?.id && !isThisOwner && (
                          <div className="relative group">
                            <button
                              type="button"
                              className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-xl"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                            <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-white dark:bg-[#16251c] border border-gray-200 dark:border-[#1e3325] rounded-xl shadow-xl p-1 z-30 w-44">
                              {isOwner && (
                                <button
                                  type="button"
                                  onClick={() => handleMemberRoleChange(mem.id, isThisAdmin ? 'member' : 'admin')}
                                  className="w-full text-left px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-[#1e3325] rounded-lg"
                                >
                                  {isThisAdmin ? 'Remove as Admin' : 'Promote to Admin'}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleMemberRoleChange(mem.id, isThisMod ? 'member' : 'moderator')}
                                className="w-full text-left px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-[#1e3325] rounded-lg"
                              >
                                {isThisMod ? 'Remove Moderator' : 'Make Moderator'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMemberRemove(mem.id)}
                                className="w-full text-left px-3 py-1.5 text-xs font-semibold text-amber-600 hover:bg-amber-50 rounded-lg"
                              >
                                Remove from Club
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMemberBan(mem.id)}
                                className="w-full text-left px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg"
                              >
                                Ban Member
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. EVENTS TAB */}
          {activeTab === 'events' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-white dark:bg-[#111d15] p-5 rounded-2xl border border-gray-200/90 dark:border-[#1e3325]">
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900 dark:text-gray-100">Society Events & Workshops</h3>
                  <p className="text-xs text-gray-500">Official workshops, competitions, and meetups</p>
                </div>

                {isAdmin && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setEventModalOpen(true)}
                    icon={<Plus className="w-4 h-4" />}
                    className="font-bold"
                  >
                    Schedule Event
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.length === 0 ? (
                  <div className="col-span-3 bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200 dark:border-[#1e3325] p-12 text-center">
                    <Calendar className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">No events scheduled</h4>
                    <p className="text-xs text-gray-500 mt-1">Check back soon for hackathons and technical seminars!</p>
                  </div>
                ) : (
                  events.map(ev => {
                    const isAttending = user && ev.attendees?.some(a => a.userId === user.id && a.status === 'going');

                    return (
                      <div
                        key={ev.id}
                        className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/90 dark:border-[#1e3325] overflow-hidden shadow-card flex flex-col justify-between"
                      >
                        <div className="relative h-40 bg-gray-100 dark:bg-[#16251c]">
                          <img src={ev.imageUrl} alt={ev.title} className="w-full h-full object-cover" />
                        </div>

                        <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                          <div>
                            <h4 className="font-extrabold text-sm text-gray-900 dark:text-gray-100">{ev.title}</h4>
                            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mt-1">{ev.description}</p>
                            <div className="mt-3 space-y-1 text-xs text-gray-500">
                              <p className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-emerald-600" /> {ev.date} • {ev.time}</p>
                              <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-amber-600" /> {ev.location}</p>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-gray-100 dark:border-[#1e3325] flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                              {ev.attendees?.length || 0} RSVPs
                            </span>
                            <Button
                              variant={isAttending ? 'outline' : 'primary'}
                              size="sm"
                              onClick={() => handleRsvp(ev.id, isAttending ? 'not_going' : 'going')}
                            >
                              {isAttending ? 'Going ✓' : 'RSVP Going'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* 6. RESOURCES TAB */}
          {activeTab === 'resources' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-white dark:bg-[#111d15] p-5 rounded-2xl border border-gray-200/90 dark:border-[#1e3325]">
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900 dark:text-gray-100">Study Materials & Guides</h3>
                  <p className="text-xs text-gray-500">Handouts, roadmaps, question banks, and code archives</p>
                </div>

                {isMember && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setResourceModalOpen(true)}
                    icon={<Plus className="w-4 h-4" />}
                    className="font-bold"
                  >
                    Upload Resource
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.length === 0 ? (
                  <div className="col-span-3 bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200 dark:border-[#1e3325] p-12 text-center">
                    <BookOpen className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">No resources uploaded yet</h4>
                    <p className="text-xs text-gray-500 mt-1">Upload study materials to help fellow students prepare!</p>
                  </div>
                ) : (
                  resources.map(res => (
                    <div
                      key={res.id}
                      className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/90 dark:border-[#1e3325] p-5 shadow-card flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-[#0b4627] dark:bg-emerald-950 dark:text-emerald-300">
                            {res.fileType}
                          </span>
                          <span className="text-[10px] text-gray-400">{res.fileSize}</span>
                        </div>
                        <h4 className="font-bold text-xs text-gray-900 dark:text-gray-100 leading-snug">{res.title}</h4>
                        <p className="text-xs text-gray-500 line-clamp-2">{res.description}</p>
                      </div>

                      <div className="pt-3 border-t border-gray-100 dark:border-[#1e3325] flex items-center justify-between">
                        <span className="text-[10px] text-gray-400">By {res.uploadedByName}</span>
                        <a
                          href={res.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-[#0b4627] hover:bg-[#0f5132] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 7. ABOUT & RULES TAB */}
          {activeTab === 'about' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/90 dark:border-[#1e3325] p-6 shadow-card space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-gray-100">
                    About {community.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                    {community.description}
                  </p>

                  <div className="pt-4 border-t border-gray-100 dark:border-[#1e3325] grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Category</span>
                      <span className="font-bold text-gray-900 dark:text-gray-100">{community.category}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Society Type</span>
                      <span className="font-bold text-gray-900 dark:text-gray-100 capitalize">{community.type || 'Public'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Regular Meeting Time</span>
                      <span className="font-bold text-gray-900 dark:text-gray-100">{community.meetingTime || 'As scheduled'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Campus Venue</span>
                      <span className="font-bold text-gray-900 dark:text-gray-100">{community.room || 'EATM Campus'}</span>
                    </div>
                  </div>
                </div>

                {/* Society Rules */}
                <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/90 dark:border-[#1e3325] p-6 shadow-card space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#0b4627] dark:text-emerald-400" />
                    <span>Official Community Rules</span>
                  </h3>
                  <div className="space-y-3">
                    {(community.rules || []).map((rule, i) => (
                      <div key={i} className="flex items-start gap-3 text-xs text-gray-700 dark:text-gray-300">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#0b4627] dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="leading-relaxed">{rule}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Leadership Roster */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/90 dark:border-[#1e3325] p-6 shadow-card space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-gray-100">
                    Society Leadership
                  </h3>
                  <div className="space-y-3">
                    {/* Owner Card */}
                    {allUsers.find(u => u.id === community.ownerId) && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80">
                        <Avatar src={allUsers.find(u => u.id === community.ownerId)?.photoURL} name={allUsers.find(u => u.id === community.ownerId)?.displayName || 'Owner'} size="sm" />
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                            {allUsers.find(u => u.id === community.ownerId)?.displayName}
                          </p>
                          <span className="text-[10px] font-extrabold text-amber-800 dark:text-amber-400">FOUNDER & OWNER</span>
                        </div>
                      </div>
                    )}

                    {/* Admins */}
                    {(community.admins || []).filter(aid => aid !== community.ownerId).map(aid => {
                      const adm = allUsers.find(u => u.id === aid);
                      return (
                        <div key={aid} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-[#16251c]">
                          <Avatar src={adm?.photoURL} name={adm?.displayName || 'Admin'} size="sm" />
                          <div>
                            <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{adm?.displayName || aid}</p>
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">COMMUNITY ADMIN</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 8. MANAGE SOCIETY TAB (OWNER / ADMIN) */}
          {activeTab === 'manage' && isAdmin && (
            <div className="space-y-6">
              {/* Join Requests Queue for Private Societies */}
              <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/90 dark:border-[#1e3325] p-6 shadow-card space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-[#0b4627] dark:text-emerald-400" />
                      <span>Pending Join Requests ({pendingApplicants.length})</span>
                    </h3>
                    <p className="text-xs text-gray-500">Review student applications for membership access</p>
                  </div>
                </div>

                {pendingApplicants.length === 0 ? (
                  <p className="text-xs text-gray-400 py-3">No pending join requests.</p>
                ) : (
                  <div className="space-y-3">
                    {pendingApplicants.map(app => (
                      <div
                        key={app.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#16251c] border border-gray-200 dark:border-[#1e3325]"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar src={app.photoURL} name={app.displayName} size="sm" />
                          <div>
                            <Link to={`/profile/${app.id}`} className="text-xs font-bold text-gray-900 dark:text-gray-100 hover:text-[#0b4627]">
                              {app.displayName}
                            </Link>
                            <span className="text-[10px] text-gray-400 block">{app.department || 'Student'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleJoinReqAction(app.id, 'reject')}>
                            Reject
                          </Button>
                          <Button size="sm" variant="primary" onClick={() => handleJoinReqAction(app.id, 'approve')}>
                            Accept
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Moderation Reports Queue */}
              <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/90 dark:border-[#1e3325] p-6 shadow-card space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  <span>Content Moderation Queue ({reports.filter(r => r.status === 'pending').length})</span>
                </h3>

                {reports.filter(r => r.status === 'pending').length === 0 ? (
                  <p className="text-xs text-gray-400 py-2">No reported content in moderation queue.</p>
                ) : (
                  <div className="space-y-3">
                    {reports.filter(r => r.status === 'pending').map(rep => (
                      <div key={rep.id} className="p-4 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-red-700">Reason: {rep.reason}</span>
                          <span className="text-[10px] text-gray-400">Reported by {rep.reporterName}</span>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 italic">"{rep.targetContentPreview}"</p>
                        <div className="flex items-center gap-2 pt-2">
                          <Button size="sm" variant="outline" onClick={() => resolveCommunityReport(rep.id, 'dismiss', user!.id, user!.displayName)}>
                            Dismiss
                          </Button>
                          <Button size="sm" variant="crimson" onClick={() => resolveCommunityReport(rep.id, 'remove_content', user!.id, user!.displayName)}>
                            Remove Content
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Community Settings Form */}
              <div className="bg-white dark:bg-[#111d15] rounded-2xl border border-gray-200/90 dark:border-[#1e3325] p-6 shadow-card space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-gray-100">
                  Society Settings & Permissions
                </h3>

                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <Input
                    label="Society Name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Category"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                    />
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                        Society Access Type
                      </label>
                      <select
                        value={editType}
                        onChange={(e) => setEditType(e.target.value as CommunityType)}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-[#16251c] border border-gray-200 dark:border-[#1e3325] rounded-xl"
                      >
                        <option value="public">Public (Anyone can join immediately)</option>
                        <option value="private">Private (Join requires approval)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                      Description
                    </label>
                    <textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      rows={3}
                      className="w-full p-3 text-xs bg-white dark:bg-[#16251c] border border-gray-200 dark:border-[#1e3325] rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Meeting Schedule"
                      value={editMeeting}
                      onChange={(e) => setEditMeeting(e.target.value)}
                    />
                    <Input
                      label="Venue / Room"
                      value={editRoom}
                      onChange={(e) => setEditRoom(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                      Official Rules (One per line)
                    </label>
                    <textarea
                      value={editRules}
                      onChange={(e) => setEditRules(e.target.value)}
                      rows={3}
                      className="w-full p-3 text-xs bg-white dark:bg-[#16251c] border border-gray-200 dark:border-[#1e3325] rounded-xl"
                    />
                  </div>

                  <Button type="submit" variant="primary" size="sm">
                    Save Society Settings
                  </Button>
                </form>
              </div>

              {/* Danger Zone: Ownership Transfer & Delete */}
              {isOwner && (
                <div className="bg-red-50/50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-900/60 p-6 space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-red-700 dark:text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Danger Zone</span>
                  </h3>
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100">Transfer Ownership</p>
                      <p className="text-[11px] text-gray-500">Transfer primary ownership of this society to another member.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setTransferModalOpen(true)}>
                      Transfer Ownership
                    </Button>
                  </div>
                  <div className="flex items-center justify-between gap-4 flex-wrap pt-3 border-t border-red-200/60 dark:border-red-900/40">
                    <div>
                      <p className="text-xs font-bold text-red-600">Delete Community</p>
                      <p className="text-[11px] text-gray-500">Permanently delete this society and all its channels.</p>
                    </div>
                    <Button variant="crimson" size="sm" onClick={() => setDeleteModalOpen(true)}>
                      Delete Community
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* MODAL: Start Discussion */}
      <Modal
        isOpen={discussionModalOpen}
        onClose={() => setDiscussionModalOpen(false)}
        title="Start a Community Discussion"
        maxWidth="md"
      >
        <form onSubmit={handleCreateDiscussion} className="space-y-4">
          <Input
            label="Discussion Title *"
            placeholder="e.g. Best practices for Hackathon 2025 presentation deck?"
            value={discTitle}
            onChange={(e) => setDiscTitle(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              Category *
            </label>
            <select
              value={discCategory}
              onChange={(e) => setDiscCategory(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-[#16251c] border border-gray-200 dark:border-[#1e3325] rounded-xl"
            >
              <option value="General">General</option>
              <option value="Questions">Questions & Doubts</option>
              <option value="Projects">Projects & Collaborations</option>
              <option value="Help">Technical Help</option>
              <option value="Announcements">Announcements</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              Topic Details & Context *
            </label>
            <textarea
              value={discContent}
              onChange={(e) => setDiscContent(e.target.value)}
              rows={4}
              placeholder="Elaborate on your topic or question so members can share insights..."
              className="w-full p-3 text-xs bg-white dark:bg-[#16251c] border border-gray-200 dark:border-[#1e3325] rounded-xl focus:ring-1 focus:ring-[#0b4627]"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setDiscussionModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Open Thread
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Upload Resource */}
      <Modal
        isOpen={resourceModalOpen}
        onClose={() => setResourceModalOpen(false)}
        title="Upload Study Material / Resource"
        maxWidth="md"
      >
        <form onSubmit={handleUploadResource} className="space-y-4">
          <Input
            label="Resource Title *"
            placeholder="e.g. Data Structures & Algorithms Roadmap.pdf"
            value={resTitle}
            onChange={(e) => setResTitle(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              value={resDesc}
              onChange={(e) => setResDesc(e.target.value)}
              rows={2}
              placeholder="Brief description of what this document covers..."
              className="w-full p-2.5 text-xs bg-white dark:bg-[#16251c] border border-gray-200 dark:border-[#1e3325] rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              Select Document / File *
            </label>
            <input
              type="file"
              onChange={(e) => e.target.files && setResFile(e.target.files[0])}
              className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-[#0b4627]"
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="resMemberOnly"
              checked={resIsMemberOnly}
              onChange={(e) => setResIsMemberOnly(e.target.checked)}
              className="w-4 h-4 accent-[#0b4627]"
            />
            <label htmlFor="resMemberOnly" className="text-xs text-gray-700 dark:text-gray-300">
              Restrict to society members only
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setResourceModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={resUploading}>
              Upload File
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Create Event */}
      <Modal
        isOpen={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        title="Schedule a Community Event"
        maxWidth="md"
      >
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <Input
            label="Event Title *"
            placeholder="e.g. CodeSprint 2025: Speed Duel"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date *"
              placeholder="e.g. Oct 14, 2025"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
            />
            <Input
              label="Time *"
              placeholder="e.g. 04:30 PM - 06:30 PM"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              required
            />
          </div>

          <Input
            label="Location / Venue"
            placeholder="e.g. Lab 3, CS Block / Online Google Meet"
            value={eventLocation}
            onChange={(e) => setEventLocation(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              value={eventDesc}
              onChange={(e) => setEventDesc(e.target.value)}
              rows={2}
              placeholder="Event agenda and guidelines..."
              className="w-full p-2.5 text-xs bg-white dark:bg-[#16251c] border border-gray-200 dark:border-[#1e3325] rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setEventModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={eventCreating}>
              Schedule Event
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Report Content */}
      <Modal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="Report Content to Community Moderators"
        maxWidth="md"
      >
        <form onSubmit={handleSubmitReport} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              Reason for Report *
            </label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-[#16251c] border border-gray-200 dark:border-[#1e3325] rounded-xl"
            >
              <option value="Spam">Spam or unwanted advertising</option>
              <option value="Harassment">Harassment or hate speech</option>
              <option value="Inappropriate Content">Inappropriate content or media</option>
              <option value="Fake Information">Fake information or impersonation</option>
              <option value="Copyright">Copyright violation</option>
              <option value="Other">Other policy violation</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              Additional Details (Optional)
            </label>
            <textarea
              value={reportDesc}
              onChange={(e) => setReportDesc(e.target.value)}
              rows={3}
              placeholder="Explain why this content violates community rules..."
              className="w-full p-2.5 text-xs bg-white dark:bg-[#16251c] border border-gray-200 dark:border-[#1e3325] rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setReportModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="crimson" size="sm">
              Submit Report
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Transfer Ownership */}
      <Modal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        title="Transfer Community Ownership"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-600 dark:text-gray-300">
            Select an approved member to become the new primary Owner of <b>{community.name}</b>. You will remain an Admin.
          </p>

          <select
            value={transferUserId}
            onChange={(e) => setTransferUserId(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white dark:bg-[#16251c] border border-gray-200 dark:border-[#1e3325] rounded-xl"
          >
            <option value="">Select a member...</option>
            {community.members.filter(uid => uid !== user?.id).map(uid => {
              const mem = allUsers.find(u => u.id === uid);
              return (
                <option key={uid} value={uid}>
                  {mem?.displayName || uid} ({mem?.department || 'Member'})
                </option>
              );
            })}
          </select>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setTransferModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={!transferUserId}
              onClick={handleTransferOwnership}
            >
              Confirm Transfer
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Delete Community */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Community Deletion"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 text-xs text-red-700 dark:text-red-300">
            Warning: This action is permanent and cannot be undone. All posts, discussions, files, and chat messages in <b>{community.name}</b> will be deleted.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="crimson" size="sm" onClick={handleDeleteCommunity}>
              Permanently Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

function BarChartIcon(props: any) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}
