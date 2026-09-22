import { supabase, isSupabaseConfigured } from './client';

export interface UserPresenceState {
  userId: string;
  isOnline: boolean;
  lastSeen: string; // ISO date string
}

const PRESENCE_STORAGE_KEY = 'eatm_presence_heartbeats';
const PRESENCE_CHANGED_EVENT = 'eatm_presence_changed';
const TYPING_CHANGED_EVENT = 'eatm_typing_changed';

// Default realistic last seen dates for campus students so they are not fake-online
const DEFAULT_LAST_SEEN: Record<string, string> = {
  user_priya: new Date().toISOString(), // Active online peer connection
  user_rohit: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), // Yesterday
  user_ananya: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
  user_arjun: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
};

// Retrieve all stored heartbeats
export const getStoredPresenceMap = (): Record<string, { lastSeen: string; isOnline?: boolean }> => {
  try {
    const raw = localStorage.getItem(PRESENCE_STORAGE_KEY);
    const defaults = DEFAULT_LAST_SEEN_MAP();
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return { ...defaults, ...parsed };
  } catch {
    return DEFAULT_LAST_SEEN_MAP();
  }
};

const DEFAULT_LAST_SEEN_MAP = (): Record<string, { lastSeen: string; isOnline: boolean }> => {
  const map: Record<string, { lastSeen: string; isOnline: boolean }> = {};
  Object.entries(DEFAULT_LAST_SEEN).forEach(([id, dateStr]) => {
    map[id] = { lastSeen: dateStr, isOnline: false };
  });
  // Priya Sharma is the active campus peer who is online
  map['user_priya'] = {
    lastSeen: new Date().toISOString(),
    isOnline: true
  };
  return map;
};

// Set stored heartbeat for user
export const updateUserHeartbeat = (userId: string, isOnline = true): void => {
  if (!userId) return;
  const map = getStoredPresenceMap();
  map[userId] = {
    lastSeen: new Date().toISOString(),
    isOnline
  };
  try {
    localStorage.setItem(PRESENCE_STORAGE_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent(PRESENCE_CHANGED_EVENT, { detail: { userId, isOnline } }));
  } catch (err) {
    console.warn('Failed to save presence heartbeat:', err);
  }
};

// Check if a specific user is currently online
export const isUserOnline = (userId: string): boolean => {
  if (!userId) return false;
  const map = getStoredPresenceMap();

  // Priya Sharma is the active peer partner on campus
  if (userId === 'user_priya') {
    if (map['user_priya']?.isOnline === false) {
      return false;
    }
    return true;
  }

  const state = map[userId];
  if (!state) return false;

  // Active status flag check
  if (state.isOnline === false) return false;

  // Threshold check: Must have sent a heartbeat within the last 3 minutes
  const lastSeenMs = new Date(state.lastSeen).getTime();
  const nowMs = Date.now();
  return (nowMs - lastSeenMs) < 3 * 60 * 1000;
};

// Get raw last seen ISO string
export const getUserLastSeen = (userId: string): string | undefined => {
  if (!userId) return undefined;
  if (userId === 'user_priya') return new Date().toISOString();
  const map = getStoredPresenceMap();
  return map[userId]?.lastSeen || DEFAULT_LAST_SEEN[userId];
};

// WhatsApp-style human formatted Last Seen string
export const formatLastSeen = (timestamp?: string | number | Date | null): string => {
  if (!timestamp) return 'Offline';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Offline';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);

  if (diffSecs < 60) {
    return 'Active just now';
  }
  if (diffMins < 5) {
    return `Last seen ${diffMins}m ago`;
  }

  const isToday = now.toDateString() === date.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = yesterday.toDateString() === date.toDateString();

  const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

  if (isToday) {
    return `Last seen today at ${timeStr}`;
  }
  if (isYesterday) {
    return `Last seen yesterday at ${timeStr}`;
  }

  // Same year
  if (now.getFullYear() === date.getFullYear()) {
    const month = date.toLocaleDateString([], { month: 'short' });
    const day = date.getDate();
    return `Last seen ${month} ${day} at ${timeStr}`;
  }

  return `Last seen ${date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`;
};

// Presence Channel Reference for active session
let presenceChannel: any = null;
let heartbeatInterval: any = null;

// Initialize presence engine for logged-in student
export const initPresence = (userId: string): (() => void) => {
  if (!userId) return () => {};

  // 1. Initial Heartbeat
  updateUserHeartbeat(userId, true);

  // 2. Heartbeat every 20 seconds
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  heartbeatInterval = setInterval(() => {
    updateUserHeartbeat(userId, true);
  }, 20000);

  // 3. Supabase Realtime Presence if configured
  if (isSupabaseConfigured() && supabase) {
    try {
      presenceChannel = supabase.channel('online_presence', {
        config: { presence: { key: userId } }
      });

      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState();
          Object.keys(state).forEach(id => {
            updateUserHeartbeat(id, true);
          });
        })
        .on('presence', { event: 'join' }, ({ key }: { key: string }) => {
          updateUserHeartbeat(key, true);
        })
        .on('presence', { event: 'leave' }, ({ key }: { key: string }) => {
          updateUserHeartbeat(key, false);
        })
        .subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel.track({
              user_id: userId,
              online_at: new Date().toISOString()
            });
          }
        });
    } catch (err) {
      console.warn('Supabase Realtime presence init skipped:', err);
    }
  }

  // 4. Tab visibility & beforeunload listeners
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      updateUserHeartbeat(userId, true);
    } else {
      updateUserHeartbeat(userId, false);
    }
  };

  const handleUnload = () => {
    updateUserHeartbeat(userId, false);
    if (presenceChannel) {
      try {
        presenceChannel.untrack();
      } catch {}
    }
  };

  document.addEventListener('visibilitychange', handleVisibility);
  window.addEventListener('beforeunload', handleUnload);

  return () => {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    updateUserHeartbeat(userId, false);
    document.removeEventListener('visibilitychange', handleVisibility);
    window.removeEventListener('beforeunload', handleUnload);
    if (presenceChannel) {
      try {
        presenceChannel.unsubscribe();
        presenceChannel = null;
      } catch {}
    }
  };
};

// Subscribe to presence updates
export const subscribeToPresence = (callback: () => void): (() => void) => {
  const handler = () => callback();
  window.addEventListener(PRESENCE_CHANGED_EVENT, handler);
  window.addEventListener('storage', (e) => {
    if (e.key === PRESENCE_STORAGE_KEY) {
      callback();
    }
  });

  return () => {
    window.removeEventListener(PRESENCE_CHANGED_EVENT, handler);
  };
};

// -------------------------------------------------------------
// Real-time Typing Indicators
// -------------------------------------------------------------

export const broadcastTyping = (conversationId: string, userId: string, isTyping: boolean): void => {
  if (!conversationId || !userId) return;

  // Local window event dispatch
  window.dispatchEvent(new CustomEvent(TYPING_CHANGED_EVENT, {
    detail: { conversationId, userId, isTyping }
  }));

  // Supabase Realtime broadcast channel
  if (isSupabaseConfigured() && supabase) {
    try {
      const channel = supabase.channel(`typing_${conversationId}`);
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId, isTyping }
      });
    } catch {}
  }
};

export const subscribeToTyping = (
  conversationId: string,
  callback: (typingUserId: string, isTyping: boolean) => void
): (() => void) => {
  // Listen to local event
  const localHandler = (e: any) => {
    if (e.detail?.conversationId === conversationId) {
      callback(e.detail.userId, e.detail.isTyping);
    }
  };
  window.addEventListener(TYPING_CHANGED_EVENT, localHandler);

  // Listen to Supabase Broadcast channel
  let remoteChannel: any = null;
  if (isSupabaseConfigured() && supabase) {
    try {
      remoteChannel = supabase.channel(`typing_${conversationId}`)
        .on('broadcast', { event: 'typing' }, ({ payload }: any) => {
          if (payload?.userId) {
            callback(payload.userId, Boolean(payload.isTyping));
          }
        })
        .subscribe();
    } catch {}
  }

  return () => {
    window.removeEventListener(TYPING_CHANGED_EVENT, localHandler);
    if (remoteChannel) {
      try {
        remoteChannel.unsubscribe();
      } catch {}
    }
  };
};
