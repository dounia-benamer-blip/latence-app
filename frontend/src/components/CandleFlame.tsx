import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

interface CandleFlameProps {
  size?: 'small' | 'medium' | 'large';
  intensity?: 'gentle' | 'normal' | 'bright';
}

export const CandleFlame: React.FC<CandleFlameProps> = ({ 
  size = 'medium',
  intensity = 'normal' 
}) => {
  const { theme, isDark } = useTheme();
  
  // Animation values
  const flicker = useSharedValue(0);
  const sway = useSharedValue(0);
  const glow = useSharedValue(0);

  // Size configurations
  const sizes = {
    small: { width: 8, height: 16, glowSize: 30 },
    medium: { width: 12, height: 24, glowSize: 50 },
    large: { width: 18, height: 36, glowSize: 80 },
  };

  // Intensity configurations
  const intensities = {
    gentle: { opacity: 0.6, glowOpacity: 0.15 },
    normal: { opacity: 0.85, glowOpacity: 0.25 },
    bright: { opacity: 1, glowOpacity: 0.4 },
  };

  const config = sizes[size];
  const intensityConfig = intensities[intensity];

  useEffect(() => {
    // Flicker animation - rapid small changes
    flicker.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 150, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.7, { duration: 100, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.9, { duration: 120, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.6, { duration: 80, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 130, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false
    );

    // Sway animation - gentle side to side
    sway.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.sin) }),
        withTiming(-1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.5, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        withTiming(-0.5, { duration: 850, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false
    );

    // Glow pulse
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.7, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true
    );
  }, []);

  // Flame body animation
  const flameStyle = useAnimatedStyle(() => {
    const scaleY = interpolate(flicker.value, [0, 1], [0.85, 1.1]);
    const scaleX = interpolate(flicker.value, [0, 1], [0.9, 1.05]);
    const translateX = interpolate(sway.value, [-1, 1], [-2, 2]);
    const rotate = interpolate(sway.value, [-1, 1], [-5, 5]);

    return {
      transform: [
        { scaleY },
        { scaleX },
        { translateX },
        { rotate: `${rotate}deg` },
      ],
      opacity: interpolate(flicker.value, [0, 1], [0.7, 1]) * intensityConfig.opacity,
    };
  });

  // Inner flame (brighter core)
  const innerFlameStyle = useAnimatedStyle(() => {
    const scaleY = interpolate(flicker.value, [0, 1], [0.7, 1]);
    return {
      transform: [{ scaleY }],
      opacity: interpolate(flicker.value, [0, 1], [0.8, 1]),
    };
  });

  // Glow animation
  const glowStyle = useAnimatedStyle(() => {
    const scale = interpolate(glow.value, [0, 1], [0.9, 1.2]);
    const opacity = interpolate(glow.value, [0, 1], [0.1, intensityConfig.glowOpacity]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  // Colors based on theme
  const flameOuter = isDark ? '#E8A050' : '#D4A574';
  const flameInner = isDark ? '#FFD080' : '#FFE4B5';
  const glowColor = isDark ? '#FF8C42' : '#D4A574';

  return (
    <View style={styles.container}>
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glow,
          glowStyle,
          {
            width: config.glowSize,
            height: config.glowSize,
            backgroundColor: glowColor,
            borderRadius: config.glowSize / 2,
          },
        ]}
      />
      
      {/* Outer flame */}
      <Animated.View
        style={[
          styles.flame,
          flameStyle,
          {
            width: config.width,
            height: config.height,
            backgroundColor: flameOuter,
            borderTopLeftRadius: config.width,
            borderTopRightRadius: config.width,
            borderBottomLeftRadius: config.width / 2,
            borderBottomRightRadius: config.width / 2,
          },
        ]}
      >
        {/* Inner flame (bright core) */}
        <Animated.View
          style={[
            styles.innerFlame,
            innerFlameStyle,
            {
              width: config.width * 0.5,
              height: config.height * 0.6,
              backgroundColor: flameInner,
              borderTopLeftRadius: config.width * 0.5,
              borderTopRightRadius: config.width * 0.5,
              borderBottomLeftRadius: config.width * 0.25,
              borderBottomRightRadius: config.width * 0.25,
            },
          ]}
        />
      </Animated.View>

      {/* Wick */}
      <View
        style={[
          styles.wick,
          {
            width: 2,
            height: 4,
            backgroundColor: isDark ? '#4A4036' : '#3A3026',
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  glow: {
    position: 'absolute',
    bottom: 0,
  },
  flame: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  innerFlame: {
    position: 'absolute',
    bottom: 4,
  },
  wick: {
    borderRadius: 1,
  },
});

export default CandleFlame;
