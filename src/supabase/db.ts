import { supabase, isSupabaseConfigured } from './client';
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
import { DEFAULT_ENGINEER_AVATAR } from '../constants/assets';

// Local storage key for sandbox/demo persistence
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
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('createdAt', { ascending: false });

      if (!error && data && data.length > 0) {
        setLocalData('posts', data);
        return data as Post[];
      }
    } catch (err) {
      console.warn('Supabase fetchPosts error, using local fallback:', err);
    }
  }
  return getLocalData<Post[]>('posts', SEED_POSTS);
}

export async function fetchPostById(postId: string): Promise<Post | null> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (!error && data) {
        return data as Post;
      }
    } catch (err) {
      console.warn('Supabase fetchPostById error:', err);
    }
  }
  const posts = getLocalData<Post[]>('posts', SEED_POSTS);
  return posts.find(p => p.id === postId) || null;
}

export function getPostShareUrl(postId: string): string {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  const cleanPath = window.location.pathname.replace(/\/[^/]*\.html$/, '').replace(/\/$/, '');
  return `${origin}${cleanPath}/#/post/${postId}`;
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

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('posts').insert([newPost]).select().single();
      if (!error && data) {
        newPost.id = data.id;
        console.log('✅ Post successfully stored in Supabase DB:', data.id);
      } else if (error) {
        console.error('❌ Supabase createPost error:', error.message, error);
      }

      // Broadcast new post over campus-feed-live
      const feedChannel = supabase.channel('campus-feed-live');
      feedChannel.send({
        type: 'broadcast',
        event: 'new_post',
        payload: newPost
      }).catch(() => {});
    } catch (err: any) {
      console.error('❌ Supabase createPost exception:', err?.message || err);
    }
  }

  const posts = getLocalData<Post[]>('posts', SEED_POSTS);
  const updated = [newPost, ...posts];
  setLocalData('posts', updated);
  return newPost;
}

export async function deletePost(postId: string): Promise<boolean> {
  const posts = getLocalData<Post[]>('posts', SEED_POSTS);
  const updated = posts.filter(p => p.id !== postId);
  setLocalData('posts', updated);

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('posts').delete().eq('id', postId);

      const feedChannel = supabase.channel('campus-feed-live');
      feedChannel.send({
        type: 'broadcast',
        event: 'delete_post',
        payload: { id: postId }
      }).catch(() => {});
    } catch (err) {
      console.warn('Supabase deletePost error:', err);
    }
  }
  return true;
}

export async function toggleLikePost(postId: string, userId: string): Promise<{ liked: boolean; count: number; post?: Post }> {
  // 1. Fetch fresh server data if Supabase is connected to avoid overwriting with stale local cache
  let serverLikes: string[] = [];
  let serverCount: number = 0;
  let authoritativePost: Post | null = null;

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .maybeSingle();

      if (!error && data) {
        authoritativePost = data as Post;
        serverLikes = Array.isArray(data.likes) ? [...data.likes] : [];
        serverCount = typeof data.likesCount === 'number' ? data.likesCount : serverLikes.length;
      }
    } catch (err) {
      console.warn('Supabase toggleLikePost fetch error:', err);
    }
  }

  // 2. Fallback to local cache if offline or not in Supabase yet
  const localPosts = getLocalData<Post[]>('posts', SEED_POSTS);
  const localPostIndex = localPosts.findIndex(p => p.id === postId);
  const localPost = localPostIndex !== -1 ? localPosts[localPostIndex] : null;

  if (!authoritativePost && localPost) {
    authoritativePost = localPost;
    serverLikes = Array.isArray(localPost.likes) ? [...localPost.likes] : [];
    serverCount = typeof localPost.likesCount === 'number' ? localPost.likesCount : serverLikes.length;
  }

  if (!authoritativePost) {
    return { liked: false, count: 0 };
  }

  // 3. Atomically calculate the toggle
  const alreadyLiked = serverLikes.includes(userId);
  let updatedLikes: string[];
  let updatedCount: number;

  if (alreadyLiked) {
    updatedLikes = serverLikes.filter(id => id !== userId);
    updatedCount = Math.max(0, serverCount - 1);
  } else {
    updatedLikes = Array.from(new Set([...serverLikes, userId]));
    updatedCount = serverCount + 1;
  }

  authoritativePost.likes = updatedLikes;
  authoritativePost.likesCount = updatedCount;

  // 4. Update local cache immediately
  if (localPostIndex !== -1) {
    localPosts[localPostIndex] = { ...authoritativePost };
    setLocalData('posts', localPosts);
  } else {
    setLocalData('posts', [authoritativePost, ...localPosts]);
  }

  // 5. Dispatch instant local window event for all components in current window
  window.dispatchEvent(new CustomEvent('eatm_post_like', {
    detail: { postId, likes: updatedLikes, likesCount: updatedCount }
  }));

  // 6. Persist to Supabase and broadcast live to peers
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('posts').update({
        likes: updatedLikes,
        likesCount: updatedCount
      }).eq('id', postId);

      const feedChannel = supabase.channel('campus-feed-live');
      if (feedChannel.state === 'joined') {
        feedChannel.send({
          type: 'broadcast',
          event: 'post_like_update',
          payload: { id: postId, likes: updatedLikes, likesCount: updatedCount }
        }).catch(() => {});
      } else {
        feedChannel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            feedChannel.send({
              type: 'broadcast',
              event: 'post_like_update',
              payload: { id: postId, likes: updatedLikes, likesCount: updatedCount }
            }).catch(() => {});
          }
        });
      }
    } catch (err) {
      console.warn('Supabase toggleLikePost persist error:', err);
    }
  }

  return { liked: !alreadyLiked, count: updatedCount, post: authoritativePost };
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

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('comments').insert([newComment]);
      if (post) {
        await supabase.from('posts').update({ commentsCount: post.commentsCount }).eq('id', postId);
      }

      // Broadcast comment live
      const commentChannel = supabase.channel(`comments-${postId}`);
      commentChannel.send({
        type: 'broadcast',
        event: 'new_comment',
        payload: newComment
      }).catch(() => {});
    } catch (err) {
      console.warn('Supabase addPostComment error:', err);
    }
  }

  return newComment;
}

export async function fetchPostComments(postId: string): Promise<Comment[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('postId', postId)
        .order('createdAt', { ascending: true });
      if (!error && data) return data as Comment[];
    } catch (err) {
      console.warn('Supabase fetchPostComments error:', err);
    }
  }
  const allComments = getLocalData<Comment[]>('comments', []);
  return allComments.filter(c => c.postId === postId);
}

export async function votePoll(postId: string, optionId: string, userId: string): Promise<Post | null> {
  const posts = getLocalData<Post[]>('posts', SEED_POSTS);
  const post = posts.find(p => p.id === postId);
  if (!post || !post.poll) return null;

  post.poll.options = post.poll.options.map(opt => {
    const votes = opt.votes || [];
    if (opt.id === optionId) {
      if (votes.includes(userId)) {
        return { ...opt, votes: votes.filter(id => id !== userId) };
      } else {
        return { ...opt, votes: [...votes, userId] };
      }
    } else {
      return { ...opt, votes: votes.filter(id => id !== userId) };
    }
  });

  setLocalData('posts', [...posts]);

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('posts').update({ poll: post.poll }).eq('id', postId);
    } catch (err) {
      console.warn('Supabase votePoll error:', err);
    }
  }

  return post;
}

export async function incrementPostShare(postId: string): Promise<number> {
  const posts = getLocalData<Post[]>('posts', SEED_POSTS);
  const post = posts.find(p => p.id === postId);
  if (!post) return 0;

  post.sharesCount = (post.sharesCount || 0) + 1;
  setLocalData('posts', [...posts]);

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('posts').update({ sharesCount: post.sharesCount }).eq('id', postId);
    } catch (err) {
      console.warn('Supabase incrementPostShare error:', err);
    }
  }

  return post.sharesCount;
}

// ---------------------------------------------
// USERS & PROFILES
// ---------------------------------------------
export async function fetchUsers(): Promise<UserProfile[]> {
  let list: UserProfile[] = [];
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (!error && data && data.length > 0) {
        list = data as UserProfile[];
      }
    } catch (err) {
      console.warn('Supabase fetchUsers error:', err);
    }
  }
  if (list.length === 0) {
    list = getLocalData<UserProfile[]>('users', SEED_USERS);
  }

  return list.map(u => {
    if (u.role === 'student' && (!u.photoURL || u.photoURL.includes('photo-1534528741775-53994a69daeb'))) {
      return { ...u, photoURL: DEFAULT_ENGINEER_AVATAR };
    }
    return u;
  });
}

export async function fetchUserById(userId: string): Promise<UserProfile | null> {
  const users = await fetchUsers();
  const found = users.find(u => u.id === userId || u.uid === userId) || null;
  if (found && found.role === 'student' && (!found.photoURL || found.photoURL.includes('photo-1534528741775-53994a69daeb'))) {
    return { ...found, photoURL: DEFAULT_ENGINEER_AVATAR };
  }
  return found;
}

export async function updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
  const users = getLocalData<UserProfile[]>('users', SEED_USERS);
  const index = users.findIndex(u => u.id === userId || u.uid === userId);
  let updatedUser: UserProfile;

  if (index !== -1) {
    const existing = users[index];
    updatedUser = {
      ...existing,
      ...data,
      socialLinks: {
        ...(existing.socialLinks || {}),
        ...(data.socialLinks || {})
      },
      updatedAt: new Date().toISOString()
    };
    users[index] = updatedUser;
  } else {
    updatedUser = { ...(data as UserProfile), id: userId, uid: userId, updatedAt: new Date().toISOString() };
    users.push(updatedUser);
  }

  setLocalData('users', [...users]);

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('users').upsert([{ ...updatedUser, id: userId }]);
    } catch (err) {
      console.warn('Supabase updateUserProfile error:', err);
    }
  }

  return updatedUser;
}

// ---------------------------------------------
// CONNECTIONS
// ---------------------------------------------
export async function fetchConnections(userId: string): Promise<Connection[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('connections')
        .select('*')
        .or(`requesterId.eq.${userId},recipientId.eq.${userId}`);

      if (!error && data) {
        // Update local cache
        const currentLocal = getLocalData<Connection[]>('connections', []);
        const nonUserConns = currentLocal.filter(c => c.requesterId !== userId && c.recipientId !== userId);
        setLocalData('connections', [...nonUserConns, ...(data as Connection[])]);
        return data as Connection[];
      }
    } catch (err) {
      console.warn('Supabase fetchConnections error, fallback to local:', err);
    }
  }

  const connections = getLocalData<Connection[]>('connections', []);
  return connections.filter(c => c.requesterId === userId || c.recipientId === userId);
}

export async function sendConnectionRequest(requesterId: string, recipientId: string): Promise<Connection> {
  const now = new Date().toISOString();
  const newConn: Connection = {
    id: 'conn_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    requesterId,
    recipientId,
    status: 'pending',
    createdAt: now,
    updatedAt: now
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      // Check if a connection already exists in either direction
      const { data: existing, error: findError } = await supabase
        .from('connections')
        .select('*')
        .or(`and(requesterId.eq.${requesterId},recipientId.eq.${recipientId}),and(requesterId.eq.${recipientId},recipientId.eq.${requesterId})`)
        .limit(1);

      if (!findError && existing && existing.length > 0) {
        return existing[0] as Connection;
      }

      const { data, error } = await supabase
        .from('connections')
        .insert([newConn])
        .select()
        .single();

      if (!error && data) {
        newConn.id = data.id;
      }
    } catch (err) {
      console.warn('Supabase sendConnectionRequest error:', err);
    }
  }

  // Update local cache
  const localConns = getLocalData<Connection[]>('connections', []);
  setLocalData('connections', [...localConns.filter(c => c.id !== newConn.id), newConn]);

  // Notify recipient with requester's real profile name & avatar
  try {
    const requester = await fetchUserById(requesterId);
    await createNotification({
      recipientId,
      senderId: requesterId,
      senderName: requester?.displayName || 'Campus Student',
      senderAvatar: requester?.photoURL,
      type: 'connection_request',
      title: 'New Connection Request',
      message: `${requester?.displayName || 'A student'} sent you a connection request!`,
      link: '/student/connections'
    });
  } catch (notifErr) {
    console.warn('Error sending connection request notification:', notifErr);
  }

  return newConn;
}

export async function updateConnectionStatus(connectionId: string, status: 'accepted' | 'rejected'): Promise<void> {
  const now = new Date().toISOString();
  let conn: Connection | null = null;

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: existing } = await supabase
        .from('connections')
        .select('*')
        .eq('id', connectionId)
        .single();

      if (existing) {
        conn = existing as Connection;
      }

      await supabase
        .from('connections')
        .update({ status, updatedAt: now })
        .eq('id', connectionId);
    } catch (err) {
      console.warn('Supabase updateConnectionStatus error:', err);
    }
  }

  // Update local cache
  const connections = getLocalData<Connection[]>('connections', []);
  const localConn = connections.find(c => c.id === connectionId);
  if (localConn) {
    localConn.status = status;
    localConn.updatedAt = now;
    setLocalData('connections', [...connections]);
    if (!conn) conn = localConn;
  }

  // If accepted, become official friends:
  // 1. Sync connection counters for both users in users table
  // 2. Automatically create / link a 1-on-1 Conversation
  // 3. Send congratulatory notification to the requester
  if (conn && status === 'accepted') {
    try {
      const [u1, u2] = await Promise.all([
        fetchUserById(conn.requesterId),
        fetchUserById(conn.recipientId)
      ]);

      if (u1) {
        const curCount = u1.stats?.connections || 0;
        await updateUserProfile(u1.id, {
          stats: { ...(u1.stats || { posts: 0, clubs: 0, achievements: 0 }), connections: curCount + 1 }
        });
      }

      if (u2) {
        const curCount = u2.stats?.connections || 0;
        await updateUserProfile(u2.id, {
          stats: { ...(u2.stats || { posts: 0, clubs: 0, achievements: 0 }), connections: curCount + 1 }
        });
      }

      // Automatically create or link the 1-on-1 Conversation
      await getOrCreateConversation(conn.requesterId, conn.recipientId);

      // Send accepted notification to requester
      const recipientUser = u2 || await fetchUserById(conn.recipientId);
      await createNotification({
        recipientId: conn.requesterId,
        senderId: conn.recipientId,
        senderName: recipientUser?.displayName,
        senderAvatar: recipientUser?.photoURL,
        type: 'connection_accepted',
        title: 'Connection Accepted! 🎉',
        message: `${recipientUser?.displayName || 'Your peer'} accepted your connection request. You are now campus friends!`,
        link: '/student/messages'
      });
    } catch (postAcceptErr) {
      console.warn('Error during post-accept friend linking:', postAcceptErr);
    }
  }
}

// ---------------------------------------------
// CHAT & CONVERSATIONS
// ---------------------------------------------
export async function getOrCreateConversation(user1Id: string, user2Id: string): Promise<Conversation> {
  // Check Supabase first
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .contains('participants', [user1Id, user2Id]);

      if (!error && data && data.length > 0) {
        const directConv = data.find(c => !c.isGroup && c.participants.length === 2) || data[0];
        if (directConv) {
          const [u1, u2] = await Promise.all([fetchUserById(user1Id), fetchUserById(user2Id)]);
          return {
            ...directConv,
            participantDetails: {
              ...(directConv.participantDetails || {}),
              [user1Id]: {
                name: u1?.displayName || 'Student',
                avatar: u1?.photoURL,
                role: u1?.role || 'student',
                online: true
              },
              [user2Id]: {
                name: u2?.displayName || 'Student',
                avatar: u2?.photoURL,
                role: u2?.role || 'student',
                online: true
              }
            }
          };
        }
      }
    } catch (err) {
      console.warn('Supabase getOrCreateConversation search error:', err);
    }
  }

  // Check local cache
  const localConvs = getLocalData<Conversation[]>('conversations', SEED_CONVERSATIONS);
  const existingLocal = localConvs.find(c => !c.isGroup && c.participants.includes(user1Id) && c.participants.includes(user2Id));
  if (existingLocal) {
    return existingLocal;
  }

  // Create new conversation
  const [u1, u2] = await Promise.all([fetchUserById(user1Id), fetchUserById(user2Id)]);
  const convId = `conv_${user1Id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)}_${user2Id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)}_${Date.now()}`;
  const now = new Date().toISOString();

  const newConv: Conversation = {
    id: convId,
    isGroup: false,
    participants: [user1Id, user2Id],
    participantDetails: {
      [user1Id]: {
        name: u1?.displayName || 'Student',
        avatar: u1?.photoURL,
        role: u1?.role || 'student',
        online: true
      },
      [user2Id]: {
        name: u2?.displayName || 'Student',
        avatar: u2?.photoURL,
        role: u2?.role || 'student',
        online: true
      }
    },
    lastMessage: {
      text: 'Connected on CampusConnect! Say hello 👋',
      senderId: 'system',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: true
    },
    unreadCount: {
      [user1Id]: 0,
      [user2Id]: 0
    },
    updatedAt: now
  };

  // Cache locally
  setLocalData('conversations', [newConv, ...localConvs]);

  // Persist to Supabase
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('conversations').upsert([{
        id: newConv.id,
        participants: newConv.participants,
        lastMessage: newConv.lastMessage,
        updatedAt: newConv.updatedAt
      }]);

      const welcomeMsg: Message = {
        id: 'msg_' + Date.now(),
        conversationId: newConv.id,
        senderId: 'system',
        senderName: 'CampusConnect',
        text: '🎉 You are now connected! You can exchange messages, study notes, and campus projects.',
        createdAt: now,
        read: true
      };

      await supabase.from('messages').insert([{
        id: welcomeMsg.id,
        conversationId: welcomeMsg.conversationId,
        senderId: welcomeMsg.senderId,
        text: welcomeMsg.text,
        createdAt: welcomeMsg.createdAt,
        read: true
      }]);
    } catch (err) {
      console.warn('Supabase create conversation error:', err);
    }
  }

  return newConv;
}

export async function fetchConversations(userId: string): Promise<Conversation[]> {
  let list: Conversation[] = [];
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .contains('participants', [userId])
        .order('updatedAt', { ascending: false });

      if (!error && data && data.length > 0) {
        list = data as Conversation[];
      }
    } catch (err) {
      console.warn('Supabase fetchConversations error:', err);
    }
  }

  if (list.length === 0) {
    const localConvs = getLocalData<Conversation[]>('conversations', SEED_CONVERSATIONS);
    list = localConvs.filter(c => c.participants.includes(userId));
  }

  // Enrich participantDetails from live user directory
  const allUsers = await fetchUsers();
  const userMap = new Map(allUsers.map(u => [u.id, u]));

  return list.map(conv => {
    const details = { ...(conv.participantDetails || {}) };
    conv.participants.forEach(pId => {
      const u = userMap.get(pId);
      if (u) {
        details[pId] = {
          ...(details[pId] || {}),
          name: details[pId]?.name || u.displayName,
          avatar: details[pId]?.avatar || u.photoURL,
          role: details[pId]?.role || u.role,
          online: true
        };
      }
    });
    return {
      ...conv,
      participantDetails: details
    };
  });
}

export function detectChatMessageMediaType(mediaUrl?: string, explicitType?: string): 'image' | 'video' | 'file' | 'audio' | undefined {
  if (explicitType) return explicitType as any;
  if (!mediaUrl) return undefined;
  if (mediaUrl.startsWith('data:image/') || /\.(jpe?g|png|gif|webp|svg)(\?.*)?$/i.test(mediaUrl)) return 'image';
  if (mediaUrl.startsWith('data:video/') || /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(mediaUrl)) return 'video';
  if (mediaUrl.startsWith('data:audio/') || /\.(mp3|wav|ogg|m4a|aac|webm)(\?.*)?$/i.test(mediaUrl)) return 'audio';
  return 'file';
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversationId', conversationId)
        .order('createdAt', { ascending: true });

      if (!error && data && data.length > 0) {
        // Enrich senderName and senderAvatar from users directory
        const allUsers = await fetchUsers();
        const userMap = new Map(allUsers.map(u => [u.id, u]));

        const enriched = (data as Message[]).map(m => {
          const u = userMap.get(m.senderId);
          return {
            ...m,
            mediaType: detectChatMessageMediaType(m.mediaUrl, m.mediaType),
            senderName: m.senderName || u?.displayName || (m.senderId === 'system' ? 'CampusConnect' : 'Student'),
            senderAvatar: m.senderAvatar || u?.photoURL
          };
        });

        // Sync local cache
        const localMsgs = getLocalData<Message[]>('messages', SEED_MESSAGES);
        const serverIds = new Set(enriched.map(m => m.id));
        const remainingLocal = localMsgs.filter(m => m.conversationId !== conversationId || !serverIds.has(m.id));
        setLocalData('messages', [...remainingLocal, ...enriched]);

        return enriched;
      }
    } catch (err) {
      console.warn('Supabase fetchMessages error:', err);
    }
  }

  const msgs = getLocalData<Message[]>('messages', SEED_MESSAGES);
  return msgs
    .filter(m => m.conversationId === conversationId)
    .map(m => ({
      ...m,
      mediaType: detectChatMessageMediaType(m.mediaUrl, m.mediaType)
    }));
}

export async function sendChatMessage(msg: Omit<Message, 'id' | 'createdAt' | 'read'>): Promise<Message> {
  const mediaType = detectChatMessageMediaType(msg.mediaUrl, msg.mediaType);
  const newMsg: Message = {
    ...msg,
    mediaType,
    id: 'msg_' + Date.now(),
    createdAt: new Date().toISOString(),
    read: true
  };

  const msgs = getLocalData<Message[]>('messages', SEED_MESSAGES);
  setLocalData('messages', [...msgs, newMsg]);

  let previewText = msg.text;
  if (!previewText) {
    if (mediaType === 'image') previewText = '📷 Photo';
    else if (mediaType === 'video') previewText = '🎥 Video';
    else if (mediaType === 'audio') previewText = '🎤 Voice Note';
    else if (mediaType === 'file') previewText = `📄 ${msg.fileName || 'Document'}`;
    else if (msg.mediaUrl) previewText = '📎 Attachment';
    else previewText = 'Message';
  }

  const convs = getLocalData<Conversation[]>('conversations', SEED_CONVERSATIONS);
  const conv = convs.find(c => c.id === msg.conversationId);
  const lastMessagePayload = {
    text: previewText,
    senderId: msg.senderId,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    read: true
  };

  if (conv) {
    conv.lastMessage = lastMessagePayload;
    conv.updatedAt = new Date().toISOString();
    setLocalData('conversations', [...convs]);
  }

  // Dispatch local window event so other tabs/components on this client get instant update
  window.dispatchEvent(new CustomEvent('eatm_chat_message', { detail: newMsg }));

  if (isSupabaseConfigured() && supabase) {
    try {
      // Attempt insert with mediaType / fileName / fileSize if table columns exist
      let insertError = null;
      try {
        const fullInsert = await supabase.from('messages').insert([{
          id: newMsg.id,
          conversationId: newMsg.conversationId,
          senderId: newMsg.senderId,
          text: newMsg.text || null,
          mediaUrl: newMsg.mediaUrl || null,
          mediaType: newMsg.mediaType || null,
          fileName: newMsg.fileName || null,
          fileSize: newMsg.fileSize || null,
          read: newMsg.read,
          createdAt: newMsg.createdAt
        }]);
        insertError = fullInsert.error;
      } catch (e) {
        insertError = e;
      }

      // If columns don't exist yet in PostgreSQL, gracefully fall back to base columns
      if (insertError) {
        const { error: fallbackError } = await supabase.from('messages').insert([{
          id: newMsg.id,
          conversationId: newMsg.conversationId,
          senderId: newMsg.senderId,
          text: newMsg.text || null,
          mediaUrl: newMsg.mediaUrl || null,
          read: newMsg.read,
          createdAt: newMsg.createdAt
        }]);
        if (fallbackError) {
          console.error('❌ Supabase message fallback insert error:', fallbackError.message);
        }
      }

      await supabase.from('conversations').update({
        lastMessage: lastMessagePayload,
        updatedAt: new Date().toISOString()
      }).eq('id', msg.conversationId);

      // Instant Realtime broadcast directly to peer in the same chat room (<50ms latency)
      const chatChannel = supabase.channel(`chat-room-${msg.conversationId}`);
      if (chatChannel.state === 'joined') {
        chatChannel.send({
          type: 'broadcast',
          event: 'new_message',
          payload: newMsg
        }).catch(() => {});
      } else {
        chatChannel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            chatChannel.send({
              type: 'broadcast',
              event: 'new_message',
              payload: newMsg
            }).catch(() => {});
          }
        });
      }
    } catch (err) {
      console.warn('Supabase sendChatMessage error:', err);
    }
  }

  return newMsg;
}

// ---------------------------------------------
// REALTIME SUBSCRIPTIONS (100% Free Tier)
// ---------------------------------------------

/**
 * Subscribes to live changes on the posts table (INSERT, UPDATE, DELETE) & Broadcasts.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeToPosts(callbacks: {
  onInsert?: (newPost: Post) => void;
  onUpdate?: (updatedPost: Post) => void;
  onDelete?: (deletedPostId: string) => void;
}): () => void {
  if (!isSupabaseConfigured() || !supabase) {
    return () => {};
  }

  const channel = supabase
    .channel('campus-feed-live')
    .on(
      'broadcast',
      { event: 'post_like_update' },
      (event) => {
        if (event.payload && event.payload.id) {
          callbacks.onUpdate?.(event.payload as Post);
        }
      }
    )
    .on(
      'broadcast',
      { event: 'new_post' },
      (event) => {
        if (event.payload) {
          callbacks.onInsert?.(event.payload as Post);
        }
      }
    )
    .on(
      'broadcast',
      { event: 'delete_post' },
      (event) => {
        if (event.payload && event.payload.id) {
          callbacks.onDelete?.(event.payload.id);
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'posts' },
      (payload) => {
        if (payload.new) callbacks.onInsert?.(payload.new as Post);
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'posts' },
      (payload) => {
        if (payload.new) callbacks.onUpdate?.(payload.new as Post);
      }
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'posts' },
      (payload) => {
        if (payload.old && (payload.old as any).id) {
          callbacks.onDelete?.((payload.old as any).id);
        }
      }
    )
    .subscribe();

  return () => {
    if (supabase) supabase.removeChannel(channel);
  };
}

/**
 * Subscribes to live comments for a specific post.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeToComments(
  postId: string,
  onInsert: (newComment: Comment) => void
): () => void {
  if (!isSupabaseConfigured() || !supabase) {
    return () => {};
  }

  const client = supabase;
  const channelName = `comments-${postId}`;
  const channel = client
    .channel(channelName)
    .on(
      'broadcast',
      { event: 'new_comment' },
      (event) => {
        if (event.payload && event.payload.postId === postId) {
          onInsert(event.payload as Comment);
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'comments' },
      (payload) => {
        if (payload.new && (payload.new as Comment).postId === postId) {
          onInsert(payload.new as Comment);
        }
      }
    )
    .subscribe();

  return () => {
    if (client) client.removeChannel(channel);
  };
}

/**
 * Subscribes to live chat messages for a conversation.
 * Combines Realtime Broadcast (<50ms), Postgres Changes, and Window Events.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeToMessages(
  conversationId: string,
  onInsert: (newMsg: Message) => void
): () => void {
  // 1. Listen to local window event (syncs instant updates across tabs/components)
  const windowListener = (e: CustomEvent<Message>) => {
    if (e.detail && e.detail.conversationId === conversationId) {
      onInsert(e.detail);
    }
  };
  window.addEventListener('eatm_chat_message', windowListener as EventListener);

  if (!isSupabaseConfigured() || !supabase) {
    return () => {
      window.removeEventListener('eatm_chat_message', windowListener as EventListener);
    };
  }

  const client = supabase;
  const channelName = `chat-room-${conversationId}`;
  const channel = client
    .channel(channelName)
    .on(
      'broadcast',
      { event: 'new_message' },
      (event) => {
        if (event.payload && event.payload.conversationId === conversationId) {
          onInsert(event.payload as Message);
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => {
        if (payload.new && (payload.new as Message).conversationId === conversationId) {
          onInsert(payload.new as Message);
        }
      }
    )
    .subscribe();

  return () => {
    window.removeEventListener('eatm_chat_message', windowListener as EventListener);
    if (client) client.removeChannel(channel);
  };
}

/**
 * Subscribes to live connection changes for a user.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeToConnections(
  userId: string,
  onChange: () => void
): () => void {
  // Listen to local connection event
  const windowListener = () => onChange();
  window.addEventListener('eatm_connections_changed', windowListener);

  if (!isSupabaseConfigured() || !supabase) {
    return () => {
      window.removeEventListener('eatm_connections_changed', windowListener);
    };
  }

  const client = supabase;
  const channelName = `connections-${userId}`;
  const channel = client
    .channel(channelName)
    .on(
      'broadcast',
      { event: 'connection_changed' },
      () => {
        onChange();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'connections' },
      (payload) => {
        const row = (payload.new || payload.old) as any;
        if (row && (row.requesterId === userId || row.recipientId === userId)) {
          onChange();
        }
      }
    )
    .subscribe();

  return () => {
    window.removeEventListener('eatm_connections_changed', windowListener);
    if (client) client.removeChannel(channel);
  };
}

/**
 * Subscribes to live in-app notifications for a user.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeToNotifications(
  userId: string,
  onChange: () => void
): () => void {
  if (!isSupabaseConfigured() || !supabase) {
    return () => {};
  }

  const client = supabase;
  const channelName = `realtime-notifications-${userId}-${Date.now()}`;
  const channel = client
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications' },
      (payload) => {
        const row = payload.new as any;
        if (row && row.recipientId === userId) {
          onChange();
        }
      }
    )
    .subscribe();

  return () => {
    if (client) client.removeChannel(channel);
  };
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
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipientId', userId)
        .order('createdAt', { ascending: false });

      if (!error && data) {
        return data as NotificationItem[];
      }
    } catch (err) {
      console.warn('Supabase fetchNotifications error:', err);
    }
  }

  const list = getLocalData<NotificationItem[]>('notifications', SEED_NOTIFICATIONS);
  return list.filter(n => n.recipientId === userId);
}

export async function createNotification(notif: Omit<NotificationItem, 'id' | 'read' | 'createdAt'>): Promise<NotificationItem> {
  const newNotif: NotificationItem = {
    ...notif,
    id: 'notif_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    read: false,
    createdAt: new Date().toISOString()
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('notifications').insert([newNotif]);
    } catch (err) {
      console.warn('Supabase createNotification error:', err);
    }
  }

  const list = getLocalData<NotificationItem[]>('notifications', SEED_NOTIFICATIONS);
  setLocalData('notifications', [newNotif, ...list]);
  return newNotif;
}

export async function markNotificationAsRead(notifId: string): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('notifications').update({ read: true }).eq('id', notifId);
    } catch (err) {
      console.warn('Supabase markNotificationAsRead error:', err);
    }
  }

  const list = getLocalData<NotificationItem[]>('notifications', SEED_NOTIFICATIONS);
  const target = list.find(n => n.id === notifId);
  if (target) {
    target.read = true;
    setLocalData('notifications', [...list]);
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('notifications').update({ read: true }).eq('recipientId', userId);
    } catch (err) {
      console.warn('Supabase markAllNotificationsAsRead error:', err);
    }
  }

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
