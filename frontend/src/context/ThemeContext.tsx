import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Theme modes: 'light' | 'dark' | 'silence'
export type ThemeMode = 'light' | 'dark' | 'silence';

// Light theme - elegant beige
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

// Dark theme - night mode
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

// Silence theme - AMOLED pure black, ultra gentle on eyes
export const silenceTheme = {
  background: '#000000',
  card: '#0A0A0A',
  cardSelected: '#141414',
  text: '#B8B0A4',        // Warm muted text, easy on eyes
  textSecondary: '#7A7468',
  textMuted: '#4A4640',
  border: '#1A1A1A',
  accent: '#6B7A5D',      // Very muted accent
  accentWarm: '#A88858',  // Dimmed warm accent
  inputBackground: '#0A0A0A',
  headerBackground: '#000000',
  shadow: '#000',
  iconColor: '#7A7468',
};

export type Theme = typeof lightTheme;

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  isDark: boolean;
  isSilence: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getThemeForMode = (mode: ThemeMode): Theme => {
  switch (mode) {
    case 'light': return lightTheme;
    case 'dark': return darkTheme;
    case 'silence': return silenceTheme;
    default: return lightTheme;
  }
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme_mode');
      if (savedTheme === 'dark' || savedTheme === 'silence' || savedTheme === 'light') {
        setThemeModeState(savedTheme as ThemeMode);
      }
    } catch (e) {
      console.log('Error loading theme:', e);
    }
  };

  // Cycle: light -> dark -> silence -> light
  const toggleTheme = async () => {
    let newMode: ThemeMode;
    if (themeMode === 'light') newMode = 'dark';
    else if (themeMode === 'dark') newMode = 'silence';
    else newMode = 'light';
    
    setThemeModeState(newMode);
    try {
      await AsyncStorage.setItem('theme_mode', newMode);
    } catch (e) {
      console.log('Error saving theme:', e);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem('theme_mode', mode);
    } catch (e) {
      console.log('Error saving theme:', e);
    }
  };

  const theme = getThemeForMode(themeMode);
  const isDark = themeMode === 'dark' || themeMode === 'silence';
  const isSilence = themeMode === 'silence';

  return (
    <ThemeContext.Provider value={{ theme, themeMode, isDark, isSilence, toggleTheme, setThemeMode }}>
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
