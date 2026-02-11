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
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const MOODS = [
  { id: 'serein', label: 'Serein', icon: 'leaf-outline', color: '#8B9A7D' },
  { id: 'joyeux', label: 'Joyeux', icon: 'sunny-outline', color: '#D4A574' },
  { id: 'reveur', label: 'Rêveur', icon: 'cloud-outline', color: '#A8B4C4' },
  { id: 'melancolique', label: 'Mélancolique', icon: 'water-outline', color: '#9B8B7D' },
  { id: 'fatigue', label: 'Fatigué', icon: 'moon-outline', color: '#7D7D8B' },
  { id: 'inspire', label: 'Inspiré', icon: 'sparkles-outline', color: '#C4A88B' },
];

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function MoodScreen() {
  const router = useRouter();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const moonScale = useSharedValue(1);

  useEffect(() => {
    moonScale.value = withRepeat(
      withSequence(
        withSpring(1.05, { damping: 4 }),
        withSpring(1, { damping: 4 })
      ),
      -1,
      true
    );
  }, []);

  const moonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: moonScale.value }],
  }));

  const handleContinue = async () => {
    if (selectedMood) {
      try {
        await fetch(`${API_URL}/api/mood`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mood: selectedMood,
            energy_level: 3,
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
        {/* Header */}
        <Animated.View entering={FadeIn.duration(1200)} style={styles.header}>
          <Animated.View style={[styles.moonContainer, moonStyle]}>
            <Text style={styles.moonEmoji}>🌙</Text>
          </Animated.View>
          <Text style={styles.greeting}>Bonsoir</Text>
          <Text style={styles.subtitle}>Comment te sens-tu ce soir ?</Text>
        </Animated.View>

        {/* Mood Selection */}
        <View style={styles.moodContainer}>
          {[0, 1, 2].map((rowIndex) => (
            <Animated.View
              key={rowIndex}
              entering={FadeInUp.duration(600).delay(300 + rowIndex * 100)}
              style={styles.moodRow}
            >
              {MOODS.slice(rowIndex * 2, rowIndex * 2 + 2).map((mood) => (
                <TouchableOpacity
                  key={mood.id}
                  style={[
                    styles.moodCard,
                    selectedMood === mood.id && styles.moodCardSelected,
                  ]}
                  onPress={() => setSelectedMood(mood.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.moodIconContainer,
                      { backgroundColor: `${mood.color}20` },
                      selectedMood === mood.id && { backgroundColor: `${mood.color}40` },
                    ]}
                  >
                    <Ionicons
                      name={mood.icon as any}
                      size={24}
                      color={selectedMood === mood.id ? mood.color : '#8B8B7D'}
                    />
                  </View>
                  <Text
                    style={[
                      styles.moodLabel,
                      selectedMood === mood.id && { color: '#4A4A4A' },
                    ]}
                  >
                    {mood.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          ))}
        </View>

        {/* Continue Button */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(700)}
          style={styles.buttonContainer}
        >
          <TouchableOpacity
            style={[
              styles.continueButton,
              !selectedMood && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!selectedMood}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>Continuer</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Skip */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => router.push('/home')}
        >
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  moonContainer: {
    marginBottom: 24,
  },
  moonEmoji: {
    fontSize: 56,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '300',
    color: '#4A4A4A',
    letterSpacing: 2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#8B8B7D',
    letterSpacing: 0.5,
  },
  moodContainer: {
    marginBottom: 40,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  moodCard: {
    width: (width - 72) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  moodCardSelected: {
    backgroundColor: '#FDF9F3',
    borderWidth: 1,
    borderColor: '#D4C4A8',
  },
  moodIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  moodLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8B8B7D',
    letterSpacing: 0.3,
  },
  buttonContainer: {
    paddingHorizontal: 20,
  },
  continueButton: {
    backgroundColor: '#8B9A7D',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#D4D4C4',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 1,
  },
  skipButton: {
    alignItems: 'center',
    marginTop: 20,
    padding: 10,
  },
  skipText: {
    color: '#A0A090',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
