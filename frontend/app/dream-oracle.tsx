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
  Modal,
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
import { useAuth } from '../src/context/AuthContext';
import { TwinklingStars } from '../src/components/TwinklingStars';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// Dream symbols and their meanings
const DREAM_SYMBOLS = {
  'eau': { icon: '💧', meaning: 'Émotions, inconscient, purification' },
  'vol': { icon: '🦅', meaning: 'Liberté, ambition, évasion' },
  'chute': { icon: '🌀', meaning: 'Perte de contrôle, lâcher-prise' },
  'mort': { icon: '🦋', meaning: 'Transformation, renaissance' },
  'poursuite': { icon: '🏃', meaning: 'Fuite, conflit intérieur' },
  'maison': { icon: '🏠', meaning: 'Soi, psyché, sécurité' },
  'animaux': { icon: '🐺', meaning: 'Instincts, nature sauvage' },
  'serpent': { icon: '🐍', meaning: 'Transformation, sagesse' },
  'feu': { icon: '🔥', meaning: 'Passion, purification' },
  'forêt': { icon: '🌲', meaning: 'Inconscient, mystère' },
  'lune': { icon: '🌙', meaning: 'Féminin, intuition, cycles' },
  'miroir': { icon: '🪞', meaning: 'Réflexion, identité, vérité' },
};

interface Dream {
  id: string;
  title: string;
  content: string;
  date: string;
  emotions: string[];
}

interface OracleReading {
  patterns: {
    symbol: string;
    count: number;
    meaning: string;
    icon: string;
  }[];
  emotionalTheme: string;
  deepMessage: string;
  guidance: string[];
}

// Animated Oracle Eye Component
const OracleEye = ({ size = 80 }: { size?: number }) => {
  const pulse = useSharedValue(0);
  const glow = useSharedValue(0);
  const blink = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
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
    // Occasional blink
    blink.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4000 }),
        withTiming(0.2, { duration: 150 }),
        withTiming(1, { duration: 150 })
      ),
      -1,
      false
    );
  }, []);

  const eyeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.05]) }],
    opacity: blink.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.2, 0.5]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [1, 1.4]) }],
  }));

  return (
    <View style={[styles.eyeContainer, { width: size * 2.5, height: size * 2.5 }]}>
      <Animated.View
        style={[
          styles.eyeGlow,
          glowStyle,
          { width: size * 2, height: size * 2, borderRadius: size, backgroundColor: 'rgba(212, 165, 116, 0.3)' }
        ]}
      />
      <Animated.View style={eyeStyle}>
        <Text style={{ fontSize: size }}>👁️</Text>
      </Animated.View>
    </View>
  );
};

// Floating Mist Animation
const FloatingMist = () => {
  const float1 = useSharedValue(0);
  const float2 = useSharedValue(0);

  useEffect(() => {
    float1.value = withRepeat(
      withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    float2.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 1000 }),
        withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const mist1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(float1.value, [0, 1], [-30, 30]) },
      { translateY: interpolate(float1.value, [0, 1], [-10, 10]) },
    ],
    opacity: interpolate(float1.value, [0, 0.5, 1], [0.1, 0.3, 0.1]),
  }));

  const mist2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(float2.value, [0, 1], [20, -20]) },
      { translateY: interpolate(float2.value, [0, 1], [5, -15]) },
    ],
    opacity: interpolate(float2.value, [0, 0.5, 1], [0.15, 0.25, 0.15]),
  }));

  return (
    <View style={styles.mistContainer}>
      <Animated.View style={[styles.mist, mist1Style, { left: '10%', top: '20%' }]} />
      <Animated.View style={[styles.mist, mist2Style, { right: '10%', bottom: '30%' }]} />
    </View>
  );
};

export default function DreamOracleScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { subscriptionStatus } = useAuth();
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [oracleReading, setOracleReading] = useState<OracleReading | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // Check subscription access
  const userTier = subscriptionStatus?.tier || 'free';
  const hasPremiumAccess = userTier === 'premium' || userTier === 'lifetime';

  const ds = {
    container: { backgroundColor: theme.background },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    textMuted: { color: theme.textMuted },
    card: { backgroundColor: theme.card },
  };

  useEffect(() => {
    fetchDreams();
  }, []);

  const fetchDreams = async () => {
    try {
      const response = await fetch(`${API_URL}/api/dreams`);
      if (response.ok) {
        const data = await response.json();
        setDreams(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching dreams:', error);
    }
    setLoading(false);
  };

  const analyzePatterns = async () => {
    // Check premium access first
    if (!hasPremiumAccess) {
      setShowPremiumModal(true);
      return;
    }

    setAnalyzing(true);

    // Analyze dream content for symbols
    const allContent = dreams.map(d => d.content?.toLowerCase() || '').join(' ');
    const allEmotions = dreams.flatMap(d => d.emotions || []);
    
    // Find matching symbols
    const foundPatterns: { symbol: string; count: number; meaning: string; icon: string }[] = [];
    
    Object.entries(DREAM_SYMBOLS).forEach(([key, value]) => {
      const regex = new RegExp(key, 'gi');
      const matches = allContent.match(regex);
      if (matches && matches.length > 0) {
        foundPatterns.push({
          symbol: key,
          count: matches.length,
          meaning: value.meaning,
          icon: value.icon,
        });
      }
    });

    // Sort by frequency
    foundPatterns.sort((a, b) => b.count - a.count);

    // Determine emotional theme
    const emotionCounts: Record<string, number> = {};
    allEmotions.forEach(e => {
      emotionCounts[e] = (emotionCounts[e] || 0) + 1;
    });
    const dominantEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'variée';

    // Try to get AI interpretation
    try {
      const response = await fetch(`${API_URL}/api/dream-oracle/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dreams: dreams.slice(0, 10),
          patterns: foundPatterns.slice(0, 5),
          dominantEmotion,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setOracleReading(data);
      } else {
        setOracleReading(generateLocalReading(foundPatterns, dominantEmotion));
      }
    } catch (error) {
      setOracleReading(generateLocalReading(foundPatterns, dominantEmotion));
    }

    setAnalyzing(false);
  };

  const generateLocalReading = (patterns: typeof foundPatterns, emotion: string): OracleReading => {
    const topPatterns = patterns.slice(0, 4);
    
    let deepMessage = '';
    if (topPatterns.length > 0) {
      const mainSymbol = topPatterns[0];
      deepMessage = `L'Oracle a scruté les profondeurs de tes nuits et révèle une préoccupation centrale autour de "${mainSymbol.symbol}". Ce symbole, apparu ${mainSymbol.count} fois, murmure des vérités sur ${mainSymbol.meaning.toLowerCase()}.\n\n`;
      
      if (topPatterns.length > 1) {
        deepMessage += `En association avec "${topPatterns[1].symbol}", ton inconscient tisse un récit de transformation. L'émotion dominante de ${emotion} colore ces visions d'une teinte particulière, invitant à une introspection plus profonde.`;
      }
    } else {
      deepMessage = 'Tes rêves sont comme des étoiles dispersées dans un ciel infini. L\'Oracle perçoit une richesse intérieure qui se révèle fragment par fragment. Continue à noter tes songes pour que les patterns se dessinent plus clairement.';
    }

    return {
      patterns: topPatterns,
      emotionalTheme: emotion,
      deepMessage,
      guidance: [
        "Avant de dormir, pose une question à ton inconscient",
        "Les symboles récurrents sont des messagers - médite sur leur signification",
        "Tiens un carnet près de ton lit pour capturer l'essence de tes rêves au réveil",
      ],
    };
  };

  const resetReading = () => {
    setOracleReading(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, ds.container]}>
        <ActivityIndicator size="large" color={theme.accent} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, ds.container]}>
      <TwinklingStars starCount={60} minSize={1} maxSize={2.5} />
      <FloatingMist />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} data-testid="back-button">
          <Ionicons name="chevron-down" size={28} color={theme.iconColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, ds.text]}>Oracle des Rêves</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Oracle Eye */}
        {!oracleReading && (
          <Animated.View entering={FadeIn.duration(800)} style={styles.eyeSection}>
            <OracleEye size={70} />
          </Animated.View>
        )}

        {/* Intro */}
        {!oracleReading && (
          <Animated.View entering={FadeInUp.duration(600).delay(200)} style={styles.introContainer}>
            <Text style={[styles.introTitle, ds.text]}>L'Œil qui voit au-delà</Text>
            <Text style={[styles.introText, ds.textSecondary]}>
              L'Oracle analyse tes rêves pour révéler les messages cachés de ton inconscient. 
              Les symboles récurrents dessinent une carte de ton monde intérieur.
            </Text>
            
            {/* Premium Badge for non-premium users */}
            {!hasPremiumAccess && (
              <View style={styles.premiumBadge}>
                <Ionicons name="diamond" size={16} color="#9B59B6" />
                <Text style={styles.premiumBadgeText}>Fonctionnalité Premium</Text>
              </View>
            )}
            
            <View style={[styles.statsCard, ds.card]}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, ds.text]}>{dreams.length}</Text>
                <Text style={[styles.statLabel, ds.textMuted]}>rêves enregistrés</Text>
              </View>
            </View>

            {dreams.length < 3 ? (
              <View style={[styles.warningCard, { backgroundColor: `${theme.accentWarm}15` }]}>
                <Ionicons name="moon-outline" size={20} color={theme.accentWarm} />
                <Text style={[styles.warningText, { color: theme.accentWarm }]}>
                  Note au moins 3 rêves pour une lecture significative. L'Oracle a besoin de matière pour voir.
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.analyzeButton, 
                  { backgroundColor: hasPremiumAccess ? theme.accentWarm : '#9B59B6' }
                ]}
                onPress={analyzePatterns}
                disabled={analyzing}
                data-testid="consult-oracle-btn"
              >
                {analyzing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name={hasPremiumAccess ? "eye" : "diamond"} size={20} color="#fff" />
                    <Text style={styles.analyzeButtonText}>
                      {hasPremiumAccess ? 'Consulter l\'Oracle' : 'Passer en Premium'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.addDreamButton, { borderColor: theme.border }]}
              onPress={() => router.push('/dreams')}
              data-testid="add-dream-btn"
            >
              <Ionicons name="add" size={20} color={theme.textMuted} />
              <Text style={[styles.addDreamText, ds.textMuted]}>Ajouter un rêve</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Oracle Reading */}
        {oracleReading && (
          <Animated.View entering={FadeInUp.duration(600)}>
            {/* Reading Header */}
            <View style={[styles.readingHeader, ds.card]}>
              <Text style={styles.readingIcon}>🌙</Text>
              <Text style={[styles.readingTitle, ds.text]}>Révélation de l'Oracle</Text>
              <View style={[styles.emotionBadge, { backgroundColor: `${theme.accentWarm}20` }]}>
                <Text style={[styles.emotionText, { color: theme.accentWarm }]}>
                  Thème : {oracleReading.emotionalTheme}
                </Text>
              </View>
            </View>

            {/* Patterns Found */}
            {oracleReading.patterns && oracleReading.patterns.length > 0 && (
              <View style={[styles.section, ds.card]}>
                <Text style={[styles.sectionTitle, ds.text]}>
                  <Ionicons name="key-outline" size={16} /> Symboles révélés
                </Text>
                <View style={styles.patternsGrid}>
                  {oracleReading.patterns.map((pattern: any, i: number) => {
                    // Handle both AI response format and local format
                    const symbolName = pattern.symbol || pattern.pattern || 'symbole';
                    const symbolData = DREAM_SYMBOLS[symbolName.toLowerCase() as keyof typeof DREAM_SYMBOLS];
                    const icon = pattern.icon || symbolData?.icon || '✨';
                    const meaning = pattern.meaning || pattern.significance || symbolData?.meaning || '';
                    const count = pattern.count || 1;
                    
                    return (
                      <Animated.View
                        key={symbolName + i}
                        entering={FadeInUp.delay(i * 100)}
                        style={[styles.patternCard, { backgroundColor: theme.background }]}
                      >
                        <Text style={styles.patternIcon}>{icon}</Text>
                        <Text style={[styles.patternSymbol, ds.text]}>{symbolName}</Text>
                        {pattern.count && <Text style={[styles.patternCount, { color: theme.accentWarm }]}>×{count}</Text>}
                        <Text style={[styles.patternMeaning, ds.textMuted]} numberOfLines={3}>{meaning}</Text>
                      </Animated.View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Deep Message */}
            <View style={[styles.section, ds.card, { borderLeftWidth: 3, borderLeftColor: theme.accentWarm }]}>
              <Text style={[styles.sectionTitle, ds.text]}>
                <Ionicons name="sparkles-outline" size={16} /> Message de l'inconscient
              </Text>
              <Text style={[styles.deepMessage, ds.textSecondary]}>
                {oracleReading.deepMessage}
              </Text>
            </View>

            {/* Guidance */}
            <View style={[styles.section, ds.card]}>
              <Text style={[styles.sectionTitle, ds.text]}>
                <Ionicons name="compass-outline" size={16} /> Guidance
              </Text>
              {oracleReading.guidance.map((g, i) => (
                <View key={i} style={styles.guidanceItem}>
                  <Text style={[styles.guidanceBullet, { color: theme.accent }]}>✧</Text>
                  <Text style={[styles.guidanceText, ds.textSecondary]}>{g}</Text>
                </View>
              ))}
            </View>

            {/* Reset Button */}
            <TouchableOpacity
              style={[styles.resetButton, { borderColor: theme.border }]}
              onPress={resetReading}
              data-testid="new-consultation-btn"
            >
              <Ionicons name="refresh" size={18} color={theme.textMuted} />
              <Text style={[styles.resetButtonText, ds.textMuted]}>Nouvelle consultation</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Symbol Guide */}
        <Animated.View entering={FadeInUp.duration(600).delay(400)}>
          <Text style={[styles.guideTitle, ds.text]}>Guide des Symboles</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {Object.entries(DREAM_SYMBOLS).slice(0, 8).map(([key, value]) => (
              <View key={key} style={[styles.symbolCard, ds.card]}>
                <Text style={styles.symbolIcon}>{value.icon}</Text>
                <Text style={[styles.symbolName, ds.text]}>{key}</Text>
                <Text style={[styles.symbolMeaning, ds.textMuted]} numberOfLines={2}>
                  {value.meaning}
                </Text>
              </View>
            ))}
          </ScrollView>
        </Animated.View>
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

  mistContainer: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    pointerEvents: 'none' 
  },
  mist: { 
    position: 'absolute', 
    width: 150, 
    height: 100, 
    borderRadius: 75, 
    backgroundColor: 'rgba(212, 165, 116, 0.15)' 
  },

  eyeSection: { alignItems: 'center', marginBottom: 10 },
  eyeContainer: { alignItems: 'center', justifyContent: 'center' },
  eyeGlow: { position: 'absolute' },

  introContainer: { alignItems: 'center', marginBottom: 30 },
  introTitle: { fontSize: 22, fontWeight: '600', marginBottom: 12 },
  introText: { 
    fontSize: 14, 
    textAlign: 'center', 
    lineHeight: 22, 
    marginBottom: 24,
    paddingHorizontal: 10,
  },

  statsCard: { 
    paddingVertical: 20, 
    paddingHorizontal: 40, 
    borderRadius: 16, 
    marginBottom: 20 
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 36, fontWeight: '700' },
  statLabel: { fontSize: 12, marginTop: 4 },

  warningCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 12, 
    gap: 12,
    marginBottom: 16,
  },
  warningText: { flex: 1, fontSize: 13, lineHeight: 20 },

  analyzeButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 16, 
    paddingHorizontal: 30, 
    borderRadius: 30, 
    gap: 10,
    marginBottom: 12,
  },
  analyzeButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  addDreamButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    borderRadius: 25, 
    borderWidth: 1,
    gap: 8,
  },
  addDreamText: { fontSize: 14 },

  readingHeader: { 
    alignItems: 'center', 
    padding: 24, 
    borderRadius: 20, 
    marginBottom: 16 
  },
  readingIcon: { fontSize: 40, marginBottom: 12 },
  readingTitle: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  emotionBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  emotionText: { fontSize: 13, fontWeight: '500' },

  section: { padding: 20, borderRadius: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 16 },

  patternsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  patternCard: { 
    width: (width - 80) / 2, 
    padding: 14, 
    borderRadius: 12, 
    alignItems: 'center',
    minHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 116, 0.2)',
  },
  patternIcon: { fontSize: 28, marginBottom: 6, textAlign: 'center' },
  patternSymbol: { fontSize: 14, fontWeight: '600', textTransform: 'capitalize', textAlign: 'center' },
  patternCount: { fontSize: 12, fontWeight: '500', marginBottom: 4, textAlign: 'center' },
  patternMeaning: { fontSize: 11, textAlign: 'center', lineHeight: 16 },

  deepMessage: { fontSize: 15, lineHeight: 26, fontStyle: 'italic' },

  guidanceItem: { flexDirection: 'row', marginBottom: 12 },
  guidanceBullet: { marginRight: 10, fontSize: 14 },
  guidanceText: { flex: 1, fontSize: 14, lineHeight: 22 },

  resetButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 14, 
    borderRadius: 25, 
    borderWidth: 1,
    gap: 8,
    marginTop: 10,
    marginBottom: 30,
  },
  resetButtonText: { fontSize: 14 },

  guideTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  symbolCard: { 
    width: 110, 
    padding: 14, 
    borderRadius: 12, 
    marginRight: 10, 
    alignItems: 'center',
  },
  symbolIcon: { fontSize: 28, marginBottom: 8 },
  symbolName: { fontSize: 13, fontWeight: '600', marginBottom: 4, textTransform: 'capitalize' },
  symbolMeaning: { fontSize: 10, textAlign: 'center' },
});
