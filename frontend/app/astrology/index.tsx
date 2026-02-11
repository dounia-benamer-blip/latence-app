import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';

const TABS = ['lune', 'celtique', 'arabe', 'maisons'];

// Arabic Lunar Mansions - Al Manzil
const ARABIC_MANSIONS = [
  { number: 1, arabic: "الشرطين", name: "Al-Sharatain", meaning: "Les deux signes", nature: "Favorable aux voyages" },
  { number: 2, arabic: "البطين", name: "Al-Butain", meaning: "Le petit ventre", nature: "Propice aux trésors" },
  { number: 3, arabic: "الثريا", name: "Al-Thurayya", meaning: "Les Pléiades", nature: "Bénéfique pour l'amour" },
  { number: 4, arabic: "الدبران", name: "Al-Dabaran", meaning: "Le suiveur", nature: "Favorable aux constructions" },
  { number: 5, arabic: "الهقعة", name: "Al-Haq'a", meaning: "La marque", nature: "Propice aux guérisons" },
  { number: 6, arabic: "الهنعة", name: "Al-Han'a", meaning: "La courbe", nature: "Favorable à la chasse" },
  { number: 7, arabic: "الذراع", name: "Al-Dhira", meaning: "Le bras", nature: "Bénéfique pour les moissons" },
  { number: 8, arabic: "النثرة", name: "Al-Nathra", meaning: "La crèche", nature: "Propice à la paix" },
  { number: 9, arabic: "الطرف", name: "Al-Tarf", meaning: "Le regard", nature: "Défavorable aux voyages" },
  { number: 10, arabic: "الجبهة", name: "Al-Jabha", meaning: "Le front", nature: "Favorable aux victoires" },
  { number: 11, arabic: "الزبرة", name: "Al-Zubra", meaning: "La crinière", nature: "Propice aux semailles" },
  { number: 12, arabic: "الصرفة", name: "Al-Sarfa", meaning: "Le changeur", nature: "Favorable aux changements" },
  { number: 13, arabic: "العواء", name: "Al-Awwa", meaning: "Le hurleur", nature: "Propice aux récoltes" },
  { number: 14, arabic: "السماك", name: "Al-Simak", meaning: "Le désarmé", nature: "Bénéfique pour le commerce" },
  { number: 15, arabic: "الغفر", name: "Al-Ghafr", meaning: "La couverture", nature: "Favorable aux fondations" },
  { number: 16, arabic: "الزبانى", name: "Al-Zubana", meaning: "Les pinces", nature: "Défavorable aux voyages" },
  { number: 17, arabic: "الإكليل", name: "Al-Iklil", meaning: "La couronne", nature: "Propice aux mariages" },
  { number: 18, arabic: "القلب", name: "Al-Qalb", meaning: "Le cœur", nature: "Favorable aux constructions" },
  { number: 19, arabic: "الشولة", name: "Al-Shaula", meaning: "Le dard", nature: "Défavorable" },
  { number: 20, arabic: "النعائم", name: "Al-Na'a'im", meaning: "Les autruches", nature: "Propice aux voyages" },
  { number: 21, arabic: "البلدة", name: "Al-Balda", meaning: "La ville", nature: "Favorable aux récoltes" },
  { number: 22, arabic: "سعد الذابح", name: "Sa'd al-Dhabih", meaning: "Chance du sacrificateur", nature: "Propice aux guérisons" },
  { number: 23, arabic: "سعد بلع", name: "Sa'd Bula", meaning: "Chance de l'avaleur", nature: "Favorable au mariage" },
  { number: 24, arabic: "سعد السعود", name: "Sa'd al-Su'ud", meaning: "Chance des chances", nature: "Très favorable" },
  { number: 25, arabic: "سعد الأخبية", name: "Sa'd al-Akhbiya", meaning: "Chance des tentes", nature: "Propice aux voyages" },
  { number: 26, arabic: "الفرغ المقدم", name: "Al-Fargh al-Muqaddam", meaning: "Premier déversoir", nature: "Favorable" },
  { number: 27, arabic: "الفرغ المؤخر", name: "Al-Fargh al-Mu'akhkhar", meaning: "Second déversoir", nature: "Propice aux semailles" },
  { number: 28, arabic: "بطن الحوت", name: "Batn al-Hut", meaning: "Ventre du poisson", nature: "Favorable aux mariages" },
];

const CELTIC_TREES = [
  { tree: "Bouleau", dates: "24 déc - 20 jan", ogham: "ᚁ", meaning: "Renouveau" },
  { tree: "Sorbier", dates: "21 jan - 17 fév", ogham: "ᚂ", meaning: "Vision" },
  { tree: "Frêne", dates: "18 fév - 17 mars", ogham: "ᚅ", meaning: "Connexion" },
  { tree: "Aulne", dates: "18 mars - 14 avril", ogham: "ᚃ", meaning: "Courage" },
  { tree: "Saule", dates: "15 avril - 12 mai", ogham: "ᚄ", meaning: "Cycles" },
  { tree: "Aubépine", dates: "13 mai - 9 juin", ogham: "ᚆ", meaning: "Dualité" },
  { tree: "Chêne", dates: "10 juin - 7 juil", ogham: "ᚇ", meaning: "Force" },
  { tree: "Houx", dates: "8 juil - 4 août", ogham: "ᚈ", meaning: "Défis" },
  { tree: "Noisetier", dates: "5 août - 1 sept", ogham: "ᚉ", meaning: "Sagesse" },
  { tree: "Vigne", dates: "2 sept - 29 sept", ogham: "ᚊ", meaning: "Harmonie" },
  { tree: "Lierre", dates: "30 sept - 27 oct", ogham: "ᚌ", meaning: "Survie" },
  { tree: "Roseau", dates: "28 oct - 24 nov", ogham: "ᚍ", meaning: "Secret" },
  { tree: "Sureau", dates: "25 nov - 23 déc", ogham: "ᚏ", meaning: "Fin" },
];

const WESTERN_HOUSES = [
  { number: 1, name: "Ascendant", theme: "Le Moi" },
  { number: 2, name: "Possessions", theme: "Ressources" },
  { number: 3, name: "Communication", theme: "Expression" },
  { number: 4, name: "Foyer", theme: "Racines" },
  { number: 5, name: "Créativité", theme: "Joie" },
  { number: 6, name: "Service", theme: "Santé" },
  { number: 7, name: "Partenariats", theme: "Relations" },
  { number: 8, name: "Transformation", theme: "Renaissance" },
  { number: 9, name: "Philosophie", theme: "Expansion" },
  { number: 10, name: "Carrière", theme: "Destinée" },
  { number: 11, name: "Espoirs", theme: "Aspirations" },
  { number: 12, name: "Inconscient", theme: "Caché" },
];

const MOON_PHASES = [
  { name: "Nouvelle Lune", emoji: "🌑", meaning: "Nouveaux départs" },
  { name: "Premier Croissant", emoji: "🌒", meaning: "Croissance" },
  { name: "Premier Quartier", emoji: "🌓", meaning: "Action" },
  { name: "Gibbeuse Croissante", emoji: "🌔", meaning: "Perfectionnement" },
  { name: "Pleine Lune", emoji: "🌕", meaning: "Accomplissement" },
  { name: "Gibbeuse Décroissante", emoji: "🌖", meaning: "Gratitude" },
  { name: "Dernier Quartier", emoji: "🌗", meaning: "Lâcher-prise" },
  { name: "Dernier Croissant", emoji: "🌘", meaning: "Repos" },
];

export default function AstrologyScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<string>('lune');
  const [selectedMansion, setSelectedMansion] = useState<number | null>(null);

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
    
    const index = Math.floor(phase * 8) % 8;
    return { ...MOON_PHASES[index], dayInCycle: Math.floor(phase * 28) + 1 };
  };

  const getCurrentMansion = () => {
    const phase = getCurrentMoonPhase();
    const mansionIndex = phase.dayInCycle - 1;
    return ARABIC_MANSIONS[mansionIndex] || ARABIC_MANSIONS[0];
  };

  const moonPhase = getCurrentMoonPhase();
  const currentMansion = getCurrentMansion();

  const renderMoonTab = () => (
    <Animated.View entering={FadeIn.duration(400)}>
      <View style={styles.moonCard}>
        <Text style={styles.moonEmoji}>{moonPhase.emoji}</Text>
        <Text style={styles.moonName}>{moonPhase.name}</Text>
        <Text style={styles.moonMeaning}>{moonPhase.meaning}</Text>
        <Text style={styles.moonDay}>Jour {moonPhase.dayInCycle} du cycle</Text>
      </View>

      <Text style={styles.sectionTitle}>Les 8 phases</Text>
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
      <Text style={styles.introText}>
        Les 13 arbres sacrés du calendrier lunaire druidique.
      </Text>
      <View style={styles.treesList}>
        {CELTIC_TREES.map((tree) => (
          <View key={tree.tree} style={styles.treeCard}>
            <Text style={styles.treeOgham}>{tree.ogham}</Text>
            <View style={styles.treeInfo}>
              <Text style={styles.treeName}>{tree.tree}</Text>
              <Text style={styles.treeDates}>{tree.dates}</Text>
            </View>
            <Text style={styles.treeMeaning}>{tree.meaning}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );

  const renderArabicTab = () => (
    <Animated.View entering={FadeIn.duration(400)}>
      <View style={styles.currentMansionCard}>
        <Text style={styles.mansionArabic}>{currentMansion.arabic}</Text>
        <Text style={styles.mansionName}>{currentMansion.name}</Text>
        <Text style={styles.mansionMeaning}>{currentMansion.meaning}</Text>
        <Text style={styles.mansionNature}>{currentMansion.nature}</Text>
      </View>

      <Text style={styles.sectionTitle}>Les 28 Manzil</Text>
      <Text style={styles.introText}>
        Les demeures lunaires arabes divisent le zodiaque selon le passage de la Lune.
      </Text>
      
      <View style={styles.mansionsList}>
        {ARABIC_MANSIONS.map((mansion) => (
          <TouchableOpacity
            key={mansion.number}
            style={[
              styles.mansionCard,
              selectedMansion === mansion.number && styles.mansionCardSelected,
            ]}
            onPress={() => setSelectedMansion(
              selectedMansion === mansion.number ? null : mansion.number
            )}
            activeOpacity={0.7}
          >
            <View style={styles.mansionHeader}>
              <Text style={styles.mansionNumber}>{mansion.number}</Text>
              <Text style={styles.mansionArabicSmall}>{mansion.arabic}</Text>
              <Text style={styles.mansionNameSmall}>{mansion.name}</Text>
            </View>
            {selectedMansion === mansion.number && (
              <Animated.View entering={FadeIn.duration(300)} style={styles.mansionDetail}>
                <Text style={styles.mansionDetailText}>{mansion.meaning}</Text>
                <Text style={styles.mansionDetailNature}>{mansion.nature}</Text>
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
          <View key={house.number} style={styles.houseCard}>
            <View style={styles.houseNumber}>
              <Text style={styles.houseNumberText}>{house.number}</Text>
            </View>
            <View style={styles.houseInfo}>
              <Text style={styles.houseName}>{house.name}</Text>
              <Text style={styles.houseTheme}>{house.theme}</Text>
            </View>
          </View>
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
        <Text style={styles.headerTitle}>Astres</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      <View style={styles.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {tab === 'lune' && renderMoonTab()}
        {tab === 'celtique' && renderCelticTab()}
        {tab === 'arabe' && renderArabicTab()}
        {tab === 'maisons' && renderHousesTab()}
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
  },
  placeholder: {
    width: 40,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 6,
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
    fontSize: 12,
    color: '#A0A090',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  moonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  moonEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  moonName: {
    fontSize: 20,
    fontWeight: '300',
    color: '#4A4A4A',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  moonMeaning: {
    fontSize: 14,
    color: '#8B8B7D',
    marginBottom: 8,
  },
  moonDay: {
    fontSize: 12,
    color: '#A0A090',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A4A4A',
    marginBottom: 12,
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
  introText: {
    fontSize: 13,
    color: '#8B8B7D',
    marginBottom: 16,
    lineHeight: 20,
  },
  treesList: {
    gap: 8,
  },
  treeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  treeOgham: {
    fontSize: 22,
    color: '#8B9A7D',
    width: 36,
  },
  treeInfo: {
    flex: 1,
  },
  treeName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A4A4A',
  },
  treeDates: {
    fontSize: 11,
    color: '#A0A090',
  },
  treeMeaning: {
    fontSize: 12,
    color: '#8B8B7D',
  },
  currentMansionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  mansionArabic: {
    fontSize: 36,
    color: '#D4A574',
    marginBottom: 8,
  },
  mansionName: {
    fontSize: 18,
    fontWeight: '300',
    color: '#4A4A4A',
    marginBottom: 4,
  },
  mansionMeaning: {
    fontSize: 14,
    color: '#6B6B5B',
    marginBottom: 8,
  },
  mansionNature: {
    fontSize: 12,
    color: '#8B9A7D',
    fontStyle: 'italic',
  },
  mansionsList: {
    gap: 8,
  },
  mansionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
  },
  mansionCardSelected: {
    backgroundColor: '#FDF9F3',
    borderWidth: 1,
    borderColor: '#D4C4A8',
  },
  mansionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mansionNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A0A090',
    width: 24,
  },
  mansionArabicSmall: {
    fontSize: 16,
    color: '#D4A574',
    width: 60,
  },
  mansionNameSmall: {
    fontSize: 13,
    color: '#4A4A4A',
    flex: 1,
  },
  mansionDetail: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0EBE3',
  },
  mansionDetailText: {
    fontSize: 13,
    color: '#6B6B5B',
    marginBottom: 4,
  },
  mansionDetailNature: {
    fontSize: 12,
    color: '#8B9A7D',
    fontStyle: 'italic',
  },
  housesList: {
    gap: 8,
  },
  houseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
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
    fontSize: 14,
    fontWeight: '500',
    color: '#4A4A4A',
  },
  houseTheme: {
    fontSize: 12,
    color: '#A0A090',
  },
});
