import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';

const CELTIC_TREES = [
  { tree: "Bouleau", dates: "24 déc - 20 jan", ogham: "ᚁ", meaning: "Renouveau, nouveaux départs", personality: "Leader naturel, ambitieux" },
  { tree: "Sorbier", dates: "21 jan - 17 fév", ogham: "ᚂ", meaning: "Vision, protection", personality: "Visionnaire, penseur profond" },
  { tree: "Frêne", dates: "18 fév - 17 mars", ogham: "ᚅ", meaning: "Connexion, intuition", personality: "Artistique, intuitif" },
  { tree: "Aulne", dates: "18 mars - 14 avril", ogham: "ᚃ", meaning: "Courage, passion", personality: "Courageux, charismatique" },
  { tree: "Saule", dates: "15 avril - 12 mai", ogham: "ᚄ", meaning: "Cycles, émotions", personality: "Sensible, résilient" },
  { tree: "Aubépine", dates: "13 mai - 9 juin", ogham: "ᚆ", meaning: "Dualité, adaptabilité", personality: "Curieux, adaptable" },
  { tree: "Chêne", dates: "10 juin - 7 juil", ogham: "ᚇ", meaning: "Force, sagesse", personality: "Protecteur, généreux" },
  { tree: "Houx", dates: "8 juil - 4 août", ogham: "ᚈ", meaning: "Défis, persévérance", personality: "Noble, ambitieux" },
  { tree: "Noisetier", dates: "5 août - 1 sept", ogham: "ᚉ", meaning: "Sagesse, connaissance", personality: "Intelligent, analytique" },
  { tree: "Vigne", dates: "2 sept - 29 sept", ogham: "ᚊ", meaning: "Raffinement, harmonie", personality: "Raffiné, charmant" },
  { tree: "Lierre", dates: "30 sept - 27 oct", ogham: "ᚌ", meaning: "Transformation, survie", personality: "Loyal, spirituel" },
  { tree: "Roseau", dates: "28 oct - 24 nov", ogham: "ᚍ", meaning: "Secret, vérité", personality: "Mystérieux, courageux" },
  { tree: "Sureau", dates: "25 nov - 23 déc", ogham: "ᚏ", meaning: "Fin et commencement", personality: "Libre, philosophe" },
];

const WESTERN_HOUSES = [
  { number: 1, name: "Ascendant", theme: "Le Moi", description: "Personnalité et apparence" },
  { number: 2, name: "Possessions", theme: "Ressources", description: "Valeurs et finances" },
  { number: 3, name: "Communication", theme: "Expression", description: "Pensée et échanges" },
  { number: 4, name: "Foyer", theme: "Racines", description: "Famille et origines" },
  { number: 5, name: "Créativité", theme: "Joie", description: "Plaisirs et romance" },
  { number: 6, name: "Service", theme: "Santé", description: "Travail et routines" },
  { number: 7, name: "Partenariats", theme: "Relations", description: "Mariage et contrats" },
  { number: 8, name: "Transformation", theme: "Renaissance", description: "Mystères profonds" },
  { number: 9, name: "Philosophie", theme: "Expansion", description: "Voyages et quête de sens" },
  { number: 10, name: "Carrière", theme: "Destinée", description: "Ambitions et réputation" },
  { number: 11, name: "Espoirs", theme: "Aspirations", description: "Amis et idéaux" },
  { number: 12, name: "Inconscient", theme: "Caché", description: "Secrets et karma" },
];

const MOON_PHASES = [
  { phase: 0.03, name: "Nouvelle Lune", emoji: "🌑", meaning: "Nouveaux départs" },
  { phase: 0.25, name: "Premier Croissant", emoji: "🌒", meaning: "Croissance" },
  { phase: 0.28, name: "Premier Quartier", emoji: "🌓", meaning: "Action" },
  { phase: 0.47, name: "Gibbeuse Croissante", emoji: "🌔", meaning: "Perfectionnement" },
  { phase: 0.53, name: "Pleine Lune", emoji: "🌕", meaning: "Accomplissement" },
  { phase: 0.72, name: "Gibbeuse Décroissante", emoji: "🌖", meaning: "Gratitude" },
  { phase: 0.78, name: "Dernier Quartier", emoji: "🌗", meaning: "Lâcher-prise" },
  { phase: 0.97, name: "Dernier Croissant", emoji: "🌘", meaning: "Repos" },
];

export default function LunarAstrologyScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'moon' | 'celtic' | 'houses'>('moon');
  const [selectedTree, setSelectedTree] = useState<typeof CELTIC_TREES[0] | null>(null);
  const [selectedHouse, setSelectedHouse] = useState<number | null>(null);
  const [birthDate, setBirthDate] = useState('');
  const [myTree, setMyTree] = useState<typeof CELTIC_TREES[0] | null>(null);

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
    
    for (let i = MOON_PHASES.length - 1; i >= 0; i--) {
      if (phase >= MOON_PHASES[i].phase || i === 0) {
        return MOON_PHASES[i];
      }
    }
    return MOON_PHASES[0];
  };

  const findTreeByDate = (dateStr: string) => {
    try {
      const [day, month] = dateStr.split('/').map(Number);
      if (!day || !month) return null;

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

  const moonPhase = getCurrentMoonPhase();

  const renderMoonTab = () => (
    <Animated.View entering={FadeIn.duration(400)}>
      <View style={styles.moonCard}>
        <Text style={styles.moonEmoji}>{moonPhase.emoji}</Text>
        <Text style={styles.moonName}>{moonPhase.name}</Text>
        <Text style={styles.moonMeaning}>{moonPhase.meaning}</Text>
      </View>

      <Text style={styles.sectionTitle}>Phases lunaires</Text>
      <View style={styles.phasesGrid}>
        {MOON_PHASES.map((phase, index) => (
          <View key={index} style={styles.phaseItem}>
            <Text style={styles.phaseEmoji}>{phase.emoji}</Text>
            <Text style={styles.phaseName}>{phase.name}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );

  const renderCelticTab = () => (
    <Animated.View entering={FadeIn.duration(400)}>
      {!myTree && (
        <View style={styles.findTreeCard}>
          <Text style={styles.findTreeTitle}>Ton arbre</Text>
          <View style={styles.dateInputRow}>
            <TextInput
              style={styles.dateInput}
              placeholder="JJ/MM"
              placeholderTextColor="#B0B0A0"
              value={birthDate}
              onChangeText={setBirthDate}
              keyboardType="numbers-and-punctuation"
            />
            <TouchableOpacity 
              style={styles.findButton}
              onPress={() => {
                const tree = findTreeByDate(birthDate);
                if (tree) setMyTree(tree);
              }}
            >
              <Text style={styles.findButtonText}>Trouver</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {myTree && (
        <Animated.View entering={FadeInUp.duration(400)} style={styles.myTreeCard}>
          <Text style={styles.myTreeOgham}>{myTree.ogham}</Text>
          <Text style={styles.myTreeName}>{myTree.tree}</Text>
          <Text style={styles.myTreeDates}>{myTree.dates}</Text>
          <Text style={styles.myTreeMeaning}>{myTree.meaning}</Text>
          <Text style={styles.myTreePersonality}>{myTree.personality}</Text>
          <TouchableOpacity onPress={() => setMyTree(null)}>
            <Text style={styles.resetText}>Changer</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <Text style={styles.sectionTitle}>Les 13 arbres sacrés</Text>
      <View style={styles.treesList}>
        {CELTIC_TREES.map((tree, index) => (
          <TouchableOpacity
            key={tree.tree}
            style={styles.treeCard}
            onPress={() => setSelectedTree(selectedTree?.tree === tree.tree ? null : tree)}
            activeOpacity={0.7}
          >
            <Text style={styles.treeOgham}>{tree.ogham}</Text>
            <View style={styles.treeInfo}>
              <Text style={styles.treeName}>{tree.tree}</Text>
              <Text style={styles.treeDates}>{tree.dates}</Text>
            </View>
            {selectedTree?.tree === tree.tree && (
              <Animated.View entering={FadeIn.duration(300)} style={styles.treeDetail}>
                <Text style={styles.treeDetailText}>{tree.meaning}</Text>
                <Text style={styles.treeDetailText}>{tree.personality}</Text>
              </Animated.View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

  const renderHousesTab = () => (
    <Animated.View entering={FadeIn.duration(400)}>
      <Text style={styles.introText}>
        Les 12 maisons représentent les domaines de la vie.
      </Text>
      <View style={styles.housesList}>
        {WESTERN_HOUSES.map((house) => (
          <TouchableOpacity
            key={house.number}
            style={styles.houseCard}
            onPress={() => setSelectedHouse(selectedHouse === house.number ? null : house.number)}
            activeOpacity={0.7}
          >
            <View style={styles.houseNumber}>
              <Text style={styles.houseNumberText}>{house.number}</Text>
            </View>
            <View style={styles.houseInfo}>
              <Text style={styles.houseName}>{house.name}</Text>
              <Text style={styles.houseTheme}>{house.theme}</Text>
            </View>
            {selectedHouse === house.number && (
              <Animated.View entering={FadeIn.duration(300)} style={styles.houseDetail}>
                <Text style={styles.houseDetailText}>{house.description}</Text>
              </Animated.View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#6B6B5B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lune</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'moon' && styles.tabActive]}
          onPress={() => setTab('moon')}
        >
          <Text style={[styles.tabText, tab === 'moon' && styles.tabTextActive]}>Phase</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'celtic' && styles.tabActive]}
          onPress={() => setTab('celtic')}
        >
          <Text style={[styles.tabText, tab === 'celtic' && styles.tabTextActive]}>Celtique</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'houses' && styles.tabActive]}
          onPress={() => setTab('houses')}
        >
          <Text style={[styles.tabText, tab === 'houses' && styles.tabTextActive]}>Maisons</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {tab === 'moon' && renderMoonTab()}
        {tab === 'celtic' && renderCelticTab()}
        {tab === 'houses' && renderHousesTab()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
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
    fontSize: 16,
    fontWeight: '500',
    color: '#4A4A4A',
    letterSpacing: 0.5,
  },
  placeholder: {
    width: 40,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  tabActive: {
    backgroundColor: '#4A4A4A',
  },
  tabText: {
    fontSize: 13,
    color: '#A0A090',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  moonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  moonEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  moonName: {
    fontSize: 22,
    fontWeight: '300',
    color: '#4A4A4A',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  moonMeaning: {
    fontSize: 14,
    color: '#8B8B7D',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A4A4A',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  phasesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  phaseItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    width: '48%',
  },
  phaseEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  phaseName: {
    fontSize: 11,
    color: '#6B6B5B',
    textAlign: 'center',
  },
  findTreeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  findTreeTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4A4A4A',
    marginBottom: 12,
  },
  dateInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInput: {
    flex: 1,
    backgroundColor: '#F5F0E8',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#4A4A4A',
  },
  findButton: {
    backgroundColor: '#8B9A7D',
    borderRadius: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  findButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  myTreeCard: {
    backgroundColor: '#FDF9F3',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E8E0D4',
  },
  myTreeOgham: {
    fontSize: 40,
    color: '#8B9A7D',
    marginBottom: 8,
  },
  myTreeName: {
    fontSize: 24,
    fontWeight: '300',
    color: '#4A4A4A',
    letterSpacing: 0.5,
  },
  myTreeDates: {
    fontSize: 12,
    color: '#A0A090',
    marginBottom: 12,
  },
  myTreeMeaning: {
    fontSize: 14,
    color: '#6B6B5B',
    textAlign: 'center',
    marginBottom: 4,
  },
  myTreePersonality: {
    fontSize: 13,
    color: '#8B8B7D',
    textAlign: 'center',
    marginBottom: 12,
  },
  resetText: {
    fontSize: 12,
    color: '#A0A090',
  },
  treesList: {
    gap: 8,
  },
  treeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  treeOgham: {
    fontSize: 24,
    color: '#8B9A7D',
    width: 40,
  },
  treeInfo: {
    flex: 1,
  },
  treeName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#4A4A4A',
  },
  treeDates: {
    fontSize: 12,
    color: '#A0A090',
  },
  treeDetail: {
    width: '100%',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0EBE3',
  },
  treeDetailText: {
    fontSize: 13,
    color: '#6B6B5B',
    marginBottom: 4,
  },
  introText: {
    fontSize: 14,
    color: '#8B8B7D',
    marginBottom: 20,
    lineHeight: 20,
  },
  housesList: {
    gap: 8,
  },
  houseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  houseNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F0E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  houseNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A4A4A',
  },
  houseInfo: {
    flex: 1,
    marginLeft: 12,
  },
  houseName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#4A4A4A',
  },
  houseTheme: {
    fontSize: 12,
    color: '#A0A090',
  },
  houseDetail: {
    width: '100%',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0EBE3',
  },
  houseDetailText: {
    fontSize: 13,
    color: '#6B6B5B',
  },
});
