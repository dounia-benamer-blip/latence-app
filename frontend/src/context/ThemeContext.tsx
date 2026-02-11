import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Theme colors
export const lightTheme = {
  background: '#F5F0E8',
  card: '#FFFFFF',
  cardSelected: '#FDF9F3',
  text: '#4A4A4A',
  textSecondary: '#8B8B7D',
  textMuted: '#A0A090',
  border: '#D4C4A8',
  accent: '#8B9A7D',
  accentWarm: '#D4A574',
  inputBackground: '#FFFFFF',
  headerBackground: '#F5F0E8',
  shadow: '#000',
  iconColor: '#6B6B5B',
};

export const darkTheme = {
  background: '#0D1117',
  card: '#161B22',
  cardSelected: '#1C2128',
  text: '#E8E0D4',
  textSecondary: '#A8A090',
  textMuted: '#6B6B5B',
  border: '#30363D',
  accent: '#8B9A7D',
  accentWarm: '#D4A574',
  inputBackground: '#21262D',
  headerBackground: '#0D1117',
  shadow: '#000',
  iconColor: '#A8A090',
};

export type Theme = typeof lightTheme;

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme_mode');
      if (savedTheme === 'dark') {
        setIsDark(true);
      }
    } catch (e) {
      console.log('Error loading theme:', e);
    }
  };

  const toggleTheme = async () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    try {
      await AsyncStorage.setItem('theme_mode', newIsDark ? 'dark' : 'light');
    } catch (e) {
      console.log('Error saving theme:', e);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
