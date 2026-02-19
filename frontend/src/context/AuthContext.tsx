import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface User {
  user_id: string;
  email: string;
  name: string;
  picture?: string;
  subscription_tier: 'free' | 'essentiel' | 'premium' | 'lifetime';
  subscription_expires?: string;
  is_founder: boolean;
  usage_this_month: {
    journal_entries: number;
    dreams: number;
    mirror_queries: number;
  };
}

interface SubscriptionStatus {
  tier: string;
  tier_name: string;
  is_founder: boolean;
  limits: Record<string, any>;
  usage: Record<string, number>;
  expires_at?: string;
  features: Record<string, boolean>;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  subscriptionStatus: SubscriptionStatus | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  checkFeatureAccess: (feature: string) => boolean;
  checkUsageLimit: (feature: string) => { allowed: boolean; remaining: number };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        await refreshSubscription();
      } else {
        await AsyncStorage.removeItem('session_token');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.detail || 'Erreur de connexion' };
      }

      // Store token if returned
      if (data.session_token) {
        await AsyncStorage.setItem('session_token', data.session_token);
      }

      setUser(data.user);
      await refreshSubscription();
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erreur de connexion' };
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.detail || 'Erreur d\'inscription' };
      }

      if (data.session_token) {
        await AsyncStorage.setItem('session_token', data.session_token);
      }

      setUser(data.user);
      await refreshSubscription();
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erreur d\'inscription' };
    }
  };

  const loginWithGoogle = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/auth/callback`
      : '';
    
    if (typeof window !== 'undefined') {
      window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    }
  };

  const logout = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      if (token) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await AsyncStorage.removeItem('session_token');
      setUser(null);
      setSubscriptionStatus(null);
    }
  };

  const refreshUser = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      if (!token) return;

      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Refresh user failed:', error);
    }
  };

  const refreshSubscription = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/auth/subscription-status`, {
        headers,
      });

      if (response.ok) {
        const status = await response.json();
        setSubscriptionStatus(status);
      }
    } catch (error) {
      console.error('Refresh subscription failed:', error);
    }
  };

  const checkFeatureAccess = (feature: string): boolean => {
    if (!subscriptionStatus) return false;
    return subscriptionStatus.features[feature] ?? false;
  };

  const checkUsageLimit = (feature: string): { allowed: boolean; remaining: number } => {
    if (!subscriptionStatus) {
      return { allowed: false, remaining: 0 };
    }

    const limit = subscriptionStatus.limits[feature];
    const usage = subscriptionStatus.usage[feature] || 0;

    if (limit === -1) {
      return { allowed: true, remaining: -1 };
    }

    const remaining = limit - usage;
    return { allowed: remaining > 0, remaining };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        subscriptionStatus,
        login,
        register,
        loginWithGoogle,
        logout,
        refreshUser,
        refreshSubscription,
        checkFeatureAccess,
        checkUsageLimit,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
