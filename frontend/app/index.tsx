import React, { useState, useEffect } from 'react';
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
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const MOODS = [
  { id: 'joyeux', label: 'Joyeux', icon: 'sunny', color: '#FFD700' },
  { id: 'calme', label: 'Calme', icon: 'leaf', color: '#4ECDC4' },
  { id: 'anxieux', label: 'Anxieux', icon: 'thunderstorm', color: '#9B59B6' },
  { id: 'triste', label: 'Triste', icon: 'rainy', color: '#3498DB' },
  { id: 'fatigue', label: 'Fatigué', icon: 'moon', color: '#7F8C8D' },
  { id: 'energique', label: 'Énergique', icon: 'flash', color: '#E74C3C' },
  { id: 'inspire', label: 'Inspiré', icon: 'sparkles', color: '#F39C12' },
  { id: 'confus', label: 'Confus', icon: 'help-circle', color: '#8E44AD' },
];

const ENERGY_LEVELS = [1, 2, 3, 4, 5];

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function MoodScreen() {
  const router = useRouter();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [energyLevel, setEnergyLevel] = useState<number>(3);
  const [step, setStep] = useState(1);

  const moonScale = useSharedValue(1);
  const starsOpacity = useSharedValue(0.5);

  useEffect(() => {
    moonScale.value = withRepeat(
      withSequence(
        withSpring(1.1, { damping: 2 }),
        withSpring(1, { damping: 2 })
      ),
      -1,
      true
    );
    starsOpacity.value = withRepeat(
      withSequence(
        withSpring(1, { damping: 2 }),
        withSpring(0.3, { damping: 2 })
      ),
      -1,
      true
    );
  }, []);

  const moonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: moonScale.value }],
  }));

  const handleMoodSelect = (moodId: string) => {
    setSelectedMood(moodId);
  };

  const handleContinue = async () => {
    if (step === 1 && selectedMood) {
      setStep(2);
    } else if (step === 2) {
      try {
        await fetch(`${API_URL}/api/mood`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mood: selectedMood,
            energy_level: energyLevel,
          }),
        });
      } catch (e) {
        console.log('Could not save mood:', e);
      }
      router.push('/home');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Moon */}
        <Animated.View entering={FadeIn.duration(1000)} style={styles.header}>
          <Animated.View style={[styles.moonContainer, moonStyle]}>
            <Text style={styles.moonEmoji}>🌙</Text>
          </Animated.View>
          <Text style={styles.greeting}>Bonsoir, voyageur</Text>
          <Text style={styles.subtitle}>
            {step === 1
              ? 'Comment te sens-tu ce soir ?'
              : "Quel est ton niveau d'énergie ?"}
          </Text>
        </Animated.View>

        {step === 1 ? (
          /* Mood Selection */
          <Animated.View
            entering={FadeInUp.duration(600).delay(300)}
            style={styles.moodContainer}
          >
            <View style={styles.moodRow}>
              {MOODS.slice(0, 2).map((mood, index) => (
                <TouchableOpacity
                  key={mood.id}
                  style={[
                    styles.moodCard,
                    selectedMood === mood.id && {
                      borderColor: mood.color,
                      backgroundColor: `${mood.color}20`,
                    },
                  ]}
                  onPress={() => handleMoodSelect(mood.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.moodIconContainer,
                      { backgroundColor: `${mood.color}30` },
                    ]}
                  >
                    <Ionicons
                      name={mood.icon as any}
                      size={28}
                      color={mood.color}
                    />
                  </View>
                  <Text style={styles.moodLabel}>{mood.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.moodRow}>
              {MOODS.slice(2, 4).map((mood, index) => (
                <TouchableOpacity
                  key={mood.id}
                  style={[
                    styles.moodCard,
                    selectedMood === mood.id && {
                      borderColor: mood.color,
                      backgroundColor: `${mood.color}20`,
                    },
                  ]}
                  onPress={() => handleMoodSelect(mood.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.moodIconContainer,
                      { backgroundColor: `${mood.color}30` },
                    ]}
                  >
                    <Ionicons
                      name={mood.icon as any}
                      size={28}
                      color={mood.color}
                    />
                  </View>
                  <Text style={styles.moodLabel}>{mood.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.moodRow}>
              {MOODS.slice(4, 6).map((mood, index) => (
                <TouchableOpacity
                  key={mood.id}
                  style={[
                    styles.moodCard,
                    selectedMood === mood.id && {
                      borderColor: mood.color,
                      backgroundColor: `${mood.color}20`,
                    },
                  ]}
                  onPress={() => handleMoodSelect(mood.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.moodIconContainer,
                      { backgroundColor: `${mood.color}30` },
                    ]}
                  >
                    <Ionicons
                      name={mood.icon as any}
                      size={28}
                      color={mood.color}
                    />
                  </View>
                  <Text style={styles.moodLabel}>{mood.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.moodRow}>
              {MOODS.slice(6, 8).map((mood, index) => (
                <TouchableOpacity
                  key={mood.id}
                  style={[
                    styles.moodCard,
                    selectedMood === mood.id && {
                      borderColor: mood.color,
                      backgroundColor: `${mood.color}20`,
                    },
                  ]}
                  onPress={() => handleMoodSelect(mood.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.moodIconContainer,
                      { backgroundColor: `${mood.color}30` },
                    ]}
                  >
                    <Ionicons
                      name={mood.icon as any}
                      size={28}
                      color={mood.color}
                    />
                  </View>
                  <Text style={styles.moodLabel}>{mood.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        ) : (
          /* Energy Level Selection */
          <Animated.View
            entering={FadeInUp.duration(600)}
            style={styles.energyContainer}
          >
            <Text style={styles.energyTitle}>Niveau d'énergie</Text>
            <View style={styles.energyRow}>
              {ENERGY_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.energyButton,
                    energyLevel === level && styles.energyButtonActive,
                  ]}
                  onPress={() => setEnergyLevel(level)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.energyText,
                      energyLevel === level && styles.energyTextActive,
                    ]}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.energyLabels}>
              <Text style={styles.energyLabelText}>Épuisé</Text>
              <Text style={styles.energyLabelText}>Plein d'énergie</Text>
            </View>
          </Animated.View>
        )}

        {/* Continue Button */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(500)}
          style={styles.buttonContainer}
        >
          <TouchableOpacity
            style={[
              styles.continueButton,
              (!selectedMood && step === 1) && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!selectedMood && step === 1}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>
              {step === 1 ? 'Continuer' : 'Commencer le voyage'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        {/* Skip option */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => router.push('/home')}
        >
          <Text style={styles.skipText}>Passer cette étape</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  moonContainer: {
    marginBottom: 20,
  },
  moonEmoji: {
    fontSize: 60,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#a0a0c0',
    textAlign: 'center',
  },
  moodContainer: {
    marginBottom: 30,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  moodCard: {
    width: 150,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    marginHorizontal: 6,
  },
  moodIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  moodLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  energyContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  energyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 20,
  },
  energyRow: {
    flexDirection: 'row',
    gap: 12,
  },
  energyButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2a2a4e',
  },
  energyButtonActive: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  energyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#a0a0c0',
  },
  energyTextActive: {
    color: '#fff',
  },
  energyLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    marginTop: 12,
  },
  energyLabelText: {
    fontSize: 12,
    color: '#6a6a8a',
  },
  buttonContainer: {
    paddingHorizontal: 20,
  },
  continueButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 16,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  continueButtonDisabled: {
    backgroundColor: '#3a3a5e',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    marginTop: 20,
    padding: 10,
  },
  skipText: {
    color: '#6a6a8a',
    fontSize: 14,
  },
});
