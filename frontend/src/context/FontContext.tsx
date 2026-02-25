import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Font from 'expo-font';
import {
  Caveat_400Regular,
  Caveat_500Medium,
  Caveat_600SemiBold,
  Caveat_700Bold,
} from '@expo-google-fonts/caveat';

interface FontContextType {
  fontsLoaded: boolean;
  handwritingFont: string;
}

const FontContext = createContext<FontContextType>({
  fontsLoaded: false,
  handwritingFont: 'System',
});

export const useFonts = () => useContext(FontContext);

export function FontProvider({ children }: { children: React.ReactNode }) {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'Caveat-Regular': Caveat_400Regular,
          'Caveat-Medium': Caveat_500Medium,
          'Caveat-SemiBold': Caveat_600SemiBold,
          'Caveat-Bold': Caveat_700Bold,
        });
        setFontsLoaded(true);
      } catch (e) {
        console.log('Error loading fonts:', e);
        setFontsLoaded(true); // Continue anyway with system font
      }
    }
    loadFonts();
  }, []);

  return (
    <FontContext.Provider value={{ fontsLoaded, handwritingFont: 'Caveat-Regular' }}>
      {children}
    </FontContext.Provider>
  );
}
