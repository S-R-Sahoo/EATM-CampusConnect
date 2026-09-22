import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserRole } from '../types';
import { loginWithEmail, registerWithEmail, loginWithGoogle as authGoogle, loginWithGithub as authGithub, logoutUser } from '../supabase/auth';
import { fetchUsers, updateUserProfile as firestoreUpdateProfile } from '../supabase/db';
import { supabase, isSupabaseConfigured } from '../supabase/client';
import { isCustomPhoto } from '../constants/assets';
import { initPresence } from '../supabase/presence';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  logout: () => Promise<void>;
  switchDemoPersona: (role: UserRole) => Promise<void>;
  updateUser: (data: Partial<UserProfile>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state
  useEffect(() => {
    let unsubscribe = () => {};

    const initAuth = async () => {
      setIsLoading(true);
      try {
        const storedUser = localStorage.getItem('eatm_current_user');
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            if (parsed && parsed.id) {
              if (!isCustomPhoto(parsed.photoURL)) {
                parsed.photoURL = undefined;
              }
              setUser(parsed);
            }
          } catch {
            localStorage.removeItem('eatm_current_user');
          }
        }

        const syncSessionUser = async (authUser: any) => {
          try {
            const users = await fetchUsers();
            let profile = users.find(u => u.uid === authUser.id || u.id === authUser.id || u.email?.toLowerCase() === authUser.email?.toLowerCase());
            
            if (!profile) {
              const meta = authUser.user_metadata || {};
              const fallbackName = meta.full_name || meta.name || meta.user_name || authUser.email?.split('@')[0] || 'Campus Student';
              const newProfile: UserProfile = {
                id: authUser.id,
                uid: authUser.id,
                email: authUser.email || '',
                displayName: fallbackName,
                role: 'student',
                department: 'Computer Science & Engineering',
                rollNumber: 'EATM' + new Date().getFullYear().toString().slice(-2) + 'CSE' + Math.floor(100 + Math.random() * 900),
                year: '2nd Year',
                semester: '4th Semester',
                photoURL: isCustomPhoto(meta.avatar_url || meta.picture) ? (meta.avatar_url || meta.picture) : undefined,
                coverURL: 'https://images.unsplash.com/photo-1562774053-701939374585?w=1600&auto=format&fit=crop&q=80',
                bio: 'Student at Einstein Academy of Technology and Management (EATM).',
                skills: ['Computer Science', 'Engineering', 'Problem Solving'],
                interests: ['Academics', 'Campus Life', 'Innovation'],
                stats: {
                  connections: 0,
                  posts: 0,
                  clubs: 0,
                  achievements: 0
                },
                status: 'active',
                verified: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              await firestoreUpdateProfile(authUser.id, newProfile);
              profile = newProfile;
            }

            setUser(profile);
            localStorage.setItem('eatm_current_user', JSON.stringify(profile));

            // Force immediate route to official student dashboard after authentication
            const search = window.location.search;
            const hash = window.location.hash;
            if (search.includes('code=') || hash.includes('access_token=') || hash.includes('/login') || hash.includes('/register') || hash === '' || hash === '#/' || !hash) {
              window.location.hash = '#/student/dashboard';
            }
          } catch (syncErr) {
            console.error('Error syncing Supabase user:', syncErr);
          }
        };

        // If real Supabase Auth is active, check session & attach listener
        if (isSupabaseConfigured() && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            await syncSessionUser(session.user);
          }

          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
              await syncSessionUser(session.user);
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
              localStorage.removeItem('eatm_current_user');
            }
          });
          unsubscribe = () => subscription.unsubscribe();
        }
      } catch (err) {
        console.error('Error in initAuth:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
    return () => unsubscribe();
  }, []);

  // Maintain real presence & heartbeats for active authenticated user
  useEffect(() => {
    if (!user?.id) return;
    const cleanup = initPresence(user.id);
    return () => {
      cleanup();
    };
  }, [user?.id]);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const loggedUser = await loginWithEmail(email, pass);
      setUser(loggedUser);
      localStorage.setItem('eatm_current_user', JSON.stringify(loggedUser));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const newUser = await registerWithEmail(data);
      setUser(newUser);
      localStorage.setItem('eatm_current_user', JSON.stringify(newUser));
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const googleUser = await authGoogle();
      setUser(googleUser);
      localStorage.setItem('eatm_current_user', JSON.stringify(googleUser));
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGithub = async () => {
    setIsLoading(true);
    try {
      const githubUser = await authGithub();
      setUser(githubUser);
      localStorage.setItem('eatm_current_user', JSON.stringify(githubUser));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await logoutUser();
      setUser(null);
      localStorage.removeItem('eatm_current_user');
    } finally {
      setIsLoading(false);
    }
  };

  const switchDemoPersona = async (role: UserRole) => {
    setIsLoading(true);
    try {
      const users = await fetchUsers();
      let targetUser = users.find(u => u.role === role);
      if (role === 'student') {
        targetUser = users.find(u => u.id === 'user_soumya') || targetUser;
        if (targetUser && !isCustomPhoto(targetUser.photoURL)) {
          targetUser.photoURL = undefined;
        }
      } else if (role === 'faculty') {
        targetUser = users.find(u => u.id === 'faculty_mohapatra') || targetUser;
      } else if (role === 'admin') {
        targetUser = users.find(u => u.id === 'admin_rath') || targetUser;
      }

      if (targetUser) {
        setUser(targetUser);
        localStorage.setItem('eatm_current_user', JSON.stringify(targetUser));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const updated = await firestoreUpdateProfile(user.id, data);
    setUser(updated);
    localStorage.setItem('eatm_current_user', JSON.stringify(updated));
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      const users = await fetchUsers();
      const fresh = users.find(u => u.id === user.id || u.uid === user.id);
      if (fresh) {
        setUser(fresh);
        localStorage.setItem('eatm_current_user', JSON.stringify(fresh));
      }
    } catch (err) {
      console.warn('Error refreshing user profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        loginWithGoogle,
        loginWithGithub,
        logout,
        switchDemoPersona,
        updateUser,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
