import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
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
import { useTheme } from '../src/context/ThemeContext';
import { TwinklingStars } from '../src/components/TwinklingStars';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// Ritual types for the day
const RITUAL_TYPES = {
  respiration: { icon: 'leaf-outline', color: '#8B9A7D', label: 'Respiration' },
  introspection: { icon: 'eye-outline', color: '#A8B4C4', label: 'Introspection' },
  ecriture: { icon: 'create-outline', color: '#C4A87C', label: 'Écriture' },
  gratitude: { icon: 'heart-outline', color: '#C47C7C', label: 'Gratitude' },
  meditation: { icon: 'flower-outline', color: '#A8D4A8', label: 'Méditation' },
  silence: { icon: 'moon-outline', color: '#D4A8D4', label: 'Silence' },
};

interface DailyRitual {
  id: string;
  type: keyof typeof RITUAL_TYPES;
  title: string;
  description: string;
  duration: string;
  completed: boolean;
}

interface CadenceData {
  greeting: string;
  moonInfluence: string;
  rituals: DailyRitual[];
  eveningReflection: string;
}

// Pulsing circle animation
const PulsingCircle = ({ color, size = 80 }: { color: string; size?: number }) => {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.15]) }],
    opacity: interpolate(pulse.value, [0, 1], [0.6, 1]),
  }));

  return (
    <View style={[styles.pulseContainer, { width: size * 1.5, height: size * 1.5 }]}>
      <Animated.View
        style={[
          styles.pulseOuter,
          pulseStyle,
          { width: size * 1.3, height: size * 1.3, borderRadius: size * 0.65, backgroundColor: `${color}20` }
        ]}
      />
      <View style={[styles.pulseInner, { width: size, height: size, borderRadius: size / 2, backgroundColor: `${color}40` }]}>
        <Ionicons name="infinite-outline" size={size * 0.5} color={color} />
      </View>
    </View>
  );
};

export default function CadenceScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [cadenceData, setCadenceData] = useState<CadenceData | null>(null);
  const [completedRituals, setCompletedRituals] = useState<string[]>([]);
  const [timeOfDay, setTimeOfDay] = useState<'matin' | 'apres-midi' | 'soir'>('matin');

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
  }, []);

  const fetchCadence = async () => {
    try {
      const response = await fetch(`${API_URL}/api/cadence/daily`);
      if (response.ok) {
        const data = await response.json();
        setCadenceData(data);
      } else {
        // Fallback data
        setCadenceData(generateFallbackCadence());
      }
    } catch (error) {
      setCadenceData(generateFallbackCadence());
    }
    setLoading(false);
  };

  const generateFallbackCadence = (): CadenceData => {
    const greetings = {
      matin: "Le jour se lève doucement. Prends le temps d'écouter ton rythme intérieur.",
      'apres-midi': "L'après-midi t'invite à une pause. Recentre-toi.",
      soir: "La nuit approche. C'est le moment de faire le bilan et de lâcher prise.",
    };

    const rituals: DailyRitual[] = [
      {
        id: '1',
        type: 'respiration',
        title: 'Trois respirations conscientes',
        description: 'Inspire profondément, retiens, expire lentement. Trois fois.',
        duration: '2 min',
        completed: false,
      },
      {
        id: '2',
        type: 'introspection',
        title: 'Question du jour',
        description: "Qu'est-ce qui t'habite en ce moment ? Laisse la réponse venir sans forcer.",
        duration: '5 min',
        completed: false,
      },
      {
        id: '3',
        type: 'gratitude',
        title: 'Un moment de gratitude',
        description: 'Pense à une chose, même infime, pour laquelle tu ressens de la gratitude.',
        duration: '2 min',
        completed: false,
      },
      {
        id: '4',
        type: 'silence',
        title: 'Minute de silence',
        description: 'Ferme les yeux. Écoute le silence. Ne fais rien.',
        duration: '1 min',
        completed: false,
      },
    ];

    return {
      greeting: greetings[timeOfDay],
      moonInfluence: "La lune gibbeuse t'invite à la persévérance et à la patience.",
      rituals,
      eveningReflection: "Ce soir, avant de dormir, demande-toi : qu'ai-je appris aujourd'hui sur moi-même ?",
    };
  };

  const toggleRitual = (id: string) => {
    if (completedRituals.includes(id)) {
      setCompletedRituals(prev => prev.filter(r => r !== id));
    } else {
      setCompletedRituals(prev => [...prev, id]);
    }
  };

  const progress = cadenceData ? (completedRituals.length / cadenceData.rituals.length) * 100 : 0;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, ds.container]}>
        <ActivityIndicator size="large" color={theme.accent} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, ds.container]}>
      <TwinklingStars starCount={30} minSize={1} maxSize={2} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-down" size={28} color={theme.iconColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, ds.text]}>Cadence</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Pulsing Icon */}
        <Animated.View entering={FadeIn.duration(800)} style={styles.iconSection}>
          <PulsingCircle color={theme.accentWarm} size={70} />
        </Animated.View>

        {/* Greeting */}
        <Animated.View entering={FadeInUp.duration(600).delay(200)}>
          <Text style={[styles.subtitle, ds.textMuted]}>Ton rythme intérieur</Text>
          <Text style={[styles.greeting, ds.text]}>{cadenceData?.greeting}</Text>
        </Animated.View>

        {/* Moon Influence */}
        <Animated.View entering={FadeInUp.duration(600).delay(300)} style={[styles.moonCard, ds.card]}>
          <View style={styles.moonIcon}>
            <Text style={{ fontSize: 24 }}>🌙</Text>
          </View>
          <Text style={[styles.moonText, ds.textSecondary]}>{cadenceData?.moonInfluence}</Text>
        </Animated.View>

        {/* Progress */}
        <Animated.View entering={FadeInUp.duration(600).delay(400)} style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, ds.textMuted]}>Ta cadence du jour</Text>
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
        <Text style={[styles.sectionTitle, ds.text]}>Tes micro-rituels</Text>
        {cadenceData?.rituals.map((ritual, i) => {
          const typeInfo = RITUAL_TYPES[ritual.type];
          const isCompleted = completedRituals.includes(ritual.id);

          return (
            <Animated.View key={ritual.id} entering={FadeInUp.duration(400).delay(500 + i * 80)}>
              <TouchableOpacity
                style={[styles.ritualCard, ds.card, isCompleted && styles.ritualCompleted]}
                onPress={() => toggleRitual(ritual.id)}
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
                </View>
                <View style={[styles.checkbox, { borderColor: typeInfo.color }, isCompleted && { backgroundColor: typeInfo.color }]}>
                  {isCompleted && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        {/* Evening Reflection */}
        {timeOfDay === 'soir' && cadenceData?.eveningReflection && (
          <Animated.View entering={FadeInUp.duration(600).delay(800)} style={[styles.reflectionCard, ds.card]}>
            <Ionicons name="moon-outline" size={20} color={theme.accentWarm} />
            <Text style={[styles.reflectionTitle, ds.text]}>Réflexion du soir</Text>
            <Text style={[styles.reflectionText, ds.textSecondary]}>{cadenceData.eveningReflection}</Text>
          </Animated.View>
        )}

        {/* Completion Message */}
        {progress === 100 && (
          <Animated.View entering={FadeIn.duration(600)} style={[styles.completionCard, { backgroundColor: `${theme.accentWarm}15` }]}>
            <Text style={styles.completionEmoji}>✨</Text>
            <Text style={[styles.completionText, { color: theme.accentWarm }]}>
              Tu as honoré ta cadence aujourd'hui. Bravo.
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
  placeholder: { width: 36 },
  scrollContent: { padding: 24, paddingBottom: 40 },

  iconSection: { alignItems: 'center', marginBottom: 20 },
  pulseContainer: { alignItems: 'center', justifyContent: 'center' },
  pulseOuter: { position: 'absolute' },
  pulseInner: { alignItems: 'center', justifyContent: 'center' },

  subtitle: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', marginBottom: 8 },
  greeting: { fontSize: 18, fontWeight: '300', textAlign: 'center', lineHeight: 28, marginBottom: 24 },

  moonCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, marginBottom: 24, gap: 12 },
  moonIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(212, 165, 116, 0.15)', alignItems: 'center', justifyContent: 'center' },
  moonText: { flex: 1, fontSize: 13, lineHeight: 20, fontStyle: 'italic' },

  progressSection: { marginBottom: 24 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  progressCount: { fontSize: 14, fontWeight: '600' },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  sectionTitle: { fontSize: 16, fontWeight: '500', marginBottom: 16 },

  ritualCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, marginBottom: 12, gap: 14 },
  ritualCompleted: { opacity: 0.7 },
  ritualIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  ritualContent: { flex: 1 },
  ritualHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  ritualTitle: { fontSize: 15, fontWeight: '500', flex: 1 },
  ritualDuration: { fontSize: 11, fontWeight: '500' },
  ritualDescription: { fontSize: 13, lineHeight: 18 },
  textCompleted: { textDecorationLine: 'line-through', opacity: 0.6 },
  checkbox: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },

  reflectionCard: { padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 16, gap: 10 },
  reflectionTitle: { fontSize: 14, fontWeight: '500' },
  reflectionText: { fontSize: 14, textAlign: 'center', lineHeight: 22, fontStyle: 'italic' },

  completionCard: { padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 20 },
  completionEmoji: { fontSize: 32, marginBottom: 8 },
  completionText: { fontSize: 14, fontWeight: '500', textAlign: 'center' },
});
