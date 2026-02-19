import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  useWindowDimensions,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import * as AppleAuthentication from 'expo-apple-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, ThemeMode } from '../src/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../src/context/LanguageContext';

// Get icon name for theme toggle
const getThemeIcon = (mode: ThemeMode): string => {
  switch (mode) {
    case 'light': return 'moon-outline';
    case 'dark': return 'eye-outline';
    case 'silence': return 'sunny-outline';
    default: return 'moon-outline';
  }
};

const ENERGY_LEVELS = [1, 2, 3, 4, 5];

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// Language options (French and English only)
const LANGUAGES = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const { theme, themeMode, isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { width } = useWindowDimensions();
  const [step, setStep] = useState<'auth' | 'mood' | 'energy' | 'wisdom'>('auth');
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [energyLevel, setEnergyLevel] = useState<number>(3);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sacredText, setSacredText] = useState<{ text: string; source: string } | null>(null);
  const [isLoadingText, setIsLoadingText] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  // Moods with translation keys
  const MOODS = useMemo(() => [
    { id: 'serein', labelKey: 'moods.serein', icon: 'leaf-outline', color: '#8B9A7D' },
    { id: 'joyeux', labelKey: 'moods.joyeux', icon: 'sunny-outline', color: '#D4A574' },
    { id: 'reveur', labelKey: 'moods.reveur', icon: 'cloud-outline', color: '#A8B4C4' },
    { id: 'melancolique', labelKey: 'moods.melancolique', icon: 'rainy-outline', color: '#9B8B7D' },
    { id: 'fatigue', labelKey: 'moods.fatigue', icon: 'moon-outline', color: '#7D7D8B' },
    { id: 'inspire', labelKey: 'moods.inspire', icon: 'sparkles-outline', color: '#C4A88B' },
    { id: 'anxieux', labelKey: 'moods.anxieux', icon: 'water-outline', color: '#8B9AAA' },
    { id: 'nostalgique', labelKey: 'moods.nostalgique', icon: 'time-outline', color: '#B8A090' },
    { id: 'perdu', labelKey: 'moods.perdu', icon: 'compass-outline', color: '#A0A0A0' },
    { id: 'reconnaissant', labelKey: 'moods.reconnaissant', icon: 'heart-outline', color: '#9AAD8B' },
    { id: 'contemplatif', labelKey: 'moods.contemplatif', icon: 'eye-outline', color: '#C4B4D4' },
    { id: 'eveille', labelKey: 'moods.eveille', icon: 'flash-outline', color: '#B4A48B' },
  ], []);

  // Poetic greetings based on time of day (translated)
  const getPoeticalGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return { greeting: t('welcome.greeting_morning'), question: t('welcome.question_morning') };
    } else if (hour >= 12 && hour < 17) {
      return { greeting: t('welcome.greeting_afternoon'), question: t('welcome.question_afternoon') };
    } else if (hour >= 17 && hour < 21) {
      return { greeting: t('welcome.greeting_evening'), question: t('welcome.question_evening') };
    } else {
      return { greeting: t('welcome.greeting_night'), question: t('welcome.question_night') };
    }
  };

  const poeticGreeting = getPoeticalGreeting();

  useEffect(() => {
    checkAuth();
    checkAppleAvailability();
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

  const fetchSacredText = async (mood: string) => {
    setIsLoadingText(true);
    try {
      const res = await fetch(`${API_URL}/api/sacred-text/${mood}?lang=${language}`);
      if (res.ok) {
        const data = await res.json();
        setSacredText(data);
      }
    } catch (e) {
      console.log('Error fetching sacred text:', e);
    } finally {
      setIsLoadingText(false);
    }
  };

  const handleMoodContinue = async () => {
    if (selectedMood) {
      setStep('energy');
    }
  };

  const handleEnergyContinue = async () => {
    await fetchSacredText(selectedMood!);
    setStep('wisdom');
  };

  const handleFinish = async () => {
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
  };

  const handleLanguageSelect = (langCode: string) => {
    setLanguage(langCode);
    setShowLanguageModal(false);
  };

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  // Dynamic styles based on theme
  const dynamicStyles = {
    container: { backgroundColor: theme.background },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    textMuted: { color: theme.textMuted },
    card: { backgroundColor: theme.card },
    cardSelected: { backgroundColor: theme.cardSelected, borderColor: theme.border },
  };

  const renderLanguageModal = () => (
    <Modal
      visible={showLanguageModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowLanguageModal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={() => setShowLanguageModal(false)}
      >
        <View style={[styles.languageModal, dynamicStyles.card]}>
          <Text style={[styles.languageModalTitle, dynamicStyles.text]}>{t('common.language')}</Text>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageOption,
                language === lang.code && styles.languageOptionActive,
              ]}
              onPress={() => handleLanguageSelect(lang.code)}
            >
              <Text style={styles.languageFlag}>{lang.flag}</Text>
              <Text style={[styles.languageOptionText, dynamicStyles.text]}>{lang.name}</Text>
              {language === lang.code && (
                <Ionicons name="checkmark" size={20} color={theme.accent} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderAuth = () => (
    <Animated.View entering={FadeIn.duration(800)} style={styles.authContainer}>
      {/* Language Selector */}
      <TouchableOpacity 
        style={[styles.languageSelector, dynamicStyles.card]}
        onPress={() => setShowLanguageModal(true)}
      >
        <Text style={styles.languageFlag}>{currentLang.flag}</Text>
        <Text style={[styles.languageCode, dynamicStyles.text]}>{currentLang.code.toUpperCase()}</Text>
        <Ionicons name="chevron-down" size={14} color={theme.textMuted} />
      </TouchableOpacity>

      {/* Theme Toggle */}
      <TouchableOpacity 
        style={[styles.themeToggle, dynamicStyles.card]}
        onPress={toggleTheme}
      >
        <Ionicons 
          name={getThemeIcon(themeMode) as any} 
          size={20} 
          color={theme.accentWarm} 
        />
      </TouchableOpacity>

      <View style={styles.brandingContainer}>
        <Text style={[styles.appName, dynamicStyles.text]}>Latence</Text>
        <Text style={[styles.byLine, dynamicStyles.textMuted]}>by Atelier Benamer</Text>
      </View>

      <View style={styles.authButtons}>
        {(isAppleAvailable || Platform.OS === 'web') && (
          <TouchableOpacity
            style={[styles.appleButton, isDark && styles.appleButtonDark]}
            onPress={handleAppleSignIn}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-apple" size={20} color={isDark ? '#000' : '#fff'} />
            <Text style={[styles.appleButtonText, isDark && styles.appleButtonTextDark]}>
              {t('auth.continue_apple')}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkipAuth}
        >
          <Text style={[styles.skipText, dynamicStyles.textMuted]}>{t('auth.continue_guest')}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderMood = () => (
    <Animated.View entering={FadeIn.duration(600)} style={styles.moodContainer}>
      {/* Theme Toggle */}
      <TouchableOpacity 
        style={[styles.themeToggleTop, dynamicStyles.card]}
        onPress={toggleTheme}
      >
        <Ionicons 
          name={getThemeIcon(themeMode) as any} 
          size={18} 
          color={theme.accentWarm} 
        />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={[styles.greeting, dynamicStyles.text]}>{poeticGreeting.greeting}</Text>
        <Text style={[styles.poeticQuestion, dynamicStyles.textSecondary]}>{poeticGreeting.question}</Text>
      </View>

      <View style={styles.moodGrid}>
        {Array.from({ length: Math.ceil(MOODS.length / 2) }, (_, rowIndex) => (
          <View key={rowIndex} style={styles.moodRow} data-testid={`mood-row-${rowIndex}`}>
            {MOODS.slice(rowIndex * 2, rowIndex * 2 + 2).map((mood) => (
              <TouchableOpacity
                key={mood.id}
                data-testid={`mood-card-${mood.id}`}
                style={[
                  styles.moodCard,
                  { flex: 1 },
                  dynamicStyles.card,
                  selectedMood === mood.id && dynamicStyles.cardSelected,
                  selectedMood === mood.id && { borderWidth: 1.5, borderColor: theme.accentWarm },
                ]}
                onPress={() => setSelectedMood(mood.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.moodIconContainer,
                    { backgroundColor: isDark ? `${theme.accentWarm}15` : `${mood.color}12` },
                    selectedMood === mood.id && { backgroundColor: `${theme.accentWarm}25` },
                  ]}
                >
                  <Ionicons 
                    name={mood.icon as any} 
                    size={24} 
                    color={selectedMood === mood.id ? theme.accentWarm : (isDark ? theme.accentWarm : mood.color)} 
                  />
                </View>
                <Text
                  style={[
                    styles.moodLabel,
                    dynamicStyles.textSecondary,
                    selectedMood === mood.id && { color: theme.text, fontWeight: '500' },
                  ]}
                >
                  {t(mood.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </Animated.View>
  );

  const renderEnergy = () => (
    <Animated.View entering={FadeIn.duration(600)} style={styles.energyContainer}>
      <View style={styles.header}>
        <Text style={[styles.greeting, dynamicStyles.text]}>{t('welcome.your_energy')}</Text>
        <Text style={[styles.subtitle, dynamicStyles.textSecondary]}>{t('welcome.energy_question')}</Text>
      </View>

      <View style={styles.energyScale}>
        <View style={styles.energyRow}>
          {ENERGY_LEVELS.map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.energyButton,
                dynamicStyles.card,
                energyLevel === level && styles.energyButtonActive,
              ]}
              onPress={() => setEnergyLevel(level)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.energyText,
                  dynamicStyles.textSecondary,
                  energyLevel === level && styles.energyTextActive,
                ]}
              >
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.energyLabels}>
          <Text style={[styles.energyLabelText, dynamicStyles.textMuted]}>{t('welcome.exhausted')}</Text>
          <Text style={[styles.energyLabelText, dynamicStyles.textMuted]}>{t('welcome.full_energy')}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.continueButton}
        onPress={handleEnergyContinue}
        activeOpacity={0.8}
      >
        <Text style={styles.continueButtonText}>{t('common.continue')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backLink}
        onPress={() => setStep('mood')}
      >
        <Text style={[styles.backLinkText, dynamicStyles.textMuted]}>{t('common.back')}</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderWisdom = () => (
    <Animated.View entering={FadeIn.duration(800)} style={styles.wisdomContainer}>
      <View style={styles.wisdomHeader}>
        <Text style={[styles.wisdomSubtitle, dynamicStyles.textSecondary]}>{t('welcome.light_for_moment')}</Text>
      </View>

      {isLoadingText ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.accent} />
        </View>
      ) : sacredText ? (
        <Animated.View entering={FadeInUp.duration(600).delay(200)} style={[styles.wisdomCard, dynamicStyles.card]}>
          <Ionicons name="sparkles-outline" size={28} color={theme.accentWarm} style={{ marginBottom: 16 }} />
          <Text style={[styles.wisdomQuote, dynamicStyles.text]}>"{sacredText.text}"</Text>
          <Text style={[styles.wisdomSource, dynamicStyles.textMuted]}>— {sacredText.source}</Text>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInUp.duration(500).delay(600)}>
        <TouchableOpacity
          style={styles.beginButton}
          onPress={handleFinish}
          activeOpacity={0.8}
        >
          <Text style={styles.beginButtonText}>{t('welcome.begin_journey')}</Text>
        </TouchableOpacity>
      </Animated.View>

      <TouchableOpacity
        style={styles.backLink}
        onPress={() => setStep('energy')}
      >
        <Text style={[styles.backLinkText, dynamicStyles.textMuted]}>{t('common.back')}</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      {renderLanguageModal()}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === 'auth' && renderAuth()}
        {step === 'mood' && renderMood()}
        {step === 'energy' && renderEnergy()}
        {step === 'wisdom' && renderWisdom()}
      </ScrollView>

      {/* Sticky bottom button for mood step */}
      {step === 'mood' && (
        <View style={[styles.stickyBottom, dynamicStyles.container]}>
          <TouchableOpacity
            style={[styles.continueButton, !selectedMood && styles.continueButtonDisabled]}
            onPress={handleMoodContinue}
            disabled={!selectedMood}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>{t('common.continue')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  stickyBottom: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 8,
  },
  languageSelector: {
    position: 'absolute',
    top: 20,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  languageFlag: {
    fontSize: 16,
  },
  languageCode: {
    fontSize: 13,
    fontWeight: '500',
  },
  themeToggle: {
    position: 'absolute',
    top: 20,
    right: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  themeToggleTop: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageModal: {
    borderRadius: 20,
    padding: 24,
    width: '80%',
    maxWidth: 300,
  },
  languageModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  languageOptionActive: {
    backgroundColor: 'rgba(139, 154, 125, 0.15)',
  },
  languageOptionText: {
    fontSize: 16,
    flex: 1,
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
  appName: {
    fontSize: 42,
    fontWeight: '200',
    letterSpacing: 8,
    marginBottom: 8,
  },
  byLine: {
    fontSize: 12,
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
  appleButtonDark: {
    backgroundColor: '#FFFFFF',
  },
  appleButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  appleButtonTextDark: {
    color: '#000',
  },
  skipButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 14,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '200',
    letterSpacing: 2,
    marginBottom: 8,
  },
  poeticQuestion: {
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  moodContainer: {
    flex: 1,
    paddingTop: 40,
  },
  moodRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  moodGrid: {
    marginBottom: 20,
  },
  moodCard: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  moodIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 11,
    fontWeight: '400',
    textAlign: 'center',
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
    justifyContent: 'center',
  },
  energyScale: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
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
  },
  backLink: {
    alignItems: 'center',
    marginTop: 20,
    padding: 10,
  },
  backLinkText: {
    fontSize: 13,
  },
  wisdomContainer: {
    flex: 1,
    paddingTop: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wisdomHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  wisdomSubtitle: {
    fontSize: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  loadingContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wisdomCard: {
    borderRadius: 20,
    padding: 28,
    marginBottom: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    width: '100%',
  },
  wisdomQuote: {
    fontSize: 17,
    fontWeight: '300',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  wisdomSource: {
    fontSize: 13,
    letterSpacing: 0.5,
  },
  beginButton: {
    backgroundColor: '#D4A574',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    alignItems: 'center',
  },
  beginButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 1,
  },
});
