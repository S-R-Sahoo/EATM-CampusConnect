import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserRole } from '../types';
import { loginWithEmail, registerWithEmail, loginWithGoogle as authGoogle, loginWithGithub as authGithub, logoutUser } from '../supabase/auth';
import { fetchUsers, updateUserProfile as firestoreUpdateProfile } from '../supabase/db';
import { supabase, isSupabaseConfigured } from '../supabase/client';
import { DEFAULT_ENGINEER_AVATAR } from '../constants/assets';

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
          const parsed = JSON.parse(storedUser);
          if (parsed.role === 'student' && (!parsed.photoURL || parsed.photoURL.includes('photo-1534528741775-53994a69daeb'))) {
            parsed.photoURL = DEFAULT_ENGINEER_AVATAR;
            localStorage.setItem('eatm_current_user', JSON.stringify(parsed));
          }
          setUser(parsed);
        } else {
          // Default start with Soumyaranjan Sahoo (Student persona) for instant preview
          const users = await fetchUsers();
          const defaultStudent = users.find(u => u.id === 'user_soumya') || users[0];
          if (defaultStudent.role === 'student' && (!defaultStudent.photoURL || defaultStudent.photoURL.includes('photo-1534528741775-53994a69daeb'))) {
            defaultStudent.photoURL = DEFAULT_ENGINEER_AVATAR;
          }
          setUser(defaultStudent);
          localStorage.setItem('eatm_current_user', JSON.stringify(defaultStudent));
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
                photoURL: meta.avatar_url || meta.picture || DEFAULT_ENGINEER_AVATAR,
                coverURL: 'https://images.unsplash.com/photo-1562774053-701939374585?w=1600&auto=format&fit=crop&q=80',
                bio: 'Student at Einstein Academy of Technology and Management (EATM).',
                skills: ['Engineering', 'Problem Solving'],
                interests: ['Academics', 'Campus Life'],
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

            // If returning from an OAuth callback with code or tokens, route directly to dashboard
            const search = window.location.search;
            const hash = window.location.hash;
            if (search.includes('code=') || hash.includes('access_token=') || hash.includes('/login')) {
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
        if (targetUser && (!targetUser.photoURL || targetUser.photoURL.includes('photo-1534528741775-53994a69daeb'))) {
          targetUser.photoURL = DEFAULT_ENGINEER_AVATAR;
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
        updateUser
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
