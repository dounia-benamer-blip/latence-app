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

interface MoonGlowProps {
  size?: number;
  phase?: 'new' | 'crescent' | 'quarter' | 'gibbous' | 'full';
  color?: string;
  glowColor?: string;
  showParticles?: boolean;
}

export const MoonGlow: React.FC<MoonGlowProps> = ({
  size = 120,
  phase = 'full',
  color = '#F5E6D3',
  glowColor = 'rgba(245, 230, 211, 0.3)',
  showParticles = true,
}) => {
  const pulse = useSharedValue(0);
  const rotate = useSharedValue(0);
  const particle1 = useSharedValue(0);
  const particle2 = useSharedValue(0);
  const particle3 = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    rotate.value = withRepeat(
      withTiming(360, { duration: 60000, easing: Easing.linear }),
      -1,
      false
    );

    particle1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 0 })
      ),
      -1,
      false
    );

    particle2.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1000 }),
        withTiming(1, { duration: 3000, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 0 })
      ),
      -1,
      false
    );

    particle3.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 2000 }),
        withTiming(1, { duration: 3000, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 0 })
      ),
      -1,
      false
    );
  }, []);

  const moonStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(pulse.value, [0, 1], [1, 1.05]) },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.4, 0.7]),
    transform: [
      { scale: interpolate(pulse.value, [0, 1], [1, 1.2]) },
    ],
  }));

  const outerGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.2, 0.4]),
    transform: [
      { scale: interpolate(pulse.value, [0, 1], [1, 1.3]) },
    ],
  }));

  const createParticleStyle = (particleValue: Animated.SharedValue<number>, angle: number) => 
    useAnimatedStyle(() => ({
      opacity: interpolate(particleValue.value, [0, 0.5, 1], [0, 1, 0]),
      transform: [
        { translateX: interpolate(particleValue.value, [0, 1], [0, Math.cos(angle) * (size * 0.8)]) },
        { translateY: interpolate(particleValue.value, [0, 1], [0, Math.sin(angle) * (size * 0.8)]) },
        { scale: interpolate(particleValue.value, [0, 0.5, 1], [0.5, 1, 0.3]) },
      ],
    }));

  const particle1Style = createParticleStyle(particle1, -Math.PI / 4);
  const particle2Style = createParticleStyle(particle2, Math.PI / 3);
  const particle3Style = createParticleStyle(particle3, Math.PI);

  const getMoonMask = () => {
    switch (phase) {
      case 'new':
        return { width: size * 0.95, left: 0 };
      case 'crescent':
        return { width: size * 0.7, left: size * 0.15 };
      case 'quarter':
        return { width: size * 0.5, left: size * 0.25 };
      case 'gibbous':
        return { width: size * 0.25, left: size * 0.6 };
      case 'full':
      default:
        return { width: 0, left: 0 };
    }
  };

  const maskStyle = getMoonMask();

  return (
    <View style={[styles.container, { width: size * 2, height: size * 2 }]}>
      {/* Outer glow */}
      <Animated.View
        style={[
          styles.glow,
          outerGlowStyle,
          {
            width: size * 1.8,
            height: size * 1.8,
            borderRadius: size * 0.9,
            backgroundColor: glowColor,
          },
        ]}
      />
      
      {/* Inner glow */}
      <Animated.View
        style={[
          styles.glow,
          glowStyle,
          {
            width: size * 1.4,
            height: size * 1.4,
            borderRadius: size * 0.7,
            backgroundColor: glowColor,
          },
        ]}
      />

      {/* Moon body */}
      <Animated.View
        style={[
          styles.moon,
          moonStyle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
        ]}
      >
        {/* Phase shadow mask */}
        {phase !== 'full' && (
          <View
            style={[
              styles.mask,
              {
                width: maskStyle.width,
                height: size,
                left: maskStyle.left,
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                borderRadius: size / 2,
              },
            ]}
          />
        )}
        
        {/* Moon surface details (craters) */}
        <View style={[styles.crater, { top: size * 0.2, left: size * 0.25, width: size * 0.12, height: size * 0.12, opacity: 0.15 }]} />
        <View style={[styles.crater, { top: size * 0.5, left: size * 0.6, width: size * 0.08, height: size * 0.08, opacity: 0.1 }]} />
        <View style={[styles.crater, { top: size * 0.65, left: size * 0.35, width: size * 0.15, height: size * 0.15, opacity: 0.12 }]} />
      </Animated.View>

      {/* Floating particles */}
      {showParticles && (
        <>
          <Animated.View style={[styles.particle, particle1Style, { backgroundColor: color }]} />
          <Animated.View style={[styles.particle, particle2Style, { backgroundColor: color }]} />
          <Animated.View style={[styles.particle, particle3Style, { backgroundColor: color }]} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
  },
  moon: {
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#FFF8E7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  mask: {
    position: 'absolute',
    top: 0,
  },
  crater: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: '#000',
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

export default MoonGlow;
