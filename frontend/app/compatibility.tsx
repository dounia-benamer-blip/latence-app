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
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeIn, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import { CandleFlame } from '../src/components/CandleFlame';
import { TwinklingStars } from '../src/components/TwinklingStars';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Profile {
  name: string;
  birthDate: string;
  zodiac?: string;
  lunarSign?: string;
}

interface CompatibilityResult {
  score: number;
  analysis: string;
  strengths: string[];
  challenges: string[];
  advice: string;
}

export default function CompatibilityScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [profile1, setProfile1] = useState<Profile>({ name: '', birthDate: '' });
  const [profile2, setProfile2] = useState<Profile>({ name: '', birthDate: '' });
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const heartScale = useSharedValue(1);

  const ds = {
    container: { backgroundColor: theme.background },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    textMuted: { color: theme.textMuted },
    card: { backgroundColor: theme.card },
  };

  useEffect(() => {
    heartScale.value = withRepeat(
      withTiming(1.15, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const calculateCompatibility = async () => {
    if (!profile1.name || !profile1.birthDate || !profile2.name || !profile2.birthDate) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/compatibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile1: { name: profile1.name, birth_date: profile1.birthDate },
          profile2: { name: profile2.name, birth_date: profile2.birthDate },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        // Mock result if API doesn't exist
        setResult(generateMockResult());
      }
    } catch (error) {
      setResult(generateMockResult());
    }
    setLoading(false);
    setShowResult(true);
  };

  const generateMockResult = (): CompatibilityResult => {
    const score = Math.floor(Math.random() * 40) + 60; // 60-100
    return {
      score,
      analysis: `${profile1.name} et ${profile2.name} partagent une connexion cosmique unique. Vos énergies se complètent d'une manière rare et précieuse. La lune qui veille sur vos deux âmes tisse des liens invisibles mais puissants.`,
      strengths: [
        'Communication intuitive profonde',
        'Valeurs fondamentales alignées',
        'Croissance émotionnelle mutuelle',
        'Complémentarité des énergies'
      ],
      challenges: [
        'Gérer les moments de silence',
        'Équilibrer indépendance et fusion',
        'Naviguer les différences de rythme'
      ],
      advice: `Cultivez les moments de silence partagé. C'est dans ces espaces que votre connexion se renforce. La lune vous guide vers une harmonie plus profonde.`
    };
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return '#7DA87D'; // Vert - excellent
    if (score >= 70) return '#D4A574'; // Orange - très bon
    if (score >= 55) return '#A89D7D'; // Beige - bon
    return '#9A8B7D'; // Neutre
  };

  const renderProfileInput = (
    profile: Profile,
    setProfile: React.Dispatch<React.SetStateAction<Profile>>,
    label: string
  ) => (
    <Animated.View entering={FadeInUp.duration(400)} style={[styles.profileCard, ds.card]}>
      <Text style={[styles.profileLabel, ds.textMuted]}>{label}</Text>
      <TextInput
        style={[styles.input, ds.text, { borderColor: theme.border, backgroundColor: theme.inputBackground }]}
        placeholder="Prénom"
        placeholderTextColor={theme.textMuted}
        value={profile.name}
        onChangeText={(text) => setProfile({ ...profile, name: text })}
      />
      <TextInput
        style={[styles.input, ds.text, { borderColor: theme.border, backgroundColor: theme.inputBackground }]}
        placeholder="Date de naissance (JJ/MM/AAAA)"
        placeholderTextColor={theme.textMuted}
        value={profile.birthDate}
        onChangeText={(text) => setProfile({ ...profile, birthDate: text })}
      />
    </Animated.View>
  );

  return (
    <SafeAreaView style={[styles.container, ds.container]}>
      <TwinklingStars starCount={30} minSize={1} maxSize={2} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-down" size={28} color={theme.iconColor} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <CandleFlame size="small" intensity="gentle" />
          <Text style={[styles.headerTitle, ds.text]}>Compatibilité</Text>
          <CandleFlame size="small" intensity="gentle" />
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Heart Animation */}
        <Animated.View style={[styles.heartContainer, heartStyle]}>
          <Ionicons name="heart" size={60} color={theme.accentWarm} />
        </Animated.View>

        <Text style={[styles.subtitle, ds.textSecondary]}>
          Découvre l'alchimie cosmique entre deux âmes
        </Text>

        {/* Profile Inputs */}
        {renderProfileInput(profile1, setProfile1, 'PREMIÈRE ÂME')}
        
        <View style={styles.versusContainer}>
          <View style={[styles.versusLine, { backgroundColor: theme.border }]} />
          <Text style={[styles.versusText, { color: theme.accentWarm }]}>✧</Text>
          <View style={[styles.versusLine, { backgroundColor: theme.border }]} />
        </View>

        {renderProfileInput(profile2, setProfile2, 'DEUXIÈME ÂME')}

        {/* Calculate Button */}
        <TouchableOpacity
          style={[
            styles.calculateButton,
            { 
              backgroundColor: (profile1.name && profile1.birthDate && profile2.name && profile2.birthDate) 
                ? theme.accentWarm 
                : theme.card,
              borderColor: theme.border,
            }
          ]}
          onPress={calculateCompatibility}
          disabled={loading || !profile1.name || !profile1.birthDate || !profile2.name || !profile2.birthDate}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="sparkles" size={20} color={profile1.name && profile2.name ? '#fff' : theme.textMuted} />
              <Text style={[
                styles.calculateText,
                { color: profile1.name && profile2.name ? '#fff' : theme.textMuted }
              ]}>
                Révéler l'alchimie
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Result Modal */}
      <Modal visible={showResult} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
          <View style={[styles.modalContent, ds.card]}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowResult(false)}>
              <Ionicons name="close" size={24} color={theme.iconColor} />
            </TouchableOpacity>

            {result && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Score */}
                <View style={styles.scoreContainer}>
                  <Text style={[styles.scoreValue, { color: getScoreColor(result.score) }]}>
                    {result.score}%
                  </Text>
                  <Text style={[styles.scoreLabel, ds.textMuted]}>HARMONIE COSMIQUE</Text>
                </View>

                {/* Names */}
                <Text style={[styles.namesText, ds.text]}>
                  {profile1.name} & {profile2.name}
                </Text>

                {/* Analysis */}
                <Text style={[styles.analysisText, ds.textSecondary]}>
                  {result.analysis}
                </Text>

                {/* Strengths */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.accent }]}>
                    <Ionicons name="sunny-outline" size={16} /> Forces de votre union
                  </Text>
                  {result.strengths.map((s, i) => (
                    <View key={i} style={styles.listItem}>
                      <Text style={[styles.listBullet, { color: theme.accent }]}>✧</Text>
                      <Text style={[styles.listText, ds.text]}>{s}</Text>
                    </View>
                  ))}
                </View>

                {/* Challenges */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.accentWarm }]}>
                    <Ionicons name="moon-outline" size={16} /> Défis à transcender
                  </Text>
                  {result.challenges.map((c, i) => (
                    <View key={i} style={styles.listItem}>
                      <Text style={[styles.listBullet, { color: theme.accentWarm }]}>✧</Text>
                      <Text style={[styles.listText, ds.text]}>{c}</Text>
                    </View>
                  ))}
                </View>

                {/* Advice */}
                <View style={[styles.adviceCard, { backgroundColor: `${theme.accent}15` }]}>
                  <Text style={[styles.adviceTitle, { color: theme.accent }]}>
                    Message de la lune
                  </Text>
                  <Text style={[styles.adviceText, ds.textSecondary]}>
                    {result.advice}
                  </Text>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backButton: { padding: 4 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 18, fontWeight: '600', letterSpacing: 1 },
  placeholder: { width: 36 },
  scrollContent: { padding: 20, paddingBottom: 40 },

  heartContainer: { alignItems: 'center', marginVertical: 20 },
  subtitle: { textAlign: 'center', fontSize: 14, marginBottom: 30, fontStyle: 'italic', lineHeight: 22 },

  profileCard: { padding: 20, borderRadius: 16, marginBottom: 16 },
  profileLabel: { fontSize: 10, letterSpacing: 2, marginBottom: 16, textAlign: 'center' },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 12 },

  versusContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  versusLine: { flex: 1, height: 1 },
  versusText: { fontSize: 20, marginHorizontal: 16 },

  calculateButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 16, 
    borderRadius: 30, 
    marginTop: 20,
    gap: 10,
    borderWidth: 1,
  },
  calculateText: { fontSize: 16, fontWeight: '600' },

  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  closeButton: { alignSelf: 'flex-end', padding: 4 },

  scoreContainer: { alignItems: 'center', marginVertical: 20 },
  scoreValue: { fontSize: 64, fontWeight: '700' },
  scoreLabel: { fontSize: 10, letterSpacing: 2 },
  namesText: { fontSize: 20, fontWeight: '600', textAlign: 'center', marginBottom: 20 },
  analysisText: { fontSize: 15, lineHeight: 24, textAlign: 'center', marginBottom: 24, fontStyle: 'italic' },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  listBullet: { marginRight: 10, fontSize: 12 },
  listText: { flex: 1, fontSize: 14, lineHeight: 20 },

  adviceCard: { padding: 20, borderRadius: 16, marginBottom: 20 },
  adviceTitle: { fontSize: 12, fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  adviceText: { fontSize: 14, lineHeight: 22, textAlign: 'center', fontStyle: 'italic' },
});
