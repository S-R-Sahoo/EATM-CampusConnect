import { supabase, isSupabaseConfigured } from './client';
import { UserProfile, UserRole } from '../types';
import { fetchUserById, updateUserProfile, fetchUsers } from './db';

export async function hashPassword(password: string): Promise<string> {
  const normalized = (password || '').trim();
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(normalized + '_eatm_salt_2026');
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // fallback
    }
  }
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) - hash) + normalized.charCodeAt(i);
    hash |= 0;
  }
  return 'h_' + Math.abs(hash);
}

export async function loginWithEmail(emailOrRoll: string, pass: string): Promise<UserProfile> {
  const input = (emailOrRoll || '').trim();
  const normalizedPass = (pass || '').trim();

  if (!input || !normalizedPass) {
    throw new Error('Please enter both your campus email or roll number and password.');
  }

  // 1. Fetch current users across Supabase and local cache
  const allUsers = await fetchUsers();
  const enteredHash = await hashPassword(normalizedPass);

  let resolvedEmail = input.toLowerCase();
  let matchedUser: UserProfile | null = null;

  if (!input.includes('@')) {
    // Identifier is a Roll Number or Employee ID
    const matching = allUsers.filter(u =>
      (u.rollNumber && u.rollNumber.trim().toUpperCase() === input.toUpperCase()) ||
      (u.employeeId && u.employeeId.trim().toUpperCase() === input.toUpperCase())
    );
    if (matching.length > 0) {
      // Prioritize the user whose passHash matches, otherwise the most recently updated
      const exactHashMatch = matching.find(u => u.socialLinks?.passHash === enteredHash);
      if (exactHashMatch) {
        matchedUser = exactHashMatch;
      } else {
        matching.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
        matchedUser = matching[0];
      }
      if (matchedUser && matchedUser.email) {
        resolvedEmail = matchedUser.email.trim().toLowerCase();
      }
    }
  } else {
    // Identifier is an Email
    const matching = allUsers.filter(u => u.email && u.email.trim().toLowerCase() === resolvedEmail);
    if (matching.length > 0) {
      const exactHashMatch = matching.find(u => u.socialLinks?.passHash === enteredHash);
      if (exactHashMatch) {
        matchedUser = exactHashMatch;
      } else {
        matching.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
        matchedUser = matching[0];
      }
    }
  }

  let authenticatedProfile: UserProfile | null = null;

  // 2. Try Supabase Auth
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password: normalizedPass
      });

      if (!error && data?.user) {
        // Authenticated with active session in Supabase Auth
        const profile = await fetchUserById(data.user.id);
        authenticatedProfile = profile || matchedUser || {
          id: data.user.id,
          uid: data.user.id,
          email: resolvedEmail,
          displayName: data.user.user_metadata?.display_name || resolvedEmail.split('@')[0],
          role: data.user.user_metadata?.role || 'student',
          department: 'CSE',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as UserProfile;
      } else if (error) {
        const errCode = (error as any).code || '';
        const errMsg = (error.message || '').toLowerCase();

        // When Supabase has email confirmation enabled:
        // Supabase ONLY returns 'email_not_confirmed' when the password is 100% correct!
        if (errCode === 'email_not_confirmed' || errMsg.includes('email not confirmed')) {
          authenticatedProfile = matchedUser || allUsers.find(u => u.email?.toLowerCase() === resolvedEmail) || null;
          if (!authenticatedProfile) {
            authenticatedProfile = {
              id: 'usr_' + Date.now(),
              uid: 'usr_' + Date.now(),
              email: resolvedEmail,
              displayName: resolvedEmail.split('@')[0],
              role: 'student',
              department: 'CSE',
              status: 'active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            } as UserProfile;
            await updateUserProfile(authenticatedProfile.id, authenticatedProfile);
          }
        } else if (matchedUser && matchedUser.socialLinks?.passHash === enteredHash) {
          // Password matches the user's campus credentials hash!
          authenticatedProfile = matchedUser;
        }
      }
    } catch (err: any) {
      console.warn('Supabase auth sign in error, checking campus credentials:', err);
      if (matchedUser && matchedUser.socialLinks?.passHash === enteredHash) {
        authenticatedProfile = matchedUser;
      }
    }
  }

  // 3. Fallback verification if not already authenticated
  if (!authenticatedProfile) {
    if (matchedUser && matchedUser.socialLinks?.passHash === enteredHash) {
      authenticatedProfile = matchedUser;
    }
  }

  // 4. Fallback demo personas for testing
  if (!authenticatedProfile) {
    const isDemoPass = ['password123!', 'password', 'demo123', 'eatm2026', 'eatm123'].includes(normalizedPass.toLowerCase());
    if (isDemoPass) {
      if (input.toLowerCase().includes('admin') || matchedUser?.role === 'admin') {
        authenticatedProfile = allUsers.find(u => u.role === 'admin') || allUsers[0];
      } else if (input.toLowerCase().includes('faculty') || matchedUser?.role === 'faculty') {
        authenticatedProfile = allUsers.find(u => u.role === 'faculty') || allUsers[0];
      } else if (matchedUser) {
        authenticatedProfile = matchedUser;
      } else if (input.toLowerCase().includes('soumya')) {
        authenticatedProfile = allUsers.find(u => u.id === 'user_soumya') || allUsers[0];
      }
    }
  }

  if (!authenticatedProfile) {
    throw new Error('Invalid email/roll number or password. Please verify your credentials and try again.');
  }

  if (authenticatedProfile.status === 'disabled') {
    throw new Error('Your account has been temporarily disabled. Please contact the college administrator.');
  }

  // Upgrade user's passHash in users table if missing or updated
  if (!authenticatedProfile.socialLinks?.passHash || authenticatedProfile.socialLinks.passHash !== enteredHash) {
    authenticatedProfile.socialLinks = {
      ...(authenticatedProfile.socialLinks || {}),
      passHash: enteredHash
    };
    updateUserProfile(authenticatedProfile.id, authenticatedProfile).catch(() => {});
  }

  return authenticatedProfile;
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
  const passHash = normalizedPass ? await hashPassword(normalizedPass) : undefined;

  let uid = 'usr_' + Date.now();

  // 1. Try registering in Supabase Auth
  if (isSupabaseConfigured() && supabase && normalizedPass) {
    try {
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

      if (!error && data?.user) {
        uid = data.user.id;
      } else if (error) {
        console.warn('Supabase Auth signUp note:', error.message, error.code);
        // Continue safely: even if email rate limit exceeded or unconfirmed, profile & passHash are saved!
      }
    } catch (authErr: any) {
      console.warn('Supabase signUp network exception, proceeding with profile registration:', authErr);
    }
  }

  // 2. Check if a profile with this rollNumber or email already exists in users table to prevent broken duplicates
  const existingUsers = await fetchUsers();
  const existing = existingUsers.find(u => 
    (userData.rollNumber && u.rollNumber && u.rollNumber.trim().toUpperCase() === userData.rollNumber.trim().toUpperCase()) ||
    (u.email && u.email.trim().toLowerCase() === normalizedEmail)
  );

  if (existing) {
    uid = existing.id;
  }

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
    coverURL: existing?.coverURL || 'https://images.unsplash.com/photo-1562774053-701939374585?w=1600&auto=format&fit=crop&q=80',
    bio: existing?.bio || `${userData.role === 'student' ? 'Student' : 'Faculty'} at Einstein Academy of Technology and Management (EATM).`,
    skills: existing?.skills || (userData.role === 'student' ? ['Problem Solving', 'Engineering'] : ['Mentorship', 'Teaching']),
    interests: existing?.interests || ['Academics', 'Campus Life'],
    stats: existing?.stats || {
      connections: 0,
      posts: 0,
      clubs: 0,
      achievements: 0
    },
    socialLinks: {
      ...(existing?.socialLinks || {}),
      passHash: passHash || existing?.socialLinks?.passHash
    },
    status: 'active',
    verified: existing?.verified ?? false,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await updateUserProfile(uid, newProfile);
  return newProfile;
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

  // Fallback demo user
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

  // Fallback demo user
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
