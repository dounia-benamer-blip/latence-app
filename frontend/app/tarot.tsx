import React, { useState } from 'react';
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
  FlipInYRight,
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import { CandleFlame } from '../src/components/CandleFlame';
import { TwinklingStars } from '../src/components/TwinklingStars';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// Major Arcana Tarot Cards
const TAROT_CARDS = [
  { id: 0, name: 'Le Mat', meaning: 'Nouveaux départs, innocence, spontanéité', symbol: '🃏' },
  { id: 1, name: 'Le Magicien', meaning: 'Manifestation, pouvoir, action', symbol: '✨' },
  { id: 2, name: 'La Papesse', meaning: 'Intuition, mystère, sagesse intérieure', symbol: '🌙' },
  { id: 3, name: 'L\'Impératrice', meaning: 'Féminité, abondance, nature', symbol: '👑' },
  { id: 4, name: 'L\'Empereur', meaning: 'Autorité, structure, paternité', symbol: '🏛️' },
  { id: 5, name: 'Le Pape', meaning: 'Tradition, conformité, spiritualité', symbol: '🔑' },
  { id: 6, name: 'L\'Amoureux', meaning: 'Amour, harmonie, choix', symbol: '💕' },
  { id: 7, name: 'Le Chariot', meaning: 'Volonté, triomphe, détermination', symbol: '⚡' },
  { id: 8, name: 'La Justice', meaning: 'Équilibre, vérité, loi', symbol: '⚖️' },
  { id: 9, name: 'L\'Hermite', meaning: 'Introspection, solitude, guidance', symbol: '🏔️' },
  { id: 10, name: 'La Roue de Fortune', meaning: 'Destin, cycles, changement', symbol: '🎡' },
  { id: 11, name: 'La Force', meaning: 'Courage, patience, contrôle', symbol: '🦁' },
  { id: 12, name: 'Le Pendu', meaning: 'Lâcher-prise, sacrifice, nouvelle perspective', symbol: '🙃' },
  { id: 13, name: 'La Mort', meaning: 'Transformation, fin, renaissance', symbol: '🦋' },
  { id: 14, name: 'Tempérance', meaning: 'Équilibre, modération, patience', symbol: '🌊' },
  { id: 15, name: 'Le Diable', meaning: 'Attachement, illusion, matérialisme', symbol: '⛓️' },
  { id: 16, name: 'La Tour', meaning: 'Bouleversement, révélation, libération', symbol: '🗼' },
  { id: 17, name: 'L\'Étoile', meaning: 'Espoir, inspiration, sérénité', symbol: '⭐' },
  { id: 18, name: 'La Lune', meaning: 'Illusion, peur, inconscient', symbol: '🌑' },
  { id: 19, name: 'Le Soleil', meaning: 'Joie, succès, vitalité', symbol: '☀️' },
  { id: 20, name: 'Le Jugement', meaning: 'Renaissance, appel, absolution', symbol: '📯' },
  { id: 21, name: 'Le Monde', meaning: 'Accomplissement, intégration, voyage', symbol: '🌍' },
];

interface DrawnCard {
  card: typeof TAROT_CARDS[0];
  position: 'past' | 'present' | 'future';
  reversed: boolean;
}

export default function TarotScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [loadingInterpretation, setLoadingInterpretation] = useState(false);
  const [showCards, setShowCards] = useState(false);

  const ds = {
    container: { backgroundColor: theme.background },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    textMuted: { color: theme.textMuted },
    card: { backgroundColor: theme.card },
  };

  const drawCards = () => {
    setIsDrawing(true);
    setInterpretation(null);
    setShowCards(false);
    
    // Shuffle and draw 3 random cards
    const shuffled = [...TAROT_CARDS].sort(() => Math.random() - 0.5);
    const positions: ('past' | 'present' | 'future')[] = ['past', 'present', 'future'];
    
    const drawn: DrawnCard[] = shuffled.slice(0, 3).map((card, i) => ({
      card,
      position: positions[i],
      reversed: Math.random() > 0.7, // 30% chance of reversed
    }));

    setTimeout(() => {
      setDrawnCards(drawn);
      setIsDrawing(false);
      setShowCards(true);
    }, 1500);
  };

  const getInterpretation = async () => {
    if (drawnCards.length !== 3) return;
    
    setLoadingInterpretation(true);
    
    try {
      const response = await fetch(`${API_URL}/api/tarot/interpret`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cards: drawnCards.map(d => ({
            name: d.card.name,
            position: d.position,
            reversed: d.reversed,
            meaning: d.card.meaning,
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setInterpretation(data.interpretation);
      } else {
        // Generate local interpretation if API fails
        setInterpretation(generateLocalInterpretation());
      }
    } catch (error) {
      setInterpretation(generateLocalInterpretation());
    }
    
    setLoadingInterpretation(false);
  };

  const generateLocalInterpretation = () => {
    const past = drawnCards.find(d => d.position === 'past');
    const present = drawnCards.find(d => d.position === 'present');
    const future = drawnCards.find(d => d.position === 'future');

    return `✨ **Ton Tirage Révèle...**

🕰️ **Le Passé - ${past?.card.name}${past?.reversed ? ' (Renversée)' : ''}**
${past?.reversed ? 'Cette énergie a été bloquée ou mal exprimée dans ton passé.' : past?.card.meaning}. Cette carte illumine les fondations de ta situation actuelle.

🌟 **Le Présent - ${present?.card.name}${present?.reversed ? ' (Renversée)' : ''}**
${present?.reversed ? 'Tu fais face à des défis liés à cette énergie.' : present?.card.meaning}. C'est l'énergie qui t'entoure maintenant et qui demande ton attention.

🔮 **Le Futur - ${future?.card.name}${future?.reversed ? ' (Renversée)' : ''}**
${future?.reversed ? 'Des obstacles peuvent apparaître, mais ils sont surmontables.' : future?.card.meaning}. Cette carte montre le chemin qui s'ouvre devant toi.

💫 **Message Global**
Les cartes te parlent de transformation. Écoute ton intuition et laisse-toi guider par la sagesse de l'univers.`;
  };

  const resetReading = () => {
    setDrawnCards([]);
    setInterpretation(null);
    setShowCards(false);
  };

  const getPositionLabel = (position: string) => {
    switch (position) {
      case 'past': return 'Passé';
      case 'present': return 'Présent';
      case 'future': return 'Futur';
      default: return position;
    }
  };

  const renderCard = (drawnCard: DrawnCard, index: number) => (
    <Animated.View
      key={drawnCard.card.id}
      entering={FlipInYRight.duration(600).delay(index * 300)}
      style={[styles.tarotCard, ds.card, { borderColor: theme.accentWarm }]}
    >
      <Text style={[styles.positionLabel, { color: theme.accentWarm }]}>
        {getPositionLabel(drawnCard.position)}
      </Text>
      <Text style={styles.cardSymbol}>{drawnCard.card.symbol}</Text>
      <Text style={[styles.cardName, ds.text, drawnCard.reversed && styles.reversedText]}>
        {drawnCard.card.name}
        {drawnCard.reversed && ' ⟲'}
      </Text>
      <Text style={[styles.cardMeaning, ds.textMuted]}>
        {drawnCard.card.meaning}
      </Text>
      {drawnCard.reversed && (
        <Text style={[styles.reversedLabel, { color: theme.accentWarm }]}>
          Renversée
        </Text>
      )}
    </Animated.View>
  );

  return (
    <SafeAreaView style={[styles.container, ds.container]}>
      <TwinklingStars starCount={35} minSize={1} maxSize={2.5} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-down" size={28} color={theme.iconColor} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <CandleFlame size="small" intensity="gentle" />
          <Text style={[styles.headerTitle, ds.text]}>Tarot</Text>
          <CandleFlame size="small" intensity="gentle" />
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Introduction */}
        {drawnCards.length === 0 && !isDrawing && (
          <Animated.View entering={FadeIn.duration(500)} style={styles.introContainer}>
            <Text style={styles.introSymbol}>🔮</Text>
            <Text style={[styles.introTitle, ds.text]}>Tirage en 3 Cartes</Text>
            <Text style={[styles.introText, ds.textSecondary]}>
              Passé • Présent • Futur
            </Text>
            <Text style={[styles.introDescription, ds.textMuted]}>
              Concentre-toi sur ta question ou laisse l'univers te guider. 
              Les cartes révèleront ce que ton âme a besoin d'entendre.
            </Text>
          </Animated.View>
        )}

        {/* Drawing Animation */}
        {isDrawing && (
          <Animated.View entering={FadeIn} style={styles.drawingContainer}>
            <View style={styles.shufflingCards}>
              {[0, 1, 2].map((i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.cardBack,
                    { 
                      backgroundColor: theme.accentWarm,
                      transform: [{ rotate: `${(i - 1) * 5}deg` }],
                    }
                  ]}
                >
                  <Text style={styles.cardBackSymbol}>✧</Text>
                </Animated.View>
              ))}
            </View>
            <Text style={[styles.shufflingText, ds.textSecondary]}>
              Les cartes se mélangent...
            </Text>
          </Animated.View>
        )}

        {/* Drawn Cards */}
        {showCards && drawnCards.length > 0 && (
          <Animated.View entering={FadeIn} style={styles.cardsContainer}>
            <View style={styles.cardsRow}>
              {drawnCards.map((card, index) => renderCard(card, index))}
            </View>
          </Animated.View>
        )}

        {/* Get Interpretation Button */}
        {showCards && !interpretation && (
          <Animated.View entering={FadeInUp.delay(1000)}>
            <TouchableOpacity
              style={[styles.interpretButton, { backgroundColor: theme.accentWarm }]}
              onPress={getInterpretation}
              disabled={loadingInterpretation}
            >
              {loadingInterpretation ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={20} color="#fff" />
                  <Text style={styles.interpretButtonText}>Révéler l'interprétation</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Interpretation */}
        {interpretation && (
          <Animated.View 
            entering={FadeInUp.duration(500)} 
            style={[styles.interpretationCard, ds.card]}
          >
            <Text style={[styles.interpretationText, ds.textSecondary]}>
              {interpretation}
            </Text>
          </Animated.View>
        )}

        {/* Action Buttons */}
        {drawnCards.length === 0 && !isDrawing ? (
          <TouchableOpacity
            style={[styles.drawButton, { backgroundColor: theme.accentWarm }]}
            onPress={drawCards}
          >
            <Ionicons name="shuffle" size={24} color="#fff" />
            <Text style={styles.drawButtonText}>Tirer les cartes</Text>
          </TouchableOpacity>
        ) : showCards && (
          <TouchableOpacity
            style={[styles.resetButton, { borderColor: theme.border }]}
            onPress={resetReading}
          >
            <Ionicons name="refresh" size={20} color={theme.textMuted} />
            <Text style={[styles.resetButtonText, ds.textMuted]}>Nouveau tirage</Text>
          </TouchableOpacity>
        )}
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

  introContainer: { alignItems: 'center', marginVertical: 40 },
  introSymbol: { fontSize: 60, marginBottom: 20 },
  introTitle: { fontSize: 24, fontWeight: '600', marginBottom: 8 },
  introText: { fontSize: 16, marginBottom: 20 },
  introDescription: { fontSize: 14, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },

  drawingContainer: { alignItems: 'center', marginVertical: 60 },
  shufflingCards: { flexDirection: 'row', marginBottom: 20 },
  cardBack: { 
    width: 60, 
    height: 90, 
    borderRadius: 8, 
    marginHorizontal: -10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBackSymbol: { color: '#fff', fontSize: 24 },
  shufflingText: { fontSize: 16, fontStyle: 'italic' },

  cardsContainer: { marginVertical: 20 },
  cardsRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, flexWrap: 'wrap' },
  
  tarotCard: { 
    width: (width - 60) / 3, 
    minHeight: 180,
    borderRadius: 12, 
    padding: 12, 
    alignItems: 'center',
    borderWidth: 2,
  },
  positionLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 1, marginBottom: 8 },
  cardSymbol: { fontSize: 32, marginBottom: 8 },
  cardName: { fontSize: 12, fontWeight: '600', textAlign: 'center', marginBottom: 6 },
  cardMeaning: { fontSize: 9, textAlign: 'center', lineHeight: 14 },
  reversedText: { fontStyle: 'italic' },
  reversedLabel: { fontSize: 9, marginTop: 6, fontWeight: '500' },

  interpretButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 16, 
    borderRadius: 30, 
    marginTop: 20,
    gap: 10,
  },
  interpretButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  interpretationCard: { padding: 20, borderRadius: 16, marginTop: 20 },
  interpretationText: { fontSize: 14, lineHeight: 24 },

  drawButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 18, 
    borderRadius: 30, 
    marginTop: 30,
    gap: 12,
  },
  drawButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },

  resetButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 14, 
    borderRadius: 25, 
    marginTop: 20,
    borderWidth: 1,
    gap: 8,
  },
  resetButtonText: { fontSize: 14 },
});
