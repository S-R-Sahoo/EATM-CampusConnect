export type UserRole = 'student' | 'faculty' | 'admin';

export interface UserProfile {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  department: string;
  year?: string;
  semester?: string;
  rollNumber?: string;
  employeeId?: string;
  designation?: string;
  phone?: string;
  photoURL?: string;
  coverURL?: string;
  bio?: string;
  skills: string[];
  interests: string[];
  stats: {
    connections: number;
    posts: number;
    clubs: number;
    achievements: number;
  };
  projects?: {
    title: string;
    description: string;
    link?: string;
    technologies: string[];
  }[];
  achievements?: {
    title: string;
    description: string;
    date: string;
  }[];
  socialLinks?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    portfolio?: string;
  };
  settings?: {
    account?: {
      phone?: string;
      alternateEmail?: string;
    };
    privacy?: {
      profileVisibility?: 'everyone' | 'connections' | 'private' | string;
      showSemester?: boolean;
      showInterests?: boolean;
      showProjects?: boolean;
      showAchievements?: boolean;
      searchDiscoverability?: boolean;
      showContactInfo?: boolean;
      activityStatus?: boolean;
    };
    connections?: {
      whoCanConnect?: 'everyone' | 'department' | 'none' | string;
      autoAcceptDepartment?: boolean;
      showMutualConnections?: boolean;
    };
    messages?: {
      whoCanMessage?: 'everyone' | 'connections' | 'nobody' | string;
      readReceipts?: boolean;
      typingIndicators?: boolean;
      hdMedia?: boolean;
    };
    notifications?: {
      connRequests?: boolean;
      connAccepted?: boolean;
      messages?: boolean;
      messageRequests?: boolean;
      postLikes?: boolean;
      comments?: boolean;
      groupActivity?: boolean;
      groupAnnouncements?: boolean;
      eventReminders?: boolean;
      collegeAnnouncements?: boolean;
      pushNotifications?: boolean;
      emailNotifications?: boolean;
      emailDigest?: boolean;
      chatAlerts?: boolean;
      placementAlerts?: boolean;
      soundEffects?: boolean;
      peerAlerts?: boolean;
    };
    appearance?: {
      fontSize?: 'normal' | 'large' | 'compact';
      reducedMotion?: boolean;
    };
    groups?: {
      communityInvites?: boolean;
      publicMemberBadges?: boolean;
      studyGroupDiscovery?: boolean;
    };
    safety?: {
      blockedUserIds?: string[];
      profanityFilter?: boolean;
    };
  };
  status: 'active' | 'disabled';
  verified?: boolean;
  isOnline?: boolean;
  lastSeen?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole: UserRole;
  authorDept?: string;
  authorYear?: string;
  content: string;
  mediaUrl?: string;
  mediaUrls?: string[];
  mediaType?: 'image' | 'video' | 'file';
  feeling?: string;
  visibility: 'campus' | 'connections';
  likes: string[]; // user IDs
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  savedBy?: string[];
  poll?: {
    question: string;
    options: { id: string; text: string; votes: string[] }[];
  };
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
}

export interface Connection {
  id: string;
  requesterId: string;
  recipientId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  isGroup?: boolean;
  groupName?: string;
  groupAvatar?: string;
  participants: string[];
  participantDetails: {
    [userId: string]: {
      name: string;
      avatar?: string;
      role?: string;
      online?: boolean;
      lastSeen?: string;
    };
  };
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: string;
    read: boolean;
  };
  unreadCount: { [userId: string]: number };
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'file' | 'audio';
  fileName?: string;
  fileSize?: string;
  audioDuration?: number;
  createdAt: string;
  read: boolean;
  isDeleted?: boolean;
  deletedFor?: string[];
}

export type CommunityRole = 'owner' | 'admin' | 'moderator' | 'member';
export type CommunityMembershipStatus = 'approved' | 'pending' | 'rejected' | 'banned';
export type CommunityType = 'public' | 'private';

export interface Community {
  id: string;
  name: string;
  category: string;
  description: string;
  type?: CommunityType;
  logoUrl: string;
  coverUrl?: string;
  ownerId?: string;
  isOfficial?: boolean;
  verificationStatus?: 'verified' | 'student' | 'pending';
  memberCount: number;
  members: string[]; // approved user IDs
  admins: string[];
  moderators?: string[];
  pendingRequests?: string[]; // user IDs with pending join requests
  bannedUsers?: string[];
  rules?: string[];
  tags?: string[];
  meetingTime?: string;
  room?: string;
  lead?: string;
  leadRole?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CommunityMember {
  id: string;
  communityId: string;
  userId: string;
  role: CommunityRole;
  status: CommunityMembershipStatus;
  requestedAt?: string;
  joinedAt?: string;
  updatedAt?: string;
  user?: UserProfile;
}

export interface CommunityPollOption {
  id: string;
  text: string;
  votes: string[]; // array of userIds
}

export interface CommunityPoll {
  id: string;
  communityId: string;
  postId?: string;
  question: string;
  options: CommunityPollOption[];
  createdBy: string;
  isClosed?: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface CommunityProject {
  id: string;
  communityId: string;
  name: string;
  description: string;
  technologies: string[];
  teamMembers: { userId?: string; name: string; avatar?: string; role?: string }[];
  githubUrl?: string;
  demoUrl?: string;
  imageUrl?: string;
  createdBy: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  communityId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole?: string;
  authorDept?: string;
  content: string;
  postType: 'text' | 'image' | 'announcement' | 'question' | 'poll' | 'project';
  mediaUrls?: string[];
  mediaUrl?: string;
  isPinned?: boolean;
  likes: string[];
  likesCount: number;
  commentsCount: number;
  poll?: CommunityPoll;
  project?: CommunityProject;
  createdAt: string;
  updatedAt?: string;
}

export interface CommunityComment {
  id: string;
  postId: string;
  communityId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorDept?: string;
  content: string;
  parentCommentId?: string;
  likes?: string[];
  createdAt: string;
}

export interface CommunityDiscussion {
  id: string;
  communityId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole?: string;
  authorDept?: string;
  title: string;
  content: string;
  category: 'General' | 'Questions' | 'Projects' | 'Help' | 'Announcements';
  likes: string[];
  likesCount: number;
  commentsCount: number;
  isPinned?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CommunityDiscussionComment {
  id: string;
  discussionId: string;
  communityId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
}

export interface CommunityMessage {
  id: string;
  communityId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'file' | 'audio';
  fileName?: string;
  fileSize?: string;
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
  };
  reactions?: { [emoji: string]: string[] };
  createdAt: string;
}

export interface CommunityResource {
  id: string;
  communityId: string;
  title: string;
  description: string;
  fileUrl: string;
  fileType: string;
  fileSize: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedByAvatar?: string;
  isMemberOnly?: boolean;
  downloads?: number;
  createdAt: string;
}

export interface CommunityEventItem {
  id: string;
  communityId: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  isOnline?: boolean;
  meetingLink?: string;
  category?: string;
  imageUrl?: string;
  creatorId: string;
  creatorName?: string;
  attendeesCount?: number;
  attendees: { userId: string; status: 'interested' | 'going' | 'not_going' }[];
  createdAt: string;
}

export interface CommunityReport {
  id: string;
  communityId: string;
  reporterId: string;
  reporterName: string;
  targetType: 'post' | 'comment' | 'discussion' | 'message' | 'resource' | 'member';
  targetId: string;
  targetContentPreview?: string;
  reason: 'Spam' | 'Harassment' | 'Inappropriate Content' | 'Fake Information' | 'Copyright' | 'Other';
  description?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  reviewedBy?: string;
  reviewedAt?: string;
  actionTaken?: string;
  createdAt: string;
}

export interface CommunityModerationAction {
  id: string;
  communityId: string;
  moderatorId: string;
  moderatorName: string;
  targetUserId?: string;
  actionType: 'warn' | 'remove_content' | 'remove_member' | 'ban_member' | 'unban_member' | 'role_change';
  reason: string;
  createdAt: string;
}

export interface CampusEvent {
  id: string;
  title: string;
  description: string;
  category: 'Hackathon' | 'Workshop' | 'Seminar' | 'Cultural' | 'Sports' | 'Technical' | 'Placement';
  date: string;
  time: string;
  location: string;
  organizer: string;
  imageUrl: string;
  registeredUsers: string[];
  capacity?: number;
  createdAt: string;
}

export interface StudyMaterial {
  id: string;
  title: string;
  department: string;
  year?: string;
  semester: string;
  subject: string;
  fileType: 'PDF' | 'PPT' | 'Notes' | 'Question Papers' | 'Doc';
  fileSize: string;
  downloadUrl: string;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: string;
}

export interface Opportunity {
  id: string;
  company: string;
  logoUrl: string;
  role: string;
  type: 'internship' | 'placement' | 'hackathon';
  location: string;
  stipend: string;
  duration?: string;
  deadline: string;
  skills: string[];
  applyUrl: string;
  description: string;
  savedBy: string[];
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  description: string;
  category: 'Academic' | 'Examination' | 'Placement' | 'Events' | 'General' | 'Emergency';
  priority: 'normal' | 'important' | 'urgent';
  authorName: string;
  authorRole: string;
  authorAvatar?: string;
  attachmentUrl?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  recipientId: string;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  type: 'like' | 'comment' | 'connection_request' | 'connection_accepted' | 'message' | 'event_registration' | 'announcement' | 'opportunity' | 'club_invite' | 'system';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: 'post' | 'comment' | 'user' | 'community';
  targetId: string;
  targetContent: string;
  reason: 'Spam' | 'Harassment' | 'Inappropriate Content' | 'Fake Account' | 'Other';
  status: 'pending' | 'under_review' | 'resolved' | 'rejected';
  notes?: string;
  createdAt: string;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  department: string;
  semester: string;
  deadline: string;
  description: string;
  attachmentUrl?: string;
  createdBy: string;
  createdByName: string;
  submissionsCount: number;
  submissions?: {
    studentId: string;
    studentName: string;
    submittedAt: string;
    fileUrl: string;
    status: 'submitted' | 'late' | 'graded';
  }[];
  createdAt: string;
}
