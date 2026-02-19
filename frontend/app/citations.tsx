import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Share,
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

interface Quote {
  text: string;
  author: string;
}

const QUOTES: Quote[] = [
  { text: "Ce que tu cherches te cherche aussi.", author: "Rumi" },
  { text: "Sois le changement que tu veux voir dans le monde.", author: "Gandhi" },
  { text: "Le bonheur n'est pas une destination, c'est une façon de voyager.", author: "Margaret Lee Runbeck" },
  { text: "Chaque jour est une nouvelle chance de tout recommencer.", author: "Proverbe" },
  { text: "La paix vient de l'intérieur. Ne la cherche pas à l'extérieur.", author: "Bouddha" },
  { text: "L'âme qui se donne entièrement à Dieu ne manque de rien.", author: "Sainte Thérèse d'Avila" },
  { text: "La plus grande gloire n'est pas de ne jamais tomber, mais de se relever à chaque chute.", author: "Confucius" },
  { text: "Le silence est la source de toute grande force.", author: "Lao Tseu" },
];

const GlowingOrb = ({ size = 100 }: { size?: number }) => {
  const glow = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    rotate.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(glow.value, [0, 1], [1, 1.1]) },
      { rotateZ: `${rotate.value}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.3, 0.6]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [1, 1.4]) }],
  }));

  return (
    <View style={[styles.orbContainer, { width: size * 2, height: size * 2 }]}>
      <Animated.View
        style={[styles.orbGlow, glowStyle, { width: size * 1.8, height: size * 1.8, borderRadius: size * 0.9 }]}
      />
      <Animated.View style={orbStyle}>
        <Text style={{ fontSize: size * 0.7 }}>✦</Text>
      </Animated.View>
    </View>
  );
};

export default function CitationsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [savedQuotes, setSavedQuotes] = useState<Quote[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fadeKey, setFadeKey] = useState(0);

  const ds = {
    container: { backgroundColor: theme.background },
    card: { backgroundColor: theme.card },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    textMuted: { color: theme.textMuted },
  };

  useEffect(() => {
    getNewQuote();
  }, []);

  const getNewQuote = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/sacred-quote?lang=fr`);
      if (response.ok) {
        const data = await response.json();
        setCurrentQuote(data);
        setFadeKey(prev => prev + 1);
        setLoading(false);
        return;
      }
    } catch (e) {
      // Fallback
    }

    const randomIndex = Math.floor(Math.random() * QUOTES.length);
    setCurrentQuote(QUOTES[randomIndex]);
    setFadeKey(prev => prev + 1);
    setLoading(false);
  };

  const saveQuote = () => {
    if (currentQuote && !savedQuotes.find(q => q.text === currentQuote.text)) {
      setSavedQuotes(prev => [currentQuote, ...prev]);
    }
  };

  const shareQuote = async () => {
    if (!currentQuote) return;
    try {
      await Share.share({
        message: `"${currentQuote.text}"\n\n— ${currentQuote.author}\n\nPartagé depuis Latence`,
      });
    } catch (e) {
      console.log('Share error:', e);
    }
  };

  const removeFromSaved = (quote: Quote) => {
    setSavedQuotes(prev => prev.filter(q => q.text !== quote.text));
  };

  const isSaved = currentQuote && savedQuotes.find(q => q.text === currentQuote.text);

  return (
    <SafeAreaView style={[styles.container, ds.container]}>
      <TwinklingStars starCount={40} minSize={1} maxSize={2.5} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-down" size={28} color={theme.iconColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, ds.text]}>Sagesse</Text>
        <TouchableOpacity onPress={() => setShowSaved(!showSaved)} style={styles.savedButton}>
          <Ionicons name={showSaved ? "book" : "book-outline"} size={24} color={theme.iconColor} />
          {savedQuotes.length > 0 && (
            <View style={[styles.badge, { backgroundColor: theme.accentWarm }]}>
              <Text style={styles.badgeText}>{savedQuotes.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!showSaved ? (
          <>
            <Animated.View entering={FadeIn.duration(800)} style={styles.orbSection}>
              <GlowingOrb size={60} />
            </Animated.View>

            {currentQuote && (
              <Animated.View
                key={fadeKey}
                entering={FadeIn.duration(600)}
                style={styles.quoteContainer}
              >
                <Text style={[styles.quoteText, ds.text]}>"{currentQuote.text}"</Text>
                <Text style={[styles.quoteAuthor, ds.textSecondary]}>— {currentQuote.author}</Text>
              </Animated.View>
            )}

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, ds.card]}
                onPress={saveQuote}
              >
                <Ionicons
                  name={isSaved ? "heart" : "heart-outline"}
                  size={22}
                  color={isSaved ? theme.accentWarm : theme.textMuted}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, ds.card]}
                onPress={shareQuote}
              >
                <Ionicons name="share-outline" size={22} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.newQuoteBtn, { backgroundColor: theme.accentWarm }]}
              onPress={getNewQuote}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="refresh" size={18} color="#fff" />
                  <Text style={styles.newQuoteBtnText}>Nouvelle citation</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={[styles.infoText, ds.textMuted]}>
              Laisse ces paroles de sagesse guider ta réflexion et éclairer ton chemin intérieur.
            </Text>
          </>
        ) : (
          <Animated.View entering={FadeIn.duration(400)}>
            <Text style={[styles.savedTitle, ds.text]}>Citations sauvegardées</Text>
            {savedQuotes.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="heart-outline" size={48} color={theme.textMuted} />
                <Text style={[styles.emptyText, ds.textMuted]}>
                  Aucune citation sauvegardée
                </Text>
              </View>
            ) : (
              savedQuotes.map((quote, i) => (
                <Animated.View
                  key={quote.text}
                  entering={FadeInUp.duration(300).delay(i * 50)}
                  style={[styles.savedCard, ds.card]}
                >
                  <Text style={[styles.savedQuoteText, ds.text]}>"{quote.text}"</Text>
                  <View style={styles.savedFooter}>
                    <Text style={[styles.savedAuthor, ds.textSecondary]}>— {quote.author}</Text>
                    <TouchableOpacity onPress={() => removeFromSaved(quote)}>
                      <Ionicons name="close-circle-outline" size={20} color={theme.textMuted} />
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              ))
            )}
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
  savedButton: { padding: 4, position: 'relative' },
  badge: { position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  scrollContent: { padding: 24, paddingBottom: 40, minHeight: '100%' },

  orbSection: { alignItems: 'center', marginVertical: 30 },
  orbContainer: { alignItems: 'center', justifyContent: 'center' },
  orbGlow: { position: 'absolute', backgroundColor: 'rgba(212, 165, 116, 0.25)' },

  quoteContainer: { alignItems: 'center', marginBottom: 40 },
  quoteText: { fontSize: 22, fontWeight: '300', textAlign: 'center', lineHeight: 36, marginBottom: 20, fontStyle: 'italic' },
  quoteAuthor: { fontSize: 14, fontWeight: '500' },

  actionsRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 24 },
  actionBtn: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },

  newQuoteBtn: { flexDirection: 'row', paddingVertical: 16, borderRadius: 28, alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 24 },
  newQuoteBtnText: { color: '#fff', fontSize: 15, fontWeight: '500' },

  infoText: { fontSize: 12, textAlign: 'center', lineHeight: 18, paddingHorizontal: 20 },

  savedTitle: { fontSize: 20, fontWeight: '300', marginBottom: 20 },
  savedCard: { borderRadius: 14, padding: 18, marginBottom: 12 },
  savedQuoteText: { fontSize: 15, lineHeight: 24, fontStyle: 'italic', marginBottom: 12 },
  savedFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  savedAuthor: { fontSize: 13 },

  emptyState: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { fontSize: 14 },
});
