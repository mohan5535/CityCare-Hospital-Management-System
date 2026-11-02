'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { fetchApi } from '../lib/api';

export const DEMO_CREDENTIALS = {
  PATIENT: { email: 'patient@hms.com', password: 'PatientPass123!' },
  DOCTOR: { email: 'dr.priya@hms.com', password: 'DoctorPass123!' },
  HOSPITAL_ADMIN: { email: 'admin@hms.com', password: 'AdminPass123!' },
  RECEPTIONIST: { email: 'receptionist@hms.com', password: 'ReceptPass123!' },
};

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  demoLoginsEnabled: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => void;
  quickLogin: (targetRole: keyof typeof DEMO_CREDENTIALS) => Promise<User | undefined>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Controlled by environment variable (defaults to true for review / development, false in production unless explicitly set to true)
  const demoLoginsEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGINS !== undefined
    ? process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGINS === 'true'
    : process.env.NODE_ENV !== 'production';

  useEffect(() => {
    const savedToken = localStorage.getItem('hms_token') || localStorage.getItem('token');
    const savedUser = localStorage.getItem('hms_user');

    if (savedToken && savedToken !== 'undefined' && savedToken !== 'null' && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        setUser(null);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const authToken = res.data.token;
      const userData = res.data.user;

      setToken(authToken);
      setUser(userData);

      localStorage.setItem('hms_token', authToken);
      localStorage.setItem('token', authToken);
      localStorage.setItem('hms_user', JSON.stringify(userData));
      return userData;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      const authToken = res.data.token;
      const userData = res.data.user;

      setToken(authToken);
      setUser(userData);

      localStorage.setItem('hms_token', authToken);
      localStorage.setItem('token', authToken);
      localStorage.setItem('hms_user', JSON.stringify(userData));
      return userData;
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (targetRole: keyof typeof DEMO_CREDENTIALS) => {
    const creds = DEMO_CREDENTIALS[targetRole];
    if (creds) {
      return await login(creds.email, creds.password);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('hms_token');
    localStorage.removeItem('token');
    localStorage.removeItem('hms_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        token,
        isAuthenticated: !!user,
        isLoading,
        demoLoginsEnabled,
        login,
        register,
        logout,
        quickLogin,
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
