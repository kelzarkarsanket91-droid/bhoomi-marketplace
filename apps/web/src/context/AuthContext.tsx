import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../lib/api.js';

export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: 'BUYER' | 'SELLER' | 'BROKER' | 'BUILDER' | 'ADMIN';
  isVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  loginWithTokens: (user: User, tokens: { accessToken: string; refreshToken: string }) => void;
  logout: () => void;
  switchRole: (targetRole: 'BUYER' | 'SELLER') => Promise<void>;
  canSwitchRole: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('bhoomi_access_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('bhoomi_access_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await apiFetch<{ user: User }>('/auth/me');
        setUser(res.user);
      } catch (err) {
        console.warn('Session expired or invalid token:', err);
        localStorage.removeItem('bhoomi_access_token');
        localStorage.removeItem('bhoomi_refresh_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []);

  const loginWithTokens = (userData: User, tokens: { accessToken: string; refreshToken: string }) => {
    localStorage.setItem('bhoomi_access_token', tokens.accessToken);
    localStorage.setItem('bhoomi_refresh_token', tokens.refreshToken);
    setToken(tokens.accessToken);
    setUser(userData);
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    localStorage.removeItem('bhoomi_access_token');
    localStorage.removeItem('bhoomi_refresh_token');
    setToken(null);
    setUser(null);
  };

  const switchRole = async (targetRole: 'BUYER' | 'SELLER') => {
    if (!user) return;
    const res = await apiFetch<{ user: User; tokens: { accessToken: string; refreshToken: string } }>(
      '/auth/switch-role',
      {
        method: 'POST',
        body: JSON.stringify({ targetRole }),
      }
    );
    loginWithTokens(res.user, res.tokens);
  };

  // Only BUYER and SELLER accounts can switch roles; BROKER/BUILDER/ADMIN are permanent
  const canSwitchRole = user ? ['BUYER', 'SELLER'].includes(user.role) : false;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        loginWithTokens,
        logout,
        switchRole,
        canSwitchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
