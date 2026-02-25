import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface User {
  user_id: string;
  email: string;
  name: string;
  picture?: string;
  subscription_tier: 'free' | 'essentiel' | 'premium' | 'lifetime';
  subscription_expires?: string;
  is_founder: boolean;
  push_token?: string;
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
  register: (email: string, password: string, name: string, lifetimeCode?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  loginWithApple: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  checkFeatureAccess: (feature: string) => boolean;
  checkUsageLimit: (feature: string) => { allowed: boolean; remaining: number };
  registerForPushNotifications: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);

  useEffect(() => {
    checkAuth();
    setupDeepLinking();
  }, []);

  // Handle deep linking for OAuth callback
  const setupDeepLinking = () => {
    // Handle URL when app is opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) handleOAuthCallback(url);
    });

    // Handle URL when app is already open
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleOAuthCallback(url);
    });

    return () => subscription.remove();
  };

  const handleOAuthCallback = async (url: string) => {
    // Check if this is an OAuth callback with session_id
    if (url.includes('session_id=')) {
      const sessionId = url.split('session_id=')[1]?.split('&')[0]?.split('#')[0];
      if (sessionId) {
        await processOAuthSession(sessionId);
      }
    }
  };

  const processOAuthSession = async (sessionId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/auth/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.session_token) {
          await AsyncStorage.setItem('session_token', data.session_token);
        }
        setUser(data.user);
        await refreshSubscription();
        await registerForPushNotifications();
      }
    } catch (error) {
      console.error('OAuth session processing failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

      if (data.session_token) {
        await AsyncStorage.setItem('session_token', data.session_token);
      }

      setUser(data.user);
      await refreshSubscription();
      await registerForPushNotifications();
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
      await registerForPushNotifications();
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erreur d\'inscription' };
    }
  };

  const loginWithGoogle = async () => {
    try {
      // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
      // For web, use window.location. For mobile, use expo scheme
      const isWeb = Platform.OS === 'web';
      
      let redirectUrl: string;
      if (isWeb && typeof window !== 'undefined') {
        redirectUrl = `${window.location.origin}/home`;
      } else {
        // For mobile, use a custom scheme that will be handled by Linking
        redirectUrl = 'latence://auth/callback';
      }
      
      const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
      
      if (isWeb && typeof window !== 'undefined') {
        window.location.href = authUrl;
        return { success: true };
      } else {
        // Open in-app browser for mobile
        const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
        
        if (result.type === 'success' && result.url) {
          await handleOAuthCallback(result.url);
          return { success: true };
        }
        return { success: false, error: 'Connexion annulée' };
      }
    } catch (error) {
      console.error('Google login error:', error);
      return { success: false, error: 'Erreur de connexion Google' };
    }
  };

  const loginWithApple = async () => {
    try {
      // Check if Apple authentication is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        return { success: false, error: 'Apple Sign-In non disponible sur cet appareil' };
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Send to backend for validation and session creation
      const response = await fetch(`${API_URL}/api/auth/apple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identity_token: credential.identityToken,
          user_id: credential.user,
          email: credential.email,
          full_name: credential.fullName ? 
            `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim() : 
            null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.detail || 'Erreur de connexion Apple' };
      }

      if (data.session_token) {
        await AsyncStorage.setItem('session_token', data.session_token);
      }

      setUser(data.user);
      await refreshSubscription();
      await registerForPushNotifications();
      return { success: true };
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        return { success: false, error: 'Connexion annulée' };
      }
      console.error('Apple login error:', error);
      return { success: false, error: 'Erreur de connexion Apple' };
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

  const registerForPushNotifications = async (): Promise<string | null> => {
    try {
      // Check if we're on a physical device (required for push notifications)
      if (!Constants.isDevice) {
        console.log('Push notifications require a physical device');
        return null;
      }

      // Check current permission status
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permission if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permission denied');
        return null;
      }

      // Get the Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      const pushToken = tokenData.data;

      // Save token to backend
      const sessionToken = await AsyncStorage.getItem('session_token');
      if (sessionToken && pushToken) {
        await fetch(`${API_URL}/api/auth/push-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({ push_token: pushToken }),
        });
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'Latence',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#C4A574',
        });
      }

      return pushToken;
    } catch (error) {
      console.error('Failed to register for push notifications:', error);
      return null;
    }
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
        loginWithApple,
        logout,
        refreshUser,
        refreshSubscription,
        checkFeatureAccess,
        checkUsageLimit,
        registerForPushNotifications,
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
