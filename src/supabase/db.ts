import { supabase, isSupabaseConfigured } from './client';
import { 
  UserProfile, Post, Comment, Connection, Conversation, Message, 
  Community, CampusEvent, StudyMaterial, Opportunity, Announcement, 
  NotificationItem, Report, Assignment,
  CommunityMember, CommunityPost, CommunityComment, 
  CommunityDiscussion, CommunityDiscussionComment, 
  CommunityMessage, CommunityResource, CommunityEventItem, 
  CommunityReport, CommunityModerationAction, CommunityRole, 
  CommunityMembershipStatus, CommunityProject, CommunityPoll, CommunityType
} from '../types';
import { 
  SEED_USERS, SEED_POSTS, SEED_COMMUNITIES, SEED_EVENTS, 
  SEED_STUDY_MATERIALS, SEED_OPPORTUNITIES, SEED_ANNOUNCEMENTS, 
  SEED_NOTIFICATIONS, SEED_CONVERSATIONS, SEED_MESSAGES, 
  SEED_REPORTS, SEED_ASSIGNMENTS,
  SEED_COMMUNITY_POSTS, SEED_COMMUNITY_COMMENTS, 
  SEED_COMMUNITY_DISCUSSIONS, SEED_COMMUNITY_DISCUSSION_COMMENTS, 
  SEED_COMMUNITY_MESSAGES, SEED_COMMUNITY_RESOURCES, 
  SEED_COMMUNITY_EVENTS, SEED_COMMUNITY_REPORTS, SEED_COMMUNITY_ACTIONS 
} from './seedData';
import { isCustomPhoto } from '../constants/assets';

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
export function normalizePostMedia(post: { mediaUrl?: string; mediaUrls?: string[] } | null | undefined): { mediaUrl?: string; mediaUrls: string[] } {
  if (!post) return { mediaUrl: undefined, mediaUrls: [] };
  let urls: string[] = [];

  // 1. If mediaUrls is an array of non-empty strings
  if (Array.isArray(post.mediaUrls) && post.mediaUrls.length > 0) {
    urls = post.mediaUrls.filter(u => typeof u === 'string' && u.trim().length > 0);
  }

  // 2. If no valid array in mediaUrls, inspect mediaUrl
  if (urls.length === 0 && post.mediaUrl && typeof post.mediaUrl === 'string') {
    const raw = post.mediaUrl.trim();
    if (raw.includes('|||')) {
      urls = raw.split('|||').map(u => u.trim()).filter(Boolean);
    } else if (raw.startsWith('[') && raw.endsWith(']')) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          urls = parsed.filter(u => typeof u === 'string' && u.trim().length > 0);
        }
      } catch {
        urls = [raw];
      }
    } else if (raw.length > 0) {
      urls = [raw];
    }
  }

  return {
    mediaUrl: urls[0] || undefined,
    mediaUrls: urls
  };
}

export async function fetchPosts(): Promise<Post[]> {
  let list: Post[] = [];
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('createdAt', { ascending: false });

      if (!error && data && data.length > 0) {
        const normalizedData = data.map(p => {
          const { mediaUrl, mediaUrls } = normalizePostMedia(p);
          return {
            ...p,
            mediaUrl,
            mediaUrls
          };
        });
        setLocalData('posts', normalizedData);
        list = normalizedData as Post[];
      }
    } catch (err) {
      console.warn('Supabase fetchPosts error, using local fallback:', err);
    }
  }
  if (list.length === 0) {
    list = getLocalData<Post[]>('posts', SEED_POSTS);
  }

  // Enrich authorAvatar from live user directory so newly uploaded photos automatically reflect everywhere
  const allUsers = await fetchUsers();
  const userMap = new Map(allUsers.map(u => [u.id, u]));

  return list.map(p => {
    const author = p.authorId ? userMap.get(p.authorId) : null;
    const authorPhoto = author?.photoURL;
    const resolvedAvatar = isCustomPhoto(authorPhoto)
      ? authorPhoto
      : (isCustomPhoto(p.authorAvatar) ? p.authorAvatar : undefined);

    const { mediaUrl, mediaUrls } = normalizePostMedia(p);

    return {
      ...p,
      mediaUrl,
      mediaUrls,
      authorAvatar: resolvedAvatar
    };
  });
}

export async function fetchPostById(postId: string): Promise<Post | null> {
  let post: Post | null = null;
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (!error && data) {
        post = data as Post;
      }
    } catch (err) {
      console.warn('Supabase fetchPostById error:', err);
    }
  }
  if (!post) {
    const posts = getLocalData<Post[]>('posts', SEED_POSTS);
    post = posts.find(p => p.id === postId) || null;
  }

  if (post) {
    const author = post.authorId ? await fetchUserById(post.authorId) : null;
    const authorPhoto = author?.photoURL;
    const resolvedAvatar = isCustomPhoto(authorPhoto)
      ? authorPhoto
      : (isCustomPhoto(post.authorAvatar) ? post.authorAvatar : undefined);

    const { mediaUrl, mediaUrls } = normalizePostMedia(post);

    return {
      ...post,
      mediaUrl,
      mediaUrls,
      authorAvatar: resolvedAvatar
    };
  }

  return post;
}

export function getPostShareUrl(postId: string): string {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  const cleanPath = window.location.pathname.replace(/\/[^/]*\.html$/, '').replace(/\/$/, '');
  return `${origin}${cleanPath}/#/post/${postId}`;
}

export async function createPost(postData: Omit<Post, 'id' | 'createdAt' | 'likes' | 'likesCount' | 'commentsCount' | 'sharesCount'>): Promise<Post> {
  const { mediaUrl: firstMediaUrl, mediaUrls: rawMediaUrls } = normalizePostMedia(postData);

  // Store delimited string in mediaUrl so even if remote Supabase table has not run the "mediaUrls" column migration, ALL images persist!
  const joinedMediaUrl = rawMediaUrls.length > 0 ? rawMediaUrls.join('|||') : undefined;

  const newPost: Post = {
    ...postData,
    id: 'post_' + Date.now(),
    mediaUrl: joinedMediaUrl || firstMediaUrl,
    mediaUrls: rawMediaUrls,
    likes: [],
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    createdAt: new Date().toISOString()
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      let insertRes = await supabase.from('posts').insert([newPost]).select().single();
      // If table doesn't have mediaUrls column yet, fall back without mediaUrls column (mediaUrl already has the joined URLs!)
      if (insertRes.error) {
        console.warn('Initial post insert error, trying fallback without mediaUrls column:', insertRes.error.message);
        const { mediaUrls, ...postWithoutMediaUrls } = newPost;
        insertRes = await supabase.from('posts').insert([postWithoutMediaUrls]).select().single();
      }
      if (!insertRes.error && insertRes.data) {
        newPost.id = insertRes.data.id;
        console.log('✅ Post successfully stored in Supabase DB:', insertRes.data.id);
      } else if (insertRes.error) {
        console.error('❌ Supabase createPost error:', insertRes.error.message, insertRes.error);
      }

      // Broadcast new post over campus-feed-live
      const feedChannel = supabase.channel('campus-feed-live');
      feedChannel.send({
        type: 'broadcast',
        event: 'new_post',
        payload: {
          ...newPost,
          mediaUrl: firstMediaUrl,
          mediaUrls: rawMediaUrls
        }
      }).catch(() => {});
    } catch (err: any) {
      console.error('❌ Supabase createPost exception:', err?.message || err);
    }
  }

  // App-facing post object always exposes firstMediaUrl as mediaUrl and full array in mediaUrls
  const normalizedForApp: Post = {
    ...newPost,
    mediaUrl: firstMediaUrl,
    mediaUrls: rawMediaUrls
  };

  const posts = getLocalData<Post[]>('posts', SEED_POSTS);
  const updated = [normalizedForApp, ...posts.filter(p => p.id !== normalizedForApp.id)];
  setLocalData('posts', updated);
  return normalizedForApp;
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
  let comments: Comment[] = [];
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('postId', postId)
        .order('createdAt', { ascending: true });
      if (!error && data) comments = data as Comment[];
    } catch (err) {
      console.warn('Supabase fetchPostComments error:', err);
    }
  }
  if (comments.length === 0) {
    const allComments = getLocalData<Comment[]>('comments', []);
    comments = allComments.filter(c => c.postId === postId);
  }

  // Enrich comment author avatar with live user photo
  const allUsers = await fetchUsers();
  const userMap = new Map(allUsers.map(u => [u.id, u]));

  return comments.map(c => {
    const author = c.authorId ? userMap.get(c.authorId) : null;
    const authorPhoto = author?.photoURL;
    const resolvedAvatar = isCustomPhoto(authorPhoto)
      ? authorPhoto
      : (isCustomPhoto(c.authorAvatar) ? c.authorAvatar : undefined);
    return {
      ...c,
      authorAvatar: resolvedAvatar
    };
  });
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
let usersCache: UserProfile[] | null = null;
let usersCacheTimestamp = 0;
const USERS_CACHE_TTL = 30000; // 30s cache

export async function fetchUsers(forceRefresh = false): Promise<UserProfile[]> {
  const now = Date.now();
  if (!forceRefresh && usersCache && usersCache.length > 0 && (now - usersCacheTimestamp < USERS_CACHE_TTL)) {
    return usersCache;
  }

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

  const resolved = list.map(u => ({
    ...u,
    photoURL: isCustomPhoto(u.photoURL) ? u.photoURL : undefined
  }));

  usersCache = resolved;
  usersCacheTimestamp = now;
  return resolved;
}

export async function fetchUserById(userId: string): Promise<UserProfile | null> {
  const users = await fetchUsers();
  const found = users.find(u => u.id === userId || u.uid === userId) || null;
  if (found) {
    return {
      ...found,
      photoURL: isCustomPhoto(found.photoURL) ? found.photoURL : undefined
    };
  }
  return null;
}

export async function updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
  // Invalidate cache immediately on profile update
  usersCache = null;
  usersCacheTimestamp = 0;
  const users = getLocalData<UserProfile[]>('users', SEED_USERS);
  const index = users.findIndex(u => u.id === userId || u.uid === userId);
  let updatedUser: UserProfile;

  // Clean socialLinks to ensure no password hashes are stored
  const sanitizedSocialLinks = { ...(data.socialLinks || {}) };
  if ('passHash' in sanitizedSocialLinks) {
    delete (sanitizedSocialLinks as any).passHash;
  }

  if (index !== -1) {
    const existing = users[index];
    // Prevent non-admin self-elevation of role or verification status
    const safeRole = data.role !== undefined && existing.role === 'admin' ? data.role : existing.role;
    const safeVerified = data.verified !== undefined && existing.role === 'admin' ? data.verified : existing.verified;

    updatedUser = {
      ...existing,
      ...data,
      role: safeRole,
      verified: safeVerified,
      socialLinks: {
        ...(existing.socialLinks || {}),
        ...sanitizedSocialLinks
      },
      updatedAt: new Date().toISOString()
    };
    users[index] = updatedUser;
  } else {
    updatedUser = { 
      ...(data as UserProfile), 
      id: userId, 
      uid: userId, 
      verified: false,
      socialLinks: sanitizedSocialLinks,
      updatedAt: new Date().toISOString() 
    };
    users.push(updatedUser);
  }

  setLocalData('users', [...users]);

  if (isSupabaseConfigured() && supabase) {
    try {
      // Upsert profile without privilege escalation
      await supabase.from('users').upsert([{ 
        ...updatedUser, 
        id: userId 
      }]);
    } catch (err) {
      console.warn('Supabase updateUserProfile error:', err);
    }
  }

  return updatedUser;
}

// ---------------------------------------------
// CONNECTIONS
// ---------------------------------------------

/**
 * Fetches user profiles by an array of user IDs.
 * Highly optimized: only queries requested IDs instead of loading all users.
 */
export async function fetchUsersByIds(userIds: string[]): Promise<UserProfile[]> {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  if (uniqueIds.length === 0) return [];

  let list: UserProfile[] = [];
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .in('id', uniqueIds);

      if (!error && data && data.length > 0) {
        list = data as UserProfile[];
      }
    } catch (err) {
      console.warn('Supabase fetchUsersByIds error:', err);
    }
  }

  // Fallback to local cache if Supabase didn't return all
  if (list.length < uniqueIds.length) {
    const localUsers = getLocalData<UserProfile[]>('users', SEED_USERS);
    const existingIds = new Set(list.map(u => u.id));
    for (const uid of uniqueIds) {
      if (!existingIds.has(uid)) {
        const found = localUsers.find(u => u.id === uid || u.uid === uid);
        if (found) list.push(found);
      }
    }
  }

  return list.map(u => ({
    ...u,
    photoURL: isCustomPhoto(u.photoURL) ? u.photoURL : undefined
  }));
}

/**
 * Fetches connections for a specific user from Supabase with local fallback.
 */
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
      } else if (error) {
        console.warn('Supabase fetchConnections error:', error.message);
      }
    } catch (err) {
      console.warn('Supabase fetchConnections exception, fallback to local:', err);
    }
  }

  const connections = getLocalData<Connection[]>('connections', []);
  return connections.filter(c => c.requesterId === userId || c.recipientId === userId);
}

/**
 * High-performance selective fetch: returns connections and only the associated peer profiles.
 */
export async function fetchConnectionsWithProfiles(userId: string): Promise<{
  connections: Connection[];
  usersMap: Record<string, UserProfile>;
}> {
  const connections = await fetchConnections(userId);
  const targetIds = Array.from(new Set(
    connections.map(c => c.requesterId === userId ? c.recipientId : c.requesterId)
  ));

  const profiles = await fetchUsersByIds(targetIds);
  const usersMap: Record<string, UserProfile> = {};
  profiles.forEach(p => {
    usersMap[p.id] = p;
    if (p.uid && p.uid !== p.id) {
      usersMap[p.uid] = p;
    }
  });

  return { connections, usersMap };
}

/**
 * Sends a connection request.
 * Supabase-authoritative: strictly enforces duplicate prevention, self-connection blockage,
 * and throws errors on failure instead of masking with local storage.
 */
export async function sendConnectionRequest(requesterId: string, recipientId: string): Promise<Connection> {
  if (!requesterId || !recipientId) {
    throw new Error('Invalid requester or recipient ID.');
  }
  if (requesterId === recipientId) {
    throw new Error('You cannot send a connection request to yourself.');
  }

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
    // 1. Check if a connection already exists in either direction
    const { data: existing, error: findError } = await supabase
      .from('connections')
      .select('*')
      .or(`and(requesterId.eq.${requesterId},recipientId.eq.${recipientId}),and(requesterId.eq.${recipientId},recipientId.eq.${requesterId})`)
      .limit(1);

    if (findError) {
      console.warn('Error checking existing connections in Supabase:', findError);
    }

    if (existing && existing.length > 0) {
      const found = existing[0] as Connection;
      if (found.status === 'accepted') {
        throw new Error('You are already connected as campus friends.');
      }
      if (found.status === 'pending') {
        if (found.requesterId === requesterId) {
          throw new Error('You have already sent a connection request to this student.');
        } else {
          throw new Error('This student has already sent you a connection request. Check your received requests tab!');
        }
      }
    }

    // 2. Perform Supabase Insert
    const { data, error } = await supabase
      .from('connections')
      .insert([newConn])
      .select()
      .single();

    if (error) {
      console.error('Supabase sendConnectionRequest error:', error);
      if (error.code === '23505' || error.message?.toLowerCase().includes('duplicate') || error.message?.toLowerCase().includes('unique')) {
        throw new Error('A connection between you and this student already exists.');
      }
      throw new Error(error.message || 'Failed to send connection request to server.');
    }

    if (data) {
      newConn.id = data.id;
    }

    // 3. Realtime Broadcast to both channels
    try {
      const ch1 = supabase.channel(`connections-${recipientId}`);
      ch1.send({ type: 'broadcast', event: 'connection_changed', payload: { type: 'request_sent', connection: newConn } }).catch(() => {});
      const ch2 = supabase.channel(`connections-${requesterId}`);
      ch2.send({ type: 'broadcast', event: 'connection_changed', payload: { type: 'request_sent', connection: newConn } }).catch(() => {});
    } catch {}
  } else {
    // Local storage check when Supabase is not configured
    const localConns = getLocalData<Connection[]>('connections', []);
    const existing = localConns.find(c => 
      (c.requesterId === requesterId && c.recipientId === recipientId) ||
      (c.requesterId === recipientId && c.recipientId === requesterId)
    );
    if (existing) {
      if (existing.status === 'accepted') throw new Error('You are already connected as campus friends.');
      if (existing.status === 'pending') throw new Error('A connection request is already pending.');
    }
  }

  // Update local cache
  const localConns = getLocalData<Connection[]>('connections', []);
  setLocalData('connections', [...localConns.filter(c => c.id !== newConn.id), newConn]);

  // Dispatch window event for instant same-tab & cross-tab sync
  window.dispatchEvent(new CustomEvent('eatm_connections_changed', {
    detail: { type: 'request_sent', connection: newConn }
  }));

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

/**
 * Updates a connection status (accept or decline).
 * Enforces recipient authorization and verifies against Supabase.
 */
export async function updateConnectionStatus(
  connectionId: string, 
  status: 'accepted' | 'rejected',
  currentUserId?: string
): Promise<void> {
  const now = new Date().toISOString();
  let conn: Connection | null = null;

  if (isSupabaseConfigured() && supabase) {
    // 1. Fetch existing connection record
    const { data: existing, error: getErr } = await supabase
      .from('connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (getErr || !existing) {
      console.error('Supabase updateConnectionStatus fetch error:', getErr);
      throw new Error(getErr?.message || 'Connection request not found on server.');
    }

    conn = existing as Connection;

    // 2. Enforce authorization: Only recipient can accept or decline
    if (currentUserId && conn.recipientId !== currentUserId) {
      throw new Error('Unauthorized: Only the recipient can accept or decline this connection request.');
    }

    // 3. Update status in Supabase
    const { error: updErr } = await supabase
      .from('connections')
      .update({ status, updatedAt: now })
      .eq('id', connectionId);

    if (updErr) {
      console.error('Supabase updateConnectionStatus error:', updErr);
      throw new Error(updErr.message || 'Failed to update connection status on server.');
    }

    // 4. Realtime broadcast to both participants
    try {
      const ch1 = supabase.channel(`connections-${conn.requesterId}`);
      ch1.send({ type: 'broadcast', event: 'connection_changed', payload: { type: 'status_updated', connectionId, status } }).catch(() => {});
      const ch2 = supabase.channel(`connections-${conn.recipientId}`);
      ch2.send({ type: 'broadcast', event: 'connection_changed', payload: { type: 'status_updated', connectionId, status } }).catch(() => {});
    } catch {}
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

  // Dispatch window event
  window.dispatchEvent(new CustomEvent('eatm_connections_changed', {
    detail: { type: 'status_updated', connectionId, status }
  }));

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

  // Auto-mark pending connection_request notification as read so it no longer lingers
  if (conn) {
    try {
      const notifs = getLocalData<NotificationItem[]>('notifications', SEED_NOTIFICATIONS);
      const reqNotif = notifs.find(n => 
        n.type === 'connection_request' && 
        n.recipientId === conn!.recipientId && 
        n.senderId === conn!.requesterId
      );
      if (reqNotif && !reqNotif.read) {
        await markNotificationAsRead(reqNotif.id);
      }
    } catch {
      // ignore
    }
  }
}

/**
 * Cancels / withdraws a pending connection request sent by the current user.
 */
export async function cancelConnectionRequest(connectionId: string, requesterId: string): Promise<void> {
  let conn: Connection | null = null;

  if (isSupabaseConfigured() && supabase) {
    const { data: existing, error: getErr } = await supabase
      .from('connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (getErr || !existing) {
      throw new Error(getErr?.message || 'Connection request not found on server.');
    }

    conn = existing as Connection;
    if (conn.requesterId !== requesterId) {
      throw new Error('Unauthorized: Only the requester can cancel this connection request.');
    }
    if (conn.status !== 'pending') {
      throw new Error('Only pending connection requests can be cancelled.');
    }

    const { error: delErr } = await supabase
      .from('connections')
      .delete()
      .eq('id', connectionId)
      .eq('requesterId', requesterId);

    if (delErr) {
      console.error('Supabase cancelConnectionRequest error:', delErr);
      throw new Error(delErr.message || 'Failed to cancel connection request.');
    }

    // Realtime broadcast to both participants
    try {
      const ch1 = supabase.channel(`connections-${conn.recipientId}`);
      ch1.send({ type: 'broadcast', event: 'connection_changed', payload: { type: 'request_cancelled', connectionId } }).catch(() => {});
      const ch2 = supabase.channel(`connections-${requesterId}`);
      ch2.send({ type: 'broadcast', event: 'connection_changed', payload: { type: 'request_cancelled', connectionId } }).catch(() => {});
    } catch {}
  }

  // Update local storage
  const connections = getLocalData<Connection[]>('connections', []);
  setLocalData('connections', connections.filter(c => c.id !== connectionId));

  // Dispatch window event
  window.dispatchEvent(new CustomEvent('eatm_connections_changed', {
    detail: { type: 'request_cancelled', connectionId }
  }));
}

/**
 * Removes an existing connection / unfriends a student.
 */
export async function removeConnection(connectionId: string, userId: string): Promise<void> {
  let conn: Connection | null = null;

  if (isSupabaseConfigured() && supabase) {
    const { data: existing, error: getErr } = await supabase
      .from('connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (getErr || !existing) {
      throw new Error(getErr?.message || 'Connection not found on server.');
    }

    conn = existing as Connection;
    if (conn.requesterId !== userId && conn.recipientId !== userId) {
      throw new Error('Unauthorized: You can only remove your own connection.');
    }

    const { error: delErr } = await supabase
      .from('connections')
      .delete()
      .eq('id', connectionId);

    if (delErr) {
      console.error('Supabase removeConnection error:', delErr);
      throw new Error(delErr.message || 'Failed to remove connection.');
    }

    // Decrement stats if connection was accepted
    if (conn.status === 'accepted') {
      const otherId = conn.requesterId === userId ? conn.recipientId : conn.requesterId;
      const [u1, u2] = await Promise.all([fetchUserById(userId), fetchUserById(otherId)]);
      if (u1 && u1.stats) {
        await updateUserProfile(u1.id, { stats: { ...u1.stats, connections: Math.max(0, (u1.stats.connections || 1) - 1) } });
      }
      if (u2 && u2.stats) {
        await updateUserProfile(u2.id, { stats: { ...u2.stats, connections: Math.max(0, (u2.stats.connections || 1) - 1) } });
      }
    }

    // Realtime broadcast
    try {
      const ch1 = supabase.channel(`connections-${conn.requesterId}`);
      ch1.send({ type: 'broadcast', event: 'connection_changed', payload: { type: 'connection_removed', connectionId } }).catch(() => {});
      const ch2 = supabase.channel(`connections-${conn.recipientId}`);
      ch2.send({ type: 'broadcast', event: 'connection_changed', payload: { type: 'connection_removed', connectionId } }).catch(() => {});
    } catch {}
  }

  // Update local storage
  const connections = getLocalData<Connection[]>('connections', []);
  const removed = connections.find(c => c.id === connectionId);
  setLocalData('connections', connections.filter(c => c.id !== connectionId));

  if (removed && removed.status === 'accepted' && !isSupabaseConfigured()) {
    const otherId = removed.requesterId === userId ? removed.recipientId : removed.requesterId;
    const [u1, u2] = await Promise.all([fetchUserById(userId), fetchUserById(otherId)]);
    if (u1 && u1.stats) {
      await updateUserProfile(u1.id, { stats: { ...u1.stats, connections: Math.max(0, (u1.stats.connections || 1) - 1) } });
    }
    if (u2 && u2.stats) {
      await updateUserProfile(u2.id, { stats: { ...u2.stats, connections: Math.max(0, (u2.stats.connections || 1) - 1) } });
    }
  }

  // Dispatch window event
  window.dispatchEvent(new CustomEvent('eatm_connections_changed', {
    detail: { type: 'connection_removed', connectionId }
  }));
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
                lastSeen: u1?.lastSeen || new Date().toISOString()
              },
              [user2Id]: {
                name: u2?.displayName || 'Student',
                avatar: u2?.photoURL,
                role: u2?.role || 'student',
                lastSeen: u2?.lastSeen || new Date().toISOString()
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
        lastSeen: u1?.lastSeen || now
      },
      [user2Id]: {
        name: u2?.displayName || 'Student',
        avatar: u2?.photoURL,
        role: u2?.role || 'student',
        lastSeen: u2?.lastSeen || now
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
  const localConvs = getLocalData<Conversation[]>('conversations', SEED_CONVERSATIONS);
  let list: Conversation[] = localConvs.filter(c => c.participants && c.participants.includes(userId));

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .contains('participants', [userId])
        .order('updatedAt', { ascending: false });

      if (!error && data && data.length > 0) {
        const serverConvs = data as Conversation[];
        const serverMap = new Map(serverConvs.map(c => [c.id, c]));
        const mergedList = [...serverConvs];
        for (const localC of list) {
          if (!serverMap.has(localC.id)) {
            mergedList.push(localC);
          }
        }
        list = mergedList;
      }
    } catch (err) {
      console.warn('Supabase fetchConversations error:', err);
    }
  }

  // Enrich participantDetails from live user directory (using memory cache)
  const allUsers = await fetchUsers();
  const userMap = new Map(allUsers.map(u => [u.id, u]));

  // Enrich participantDetails and sync true latest message from message bank
  const allMessages = getLocalData<Message[]>('messages', SEED_MESSAGES);
  const msgMap = new Map<string, Message>();
  allMessages.forEach(m => {
    const existing = msgMap.get(m.conversationId);
    if (!existing || new Date(m.createdAt).getTime() > new Date(existing.createdAt).getTime()) {
      msgMap.set(m.conversationId, m);
    }
  });

  const enrichedList = list.map(conv => {
    const details = { ...(conv.participantDetails || {}) };
    conv.participants.forEach(pId => {
      const u = userMap.get(pId);
      if (u) {
        const userPhoto = u.photoURL;
        const resolvedAvatar = isCustomPhoto(userPhoto)
          ? userPhoto
          : (isCustomPhoto(details[pId]?.avatar) ? details[pId]?.avatar : undefined);

        details[pId] = {
          ...(details[pId] || {}),
          name: u.displayName || details[pId]?.name,
          avatar: resolvedAvatar,
          role: details[pId]?.role || u.role,
          lastSeen: u.lastSeen || details[pId]?.lastSeen
        };
      }
    });

    const latestMsg = msgMap.get(conv.id);
    let lastMessage = conv.lastMessage;
    let updatedAt = conv.updatedAt || (conv as any).createdAt || new Date().toISOString();
    if (latestMsg) {
      const msgTime = new Date(latestMsg.createdAt).getTime();
      const currTime = new Date(updatedAt || 0).getTime();
      if (!lastMessage || msgTime >= currTime) {
        let previewText = latestMsg.text;
        if (!previewText) {
          if (latestMsg.mediaType === 'image') previewText = '📷 Photo';
          else if (latestMsg.mediaType === 'video') previewText = '🎥 Video';
          else if (latestMsg.mediaType === 'audio') previewText = '🎤 Voice Note';
          else if (latestMsg.mediaType === 'file') previewText = `📄 ${latestMsg.fileName || 'Document'}`;
          else previewText = 'Attachment';
        }
        lastMessage = {
          text: previewText,
          senderId: latestMsg.senderId,
          timestamp: new Date(latestMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: latestMsg.read
        };
        updatedAt = latestMsg.createdAt;
      }
    }

    return {
      ...conv,
      participantDetails: details,
      lastMessage,
      updatedAt
    };
  }).sort((a, b) => {
    const timeA = new Date(a.updatedAt || 0).getTime();
    const timeB = new Date(b.updatedAt || 0).getTime();
    return timeB - timeA;
  });

  // Keep local cache synced
  const allLocal = getLocalData<Conversation[]>('conversations', SEED_CONVERSATIONS);
  const enrichedMap = new Map(enrichedList.map(c => [c.id, c]));
  const updatedAllLocal = allLocal.map(c => enrichedMap.get(c.id) || c);
  for (const c of enrichedList) {
    if (!updatedAllLocal.some(existing => existing.id === c.id)) {
      updatedAllLocal.push(c);
    }
  }
  setLocalData('conversations', updatedAllLocal);

  return enrichedList;
}

export function detectChatMessageMediaType(mediaUrl?: string, explicitType?: string): 'image' | 'video' | 'file' | 'audio' | undefined {
  if (explicitType === 'audio') return 'audio';
  if (explicitType === 'video') return 'video';
  if (explicitType === 'image') return 'image';
  if (explicitType === 'file') return 'file';

  if (!mediaUrl) return undefined;
  const lower = mediaUrl.toLowerCase();

  // 1. Audio check first - voice notes (.webm/.ogg/.wav/data:audio) must NEVER be classified as video
  if (
    lower.startsWith('data:audio/') || 
    lower.includes('voice-note') || 
    lower.includes('audio') ||
    /\.(mp3|wav|ogg|m4a|aac|opus|weba)(\?.*)?$/i.test(lower) ||
    (/\.webm(\?.*)?$/i.test(lower) && !lower.includes('video'))
  ) {
    return 'audio';
  }

  // 2. Image check
  if (
    lower.startsWith('data:image/') || 
    /\.(jpe?g|png|gif|webp|svg|bmp|ico)(\?.*)?$/i.test(lower)
  ) {
    return 'image';
  }

  // 3. Video check (.mp4, .mov, etc.)
  if (
    lower.startsWith('data:video/') || 
    (lower.includes('video') && !lower.includes('voice-note')) ||
    /\.(mp4|mov|avi|mkv|flv|m4v)(\?.*)?$/i.test(lower)
  ) {
    return 'video';
  }

  return 'file';
}

const DELETED_FOR_ME_PREFIX = 'eatm_deleted_for_me_';

export function getDeletedForMeIds(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_FOR_ME_PREFIX + userId);
    if (raw) return new Set(JSON.parse(raw));
  } catch (e) {}
  return new Set();
}

export function markMessageDeletedForMe(userId: string, messageId: string): void {
  try {
    const set = getDeletedForMeIds(userId);
    set.add(messageId);
    localStorage.setItem(DELETED_FOR_ME_PREFIX + userId, JSON.stringify(Array.from(set)));
  } catch (e) {}
}

export async function fetchMessages(conversationId: string, currentUserId?: string): Promise<Message[]> {
  const deletedForMeSet = currentUserId ? getDeletedForMeIds(currentUserId) : new Set<string>();
  const allUsers = await fetchUsers();
  const userMap = new Map(allUsers.map(u => [u.id, u]));

  const enrichMsg = (m: Message): Message => {
    const isDeletedMsg = m.isDeleted === true || m.text === '__DELETED_FOR_EVERYONE__';
    const u = userMap.get(m.senderId);
    const userPhoto = u?.photoURL;
    const resolvedAvatar = isCustomPhoto(userPhoto)
      ? userPhoto
      : (isCustomPhoto(m.senderAvatar) ? m.senderAvatar : undefined);
    return {
      ...m,
      isDeleted: isDeletedMsg,
      text: isDeletedMsg ? '' : m.text,
      mediaUrl: isDeletedMsg ? undefined : m.mediaUrl,
      mediaType: isDeletedMsg ? undefined : detectChatMessageMediaType(m.mediaUrl, m.mediaType),
      senderName: m.senderName || u?.displayName || (m.senderId === 'system' ? 'CampusConnect' : 'Student'),
      senderAvatar: resolvedAvatar
    };
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversationId', conversationId)
        .order('createdAt', { ascending: true });

      if (!error && data && data.length > 0) {
        const enriched = (data as Message[]).map(enrichMsg);

        // Sync local cache
        const localMsgs = getLocalData<Message[]>('messages', SEED_MESSAGES);
        const serverIds = new Set(enriched.map(m => m.id));
        const remainingLocal = localMsgs.filter(m => m.conversationId !== conversationId || !serverIds.has(m.id));
        setLocalData('messages', [...remainingLocal, ...enriched]);

        return enriched.filter(m => {
          if (deletedForMeSet.has(m.id)) return false;
          if (currentUserId && m.deletedFor && m.deletedFor.includes(currentUserId)) return false;
          return true;
        });
      }
    } catch (err) {
      console.warn('Supabase fetchMessages error:', err);
    }
  }

  const msgs = getLocalData<Message[]>('messages', SEED_MESSAGES);
  const convMsgs = msgs.filter(m => m.conversationId === conversationId).map(enrichMsg);

  return convMsgs.filter(m => {
    if (deletedForMeSet.has(m.id)) return false;
    if (currentUserId && m.deletedFor && m.deletedFor.includes(currentUserId)) return false;
    return true;
  });
}

export async function markConversationMessagesAsRead(conversationId: string, userId: string): Promise<void> {
  // 1. Mark local messages as read
  const msgs = getLocalData<Message[]>('messages', SEED_MESSAGES);
  let changedMsgs = false;
  const updatedMsgs = msgs.map(m => {
    if (m.conversationId === conversationId && m.senderId !== userId && !m.read) {
      changedMsgs = true;
      return { ...m, read: true };
    }
    return m;
  });
  if (changedMsgs) {
    setLocalData('messages', updatedMsgs);
  }

  // 2. Reset unreadCount on conversation
  const convs = getLocalData<Conversation[]>('conversations', SEED_CONVERSATIONS);
  const conv = convs.find(c => c.id === conversationId);
  if (conv) {
    conv.unreadCount = conv.unreadCount || {};
    conv.unreadCount[userId] = 0;
    setLocalData('conversations', [...convs]);
  }

  // 3. Mark in Supabase in background
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversationId', conversationId)
        .neq('senderId', userId);
    } catch (e) {}
  }
}

export async function sendChatMessage(msg: Omit<Message, 'id' | 'createdAt' | 'read'>): Promise<Message> {
  const mediaType = detectChatMessageMediaType(msg.mediaUrl, msg.mediaType);
  const uniqueId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  const newMsg: Message = {
    ...msg,
    mediaType,
    id: uniqueId,
    createdAt: new Date().toISOString(),
    read: false
  };

  const msgs = getLocalData<Message[]>('messages', SEED_MESSAGES);
  if (!msgs.some(m => m.id === newMsg.id)) {
    setLocalData('messages', [...msgs, newMsg]);
  }

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
  let conv = convs.find(c => c.id === msg.conversationId);
  const lastMessagePayload = {
    text: previewText,
    senderId: msg.senderId,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    read: false
  };

  // If not found in local cache, query Supabase so participants are known
  if (!conv && isSupabaseConfigured() && supabase) {
    try {
      const { data } = await supabase.from('conversations').select('*').eq('id', msg.conversationId).single();
      if (data) conv = data as Conversation;
    } catch {}
  }

  if (conv) {
    conv.lastMessage = lastMessagePayload;
    conv.updatedAt = new Date().toISOString();
    conv.unreadCount = conv.unreadCount || {};
    conv.participants?.forEach(pId => {
      if (pId !== msg.senderId) {
        conv!.unreadCount[pId] = (conv!.unreadCount[pId] || 0) + 1;
      }
    });
    setLocalData('conversations', [...convs.filter(c => c.id !== conv!.id), conv]);

    if (conv.participants) {
      const recipients = conv.participants.filter(p => p !== msg.senderId);
      for (const recipientId of recipients) {
        try {
          const senderUser = await fetchUserById(msg.senderId);
          await createNotification({
            recipientId,
            senderId: msg.senderId,
            senderName: senderUser?.displayName || 'Campus Peer',
            senderAvatar: senderUser?.photoURL,
            type: 'message',
            title: `New message from ${senderUser?.displayName || 'Campus Peer'}`,
            message: previewText,
            link: '/student/messages'
          });
        } catch (notifErr) {
          console.warn('Failed to create chat notification:', notifErr);
        }
      }
    }
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

/**
 * Deletes a chat message for all participants (WhatsApp "Delete for everyone").
 * Strips out media and text, marks isDeleted as true, and notifies active peers.
 */
export async function deleteMessageForEveryone(messageId: string, conversationId: string): Promise<void> {
  // 1. Update local cache
  const msgs = getLocalData<Message[]>('messages', SEED_MESSAGES);
  const updatedMsgs = msgs.map(m => {
    if (m.id === messageId) {
      return {
        ...m,
        isDeleted: true,
        text: '',
        mediaUrl: undefined,
        mediaType: undefined,
        fileName: undefined,
        fileSize: undefined,
        audioDuration: undefined
      };
    }
    return m;
  });
  setLocalData('messages', updatedMsgs);

  // Update conversation last message if this was the last message
  const convs = getLocalData<Conversation[]>('conversations', SEED_CONVERSATIONS);
  const conv = convs.find(c => c.id === conversationId);
  if (conv) {
    const remainingConvMsgs = updatedMsgs.filter(m => m.conversationId === conversationId);
    const lastMsg = remainingConvMsgs[remainingConvMsgs.length - 1];
    if (lastMsg && lastMsg.id === messageId) {
      conv.lastMessage = {
        text: '🚫 This message was deleted',
        senderId: lastMsg.senderId,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: true
      };
      setLocalData('conversations', [...convs]);
    }
  }

  // 2. Dispatch local window event for multi-tab / instant UI sync
  window.dispatchEvent(new CustomEvent('eatm_chat_message_deleted', {
    detail: { messageId, conversationId }
  }));

  // 3. Persist to Supabase Database & Realtime broadcast
  if (isSupabaseConfigured() && supabase) {
    try {
      // First attempt full update with isDeleted column
      let updateError = null;
      try {
        const res = await supabase.from('messages').update({
          isDeleted: true,
          text: '__DELETED_FOR_EVERYONE__',
          mediaUrl: null,
          fileName: null,
          fileSize: null
        }).eq('id', messageId);
        updateError = res.error;
      } catch (e) {
        updateError = e;
      }

      // If isDeleted/fileName columns don't exist yet in Supabase schema, fall back to base columns text and mediaUrl
      if (updateError) {
        await supabase.from('messages').update({
          text: '__DELETED_FOR_EVERYONE__',
          mediaUrl: null
        }).eq('id', messageId);
      }

      // Update conversations table lastMessage in Supabase
      await supabase.from('conversations').update({
        lastMessage: {
          text: '🚫 This message was deleted',
          senderId: '',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: true
        },
        updatedAt: new Date().toISOString()
      }).eq('id', conversationId);

      // Broadcast to active peers in chat room
      const chatChannel = supabase.channel(`chat-room-${conversationId}`);
      if (chatChannel.state === 'joined') {
        chatChannel.send({
          type: 'broadcast',
          event: 'message_deleted_for_everyone',
          payload: { messageId, conversationId }
        }).catch(() => {});
      } else {
        chatChannel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            chatChannel.send({
              type: 'broadcast',
              event: 'message_deleted_for_everyone',
              payload: { messageId, conversationId }
            }).catch(() => {});
          }
        });
      }
    } catch (err) {
      console.warn('Supabase deleteMessageForEveryone error:', err);
    }
  }
}

/**
 * Deletes a chat message only for the current user (WhatsApp "Delete for me").
 * Appends the user's ID to the message's deletedFor array and persists in localStorage.
 */
export async function deleteMessageForMe(messageId: string, conversationId: string, userId: string): Promise<void> {
  // 1. Mark in permanent localStorage deletedForMe set (guarantees zero resurrection by heartbeats)
  markMessageDeletedForMe(userId, messageId);

  // 2. Update local cache
  const msgs = getLocalData<Message[]>('messages', SEED_MESSAGES);
  const updatedMsgs = msgs.map(m => {
    if (m.id === messageId) {
      const existing = m.deletedFor || [];
      return {
        ...m,
        deletedFor: existing.includes(userId) ? existing : [...existing, userId]
      };
    }
    return m;
  });
  setLocalData('messages', updatedMsgs);

  // 3. Dispatch local event
  window.dispatchEvent(new CustomEvent('eatm_chat_message_deleted_for_me', {
    detail: { messageId, conversationId, userId }
  }));

  // 4. Persist to Supabase if column exists
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: existing, error } = await supabase
        .from('messages')
        .select('deletedFor')
        .eq('id', messageId)
        .single();

      if (!error && existing) {
        const existingArr: string[] = existing?.deletedFor || [];
        if (!existingArr.includes(userId)) {
          await supabase
            .from('messages')
            .update({ deletedFor: [...existingArr, userId] })
            .eq('id', messageId);
        }
      }
    } catch (err) {
      // Ignored if deletedFor column doesn't exist
    }
  }
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
          const raw = event.payload as any;
          const { mediaUrl, mediaUrls } = normalizePostMedia(raw);
          callbacks.onInsert?.({ ...(raw as Post), mediaUrl, mediaUrls });
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
        if (payload.new) {
          const raw = payload.new as any;
          const { mediaUrl, mediaUrls } = normalizePostMedia(raw);
          callbacks.onInsert?.({ ...(raw as Post), mediaUrl, mediaUrls });
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'posts' },
      (payload) => {
        if (payload.new) {
          const raw = payload.new as any;
          const { mediaUrl, mediaUrls } = normalizePostMedia(raw);
          callbacks.onUpdate?.({ ...(raw as Post), mediaUrl, mediaUrls });
        }
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
  onInsert: (newMsg: Message) => void,
  onDeleteForEveryone?: (messageId: string) => void
): () => void {
  // 1. Listen to local window events (syncs instant updates across tabs/components)
  const windowListener = (e: CustomEvent<Message>) => {
    if (e.detail && e.detail.conversationId === conversationId) {
      onInsert(e.detail);
    }
  };
  const deleteListener = (e: CustomEvent<{ messageId: string; conversationId: string }>) => {
    if (e.detail && e.detail.conversationId === conversationId) {
      onDeleteForEveryone?.(e.detail.messageId);
    }
  };

  window.addEventListener('eatm_chat_message', windowListener as EventListener);
  window.addEventListener('eatm_chat_message_deleted', deleteListener as EventListener);

  if (!isSupabaseConfigured() || !supabase) {
    return () => {
      window.removeEventListener('eatm_chat_message', windowListener as EventListener);
      window.removeEventListener('eatm_chat_message_deleted', deleteListener as EventListener);
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
          const m = event.payload as Message;
          onInsert({
            ...m,
            mediaType: detectChatMessageMediaType(m.mediaUrl, m.mediaType)
          });
        }
      }
    )
    .on(
      'broadcast',
      { event: 'message_deleted_for_everyone' },
      (event) => {
        if (event.payload && event.payload.conversationId === conversationId) {
          onDeleteForEveryone?.(event.payload.messageId);
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => {
        const raw = payload.new as any;
        if (!raw) return;
        const convId = raw.conversationId || raw.conversationid;
        if (convId === conversationId) {
          const m: Message = {
            id: raw.id,
            conversationId: convId,
            senderId: raw.senderId || raw.senderid,
            senderName: raw.senderName || raw.sendername,
            senderAvatar: raw.senderAvatar || raw.senderavatar,
            text: raw.text || '',
            mediaUrl: raw.mediaUrl || raw.mediaurl,
            mediaType: detectChatMessageMediaType(raw.mediaUrl || raw.mediaurl, raw.mediaType || raw.mediatype),
            fileName: raw.fileName || raw.filename,
            fileSize: raw.fileSize || raw.filesize,
            audioDuration: raw.audioDuration || raw.audioduration,
            read: raw.read ?? false,
            createdAt: raw.createdAt || raw.created_at || raw.createdat || new Date().toISOString(),
            isDeleted: raw.isDeleted || raw.isdeleted || false,
            deletedFor: raw.deletedFor || raw.deletedfor || []
          };
          onInsert(m);
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'messages' },
      (payload) => {
        const raw = payload.new as any;
        if (!raw) return;
        const convId = raw.conversationId || raw.conversationid;
        if (convId === conversationId) {
          if (raw.isDeleted || raw.isdeleted) {
            onDeleteForEveryone?.(raw.id);
          }
        }
      }
    )
    .subscribe();

  return () => {
    window.removeEventListener('eatm_chat_message', windowListener as EventListener);
    window.removeEventListener('eatm_chat_message_deleted', deleteListener as EventListener);
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
        if (
          row &&
          (row.requesterId === userId ||
            row.requester_id === userId ||
            row.recipientId === userId ||
            row.recipient_id === userId)
        ) {
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
  // 1. Local event listener for cross-tab updates
  const localHandler = () => onChange();
  window.addEventListener('eatm_notifications_changed', localHandler);

  if (!isSupabaseConfigured() || !supabase) {
    return () => {
      window.removeEventListener('eatm_notifications_changed', localHandler);
    };
  }

  const client = supabase;
  const channelName = `realtime-notifications-${userId}`;
  const channel = client
    .channel(channelName)
    .on(
      'broadcast',
      { event: 'new_notification' },
      () => {
        onChange();
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications' },
      (payload) => {
        const row = payload.new as any;
        if (row && (row.recipientId === userId || row.recipientid === userId)) {
          onChange();
        }
      }
    )
    .subscribe();

  return () => {
    window.removeEventListener('eatm_notifications_changed', localHandler);
    if (client) client.removeChannel(channel);
  };
}

// ---------------------------------------------
// CLUBS & COMMUNITIES (Supabase Single Source of Truth)
// ---------------------------------------------

/**
 * Helper to auto-seed initial rich communities into Supabase if empty
 */
async function seedCommunityDataIfEmpty(): Promise<void> {
  if (!isSupabaseConfigured() || !supabase) return;
  try {
    const { data: existingComm, error } = await supabase.from('communities').select('id').limit(1);
    if (error || (existingComm && existingComm.length > 0)) return;

    console.info('🌱 Seeding initial CampusConnect communities & clubs into Supabase...');

    // 1. Seed Communities
    const commRows = SEED_COMMUNITIES.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      category: c.category,
      type: c.type || 'public',
      logo: c.logoUrl,
      "logoUrl": c.logoUrl,
      cover: c.coverUrl,
      "coverUrl": c.coverUrl,
      "ownerId": c.ownerId,
      "isOfficial": c.isOfficial || false,
      "verificationStatus": c.verificationStatus || (c.isOfficial ? 'verified' : 'student'),
      lead: c.lead,
      "leadRole": c.leadRole,
      "memberCount": c.memberCount || c.members.length || 1,
      members: c.members,
      admins: c.admins || (c.ownerId ? [c.ownerId] : []),
      moderators: c.moderators || [],
      "pendingRequests": c.pendingRequests || [],
      "bannedUsers": c.bannedUsers || [],
      rules: c.rules || [],
      tags: c.tags || [c.category],
      "meetingTime": c.meetingTime,
      room: c.room,
      "createdAt": c.createdAt || new Date().toISOString(),
      "updatedAt": c.updatedAt || new Date().toISOString()
    }));
    await supabase.from('communities').upsert(commRows);

    // 2. Seed Community Members
    const memberRows: any[] = [];
    SEED_COMMUNITIES.forEach(c => {
      // Owner
      if (c.ownerId) {
        memberRows.push({
          id: `cm_${c.id}_${c.ownerId}`,
          communityId: c.id,
          userId: c.ownerId,
          role: 'owner',
          status: 'approved',
          joinedAt: c.createdAt || new Date().toISOString()
        });
      }
      // Admins
      (c.admins || []).forEach(adminId => {
        if (adminId !== c.ownerId && !memberRows.some(m => m.communityId === c.id && m.userId === adminId)) {
          memberRows.push({
            id: `cm_${c.id}_${adminId}`,
            communityId: c.id,
            userId: adminId,
            role: 'admin',
            status: 'approved',
            joinedAt: c.createdAt || new Date().toISOString()
          });
        }
      });
      // Moderators
      (c.moderators || []).forEach(modId => {
        if (!memberRows.some(m => m.communityId === c.id && m.userId === modId)) {
          memberRows.push({
            id: `cm_${c.id}_${modId}`,
            communityId: c.id,
            userId: modId,
            role: 'moderator',
            status: 'approved',
            joinedAt: c.createdAt || new Date().toISOString()
          });
        }
      });
      // Members
      (c.members || []).forEach(memId => {
        if (!memberRows.some(m => m.communityId === c.id && m.userId === memId)) {
          memberRows.push({
            id: `cm_${c.id}_${memId}`,
            communityId: c.id,
            userId: memId,
            role: 'member',
            status: 'approved',
            joinedAt: c.createdAt || new Date().toISOString()
          });
        }
      });
      // Pending requests
      (c.pendingRequests || []).forEach(pId => {
        if (!memberRows.some(m => m.communityId === c.id && m.userId === pId)) {
          memberRows.push({
            id: `cm_${c.id}_${pId}`,
            communityId: c.id,
            userId: pId,
            role: 'member',
            status: 'pending',
            requestedAt: new Date().toISOString()
          });
        }
      });
      // Banned
      (c.bannedUsers || []).forEach(bId => {
        if (!memberRows.some(m => m.communityId === c.id && m.userId === bId)) {
          memberRows.push({
            id: `cm_${c.id}_${bId}`,
            communityId: c.id,
            userId: bId,
            role: 'member',
            status: 'banned'
          });
        }
      });
    });
    if (memberRows.length > 0) {
      await supabase.from('community_members').upsert(memberRows);
    }

    // 3. Seed Posts
    if (SEED_COMMUNITY_POSTS.length > 0) {
      await supabase.from('community_posts').upsert(SEED_COMMUNITY_POSTS);
    }

    // 4. Seed Comments
    if (SEED_COMMUNITY_COMMENTS.length > 0) {
      await supabase.from('community_comments').upsert(SEED_COMMUNITY_COMMENTS);
    }

    // 5. Seed Discussions
    if (SEED_COMMUNITY_DISCUSSIONS.length > 0) {
      await supabase.from('community_discussions').upsert(SEED_COMMUNITY_DISCUSSIONS);
    }

    // 6. Seed Discussion Comments
    if (SEED_COMMUNITY_DISCUSSION_COMMENTS.length > 0) {
      await supabase.from('community_discussion_comments').upsert(SEED_COMMUNITY_DISCUSSION_COMMENTS);
    }

    // 7. Seed Messages
    if (SEED_COMMUNITY_MESSAGES.length > 0) {
      await supabase.from('community_messages').upsert(SEED_COMMUNITY_MESSAGES);
    }

    // 8. Seed Resources
    if (SEED_COMMUNITY_RESOURCES.length > 0) {
      await supabase.from('community_resources').upsert(SEED_COMMUNITY_RESOURCES);
    }

    // 9. Seed Events
    if (SEED_COMMUNITY_EVENTS.length > 0) {
      await supabase.from('community_events').upsert(SEED_COMMUNITY_EVENTS);
    }

    console.info('✅ Initial Supabase communities seeded successfully!');
  } catch (err) {
    console.warn('Initial community auto-seeding encountered non-fatal error:', err);
  }
}

export async function fetchCommunities(): Promise<Community[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const [commRes, memRes] = await Promise.all([
        supabase.from('communities').select('*').order('name', { ascending: true }),
        supabase.from('community_members').select('*')
      ]);

      if (commRes.error) {
        console.error('❌ Supabase fetchCommunities error:', commRes.error);
        throw new Error(commRes.error.message || 'Failed to load communities directory from server.');
      }

      if (commRes.data && commRes.data.length > 0) {
        const membersData = memRes.data || [];
        const normalized: Community[] = commRes.data.map(c => {
          const clubMembers = membersData.filter((m: any) => m.communityId === c.id);
          const approved = clubMembers.filter((m: any) => m.status === 'approved');
          const pending = clubMembers.filter((m: any) => m.status === 'pending').map((m: any) => m.userId);
          const banned = clubMembers.filter((m: any) => m.status === 'banned').map((m: any) => m.userId);
          const admins = approved.filter((m: any) => m.role === 'admin' || m.role === 'owner').map((m: any) => m.userId);
          const moderators = approved.filter((m: any) => m.role === 'moderator').map((m: any) => m.userId);
          const membersList = approved.map((m: any) => m.userId);

          const hasMemberRows = membersData.length > 0;
          const finalMembers = (hasMemberRows || membersList.length > 0) ? membersList : (Array.isArray(c.members) && c.members.length > 0 ? c.members : (c.ownerId ? [c.ownerId] : []));
          const finalAdmins = (hasMemberRows || admins.length > 0) ? admins : (Array.isArray(c.admins) && c.admins.length > 0 ? c.admins : (c.ownerId ? [c.ownerId] : []));
          const finalMods = hasMemberRows ? moderators : (Array.isArray(c.moderators) ? c.moderators : []);
          const finalPending = hasMemberRows ? pending : (Array.isArray(c.pendingRequests) ? c.pendingRequests : []);
          const finalBanned = hasMemberRows ? banned : (Array.isArray(c.bannedUsers) ? c.bannedUsers : []);

          return {
            ...c,
            logoUrl: c.logoUrl || c.logo || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&auto=format&fit=crop&q=80',
            coverUrl: c.coverUrl || c.cover || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80',
            type: (c.type as CommunityType) || 'public',
            memberCount: Math.max(finalMembers.length, typeof c.memberCount === 'number' ? c.memberCount : 1),
            members: finalMembers,
            admins: finalAdmins,
            moderators: finalMods,
            pendingRequests: finalPending,
            bannedUsers: finalBanned,
            rules: Array.isArray(c.rules) ? c.rules : [],
            tags: Array.isArray(c.tags) ? c.tags : []
          };
        });

        setLocalData('communities', normalized);
        return normalized;
      } else if (commRes.data && commRes.data.length === 0) {
        await seedCommunityDataIfEmpty();
        const recheck = await supabase.from('communities').select('*').order('name', { ascending: true });
        if (recheck.data && recheck.data.length > 0) {
          const norm: Community[] = recheck.data.map(c => ({
            ...c,
            logoUrl: c.logoUrl || c.logo || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&auto=format&fit=crop&q=80',
            coverUrl: c.coverUrl || c.cover || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80',
            type: (c.type as CommunityType) || 'public',
            memberCount: typeof c.memberCount === 'number' ? c.memberCount : (c.members?.length || 1),
            members: Array.isArray(c.members) && c.members.length > 0 ? c.members : (c.ownerId ? [c.ownerId] : []),
            admins: Array.isArray(c.admins) && c.admins.length > 0 ? c.admins : (c.ownerId ? [c.ownerId] : []),
            moderators: Array.isArray(c.moderators) ? c.moderators : [],
            pendingRequests: Array.isArray(c.pendingRequests) ? c.pendingRequests : [],
            bannedUsers: Array.isArray(c.bannedUsers) ? c.bannedUsers : [],
            rules: Array.isArray(c.rules) ? c.rules : [],
            tags: Array.isArray(c.tags) ? c.tags : []
          }));
          setLocalData('communities', norm);
          return norm;
        }
        return [];
      }
    } catch (err: any) {
      console.warn('Supabase fetchCommunities exception:', err);
      if (err.message && !err.message.includes('network')) {
        throw err;
      }
    }
  }

  return getLocalData<Community[]>('communities', SEED_COMMUNITIES);
}

export async function fetchCommunityById(id: string): Promise<Community | null> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const [commRes, memRes] = await Promise.all([
        supabase.from('communities').select('*').eq('id', id).maybeSingle(),
        supabase.from('community_members').select('*').eq('communityId', id)
      ]);

      if (!commRes.error && commRes.data) {
        const c = commRes.data;
        const clubMembers = memRes.data || [];
        const approved = clubMembers.filter((m: any) => m.status === 'approved');
        const pending = clubMembers.filter((m: any) => m.status === 'pending').map((m: any) => m.userId);
        const banned = clubMembers.filter((m: any) => m.status === 'banned').map((m: any) => m.userId);
        const admins = approved.filter((m: any) => m.role === 'admin' || m.role === 'owner').map((m: any) => m.userId);
        const moderators = approved.filter((m: any) => m.role === 'moderator').map((m: any) => m.userId);
        const membersList = approved.map((m: any) => m.userId);

        const hasMemberRows = memRes.data !== null && memRes.data !== undefined;
        const finalMembers = (hasMemberRows || membersList.length > 0) ? membersList : (Array.isArray(c.members) && c.members.length > 0 ? c.members : (c.ownerId ? [c.ownerId] : []));
        const finalAdmins = (hasMemberRows || admins.length > 0) ? admins : (Array.isArray(c.admins) && c.admins.length > 0 ? c.admins : (c.ownerId ? [c.ownerId] : []));
        const finalMods = hasMemberRows ? moderators : (Array.isArray(c.moderators) ? c.moderators : []);
        const finalPending = hasMemberRows ? pending : (Array.isArray(c.pendingRequests) ? c.pendingRequests : []);
        const finalBanned = hasMemberRows ? banned : (Array.isArray(c.bannedUsers) ? c.bannedUsers : []);

        const community: Community = {
          ...c,
          logoUrl: c.logoUrl || c.logo || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&auto=format&fit=crop&q=80',
          coverUrl: c.coverUrl || c.cover || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80',
          type: (c.type as CommunityType) || 'public',
          memberCount: Math.max(finalMembers.length, typeof c.memberCount === 'number' ? c.memberCount : 1),
          members: finalMembers,
          admins: finalAdmins,
          moderators: finalMods,
          pendingRequests: finalPending,
          bannedUsers: finalBanned,
          rules: Array.isArray(c.rules) ? c.rules : [],
          tags: Array.isArray(c.tags) ? c.tags : []
        };
        return community;
      }
    } catch (err) {
      console.warn('Supabase fetchCommunityById error:', err);
    }
  }

  const all = await fetchCommunities();
  return all.find(c => c.id === id) || null;
}

export async function createCommunity(
  data: Partial<Community> & { name: string; category: string; description: string },
  creatorId: string
): Promise<Community> {
  if (!creatorId) {
    throw new Error('Creator ID is required to register a community.');
  }

  const users = await fetchUsers();
  const creator = users.find(u => u.id === creatorId || u.uid === creatorId);
  const isCampusAdmin = creator?.role === 'admin';
  const isOfficial = isCampusAdmin ? (data.isOfficial || false) : false;
  const verificationStatus = isOfficial ? 'verified' : 'student';

  const newId = 'club_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const newCommunity: Community = {
    id: newId,
    name: data.name.trim(),
    category: data.category,
    description: data.description.trim(),
    type: data.type || 'public',
    logoUrl: data.logoUrl || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&auto=format&fit=crop&q=80',
    coverUrl: data.coverUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80',
    ownerId: creatorId,
    isOfficial,
    verificationStatus,
    memberCount: 1,
    members: [creatorId],
    admins: [creatorId],
    moderators: [],
    pendingRequests: [],
    bannedUsers: [],
    rules: data.rules && data.rules.length > 0 ? data.rules : [
      'Respect all members and campus policies.',
      'Constructive technical, academic, and cultural discussions only.',
      'No spam, self-promotion, or offensive media.'
    ],
    tags: data.tags || [data.category],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (isSupabaseConfigured() && supabase) {
    // 0. Ensure creator profile exists in public.users to satisfy foreign key constraints
    try {
      const allUsers = await fetchUsers();
      const currentCreator = allUsers.find(u => u.id === creatorId || u.uid === creatorId);
      await supabase.from('users').upsert([{
        id: creatorId,
        uid: currentCreator?.uid || creatorId,
        email: currentCreator?.email || `${creatorId}@campus.eatm.ac.in`,
        displayName: currentCreator?.displayName || 'Campus Member',
        role: currentCreator?.role || 'student',
        department: currentCreator?.department || 'CSE',
        status: 'active',
        verified: true
      }]);
    } catch (e) {
      console.warn('Creator profile pre-sync warning:', e);
    }

    // 1. Insert Community record into Supabase
    const payload = {
      id: newCommunity.id,
      name: newCommunity.name,
      description: newCommunity.description,
      category: newCommunity.category,
      type: newCommunity.type,
      logo: newCommunity.logoUrl,
      logoUrl: newCommunity.logoUrl,
      cover: newCommunity.coverUrl,
      coverUrl: newCommunity.coverUrl,
      ownerId: creatorId,
      isOfficial: newCommunity.isOfficial,
      verificationStatus: newCommunity.verificationStatus,
      memberCount: 1,
      members: [creatorId],
      admins: [creatorId],
      moderators: [],
      pendingRequests: [],
      bannedUsers: [],
      rules: newCommunity.rules,
      tags: newCommunity.tags
    };

    let { error: commError } = await supabase.from('communities').insert([payload]);

    if (commError) {
      console.error('❌ Supabase community creation error:', commError);
      // If foreign key constraint failed on ownerId, retry with ownerId = null to ensure community is created
      if (commError.message?.toLowerCase().includes('foreign key') || commError.message?.includes('ownerId')) {
        const { error: retryError } = await supabase.from('communities').insert([{ ...payload, ownerId: null }]);
        if (retryError) {
          throw new Error(retryError.message || 'Failed to create community in Supabase database.');
        }
        commError = null;
      } else {
        throw new Error(commError.message || 'Failed to create community in Supabase database.');
      }
    }

    // 2. Insert Owner Membership record into community_members table
    try {
      const { error: memError } = await supabase.from('community_members').upsert([{
        id: 'cm_' + newCommunity.id + '_' + creatorId,
        communityId: newCommunity.id,
        userId: creatorId,
        role: 'owner',
        status: 'approved',
        joinedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }]);

      if (memError) {
        console.warn('❌ Supabase community owner membership creation warning:', memError);
      }
    } catch (memErr) {
      console.warn('Supabase community owner membership exception:', memErr);
    }

    // 3. Verify record existence in Supabase
    const { data: verifyData, error: verifyError } = await supabase
      .from('communities')
      .select('*')
      .eq('id', newCommunity.id)
      .maybeSingle();

    if (verifyError) {
      console.warn('Community verification note:', verifyError);
    }

    // Update local cache and notify app
    const list = getLocalData<Community[]>('communities', []);
    setLocalData('communities', [newCommunity, ...list.filter(c => c.id !== newCommunity.id)]);
    window.dispatchEvent(new CustomEvent('eatm_communities_changed', { detail: [newCommunity, ...list] }));
    return newCommunity;
  }

  // Offline Sandbox fallback
  const list = getLocalData<Community[]>('communities', SEED_COMMUNITIES);
  setLocalData('communities', [newCommunity, ...list]);
  return newCommunity;
}

export async function joinCommunity(
  communityId: string, 
  userId: string
): Promise<{ status: 'joined' | 'requested' | 'already_member' | 'banned'; count: number; community?: Community }> {
  if (isSupabaseConfigured() && supabase) {
    try {
      // 0. Ensure user profile exists in public.users to satisfy Foreign Key constraints
      try {
        const allUsers = await fetchUsers();
        const currentStudent = allUsers.find(u => u.id === userId || u.uid === userId);
        await supabase.from('users').upsert([{
          id: userId,
          uid: currentStudent?.uid || userId,
          email: currentStudent?.email || `${userId}@campus.eatm.ac.in`,
          displayName: currentStudent?.displayName || 'Campus Member',
          role: currentStudent?.role || 'student',
          department: currentStudent?.department || 'CSE',
          status: 'active',
          verified: true
        }]);
      } catch (userErr) {
        console.warn('User profile pre-sync note on join:', userErr);
      }

      const { data: comm } = await supabase.from('communities').select('*').eq('id', communityId).maybeSingle();
      if (!comm) return { status: 'already_member', count: 0 };

      const { data: existing } = await supabase.from('community_members')
        .select('*')
        .eq('communityId', communityId)
        .eq('userId', userId)
        .maybeSingle();

      if (existing) {
        if (existing.status === 'banned') return { status: 'banned', count: comm.memberCount || 1 };
        if (existing.status === 'approved') return { status: 'already_member', count: comm.memberCount || 1 };
        if (existing.status === 'pending') return { status: 'requested', count: comm.memberCount || 1 };
      }

      const isPrivate = comm.type === 'private';
      const targetStatus = isPrivate ? 'pending' : 'approved';

      const memberRow = {
        id: existing?.id || ('cm_' + communityId + '_' + userId),
        communityId,
        userId,
        role: 'member',
        status: targetStatus,
        requestedAt: isPrivate ? new Date().toISOString() : null,
        joinedAt: !isPrivate ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString()
      };

      const { error: upsertError } = await supabase.from('community_members').upsert([memberRow]);
      if (upsertError) {
        console.error('❌ Supabase joinCommunity member upsert error:', upsertError);
        throw new Error(upsertError.message || 'Failed to register community membership.');
      }

      // Fetch accurate state from community_members (Single Source of Truth)
      const { data: allMembers } = await supabase
        .from('community_members')
        .select('userId, role, status')
        .eq('communityId', communityId);

      const approvedList = (allMembers || []).filter((m: any) => m.status === 'approved');
      const pendingList = (allMembers || []).filter((m: any) => m.status === 'pending').map((m: any) => m.userId);
      const approvedIds = approvedList.map((m: any) => m.userId);
      const newCount = approvedIds.length;

      try {
        if (isPrivate) {
          await supabase.from('communities').update({
            pendingRequests: pendingList
          }).eq('id', communityId);
        } else {
          await supabase.from('communities').update({
            memberCount: newCount,
            members: approvedIds
          }).eq('id', communityId);
        }
      } catch (commUpdErr) {
        console.warn('Community table count sync notice:', commUpdErr);
      }

      if (isPrivate) {
        // Notify community owner & admins
        const adminIds = approvedList.filter((m: any) => m.role === 'owner' || m.role === 'admin').map((m: any) => m.userId);
        const targets = Array.from(new Set([comm.ownerId, ...adminIds])).filter(Boolean);
        for (const adminId of targets) {
          if (adminId !== userId) {
            await createNotification({
              recipientId: adminId,
              type: 'connection_request',
              title: 'New Community Join Request',
              message: `A student requested to join "${comm.name}".`,
              link: `/student/communities/${communityId}`
            });
          }
        }
      }

      const updatedComm = await fetchCommunityById(communityId);
      if (updatedComm) {
        const list = getLocalData<Community[]>('communities', []);
        setLocalData('communities', [updatedComm, ...list.filter(c => c.id !== communityId)]);
        window.dispatchEvent(new CustomEvent('eatm_communities_changed', { detail: [updatedComm, ...list] }));
      }

      return { 
        status: isPrivate ? 'requested' : 'joined', 
        count: isPrivate ? (comm.memberCount || 1) : newCount, 
        community: updatedComm || undefined 
      };
    } catch (err: any) {
      console.warn('Supabase joinCommunity error:', err);
      if (err.message && !err.message.includes('network')) {
        throw err;
      }
    }
  }

  // Local fallback
  const list = getLocalData<Community[]>('communities', SEED_COMMUNITIES);
  const community = list.find(c => c.id === communityId);
  if (!community) return { status: 'already_member', count: 0 };

  if (community.bannedUsers?.includes(userId)) {
    return { status: 'banned', count: community.memberCount, community };
  }
  if (community.members.includes(userId)) {
    return { status: 'already_member', count: community.memberCount, community };
  }

  if (community.type === 'private') {
    community.pendingRequests = community.pendingRequests || [];
    if (!community.pendingRequests.includes(userId)) {
      community.pendingRequests.push(userId);
    }
    setLocalData('communities', [...list]);
    window.dispatchEvent(new CustomEvent('eatm_communities_changed', { detail: list }));
    return { status: 'requested', count: community.memberCount, community };
  }

  community.members.push(userId);
  community.memberCount = (community.memberCount || 0) + 1;
  setLocalData('communities', [...list]);
  window.dispatchEvent(new CustomEvent('eatm_communities_changed', { detail: list }));
  return { status: 'joined', count: community.memberCount, community };
}

export async function leaveCommunity(
  communityId: string, 
  userId: string
): Promise<{ success: boolean; isOwnerMustTransfer?: boolean; count: number }> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: comm } = await supabase.from('communities').select('*').eq('id', communityId).maybeSingle();
      const { data: existing } = await supabase.from('community_members')
        .select('*')
        .eq('communityId', communityId)
        .eq('userId', userId)
        .maybeSingle();

      // Guard: Owner cannot leave if there are other approved members without ownership transfer
      if (existing?.role === 'owner' || comm?.ownerId === userId) {
        const { count: memberTotal } = await supabase.from('community_members')
          .select('*', { count: 'exact', head: true })
          .eq('communityId', communityId)
          .eq('status', 'approved');

        if ((memberTotal || 0) > 1) {
          return { success: false, isOwnerMustTransfer: true, count: comm?.memberCount || 1 };
        }
      }

      await supabase.from('community_members')
        .delete()
        .eq('communityId', communityId)
        .eq('userId', userId);

      // Recount exact approved members from community_members
      const { data: allMembers } = await supabase
        .from('community_members')
        .select('userId, role, status')
        .eq('communityId', communityId);

      const approvedList = (allMembers || []).filter((m: any) => m.status === 'approved');
      const approvedIds = approvedList.map((m: any) => m.userId);
      const adminIds = approvedList.filter((m: any) => m.role === 'admin' || m.role === 'owner').map((m: any) => m.userId);
      const modIds = approvedList.filter((m: any) => m.role === 'moderator').map((m: any) => m.userId);
      const newCount = approvedIds.length;

      try {
        await supabase.from('communities').update({
          memberCount: newCount,
          members: approvedIds,
          admins: adminIds,
          moderators: modIds
        }).eq('id', communityId);
      } catch (commUpdErr) {
        console.warn('Community leave sync note:', commUpdErr);
      }

      const updatedComm = await fetchCommunityById(communityId);
      if (updatedComm) {
        const list = getLocalData<Community[]>('communities', []);
        setLocalData('communities', [updatedComm, ...list.filter(c => c.id !== communityId)]);
        window.dispatchEvent(new CustomEvent('eatm_communities_changed', { detail: [updatedComm, ...list] }));
      }

      return { success: true, count: newCount };
    } catch (err: any) {
      console.warn('Supabase leaveCommunity error:', err);
      if (err.message && !err.message.includes('network')) {
        throw err;
      }
    }
  }

  const list = getLocalData<Community[]>('communities', SEED_COMMUNITIES);
  const community = list.find(c => c.id === communityId);
  if (!community) return { success: false, count: 0 };

  if (community.ownerId === userId && community.members.length > 1) {
    return { success: false, isOwnerMustTransfer: true, count: community.memberCount };
  }

  community.members = community.members.filter(id => id !== userId);
  community.admins = (community.admins || []).filter(id => id !== userId);
  community.moderators = (community.moderators || []).filter(id => id !== userId);
  community.memberCount = Math.max(0, (community.memberCount || 1) - 1);
  setLocalData('communities', [...list]);
  window.dispatchEvent(new CustomEvent('eatm_communities_changed', { detail: list }));

  return { success: true, count: community.memberCount };
}

export async function toggleJoinCommunity(communityId: string, userId: string): Promise<{ joined: boolean; count: number }> {
  const comm = await fetchCommunityById(communityId);
  if (!comm) return { joined: false, count: 0 };
  const isMember = comm.members.includes(userId);
  if (isMember) {
    const res = await leaveCommunity(communityId, userId);
    return { joined: false, count: res.count };
  } else {
    const res = await joinCommunity(communityId, userId);
    return { joined: res.status === 'joined', count: res.count };
  }
}

export async function handleCommunityJoinRequest(
  communityId: string,
  targetUserId: string,
  action: 'approve' | 'reject',
  adminId: string
): Promise<{ success: boolean; community?: Community }> {
  const currentComm = await fetchCommunityById(communityId);
  if (!currentComm) return { success: false };
  
  const allUsers = await fetchUsers();
  const caller = allUsers.find(u => u.id === adminId || u.uid === adminId);
  const isCampusAdmin = caller?.role === 'admin';
  const isAuthorized = isCampusAdmin || currentComm.ownerId === adminId || (currentComm.admins || []).includes(adminId);
  
  if (!isAuthorized) {
    console.warn('Unauthorized join request action attempt by:', adminId);
    return { success: false };
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: comm } = await supabase.from('communities').select('*').eq('id', communityId).maybeSingle();

      if (action === 'approve') {
        await supabase.from('community_members')
          .update({
            status: 'approved',
            joinedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
          .eq('communityId', communityId)
          .eq('userId', targetUserId);

        const { data: allMembers } = await supabase
          .from('community_members')
          .select('userId, status')
          .eq('communityId', communityId);

        const approvedIds = (allMembers || []).filter((m: any) => m.status === 'approved').map((m: any) => m.userId);
        const pendingIds = (allMembers || []).filter((m: any) => m.status === 'pending').map((m: any) => m.userId);
        const newCount = approvedIds.length;

        try {
          await supabase.from('communities').update({
            memberCount: newCount,
            members: approvedIds,
            pendingRequests: pendingIds
          }).eq('id', communityId);
        } catch (commUpdErr) {
          console.warn('Community pendingRequests sync note:', commUpdErr);
        }

        await createNotification({
          recipientId: targetUserId,
          type: 'connection_accepted',
          title: 'Community Request Approved',
          message: `Your request to join "${comm?.name || 'the community'}" was approved! Welcome aboard.`,
          link: `/student/communities/${communityId}`
        });
      } else {
        await supabase.from('community_members')
          .delete()
          .eq('communityId', communityId)
          .eq('userId', targetUserId);

        const { data: allMembers } = await supabase
          .from('community_members')
          .select('userId, status')
          .eq('communityId', communityId);

        const pendingIds = (allMembers || []).filter((m: any) => m.status === 'pending').map((m: any) => m.userId);
        try {
          await supabase.from('communities').update({
            pendingRequests: pendingIds
          }).eq('id', communityId);
        } catch (commUpdErr) {
          console.warn('Community pendingRequests sync note:', commUpdErr);
        }

        await createNotification({
          recipientId: targetUserId,
          type: 'system',
          title: 'Community Request Declined',
          message: `Your request to join "${comm?.name || 'the community'}" was declined.`,
          link: `/student/communities`
        });
      }

      const updatedComm = await fetchCommunityById(communityId);
      if (updatedComm) {
        const list = getLocalData<Community[]>('communities', []);
        setLocalData('communities', [updatedComm, ...list.filter(c => c.id !== communityId)]);
        window.dispatchEvent(new CustomEvent('eatm_communities_changed', { detail: [updatedComm, ...list] }));
      }
      return { success: true, community: updatedComm || undefined };
    } catch (err) {
      console.warn('Supabase handleCommunityJoinRequest error:', err);
    }
  }

  // Local fallback
  const list = getLocalData<Community[]>('communities', SEED_COMMUNITIES);
  const community = list.find(c => c.id === communityId);
  if (!community) return { success: false };

  community.pendingRequests = (community.pendingRequests || []).filter(id => id !== targetUserId);

  if (action === 'approve') {
    if (!community.members.includes(targetUserId)) {
      community.members.push(targetUserId);
      community.memberCount = (community.memberCount || 0) + 1;
    }
  }
  setLocalData('communities', [...list]);
  window.dispatchEvent(new CustomEvent('eatm_communities_changed', { detail: list }));
  return { success: true, community };
}

export async function updateCommunityMemberRole(
  communityId: string,
  targetUserId: string,
  newRole: CommunityRole,
  adminId: string
): Promise<{ success: boolean; community?: Community }> {
  const currentComm = await fetchCommunityById(communityId);
  if (!currentComm) return { success: false };
  if (newRole === 'owner' && currentComm.ownerId !== adminId) {
    console.warn('Unauthorized ownership transfer attempt by non-owner:', adminId);
    return { success: false };
  }
  const isAuthorized = currentComm.ownerId === adminId || (currentComm.admins || []).includes(adminId);
  if (!isAuthorized) {
    console.warn('Unauthorized role change attempt by:', adminId);
    return { success: false };
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      if (newRole === 'owner') {
        const { data: comm } = await supabase.from('communities').select('ownerId').eq('id', communityId).maybeSingle();
        if (comm?.ownerId) {
          await supabase.from('community_members')
            .update({ role: 'admin', updatedAt: new Date().toISOString() })
            .eq('communityId', communityId)
            .eq('userId', comm.ownerId);
        }
        await supabase.from('community_members')
          .update({ role: 'owner', updatedAt: new Date().toISOString() })
          .eq('communityId', communityId)
          .eq('userId', targetUserId);

        await supabase.from('communities').update({ ownerId: targetUserId }).eq('id', communityId);
      } else {
        await supabase.from('community_members')
          .update({ role: newRole, updatedAt: new Date().toISOString() })
          .eq('communityId', communityId)
          .eq('userId', targetUserId);
      }

      // Sync admins and moderators from community_members
      const { data: allMembers } = await supabase
        .from('community_members')
        .select('userId, role, status')
        .eq('communityId', communityId)
        .eq('status', 'approved');

      const adminIds = (allMembers || []).filter((m: any) => m.role === 'admin' || m.role === 'owner').map((m: any) => m.userId);
      const modIds = (allMembers || []).filter((m: any) => m.role === 'moderator').map((m: any) => m.userId);

      await supabase.from('communities').update({
        admins: adminIds,
        moderators: modIds
      }).eq('id', communityId);

      await supabase.from('community_moderation_actions').insert([{
        id: 'cact_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        communityId,
        moderatorId: adminId,
        moderatorName: 'Society Leadership',
        targetUserId,
        actionType: 'role_change',
        reason: `Role updated to ${newRole}`,
        createdAt: new Date().toISOString()
      }]);

      const updatedComm = await fetchCommunityById(communityId);
      return { success: true, community: updatedComm || undefined };
    } catch (err) {
      console.warn('Supabase updateCommunityMemberRole error:', err);
    }
  }

  const list = getLocalData<Community[]>('communities', SEED_COMMUNITIES);
  const community = list.find(c => c.id === communityId);
  if (!community) return { success: false };

  community.admins = (community.admins || []).filter(id => id !== targetUserId);
  community.moderators = (community.moderators || []).filter(id => id !== targetUserId);

  if (newRole === 'owner') {
    community.ownerId = targetUserId;
    if (!community.admins.includes(targetUserId)) community.admins.push(targetUserId);
  } else if (newRole === 'admin') {
    community.admins.push(targetUserId);
  } else if (newRole === 'moderator') {
    community.moderators.push(targetUserId);
  }

  setLocalData('communities', [...list]);
  return { success: true, community };
}

export async function removeCommunityMember(
  communityId: string,
  targetUserId: string,
  adminId: string
): Promise<{ success: boolean; community?: Community }> {
  const currentComm = await fetchCommunityById(communityId);
  if (!currentComm) return { success: false };
  if (targetUserId === currentComm.ownerId) {
    console.warn('Cannot remove the community owner');
    return { success: false };
  }
  const isAuthorized = currentComm.ownerId === adminId || (currentComm.admins || []).includes(adminId);
  if (!isAuthorized) {
    console.warn('Unauthorized member removal attempt by:', adminId);
    return { success: false };
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('community_members')
        .delete()
        .eq('communityId', communityId)
        .eq('userId', targetUserId);

      const { data: allMembers } = await supabase
        .from('community_members')
        .select('userId, role, status')
        .eq('communityId', communityId);

      const approvedList = (allMembers || []).filter((m: any) => m.status === 'approved');
      const approvedIds = approvedList.map((m: any) => m.userId);
      const adminIds = approvedList.filter((m: any) => m.role === 'admin' || m.role === 'owner').map((m: any) => m.userId);
      const modIds = approvedList.filter((m: any) => m.role === 'moderator').map((m: any) => m.userId);
      const newCount = approvedIds.length;

      await supabase.from('communities').update({
        memberCount: newCount,
        members: approvedIds,
        admins: adminIds,
        moderators: modIds
      }).eq('id', communityId);

      await supabase.from('community_moderation_actions').insert([{
        id: 'cact_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        communityId,
        moderatorId: adminId,
        moderatorName: 'Society Leadership',
        targetUserId,
        actionType: 'remove_member',
        reason: 'Removed from community roster',
        createdAt: new Date().toISOString()
      }]);

      const updatedComm = await fetchCommunityById(communityId);
      return { success: true, community: updatedComm || undefined };
    } catch (err) {
      console.warn('Supabase removeCommunityMember error:', err);
    }
  }

  const list = getLocalData<Community[]>('communities', SEED_COMMUNITIES);
  const community = list.find(c => c.id === communityId);
  if (!community) return { success: false };

  community.members = community.members.filter(id => id !== targetUserId);
  community.admins = (community.admins || []).filter(id => id !== targetUserId);
  community.moderators = (community.moderators || []).filter(id => id !== targetUserId);
  community.memberCount = Math.max(0, (community.memberCount || 1) - 1);

  setLocalData('communities', [...list]);
  return { success: true, community };
}

export async function banCommunityMember(
  communityId: string,
  targetUserId: string,
  reason: string,
  adminId: string
): Promise<{ success: boolean; community?: Community }> {
  const currentComm = await fetchCommunityById(communityId);
  if (!currentComm) return { success: false };
  if (targetUserId === currentComm.ownerId) {
    console.warn('Cannot ban the community owner');
    return { success: false };
  }
  const isAuthorized = currentComm.ownerId === adminId || (currentComm.admins || []).includes(adminId);
  if (!isAuthorized) {
    console.warn('Unauthorized member ban attempt by:', adminId);
    return { success: false };
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('community_members').upsert([{
        id: 'cm_' + communityId + '_' + targetUserId,
        communityId,
        userId: targetUserId,
        role: 'member',
        status: 'banned',
        updatedAt: new Date().toISOString()
      }]);

      const { data: allMembers } = await supabase
        .from('community_members')
        .select('userId, role, status')
        .eq('communityId', communityId);

      const approvedList = (allMembers || []).filter((m: any) => m.status === 'approved');
      const bannedList = (allMembers || []).filter((m: any) => m.status === 'banned').map((m: any) => m.userId);
      const approvedIds = approvedList.map((m: any) => m.userId);
      const adminIds = approvedList.filter((m: any) => m.role === 'admin' || m.role === 'owner').map((m: any) => m.userId);
      const modIds = approvedList.filter((m: any) => m.role === 'moderator').map((m: any) => m.userId);
      const newCount = approvedIds.length;

      await supabase.from('communities').update({
        memberCount: newCount,
        members: approvedIds,
        admins: adminIds,
        moderators: modIds,
        bannedUsers: bannedList
      }).eq('id', communityId);

      await supabase.from('community_moderation_actions').insert([{
        id: 'cact_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        communityId,
        moderatorId: adminId,
        moderatorName: 'Society Leadership',
        targetUserId,
        actionType: 'ban_member',
        reason: reason || 'Violation of society guidelines',
        createdAt: new Date().toISOString()
      }]);

      const updatedComm = await fetchCommunityById(communityId);
      return { success: true, community: updatedComm || undefined };
    } catch (err) {
      console.warn('Supabase banCommunityMember error:', err);
    }
  }

  const list = getLocalData<Community[]>('communities', SEED_COMMUNITIES);
  const community = list.find(c => c.id === communityId);
  if (!community) return { success: false };

  community.members = community.members.filter(id => id !== targetUserId);
  community.admins = (community.admins || []).filter(id => id !== targetUserId);
  community.moderators = (community.moderators || []).filter(id => id !== targetUserId);
  community.memberCount = Math.max(0, (community.memberCount || 1) - 1);
  community.bannedUsers = community.bannedUsers || [];
  if (!community.bannedUsers.includes(targetUserId)) {
    community.bannedUsers.push(targetUserId);
  }

  setLocalData('communities', [...list]);
  return { success: true, community };
}

export async function unbanCommunityMember(
  communityId: string,
  targetUserId: string,
  adminId: string
): Promise<{ success: boolean; community?: Community }> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('community_members')
        .delete()
        .eq('communityId', communityId)
        .eq('userId', targetUserId)
        .eq('status', 'banned');

      const { data: allMembers } = await supabase
        .from('community_members')
        .select('userId, status')
        .eq('communityId', communityId);

      const bannedList = (allMembers || []).filter((m: any) => m.status === 'banned').map((m: any) => m.userId);

      await supabase.from('communities').update({
        bannedUsers: bannedList
      }).eq('id', communityId);

      await supabase.from('community_moderation_actions').insert([{
        id: 'cact_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        communityId,
        moderatorId: adminId,
        moderatorName: 'Society Leadership',
        targetUserId,
        actionType: 'unban_member',
        reason: 'Restored society access',
        createdAt: new Date().toISOString()
      }]);

      const updatedComm = await fetchCommunityById(communityId);
      return { success: true, community: updatedComm || undefined };
    } catch (err) {
      console.warn('Supabase unbanCommunityMember error:', err);
    }
  }

  const list = getLocalData<Community[]>('communities', SEED_COMMUNITIES);
  const community = list.find(c => c.id === communityId);
  if (!community) return { success: false };

  community.bannedUsers = (community.bannedUsers || []).filter(id => id !== targetUserId);
  setLocalData('communities', [...list]);
  return { success: true, community };
}

export async function transferCommunityOwnership(
  communityId: string,
  newOwnerId: string,
  currentOwnerId: string
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: comm } = await supabase.from('communities').select('*').eq('id', communityId).maybeSingle();
      if (!comm) return { success: false, error: 'Community not found' };
      if (comm.ownerId !== currentOwnerId) return { success: false, error: 'Only the current owner can transfer ownership' };

      await supabase.from('community_members')
        .update({ role: 'admin', updatedAt: new Date().toISOString() })
        .eq('communityId', communityId)
        .eq('userId', currentOwnerId);

      await supabase.from('community_members')
        .upsert([{
          id: 'cm_' + communityId + '_' + newOwnerId,
          communityId,
          userId: newOwnerId,
          role: 'owner',
          status: 'approved',
          updatedAt: new Date().toISOString()
        }]);

      const { data: allMembers } = await supabase
        .from('community_members')
        .select('userId, role, status')
        .eq('communityId', communityId)
        .eq('status', 'approved');

      const approvedIds = (allMembers || []).map((m: any) => m.userId);
      const adminIds = (allMembers || []).filter((m: any) => m.role === 'admin' || m.role === 'owner').map((m: any) => m.userId);

      await supabase.from('communities').update({
        ownerId: newOwnerId,
        admins: adminIds,
        members: approvedIds
      }).eq('id', communityId);

      await supabase.from('community_moderation_actions').insert([{
        id: 'cact_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        communityId,
        moderatorId: currentOwnerId,
        moderatorName: 'Founding Owner',
        targetUserId: newOwnerId,
        actionType: 'role_change',
        reason: 'Transferred society ownership',
        createdAt: new Date().toISOString()
      }]);

      return { success: true };
    } catch (err) {
      console.warn('Supabase transferCommunityOwnership error:', err);
    }
  }

  const list = getLocalData<Community[]>('communities', SEED_COMMUNITIES);
  const community = list.find(c => c.id === communityId);
  if (!community) return { success: false, error: 'Community not found' };
  if (community.ownerId !== currentOwnerId) return { success: false, error: 'Only the current owner can transfer ownership' };

  community.ownerId = newOwnerId;
  if (!community.admins.includes(newOwnerId)) community.admins.push(newOwnerId);
  if (!community.members.includes(newOwnerId)) community.members.push(newOwnerId);

  setLocalData('communities', [...list]);
  return { success: true };
}

export async function updateCommunity(
  communityId: string,
  data: Partial<Community>,
  adminId: string
): Promise<{ success: boolean; community?: Community }> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const payload: any = { ...data, updatedAt: new Date().toISOString() };
      if (data.logoUrl) {
        payload.logo = data.logoUrl;
        payload.logoUrl = data.logoUrl;
      }
      if (data.coverUrl) {
        payload.cover = data.coverUrl;
        payload.coverUrl = data.coverUrl;
      }

      await supabase.from('communities').update(payload).eq('id', communityId);
      const updated = await fetchCommunityById(communityId);
      return { success: true, community: updated || undefined };
    } catch (err) {
      console.warn('Supabase updateCommunity error:', err);
    }
  }

  const list = getLocalData<Community[]>('communities', SEED_COMMUNITIES);
  const index = list.findIndex(c => c.id === communityId);
  if (index === -1) return { success: false };

  const updated: Community = {
    ...list[index],
    ...data,
    updatedAt: new Date().toISOString()
  };
  list[index] = updated;
  setLocalData('communities', [...list]);
  return { success: true, community: updated };
}

export async function deleteCommunity(
  communityId: string,
  ownerId: string
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: comm } = await supabase.from('communities').select('ownerId').eq('id', communityId).maybeSingle();
      if (!comm) return { success: false, error: 'Community not found' };
      if (comm.ownerId !== ownerId) return { success: false, error: 'Unauthorized. Only owner can delete the community.' };

      await supabase.from('communities').delete().eq('id', communityId);
      const list = getLocalData<Community[]>('communities', SEED_COMMUNITIES).filter(c => c.id !== communityId);
      setLocalData('communities', list);
      return { success: true };
    } catch (err) {
      console.warn('Supabase deleteCommunity error:', err);
    }
  }

  const list = getLocalData<Community[]>('communities', SEED_COMMUNITIES);
  const community = list.find(c => c.id === communityId);
  if (!community) return { success: false, error: 'Community not found' };
  if (community.ownerId !== ownerId) return { success: false, error: 'Unauthorized. Only owner can delete.' };

  const updated = list.filter(c => c.id !== communityId);
  setLocalData('communities', updated);
  return { success: true };
}

/**
 * Helper to check if a user is authorized to access private community content
 */
export async function canUserAccessCommunityContent(communityId: string, userId?: string): Promise<boolean> {
  const comm = await fetchCommunityById(communityId);
  if (!comm) return false;
  if (!userId) return comm.type === 'public';
  if (Array.isArray(comm.bannedUsers) && comm.bannedUsers.includes(userId)) return false;
  if (comm.type === 'public') return true;
  if (comm.ownerId === userId) return true;
  if (Array.isArray(comm.admins) && comm.admins.includes(userId)) return true;
  if (Array.isArray(comm.members) && comm.members.includes(userId)) return true;
  return false;
}

/**
 * Single source of truth roster fetching from community_members table
 */
export async function fetchCommunityMembers(communityId: string, currentUserId?: string): Promise<CommunityMember[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const comm = await fetchCommunityById(communityId);
      const isPriv = comm?.type === 'private';
      const isApprovedMember = currentUserId && comm ? comm.members.includes(currentUserId) : false;

      if (isPriv && !isApprovedMember) {
        // Non-members of private community only see the verified owner/admins
        const { data, error } = await supabase
          .from('community_members')
          .select('*')
          .eq('communityId', communityId)
          .in('role', ['owner', 'admin'])
          .eq('status', 'approved');

        if (!error && data) return data as CommunityMember[];
        return [];
      }

      const { data, error } = await supabase
        .from('community_members')
        .select('*')
        .eq('communityId', communityId);

      if (!error && data && data.length > 0) {
        return data as CommunityMember[];
      }
    } catch (err) {
      console.warn('Supabase fetchCommunityMembers error:', err);
    }
  }

  const comm = await fetchCommunityById(communityId);
  if (!comm) return [];
  if (comm.type === 'private' && currentUserId && !comm.members.includes(currentUserId)) {
    return [];
  }
  const members: CommunityMember[] = [];
  (comm.members || []).forEach(userId => {
    const isOwner = comm.ownerId === userId;
    const isAdmin = (comm.admins || []).includes(userId);
    const isMod = (comm.moderators || []).includes(userId);
    members.push({
      id: `cm_${comm.id}_${userId}`,
      communityId: comm.id,
      userId,
      role: isOwner ? 'owner' : (isAdmin ? 'admin' : (isMod ? 'moderator' : 'member')),
      status: 'approved',
      joinedAt: comm.createdAt
    });
  });
  return members;
}

// ---------------------------------------------
// COMMUNITY POSTS & COMMENTS (Supabase-first)
// ---------------------------------------------
export async function fetchCommunityPosts(communityId: string, currentUserId?: string): Promise<CommunityPost[]> {
  if (currentUserId !== undefined && !(await canUserAccessCommunityContent(communityId, currentUserId))) {
    return [];
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .eq('communityId', communityId)
        .order('createdAt', { ascending: false });

      if (!error && data && data.length > 0) {
        const sorted = data.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setLocalData(`comm_posts_${communityId}`, sorted);
        return sorted;
      }
    } catch (err) {
      console.warn('Supabase fetchCommunityPosts error:', err);
    }
  }

  const all = getLocalData<CommunityPost[]>('community_posts', SEED_COMMUNITY_POSTS);
  return all.filter(p => p.communityId === communityId).sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export async function createCommunityPost(post: Omit<CommunityPost, 'id' | 'likes' | 'likesCount' | 'commentsCount' | 'createdAt'>): Promise<CommunityPost> {
  if (post.authorId && !(await canUserAccessCommunityContent(post.communityId, post.authorId))) {
    throw new Error('Access denied: You must be an active, approved member to publish posts.');
  }

  const newPost: CommunityPost = {
    ...post,
    id: 'cpost_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    likes: [],
    likesCount: 0,
    commentsCount: 0,
    createdAt: new Date().toISOString()
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('community_posts').insert([newPost]);
    } catch (err) {
      console.warn('Supabase createCommunityPost error:', err);
    }
  }

  const all = getLocalData<CommunityPost[]>('community_posts', SEED_COMMUNITY_POSTS);
  setLocalData('community_posts', [newPost, ...all]);
  return newPost;
}

export async function toggleCommunityPostLike(postId: string, userId: string): Promise<{ liked: boolean; count: number }> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: post } = await supabase.from('community_posts').select('*').eq('id', postId).maybeSingle();
      if (post) {
        let likes: string[] = Array.isArray(post.likes) ? post.likes : [];
        const isLiked = likes.includes(userId);
        if (isLiked) {
          likes = likes.filter(id => id !== userId);
        } else {
          likes.push(userId);
        }
        const likesCount = likes.length;

        await supabase.from('community_posts').update({
          likes,
          likesCount
        }).eq('id', postId);

        return { liked: !isLiked, count: likesCount };
      }
    } catch (err) {
      console.warn('Supabase toggleCommunityPostLike error:', err);
    }
  }

  const all = getLocalData<CommunityPost[]>('community_posts', SEED_COMMUNITY_POSTS);
  const post = all.find(p => p.id === postId);
  if (!post) return { liked: false, count: 0 };

  const isLiked = post.likes.includes(userId);
  if (isLiked) {
    post.likes = post.likes.filter(id => id !== userId);
    post.likesCount = Math.max(0, post.likesCount - 1);
  } else {
    post.likes.push(userId);
    post.likesCount += 1;
  }
  setLocalData('community_posts', [...all]);
  return { liked: !isLiked, count: post.likesCount };
}

export async function deleteCommunityPost(postId: string, userId: string): Promise<boolean> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('community_posts').delete().eq('id', postId);
    } catch (err) {
      console.warn('Supabase deleteCommunityPost error:', err);
    }
  }

  const all = getLocalData<CommunityPost[]>('community_posts', SEED_COMMUNITY_POSTS);
  const updated = all.filter(p => p.id !== postId);
  setLocalData('community_posts', updated);
  return true;
}

export async function fetchCommunityComments(postId: string): Promise<CommunityComment[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('community_comments')
        .select('*')
        .eq('postId', postId)
        .order('createdAt', { ascending: true });

      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase fetchCommunityComments error:', err);
    }
  }

  const all = getLocalData<CommunityComment[]>('community_comments', SEED_COMMUNITY_COMMENTS);
  return all.filter(c => c.postId === postId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function createCommunityComment(comment: Omit<CommunityComment, 'id' | 'createdAt'>): Promise<CommunityComment> {
  if (comment.authorId && !(await canUserAccessCommunityContent(comment.communityId, comment.authorId))) {
    throw new Error('Access denied: You must be an active, approved member to comment.');
  }

  const newComment: CommunityComment = {
    ...comment,
    id: 'ccmt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    createdAt: new Date().toISOString()
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('community_comments').insert([newComment]);
      // Increment comment count on post
      const { data: post } = await supabase.from('community_posts').select('commentsCount').eq('id', comment.postId).maybeSingle();
      const currentCount = post?.commentsCount || 0;
      await supabase.from('community_posts').update({ commentsCount: currentCount + 1 }).eq('id', comment.postId);
    } catch (err) {
      console.warn('Supabase createCommunityComment error:', err);
    }
  }

  const all = getLocalData<CommunityComment[]>('community_comments', SEED_COMMUNITY_COMMENTS);
  setLocalData('community_comments', [...all, newComment]);

  const posts = getLocalData<CommunityPost[]>('community_posts', SEED_COMMUNITY_POSTS);
  const post = posts.find(p => p.id === comment.postId);
  if (post) {
    post.commentsCount = (post.commentsCount || 0) + 1;
    setLocalData('community_posts', [...posts]);
  }

  return newComment;
}

// ---------------------------------------------
// COMMUNITY DISCUSSIONS & THREADS (Supabase-first)
// ---------------------------------------------
export async function fetchCommunityDiscussions(communityId: string, currentUserId?: string): Promise<CommunityDiscussion[]> {
  if (currentUserId !== undefined && !(await canUserAccessCommunityContent(communityId, currentUserId))) {
    return [];
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('community_discussions')
        .select('*')
        .eq('communityId', communityId)
        .order('createdAt', { ascending: false });

      if (!error && data && data.length > 0) {
        const sorted = data.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setLocalData(`comm_discs_${communityId}`, sorted);
        return sorted;
      }
    } catch (err) {
      console.warn('Supabase fetchCommunityDiscussions error:', err);
    }
  }

  const all = getLocalData<CommunityDiscussion[]>('community_discussions', SEED_COMMUNITY_DISCUSSIONS);
  return all.filter(d => d.communityId === communityId).sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export async function createCommunityDiscussion(disc: Omit<CommunityDiscussion, 'id' | 'likes' | 'likesCount' | 'commentsCount' | 'createdAt'>): Promise<CommunityDiscussion> {
  if (disc.authorId && !(await canUserAccessCommunityContent(disc.communityId, disc.authorId))) {
    throw new Error('Access denied: You must be an active, approved member to start discussions.');
  }

  const newDisc: CommunityDiscussion = {
    ...disc,
    id: 'cdisc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    likes: [],
    likesCount: 0,
    commentsCount: 0,
    createdAt: new Date().toISOString()
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('community_discussions').insert([newDisc]);
    } catch (err) {
      console.warn('Supabase createCommunityDiscussion error:', err);
    }
  }

  const all = getLocalData<CommunityDiscussion[]>('community_discussions', SEED_COMMUNITY_DISCUSSIONS);
  setLocalData('community_discussions', [newDisc, ...all]);
  return newDisc;
}

export async function toggleCommunityDiscussionLike(discId: string, userId: string): Promise<{ liked: boolean; count: number }> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: disc } = await supabase.from('community_discussions').select('*').eq('id', discId).maybeSingle();
      if (disc) {
        let likes: string[] = Array.isArray(disc.likes) ? disc.likes : [];
        const isLiked = likes.includes(userId);
        if (isLiked) {
          likes = likes.filter(id => id !== userId);
        } else {
          likes.push(userId);
        }
        const likesCount = likes.length;

        await supabase.from('community_discussions').update({
          likes,
          likesCount
        }).eq('id', discId);

        return { liked: !isLiked, count: likesCount };
      }
    } catch (err) {
      console.warn('Supabase toggleCommunityDiscussionLike error:', err);
    }
  }

  const all = getLocalData<CommunityDiscussion[]>('community_discussions', SEED_COMMUNITY_DISCUSSIONS);
  const disc = all.find(d => d.id === discId);
  if (!disc) return { liked: false, count: 0 };

  const isLiked = disc.likes.includes(userId);
  if (isLiked) {
    disc.likes = disc.likes.filter(id => id !== userId);
    disc.likesCount = Math.max(0, disc.likesCount - 1);
  } else {
    disc.likes.push(userId);
    disc.likesCount += 1;
  }
  setLocalData('community_discussions', [...all]);
  return { liked: !isLiked, count: disc.likesCount };
}

export async function fetchCommunityDiscussionComments(discId: string): Promise<CommunityDiscussionComment[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('community_discussion_comments')
        .select('*')
        .eq('discussionId', discId)
        .order('createdAt', { ascending: true });

      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase fetchCommunityDiscussionComments error:', err);
    }
  }

  const all = getLocalData<CommunityDiscussionComment[]>('community_disc_comments', SEED_COMMUNITY_DISCUSSION_COMMENTS);
  return all.filter(c => c.discussionId === discId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function createCommunityDiscussionComment(comment: Omit<CommunityDiscussionComment, 'id' | 'createdAt'>): Promise<CommunityDiscussionComment> {
  if (comment.authorId && !(await canUserAccessCommunityContent(comment.communityId, comment.authorId))) {
    throw new Error('Access denied: You must be an active, approved member to reply to discussions.');
  }

  const newCmt: CommunityDiscussionComment = {
    ...comment,
    id: 'cdcmt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    createdAt: new Date().toISOString()
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('community_discussion_comments').insert([newCmt]);
      const { data: disc } = await supabase.from('community_discussions').select('commentsCount').eq('id', comment.discussionId).maybeSingle();
      const currentCount = disc?.commentsCount || 0;
      await supabase.from('community_discussions').update({ commentsCount: currentCount + 1 }).eq('id', comment.discussionId);
    } catch (err) {
      console.warn('Supabase createCommunityDiscussionComment error:', err);
    }
  }

  const all = getLocalData<CommunityDiscussionComment[]>('community_disc_comments', SEED_COMMUNITY_DISCUSSION_COMMENTS);
  setLocalData('community_disc_comments', [...all, newCmt]);

  const discs = getLocalData<CommunityDiscussion[]>('community_discussions', SEED_COMMUNITY_DISCUSSIONS);
  const disc = discs.find(d => d.id === comment.discussionId);
  if (disc) {
    disc.commentsCount = (disc.commentsCount || 0) + 1;
    setLocalData('community_discussions', [...discs]);
  }

  return newCmt;
}

// ---------------------------------------------
// COMMUNITY LIVE REALTIME CHAT (Supabase Realtime & WebSocket Broadcast)
// ---------------------------------------------
export async function fetchCommunityMessages(communityId: string, currentUserId?: string): Promise<CommunityMessage[]> {
  if (currentUserId !== undefined && !(await canUserAccessCommunityContent(communityId, currentUserId))) {
    return [];
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('community_messages')
        .select('*')
        .eq('communityId', communityId)
        .order('createdAt', { ascending: true });

      if (!error && data && data.length > 0) {
        setLocalData(`comm_msgs_${communityId}`, data);
        return data;
      }
    } catch (err) {
      console.warn('Supabase fetchCommunityMessages error:', err);
    }
  }

  const all = getLocalData<CommunityMessage[]>('community_messages', SEED_COMMUNITY_MESSAGES);
  return all.filter(m => m.communityId === communityId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function sendCommunityMessage(msg: Omit<CommunityMessage, 'id' | 'createdAt'>): Promise<CommunityMessage> {
  if (msg.senderId && !(await canUserAccessCommunityContent(msg.communityId, msg.senderId))) {
    throw new Error('Access denied: You must be an active, approved member to participate in live chat.');
  }

  const newMsg: CommunityMessage = {
    ...msg,
    id: 'cmsg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    createdAt: new Date().toISOString()
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('community_messages').insert([newMsg]);
      
      // Broadcast over live Supabase Realtime WebSocket channel for cross-browser sync
      const channel = supabase.channel(`community_chat_${msg.communityId}`);
      channel.send({
        type: 'broadcast',
        event: 'community_chat_message',
        payload: newMsg
      });
    } catch (err) {
      console.warn('Supabase sendCommunityMessage error:', err);
    }
  }

  // Local dispatch for instantaneous UI feedback
  window.dispatchEvent(new CustomEvent('eatm_community_chat_message', { detail: newMsg }));
  return newMsg;
}

export function subscribeToCommunityMessages(
  communityId: string, 
  onMessage: (msg: CommunityMessage) => void
): () => void {
  let channel: any = null;

  if (isSupabaseConfigured() && supabase) {
    channel = supabase.channel(`community_chat_${communityId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'community_messages',
        filter: `communityId=eq.${communityId}`
      }, (payload) => {
        if (payload.new) {
          onMessage(payload.new as CommunityMessage);
        }
      })
      .on('broadcast', { event: 'community_chat_message' }, ({ payload }) => {
        if (payload && payload.communityId === communityId) {
          onMessage(payload as CommunityMessage);
        }
      })
      .subscribe();
  }

  const localHandler = (e: CustomEvent<CommunityMessage>) => {
    if (e.detail && e.detail.communityId === communityId) {
      onMessage(e.detail);
    }
  };
  window.addEventListener('eatm_community_chat_message', localHandler as EventListener);

  return () => {
    if (channel && supabase) {
      supabase.removeChannel(channel);
    }
    window.removeEventListener('eatm_community_chat_message', localHandler as EventListener);
  };
}

// ---------------------------------------------
// COMMUNITY RESOURCES (Supabase-first)
// ---------------------------------------------
export async function fetchCommunityResources(communityId: string, currentUserId?: string): Promise<CommunityResource[]> {
  if (currentUserId !== undefined && !(await canUserAccessCommunityContent(communityId, currentUserId))) {
    return [];
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('community_resources')
        .select('*')
        .eq('communityId', communityId)
        .order('createdAt', { ascending: false });

      if (!error && data && data.length > 0) {
        setLocalData(`comm_res_${communityId}`, data);
        return data;
      }
    } catch (err) {
      console.warn('Supabase fetchCommunityResources error:', err);
    }
  }

  const all = getLocalData<CommunityResource[]>('community_resources', SEED_COMMUNITY_RESOURCES);
  return all.filter(r => r.communityId === communityId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function uploadCommunityResource(resource: Omit<CommunityResource, 'id' | 'downloads' | 'createdAt'>): Promise<CommunityResource> {
  const newRes: CommunityResource = {
    ...resource,
    id: 'cres_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    downloads: 0,
    createdAt: new Date().toISOString()
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('community_resources').insert([newRes]);
    } catch (err) {
      console.warn('Supabase uploadCommunityResource error:', err);
    }
  }

  const all = getLocalData<CommunityResource[]>('community_resources', SEED_COMMUNITY_RESOURCES);
  setLocalData('community_resources', [newRes, ...all]);
  return newRes;
}

export async function deleteCommunityResource(resourceId: string, userId: string): Promise<boolean> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('community_resources').delete().eq('id', resourceId);
    } catch (err) {
      console.warn('Supabase deleteCommunityResource error:', err);
    }
  }

  const all = getLocalData<CommunityResource[]>('community_resources', SEED_COMMUNITY_RESOURCES);
  const updated = all.filter(r => r.id !== resourceId);
  setLocalData('community_resources', updated);
  return true;
}

// ---------------------------------------------
// COMMUNITY EVENTS (Supabase-first)
// ---------------------------------------------
export async function fetchCommunityEvents(communityId: string, currentUserId?: string): Promise<CommunityEventItem[]> {
  if (currentUserId !== undefined && !(await canUserAccessCommunityContent(communityId, currentUserId))) {
    return [];
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('community_events')
        .select('*')
        .eq('communityId', communityId)
        .order('date', { ascending: true });

      if (!error && data && data.length > 0) {
        setLocalData(`comm_events_${communityId}`, data);
        return data;
      }
    } catch (err) {
      console.warn('Supabase fetchCommunityEvents error:', err);
    }
  }

  const all = getLocalData<CommunityEventItem[]>('community_events', SEED_COMMUNITY_EVENTS);
  return all.filter(e => e.communityId === communityId).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function createCommunityEvent(event: Omit<CommunityEventItem, 'id' | 'attendees' | 'createdAt'>, creatorId: string): Promise<CommunityEventItem> {
  const newEvent: CommunityEventItem = {
    ...event,
    id: 'cevent_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    creatorId: creatorId,
    attendeesCount: 1,
    attendees: [{ userId: creatorId, status: 'going' }],
    createdAt: new Date().toISOString()
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('community_events').insert([{
        id: newEvent.id,
        communityId: newEvent.communityId,
        title: newEvent.title,
        description: newEvent.description,
        date: newEvent.date,
        time: newEvent.time,
        location: newEvent.location,
        isOnline: newEvent.isOnline || false,
        meetingLink: newEvent.meetingLink || '',
        category: newEvent.category || 'Workshop',
        createdBy: creatorId,
        attendeesCount: 1,
        attendees: newEvent.attendees
      }]);
    } catch (err) {
      console.warn('Supabase createCommunityEvent error:', err);
    }
  }

  const all = getLocalData<CommunityEventItem[]>('community_events', SEED_COMMUNITY_EVENTS);
  setLocalData('community_events', [newEvent, ...all]);
  return newEvent;
}

export async function rsvpCommunityEvent(
  eventId: string, 
  userId: string, 
  status: 'going' | 'interested' | 'not_going'
): Promise<CommunityEventItem | null> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: event } = await supabase.from('community_events').select('*').eq('id', eventId).maybeSingle();
      if (event) {
        let attendees: { userId: string; status: 'going' | 'interested' }[] = Array.isArray(event.attendees) ? event.attendees : [];
        attendees = attendees.filter(a => a.userId !== userId);
        if (status !== 'not_going') {
          attendees.push({ userId, status });
        }
        const attendeesCount = attendees.length;

        await supabase.from('community_events').update({
          attendees,
          attendeesCount
        }).eq('id', eventId);

        // Also upsert relational RSVP table
        if (status !== 'not_going') {
          await supabase.from('community_event_rsvps').upsert([{
            id: `rsvp_${eventId}_${userId}`,
            eventId,
            communityId: event.communityId,
            userId,
            status,
            createdAt: new Date().toISOString()
          }]);
        } else {
          await supabase.from('community_event_rsvps').delete().eq('eventId', eventId).eq('userId', userId);
        }

        return {
          ...event,
          attendees,
          attendeesCount
        };
      }
    } catch (err) {
      console.warn('Supabase rsvpCommunityEvent error:', err);
    }
  }

  const all = getLocalData<CommunityEventItem[]>('community_events', SEED_COMMUNITY_EVENTS);
  const event = all.find(e => e.id === eventId);
  if (!event) return null;

  event.attendees = (event.attendees || []).filter(a => a.userId !== userId);
  if (status !== 'not_going') {
    event.attendees.push({ userId, status });
  }
  event.attendeesCount = event.attendees.length;
  setLocalData('community_events', [...all]);
  return event;
}

// ---------------------------------------------
// COMMUNITY POLLS (Supabase-first)
// ---------------------------------------------
export async function voteCommunityPoll(
  pollId: string, 
  optionId: string, 
  userId: string,
  communityId: string,
  postId?: string
): Promise<CommunityPost | null> {
  if (isSupabaseConfigured() && supabase) {
    try {
      let postQuery = supabase.from('community_posts').select('*');
      if (postId) {
        postQuery = postQuery.eq('id', postId);
      } else {
        postQuery = postQuery.eq('communityId', communityId);
      }
      const { data: posts } = await postQuery;
      const targetPost = posts?.find(p => p.id === postId || p.poll?.id === pollId);

      if (targetPost && targetPost.poll) {
        targetPost.poll.options.forEach((opt: any) => {
          opt.votes = (opt.votes || []).filter((id: string) => id !== userId);
        });
        const targetOpt = targetPost.poll.options.find((opt: any) => opt.id === optionId);
        if (targetOpt) {
          targetOpt.votes.push(userId);
        }

        await supabase.from('community_posts').update({
          poll: targetPost.poll
        }).eq('id', targetPost.id);

        // Record relational vote entry
        await supabase.from('community_poll_votes').upsert([{
          id: `vote_${pollId}_${userId}`,
          pollId,
          postId: targetPost.id,
          communityId,
          userId,
          optionId,
          createdAt: new Date().toISOString()
        }]);

        return targetPost;
      }
    } catch (err) {
      console.warn('Supabase voteCommunityPoll error:', err);
    }
  }

  const posts = getLocalData<CommunityPost[]>('community_posts', SEED_COMMUNITY_POSTS);
  const post = posts.find(p => p.id === postId || p.poll?.id === pollId);
  if (!post || !post.poll) return null;

  post.poll.options.forEach(opt => {
    opt.votes = (opt.votes || []).filter(id => id !== userId);
  });

  const targetOpt = post.poll.options.find(opt => opt.id === optionId);
  if (targetOpt) {
    targetOpt.votes.push(userId);
  }

  setLocalData('community_posts', [...posts]);
  return post;
}

// ---------------------------------------------
// COMMUNITY REPORTS & MODERATION (Supabase-first)
// ---------------------------------------------
export async function submitCommunityReport(report: Omit<CommunityReport, 'id' | 'status' | 'createdAt'>): Promise<CommunityReport> {
  const newReport: CommunityReport = {
    ...report,
    id: 'crep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('community_reports').insert([newReport]);
    } catch (err) {
      console.warn('Supabase submitCommunityReport error:', err);
    }
  }

  const all = getLocalData<CommunityReport[]>('community_reports', SEED_COMMUNITY_REPORTS);
  setLocalData('community_reports', [newReport, ...all]);
  return newReport;
}

export async function fetchCommunityReports(communityId: string): Promise<CommunityReport[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('community_reports')
        .select('*')
        .eq('communityId', communityId)
        .order('createdAt', { ascending: false });

      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase fetchCommunityReports error:', err);
    }
  }

  const all = getLocalData<CommunityReport[]>('community_reports', SEED_COMMUNITY_REPORTS);
  return all.filter(r => r.communityId === communityId);
}

export async function resolveCommunityReport(
  reportId: string,
  action: 'dismiss' | 'remove_content' | 'warn_user' | 'ban_user',
  moderatorId: string,
  moderatorName: string
): Promise<boolean> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const status = action === 'dismiss' ? 'dismissed' : 'resolved';
      const now = new Date().toISOString();

      const { data: report } = await supabase.from('community_reports').select('*').eq('id', reportId).maybeSingle();

      await supabase.from('community_reports').update({
        status,
        reviewedBy: moderatorName,
        reviewedAt: now,
        actionTaken: action
      }).eq('id', reportId);

      if (report) {
        await supabase.from('community_moderation_actions').insert([{
          id: 'cact_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          communityId: report.communityId,
          moderatorId,
          moderatorName,
          actionType: action === 'dismiss' ? 'warn' : (action as any),
          reason: `Handled report: ${report.reason} (${report.description || 'No notes'})`,
          createdAt: now
        }]);
      }

      return true;
    } catch (err) {
      console.warn('Supabase resolveCommunityReport error:', err);
    }
  }

  const all = getLocalData<CommunityReport[]>('community_reports', SEED_COMMUNITY_REPORTS);
  const report = all.find(r => r.id === reportId);
  if (!report) return false;

  report.status = action === 'dismiss' ? 'dismissed' : 'resolved';
  report.reviewedBy = moderatorName;
  report.reviewedAt = new Date().toISOString();
  report.actionTaken = action;

  setLocalData('community_reports', [...all]);

  const actions = getLocalData<CommunityModerationAction[]>('community_actions', SEED_COMMUNITY_ACTIONS);
  actions.push({
    id: 'cact_' + Date.now(),
    communityId: report.communityId,
    moderatorId,
    moderatorName,
    actionType: action === 'dismiss' ? 'warn' : (action as any),
    reason: `Handled report: ${report.reason} (${report.description || 'No notes'})`,
    createdAt: new Date().toISOString()
  });
  setLocalData('community_actions', actions);

  return true;
}

export async function fetchCommunityModerationActions(communityId: string): Promise<CommunityModerationAction[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('community_moderation_actions')
        .select('*')
        .eq('communityId', communityId)
        .order('createdAt', { ascending: false });

      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase fetchCommunityModerationActions error:', err);
    }
  }

  const all = getLocalData<CommunityModerationAction[]>('community_actions', SEED_COMMUNITY_ACTIONS);
  return all.filter(a => a.communityId === communityId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Subscribe to all live realtime updates for a specific community
 * Automatically triggers callback on new posts, discussions, members, resources, events, reports, settings
 */
export function subscribeToCommunityLiveEvents(
  communityId: string,
  onUpdate: () => void
): () => void {
  let channel: any = null;

  if (isSupabaseConfigured() && supabase) {
    channel = supabase.channel(`community_live_${communityId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'community_posts',
        filter: `communityId=eq.${communityId}`
      }, () => onUpdate())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'community_discussions',
        filter: `communityId=eq.${communityId}`
      }, () => onUpdate())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'community_members',
        filter: `communityId=eq.${communityId}`
      }, () => onUpdate())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'community_resources',
        filter: `communityId=eq.${communityId}`
      }, () => onUpdate())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'community_events',
        filter: `communityId=eq.${communityId}`
      }, () => onUpdate())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'communities',
        filter: `id=eq.${communityId}`
      }, () => onUpdate())
      .subscribe();
  }

  return () => {
    if (channel && supabase) {
      supabase.removeChannel(channel);
    }
  };
}

/**
 * Subscribe to directory level changes across all communities
 */
export function subscribeToAllCommunities(onUpdate: () => void): () => void {
  let channel: any = null;
  if (isSupabaseConfigured() && supabase) {
    channel = supabase.channel('communities_directory_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'communities' }, () => onUpdate())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_members' }, () => onUpdate())
      .subscribe();
  }
  return () => {
    if (channel && supabase) {
      supabase.removeChannel(channel);
    }
  };
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
  const localList = getLocalData<NotificationItem[]>('notifications', SEED_NOTIFICATIONS);
  const localReadMap = new Map<string, boolean>();
  localList.forEach(n => {
    if (n.read) localReadMap.set(n.id, true);
  });

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipientId', userId)
        .order('createdAt', { ascending: false });

      if (!error && data) {
        const merged = (data as NotificationItem[]).map(n => ({
          ...n,
          read: Boolean(n.read || localReadMap.get(n.id))
        }));
        setLocalData('notifications', merged);
        return merged;
      }
    } catch (err) {
      console.warn('Supabase fetchNotifications error:', err);
    }
  }

  return localList.filter(n => n.recipientId === userId);
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

      // Broadcast immediately to recipient
      const notifChannel = supabase.channel(`realtime-notifications-${newNotif.recipientId}`);
      notifChannel.send({
        type: 'broadcast',
        event: 'new_notification',
        payload: newNotif
      }).catch(() => {});
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

export async function deleteNotification(notifId: string): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('notifications').delete().eq('id', notifId);
    } catch (err) {
      console.warn('Supabase deleteNotification error:', err);
    }
  }

  const list = getLocalData<NotificationItem[]>('notifications', SEED_NOTIFICATIONS);
  const updated = list.filter(n => n.id !== notifId);
  setLocalData('notifications', updated);
}

export async function clearNotifications(userId: string, onlyRead: boolean = false): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase.from('notifications').delete().eq('recipientId', userId);
      if (onlyRead) {
        query = query.eq('read', true);
      }
      await query;
    } catch (err) {
      console.warn('Supabase clearNotifications error:', err);
    }
  }

  const list = getLocalData<NotificationItem[]>('notifications', SEED_NOTIFICATIONS);
  const updated = list.filter(n => {
    if (n.recipientId !== userId) return true;
    if (onlyRead) return !n.read;
    return false;
  });
  setLocalData('notifications', updated);
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
