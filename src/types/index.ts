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
    passHash?: string;
  };
  status: 'active' | 'disabled';
  verified?: boolean;
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
  fileName?: string;
  createdAt: string;
  read: boolean;
}

export interface Community {
  id: string;
  name: string;
  category: string;
  description: string;
  logoUrl: string;
  coverUrl?: string;
  memberCount: number;
  members: string[]; // user IDs
  admins: string[];
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
