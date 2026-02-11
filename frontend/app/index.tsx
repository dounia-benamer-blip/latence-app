import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Platform,
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
import * as AppleAuthentication from 'expo-apple-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const MOODS = [
  { id: 'serein', label: 'Serein', icon: 'leaf-outline', color: '#8B9A7D' },
  { id: 'joyeux', label: 'Joyeux', icon: 'sunny-outline', color: '#D4A574' },
  { id: 'reveur', label: 'Rêveur', icon: 'cloud-outline', color: '#A8B4C4' },
  { id: 'melancolique', label: 'Mélancolique', icon: 'water-outline', color: '#9B8B7D' },
  { id: 'fatigue', label: 'Fatigué', icon: 'moon-outline', color: '#7D7D8B' },
  { id: 'inspire', label: 'Inspiré', icon: 'sparkles-outline', color: '#C4A88B' },
];

const ENERGY_LEVELS = [1, 2, 3, 4, 5];

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function WelcomeScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'auth' | 'mood' | 'energy'>('auth');
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [energyLevel, setEnergyLevel] = useState<number>(3);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const moonScale = useSharedValue(1);

  useEffect(() => {
    checkAuth();
    checkAppleAvailability();
    moonScale.value = withRepeat(
      withSequence(
        withSpring(1.05, { damping: 4 }),
        withSpring(1, { damping: 4 })
      ),
      -1,
      true
    );
  }, []);

  const checkAuth = async () => {
    const user = await AsyncStorage.getItem('user');
    if (user) {
      setIsLoggedIn(true);
      setStep('mood');
    }
  };

  const checkAppleAvailability = async () => {
    const available = await AppleAuthentication.isAvailableAsync();
    setIsAppleAvailable(available);
  };

  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      
      const userData = {
        id: credential.user,
        email: credential.email,
        firstName: credential.fullName?.givenName || '',
        lastName: credential.fullName?.familyName || '',
      };
      
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setIsLoggedIn(true);
      setStep('mood');
    } catch (e: any) {
      if (e.code !== 'ERR_CANCELED') {
        console.log('Apple Sign In error:', e);
      }
    }
  };

  const handleSkipAuth = async () => {
    await AsyncStorage.setItem('user', JSON.stringify({ guest: true }));
    setStep('mood');
  };

  const handleContinue = async () => {
    if (step === 'mood' && selectedMood) {
      setStep('energy');
    } else if (step === 'energy') {
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

  const moonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: moonScale.value }],
  }));

  const renderAuth = () => (
    <Animated.View entering={FadeIn.duration(800)} style={styles.authContainer}>
      <View style={styles.brandingContainer}>
        <Animated.View style={[styles.moonContainer, moonStyle]}>
          <Text style={styles.moonEmoji}>🌙</Text>
        </Animated.View>
        <Text style={styles.appName}>Latence</Text>
        <Text style={styles.byLine}>by Atelier Benamer</Text>
      </View>

      <View style={styles.authButtons}>
        {(isAppleAvailable || Platform.OS === 'web') && (
          <TouchableOpacity
            style={styles.appleButton}
            onPress={handleAppleSignIn}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-apple" size={20} color="#fff" />
            <Text style={styles.appleButtonText}>Continuer avec Apple</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkipAuth}
        >
          <Text style={styles.skipText}>Continuer en invité</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderMood = () => (
    <Animated.View entering={FadeIn.duration(600)} style={styles.moodContainer}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Bonsoir</Text>
        <Text style={styles.subtitle}>Comment te sens-tu ?</Text>
      </View>

      <View style={styles.moodGrid}>
        {[0, 1, 2].map((rowIndex) => (
          <View key={rowIndex} style={styles.moodRow}>
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
          </View>
        ))}
      </View>

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
  );

  const renderEnergy = () => (
    <Animated.View entering={FadeIn.duration(600)} style={styles.energyContainer}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Ton énergie</Text>
        <Text style={styles.subtitle}>Quel est ton niveau ?</Text>
      </View>

      <View style={styles.energyScale}>
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
      </View>

      <TouchableOpacity
        style={styles.continueButton}
        onPress={handleContinue}
        activeOpacity={0.8}
      >
        <Text style={styles.continueButtonText}>Commencer</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backLink}
        onPress={() => setStep('mood')}
      >
        <Text style={styles.backLinkText}>Retour</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === 'auth' && renderAuth()}
        {step === 'mood' && renderMood()}
        {step === 'energy' && renderEnergy()}
      </ScrollView>
    </Animated.View>
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
    justifyContent: 'center',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  brandingContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  moonContainer: {
    marginBottom: 24,
  },
  moonEmoji: {
    fontSize: 64,
  },
  appName: {
    fontSize: 42,
    fontWeight: '200',
    color: '#4A4A4A',
    letterSpacing: 8,
    marginBottom: 8,
  },
  byLine: {
    fontSize: 12,
    color: '#A0A090',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  authButtons: {
    width: '100%',
    gap: 16,
  },
  appleButton: {
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  appleButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  skipButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipText: {
    color: '#A0A090',
    fontSize: 14,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
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
  },
  moodContainer: {
    flex: 1,
    paddingTop: 60,
  },
  moodGrid: {
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
  energyContainer: {
    flex: 1,
    paddingTop: 60,
  },
  energyScale: {
    alignItems: 'center',
    marginBottom: 40,
  },
  energyRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  energyButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  energyButtonActive: {
    backgroundColor: '#8B9A7D',
  },
  energyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B8B7D',
  },
  energyTextActive: {
    color: '#fff',
  },
  energyLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  energyLabelText: {
    fontSize: 12,
    color: '#A0A090',
  },
  backLink: {
    alignItems: 'center',
    marginTop: 20,
    padding: 10,
  },
  backLinkText: {
    color: '#A0A090',
    fontSize: 13,
  },
});
