import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  FadeIn, 
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import { TwinklingStars } from '../src/components/TwinklingStars';
import { Audio } from 'expo-av';

const { width } = Dimensions.get('window');

interface Sound {
  id: string;
  name: string;
  icon: string;
  color: string;
  url: string;
}

// Sons d'ambiance avec URLs fonctionnelles (Pixabay CDN - royalty free)
const AMBIENT_SOUNDS: Sound[] = [
  { id: 'rain', name: 'Pluie', icon: 'rainy-outline', color: '#5C6BC0', url: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_5379687f43.mp3' },
  { id: 'fire', name: 'Feu', icon: 'flame-outline', color: '#FF7043', url: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_c2d3b9ecbf.mp3' },
  { id: 'forest', name: 'Forêt', icon: 'leaf-outline', color: '#66BB6A', url: 'https://cdn.pixabay.com/download/audio/2022/02/23/audio_e9b68a5e28.mp3' },
  { id: 'waves', name: 'Vagues', icon: 'water-outline', color: '#42A5F5', url: 'https://cdn.pixabay.com/download/audio/2022/03/17/audio_de6e6ba3b2.mp3' },
  { id: 'wind', name: 'Vent', icon: 'cloudy-outline', color: '#78909C', url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_79ea0319e7.mp3' },
  { id: 'night', name: 'Nuit', icon: 'moon-outline', color: '#7E57C2', url: 'https://cdn.pixabay.com/download/audio/2021/09/07/audio_76e18fd6d2.mp3' },
];

interface BreathingExercise {
  id: string;
  name: string;
  description: string;
  inhale: number;
  hold: number;
  exhale: number;
  holdAfter?: number;
  cycles: number;
  color: string;
}

const BREATHING_EXERCISES: BreathingExercise[] = [
  { id: 'relaxing', name: 'Relaxation 4-7-8', description: 'Calme le système nerveux', inhale: 4, hold: 7, exhale: 8, cycles: 4, color: '#5C6BC0' },
  { id: 'coherence', name: 'Cohérence cardiaque', description: 'Équilibre cœur-cerveau', inhale: 5, hold: 0, exhale: 5, cycles: 6, color: '#66BB6A' },
  { id: 'box', name: 'Respiration carrée', description: 'Focus et concentration', inhale: 4, hold: 4, exhale: 4, holdAfter: 4, cycles: 4, color: '#FF7043' },
  { id: 'energizing', name: 'Énergisante', description: 'Boost d\'énergie', inhale: 3, hold: 0, exhale: 3, cycles: 10, color: '#FFCA28' },
];

export default function AmbientScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [breathingActive, setBreathingActive] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<BreathingExercise | null>(null);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale' | 'holdAfter'>('inhale');
  const [cycleCount, setCycleCount] = useState(0);
  const [countdown, setCountdown] = useState(0);
  
  const breathScale = useSharedValue(1);
  const breathOpacity = useSharedValue(0.3);

  const ds = {
    container: { backgroundColor: theme.background },
    card: { backgroundColor: theme.card },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    textMuted: { color: theme.textMuted },
  };

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const toggleSound = async (s: Sound) => {
    if (activeSound === s.id) {
      // Stop current sound
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }
      setActiveSound(null);
    } else {
      // Stop previous sound if any
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }
      
      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: s.url },
          { shouldPlay: true, isLooping: true, volume: 0.7 }
        );
        setSound(newSound);
        setActiveSound(s.id);
      } catch (e) {
        console.log('Error playing sound:', e);
      }
    }
  };

  const startBreathing = (exercise: BreathingExercise) => {
    setCurrentExercise(exercise);
    setBreathingActive(true);
    setCycleCount(0);
    setBreathPhase('inhale');
    setCountdown(exercise.inhale);
    runBreathCycle(exercise, 'inhale', 0);
  };

  const stopBreathing = () => {
    setBreathingActive(false);
    setCurrentExercise(null);
    breathScale.value = withTiming(1, { duration: 300 });
    breathOpacity.value = withTiming(0.3, { duration: 300 });
  };

  const runBreathCycle = (exercise: BreathingExercise, phase: 'inhale' | 'hold' | 'exhale' | 'holdAfter', cycle: number) => {
    if (cycle >= exercise.cycles) {
      stopBreathing();
      return;
    }

    let duration = 0;
    let nextPhase: 'inhale' | 'hold' | 'exhale' | 'holdAfter' = 'inhale';
    let nextCycle = cycle;

    switch (phase) {
      case 'inhale':
        duration = exercise.inhale;
        breathScale.value = withTiming(1.5, { duration: duration * 1000, easing: Easing.inOut(Easing.ease) });
        breathOpacity.value = withTiming(0.8, { duration: duration * 1000 });
        nextPhase = exercise.hold > 0 ? 'hold' : 'exhale';
        break;
      case 'hold':
        duration = exercise.hold;
        nextPhase = 'exhale';
        break;
      case 'exhale':
        duration = exercise.exhale;
        breathScale.value = withTiming(1, { duration: duration * 1000, easing: Easing.inOut(Easing.ease) });
        breathOpacity.value = withTiming(0.3, { duration: duration * 1000 });
        nextPhase = exercise.holdAfter ? 'holdAfter' : 'inhale';
        nextCycle = exercise.holdAfter ? cycle : cycle + 1;
        break;
      case 'holdAfter':
        duration = exercise.holdAfter || 0;
        nextPhase = 'inhale';
        nextCycle = cycle + 1;
        break;
    }

    setBreathPhase(phase);
    setCountdown(duration);

    // Countdown timer
    let count = duration;
    const timer = setInterval(() => {
      count--;
      if (count >= 0) {
        setCountdown(count);
      }
    }, 1000);

    setTimeout(() => {
      clearInterval(timer);
      if (breathingActive || phase !== 'inhale') {
        setCycleCount(nextCycle);
        runBreathCycle(exercise, nextPhase, nextCycle);
      }
    }, duration * 1000);
  };

  const breathAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathScale.value }],
    opacity: breathOpacity.value,
  }));

  const getPhaseText = () => {
    switch (breathPhase) {
      case 'inhale': return 'Inspire';
      case 'hold': return 'Retiens';
      case 'exhale': return 'Expire';
      case 'holdAfter': return 'Pause';
    }
  };

  return (
    <SafeAreaView style={[styles.container, ds.container]}>
      <TwinklingStars density={isDark ? 30 : 15} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-down" size={28} color={theme.iconColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, ds.text]}>Ambiance & Respiration</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Breathing Exercise Active */}
        {breathingActive && currentExercise && (
          <Animated.View entering={FadeIn.duration(500)} style={styles.breathingActiveContainer}>
            <TouchableOpacity style={styles.closeBreathing} onPress={stopBreathing}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
            
            <Text style={[styles.exerciseName, ds.text]}>{currentExercise.name}</Text>
            
            <View style={styles.breathCircleContainer}>
              <Animated.View style={[styles.breathCircle, { backgroundColor: currentExercise.color }, breathAnimatedStyle]} />
              <View style={styles.breathTextContainer}>
                <Text style={styles.breathPhase}>{getPhaseText()}</Text>
                <Text style={styles.breathCountdown}>{countdown}</Text>
              </View>
            </View>
            
            <Text style={[styles.cycleCounter, ds.textMuted]}>
              Cycle {cycleCount + 1} / {currentExercise.cycles}
            </Text>
          </Animated.View>
        )}

        {/* Ambient Sounds */}
        {!breathingActive && (
          <>
            <Animated.View entering={FadeInUp.duration(500)}>
              <Text style={[styles.sectionTitle, ds.text]}>Sons d'ambiance</Text>
              <Text style={[styles.sectionSubtitle, ds.textMuted]}>Crée ton atmosphère parfaite</Text>
              
              <View style={styles.soundsGrid}>
                {AMBIENT_SOUNDS.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.soundCard,
                      ds.card,
                      activeSound === s.id && { backgroundColor: s.color }
                    ]}
                    onPress={() => toggleSound(s)}
                  >
                    <Ionicons name={s.icon as any} size={32} color={activeSound === s.id ? '#fff' : s.color} />
                    <Text style={[styles.soundName, activeSound === s.id ? { color: '#fff' } : ds.text]}>
                      {s.name}
                    </Text>
                    {activeSound === s.id && (
                      <View style={styles.playingIndicator}>
                        <Ionicons name="volume-high" size={16} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>

            {/* Breathing Exercises */}
            <Animated.View entering={FadeInUp.duration(500).delay(200)}>
              <Text style={[styles.sectionTitle, ds.text, { marginTop: 32 }]}>Exercices de respiration</Text>
              <Text style={[styles.sectionSubtitle, ds.textMuted]}>Respire en conscience</Text>
              
              {BREATHING_EXERCISES.map((ex, i) => (
                <TouchableOpacity
                  key={ex.id}
                  style={[styles.exerciseCard, ds.card]}
                  onPress={() => startBreathing(ex)}
                >
                  <View style={[styles.exerciseIcon, { backgroundColor: `${ex.color}20` }]}>
                    <View style={[styles.exerciseDot, { backgroundColor: ex.color }]} />
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text style={[styles.exerciseTitle, ds.text]}>{ex.name}</Text>
                    <Text style={[styles.exerciseDesc, ds.textSecondary]}>{ex.description}</Text>
                    <Text style={[styles.exerciseTiming, ds.textMuted]}>
                      {ex.inhale}s - {ex.hold > 0 ? `${ex.hold}s - ` : ''}{ex.exhale}s{ex.holdAfter ? ` - ${ex.holdAfter}s` : ''} × {ex.cycles}
                    </Text>
                  </View>
                  <Ionicons name="play-circle" size={32} color={ex.color} />
                </TouchableOpacity>
              ))}
            </Animated.View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  sectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 4 },
  sectionSubtitle: { fontSize: 14, marginBottom: 16 },
  
  soundsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  soundCard: { width: (width - 64) / 3, aspectRatio: 1, borderRadius: 20, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  soundName: { fontSize: 12, textAlign: 'center', marginTop: 8 },
  playingIndicator: { position: 'absolute', top: 8, right: 8 },
  
  exerciseCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12 },
  exerciseIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  exerciseDot: { width: 16, height: 16, borderRadius: 8 },
  exerciseInfo: { flex: 1, marginLeft: 14 },
  exerciseTitle: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  exerciseDesc: { fontSize: 13, marginBottom: 4 },
  exerciseTiming: { fontSize: 12 },
  
  breathingActiveContainer: { alignItems: 'center', paddingVertical: 40 },
  closeBreathing: { position: 'absolute', top: 0, right: 0, padding: 10 },
  exerciseName: { fontSize: 24, fontWeight: '600', marginBottom: 40 },
  breathCircleContainer: { width: 200, height: 200, justifyContent: 'center', alignItems: 'center' },
  breathCircle: { position: 'absolute', width: 200, height: 200, borderRadius: 100 },
  breathTextContainer: { alignItems: 'center' },
  breathPhase: { fontSize: 24, fontWeight: '300', color: '#fff', marginBottom: 8 },
  breathCountdown: { fontSize: 64, fontWeight: '700', color: '#fff' },
  cycleCounter: { marginTop: 40, fontSize: 16 },
});
