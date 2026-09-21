import { supabase, isSupabaseConfigured } from './client';
import { UserProfile, UserRole } from '../types';
import { fetchUserById, updateUserProfile, fetchUsers } from './db';
import { DEFAULT_ENGINEER_AVATAR } from '../constants/assets';

export async function loginWithEmail(email: string, pass: string): Promise<UserProfile> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass
    });

    if (error) {
      throw new Error(error.message || 'Login failed.');
    }

    if (data.user) {
      const profile = await fetchUserById(data.user.id);
      if (profile) {
        if (profile.status === 'disabled') {
          throw new Error('Your account has been temporarily disabled. Please contact the college administrator.');
        }
        return profile;
      }
    }
  }

  // Fallback demo lookup
  const users = await fetchUsers();
  const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (found) {
    if (found.status === 'disabled') {
      throw new Error('Your account has been temporarily disabled. Please contact the college administrator.');
    }
    return found;
  }

  // Quick demo persona fallbacks
  if (email.includes('admin')) {
    return users.find(u => u.role === 'admin') || users[0];
  } else if (email.includes('faculty') || email.includes('hod')) {
    return users.find(u => u.role === 'faculty') || users[0];
  }
  return users[0];
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
  let uid = 'usr_' + Date.now();

  if (isSupabaseConfigured() && supabase && userData.password) {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
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
    if (data.user) {
      uid = data.user.id;
    }
  }

  const newProfile: UserProfile = {
    id: uid,
    uid: uid,
    email: userData.email,
    displayName: userData.displayName,
    role: userData.role,
    department: userData.department,
    year: userData.year,
    semester: userData.semester,
    rollNumber: userData.rollNumber,
    employeeId: userData.employeeId,
    designation: userData.designation,
    phone: userData.phone,
    photoURL: userData.photoURL || (userData.role === 'student' ? DEFAULT_ENGINEER_AVATAR : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'),
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

export async function loginWithGoogle(): Promise<UserProfile> {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + window.location.pathname
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
        redirectTo: window.location.origin + window.location.pathname
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
