import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

interface TwinklingStarsProps {
  starCount?: number;
  minSize?: number;
  maxSize?: number;
  color?: string;
}

const StarComponent: React.FC<{ star: Star; color: string }> = ({ star, color }) => {
  const opacity = useSharedValue(0.2);

  useEffect(() => {
    opacity.value = withDelay(
      star.delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: star.duration, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.2, { duration: star.duration * 0.8, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.star,
        animatedStyle,
        {
          left: star.x,
          top: star.y,
          width: star.size,
          height: star.size,
          borderRadius: star.size / 2,
          backgroundColor: color,
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: star.size,
        },
      ]}
    />
  );
};

export const TwinklingStars: React.FC<TwinklingStarsProps> = ({
  starCount = 30,
  minSize = 1,
  maxSize = 3,
  color,
}) => {
  const { theme, isDark } = useTheme();
  
  // Only show stars in dark modes
  if (!isDark) return null;

  const starColor = color || (isDark ? '#FFE4B5' : theme.accentWarm);

  // Generate stars once
  const stars = useMemo(() => {
    return Array.from({ length: starCount }, (_, i) => ({
      id: i,
      x: Math.random() * SCREEN_WIDTH,
      y: Math.random() * SCREEN_HEIGHT * 0.6, // Top 60% of screen
      size: minSize + Math.random() * (maxSize - minSize),
      delay: Math.random() * 3000,
      duration: 1500 + Math.random() * 2000,
    }));
  }, [starCount, minSize, maxSize]);

  return (
    <View style={styles.container} pointerEvents="none">
      {stars.map((star) => (
        <StarComponent key={star.id} star={star} color={starColor} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  star: {
    position: 'absolute',
  },
});

export default TwinklingStars;
