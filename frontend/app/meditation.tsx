import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../src/context/ThemeContext';
import { CandleFlame } from '../src/components/CandleFlame';
import { TwinklingStars } from '../src/components/TwinklingStars';

const { width, height } = Dimensions.get('window');

// Breathing patterns
const BREATHING_PATTERNS = {
  calm: { name: 'calm', inhale: 4, hold: 4, exhale: 6, holdOut: 2, color: '#8B9A7D' },
  energize: { name: 'energize', inhale: 4, hold: 0, exhale: 4, holdOut: 0, color: '#D4A574' },
  sleep: { name: 'sleep', inhale: 4, hold: 7, exhale: 8, holdOut: 0, color: '#6B7A9D' },
  focus: { name: 'focus', inhale: 4, hold: 4, exhale: 4, holdOut: 4, color: '#9D8B7A' },
};

export default function MeditationScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'inhale' | 'hold' | 'exhale' | 'holdOut'>('inhale');
  const [pattern, setPattern] = useState<keyof typeof BREATHING_PATTERNS>('calm');
  const [seconds, setSeconds] = useState(0);
  const [totalBreaths, setTotalBreaths] = useState(0);
  
  const breathScale = useSharedValue(0.6);
  const glowOpacity = useSharedValue(0.3);
  
  const currentPattern = BREATHING_PATTERNS[pattern];
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamic styles
  const ds = {
    container: { backgroundColor: theme.background },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    textMuted: { color: theme.textMuted },
    card: { backgroundColor: theme.card },
  };

  useEffect(() => {
    if (isActive) {
      startBreathingCycle();
    } else {
      stopBreathing();
    }
    return () => stopBreathing();
  }, [isActive, pattern]);

  const startBreathingCycle = () => {
    let phase: 'inhale' | 'hold' | 'exhale' | 'holdOut' = 'inhale';
    let phaseTime = 0;
    
    const runPhase = () => {
      const p = BREATHING_PATTERNS[pattern];
      
      switch (phase) {
        case 'inhale':
          setCurrentPhase('inhale');
          phaseTime = p.inhale * 1000;
          breathScale.value = withTiming(1.2, { duration: phaseTime, easing: Easing.inOut(Easing.ease) });
          glowOpacity.value = withTiming(0.6, { duration: phaseTime });
          break;
        case 'hold':
          setCurrentPhase('hold');
          phaseTime = p.hold * 1000;
          break;
        case 'exhale':
          setCurrentPhase('exhale');
          phaseTime = p.exhale * 1000;
          breathScale.value = withTiming(0.6, { duration: phaseTime, easing: Easing.inOut(Easing.ease) });
          glowOpacity.value = withTiming(0.3, { duration: phaseTime });
          break;
        case 'holdOut':
          setCurrentPhase('holdOut');
          phaseTime = p.holdOut * 1000;
          if (p.holdOut === 0) phaseTime = 100;
          break;
      }
      
      phaseTimerRef.current = setTimeout(() => {
        // Move to next phase
        if (phase === 'inhale') phase = p.hold > 0 ? 'hold' : 'exhale';
        else if (phase === 'hold') phase = 'exhale';
        else if (phase === 'exhale') {
          phase = p.holdOut > 0 ? 'holdOut' : 'inhale';
          if (p.holdOut === 0) setTotalBreaths(b => b + 1);
        }
        else if (phase === 'holdOut') {
          phase = 'inhale';
          setTotalBreaths(b => b + 1);
        }
        
        if (isActive) runPhase();
      }, phaseTime);
    };
    
    runPhase();
    
    // Session timer
    timerRef.current = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
  };

  const stopBreathing = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    breathScale.value = withTiming(0.6, { duration: 500 });
    glowOpacity.value = withTiming(0.3, { duration: 500 });
  };

  const toggleSession = () => {
    if (isActive) {
      setIsActive(false);
    } else {
      setSeconds(0);
      setTotalBreaths(0);
      setIsActive(true);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  const getPhaseText = () => {
    switch (currentPhase) {
      case 'inhale': return t('meditation.inhale');
      case 'hold': return t('meditation.hold');
      case 'exhale': return t('meditation.exhale');
      case 'holdOut': return t('meditation.hold_out');
    }
  };

  const breathCircleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={[styles.container, ds.container]}>
      <TwinklingStars starCount={40} minSize={1} maxSize={3} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-down" size={28} color={theme.iconColor} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <CandleFlame size="small" intensity="gentle" />
          <Text style={[styles.headerTitle, ds.text]}>{t('meditation.title')}</Text>
          <CandleFlame size="small" intensity="gentle" />
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Main breathing circle */}
      <View style={styles.breathContainer}>
        <Animated.View style={[styles.glowCircle, glowStyle, { backgroundColor: currentPattern.color }]} />
        <Animated.View style={[styles.breathCircle, breathCircleStyle, { borderColor: currentPattern.color }]}>
          <CandleFlame size="large" intensity={isActive ? 'bright' : 'gentle'} />
        </Animated.View>
        
        {isActive && (
          <Text style={[styles.phaseText, { color: currentPattern.color }]}>
            {getPhaseText()}
          </Text>
        )}
      </View>

      {/* Pattern selector */}
      <View style={styles.patternContainer}>
        <Text style={[styles.sectionTitle, ds.textMuted]}>{t('meditation.choose_rhythm')}</Text>
        <View style={styles.patterns}>
          {Object.entries(BREATHING_PATTERNS).map(([key, p]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.patternButton,
                pattern === key ? { backgroundColor: p.color } : { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }
              ]}
              onPress={() => setPattern(key as keyof typeof BREATHING_PATTERNS)}
            >
              <Text style={[styles.patternText, pattern === key ? { color: '#fff' } : ds.text]}>
                {t(`meditation.patterns.${p.name}`)}
              </Text>
              <Text style={[styles.patternTiming, pattern === key ? { color: 'rgba(255,255,255,0.7)' } : ds.textMuted]}>
                {p.inhale}-{p.hold}-{p.exhale}{p.holdOut > 0 ? `-${p.holdOut}` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Stats */}
      {(isActive || seconds > 0) && (
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, ds.card]}>
            <Text style={[styles.statValue, ds.text]}>{formatTime(seconds)}</Text>
            <Text style={[styles.statLabel, ds.textMuted]}>Durée</Text>
          </View>
          <View style={[styles.statCard, ds.card]}>
            <Text style={[styles.statValue, ds.text]}>{totalBreaths}</Text>
            <Text style={[styles.statLabel, ds.textMuted]}>Respirations</Text>
          </View>
        </View>
      )}

      {/* Control button */}
      <TouchableOpacity
        style={[styles.controlButton, { backgroundColor: isActive ? theme.card : currentPattern.color }]}
        onPress={toggleSession}
      >
        <Ionicons 
          name={isActive ? 'pause' : 'play'} 
          size={32} 
          color={isActive ? currentPattern.color : '#fff'} 
        />
        <Text style={[styles.controlText, { color: isActive ? currentPattern.color : '#fff' }]}>
          {isActive ? 'Pause' : 'Commencer'}
        </Text>
      </TouchableOpacity>

      {/* Instructions */}
      {!isActive && seconds === 0 && (
        <Text style={[styles.instructions, ds.textMuted]}>
          Trouve un endroit calme, ferme les yeux, et laisse-toi guider par le rythme de la flamme.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  backButton: { padding: 4 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 18, fontWeight: '600', letterSpacing: 1 },
  placeholder: { width: 36 },
  
  breathContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: -40 },
  glowCircle: { position: 'absolute', width: 250, height: 250, borderRadius: 125 },
  breathCircle: { 
    width: 180, 
    height: 180, 
    borderRadius: 90, 
    borderWidth: 2, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  phaseText: { position: 'absolute', bottom: 40, fontSize: 20, fontWeight: '500', letterSpacing: 2 },
  
  patternContainer: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' },
  patterns: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  patternButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, alignItems: 'center' },
  patternText: { fontSize: 14, fontWeight: '600' },
  patternTiming: { fontSize: 10, marginTop: 2 },
  
  statsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 20 },
  statCard: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '600' },
  statLabel: { fontSize: 11, marginTop: 4 },
  
  controlButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginHorizontal: 40, 
    marginBottom: 30, 
    paddingVertical: 16, 
    borderRadius: 30,
    gap: 10,
  },
  controlText: { fontSize: 16, fontWeight: '600' },
  
  instructions: { textAlign: 'center', paddingHorizontal: 40, marginBottom: 40, lineHeight: 22, fontStyle: 'italic' },
});
