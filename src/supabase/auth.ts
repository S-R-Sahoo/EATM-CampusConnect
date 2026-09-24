import { supabase, isSupabaseConfigured } from './client';
import { UserProfile, UserRole } from '../types';
import { fetchUserById, updateUserProfile, fetchUsers } from './db';

export async function loginWithEmail(emailOrRoll: string, pass: string): Promise<UserProfile> {
  const input = (emailOrRoll || '').trim();
  const normalizedPass = (pass || '').trim();

  if (!input || !normalizedPass) {
    throw new Error('Please enter both your campus email or roll number and password.');
  }

  // 1. Resolve email if roll number or employee ID is supplied
  let resolvedEmail = input.toLowerCase();
  let resolvedUser: UserProfile | null = null;

  if (!input.includes('@')) {
    const allUsers = await fetchUsers();
    const matching = allUsers.filter(u =>
      (u.rollNumber && u.rollNumber.trim().toUpperCase() === input.toUpperCase()) ||
      (u.employeeId && u.employeeId.trim().toUpperCase() === input.toUpperCase())
    );
    if (matching.length === 0) {
      throw new Error('No campus account found with this Roll Number or Employee ID.');
    }
    resolvedUser = matching[0];
    if (resolvedUser.email) {
      resolvedEmail = resolvedUser.email.trim().toLowerCase();
    }
  }

  // 2. Primary Authentication: Supabase Auth ONLY
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: resolvedEmail,
      password: normalizedPass
    });

    if (error) {
      throw new Error(error.message || 'Invalid email/roll number or password.');
    }

    if (data?.user) {
      const profile = await fetchUserById(data.user.id);
      if (profile) {
        if (profile.status === 'disabled') {
          await supabase.auth.signOut();
          throw new Error('Your account has been temporarily disabled. Please contact the college administrator.');
        }
        return profile;
      }

      const newProfile: UserProfile = {
        id: data.user.id,
        uid: data.user.id,
        email: resolvedEmail,
        displayName: data.user.user_metadata?.display_name || resolvedEmail.split('@')[0],
        role: (data.user.user_metadata?.role as UserRole) || 'student',
        department: 'CSE',
        skills: ['Problem Solving', 'Engineering'],
        interests: ['Academics', 'Campus Life'],
        stats: {
          connections: 0,
          posts: 0,
          clubs: 0,
          achievements: 0
        },
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await updateUserProfile(newProfile.id, newProfile);
      return newProfile;
    }
  }

  // 3. Offline Sandbox Fallback (when Supabase is not configured)
  const allUsers = await fetchUsers();
  const localMatch = resolvedUser || allUsers.find(u => u.email?.toLowerCase() === resolvedEmail);
  if (localMatch) {
    return localMatch;
  }

  throw new Error('Invalid email or password.');
}

export async function registerWithEmail(
  userData: {
    email: string;
    password?: string;
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
  }
): Promise<UserProfile> {
  const normalizedEmail = userData.email.trim().toLowerCase();
  const normalizedPass = userData.password?.trim() || '';

  if (!normalizedPass || normalizedPass.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  let uid = 'usr_' + Date.now();

  // 1. Supabase Auth Registration
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: normalizedPass,
      options: {
        data: {
          display_name: userData.displayName,
          role: userData.role
        }
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    if (data?.user) {
      uid = data.user.id;
    }
  }

  // 2. Initialize Safe User Profile in Database (No Password Hashes Stored)
  const newProfile: UserProfile = {
    id: uid,
    uid: uid,
    email: normalizedEmail,
    displayName: userData.displayName,
    role: userData.role,
    department: userData.department,
    year: userData.year,
    semester: userData.semester,
    rollNumber: userData.rollNumber?.toUpperCase(),
    employeeId: userData.employeeId?.toUpperCase(),
    designation: userData.designation,
    phone: userData.phone,
    photoURL: userData.photoURL || undefined,
    coverURL: 'https://images.unsplash.com/photo-1562774053-701939374585?w=1600&auto=format&fit=crop&q=80',
    bio: `${userData.role === 'student' ? 'Student' : 'Faculty'} at Einstein Academy of Technology and Management (EATM).`,
    skills: userData.role === 'student' ? ['Problem Solving', 'Engineering'] : ['Mentorship', 'Teaching'],
    interests: ['Academics', 'Campus Life'],
    stats: {
      connections: 0,
      posts: 0,
      clubs: 0,
      achievements: 0
    },
    status: 'active',
    verified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await updateUserProfile(uid, newProfile);
  return newProfile;
}

export async function updateUserEmail(newEmail: string): Promise<{ needsEmailConfirmation?: boolean }> {
  const normalized = (newEmail || '').trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }

  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.auth.updateUser({
      email: normalized
    });
    if (error) {
      throw new Error(error.message);
    }
    return { needsEmailConfirmation: !data.user?.email_confirmed_at };
  }
  return { needsEmailConfirmation: false };
}

export async function getConnectedProviders(): Promise<{ google: boolean; github: boolean; email: boolean }> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const appMeta = user.app_metadata || {};
        const identities = (user.identities || []) as Array<{ provider: string }>;
        const providersList = appMeta.providers || (appMeta.provider ? [appMeta.provider] : []);
        const identityProviders = identities.map(i => i.provider);
        const allProviders = new Set([...providersList, ...identityProviders]);
        
        return {
          google: allProviders.has('google'),
          github: allProviders.has('github'),
          email: allProviders.has('email') || !!user.email
        };
      }
    } catch (e) {
      console.warn('Error fetching auth providers:', e);
    }
  }
  return { google: false, github: false, email: true };
}

export async function deleteUserAccount(userId: string): Promise<void> {
  if (!userId) throw new Error('Invalid user ID.');

  if (isSupabaseConfigured() && supabase) {
    // 1. Verify that current session belongs to this userId
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser || (authUser.id !== userId && (authUser as any).uid !== userId)) {
      throw new Error('Unauthorized: You can only delete your own account.');
    }

    // 2. Clean user-owned application data
    try {
      await supabase.from('users').delete().eq('id', userId);
      await supabase.from('posts').delete().eq('authorId', userId);
      await supabase.from('comments').delete().eq('authorId', userId);
      await supabase.from('connections').delete().or(`requesterId.eq.${userId},recipientId.eq.${userId}`);
      await supabase.from('notifications').delete().or(`recipientId.eq.${userId},senderId.eq.${userId}`);
    } catch (cleanErr) {
      console.warn('Supabase data cleanup warning:', cleanErr);
    }

    // 3. Attempt RPC if configured, then sign out
    try {
      await supabase.rpc('delete_user_account');
    } catch (_) {}

    await supabase.auth.signOut();
  }

  // 4. Local storage cleanup
  try {
    const rawUsers = localStorage.getItem('eatm_campus_users');
    if (rawUsers) {
      const users: UserProfile[] = JSON.parse(rawUsers);
      const filtered = users.filter((u: UserProfile) => u.id !== userId && u.uid !== userId);
      localStorage.setItem('eatm_campus_users', JSON.stringify(filtered));
      window.dispatchEvent(new CustomEvent('eatm_users_changed', { detail: filtered }));
    }
  } catch (e) {
    console.warn('Local cleanup warning:', e);
  }
  localStorage.removeItem('eatm_current_user');
}

export async function updateUserPassword(newPassword: string): Promise<void> {
  const normalized = (newPassword || '').trim();
  if (normalized.length < 6) {
    throw new Error('New password must be at least 6 characters.');
  }

  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase.auth.updateUser({
      password: normalized
    });
    if (error) {
      throw new Error(error.message);
    }
  }
}

export function getAuthRedirectUrl(): string {
  if (typeof window === 'undefined') return 'https://s-r-sahoo.github.io/EATM-CampusConnect/';
  const origin = window.location.origin;
  const cleanPath = window.location.pathname.replace(/\/[^/]*\.html$/, '').replace(/\/$/, '');
  return `${origin}${cleanPath}/`;
}

export async function loginWithGoogle(): Promise<UserProfile> {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getAuthRedirectUrl()
      }
    });
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('not enabled') || msg.includes('unsupported') || msg.includes('disabled') || msg.includes('validation')) {
        throw new Error('Google sign-in is not enabled in your Supabase dashboard yet. Go to Supabase > Authentication > Providers > Google to enable it.');
      }
      throw new Error(error.message);
    }
  }

  const users = await fetchUsers();
  return users[0];
}

export async function loginWithGithub(): Promise<UserProfile> {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: getAuthRedirectUrl()
      }
    });
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('not enabled') || msg.includes('unsupported') || msg.includes('disabled') || msg.includes('validation')) {
        throw new Error('GitHub sign-in is not enabled in your Supabase dashboard yet. Go to Supabase > Authentication > Providers > GitHub to enable it.');
      }
      throw new Error(error.message);
    }
  }

  const users = await fetchUsers();
  return users[0];
}

export async function logoutUser(): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    await supabase.auth.signOut();
  }
}

export async function resetPassword(email: string): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${window.location.pathname}#/forgot-password`
    });
    if (error) throw new Error(error.message);
  }
}
