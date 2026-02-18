import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Theme modes: 'light' | 'dark' | 'silence'
export type ThemeMode = 'light' | 'dark' | 'silence';

// Light theme - Warm cozy candle-lit ambiance
export const lightTheme = {
  background: '#FAF6F0',        // Warm cream white
  card: '#FFFBF5',              // Soft white with warmth
  cardSelected: '#FFF8ED',      // Slightly warmer selected
  text: '#4A4036',              // Warm dark brown
  textSecondary: '#7D7164',     // Muted warm brown
  textMuted: '#A69E92',         // Light warm gray
  border: '#E8DFD4',            // Soft beige border
  accent: '#A8B89A',            // Soft sage green (nature)
  accentWarm: '#D4A574',        // Warm candle orange
  accentCandle: '#E8C4A0',      // Soft candle glow
  accentSoft: '#C9B896',        // Warm neutral
  inputBackground: '#FFFCF8',   // Very soft white
  headerBackground: '#FAF6F0',  // Same as background
  shadow: 'rgba(74, 64, 54, 0.08)',  // Soft warm shadow
  iconColor: '#8B7E6E',         // Warm icon color
  gradientStart: '#FAF6F0',     // For gradients
  gradientEnd: '#F5EDE3',       // Warmer end
};

// Dark theme - Cozy evening by candlelight
export const darkTheme = {
  background: '#1A1612',        // Warm dark brown
  card: '#251F1A',              // Slightly lighter warm dark
  cardSelected: '#2D2520',      // Warm selected state
  text: '#E8DED0',              // Warm off-white
  textSecondary: '#B8A898',     // Warm muted text
  textMuted: '#7A6E62',         // Very muted warm
  border: '#3A322A',            // Warm dark border
  accent: '#8B9A7D',            // Sage green
  accentWarm: '#D4A574',        // Candle flame orange
  accentCandle: '#C49660',      // Deep candle glow
  accentSoft: '#9A8A72',        // Soft warm accent
  inputBackground: '#2A231D',   // Dark input
  headerBackground: '#1A1612',  // Same as background
  shadow: 'rgba(0, 0, 0, 0.3)', // Dark shadow
  iconColor: '#B8A898',         // Warm icon
  gradientStart: '#1A1612',
  gradientEnd: '#252018',
};

// Silence theme - Gentle midnight, like a distant candle
export const silenceTheme = {
  background: '#0C0A08',        // Almost black with warmth
  card: '#141210',              // Very dark warm
  cardSelected: '#1A1814',      // Slightly lighter
  text: '#9A9080',              // Muted warm text
  textSecondary: '#6A6256',     // Very muted
  textMuted: '#4A443C',         // Barely visible
  border: '#1E1C18',            // Dark border
  accent: '#6A7A5C',            // Muted sage
  accentWarm: '#9A7A50',        // Dim candle
  accentCandle: '#8A6A40',      // Very dim candle
  accentSoft: '#6A5A48',        // Muted soft
  inputBackground: '#121010',   // Very dark input
  headerBackground: '#0C0A08',  // Same as background
  shadow: 'rgba(0, 0, 0, 0.5)', // Dark shadow
  iconColor: '#6A6256',         // Muted icon
  gradientStart: '#0C0A08',
  gradientEnd: '#100E0A',
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
