import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import { CandleFlame } from '../src/components/CandleFlame';
import { TwinklingStars } from '../src/components/TwinklingStars';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// Dream symbols and their meanings
const DREAM_SYMBOLS = {
  'eau': { icon: '🌊', meaning: 'Émotions, inconscient, purification', advice: 'Explore tes sentiments profonds' },
  'vol': { icon: '🦅', meaning: 'Liberté, ambition, évasion', advice: 'Quels obstacles veux-tu dépasser ?' },
  'chute': { icon: '⬇️', meaning: 'Perte de contrôle, peur, lâcher-prise', advice: 'Qu\'est-ce qui t\'échappe en ce moment ?' },
  'mort': { icon: '🦋', meaning: 'Transformation, fin de cycle, renaissance', advice: 'Quelque chose se termine pour laisser place au nouveau' },
  'poursuite': { icon: '🏃', meaning: 'Fuite, évitement, conflit intérieur', advice: 'Qu\'est-ce que tu évites d\'affronter ?' },
  'maison': { icon: '🏠', meaning: 'Soi, psyché, sécurité', advice: 'Explore les différentes pièces de ton être' },
  'animaux': { icon: '🐺', meaning: 'Instincts, nature sauvage, guides', advice: 'Quel animal et quel message porte-t-il ?' },
  'bébé': { icon: '👶', meaning: 'Nouveau départ, vulnérabilité, créativité', advice: 'Un nouveau projet ou aspect de toi émerge' },
  'dents': { icon: '🦷', meaning: 'Confiance, apparence, pouvoir personnel', advice: 'Comment te sens-tu dans ton pouvoir ?' },
  'nudité': { icon: '✨', meaning: 'Vulnérabilité, authenticité, exposition', advice: 'As-tu peur d\'être vu(e) tel(le) que tu es ?' },
  'serpent': { icon: '🐍', meaning: 'Transformation, guérison, sagesse cachée', advice: 'Une mue intérieure est en cours' },
  'feu': { icon: '🔥', meaning: 'Passion, destruction créatrice, purification', advice: 'Quelle passion brûle en toi ?' },
  'forêt': { icon: '🌲', meaning: 'Inconscient, mystère, croissance', advice: 'Aventure-toi dans l\'inconnu' },
  'escalier': { icon: '🪜', meaning: 'Progression, élévation, transition', advice: 'Tu montes ou descends ? Vers quoi ?' },
  'miroir': { icon: '🪞', meaning: 'Réflexion, identité, vérité', advice: 'Qui vois-tu vraiment dans le miroir ?' },
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

export default function DreamOracleScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [oracleReading, setOracleReading] = useState<OracleReading | null>(null);

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
        setDreams(data.dreams || []);
      }
    } catch (error) {
      console.error('Error fetching dreams:', error);
    }
    setLoading(false);
  };

  const analyzePatterns = async () => {
    setAnalyzing(true);

    // Analyze dream content for symbols
    const allContent = dreams.map(d => d.content.toLowerCase()).join(' ');
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
          dreams: dreams.slice(0, 10), // Send last 10 dreams
          patterns: foundPatterns.slice(0, 5),
          dominantEmotion,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setOracleReading(data);
      } else {
        // Generate local reading
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
      deepMessage = `Tes rêves révèlent une préoccupation profonde autour de "${mainSymbol.symbol}". Ce symbole apparaît ${mainSymbol.count} fois, suggérant que ton inconscient te parle de ${mainSymbol.meaning.toLowerCase()}. `;
      
      if (topPatterns.length > 1) {
        deepMessage += `Associé à "${topPatterns[1].symbol}", cela indique un processus de ${emotion === 'peur' ? 'transformation à travers les défis' : 'croissance intérieure'}.`;
      }
    } else {
      deepMessage = 'Tes rêves sont variés et riches. Ton inconscient explore de nombreuses facettes de ton être. Continue à noter tes rêves pour révéler des patterns plus profonds.';
    }

    const guidance = [
      'Avant de dormir, pose une question à ton inconscient',
      'Tiens un carnet près de ton lit pour noter tes rêves au réveil',
      'Les rêves récurrents portent des messages importants',
      'Médite sur les symboles qui reviennent souvent',
    ];

    return {
      patterns: topPatterns,
      emotionalTheme: emotion,
      deepMessage,
      guidance: guidance.slice(0, 3),
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
      <TwinklingStars starCount={40} minSize={1} maxSize={3} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-down" size={28} color={theme.iconColor} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <CandleFlame size="small" intensity="gentle" />
          <Text style={[styles.headerTitle, ds.text]}>Oracle des Rêves</Text>
          <CandleFlame size="small" intensity="gentle" />
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Intro */}
        {!oracleReading && (
          <Animated.View entering={FadeIn} style={styles.introContainer}>
            <Text style={styles.introIcon}>🌙</Text>
            <Text style={[styles.introTitle, ds.text]}>L'Oracle de tes Rêves</Text>
            <Text style={[styles.introText, ds.textSecondary]}>
              Analyse tes rêves récents pour révéler les messages cachés de ton inconscient.
            </Text>
            
            <View style={[styles.statsCard, ds.card]}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, ds.text]}>{dreams.length}</Text>
                <Text style={[styles.statLabel, ds.textMuted]}>Rêves enregistrés</Text>
              </View>
            </View>

            {dreams.length < 3 ? (
              <View style={[styles.warningCard, { backgroundColor: `${theme.accentWarm}15` }]}>
                <Ionicons name="information-circle" size={20} color={theme.accentWarm} />
                <Text style={[styles.warningText, { color: theme.accentWarm }]}>
                  Note au moins 3 rêves pour une analyse significative. Va dans "Rêves" pour en ajouter.
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.analyzeButton, { backgroundColor: theme.accent }]}
                onPress={analyzePatterns}
                disabled={analyzing}
              >
                {analyzing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="eye" size={20} color="#fff" />
                    <Text style={styles.analyzeButtonText}>Consulter l'Oracle</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </Animated.View>
        )}

        {/* Oracle Reading */}
        {oracleReading && (
          <Animated.View entering={FadeInUp.duration(500)}>
            {/* Patterns Found */}
            {oracleReading.patterns.length > 0 && (
              <View style={[styles.section, ds.card]}>
                <Text style={[styles.sectionTitle, ds.text]}>Symboles récurrents</Text>
                <View style={styles.patternsGrid}>
                  {oracleReading.patterns.map((pattern, i) => (
                    <Animated.View
                      key={pattern.symbol}
                      entering={FadeInUp.delay(i * 100)}
                      style={[styles.patternCard, { backgroundColor: theme.background }]}
                    >
                      <Text style={styles.patternIcon}>{pattern.icon}</Text>
                      <Text style={[styles.patternSymbol, ds.text]}>{pattern.symbol}</Text>
                      <Text style={[styles.patternCount, { color: theme.accent }]}>×{pattern.count}</Text>
                      <Text style={[styles.patternMeaning, ds.textMuted]}>{pattern.meaning}</Text>
                    </Animated.View>
                  ))}
                </View>
              </View>
            )}

            {/* Emotional Theme */}
            <View style={[styles.section, ds.card]}>
              <Text style={[styles.sectionTitle, ds.text]}>Thème émotionnel</Text>
              <View style={[styles.emotionBadge, { backgroundColor: `${theme.accentWarm}20` }]}>
                <Text style={[styles.emotionText, { color: theme.accentWarm }]}>
                  {oracleReading.emotionalTheme}
                </Text>
              </View>
            </View>

            {/* Deep Message */}
            <View style={[styles.section, ds.card]}>
              <Text style={[styles.sectionTitle, ds.text]}>Message de l'inconscient</Text>
              <Text style={[styles.deepMessage, ds.textSecondary]}>
                {oracleReading.deepMessage}
              </Text>
            </View>

            {/* Guidance */}
            <View style={[styles.section, ds.card]}>
              <Text style={[styles.sectionTitle, ds.text]}>Guidance</Text>
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
            >
              <Ionicons name="refresh" size={18} color={theme.textMuted} />
              <Text style={[styles.resetButtonText, ds.textMuted]}>Nouvelle consultation</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Symbol Guide */}
        <Text style={[styles.guideTitle, ds.text, { marginTop: 30 }]}>Guide des Symboles</Text>
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
      </ScrollView>
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

  introContainer: { alignItems: 'center', marginBottom: 30 },
  introIcon: { fontSize: 60, marginBottom: 16 },
  introTitle: { fontSize: 22, fontWeight: '600', marginBottom: 10 },
  introText: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },

  statsCard: { flexDirection: 'row', padding: 20, borderRadius: 16, marginBottom: 20 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 32, fontWeight: '700' },
  statLabel: { fontSize: 12, marginTop: 4 },

  warningCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 12, 
    gap: 12,
    marginTop: 10,
  },
  warningText: { flex: 1, fontSize: 13, lineHeight: 20 },

  analyzeButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 16, 
    paddingHorizontal: 30, 
    borderRadius: 30, 
    gap: 10,
    marginTop: 10,
  },
  analyzeButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  section: { padding: 20, borderRadius: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },

  patternsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  patternCard: { 
    width: '47%', 
    padding: 14, 
    borderRadius: 12, 
    alignItems: 'center',
  },
  patternIcon: { fontSize: 28, marginBottom: 6 },
  patternSymbol: { fontSize: 14, fontWeight: '600', textTransform: 'capitalize' },
  patternCount: { fontSize: 12, fontWeight: '500', marginBottom: 4 },
  patternMeaning: { fontSize: 11, textAlign: 'center' },

  emotionBadge: { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  emotionText: { fontSize: 14, fontWeight: '600', textTransform: 'capitalize' },

  deepMessage: { fontSize: 15, lineHeight: 24, fontStyle: 'italic' },

  guidanceItem: { flexDirection: 'row', marginBottom: 10 },
  guidanceBullet: { marginRight: 10 },
  guidanceText: { flex: 1, fontSize: 14, lineHeight: 20 },

  resetButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 14, 
    borderRadius: 25, 
    borderWidth: 1,
    gap: 8,
    marginTop: 10,
  },
  resetButtonText: { fontSize: 14 },

  guideTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  symbolCard: { 
    width: 120, 
    padding: 14, 
    borderRadius: 12, 
    marginRight: 10, 
    alignItems: 'center',
  },
  symbolIcon: { fontSize: 28, marginBottom: 8 },
  symbolName: { fontSize: 13, fontWeight: '600', marginBottom: 4, textTransform: 'capitalize' },
  symbolMeaning: { fontSize: 10, textAlign: 'center' },
});
