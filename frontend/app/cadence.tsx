import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../src/context/ThemeContext';
import { TwinklingStars } from '../src/components/TwinklingStars';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// Ritual types with icons and colors
const RITUAL_TYPES: Record<string, { icon: string; color: string; label: string }> = {
  respiration: { icon: 'leaf-outline', color: '#8B9A7D', label: 'Respiration' },
  introspection: { icon: 'eye-outline', color: '#A8B4C4', label: 'Introspection' },
  ecriture: { icon: 'create-outline', color: '#C4A87C', label: 'Écriture' },
  gratitude: { icon: 'heart-outline', color: '#C47C7C', label: 'Gratitude' },
  meditation: { icon: 'flower-outline', color: '#A8D4A8', label: 'Méditation' },
  silence: { icon: 'moon-outline', color: '#D4A8D4', label: 'Silence' },
  intention: { icon: 'sunny-outline', color: '#D4C4A8', label: 'Intention' },
  bilan: { icon: 'journal-outline', color: '#A8C4D4', label: 'Bilan' },
  // Physical activities
  marche: { icon: 'walk-outline', color: '#7DB38B', label: 'Marche' },
  nature: { icon: 'leaf-outline', color: '#5D8A66', label: 'Nature' },
  exercice: { icon: 'fitness-outline', color: '#D49A7C', label: 'Exercice' },
  etirement: { icon: 'body-outline', color: '#9A7CD4', label: 'Étirement' },
};

interface DailyRitual {
  id: string;
  type: string;
  title: string;
  description: string;
  duration: string;
  completed: boolean;
  requiresInput?: boolean;
  inputPlaceholder?: string;
}

interface CadenceData {
  greeting: string;
  moonInfluence: string;
  rituals: DailyRitual[];
  eveningReflection: string;
  wisdomQuote?: { text: string; author: string };
  astralInsight?: string;
}

// Pulsing infinity animation
const PulsingInfinity = ({ size = 80 }: { size?: number }) => {
  const pulse = useSharedValue(0);
  const rotate = useSharedValue(0);

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
      withTiming(360, { duration: 30000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(pulse.value, [0, 1], [1, 1.1]) },
      { rotateZ: `${rotate.value}deg` },
    ],
    opacity: interpolate(pulse.value, [0, 1], [0.7, 1]),
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.2, 0.5]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.4]) }],
  }));

  return (
    <View style={[styles.pulseContainer, { width: size * 1.8, height: size * 1.8 }]}>
      <Animated.View
        style={[styles.pulseGlow, glowStyle, { width: size * 1.5, height: size * 1.5, borderRadius: size * 0.75 }]}
      />
      <Animated.View style={pulseStyle}>
        <Ionicons name="infinite-outline" size={size * 0.6} color="#D4A574" />
      </Animated.View>
    </View>
  );
};

// Streak flame component
const StreakFlame = ({ streak }: { streak: number }) => {
  const flicker = useSharedValue(0);

  useEffect(() => {
    flicker.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0.7, { duration: 200 }),
        withTiming(1, { duration: 250 })
      ),
      -1,
      false
    );
  }, []);

  const flickerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(flicker.value, [0.7, 1], [0.95, 1.05]) }],
  }));

  if (streak < 1) return null;

  return (
    <Animated.View style={[styles.streakBadge, flickerStyle]}>
      <Text style={styles.streakEmoji}>🔥</Text>
      <Text style={styles.streakText}>{streak}j</Text>
    </Animated.View>
  );
};

export default function CadenceScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [cadenceData, setCadenceData] = useState<CadenceData | null>(null);
  const [completedRituals, setCompletedRituals] = useState<string[]>([]);
  const [ritualInputs, setRitualInputs] = useState<Record<string, string>>({});
  const [timeOfDay, setTimeOfDay] = useState<'matin' | 'apres-midi' | 'soir'>('matin');
  const [streak, setStreak] = useState(0);
  const [showGratitude, setShowGratitude] = useState(false);
  const [gratitudes, setGratitudes] = useState<string[]>(['', '', '']);
  const [intention, setIntention] = useState('');
  const [showIntention, setShowIntention] = useState(false);
  const [expandedRitual, setExpandedRitual] = useState<string | null>(null);

  // Get ritual type labels from translations
  const getRitualLabel = (type: string) => {
    return t(`cadence.ritual_types.${type}`, type);
  };

  const ds = {
    container: { backgroundColor: theme.background },
    card: { backgroundColor: theme.card },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    textMuted: { color: theme.textMuted },
  };

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('matin');
    else if (hour < 18) setTimeOfDay('apres-midi');
    else setTimeOfDay('soir');
    
    fetchCadence();
    fetchStreak();
  }, []);

  const fetchStreak = async () => {
    try {
      const res = await fetch(`${API_URL}/api/cadence/streak`);
      if (res.ok) {
        const data = await res.json();
        setStreak(data.streak || 0);
      }
    } catch (e) {
      setStreak(0);
    }
  };

  const fetchCadence = async () => {
    try {
      const response = await fetch(`${API_URL}/api/cadence/daily`);
      if (response.ok) {
        const data = await response.json();
        setCadenceData(data);
      } else {
        setCadenceData(generateFallbackCadence());
      }
    } catch (error) {
      setCadenceData(generateFallbackCadence());
    }
    setLoading(false);
  };

  const generateFallbackCadence = (): CadenceData => {
    const timeKey = timeOfDay === 'matin' ? 'morning' : timeOfDay === 'apres-midi' ? 'afternoon' : 'evening';
    const greetingKey = `cadence.greeting_${timeKey}`;
    
    const rituals: DailyRitual[] = [];

    // Morning: Intention
    if (timeOfDay === 'matin') {
      rituals.push({
        id: 'intention',
        type: 'intention',
        title: t('cadence.rituals.intention_title'),
        description: t('cadence.rituals.intention_desc'),
        duration: '3 min',
        completed: false,
        requiresInput: true,
        inputPlaceholder: t('cadence.rituals.intention_placeholder'),
      });
    }

    // Always: Breath
    rituals.push({
      id: 'breath',
      type: 'respiration',
      title: t('cadence.rituals.breath_title'),
      description: t('cadence.rituals.breath_desc'),
      duration: '2 min',
      completed: false,
    });

    // Introspection
    const questionKey = `cadence.rituals.introspection_${timeKey}`;
    rituals.push({
      id: 'introspection',
      type: 'introspection',
      title: t('cadence.rituals.question_title'),
      description: t(questionKey),
      duration: '5 min',
      completed: false,
    });

    // Gratitude
    rituals.push({
      id: 'gratitude',
      type: 'gratitude',
      title: t('cadence.rituals.gratitude_title'),
      description: t('cadence.rituals.gratitude_desc'),
      duration: '3 min',
      completed: false,
      requiresInput: true,
      inputPlaceholder: t('cadence.rituals.gratitude_placeholder'),
    });

    // Silence
    rituals.push({
      id: 'silence',
      type: 'silence',
      title: t('cadence.rituals.silence_title'),
      description: t('cadence.rituals.silence_desc'),
      duration: '1 min',
      completed: false,
    });

    // Evening: Bilan
    if (timeOfDay === 'soir') {
      rituals.push({
        id: 'bilan',
        type: 'bilan',
        title: t('cadence.rituals.bilan_title'),
        description: t('cadence.rituals.bilan_desc'),
        duration: '5 min',
        completed: false,
        requiresInput: true,
        inputPlaceholder: t('cadence.rituals.bilan_placeholder'),
      });
    }

    return {
      greeting: t(greetingKey),
      moonInfluence: "",
      rituals,
      eveningReflection: timeOfDay === 'soir' ? t('cadence.evening_reflection') : '',
      wisdomQuote: {
        text: t('wisdom.quotes.0.text', "Ce que tu cherches te cherche aussi."),
        author: t('wisdom.quotes.0.author', "Rumi")
      },
      astralInsight: "",
    };
  };

  const toggleRitual = (id: string) => {
    if (completedRituals.includes(id)) {
      setCompletedRituals(prev => prev.filter(r => r !== id));
    } else {
      setCompletedRituals(prev => [...prev, id]);
      // Save completion to backend
      saveRitualCompletion(id);
    }
  };

  const saveRitualCompletion = async (ritualId: string) => {
    try {
      await fetch(`${API_URL}/api/cadence/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ritual_id: ritualId, input: ritualInputs[ritualId] || null }),
      });
    } catch (e) {
      console.log('Save ritual error:', e);
    }
  };

  const handleGratitudeChange = (index: number, value: string) => {
    const newGratitudes = [...gratitudes];
    newGratitudes[index] = value;
    setGratitudes(newGratitudes);
  };

  const saveGratitudes = async () => {
    const validGratitudes = gratitudes.filter(g => g.trim());
    if (validGratitudes.length > 0) {
      try {
        await fetch(`${API_URL}/api/cadence/gratitudes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gratitudes: validGratitudes }),
        });
      } catch (e) {
        console.log('Save gratitudes error:', e);
      }
      toggleRitual('gratitude');
      setShowGratitude(false);
    }
  };

  const saveIntention = async () => {
    if (intention.trim()) {
      try {
        await fetch(`${API_URL}/api/cadence/intention`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intention: intention.trim() }),
        });
      } catch (e) {
        console.log('Save intention error:', e);
      }
      toggleRitual('intention');
      setShowIntention(false);
    }
  };

  const progress = cadenceData ? (completedRituals.length / cadenceData.rituals.length) * 100 : 0;
  const allCompleted = cadenceData && completedRituals.length === cadenceData.rituals.length;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, ds.container]}>
        <ActivityIndicator size="large" color={theme.accent} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, ds.container]}>
      <TwinklingStars starCount={25} minSize={1} maxSize={2} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-down" size={28} color={theme.iconColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, ds.text]}>{t('cadence.title')}</Text>
        <StreakFlame streak={streak} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Pulsing Icon */}
        <Animated.View entering={FadeIn.duration(800)} style={styles.iconSection}>
          <PulsingInfinity size={70} />
        </Animated.View>

        {/* Time of day badge */}
        <Animated.View entering={FadeInUp.duration(400)} style={styles.timeBadgeContainer}>
          <View style={[styles.timeBadge, { backgroundColor: `${theme.accentWarm}20` }]}>
            <Ionicons 
              name={timeOfDay === 'matin' ? 'sunny-outline' : timeOfDay === 'apres-midi' ? 'partly-sunny-outline' : 'moon-outline'} 
              size={14} 
              color={theme.accentWarm} 
            />
            <Text style={[styles.timeBadgeText, { color: theme.accentWarm }]}>
              {t(`time_of_day.${timeOfDay === 'matin' ? 'morning' : timeOfDay === 'apres-midi' ? 'afternoon' : 'evening'}`)}
            </Text>
          </View>
        </Animated.View>

        {/* Greeting */}
        <Animated.View entering={FadeInUp.duration(600).delay(100)}>
          <Text style={[styles.subtitle, ds.textMuted]}>{t('cadence.your_inner_rhythm')}</Text>
          <Text style={[styles.greeting, ds.text]}>{cadenceData?.greeting}</Text>
        </Animated.View>

        {/* Wisdom Quote */}
        {cadenceData?.wisdomQuote && (
          <Animated.View entering={FadeInUp.duration(600).delay(200)} style={[styles.quoteCard, ds.card]}>
            <Text style={styles.quoteIcon}>✦</Text>
            <Text style={[styles.quoteText, ds.textSecondary]}>"{cadenceData.wisdomQuote.text}"</Text>
            <Text style={[styles.quoteAuthor, ds.textMuted]}>— {cadenceData.wisdomQuote.author}</Text>
          </Animated.View>
        )}

        {/* Moon Influence */}
        <Animated.View entering={FadeInUp.duration(600).delay(300)} style={[styles.moonCard, ds.card]}>
          <View style={styles.moonIcon}>
            <Text style={{ fontSize: 22 }}>🌙</Text>
          </View>
          <Text style={[styles.moonText, ds.textSecondary]}>{cadenceData?.moonInfluence}</Text>
        </Animated.View>

        {/* Progress */}
        <Animated.View entering={FadeInUp.duration(600).delay(400)} style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, ds.textMuted]}>{t('cadence.your_daily_cadence')}</Text>
            <Text style={[styles.progressCount, ds.text]}>
              {completedRituals.length}/{cadenceData?.rituals.length}
            </Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
            <Animated.View
              style={[
                styles.progressFill,
                { backgroundColor: theme.accentWarm, width: `${progress}%` }
              ]}
            />
          </View>
        </Animated.View>

        {/* Rituals */}
        <Text style={[styles.sectionTitle, ds.text]}>{t('cadence.your_micro_rituals')}</Text>
        {cadenceData?.rituals.map((ritual, i) => {
          const typeInfo = RITUAL_TYPES[ritual.type];
          const isCompleted = completedRituals.includes(ritual.id);
          const isExpanded = expandedRitual === ritual.id;

          return (
            <Animated.View key={ritual.id} entering={FadeInUp.duration(400).delay(500 + i * 80)}>
              <TouchableOpacity
                style={[styles.ritualCard, ds.card, isCompleted && styles.ritualCompleted]}
                onPress={() => {
                  if (ritual.requiresInput && !isCompleted) {
                    if (ritual.id === 'gratitude') {
                      setShowGratitude(true);
                    } else if (ritual.id === 'intention') {
                      setShowIntention(true);
                    } else {
                      setExpandedRitual(isExpanded ? null : ritual.id);
                    }
                  } else {
                    toggleRitual(ritual.id);
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.ritualIcon, { backgroundColor: `${typeInfo.color}20` }]}>
                  <Ionicons name={typeInfo.icon as any} size={22} color={typeInfo.color} />
                </View>
                <View style={styles.ritualContent}>
                  <View style={styles.ritualHeader}>
                    <Text style={[styles.ritualTitle, ds.text, isCompleted && styles.textCompleted]}>
                      {ritual.title}
                    </Text>
                    <Text style={[styles.ritualDuration, { color: typeInfo.color }]}>{ritual.duration}</Text>
                  </View>
                  <Text style={[styles.ritualDescription, ds.textSecondary, isCompleted && styles.textCompleted]}>
                    {ritual.description}
                  </Text>
                  
                  {/* Expanded input for bilan type */}
                  {isExpanded && ritual.requiresInput && (
                    <Animated.View entering={FadeIn.duration(300)} style={styles.inputSection}>
                      <TextInput
                        style={[styles.ritualInput, ds.text, { backgroundColor: theme.background, borderColor: theme.border }]}
                        placeholder={ritual.inputPlaceholder}
                        placeholderTextColor={theme.textMuted}
                        value={ritualInputs[ritual.id] || ''}
                        onChangeText={(text) => setRitualInputs(prev => ({ ...prev, [ritual.id]: text }))}
                        multiline
                      />
                      <TouchableOpacity
                        style={[styles.saveInputBtn, { backgroundColor: typeInfo.color }]}
                        onPress={() => {
                          toggleRitual(ritual.id);
                          setExpandedRitual(null);
                        }}
                      >
                        <Text style={styles.saveInputText}>{t('common.validate')}</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  )}
                </View>
                <View style={[styles.checkbox, { borderColor: typeInfo.color }, isCompleted && { backgroundColor: typeInfo.color }]}>
                  {isCompleted && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        {/* Gratitude Modal */}
        {showGratitude && (
          <Animated.View entering={FadeIn.duration(300)} style={[styles.inputModal, ds.card]}>
            <Text style={[styles.inputModalTitle, ds.text]}>{t('cadence.gratitude_modal_title')}</Text>
            <Text style={[styles.inputModalSubtitle, ds.textMuted]}>{t('cadence.gratitude_modal_subtitle')}</Text>
            {[0, 1, 2].map((idx) => (
              <View key={idx} style={styles.gratitudeRow}>
                <Text style={[styles.gratitudeNumber, { color: theme.accentWarm }]}>{idx + 1}.</Text>
                <TextInput
                  style={[styles.gratitudeInput, ds.text, { backgroundColor: theme.background, borderColor: theme.border }]}
                  placeholder={`${t('cadence.rituals.gratitude_placeholder')} ${idx + 1}...`}
                  placeholderTextColor={theme.textMuted}
                  value={gratitudes[idx]}
                  onChangeText={(text) => handleGratitudeChange(idx, text)}
                />
              </View>
            ))}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalCancelBtn, { borderColor: theme.border }]} onPress={() => setShowGratitude(false)}>
                <Text style={[styles.modalCancelText, ds.textMuted]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSaveBtn, { backgroundColor: theme.accentWarm }]} onPress={saveGratitudes}>
                <Text style={styles.modalSaveText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Intention Modal */}
        {showIntention && (
          <Animated.View entering={FadeIn.duration(300)} style={[styles.inputModal, ds.card]}>
            <Text style={[styles.inputModalTitle, ds.text]}>{t('cadence.intention_modal_title')}</Text>
            <Text style={[styles.inputModalSubtitle, ds.textMuted]}>{t('cadence.intention_modal_subtitle')}</Text>
            <TextInput
              style={[styles.intentionInput, ds.text, { backgroundColor: theme.background, borderColor: theme.border }]}
              placeholder={t('cadence.rituals.intention_placeholder')}
              placeholderTextColor={theme.textMuted}
              value={intention}
              onChangeText={setIntention}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalCancelBtn, { borderColor: theme.border }]} onPress={() => setShowIntention(false)}>
                <Text style={[styles.modalCancelText, ds.textMuted]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSaveBtn, { backgroundColor: theme.accentWarm }]} onPress={saveIntention}>
                <Text style={styles.modalSaveText}>{t('cadence.set_intention')}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Evening Reflection */}
        {timeOfDay === 'soir' && cadenceData?.eveningReflection && !allCompleted && (
          <Animated.View entering={FadeInUp.duration(600).delay(800)} style={[styles.reflectionCard, ds.card]}>
            <Ionicons name="moon-outline" size={20} color={theme.accentWarm} />
            <Text style={[styles.reflectionTitle, ds.text]}>{t('cadence.evening_thought')}</Text>
            <Text style={[styles.reflectionText, ds.textSecondary]}>{cadenceData.eveningReflection}</Text>
          </Animated.View>
        )}

        {/* Completion Message */}
        {allCompleted && (
          <Animated.View entering={FadeIn.duration(600)} style={[styles.completionCard, { backgroundColor: `${theme.accentWarm}15` }]}>
            <Text style={styles.completionEmoji}>✨</Text>
            <Text style={[styles.completionTitle, { color: theme.accentWarm }]}>
              {t('cadence.cadence_honored')}
            </Text>
            <Text style={[styles.completionText, ds.textSecondary]}>
              {t('cadence.cadence_honored_sub')} {streak > 0 && t('cadence.days_streak', { count: streak + 1 })}
            </Text>
          </Animated.View>
        )}

        {/* Astral Insight */}
        {cadenceData?.astralInsight && (
          <Animated.View entering={FadeInUp.duration(600).delay(900)} style={styles.astralInsight}>
            <Text style={[styles.astralText, ds.textMuted]}>
              ✧ {cadenceData.astralInsight}
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '500', letterSpacing: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },

  iconSection: { alignItems: 'center', marginBottom: 10 },
  pulseContainer: { alignItems: 'center', justifyContent: 'center' },
  pulseGlow: { position: 'absolute', backgroundColor: 'rgba(212, 165, 116, 0.2)' },

  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 150, 50, 0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, gap: 4 },
  streakEmoji: { fontSize: 14 },
  streakText: { fontSize: 12, fontWeight: '600', color: '#FF9632' },

  timeBadgeContainer: { alignItems: 'center', marginBottom: 16 },
  timeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 6 },
  timeBadgeText: { fontSize: 12, fontWeight: '500' },

  subtitle: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', marginBottom: 8 },
  greeting: { fontSize: 17, fontWeight: '300', textAlign: 'center', lineHeight: 26, marginBottom: 20 },

  quoteCard: { padding: 20, borderRadius: 16, marginBottom: 16, alignItems: 'center' },
  quoteIcon: { fontSize: 20, color: '#D4A574', marginBottom: 10 },
  quoteText: { fontSize: 15, fontStyle: 'italic', textAlign: 'center', lineHeight: 24, marginBottom: 8 },
  quoteAuthor: { fontSize: 12 },

  moonCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 20, gap: 12 },
  moonIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(212, 165, 116, 0.15)', alignItems: 'center', justifyContent: 'center' },
  moonText: { flex: 1, fontSize: 13, lineHeight: 19, fontStyle: 'italic' },

  progressSection: { marginBottom: 20 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  progressCount: { fontSize: 14, fontWeight: '600' },
  progressBar: { height: 5, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  sectionTitle: { fontSize: 15, fontWeight: '500', marginBottom: 14 },

  ritualCard: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, borderRadius: 14, marginBottom: 12, gap: 12 },
  ritualCompleted: { opacity: 0.65 },
  ritualIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  ritualContent: { flex: 1 },
  ritualHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  ritualTitle: { fontSize: 15, fontWeight: '500', flex: 1 },
  ritualDuration: { fontSize: 11, fontWeight: '500' },
  ritualDescription: { fontSize: 13, lineHeight: 19 },
  textCompleted: { textDecorationLine: 'line-through', opacity: 0.6 },
  checkbox: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 4 },

  inputSection: { marginTop: 12 },
  ritualInput: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, minHeight: 60, marginBottom: 10 },
  saveInputBtn: { paddingVertical: 10, borderRadius: 20, alignItems: 'center' },
  saveInputText: { color: '#fff', fontSize: 13, fontWeight: '500' },

  inputModal: { padding: 20, borderRadius: 16, marginTop: 16, marginBottom: 16 },
  inputModalTitle: { fontSize: 17, fontWeight: '500', marginBottom: 4 },
  inputModalSubtitle: { fontSize: 13, marginBottom: 16 },
  gratitudeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  gratitudeNumber: { fontSize: 16, fontWeight: '600', width: 24 },
  gratitudeInput: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  intentionInput: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15, minHeight: 80, marginBottom: 16 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 20, borderWidth: 1, alignItems: 'center' },
  modalCancelText: { fontSize: 14 },
  modalSaveBtn: { flex: 1, paddingVertical: 12, borderRadius: 20, alignItems: 'center' },
  modalSaveText: { color: '#fff', fontSize: 14, fontWeight: '500' },

  reflectionCard: { padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 8, gap: 10 },
  reflectionTitle: { fontSize: 14, fontWeight: '500' },
  reflectionText: { fontSize: 14, textAlign: 'center', lineHeight: 22, fontStyle: 'italic' },

  completionCard: { padding: 24, borderRadius: 16, alignItems: 'center', marginTop: 20 },
  completionEmoji: { fontSize: 36, marginBottom: 10 },
  completionTitle: { fontSize: 18, fontWeight: '500', marginBottom: 6 },
  completionText: { fontSize: 14, textAlign: 'center' },

  astralInsight: { marginTop: 20, alignItems: 'center' },
  astralText: { fontSize: 12, fontStyle: 'italic', textAlign: 'center' },
});
