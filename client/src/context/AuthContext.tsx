import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { api, setStoredAccessToken, getStoredAccessToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchUserRole: (email: string, password: string) => Promise<void>;
  isAdmin: boolean;
  isPM: boolean;
  isDeveloper: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    const token = getStoredAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.get('auth/me');
      if (res.success && res.data.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
        setStoredAccessToken(null);
      }
    } catch (err) {
      setUser(null);
      setStoredAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    const handleUnauthorized = () => {
      setUser(null);
      setStoredAccessToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.post('auth/login', { email, password });
      if (res.success && res.data) {
        setStoredAccessToken(res.data.accessToken);
        setUser(res.data.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('auth/logout');
    } catch (e) {
      // Ignore
    } finally {
      setStoredAccessToken(null);
      setUser(null);
    }
  };

  // Helper for evaluation / quick testing between roles
  const switchUserRole = async (email: string, password: string) => {
    await login(email, password);
  };

  const isAdmin = user?.role === 'ADMIN';
  const isPM = user?.role === 'PM';
  const isDeveloper = user?.role === 'DEVELOPER';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        switchUserRole,
        isAdmin,
        isPM,
        isDeveloper,
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
