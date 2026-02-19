import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
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
import { useTranslation } from 'react-i18next';
import { useTheme } from '../src/context/ThemeContext';
import { TwinklingStars } from '../src/components/TwinklingStars';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// Moon phases icons and data
const MOON_PHASES = [
  { name: 'Nouvelle Lune', icon: '🌑', shortName: 'Nouvelle' },
  { name: 'Premier Croissant', icon: '🌒', shortName: 'Croissant' },
  { name: 'Premier Quartier', icon: '🌓', shortName: 'Quartier' },
  { name: 'Gibbeuse Croissante', icon: '🌔', shortName: 'Gibbeuse+' },
  { name: 'Pleine Lune', icon: '🌕', shortName: 'Pleine' },
  { name: 'Gibbeuse Décroissante', icon: '🌖', shortName: 'Gibbeuse-' },
  { name: 'Dernier Quartier', icon: '🌗', shortName: 'Quartier' },
  { name: 'Dernier Croissant', icon: '🌘', shortName: 'Croissant' },
];

interface PhaseData {
  phase: string;
  day_in_cycle: number;
  energy: string;
  element: string;
  focus: string;
  ritual_themes: string[];
}

interface GeneratedRitual {
  title: string;
  duration: string;
  intention: string;
  preparation: string[];
  steps: string[];
  closing: string;
  affirmation: string;
}

// Calculate current moon phase locally
const getMoonPhase = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  const c = Math.floor(365.25 * year);
  const e = Math.floor(30.6 * month);
  const jd = c + e + day - 694039.09;
  const phase = jd / 29.53;
  const phaseDay = Math.floor((phase - Math.floor(phase)) * 29.53);
  
  if (phaseDay < 1.85) return 'Nouvelle Lune';
  if (phaseDay < 5.53) return 'Premier Croissant';
  if (phaseDay < 9.22) return 'Premier Quartier';
  if (phaseDay < 12.91) return 'Gibbeuse Croissante';
  if (phaseDay < 16.61) return 'Pleine Lune';
  if (phaseDay < 20.30) return 'Gibbeuse Décroissante';
  if (phaseDay < 23.99) return 'Dernier Quartier';
  if (phaseDay < 27.68) return 'Dernier Croissant';
  return 'Nouvelle Lune';
};

// Animated Moon Component
const AnimatedMoon = ({ phase, size = 100 }: { phase: string; size?: number }) => {
  const pulse = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const moonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.08]) }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.3, 0.6]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [1, 1.3]) }],
  }));

  const outerGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.15, 0.35]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [1, 1.5]) }],
  }));

  const phaseData = MOON_PHASES.find(p => p.name === phase) || MOON_PHASES[4];

  return (
    <View style={[styles.moonContainer, { width: size * 2.5, height: size * 2.5 }]}>
      {/* Outer glow */}
      <Animated.View
        style={[
          styles.moonGlow,
          outerGlowStyle,
          { width: size * 2, height: size * 2, borderRadius: size, backgroundColor: 'rgba(245, 230, 211, 0.2)' }
        ]}
      />
      {/* Inner glow */}
      <Animated.View
        style={[
          styles.moonGlow,
          glowStyle,
          { width: size * 1.5, height: size * 1.5, borderRadius: size * 0.75, backgroundColor: 'rgba(245, 230, 211, 0.3)' }
        ]}
      />
      {/* Moon */}
      <Animated.View style={moonStyle}>
        <Text style={{ fontSize: size }}>{phaseData.icon}</Text>
      </Animated.View>
    </View>
  );
};

export default function RitualsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const [currentPhase, setCurrentPhase] = useState(getMoonPhase());
  const [phaseData, setPhaseData] = useState<PhaseData | null>(null);
  const [generatedRitual, setGeneratedRitual] = useState<GeneratedRitual | null>(null);
  const [customIntention, setCustomIntention] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingRitual, setLoadingRitual] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showRitual, setShowRitual] = useState(false);

  // Moon phases for UI (using translation keys)
  const MOON_PHASES_DATA = [
    { key: 'new', icon: '🌑' },
    { key: 'waxing_crescent', icon: '🌒' },
    { key: 'first_quarter', icon: '🌓' },
    { key: 'waxing_gibbous', icon: '🌔' },
    { key: 'full', icon: '🌕' },
    { key: 'waning_gibbous', icon: '🌖' },
    { key: 'last_quarter', icon: '🌗' },
    { key: 'waning_crescent', icon: '🌘' },
  ];

  const getMoonPhaseKey = (phaseName: string): string => {
    const mapping: Record<string, string> = {
      'Nouvelle Lune': 'new',
      'Premier Croissant': 'waxing_crescent',
      'Premier Quartier': 'first_quarter',
      'Gibbeuse Croissante': 'waxing_gibbous',
      'Pleine Lune': 'full',
      'Gibbeuse Décroissante': 'waning_gibbous',
      'Dernier Quartier': 'last_quarter',
      'Dernier Croissant': 'waning_crescent',
    };
    return mapping[phaseName] || 'full';
  };

  const ds = {
    container: { backgroundColor: theme.background },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    textMuted: { color: theme.textMuted },
    card: { backgroundColor: theme.card },
  };

  useEffect(() => {
    fetchPhaseData();
  }, [currentPhase]);

  const fetchPhaseData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/lunar-phase/current`);
      if (response.ok) {
        const data = await response.json();
        setPhaseData(data);
      }
    } catch (error) {
      console.error('Error fetching phase data:', error);
      // Fallback data
      setPhaseData({
        phase: currentPhase,
        day_in_cycle: 15,
        energy: "Énergie de transformation",
        element: "Eau",
        focus: "Connexion intérieure",
        ritual_themes: ["méditation", "introspection", "gratitude"],
      });
    }
    setLoading(false);
  };

  const generateRitual = async () => {
    setLoadingRitual(true);
    setShowRitual(false);
    setCompletedSteps([]);
    
    try {
      const response = await fetch(`${API_URL}/api/lunar-rituals/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase: currentPhase,
          intention: customIntention || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedRitual(data);
        setShowRitual(true);
      }
    } catch (error) {
      console.error('Error generating ritual:', error);
      // Fallback ritual
      setGeneratedRitual({
        title: `Rituel de la ${currentPhase}`,
        duration: "15 min",
        intention: customIntention || "Se connecter à l'énergie lunaire",
        preparation: ["Une bougie", "Un espace calme"],
        steps: [
          "Allume ta bougie et prends 3 respirations profondes",
          "Connecte-toi à l'énergie de la lune",
          "Pose tes mains sur ton cœur",
          "Formule ton intention",
          "Remercie la lune"
        ],
        closing: "Que la lumière de la lune guide tes pas.",
        affirmation: "Je suis aligné(e) avec les cycles de la nature."
      });
      setShowRitual(true);
    }
    setLoadingRitual(false);
  };

  const toggleStep = (index: number) => {
    if (completedSteps.includes(index)) {
      setCompletedSteps(completedSteps.filter(i => i !== index));
    } else {
      setCompletedSteps([...completedSteps, index]);
    }
  };

  const phaseInfo = MOON_PHASES.find(p => p.name === currentPhase) || MOON_PHASES[4];

  return (
    <SafeAreaView style={[styles.container, ds.container]}>
      <TwinklingStars starCount={50} minSize={1} maxSize={3} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} data-testid="back-button">
          <Ionicons name="chevron-down" size={28} color={theme.iconColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, ds.text]}>{t('rituals.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Animated Moon */}
        <Animated.View entering={FadeIn.duration(800)} style={styles.moonSection}>
          <AnimatedMoon phase={currentPhase} size={80} />
        </Animated.View>

        {/* Phase Info */}
        <Animated.View entering={FadeInUp.duration(600).delay(200)} style={[styles.phaseCard, ds.card]}>
          <Text style={[styles.phaseName, ds.text]}>{t(`rituals.moon_phases.${getMoonPhaseKey(currentPhase)}`)}</Text>
          {phaseData && (
            <>
              <View style={styles.phaseDetails}>
                <View style={[styles.detailBadge, { backgroundColor: `${theme.accentWarm}20` }]}>
                  <Text style={[styles.detailText, { color: theme.accentWarm }]}>{phaseData.element}</Text>
                </View>
                <View style={[styles.detailBadge, { backgroundColor: `${theme.accent}20` }]}>
                  <Text style={[styles.detailText, { color: theme.accent }]}>{t('rituals.day_in_cycle', { day: phaseData.day_in_cycle })}</Text>
                </View>
              </View>
              <Text style={[styles.phaseEnergy, ds.textSecondary]}>{phaseData.energy}</Text>
              <Text style={[styles.phaseFocus, ds.textMuted]}>Focus : {phaseData.focus}</Text>
            </>
          )}
        </Animated.View>

        {/* Phase Selector */}
        <Animated.View entering={FadeInUp.duration(600).delay(300)}>
          <Text style={[styles.sectionTitle, ds.text]}>{t('rituals.phases_title')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.phasesScroll}>
            {MOON_PHASES.map((phase) => (
              <TouchableOpacity
                key={phase.name}
                style={[
                  styles.phaseChip,
                  { backgroundColor: phase.name === currentPhase ? theme.accentWarm : theme.card }
                ]}
                onPress={() => {
                  setCurrentPhase(phase.name);
                  setShowRitual(false);
                  setGeneratedRitual(null);
                }}
                data-testid={`phase-${phase.shortName}`}
              >
                <Text style={styles.phaseChipIcon}>{phase.icon}</Text>
                <Text style={[
                  styles.phaseChipText,
                  { color: phase.name === currentPhase ? '#fff' : theme.textSecondary }
                ]}>
                  {t(`rituals.moon_phases_short.${getMoonPhaseKey(phase.name)}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Intention Input */}
        {!showRitual && (
          <Animated.View entering={FadeInUp.duration(600).delay(400)} style={[styles.intentionCard, ds.card]}>
            <Text style={[styles.intentionLabel, ds.text]}>{t('rituals.intention_label')}</Text>
            <TextInput
              style={[styles.intentionInput, ds.text, { borderColor: theme.border, backgroundColor: theme.inputBackground }]}
              placeholder={t('rituals.intention_placeholder')}
              placeholderTextColor={theme.textMuted}
              value={customIntention}
              onChangeText={setCustomIntention}
              multiline
              data-testid="intention-input"
            />
            
            <TouchableOpacity
              style={[styles.generateButton, { backgroundColor: theme.accentWarm }]}
              onPress={generateRitual}
              disabled={loadingRitual}
              data-testid="generate-ritual-btn"
            >
              {loadingRitual ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="moon" size={20} color="#fff" />
                  <Text style={styles.generateButtonText}>{t('rituals.generate')}</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Generated Ritual */}
        {showRitual && generatedRitual && (
          <Animated.View entering={FadeInUp.duration(500)}>
            {/* Ritual Header */}
            <View style={[styles.ritualCard, ds.card]}>
              <View style={styles.ritualHeader}>
                <Text style={[styles.ritualTitle, ds.text]}>{generatedRitual.title}</Text>
                <View style={[styles.durationBadge, { backgroundColor: `${theme.accent}20` }]}>
                  <Ionicons name="time-outline" size={14} color={theme.accent} />
                  <Text style={[styles.durationText, { color: theme.accent }]}>{generatedRitual.duration}</Text>
                </View>
              </View>
              <Text style={[styles.ritualIntention, ds.textSecondary, { fontStyle: 'italic' }]}>
                "{generatedRitual.intention}"
              </Text>
            </View>

            {/* Preparation */}
            <View style={[styles.ritualCard, ds.card]}>
              <Text style={[styles.ritualSectionTitle, ds.text]}>
                <Ionicons name="sparkles-outline" size={16} /> Préparation
              </Text>
              {generatedRitual.preparation.map((item, i) => (
                <View key={i} style={styles.prepItem}>
                  <Text style={[styles.prepBullet, { color: theme.accentWarm }]}>✧</Text>
                  <Text style={[styles.prepText, ds.textSecondary]}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Steps */}
            <View style={[styles.ritualCard, ds.card]}>
              <Text style={[styles.ritualSectionTitle, ds.text]}>
                <Ionicons name="list-outline" size={16} /> Étapes du rituel
              </Text>
              {generatedRitual.steps.map((step, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.stepRow}
                  onPress={() => toggleStep(i)}
                  data-testid={`step-${i}`}
                >
                  <View style={[
                    styles.stepCheckbox,
                    { borderColor: theme.accentWarm },
                    completedSteps.includes(i) && { backgroundColor: theme.accentWarm }
                  ]}>
                    {completedSteps.includes(i) && (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    )}
                  </View>
                  <Text style={[
                    styles.stepText,
                    ds.text,
                    completedSteps.includes(i) && styles.stepCompleted
                  ]}>
                    {step}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Progress */}
              {completedSteps.length > 0 && (
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          backgroundColor: theme.accentWarm,
                          width: `${(completedSteps.length / generatedRitual.steps.length) * 100}%` 
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.progressText, ds.textMuted]}>
                    {completedSteps.length}/{generatedRitual.steps.length}
                  </Text>
                </View>
              )}
            </View>

            {/* Closing & Affirmation */}
            <View style={[styles.ritualCard, ds.card, { borderLeftWidth: 3, borderLeftColor: theme.accentWarm }]}>
              <Text style={[styles.closingText, ds.textSecondary]}>
                {generatedRitual.closing}
              </Text>
              <View style={[styles.affirmationBox, { backgroundColor: `${theme.accentWarm}10` }]}>
                <Text style={[styles.affirmationLabel, ds.textMuted]}>AFFIRMATION</Text>
                <Text style={[styles.affirmationText, ds.text]}>
                  "{generatedRitual.affirmation}"
                </Text>
              </View>
            </View>

            {/* New Ritual Button */}
            <TouchableOpacity
              style={[styles.newRitualButton, { borderColor: theme.border }]}
              onPress={() => {
                setShowRitual(false);
                setGeneratedRitual(null);
                setCompletedSteps([]);
              }}
              data-testid="new-ritual-btn"
            >
              <Ionicons name="refresh" size={18} color={theme.textMuted} />
              <Text style={[styles.newRitualText, ds.textMuted]}>Nouveau rituel</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingVertical: 12 
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', letterSpacing: 1 },
  placeholder: { width: 36 },
  scrollContent: { padding: 20, paddingBottom: 40 },

  moonSection: { alignItems: 'center', marginBottom: 10 },
  moonContainer: { alignItems: 'center', justifyContent: 'center' },
  moonGlow: { position: 'absolute' },

  phaseCard: { 
    padding: 24, 
    borderRadius: 20, 
    marginBottom: 24,
    alignItems: 'center',
  },
  phaseName: { fontSize: 24, fontWeight: '600', marginBottom: 12 },
  phaseDetails: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  detailBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  detailText: { fontSize: 12, fontWeight: '500' },
  phaseEnergy: { fontSize: 14, textAlign: 'center', marginBottom: 8 },
  phaseFocus: { fontSize: 13, textAlign: 'center', fontStyle: 'italic' },

  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  phasesScroll: { marginBottom: 24 },
  phaseChip: { 
    alignItems: 'center', 
    paddingVertical: 12, 
    paddingHorizontal: 16, 
    borderRadius: 16, 
    marginRight: 10,
    minWidth: 70,
  },
  phaseChipIcon: { fontSize: 24, marginBottom: 4 },
  phaseChipText: { fontSize: 11, fontWeight: '500' },

  intentionCard: { padding: 20, borderRadius: 16, marginBottom: 20 },
  intentionLabel: { fontSize: 14, fontWeight: '500', marginBottom: 12 },
  intentionInput: { 
    borderWidth: 1, 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    fontSize: 15, 
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  generateButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 16, 
    borderRadius: 30, 
    gap: 10,
  },
  generateButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  ritualCard: { padding: 20, borderRadius: 16, marginBottom: 16 },
  ritualHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  ritualTitle: { fontSize: 18, fontWeight: '600', flex: 1, marginRight: 10 },
  durationBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, gap: 4 },
  durationText: { fontSize: 12, fontWeight: '500' },
  ritualIntention: { fontSize: 14, lineHeight: 22 },

  ritualSectionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 14 },
  prepItem: { flexDirection: 'row', marginBottom: 8 },
  prepBullet: { marginRight: 10 },
  prepText: { flex: 1, fontSize: 14 },

  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  stepCheckbox: { 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    borderWidth: 2, 
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { flex: 1, fontSize: 14, lineHeight: 22 },
  stepCompleted: { textDecorationLine: 'line-through', opacity: 0.6 },

  progressContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 10 },
  progressBar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 12 },

  closingText: { fontSize: 15, lineHeight: 24, marginBottom: 16, fontStyle: 'italic' },
  affirmationBox: { padding: 16, borderRadius: 12 },
  affirmationLabel: { fontSize: 10, letterSpacing: 1, marginBottom: 6 },
  affirmationText: { fontSize: 15, fontWeight: '500', fontStyle: 'italic' },

  newRitualButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 14, 
    borderRadius: 25, 
    borderWidth: 1,
    gap: 8,
  },
  newRitualText: { fontSize: 14 },
});
