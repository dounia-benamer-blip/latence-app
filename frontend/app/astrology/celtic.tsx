import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';

const CELTIC_TREES = [
  {
    tree: "Bouleau",
    dates: "24 déc - 20 jan",
    ogham: "ᚁ",
    symbol: "🌳",
    element: "Air",
    planet: "Soleil",
    meaning: "Renouveau, purification, nouveaux départs",
    personality: "Ambitieux, motivé, leader naturel. Vous êtes un pionnier qui n'a pas peur de tracer de nouveaux chemins.",
    strengths: ["Leadership", "Détermination", "Innovation"],
    challenges: ["Impatience", "Perfectionnisme"],
    color: "#F5F5DC"
  },
  {
    tree: "Sorbier",
    dates: "21 jan - 17 fév",
    ogham: "ᚂ",
    symbol: "🍃",
    element: "Feu",
    planet: "Uranus",
    meaning: "Vision, protection, transformation",
    personality: "Visionnaire, original, penseur profond. Vous voyez le monde différemment et inspirez les autres.",
    strengths: ["Intuition", "Créativité", "Protection"],
    challenges: ["Isolement", "Sensibilité excessive"],
    color: "#FF6B6B"
  },
  {
    tree: "Frêne",
    dates: "18 fév - 17 mars",
    ogham: "ᚅ",
    symbol: "🌿",
    element: "Eau",
    planet: "Neptune",
    meaning: "Connexion, intuition, imagination",
    personality: "Artistique, intuitif, rêveur. Vous êtes connecté aux mondes invisibles et à la magie de la nature.",
    strengths: ["Empathie", "Imagination", "Sagesse"],
    challenges: ["Rêverie excessive", "Fuite de la réalité"],
    color: "#4ECDC4"
  },
  {
    tree: "Aulne",
    dates: "18 mars - 14 avril",
    ogham: "ᚃ",
    symbol: "🌲",
    element: "Feu",
    planet: "Mars",
    meaning: "Courage, passion, force",
    personality: "Courageux, confiant, charismatique. Vous affrontez les défis de face avec bravoure.",
    strengths: ["Courage", "Passion", "Charisme"],
    challenges: ["Impulsivité", "Colère"],
    color: "#E74C3C"
  },
  {
    tree: "Saule",
    dates: "15 avril - 12 mai",
    ogham: "ᚄ",
    symbol: "🌾",
    element: "Eau",
    planet: "Lune",
    meaning: "Cycles lunaires, émotions, intuition",
    personality: "Sensible, patient, résilient. Vous comprenez les cycles de la vie et évoluez avec eux.",
    strengths: ["Résilience", "Patience", "Intuition lunaire"],
    challenges: ["Mélancolie", "Dépendance émotionnelle"],
    color: "#A8E6CF"
  },
  {
    tree: "Aubépine",
    dates: "13 mai - 9 juin",
    ogham: "ᚆ",
    symbol: "🌸",
    element: "Air",
    planet: "Mercure",
    meaning: "Contraste, dualité, adaptabilité",
    personality: "Curieux, créatif, adaptable. Vous embrassez la dualité de la vie avec grâce.",
    strengths: ["Adaptabilité", "Communication", "Curiosité"],
    challenges: ["Inconstance", "Superficialité"],
    color: "#FFB6C1"
  },
  {
    tree: "Chêne",
    dates: "10 juin - 7 juil",
    ogham: "ᚇ",
    symbol: "🌳",
    element: "Terre",
    planet: "Jupiter",
    meaning: "Force, stabilité, sagesse",
    personality: "Protecteur, généreux, optimiste. Vous êtes le pilier sur lequel les autres s'appuient.",
    strengths: ["Force", "Générosité", "Sagesse"],
    challenges: ["Rigidité", "Orgueil"],
    color: "#8B4513"
  },
  {
    tree: "Houx",
    dates: "8 juil - 4 août",
    ogham: "ᚈ",
    symbol: "🍀",
    element: "Feu",
    planet: "Soleil",
    meaning: "Royauté, défis, persévérance",
    personality: "Noble, ambitieux, compétitif. Vous aspirez à l'excellence et relevez tous les défis.",
    strengths: ["Persévérance", "Noblesse", "Ambition"],
    challenges: ["Ego", "Compétitivité excessive"],
    color: "#228B22"
  },
  {
    tree: "Noisetier",
    dates: "5 août - 1 sept",
    ogham: "ᚉ",
    symbol: "🥜",
    element: "Air",
    planet: "Mercure",
    meaning: "Sagesse, connaissance, inspiration",
    personality: "Intelligent, analytique, efficace. Vous êtes le gardien de la connaissance sacrée.",
    strengths: ["Intelligence", "Analyse", "Inspiration"],
    challenges: ["Suranalyse", "Froideur émotionnelle"],
    color: "#DEB887"
  },
  {
    tree: "Vigne",
    dates: "2 sept - 29 sept",
    ogham: "ᚊ",
    symbol: "🍇",
    element: "Eau",
    planet: "Vénus",
    meaning: "Raffinement, équilibre, harmonie",
    personality: "Raffiné, charmant, indécis. Vous recherchez la beauté et l'harmonie en toute chose.",
    strengths: ["Charme", "Sens esthétique", "Équilibre"],
    challenges: ["Indécision", "Dépendance"],
    color: "#9B59B6"
  },
  {
    tree: "Lierre",
    dates: "30 sept - 27 oct",
    ogham: "ᚌ",
    symbol: "🌿",
    element: "Eau",
    planet: "Pluton",
    meaning: "Transformation, survie, détermination",
    personality: "Loyal, compassionné, spirituel. Vous traversez les épreuves avec une force intérieure remarquable.",
    strengths: ["Résilience", "Loyauté", "Spiritualité"],
    challenges: ["Possessivité", "Jalousie"],
    color: "#2E8B57"
  },
  {
    tree: "Roseau",
    dates: "28 oct - 24 nov",
    ogham: "ᚍ",
    symbol: "🌾",
    element: "Eau",
    planet: "Pluton",
    meaning: "Secret, vérité, complexité",
    personality: "Mystérieux, courageux, fier. Vous percez les mystères et gardez les secrets sacrés.",
    strengths: ["Perspicacité", "Courage", "Mystère"],
    challenges: ["Paranoia", "Vengeance"],
    color: "#CD853F"
  },
  {
    tree: "Sureau",
    dates: "25 nov - 23 déc",
    ogham: "ᚏ",
    symbol: "🌺",
    element: "Feu",
    planet: "Saturne",
    meaning: "Fin et commencement, liberté",
    personality: "Libre-esprit, extraverti, philosophe. Vous marquez la fin d'un cycle et le début d'un autre.",
    strengths: ["Liberté", "Sagesse", "Transformation"],
    challenges: ["Excentricté", "Impatience"],
    color: "#FF69B4"
  }
];

const MOON_PHASES = [
  { name: "Nouvelle Lune", emoji: "🌑", meaning: "Temps des nouveaux départs et des intentions" },
  { name: "Premier Croissant", emoji: "🌒", meaning: "Croissance, espoir et détermination" },
  { name: "Premier Quartier", emoji: "🌓", meaning: "Action, défis et persévérance" },
  { name: "Lune Gibbeuse", emoji: "🌔", meaning: "Raffinage, patience et perfectionnement" },
  { name: "Pleine Lune", emoji: "🌕", meaning: "Accomplissement, illumination et révélation" },
  { name: "Lune Gibbeuse Décroissante", emoji: "🌖", meaning: "Gratitude, partage et transmission" },
  { name: "Dernier Quartier", emoji: "🌗", meaning: "Lâcher-prise, pardon et libération" },
  { name: "Dernier Croissant", emoji: "🌘", meaning: "Repos, réflexion et préparation" },
];

export default function CelticAstrologyScreen() {
  const router = useRouter();
  const [selectedTree, setSelectedTree] = useState<typeof CELTIC_TREES[0] | null>(null);
  const [birthDate, setBirthDate] = useState('');
  const [myTree, setMyTree] = useState<typeof CELTIC_TREES[0] | null>(null);
  const [showDateInput, setShowDateInput] = useState(false);

  const getCurrentMoonPhase = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    
    const c = Math.floor(year / 100);
    const y = year - 100 * c;
    const mm = month < 3 ? month + 12 : month;
    const yy = month < 3 ? y - 1 : y;
    
    const jd = (Math.floor(365.25 * yy) + Math.floor(30.6 * mm) + day - 694039.09) / 29.53;
    const phase = jd - Math.floor(jd);
    
    const index = Math.floor(phase * 8);
    return MOON_PHASES[index] || MOON_PHASES[0];
  };

  const findTreeByDate = (dateStr: string) => {
    try {
      const [day, month] = dateStr.split('/').map(Number);
      if (!day || !month || month < 1 || month > 12 || day < 1 || day > 31) return null;

      const dateRanges = [
        { start: [12, 24], end: [1, 20], index: 0 },
        { start: [1, 21], end: [2, 17], index: 1 },
        { start: [2, 18], end: [3, 17], index: 2 },
        { start: [3, 18], end: [4, 14], index: 3 },
        { start: [4, 15], end: [5, 12], index: 4 },
        { start: [5, 13], end: [6, 9], index: 5 },
        { start: [6, 10], end: [7, 7], index: 6 },
        { start: [7, 8], end: [8, 4], index: 7 },
        { start: [8, 5], end: [9, 1], index: 8 },
        { start: [9, 2], end: [9, 29], index: 9 },
        { start: [9, 30], end: [10, 27], index: 10 },
        { start: [10, 28], end: [11, 24], index: 11 },
        { start: [11, 25], end: [12, 23], index: 12 },
      ];

      for (const range of dateRanges) {
        const [sm, sd] = range.start;
        const [em, ed] = range.end;
        
        if (sm <= em) {
          if ((month === sm && day >= sd) || (month === em && day <= ed) || (month > sm && month < em)) {
            return CELTIC_TREES[range.index];
          }
        } else {
          if ((month === sm && day >= sd) || (month === em && day <= ed)) {
            return CELTIC_TREES[range.index];
          }
        }
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleFindMyTree = () => {
    const tree = findTreeByDate(birthDate);
    if (tree) {
      setMyTree(tree);
      setShowDateInput(false);
    }
  };

  const moonPhase = getCurrentMoonPhase();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Astrologie Celtique</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro Card */}
        <Animated.View entering={FadeInUp.duration(500)} style={styles.introCard}>
          <Text style={styles.introEmoji}>🌿</Text>
          <Text style={styles.introTitle}>L'Ogham Celtique</Text>
          <Text style={styles.introText}>
            L'astrologie celtique est basée sur les 13 arbres sacrés du calendrier lunaire druidique.
            Chaque arbre correspond à une période de l'année et possède des qualités uniques.
          </Text>
        </Animated.View>

        {/* Current Moon Phase */}
        <Animated.View entering={FadeInUp.duration(500).delay(100)} style={styles.moonCard}>
          <Text style={styles.moonEmoji}>{moonPhase.emoji}</Text>
          <Text style={styles.moonName}>{moonPhase.name}</Text>
          <Text style={styles.moonMeaning}>{moonPhase.meaning}</Text>
        </Animated.View>

        {/* Find My Tree Section */}
        <Animated.View entering={FadeInUp.duration(500).delay(200)} style={styles.findTreeCard}>
          <Text style={styles.sectionTitle}>Découvre ton arbre</Text>
          
          {myTree ? (
            <View style={styles.myTreeResult}>
              <Text style={styles.myTreeEmoji}>{myTree.symbol}</Text>
              <Text style={styles.myTreeName}>{myTree.tree}</Text>
              <Text style={styles.myTreeDates}>{myTree.dates}</Text>
              <TouchableOpacity
                style={styles.viewDetailButton}
                onPress={() => setSelectedTree(myTree)}
              >
                <Text style={styles.viewDetailText}>Voir les détails</Text>
                <Ionicons name="arrow-forward" size={16} color="#27AE60" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMyTree(null)}>
                <Text style={styles.resetText}>Changer de date</Text>
              </TouchableOpacity>
            </View>
          ) : showDateInput ? (
            <View style={styles.dateInputContainer}>
              <TextInput
                style={styles.dateInput}
                placeholder="JJ/MM (ex: 15/04)"
                placeholderTextColor="#6a6a8a"
                value={birthDate}
                onChangeText={setBirthDate}
                keyboardType="numbers-and-punctuation"
              />
              <TouchableOpacity style={styles.findButton} onPress={handleFindMyTree}>
                <Text style={styles.findButtonText}>Trouver</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.enterDateButton}
              onPress={() => setShowDateInput(true)}
            >
              <Ionicons name="calendar" size={20} color="#27AE60" />
              <Text style={styles.enterDateText}>Entrer ma date de naissance</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Tree Detail Modal */}
        {selectedTree && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.treeDetailCard}>
            <TouchableOpacity
              style={styles.closeDetail}
              onPress={() => setSelectedTree(null)}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            
            <Text style={styles.detailEmoji}>{selectedTree.symbol}</Text>
            <Text style={styles.detailOgham}>{selectedTree.ogham}</Text>
            <Text style={styles.detailName}>{selectedTree.tree}</Text>
            <Text style={styles.detailDates}>{selectedTree.dates}</Text>
            
            <View style={styles.detailBadges}>
              <View style={[styles.detailBadge, { backgroundColor: '#3498DB20' }]}>
                <Text style={[styles.badgeText, { color: '#3498DB' }]}>
                  {selectedTree.element}
                </Text>
              </View>
              <View style={[styles.detailBadge, { backgroundColor: '#9B59B620' }]}>
                <Text style={[styles.badgeText, { color: '#9B59B6' }]}>
                  {selectedTree.planet}
                </Text>
              </View>
            </View>
            
            <Text style={styles.detailMeaning}>"{selectedTree.meaning}"</Text>
            <Text style={styles.detailPersonality}>{selectedTree.personality}</Text>
            
            <View style={styles.traitsSection}>
              <Text style={styles.traitsTitle}>Forces</Text>
              <View style={styles.traitsList}>
                {selectedTree.strengths.map((s, i) => (
                  <View key={i} style={styles.strengthChip}>
                    <Ionicons name="checkmark-circle" size={14} color="#27AE60" />
                    <Text style={styles.traitText}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
            
            <View style={styles.traitsSection}>
              <Text style={styles.traitsTitle}>Défis</Text>
              <View style={styles.traitsList}>
                {selectedTree.challenges.map((c, i) => (
                  <View key={i} style={styles.challengeChip}>
                    <Ionicons name="alert-circle" size={14} color="#E74C3C" />
                    <Text style={styles.traitText}>{c}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        {/* All Trees List */}
        {!selectedTree && (
          <View style={styles.treesSection}>
            <Text style={styles.sectionTitle}>Les 13 Arbres Sacrés</Text>
            <View style={styles.treesList}>
              {CELTIC_TREES.map((tree, index) => (
                <Animated.View
                  key={tree.tree}
                  entering={FadeInUp.duration(400).delay(300 + index * 50)}
                >
                  <TouchableOpacity
                    style={styles.treeCard}
                    onPress={() => setSelectedTree(tree)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.treeIcon, { backgroundColor: `${tree.color}30` }]}>
                      <Text style={styles.treeEmoji}>{tree.symbol}</Text>
                    </View>
                    <View style={styles.treeInfo}>
                      <Text style={styles.treeName}>{tree.tree}</Text>
                      <Text style={styles.treeDates}>{tree.dates}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#4a4a6a" />
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  introCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  introEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  introText: {
    fontSize: 14,
    color: '#a0a0c0',
    textAlign: 'center',
    lineHeight: 22,
  },
  moonCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFD70040',
  },
  moonEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  moonName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFD700',
    marginBottom: 4,
  },
  moonMeaning: {
    fontSize: 13,
    color: '#a0a0c0',
    textAlign: 'center',
  },
  findTreeCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  myTreeResult: {
    alignItems: 'center',
  },
  myTreeEmoji: {
    fontSize: 50,
    marginBottom: 8,
  },
  myTreeName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#27AE60',
  },
  myTreeDates: {
    fontSize: 14,
    color: '#6a6a8a',
    marginBottom: 16,
  },
  viewDetailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  viewDetailText: {
    color: '#27AE60',
    fontSize: 14,
    fontWeight: '600',
  },
  resetText: {
    color: '#6a6a8a',
    fontSize: 12,
  },
  dateInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInput: {
    flex: 1,
    backgroundColor: '#0a0a1a',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  findButton: {
    backgroundColor: '#27AE60',
    borderRadius: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  findButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  enterDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#27AE6020',
    paddingVertical: 14,
    borderRadius: 12,
  },
  enterDateText: {
    color: '#27AE60',
    fontSize: 14,
    fontWeight: '600',
  },
  treeDetailCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  closeDetail: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  detailEmoji: {
    fontSize: 60,
    textAlign: 'center',
  },
  detailOgham: {
    fontSize: 30,
    color: '#27AE60',
    textAlign: 'center',
    marginBottom: 8,
  },
  detailName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  detailDates: {
    fontSize: 14,
    color: '#6a6a8a',
    textAlign: 'center',
    marginBottom: 16,
  },
  detailBadges: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  detailBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailMeaning: {
    fontSize: 15,
    color: '#FFD700',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  detailPersonality: {
    fontSize: 14,
    color: '#d0d0e0',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  traitsSection: {
    marginBottom: 16,
  },
  traitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a0a0c0',
    marginBottom: 10,
  },
  traitsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  strengthChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#27AE6020',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  challengeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E74C3C20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  traitText: {
    fontSize: 12,
    color: '#fff',
  },
  treesSection: {
    marginTop: 4,
  },
  treesList: {
    gap: 10,
  },
  treeCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  treeIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  treeEmoji: {
    fontSize: 22,
  },
  treeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  treeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  treeDates: {
    fontSize: 12,
    color: '#6a6a8a',
    marginTop: 2,
  },
});
