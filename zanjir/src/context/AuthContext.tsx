import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Company, Store } from '../types';
import { api, setUnauthorizedHandler } from '../services/api';
import { RegisterParams, normalizeRegisterParams, validateRegisterParams } from '../utils/registration';

interface AuthResult {
  success: boolean;
  error?: string;
}

interface SessionResponse {
  user: UserProfile;
  company: Company | null;
  store: Store | null;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  currentCompany: Company | null;
  currentStore: Store | null;
  isAuthenticated: boolean;
  isOnline: boolean;
  /** Dastlabki sessiya holati aniqlanguncha true. */
  loading: boolean;
  login: (email: string, pass: string) => Promise<AuthResult>;
  register: (params: RegisterParams) => Promise<AuthResult>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResult & { message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const errorMessage = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Online / Offline holatini kuzatish
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const clearSession = () => {
    setCurrentUser(null);
    setCurrentCompany(null);
    setCurrentStore(null);
  };

  const applySession = (session: SessionResponse) => {
    setCurrentUser(session.user);
    setCurrentCompany(session.company);
    setCurrentStore(session.store);
  };

  // Sessiyani tiklash; sessiya muddati tugasa, avtomatik chiqariladi
  useEffect(() => {
    setUnauthorizedHandler(clearSession);

    api
      .get<SessionResponse>('/api/auth/me')
      .then(applySession)
      .catch(() => clearSession())
      .finally(() => setLoading(false));

    return () => setUnauthorizedHandler(null);
  }, []);

  const login = async (email: string, pass: string): Promise<AuthResult> => {
    try {
      applySession(await api.post<SessionResponse>('/api/auth/login', { email, password: pass }));
      return { success: true };
    } catch (err) {
      return { success: false, error: errorMessage(err, 'Kirishda xatolik yuz berdi') };
    }
  };

  const register = async (rawParams: RegisterParams): Promise<AuthResult> => {
    const params = normalizeRegisterParams(rawParams);
    const validationError = validateRegisterParams(params);
    if (validationError) {
      return { success: false, error: validationError };
    }

    try {
      applySession(await api.post<SessionResponse>('/api/auth/register', params));
      return { success: true };
    } catch (err) {
      return { success: false, error: errorMessage(err, "Ro'yxatdan o'tishda xatolik yuz berdi") };
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      /* serverga ulanib bo'lmasa ham mijoz tomonda chiqamiz */
    }
    clearSession();
  };

  // Email yuborish sozlanmagan: parolni administrator tiklaydi
  const resetPassword = async (): Promise<AuthResult & { message?: string }> => ({
    success: false,
    error: 'Parolni tiklash uchun platforma administratoriga murojaat qiling.'
  });

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentCompany,
        currentStore,
        isAuthenticated: Boolean(currentUser),
        isOnline,
        loading,
        login,
        register,
        logout,
        resetPassword
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
