import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, googleProvider, githubProvider, isFirebaseConfigured } from './config';
import { UserProfile, UserRole } from '../types';
import { fetchUserById, updateUserProfile, fetchUsers } from './firestore';
import { DEFAULT_ENGINEER_AVATAR } from '../constants/assets';

export async function loginWithEmail(email: string, pass: string): Promise<UserProfile> {
  if (isFirebaseConfigured() && auth) {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const profile = await fetchUserById(cred.user.uid);
    if (!profile) {
      throw new Error('User profile not found in database.');
    }
    if (profile.status === 'disabled') {
      throw new Error('Your account has been temporarily disabled. Please contact the college administrator.');
    }
    return profile;
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

  // Default fallback to Soumyaranjan for quick demo login if email matches demo
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

  if (isFirebaseConfigured() && auth && userData.password) {
    const cred = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    uid = cred.user.uid;
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
  if (isFirebaseConfigured() && auth) {
    const cred = await signInWithPopup(auth, googleProvider);
    let profile = await fetchUserById(cred.user.uid);
    if (!profile) {
      // Auto-create student profile
      profile = await registerWithEmail({
        email: cred.user.email || 'student@eatm.in',
        displayName: cred.user.displayName || 'EATM Student',
        role: 'student',
        department: 'CSE',
        photoURL: cred.user.photoURL || undefined
      });
    }
    return profile;
  }

  // Fallback demo user
  const users = await fetchUsers();
  return users[0];
}

export async function loginWithGithub(): Promise<UserProfile> {
  if (isFirebaseConfigured() && auth) {
    const cred = await signInWithPopup(auth, githubProvider);
    let profile = await fetchUserById(cred.user.uid);
    if (!profile) {
      // Auto-create student profile
      profile = await registerWithEmail({
        email: cred.user.email || `${cred.user.displayName?.toLowerCase().replace(/\s+/g, '') || 'developer'}@eatm.in`,
        displayName: cred.user.displayName || 'EATM Student',
        role: 'student',
        department: 'CSE',
        photoURL: cred.user.photoURL || undefined
      });
    }
    return profile;
  }

  // Fallback demo user
  const users = await fetchUsers();
  return users[0];
}

export async function logoutUser(): Promise<void> {
  if (isFirebaseConfigured() && auth) {
    await firebaseSignOut(auth);
  }
}

export async function resetPassword(email: string): Promise<void> {
  if (isFirebaseConfigured() && auth) {
    await sendPasswordResetEmail(auth, email);
  }
}
