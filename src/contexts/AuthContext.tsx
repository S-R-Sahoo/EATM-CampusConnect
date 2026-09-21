import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserRole } from '../types';
import { loginWithEmail, registerWithEmail, loginWithGoogle as authGoogle, loginWithGithub as authGithub, logoutUser } from '../firebase/auth';
import { fetchUsers, updateUserProfile as firestoreUpdateProfile } from '../firebase/firestore';
import { auth, isFirebaseConfigured } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
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

        // If real Firebase Auth is active, attach listener
        if (isFirebaseConfigured() && auth) {
          unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
              const users = await fetchUsers();
              const profile = users.find(u => u.uid === firebaseUser.uid || u.email === firebaseUser.email);
              if (profile) {
                setUser(profile);
                localStorage.setItem('eatm_current_user', JSON.stringify(profile));
              }
            }
          });
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
