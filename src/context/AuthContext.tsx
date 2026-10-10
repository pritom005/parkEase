import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { mockDb } from '../db/mockDb';

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  login: (emailOrPhone: string, password: string) => { success: boolean; error?: string };
  loginAsUser: () => void;
  loginAsAdmin: () => void;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = 'parkease_session_user_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const storedId = localStorage.getItem(AUTH_USER_KEY);
      if (storedId) {
        const u = mockDb.getUserById(Number(storedId));
        if (u && u.status === 'Active') return u;
      }
    } catch {
      // fallback
    }
    // Default to user Tanvir Ahmed for smooth preview, or null if logged out
    return mockDb.getUserById(2) || null;
  });

  const refreshUser = () => {
    if (currentUser) {
      const updated = mockDb.getUserById(currentUser.user_id);
      if (updated && updated.status === 'Active') {
        setCurrentUser({ ...updated });
      } else {
        logout();
      }
    }
  };

  const login = (emailOrPhone: string, password: string) => {
    const trimmed = emailOrPhone.trim().toLowerCase();
    const allUsers = mockDb.getUsers();
    const user = allUsers.find(
      (u) =>
        u.email.toLowerCase() === trimmed ||
        u.phone.replace(/\s+/g, '') === trimmed.replace(/\s+/g, '')
    );

    if (!user) {
      return { success: false, error: 'No account found with this email or phone number' };
    }

    if (user.status === 'Blocked') {
      return { success: false, error: 'Your account is currently blocked by administration' };
    }

    setCurrentUser(user);
    try {
      localStorage.setItem(AUTH_USER_KEY, String(user.user_id));
    } catch {
      // Ignore
    }
    return { success: true };
  };

  const loginAsUser = () => {
    const user = mockDb.getUserById(2); // Tanvir Ahmed
    if (user) {
      setCurrentUser(user);
      localStorage.setItem(AUTH_USER_KEY, String(user.user_id));
    }
  };

  const loginAsAdmin = () => {
    const admin = mockDb.getUserById(1); // Admin User
    if (admin) {
      setCurrentUser(admin);
      localStorage.setItem(AUTH_USER_KEY, String(admin.user_id));
    }
  };

  const logout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(AUTH_USER_KEY);
    } catch {
      // Ignore
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin,
        login,
        loginAsUser,
        loginAsAdmin,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
