import { 
  collection, doc, getDocs, getDoc, setDoc, addDoc, updateDoc, 
  deleteDoc, query, where, orderBy, onSnapshot, arrayUnion, arrayRemove, Timestamp 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { 
  UserProfile, Post, Comment, Connection, Conversation, Message, 
  Community, CampusEvent, StudyMaterial, Opportunity, Announcement, 
  NotificationItem, Report, Assignment 
} from '../types';
import { 
  SEED_USERS, SEED_POSTS, SEED_COMMUNITIES, SEED_EVENTS, 
  SEED_STUDY_MATERIALS, SEED_OPPORTUNITIES, SEED_ANNOUNCEMENTS, 
  SEED_NOTIFICATIONS, SEED_CONVERSATIONS, SEED_MESSAGES, 
  SEED_REPORTS, SEED_ASSIGNMENTS 
} from './seedData';

// Local storage key for persistent demo state
const STORAGE_PREFIX = 'eatm_campus_';

function getLocalData<T>(key: string, defaultData: T): T {
  try {
    const saved = localStorage.getItem(STORAGE_PREFIX + key);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to read from localStorage:', e);
  }
  return defaultData;
}

function setLocalData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent(`eatm_${key}_changed`, { detail: data }));
  } catch (e) {
    console.error('Failed to write to localStorage:', e);
  }
}

// ---------------------------------------------
// POSTS
// ---------------------------------------------
export async function fetchPosts(): Promise<Post[]> {
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Post));
      }
    } catch (err) {
      console.warn('Firestore fetchPosts error, using local fallback:', err);
    }
  }
  return getLocalData<Post[]>('posts', SEED_POSTS);
}

export async function createPost(postData: Omit<Post, 'id' | 'createdAt' | 'likes' | 'likesCount' | 'commentsCount' | 'sharesCount'>): Promise<Post> {
  const newPost: Post = {
    ...postData,
    id: 'post_' + Date.now(),
    likes: [],
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    createdAt: new Date().toISOString()
  };

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = await addDoc(collection(db, 'posts'), newPost);
      newPost.id = docRef.id;
    } catch (err) {
      console.warn('Firestore createPost error, falling back locally:', err);
    }
  }

  const posts = getLocalData<Post[]>('posts', SEED_POSTS);
  const updated = [newPost, ...posts];
  setLocalData('posts', updated);
  return newPost;
}

export async function toggleLikePost(postId: string, userId: string): Promise<{ liked: boolean; count: number }> {
  const posts = getLocalData<Post[]>('posts', SEED_POSTS);
  const post = posts.find(p => p.id === postId);
  if (!post) return { liked: false, count: 0 };

  const isLiked = post.likes.includes(userId);
  if (isLiked) {
    post.likes = post.likes.filter(id => id !== userId);
    post.likesCount = Math.max(0, post.likesCount - 1);
  } else {
    post.likes.push(userId);
    post.likesCount += 1;
  }

  setLocalData('posts', [...posts]);

  if (isFirebaseConfigured() && db) {
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        likes: isLiked ? arrayRemove(userId) : arrayUnion(userId),
        likesCount: post.likesCount
      });
    } catch (err) {
      console.warn('Firestore toggleLikePost error:', err);
    }
  }

  return { liked: !isLiked, count: post.likesCount };
}

export async function addPostComment(postId: string, commentData: { authorId: string; authorName: string; authorAvatar?: string; content: string }): Promise<Comment> {
  const newComment: Comment = {
    id: 'cmt_' + Date.now(),
    postId,
    ...commentData,
    createdAt: new Date().toISOString()
  };

  const comments = getLocalData<Comment[]>('comments', []);
  setLocalData('comments', [...comments, newComment]);

  // Update post comment count
  const posts = getLocalData<Post[]>('posts', SEED_POSTS);
  const post = posts.find(p => p.id === postId);
  if (post) {
    post.commentsCount = (post.commentsCount || 0) + 1;
    setLocalData('posts', [...posts]);
  }

  if (isFirebaseConfigured() && db) {
    try {
      await addDoc(collection(db, 'comments'), newComment);
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, { commentsCount: (post?.commentsCount || 0) });
    } catch (err) {
      console.warn('Firestore addPostComment error:', err);
    }
  }

  return newComment;
}

export async function fetchPostComments(postId: string): Promise<Comment[]> {
  const allComments = getLocalData<Comment[]>('comments', []);
  return allComments.filter(c => c.postId === postId);
}

// ---------------------------------------------
// USERS & PROFILES
// ---------------------------------------------
export async function fetchUsers(): Promise<UserProfile[]> {
  if (isFirebaseConfigured() && db) {
    try {
      const snap = await getDocs(collection(db, 'users'));
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
      }
    } catch (err) {
      console.warn('Firestore fetchUsers error:', err);
    }
  }
  return getLocalData<UserProfile[]>('users', SEED_USERS);
}

export async function fetchUserById(userId: string): Promise<UserProfile | null> {
  const users = await fetchUsers();
  return users.find(u => u.id === userId || u.uid === userId) || null;
}

export async function updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
  const users = getLocalData<UserProfile[]>('users', SEED_USERS);
  const index = users.findIndex(u => u.id === userId || u.uid === userId);
  let updatedUser: UserProfile;

  if (index !== -1) {
    updatedUser = { ...users[index], ...data, updatedAt: new Date().toISOString() };
    users[index] = updatedUser;
  } else {
    updatedUser = { ...(data as UserProfile), id: userId, uid: userId, updatedAt: new Date().toISOString() };
    users.push(updatedUser);
  }

  setLocalData('users', [...users]);

  if (isFirebaseConfigured() && db) {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, data, { merge: true });
    } catch (err) {
      console.warn('Firestore updateUserProfile error:', err);
    }
  }

  return updatedUser;
}

// ---------------------------------------------
// CONNECTIONS
// ---------------------------------------------
export async function fetchConnections(userId: string): Promise<Connection[]> {
  const connections = getLocalData<Connection[]>('connections', [
    {
      id: 'conn_1',
      requesterId: 'user_priya',
      recipientId: 'user_soumya',
      status: 'accepted',
      createdAt: '2025-01-10T10:00:00Z',
      updatedAt: '2025-01-10T11:00:00Z'
    },
    {
      id: 'conn_2',
      requesterId: 'user_rohit',
      recipientId: 'user_soumya',
      status: 'pending',
      createdAt: '2025-02-20T07:15:00Z',
      updatedAt: '2025-02-20T07:15:00Z'
    }
  ]);
  return connections.filter(c => c.requesterId === userId || c.recipientId === userId);
}

export async function sendConnectionRequest(requesterId: string, recipientId: string): Promise<Connection> {
  const connections = getLocalData<Connection[]>('connections', []);
  const existing = connections.find(c => 
    (c.requesterId === requesterId && c.recipientId === recipientId) ||
    (c.requesterId === recipientId && c.recipientId === requesterId)
  );

  if (existing) return existing;

  const newConn: Connection = {
    id: 'conn_' + Date.now(),
    requesterId,
    recipientId,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  setLocalData('connections', [...connections, newConn]);

  // Create notification for recipient
  await createNotification({
    recipientId,
    senderId: requesterId,
    type: 'connection_request',
    title: 'New Connection Request',
    message: 'Someone sent you a connection request!',
    link: '/student/connections'
  });

  return newConn;
}

export async function updateConnectionStatus(connectionId: string, status: 'accepted' | 'rejected'): Promise<void> {
  const connections = getLocalData<Connection[]>('connections', []);
  const conn = connections.find(c => c.id === connectionId);
  if (conn) {
    conn.status = status;
    conn.updatedAt = new Date().toISOString();
    setLocalData('connections', [...connections]);

    if (status === 'accepted') {
      await createNotification({
        recipientId: conn.requesterId,
        senderId: conn.recipientId,
        type: 'connection_accepted',
        title: 'Connection Accepted',
        message: 'Your connection request was accepted!',
        link: '/student/connections'
      });
    }
  }
}

// ---------------------------------------------
// CHAT & CONVERSATIONS
// ---------------------------------------------
export async function fetchConversations(userId: string): Promise<Conversation[]> {
  const convs = getLocalData<Conversation[]>('conversations', SEED_CONVERSATIONS);
  return convs.filter(c => c.participants.includes(userId));
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const msgs = getLocalData<Message[]>('messages', SEED_MESSAGES);
  return msgs.filter(m => m.conversationId === conversationId);
}

export async function sendChatMessage(msg: Omit<Message, 'id' | 'createdAt' | 'read'>): Promise<Message> {
  const newMsg: Message = {
    ...msg,
    id: 'msg_' + Date.now(),
    createdAt: new Date().toISOString(),
    read: true
  };

  const msgs = getLocalData<Message[]>('messages', SEED_MESSAGES);
  setLocalData('messages', [...msgs, newMsg]);

  // Update conversation lastMessage
  const convs = getLocalData<Conversation[]>('conversations', SEED_CONVERSATIONS);
  const conv = convs.find(c => c.id === msg.conversationId);
  if (conv) {
    conv.lastMessage = {
      text: msg.text || (msg.mediaUrl ? 'Attachment' : 'Message'),
      senderId: msg.senderId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: true
    };
    conv.updatedAt = new Date().toISOString();
    setLocalData('conversations', [...convs]);
  }

  return newMsg;
}

// ---------------------------------------------
// CLUBS & COMMUNITIES
// ---------------------------------------------
export async function fetchCommunities(): Promise<Community[]> {
  return getLocalData<Community[]>('communities', SEED_COMMUNITIES);
}

export async function toggleJoinCommunity(communityId: string, userId: string): Promise<{ joined: boolean; count: number }> {
  const clubs = getLocalData<Community[]>('communities', SEED_COMMUNITIES);
  const club = clubs.find(c => c.id === communityId);
  if (!club) return { joined: false, count: 0 };

  const isMember = club.members.includes(userId);
  if (isMember) {
    club.members = club.members.filter(id => id !== userId);
    club.memberCount = Math.max(0, club.memberCount - 1);
  } else {
    club.members.push(userId);
    club.memberCount += 1;
  }

  setLocalData('communities', [...clubs]);
  return { joined: !isMember, count: club.memberCount };
}

export async function createCommunity(data: Omit<Community, 'id' | 'memberCount' | 'members' | 'createdAt'>, creatorId: string): Promise<Community> {
  const newClub: Community = {
    ...data,
    id: 'club_' + Date.now(),
    memberCount: 1,
    members: [creatorId],
    admins: [creatorId],
    createdAt: new Date().toISOString()
  };

  const clubs = getLocalData<Community[]>('communities', SEED_COMMUNITIES);
  setLocalData('communities', [newClub, ...clubs]);
  return newClub;
}

// ---------------------------------------------
// EVENTS
// ---------------------------------------------
export async function fetchEvents(): Promise<CampusEvent[]> {
  return getLocalData<CampusEvent[]>('events', SEED_EVENTS);
}

export async function toggleEventRegistration(eventId: string, userId: string): Promise<{ registered: boolean; count: number }> {
  const events = getLocalData<CampusEvent[]>('events', SEED_EVENTS);
  const event = events.find(e => e.id === eventId);
  if (!event) return { registered: false, count: 0 };

  const isReg = event.registeredUsers.includes(userId);
  if (isReg) {
    event.registeredUsers = event.registeredUsers.filter(id => id !== userId);
  } else {
    event.registeredUsers.push(userId);
    await createNotification({
      recipientId: userId,
      type: 'event_registration',
      title: 'Registration Confirmed',
      message: `You are officially registered for ${event.title}!`,
      link: '/student/events'
    });
  }

  setLocalData('events', [...events]);
  return { registered: !isReg, count: event.registeredUsers.length };
}

export async function createEvent(data: Omit<CampusEvent, 'id' | 'registeredUsers' | 'createdAt'>): Promise<CampusEvent> {
  const newEvent: CampusEvent = {
    ...data,
    id: 'event_' + Date.now(),
    registeredUsers: [],
    createdAt: new Date().toISOString()
  };
  const events = getLocalData<CampusEvent[]>('events', SEED_EVENTS);
  setLocalData('events', [newEvent, ...events]);
  return newEvent;
}

// ---------------------------------------------
// STUDY MATERIALS
// ---------------------------------------------
export async function fetchStudyMaterials(): Promise<StudyMaterial[]> {
  return getLocalData<StudyMaterial[]>('study_materials', SEED_STUDY_MATERIALS);
}

export async function createStudyMaterial(data: Omit<StudyMaterial, 'id' | 'createdAt'>): Promise<StudyMaterial> {
  const newMat: StudyMaterial = {
    ...data,
    id: 'mat_' + Date.now(),
    createdAt: new Date().toISOString()
  };
  const list = getLocalData<StudyMaterial[]>('study_materials', SEED_STUDY_MATERIALS);
  setLocalData('study_materials', [newMat, ...list]);
  return newMat;
}

// ---------------------------------------------
// OPPORTUNITIES
// ---------------------------------------------
export async function fetchOpportunities(): Promise<Opportunity[]> {
  return getLocalData<Opportunity[]>('opportunities', SEED_OPPORTUNITIES);
}

export async function toggleSaveOpportunity(oppId: string, userId: string): Promise<boolean> {
  const opps = getLocalData<Opportunity[]>('opportunities', SEED_OPPORTUNITIES);
  const opp = opps.find(o => o.id === oppId);
  if (!opp) return false;

  const isSaved = opp.savedBy.includes(userId);
  if (isSaved) {
    opp.savedBy = opp.savedBy.filter(id => id !== userId);
  } else {
    opp.savedBy.push(userId);
  }

  setLocalData('opportunities', [...opps]);
  return !isSaved;
}

export async function createOpportunity(data: Omit<Opportunity, 'id' | 'savedBy' | 'createdAt'>): Promise<Opportunity> {
  const newOpp: Opportunity = {
    ...data,
    id: 'opp_' + Date.now(),
    savedBy: [],
    createdAt: new Date().toISOString()
  };
  const opps = getLocalData<Opportunity[]>('opportunities', SEED_OPPORTUNITIES);
  setLocalData('opportunities', [newOpp, ...opps]);
  return newOpp;
}

// ---------------------------------------------
// ANNOUNCEMENTS
// ---------------------------------------------
export async function fetchAnnouncements(): Promise<Announcement[]> {
  return getLocalData<Announcement[]>('announcements', SEED_ANNOUNCEMENTS);
}

export async function createAnnouncement(data: Omit<Announcement, 'id' | 'createdAt'>): Promise<Announcement> {
  const newAnn: Announcement = {
    ...data,
    id: 'ann_' + Date.now(),
    createdAt: new Date().toISOString()
  };
  const list = getLocalData<Announcement[]>('announcements', SEED_ANNOUNCEMENTS);
  setLocalData('announcements', [newAnn, ...list]);
  return newAnn;
}

// ---------------------------------------------
// NOTIFICATIONS
// ---------------------------------------------
export async function fetchNotifications(userId: string): Promise<NotificationItem[]> {
  const list = getLocalData<NotificationItem[]>('notifications', SEED_NOTIFICATIONS);
  return list.filter(n => n.recipientId === userId);
}

export async function createNotification(notif: Omit<NotificationItem, 'id' | 'read' | 'createdAt'>): Promise<NotificationItem> {
  const newNotif: NotificationItem = {
    ...notif,
    id: 'notif_' + Date.now(),
    read: false,
    createdAt: new Date().toISOString()
  };
  const list = getLocalData<NotificationItem[]>('notifications', SEED_NOTIFICATIONS);
  setLocalData('notifications', [newNotif, ...list]);
  return newNotif;
}

export async function markNotificationAsRead(notifId: string): Promise<void> {
  const list = getLocalData<NotificationItem[]>('notifications', SEED_NOTIFICATIONS);
  const target = list.find(n => n.id === notifId);
  if (target) {
    target.read = true;
    setLocalData('notifications', [...list]);
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const list = getLocalData<NotificationItem[]>('notifications', SEED_NOTIFICATIONS);
  list.forEach(n => {
    if (n.recipientId === userId) n.read = true;
  });
  setLocalData('notifications', [...list]);
}

// ---------------------------------------------
// REPORTS / MODERATION
// ---------------------------------------------
export async function fetchReports(): Promise<Report[]> {
  return getLocalData<Report[]>('reports', SEED_REPORTS);
}

export async function submitReport(data: Omit<Report, 'id' | 'status' | 'createdAt'>): Promise<Report> {
  const newReport: Report = {
    ...data,
    id: 'rep_' + Date.now(),
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  const list = getLocalData<Report[]>('reports', SEED_REPORTS);
  setLocalData('reports', [newReport, ...list]);
  return newReport;
}

export async function updateReportStatus(reportId: string, status: Report['status']): Promise<void> {
  const list = getLocalData<Report[]>('reports', SEED_REPORTS);
  const rep = list.find(r => r.id === reportId);
  if (rep) {
    rep.status = status;
    setLocalData('reports', [...list]);
  }
}

// ---------------------------------------------
// ASSIGNMENTS
// ---------------------------------------------
export async function fetchAssignments(): Promise<Assignment[]> {
  return getLocalData<Assignment[]>('assignments', SEED_ASSIGNMENTS);
}

export async function createAssignment(data: Omit<Assignment, 'id' | 'submissionsCount' | 'createdAt'>): Promise<Assignment> {
  const newAsg: Assignment = {
    ...data,
    id: 'asg_' + Date.now(),
    submissionsCount: 0,
    createdAt: new Date().toISOString()
  };
  const list = getLocalData<Assignment[]>('assignments', SEED_ASSIGNMENTS);
  setLocalData('assignments', [newAsg, ...list]);
  return newAsg;
}
