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

const RITUAL_TYPES: Record<string, { icon: string; color: string; label: string }> = {
  respiration: { icon: 'leaf-outline', color: '#8B9A7D', label: 'Respiration' },
  introspection: { icon: 'eye-outline', color: '#A8B4C4', label: 'Introspection' },
  ecriture: { icon: 'create-outline', color: '#C4A87C', label: 'Écriture' },
  gratitude: { icon: 'heart-outline', color: '#C47C7C', label: 'Gratitude' },
  meditation: { icon: 'flower-outline', color: '#A8D4A8', label: 'Méditation' },
  silence: { icon: 'moon-outline', color: '#D4A8D4', label: 'Silence' },
  intention: { icon: 'sunny-outline', color: '#D4C4A8', label: 'Intention' },
  bilan: { icon: 'journal-outline', color: '#A8C4D4', label: 'Bilan' },
  marche: { icon: 'walk-outline', color: '#7DB38B', label: 'Marche consciente' },
  nature: { icon: 'leaf-outline', color: '#5D8A66', label: 'Nature' },
  exercice: { icon: 'fitness-outline', color: '#D49A7C', label: 'Exercice' },
  etirement: { icon: 'body-outline', color: '#9A7CD4', label: 'Étirement' },
  ancrage: { icon: 'earth-outline', color: '#8B7355', label: 'Ancrage' },
  sonore: { icon: 'musical-notes-outline', color: '#7C9AC4', label: 'Sonore' },
  energie: { icon: 'flash-outline', color: '#E8B839', label: 'Énergie' },
  liberation: { icon: 'water-outline', color: '#6BA3BE', label: 'Libération' },
  affirmation: { icon: 'sparkles-outline', color: '#D4A574', label: 'Affirmation' },
  sensoriel: { icon: 'hand-left-outline', color: '#C49A9A', label: 'Sensoriel' },
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
  rituals: DailyRitual[];
  wisdomQuote?: { text: string; author: string };
}

const TIME_LABELS: Record<string, string> = {
  matin: 'Matin',
  'apres-midi': 'Après-midi',
  soir: 'Soir',
};

const GREETINGS: Record<string, string> = {
  matin: 'Un nouveau jour s\'éveille avec toi. Prends un moment pour accueillir cette lumière naissante.',
  'apres-midi': 'Le jour a trouvé son rythme. C\'est l\'heure de faire une pause et de recentrer ton énergie.',
  soir: 'La journée touche à sa fin. Offre-toi ce temps de douceur pour honorer tout ce que tu as traversé.',
};

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
  const [loading, setLoading] = useState(true);
  
  const RITUELS: Record<string, DailyRitual[]> = {
    matin: [
      { id: 'reveil', type: 'intention', title: 'Réveil en conscience', description: 'Avant de te lever, prends 30 secondes pour ressentir ton corps. Étire-toi doucement comme un chat.', duration: '1 min', completed: false },
      { id: 'intention', type: 'intention', title: 'Intention du jour', description: 'Pose une intention claire pour ta journée. Pas un objectif, mais une manière d\'être.', duration: '2 min', completed: false, requiresInput: true, inputPlaceholder: 'Aujourd\'hui, je choisis de...' },
      { id: 'breath', type: 'respiration', title: 'Souffle vital', description: 'Inspire 4 secondes par le nez, retiens 4 secondes, expire 6 secondes par la bouche. Répète 5 fois.', duration: '2 min', completed: false },
      { id: 'hydratation', type: 'meditation', title: 'Premier verre d\'eau', description: 'Bois un grand verre d\'eau tiède en conscience. Visualise cette eau qui réveille chaque cellule.', duration: '1 min', completed: false },
      { id: 'mouvement', type: 'exercice', title: 'Éveil du corps', description: 'Quelques rotations douces : cou, épaules, hanches. Réveille ton corps sans le brusquer.', duration: '3 min', completed: false },
      { id: 'gratitude_matin', type: 'gratitude', title: 'Gratitude matinale', description: 'Nomme une chose simple pour laquelle tu es reconnaissant ce matin.', duration: '1 min', completed: false, requiresInput: true, inputPlaceholder: 'Ce matin, je suis reconnaissant pour...' },
    ],
    'apres-midi': [
      { id: 'pause', type: 'silence', title: 'Pause sacrée', description: 'Arrête tout. Ferme les yeux. 3 respirations profondes. C\'est ta pause à toi.', duration: '2 min', completed: false },
      { id: 'scan', type: 'introspection', title: 'Scan corporel rapide', description: 'Parcours mentalement ton corps de la tête aux pieds. Où sont les tensions ? Relâche-les.', duration: '3 min', completed: false },
      { id: 'marche', type: 'marche', title: 'Marche consciente', description: 'Marche quelques minutes en sentant chaque pas. Pieds nus si possible.', duration: '5 min', completed: false },
      { id: 'nature', type: 'nature', title: 'Connexion nature', description: 'Touche une plante, regarde le ciel, écoute les oiseaux. Reconnecte-toi au vivant.', duration: '3 min', completed: false },
      { id: 'introspection', type: 'introspection', title: 'Check-in émotionnel', description: 'Comment te sens-tu vraiment, là maintenant ? Pas de jugement, juste observer.', duration: '2 min', completed: false, requiresInput: true, inputPlaceholder: 'En ce moment, je ressens...' },
      { id: 'creativite', type: 'ecriture', title: 'Minute créative', description: 'Dessine un gribouillis, écris un mot, chante une note. Exprime quelque chose sans réfléchir.', duration: '2 min', completed: false },
    ],
    soir: [
      { id: 'transition', type: 'silence', title: 'Transition douce', description: 'Éteins les écrans. Allume une bougie ou tamise les lumières. C\'est l\'heure de ralentir.', duration: '2 min', completed: false },
      { id: 'detox', type: 'meditation', title: 'Détox digitale', description: 'Pose ton téléphone loin de toi. Tu n\'en as plus besoin ce soir.', duration: '1 min', completed: false },
      { id: 'bilan', type: 'bilan', title: 'Bilan du jour', description: '3 choses bien : qu\'est-ce qui s\'est bien passé ? 1 apprentissage : qu\'as-tu appris ?', duration: '5 min', completed: false, requiresInput: true, inputPlaceholder: 'Aujourd\'hui, j\'ai appris que...' },
      { id: 'pardon', type: 'gratitude', title: 'Pardon du soir', description: 'Pardonne-toi pour ce que tu n\'as pas fait ou mal fait. Demain est un nouveau jour.', duration: '2 min', completed: false },
      { id: 'gratitude_soir', type: 'gratitude', title: 'Gratitudes du jour', description: 'Note 3 moments de ta journée pour lesquels tu ressens de la gratitude.', duration: '3 min', completed: false, requiresInput: true, inputPlaceholder: '1. ...\n2. ...\n3. ...' },
      { id: 'silence_soir', type: 'silence', title: 'Minute de silence', description: 'Ferme les yeux. Écoute le silence. Laisse tes pensées passer comme des nuages.', duration: '2 min', completed: false },
      { id: 'visualisation', type: 'meditation', title: 'Visualisation demain', description: 'Imagine ta journée de demain se dérouler parfaitement. Comment te sens-tu ?', duration: '3 min', completed: false },
    ],
  };

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
    
    fetchStreak();
  }, []);

  useEffect(() => {
    const data: CadenceData = {
      greeting: GREETINGS[timeOfDay],
      rituals: RITUELS[timeOfDay],
      wisdomQuote: { text: "Ce que tu cherches te cherche aussi.", author: "Rumi" },
    };
    setCadenceData(data);
    setLoading(false);
  }, [timeOfDay]);

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

  const toggleRitual = (id: string) => {
    if (completedRituals.includes(id)) {
      setCompletedRituals(prev => prev.filter(r => r !== id));
    } else {
      setCompletedRituals(prev => [...prev, id]);
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

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-down" size={28} color={theme.iconColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, ds.text]}>Cadence</Text>
        <StreakFlame streak={streak} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(800)} style={styles.iconSection}>
          <PulsingInfinity size={70} />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400)} style={styles.timeBadgeContainer}>
          <View style={[styles.timeBadge, { backgroundColor: `${theme.accentWarm}20` }]}>
            <Ionicons 
              name={timeOfDay === 'matin' ? 'sunny-outline' : timeOfDay === 'apres-midi' ? 'partly-sunny-outline' : 'moon-outline'} 
              size={14} 
              color={theme.accentWarm} 
            />
            <Text style={[styles.timeBadgeText, { color: theme.accentWarm }]}>
              {TIME_LABELS[timeOfDay]}
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(600).delay(100)}>
          <Text style={[styles.subtitle, ds.textMuted]}>Ton rythme intérieur</Text>
          <Text style={[styles.greeting, ds.text]}>{cadenceData?.greeting}</Text>
        </Animated.View>

        {cadenceData?.wisdomQuote && (
          <Animated.View entering={FadeInUp.duration(600).delay(200)} style={[styles.quoteCard, ds.card]}>
            <Text style={styles.quoteIcon}>✦</Text>
            <Text style={[styles.quoteText, ds.textSecondary]}>"{cadenceData.wisdomQuote.text}"</Text>
            <Text style={[styles.quoteAuthor, ds.textMuted]}>— {cadenceData.wisdomQuote.author}</Text>
          </Animated.View>
        )}

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

        <Text style={[styles.sectionTitle, ds.text]}>Tes micro-rituels</Text>
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
                    if (ritual.id === 'gratitude' || ritual.id === 'gratitude_soir' || ritual.id === 'gratitude_matin') {
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
                        <Text style={styles.saveInputText}>Valider</Text>
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

        {showGratitude && (
          <Animated.View entering={FadeIn.duration(300)} style={[styles.inputModal, ds.card]}>
            <Text style={[styles.inputModalTitle, ds.text]}>Tes gratitudes</Text>
            <Text style={[styles.inputModalSubtitle, ds.textMuted]}>Nomme 3 choses pour lesquelles tu es reconnaissant</Text>
            {[0, 1, 2].map((idx) => (
              <View key={idx} style={styles.gratitudeRow}>
                <Text style={[styles.gratitudeNumber, { color: theme.accentWarm }]}>{idx + 1}.</Text>
                <TextInput
                  style={[styles.gratitudeInput, ds.text, { backgroundColor: theme.background, borderColor: theme.border }]}
                  placeholder={`Gratitude ${idx + 1}...`}
                  placeholderTextColor={theme.textMuted}
                  value={gratitudes[idx]}
                  onChangeText={(text) => handleGratitudeChange(idx, text)}
                />
              </View>
            ))}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalCancelBtn, { borderColor: theme.border }]} onPress={() => setShowGratitude(false)}>
                <Text style={[styles.modalCancelText, ds.textMuted]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSaveBtn, { backgroundColor: theme.accentWarm }]} onPress={saveGratitudes}>
                <Text style={styles.modalSaveText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {showIntention && (
          <Animated.View entering={FadeIn.duration(300)} style={[styles.inputModal, ds.card]}>
            <Text style={[styles.inputModalTitle, ds.text]}>Ton intention</Text>
            <Text style={[styles.inputModalSubtitle, ds.textMuted]}>Quelle énergie veux-tu cultiver aujourd'hui ?</Text>
            <TextInput
              style={[styles.intentionInput, ds.text, { backgroundColor: theme.background, borderColor: theme.border }]}
              placeholder="Aujourd'hui, je choisis de..."
              placeholderTextColor={theme.textMuted}
              value={intention}
              onChangeText={setIntention}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalCancelBtn, { borderColor: theme.border }]} onPress={() => setShowIntention(false)}>
                <Text style={[styles.modalCancelText, ds.textMuted]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSaveBtn, { backgroundColor: theme.accentWarm }]} onPress={saveIntention}>
                <Text style={styles.modalSaveText}>Poser mon intention</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {allCompleted && (
          <Animated.View entering={FadeIn.duration(600)} style={[styles.completionCard, { backgroundColor: `${theme.accentWarm}15` }]}>
            <Text style={styles.completionEmoji}>✨</Text>
            <Text style={[styles.completionTitle, { color: theme.accentWarm }]}>
              Cadence honorée
            </Text>
            <Text style={[styles.completionText, ds.textSecondary]}>
              Tu as pris soin de toi aujourd'hui. {streak > 0 && `${streak + 1} jours de suite !`}
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

  completionCard: { padding: 24, borderRadius: 16, alignItems: 'center', marginTop: 20 },
  completionEmoji: { fontSize: 36, marginBottom: 10 },
  completionTitle: { fontSize: 18, fontWeight: '500', marginBottom: 6 },
  completionText: { fontSize: 14, textAlign: 'center' },
});
