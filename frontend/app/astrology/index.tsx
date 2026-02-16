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
  Modal,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp, FadeInDown } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../src/context/ThemeContext';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// ==================== DATA ====================

const ARABIC_MANSIONS = [
  { number: 1, arabic: "الشرطين", name: "Al-Sharatain", meaning: "Les deux signes", nature: "Favorable aux voyages et aux nouveaux départs", element: "Feu", planet: "Mars", description: "Cette demeure marque le début du cycle lunaire. Elle est associée à l'énergie du renouveau et de l'initiative. C'est un moment propice pour entreprendre de nouvelles aventures." },
  { number: 2, arabic: "البطين", name: "Al-Butain", meaning: "Le petit ventre", nature: "Propice à la découverte de trésors cachés", element: "Terre", planet: "Vénus", description: "Demeure de l'accumulation et de la patience. Elle favorise la recherche intérieure et la découverte de ressources insoupçonnées." },
  { number: 3, arabic: "الثريا", name: "Al-Thurayya", meaning: "Les Pléiades", nature: "Bénéfique pour l'amour et les relations", element: "Air", planet: "Lune", description: "Les Pléiades sont les étoiles de l'union. Cette demeure favorise les rencontres, les liens affectifs et la connexion avec les autres." },
  { number: 4, arabic: "الدبران", name: "Al-Dabaran", meaning: "Le suiveur", nature: "Favorable aux constructions durables", element: "Terre", planet: "Mars", description: "L'œil du Taureau symbolise la persévérance. Cette demeure soutient les projets à long terme et la construction de fondations solides." },
  { number: 5, arabic: "الهقعة", name: "Al-Haq'a", meaning: "La marque", nature: "Propice aux guérisons et à la santé", element: "Eau", planet: "Mercure", description: "Demeure de la purification et de la guérison. Elle favorise le processus de régénération physique et spirituelle." },
  { number: 6, arabic: "الهنعة", name: "Al-Han'a", meaning: "La courbe", nature: "Favorable à la chasse et à la poursuite d'objectifs", element: "Air", planet: "Jupiter", description: "Cette demeure représente la flexibilité et l'adaptation. Elle aide à atteindre ses objectifs en contournant les obstacles." },
  { number: 7, arabic: "الذراع", name: "Al-Dhira", meaning: "Le bras", nature: "Bénéfique pour les moissons et la récolte", element: "Eau", planet: "Vénus", description: "Le bras qui récolte symbolise l'aboutissement des efforts. Cette demeure favorise la réception des fruits de son travail." },
  { number: 8, arabic: "النثرة", name: "Al-Nathra", meaning: "La crèche", nature: "Propice à la paix et à l'harmonie", element: "Feu", planet: "Saturne", description: "Demeure du repos et de la protection. Elle crée un espace de sécurité et de tranquillité intérieure." },
  { number: 9, arabic: "الطرف", name: "Al-Tarf", meaning: "Le regard", nature: "Période de réflexion, éviter les voyages", element: "Eau", planet: "Mars", description: "L'œil vigilant invite à l'introspection. Cette demeure demande de ralentir et d'observer avant d'agir." },
  { number: 10, arabic: "الجبهة", name: "Al-Jabha", meaning: "Le front", nature: "Favorable aux victoires et aux succès", element: "Feu", planet: "Soleil", description: "Le front du Lion représente la force et le courage. Cette demeure soutient les entreprises audacieuses et la conquête." },
  { number: 11, arabic: "الزبرة", name: "Al-Zubra", meaning: "La crinière", nature: "Propice aux semailles et aux débuts", element: "Terre", planet: "Vénus", description: "La crinière royale symbolise la fierté et la créativité. Demeure favorable pour planter les graines de futurs projets." },
  { number: 12, arabic: "الصرفة", name: "Al-Sarfa", meaning: "Le changeur", nature: "Favorable aux transformations", element: "Air", planet: "Soleil", description: "Le moment du changement de saison. Cette demeure facilite les transitions et les métamorphoses personnelles." },
  { number: 13, arabic: "العواء", name: "Al-Awwa", meaning: "Le hurleur", nature: "Propice aux récoltes et à l'abondance", element: "Eau", planet: "Mercure", description: "Le cri de joie de la récolte. Cette demeure annonce l'abondance et la gratitude pour les bienfaits reçus." },
  { number: 14, arabic: "السماك", name: "Al-Simak", meaning: "Le désarmé", nature: "Bénéfique pour le commerce et les échanges", element: "Air", planet: "Mars", description: "L'étoile de la balance favorise les négociations justes et les échanges équitables." },
  { number: 15, arabic: "الغفر", name: "Al-Ghafr", meaning: "La couverture", nature: "Favorable aux fondations et à la protection", element: "Terre", planet: "Vénus", description: "Le voile protecteur offre sécurité et discrétion. Demeure propice aux activités nécessitant de la confidentialité." },
  { number: 16, arabic: "الزبانى", name: "Al-Zubana", meaning: "Les pinces", nature: "Période délicate, éviter les conflits", element: "Eau", planet: "Saturne", description: "Les pinces du Scorpion invitent à la prudence. Période de vigilance où il faut éviter les confrontations." },
  { number: 17, arabic: "الإكليل", name: "Al-Iklil", meaning: "La couronne", nature: "Propice aux mariages et aux unions", element: "Air", planet: "Mercure", description: "La couronne de gloire symbolise l'union sacrée. Demeure favorable aux engagements et aux alliances." },
  { number: 18, arabic: "القلب", name: "Al-Qalb", meaning: "Le cœur", nature: "Favorable aux constructions et aux projets durables", element: "Feu", planet: "Mars", description: "Le cœur du Scorpion pulse avec intensité. Cette demeure renforce les projets qui demandent passion et engagement." },
  { number: 19, arabic: "الشولة", name: "Al-Shaula", meaning: "Le dard", nature: "Période de prudence, éviter les risques", element: "Eau", planet: "Lune", description: "Le dard avertit du danger. Demeure qui invite à la retenue et à la protection contre les influences négatives." },
  { number: 20, arabic: "النعائم", name: "Al-Na'a'im", meaning: "Les autruches", nature: "Propice aux voyages et à l'expansion", element: "Feu", planet: "Soleil", description: "Les autruches représentent le mouvement et la liberté. Demeure favorable aux déplacements et à l'exploration." },
  { number: 21, arabic: "البلدة", name: "Al-Balda", meaning: "La ville", nature: "Favorable aux récoltes et aux aboutissements", element: "Terre", planet: "Vénus", description: "La cité représente la civilisation et l'accomplissement. Demeure de concrétisation des projets." },
  { number: 22, arabic: "سعد الذابح", name: "Sa'd al-Dhabih", meaning: "Chance du sacrificateur", nature: "Propice aux guérisons et à la libération", element: "Air", planet: "Saturne", description: "Le sacrifice libérateur permet de se défaire du superflu. Demeure de purification et de renouveau." },
  { number: 23, arabic: "سعد بلع", name: "Sa'd Bula", meaning: "Chance de l'avaleur", nature: "Favorable au mariage et aux engagements", element: "Eau", planet: "Mercure", description: "L'intégration et l'absorption du nouveau. Demeure propice aux unions et à l'accueil." },
  { number: 24, arabic: "سعد السعود", name: "Sa'd al-Su'ud", meaning: "La chance des chances", nature: "Très favorable à toutes les entreprises", element: "Feu", planet: "Jupiter", description: "La plus fortunée des demeures. Période bénie pour entreprendre tout ce qui est important." },
  { number: 25, arabic: "سعد الأخبية", name: "Sa'd al-Akhbiya", meaning: "Chance des tentes", nature: "Propice aux voyages et aux déménagements", element: "Terre", planet: "Saturne", description: "Les tentes symbolisent le mouvement et la flexibilité. Demeure favorable aux changements de lieu." },
  { number: 26, arabic: "الفرغ المقدم", name: "Al-Fargh al-Muqaddam", meaning: "Premier déversoir", nature: "Favorable aux unions et aux associations", element: "Air", planet: "Mars", description: "Le premier verseau annonce le flot des bénédictions. Demeure propice aux partenariats." },
  { number: 27, arabic: "الفرغ المؤخر", name: "Al-Fargh al-Mu'akhkhar", meaning: "Second déversoir", nature: "Propice aux semailles et aux nouveaux projets", element: "Eau", planet: "Mercure", description: "Le second verseau complète le cycle. Demeure favorable pour préparer l'avenir." },
  { number: 28, arabic: "بطن الحوت", name: "Batn al-Hut", meaning: "Ventre du poisson", nature: "Favorable aux mariages et à la clôture des cycles", element: "Eau", planet: "Saturne", description: "Le ventre du poisson représente la fin et le renouveau. Demeure de conclusion et de préparation au nouveau cycle." },
];

const CELTIC_TREES = [
  { tree: "Bouleau", dates: "24 déc - 20 jan", ogham: "ᚁ", meaning: "Renouveau et purification", personality: "Leader naturel, ambitieux et déterminé", element: "Air", qualities: ["Initiative", "Purification", "Nouveaux départs"], shadow: "Impatience, perfectionnisme", message: "Tu es le pionnier qui ouvre la voie. Ta capacité à voir les possibilités là où d'autres voient des obstacles est ton plus grand don.", startMonth: 12, startDay: 24, endMonth: 1, endDay: 20 },
  { tree: "Sorbier", dates: "21 jan - 17 fév", ogham: "ᚂ", meaning: "Vision et protection", personality: "Visionnaire intuitif et penseur profond", element: "Feu", qualities: ["Intuition", "Protection", "Vision"], shadow: "Isolement, hypersensibilité", message: "Tu vois au-delà du voile. Ta connexion avec l'invisible te guide vers ta vérité.", startMonth: 1, startDay: 21, endMonth: 2, endDay: 17 },
  { tree: "Frêne", dates: "18 fév - 17 mars", ogham: "ᚅ", meaning: "Connexion entre les mondes", personality: "Artistique, rêveur et connecté", element: "Eau", qualities: ["Imagination", "Connexion", "Sagesse"], shadow: "Fuite de la réalité", message: "Tu es le pont entre les mondes. Ta sensibilité est ta force, pas ta faiblesse.", startMonth: 2, startDay: 18, endMonth: 3, endDay: 17 },
  { tree: "Aulne", dates: "18 mars - 14 avril", ogham: "ᚃ", meaning: "Courage et passion", personality: "Courageux, passionné et charismatique", element: "Feu", qualities: ["Courage", "Passion", "Leadership"], shadow: "Impulsivité, colère", message: "Ta flamme intérieure éclaire le chemin des autres. Canalise cette énergie vers ce qui compte vraiment.", startMonth: 3, startDay: 18, endMonth: 4, endDay: 14 },
  { tree: "Saule", dates: "15 avril - 12 mai", ogham: "ᚄ", meaning: "Cycles lunaires et émotions", personality: "Sensible, patient et résilient", element: "Eau", qualities: ["Intuition lunaire", "Résilience", "Patience"], shadow: "Mélancolie, dépendance", message: "Comme le saule, tu plies mais ne romps jamais. Ta connexion à la lune te guide à travers les marées de la vie.", startMonth: 4, startDay: 15, endMonth: 5, endDay: 12 },
  { tree: "Aubépine", dates: "13 mai - 9 juin", ogham: "ᚆ", meaning: "Dualité et transformation", personality: "Curieux, adaptable et créatif", element: "Air", qualities: ["Adaptabilité", "Curiosité", "Communication"], shadow: "Inconstance, superficialité", message: "Tu embrasses les paradoxes de la vie. Ta capacité à voir les deux côtés est un don précieux.", startMonth: 5, startDay: 13, endMonth: 6, endDay: 9 },
  { tree: "Chêne", dates: "10 juin - 7 juil", ogham: "ᚇ", meaning: "Force et sagesse", personality: "Protecteur, généreux et sage", element: "Terre", qualities: ["Force", "Générosité", "Sagesse"], shadow: "Rigidité, orgueil", message: "Tu es le pilier sur lequel les autres s'appuient. Ta force vient de tes racines profondes.", startMonth: 6, startDay: 10, endMonth: 7, endDay: 7 },
  { tree: "Houx", dates: "8 juil - 4 août", ogham: "ᚈ", meaning: "Royauté et persévérance", personality: "Noble, ambitieux et compétitif", element: "Feu", qualities: ["Persévérance", "Noblesse", "Ambition"], shadow: "Ego, compétitivité excessive", message: "Tu portes la couronne de celui qui ne renonce jamais. Ta détermination inspire les autres.", startMonth: 7, startDay: 8, endMonth: 8, endDay: 4 },
  { tree: "Noisetier", dates: "5 août - 1 sept", ogham: "ᚉ", meaning: "Sagesse et inspiration", personality: "Intelligent, analytique et inspiré", element: "Air", qualities: ["Intelligence", "Analyse", "Inspiration"], shadow: "Suranalyse, froideur", message: "Tu es le gardien de la connaissance sacrée. Partage ta sagesse avec ceux qui cherchent.", startMonth: 8, startDay: 5, endMonth: 9, endDay: 1 },
  { tree: "Vigne", dates: "2 sept - 29 sept", ogham: "ᚊ", meaning: "Raffinement et harmonie", personality: "Raffiné, charmant et équilibré", element: "Eau", qualities: ["Charme", "Équilibre", "Sens esthétique"], shadow: "Indécision, dépendance", message: "Tu recherches la beauté en toute chose. Ton sens de l'harmonie crée des ponts entre les gens.", startMonth: 9, startDay: 2, endMonth: 9, endDay: 29 },
  { tree: "Lierre", dates: "30 sept - 27 oct", ogham: "ᚌ", meaning: "Transformation et survie", personality: "Loyal, spirituel et résilient", element: "Eau", qualities: ["Résilience", "Loyauté", "Spiritualité"], shadow: "Possessivité, jalousie", message: "Tu traverses les épreuves avec une force intérieure remarquable. Ta loyauté est légendaire.", startMonth: 9, startDay: 30, endMonth: 10, endDay: 27 },
  { tree: "Roseau", dates: "28 oct - 24 nov", ogham: "ᚍ", meaning: "Secret et vérité", personality: "Mystérieux, courageux et perspicace", element: "Eau", qualities: ["Perspicacité", "Courage", "Mystère"], shadow: "Paranoïa, vengeance", message: "Tu perces les mystères que d'autres ignorent. Ta profondeur est ton trésor.", startMonth: 10, startDay: 28, endMonth: 11, endDay: 24 },
  { tree: "Sureau", dates: "25 nov - 23 déc", ogham: "ᚏ", meaning: "Fin et renaissance", personality: "Libre, philosophe et transformateur", element: "Feu", qualities: ["Liberté", "Sagesse", "Transformation"], shadow: "Excentricité, impatience", message: "Tu marques la fin d'un cycle et le début d'un autre. Ta sagesse vient de nombreuses vies.", startMonth: 11, startDay: 25, endMonth: 12, endDay: 23 },
];

const WESTERN_HOUSES = [
  { number: 1, name: "Ascendant", theme: "Le Moi", ruler: "Mars", description: "La Maison I représente ta personnalité extérieure, ton apparence physique et la première impression que tu donnes aux autres. C'est le masque que tu portes face au monde.", governs: ["Apparence physique", "Personnalité visible", "Première impression", "Vitalité"] },
  { number: 2, name: "Possessions", theme: "Les Ressources", ruler: "Vénus", description: "La Maison II gouverne tes valeurs matérielles et spirituelles, tes finances, et ce que tu possèdes. Elle révèle ton rapport à l'argent et à l'estime de soi.", governs: ["Finances", "Possessions", "Valeurs personnelles", "Talents naturels"] },
  { number: 3, name: "Communication", theme: "L'Expression", ruler: "Mercure", description: "La Maison III représente la communication, l'apprentissage et l'environnement proche. Elle montre comment tu penses et interagis au quotidien.", governs: ["Communication", "Pensée", "Frères et sœurs", "Voyages courts"] },
  { number: 4, name: "Foyer", theme: "Les Racines", ruler: "Lune", description: "La Maison IV est le fondement de ton être. Elle représente la famille, le foyer, les racines ancestrales et ta vie privée.", governs: ["Famille", "Maison", "Racines", "Fin de vie"] },
  { number: 5, name: "Créativité", theme: "La Joie", ruler: "Soleil", description: "La Maison V est celle de la création, du plaisir et de l'expression personnelle. Elle gouverne les enfants, les romances et les loisirs.", governs: ["Créativité", "Enfants", "Romance", "Expression artistique"] },
  { number: 6, name: "Service", theme: "La Santé", ruler: "Mercure", description: "La Maison VI concerne le travail quotidien, la santé et les routines. Elle révèle ton approche du service aux autres.", governs: ["Santé", "Travail quotidien", "Routines", "Service"] },
  { number: 7, name: "Partenariats", theme: "Les Relations", ruler: "Vénus", description: "La Maison VII représente les associations, le mariage et les contrats. C'est comment tu te relies aux autres en relation intime.", governs: ["Mariage", "Partenariats", "Contrats", "Relations publiques"] },
  { number: 8, name: "Transformation", theme: "La Renaissance", ruler: "Pluton", description: "La Maison VIII gouverne la mort symbolique, la renaissance, la sexualité et les transformations profondes.", governs: ["Transformation", "Mort et renaissance", "Sexualité", "Mystères occultes"] },
  { number: 9, name: "Philosophie", theme: "L'Expansion", ruler: "Jupiter", description: "La Maison IX représente l'expansion de l'esprit : voyages lointains, études supérieures et quête de sens.", governs: ["Voyages lointains", "Philosophie", "Religion", "Études supérieures"] },
  { number: 10, name: "Carrière", theme: "La Destinée", ruler: "Saturne", description: "La Maison X est le zénith de ton thème. Elle représente ta carrière, ta réputation et tes ambitions.", governs: ["Carrière", "Réputation", "Statut social", "Autorité"] },
  { number: 11, name: "Espoirs", theme: "Les Aspirations", ruler: "Uranus", description: "La Maison XI gouverne les amitiés, les groupes et les idéaux. Elle révèle tes espoirs pour le futur.", governs: ["Amis", "Groupes", "Espoirs", "Idéaux humanitaires"] },
  { number: 12, name: "Inconscient", theme: "Le Caché", ruler: "Neptune", description: "La Maison XII est le royaume du caché, de l'inconscient et de la spiritualité profonde.", governs: ["Inconscient", "Secrets", "Karma", "Spiritualité profonde"] },
];

const MOON_PHASES = [
  { name: "Nouvelle Lune", icon: "moon-outline", meaning: "Nouveaux départs", energy: "C'est le moment de planter des graines d'intention. L'énergie est tournée vers l'intérieur, propice à l'introspection et aux nouveaux commencements." },
  { name: "Premier Croissant", icon: "moon-outline", meaning: "Croissance", energy: "L'énergie commence à se manifester. C'est le moment d'affirmer tes intentions et de faire les premiers pas vers tes objectifs." },
  { name: "Premier Quartier", icon: "moon-outline", meaning: "Action", energy: "Moment de prise de décision et d'action. Les défis peuvent apparaître - ils sont là pour t'aider à clarifier ta direction." },
  { name: "Gibbeuse Croissante", icon: "moon-outline", meaning: "Perfectionnement", energy: "L'énergie monte vers son apogée. C'est le moment de raffiner tes efforts et de préparer l'accomplissement." },
  { name: "Pleine Lune", icon: "moon", meaning: "Accomplissement", energy: "Moment de culmination et de révélation. Les émotions sont amplifiées. C'est le temps de la gratitude et de la célébration." },
  { name: "Gibbeuse Décroissante", icon: "moon", meaning: "Gratitude", energy: "L'énergie commence à se tourner vers le partage. C'est le moment de transmettre ce que tu as appris et reçu." },
  { name: "Dernier Quartier", icon: "moon-outline", meaning: "Lâcher-prise", energy: "Moment de libération et de pardon. C'est le temps de laisser partir ce qui ne te sert plus." },
  { name: "Dernier Croissant", icon: "moon-outline", meaning: "Repos", energy: "L'énergie se retire pour la régénération. C'est le moment de la réflexion profonde et de la préparation au nouveau cycle." },
];

// ==================== UTILS ====================

const calculateMoonPhase = (date: Date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  const c = Math.floor(year / 100);
  const y = year - 100 * c;
  const mm = month < 3 ? month + 12 : month;
  const yy = month < 3 ? y - 1 : y;
  
  const jd = (Math.floor(365.25 * yy) + Math.floor(30.6 * mm) + day - 694039.09) / 29.53;
  const phase = jd - Math.floor(jd);
  
  const index = Math.floor(phase * 8) % 8;
  const dayInCycle = Math.floor(phase * 28) + 1;
  return { ...MOON_PHASES[index], dayInCycle, phaseIndex: index, phaseValue: phase };
};

const getMansionForDate = (date: Date = new Date()) => {
  const phase = calculateMoonPhase(date);
  return ARABIC_MANSIONS[(phase.dayInCycle - 1) % 28];
};

const getCelticTreeForDate = (month: number, day: number) => {
  for (const tree of CELTIC_TREES) {
    // Handle year-crossing periods (Dec-Jan)
    if (tree.startMonth > tree.endMonth) {
      if ((month === tree.startMonth && day >= tree.startDay) ||
          (month === tree.endMonth && day <= tree.endDay)) {
        return tree;
      }
    } else {
      if ((month === tree.startMonth && day >= tree.startDay) ||
          (month === tree.endMonth && day <= tree.endDay) ||
          (month > tree.startMonth && month < tree.endMonth)) {
        return tree;
      }
    }
  }
  return CELTIC_TREES[0];
};

// Calculate lunar house based on birth date
const calculateLunarHouse = (birthDate: Date) => {
  const moonPhase = calculateMoonPhase(birthDate);
  // Map moon phase to house (simplified calculation)
  // The house is based on where the moon was in its cycle at birth
  const houseNumber = Math.floor(moonPhase.phaseValue * 12) + 1;
  return {
    house: WESTERN_HOUSES[houseNumber - 1],
    moonPhase,
    mansion: getMansionForDate(birthDate),
    celticTree: getCelticTreeForDate(birthDate.getMonth() + 1, birthDate.getDate()),
  };
};

// ==================== COMPONENT ====================

export default function AstrologyScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [tab, setTab] = useState<string>('lune');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [lunarReading, setLunarReading] = useState<string>('');
  const [isLoadingReading, setIsLoadingReading] = useState(false);
  const [userQuestion, setUserQuestion] = useState('');
  
  // Profile form
  const [userName, setUserName] = useState('');
  const [birthDateInput, setBirthDateInput] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [birthHour, setBirthHour] = useState('');
  const [showDateModal, setShowDateModal] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  
  // New picker states
  const [selectedDay, setSelectedDay] = useState(15);
  const [selectedMonth, setSelectedMonth] = useState(6);
  const [selectedYear, setSelectedYear] = useState(1995);
  const [cityResults, setCityResults] = useState<any[]>([]);

  // Update birth date from pickers
  const updateBirthDate = (day: number, month: number, year: number) => {
    const formatted = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    setBirthDateInput(formatted);
  };

  // Search cities
  const searchCities = async (query: string) => {
    if (query.length < 2) {
      setCityResults([]);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/cities?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setCityResults(data);
      }
    } catch (e) {
      setCityResults([]);
    }
  };

  useEffect(() => {
    loadBirthDate();
  }, []);

  const loadBirthDate = async () => {
    try {
      // Try loading from backend first
      const res = await fetch(`${API_URL}/api/astrology/profile/latest`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.name) {
          setUserProfile(data);
          setUserName(data.name);
          setBirthDateInput(data.birth_date);
          setBirthPlace(data.birth_place || '');
          const parts = data.birth_date.split('/');
          if (parts.length === 3) {
            setBirthDate(new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])));
          }
          return;
        }
      }
      // Fallback to local storage
      const saved = await AsyncStorage.getItem('birth_date');
      if (saved) {
        const date = new Date(saved);
        setBirthDate(date);
        setBirthDateInput(formatDateInput(date));
      }
    } catch (e) {
      console.log('Error loading profile:', e);
    }
  };

  const formatDateInput = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const parseDateInput = (input: string): Date | null => {
    const parts = input.split('/');
    if (parts.length !== 3) return null;
    const [day, month, year] = parts.map(Number);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) return null;
    return new Date(year, month - 1, day);
  };

  const saveBirthDate = async () => {
    if (!birthDateInput || !userName.trim()) return;
    
    setIsLoadingProfile(true);
    try {
      const res = await fetch(`${API_URL}/api/astrology/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userName.trim(),
          birth_date: birthDateInput,
          birth_place: birthPlace.trim() || 'Non précisé',
          birth_hour: birthHour.trim() || null,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data);
        setShowDateModal(false);
        
        // Also save locally
        const date = parseDateInput(birthDateInput);
        if (date) {
          setBirthDate(date);
          await AsyncStorage.setItem('birth_date', date.toISOString());
        }
      }
    } catch (e) {
      console.log('Error saving profile:', e);
      // Fallback to local calculation
      const date = parseDateInput(birthDateInput);
      if (date) {
        setBirthDate(date);
        setUserProfile(calculateLunarHouse(date));
        setShowDateModal(false);
        await AsyncStorage.setItem('birth_date', date.toISOString());
      }
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const getCurrentMoonPhase = () => calculateMoonPhase();
  const getCurrentMansion = () => getMansionForDate();

  const moonPhase = getCurrentMoonPhase();
  const currentMansion = getCurrentMansion();

  const getLunarReading = async () => {
    setIsLoadingReading(true);
    try {
      const res = await fetch(`${API_URL}/api/lunar-reading`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moon_phase: moonPhase.name,
          mansion: currentMansion.name,
          question: userQuestion || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setLunarReading(data.reading);
      }
    } catch (e) {
      setLunarReading("La lune murmure en silence ce soir. Écoute ton cœur, il connaît déjà les réponses.");
    } finally {
      setIsLoadingReading(false);
    }
  };

  // Dynamic styles
  const ds = {
    container: { backgroundColor: theme.background },
    card: { backgroundColor: theme.card },
    cardSelected: { backgroundColor: theme.cardSelected, borderColor: theme.border },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    textMuted: { color: theme.textMuted },
    input: { backgroundColor: theme.inputBackground, color: theme.text },
    tabActive: { backgroundColor: theme.text },
    tabTextActive: { color: theme.background },
    tabInactive: { backgroundColor: theme.card },
    tabTextInactive: { color: theme.textMuted },
  };

  // ==================== RENDER PROFILE TAB ====================
  const renderProfileTab = () => (
    <Animated.View entering={FadeIn.duration(300)}>
      {!userProfile ? (
        <View style={[styles.emptyProfile, ds.card]} data-testid="empty-profile">
          <Ionicons name="person-circle-outline" size={64} color={theme.accentWarm} />
          <Text style={[styles.emptyTitle, ds.text]}>Découvre ton profil astral</Text>
          <Text style={[styles.emptySubtitle, ds.textSecondary]}>
            Entre ton prénom, ta date et ton lieu de naissance pour révéler ton portrait astrologique unique.
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.accentWarm }]}
            onPress={() => setShowDateModal(true)}
            data-testid="open-profile-form-btn"
          >
            <Text style={styles.primaryButtonText}>Créer mon profil astral</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View data-testid="profile-results">
          {/* Profile header */}
          <TouchableOpacity style={[styles.dateCard, ds.card]} onPress={() => setShowDateModal(true)} data-testid="edit-profile-btn">
            <Ionicons name="person-outline" size={22} color={theme.accentWarm} />
            <View style={styles.dateInfo}>
              <Text style={[styles.dateLabel, ds.textMuted]}>{userProfile.name}</Text>
              <Text style={[styles.dateValue, ds.text]}>
                {userProfile.birth_date}{userProfile.birth_hour ? ` à ${userProfile.birth_hour}` : ''} - {userProfile.birth_place}
              </Text>
            </View>
            <Ionicons name="create-outline" size={20} color={theme.textMuted} />
          </TouchableOpacity>

          {/* Zodiac Sign */}
          {userProfile.zodiac_sign && (
            <Animated.View entering={FadeInUp.duration(400).delay(50)} style={[styles.profileCard, ds.card]}>
              <View style={[styles.profileIconContainer, { backgroundColor: `${theme.accentWarm}20` }]}>
                <Ionicons name="star" size={28} color={theme.accentWarm} />
              </View>
              <Text style={[styles.profileCardTitle, ds.text]}>Signe zodiacal</Text>
              <Text style={[styles.profileCardValue, ds.textSecondary]}>
                {userProfile.zodiac_sign.name}
              </Text>
              <Text style={[styles.profileCardTheme, { color: theme.accentWarm }]}>
                {userProfile.zodiac_sign.element} - Planète {userProfile.zodiac_sign.planet}
              </Text>
            </Animated.View>
          )}

          {/* Ascendant */}
          {userProfile.ascendant && (
            <Animated.View entering={FadeInUp.duration(400).delay(100)} style={[styles.profileCard, ds.card]}>
              <View style={[styles.profileIconContainer, { backgroundColor: `${theme.accent}20` }]}>
                <Ionicons name="arrow-up-circle-outline" size={28} color={theme.accent} />
              </View>
              <Text style={[styles.profileCardTitle, ds.text]}>Ascendant</Text>
              <Text style={[styles.profileCardValue, ds.textSecondary]}>
                {userProfile.ascendant.name}
              </Text>
              <Text style={[styles.profileCardTheme, { color: theme.accent }]}>
                {userProfile.ascendant.element}
              </Text>
            </Animated.View>
          )}

          {/* AI Interpretation */}
          {userProfile.ai_interpretation && (
            <Animated.View entering={FadeInUp.duration(400).delay(50)} style={[styles.profileCard, ds.card]}>
              <View style={[styles.profileIconContainer, { backgroundColor: `${theme.accentWarm}20` }]}>
                <Ionicons name="sparkles" size={28} color={theme.accentWarm} />
              </View>
              <Text style={[styles.profileCardTitle, ds.text]}>Ton portrait astral</Text>
              <Text style={[styles.profileCardDesc, ds.textSecondary]}>
                {userProfile.ai_interpretation}
              </Text>
            </Animated.View>
          )}

          {/* Moon phase at birth */}
          {userProfile.moon_phase_at_birth && (
            <Animated.View entering={FadeInUp.duration(400).delay(150)} style={[styles.profileCard, ds.card]}>
              <View style={[styles.profileIconContainer, { backgroundColor: `${theme.accentWarm}20` }]}>
                <Ionicons name="moon" size={28} color={theme.accentWarm} />
              </View>
              <Text style={[styles.profileCardTitle, ds.text]}>Phase lunaire de naissance</Text>
              <Text style={[styles.profileCardValue, ds.textSecondary]}>
                {userProfile.moon_phase_at_birth.name}
              </Text>
            </Animated.View>
          )}

          {/* Lunar House */}
          {userProfile.lunar_house && (
            <Animated.View entering={FadeInUp.duration(400).delay(250)} style={[styles.profileCard, ds.card]}>
              <View style={[styles.profileIconContainer, { backgroundColor: `${theme.accent}20` }]}>
                <Ionicons name="home-outline" size={28} color={theme.accent} />
              </View>
              <Text style={[styles.profileCardTitle, ds.text]}>Maison lunaire</Text>
              <Text style={[styles.profileCardValue, ds.textSecondary]}>
                {userProfile.lunar_house.name}
              </Text>
              <Text style={[styles.profileCardTheme, { color: theme.accent }]}>
                {userProfile.lunar_house.theme}
              </Text>
            </Animated.View>
          )}

          {/* Celtic Tree */}
          {userProfile.celtic_tree && (
            <Animated.View entering={FadeInUp.duration(400).delay(350)} style={[styles.profileCard, ds.card]}>
              <View style={[styles.profileIconContainer, { backgroundColor: `${theme.accent}20` }]}>
                <Ionicons name="leaf" size={28} color={theme.accent} />
              </View>
              <Text style={[styles.profileCardTitle, ds.text]}>Arbre celtique</Text>
              <Text style={[styles.profileCardValue, ds.textSecondary]}>
                {userProfile.celtic_tree.tree}
              </Text>
              <Text style={[styles.profileCardTheme, { color: theme.accent }]}>
                {userProfile.celtic_tree.meaning}
              </Text>
            </Animated.View>
          )}

          {/* Arabic Mansion */}
          {userProfile.arabic_mansion && (
            <Animated.View entering={FadeInUp.duration(400).delay(450)} style={[styles.profileCard, ds.card]}>
              <View style={[styles.profileIconContainer, { backgroundColor: `${theme.accentWarm}20` }]}>
                <Ionicons name="star" size={28} color={theme.accentWarm} />
              </View>
              <Text style={[styles.profileCardTitle, ds.text]}>Demeure lunaire arabe</Text>
              <Text style={[styles.profileCardValue, ds.textSecondary]}>
                {userProfile.arabic_mansion.name}
              </Text>
              <Text style={[styles.profileCardTheme, { color: theme.accentWarm }]}>
                Demeure n°{userProfile.arabic_mansion.number}
              </Text>
            </Animated.View>
          )}
        </View>
      )}
    </Animated.View>
  );

  // ==================== RENDER MOON TAB ====================
  const renderMoonTab = () => (
    <Animated.View entering={FadeIn.duration(300)}>
      <View style={[styles.moonCard, ds.card]}>
        <Ionicons name={moonPhase.icon as any} size={56} color={theme.accentWarm} />
        <Text style={[styles.moonName, ds.text]}>{moonPhase.name}</Text>
        <Text style={[styles.moonDay, ds.textMuted]}>Jour {moonPhase.dayInCycle} du cycle lunaire</Text>
        <Text style={[styles.moonEnergy, ds.textSecondary]}>{moonPhase.energy}</Text>
      </View>

      {/* AI Lunar Reading */}
      <View style={[styles.readingCard, ds.card]}>
        <Text style={[styles.readingTitle, ds.text]}>Que te dit la lune ?</Text>
        <TextInput
          style={[styles.questionInput, ds.input]}
          placeholder="Pose une question (optionnel)..."
          placeholderTextColor={theme.textMuted}
          value={userQuestion}
          onChangeText={setUserQuestion}
        />
        <TouchableOpacity
          style={[styles.readingButton, { backgroundColor: theme.accentWarm }]}
          onPress={getLunarReading}
          disabled={isLoadingReading}
        >
          {isLoadingReading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.readingButtonText}>Recevoir mon message</Text>
          )}
        </TouchableOpacity>
        {lunarReading && (
          <Animated.View entering={FadeInUp.duration(400)} style={[styles.readingResult, { borderTopColor: theme.border }]}>
            <Text style={[styles.readingText, ds.text]}>{lunarReading}</Text>
          </Animated.View>
        )}
      </View>

      <Text style={[styles.sectionTitle, ds.text]}>Les 8 phases</Text>
      <View style={styles.phasesList}>
        {MOON_PHASES.map((phase, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.phaseCard, ds.card, selectedItem?.name === phase.name && ds.cardSelected]}
            onPress={() => setSelectedItem(selectedItem?.name === phase.name ? null : phase)}
          >
            <Ionicons name={phase.icon as any} size={28} color={theme.accentWarm} style={{ marginRight: 14 }} />
            <View style={styles.phaseInfo}>
              <Text style={[styles.phaseName, ds.text]}>{phase.name}</Text>
              <Text style={[styles.phaseMeaning, ds.textMuted]}>{phase.meaning}</Text>
            </View>
            {selectedItem?.name === phase.name && (
              <Animated.View entering={FadeIn.duration(200)} style={[styles.expandedContent, { borderTopColor: theme.border }]}>
                <Text style={[styles.expandedText, ds.textSecondary]}>{phase.energy}</Text>
              </Animated.View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

  // ==================== RENDER CELTIC TAB ====================
  const renderCelticTab = () => (
    <Animated.View entering={FadeIn.duration(300)}>
      <Text style={[styles.introText, ds.textSecondary]}>
        L'astrologie celtique se base sur les 13 arbres sacrés du calendrier lunaire druidique. Chaque arbre possède une énergie unique qui influence ceux nés sous son règne.
      </Text>
      <View style={styles.treesList}>
        {CELTIC_TREES.map((tree) => (
          <TouchableOpacity
            key={tree.tree}
            style={[styles.treeCard, ds.card, selectedItem?.tree === tree.tree && ds.cardSelected]}
            onPress={() => setSelectedItem(selectedItem?.tree === tree.tree ? null : tree)}
          >
            <View style={styles.treeHeader}>
              <Text style={[styles.treeOgham, { color: theme.accent }]}>{tree.ogham}</Text>
              <View style={styles.treeBasic}>
                <Text style={[styles.treeName, ds.text]}>{tree.tree}</Text>
                <Text style={[styles.treeDates, ds.textMuted]}>{tree.dates}</Text>
              </View>
            </View>
            {selectedItem?.tree === tree.tree && (
              <Animated.View entering={FadeIn.duration(200)} style={[styles.expandedContent, { borderTopColor: theme.border }]}>
                <Text style={[styles.expandedTitle, ds.text]}>{tree.meaning}</Text>
                <Text style={[styles.expandedText, ds.textSecondary]}>{tree.personality}</Text>
                <View style={styles.qualitiesRow}>
                  {tree.qualities.map((q, i) => (
                    <View key={i} style={[styles.qualityChip, { backgroundColor: `${theme.accent}20` }]}>
                      <Text style={[styles.qualityText, { color: theme.accent }]}>{q}</Text>
                    </View>
                  ))}
                </View>
                <Text style={[styles.shadowText, { color: theme.accentWarm }]}>Ombre : {tree.shadow}</Text>
                <Text style={[styles.messageText, ds.textSecondary]}>"{tree.message}"</Text>
              </Animated.View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

  // ==================== RENDER ARABIC TAB ====================
  const renderArabicTab = () => (
    <Animated.View entering={FadeIn.duration(300)}>
      <View style={[styles.currentMansionCard, ds.card]}>
        <Text style={[styles.mansionArabicLarge, { color: theme.accentWarm }]}>{currentMansion.arabic}</Text>
        <Text style={[styles.mansionNameLarge, ds.text]}>{currentMansion.name}</Text>
        <Text style={[styles.mansionMeaningLarge, ds.textSecondary]}>{currentMansion.meaning}</Text>
        <View style={styles.mansionMeta}>
          <Text style={[styles.metaText, ds.textMuted]}>{currentMansion.element}</Text>
          <View style={[styles.metaDot, { backgroundColor: theme.textMuted }]} />
          <Text style={[styles.metaText, ds.textMuted]}>{currentMansion.planet}</Text>
        </View>
        <Text style={[styles.mansionNature, { color: theme.accent }]}>{currentMansion.nature}</Text>
      </View>

      <Text style={[styles.sectionTitle, ds.text]}>Les 28 Manzil</Text>
      <Text style={[styles.introText, ds.textSecondary]}>
        Les demeures lunaires arabes (Manzil) divisent le zodiaque en 28 stations que la Lune traverse durant son cycle. Chaque demeure possède une influence unique.
      </Text>
      
      <View style={styles.mansionsList}>
        {ARABIC_MANSIONS.map((mansion) => (
          <TouchableOpacity
            key={mansion.number}
            style={[styles.mansionCard, ds.card, selectedItem?.number === mansion.number && ds.cardSelected]}
            onPress={() => setSelectedItem(selectedItem?.number === mansion.number ? null : mansion)}
          >
            <View style={styles.mansionHeader}>
              <Text style={[styles.mansionNumber, ds.textMuted]}>{mansion.number}</Text>
              <Text style={[styles.mansionArabic, { color: theme.accentWarm }]}>{mansion.arabic}</Text>
              <View style={styles.mansionBasic}>
                <Text style={[styles.mansionName, ds.text]}>{mansion.name}</Text>
                <Text style={[styles.mansionMeaning, ds.textMuted]}>{mansion.meaning}</Text>
              </View>
            </View>
            {selectedItem?.number === mansion.number && (
              <Animated.View entering={FadeIn.duration(200)} style={[styles.expandedContent, { borderTopColor: theme.border }]}>
                <View style={styles.mansionMeta}>
                  <Text style={[styles.metaText, ds.textMuted]}>{mansion.element}</Text>
                  <View style={[styles.metaDot, { backgroundColor: theme.textMuted }]} />
                  <Text style={[styles.metaText, ds.textMuted]}>{mansion.planet}</Text>
                </View>
                <Text style={[styles.expandedText, ds.textSecondary]}>{mansion.description}</Text>
                <Text style={[styles.natureText, { color: theme.accent }]}>{mansion.nature}</Text>
              </Animated.View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

  // ==================== RENDER HOUSES TAB ====================
  const renderHousesTab = () => (
    <Animated.View entering={FadeIn.duration(300)}>
      <Text style={[styles.introText, ds.textSecondary]}>
        Les 12 maisons astrologiques représentent les différents domaines de la vie. Chaque maison colore l'expression des planètes qui s'y trouvent.
      </Text>
      <View style={styles.housesList}>
        {WESTERN_HOUSES.map((house) => (
          <TouchableOpacity
            key={house.number}
            style={[styles.houseCard, ds.card, selectedItem?.number === house.number && ds.cardSelected]}
            onPress={() => setSelectedItem(selectedItem?.number === house.number ? null : house)}
          >
            <View style={styles.houseHeader}>
              <View style={[styles.houseNumber, { backgroundColor: theme.background }]}>
                <Text style={[styles.houseNumberText, ds.text]}>{house.number}</Text>
              </View>
              <View style={styles.houseBasic}>
                <Text style={[styles.houseName, ds.text]}>{house.name}</Text>
                <Text style={[styles.houseTheme, ds.textMuted]}>{house.theme}</Text>
              </View>
            </View>
            {selectedItem?.number === house.number && (
              <Animated.View entering={FadeIn.duration(200)} style={[styles.expandedContent, { borderTopColor: theme.border }]}>
                <Text style={[styles.rulerText, { color: theme.accentWarm }]}>Maître : {house.ruler}</Text>
                <Text style={[styles.expandedText, ds.textSecondary]}>{house.description}</Text>
                <View style={styles.governsSection}>
                  <Text style={[styles.governsTitle, ds.textMuted]}>Cette maison gouverne :</Text>
                  <View style={styles.governsList}>
                    {house.governs.map((g, i) => (
                      <View key={i} style={[styles.governsChip, { backgroundColor: theme.background }]}>
                        <Text style={[styles.governsText, ds.textSecondary]}>{g}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </Animated.View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={[styles.container, ds.container]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Ionicons name="chevron-down" size={28} color={theme.iconColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, ds.text]}>Cosmos</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabs}
      >
        {['profile', 'lune', 'celtique', 'arabe', 'maisons'].map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t ? ds.tabActive : ds.tabInactive]}
            onPress={() => { setTab(t); setSelectedItem(null); }}
            data-testid={`tab-${t}`}
          >
            <Text style={[styles.tabText, tab === t ? ds.tabTextActive : ds.tabTextInactive]}>
              {t === 'profile' ? 'Profil' : t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {tab === 'profile' && renderProfileTab()}
        {tab === 'lune' && renderMoonTab()}
        {tab === 'celtique' && renderCelticTab()}
        {tab === 'arabe' && renderArabicTab()}
        {tab === 'maisons' && renderHousesTab()}
      </ScrollView>

      {/* Profile Input Modal - ENHANCED */}
      <Modal
        visible={showDateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDateModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, ds.container]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, ds.text]}>Ton profil astral</Text>
            <TouchableOpacity onPress={() => setShowDateModal(false)} data-testid="close-profile-modal">
              <Ionicons name="close" size={28} color={theme.iconColor} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} contentContainerStyle={{ padding: 24 }}>
            <View style={styles.modalIntroContainer}>
              <View style={[styles.modalIntroIcon, { backgroundColor: `${theme.accentWarm}15` }]}>
                <Ionicons name="sparkles" size={32} color={theme.accentWarm} />
              </View>
              <Text style={[styles.modalIntro, ds.textSecondary]}>
                Les étoiles attendent de te révéler tes secrets...
              </Text>
            </View>
            
            {/* Name */}
            <Text style={[styles.inputLabel, ds.textMuted]}>Ton prénom</Text>
            <TextInput
              style={[styles.dateInput, ds.input, { borderColor: theme.border }]}
              placeholder="Comment t'appelles-tu ?"
              placeholderTextColor={theme.textMuted}
              value={userName}
              onChangeText={setUserName}
              autoCapitalize="words"
              data-testid="profile-name-input"
            />

            {/* Birth Date with Day/Month/Year pickers */}
            <Text style={[styles.inputLabel, ds.textMuted]}>Date de naissance</Text>
            <View style={styles.datePickerRow}>
              <View style={styles.datePickerItem}>
                <Text style={[styles.datePickerLabel, ds.textMuted]}>Jour</Text>
                <ScrollView style={[styles.pickerScroll, ds.card]} showsVerticalScrollIndicator={false}>
                  {Array.from({length: 31}, (_, i) => i + 1).map(d => (
                    <TouchableOpacity
                      key={d}
                      style={[
                        styles.pickerOption,
                        selectedDay === d && { backgroundColor: theme.accentWarm }
                      ]}
                      onPress={() => {
                        setSelectedDay(d);
                        updateBirthDate(d, selectedMonth, selectedYear);
                      }}
                    >
                      <Text style={[styles.pickerText, selectedDay === d && { color: '#fff' }]}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.datePickerItem}>
                <Text style={[styles.datePickerLabel, ds.textMuted]}>Mois</Text>
                <ScrollView style={[styles.pickerScroll, ds.card]} showsVerticalScrollIndicator={false}>
                  {['Jan', 'Fév', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'].map((m, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.pickerOption,
                        selectedMonth === (i + 1) && { backgroundColor: theme.accentWarm }
                      ]}
                      onPress={() => {
                        setSelectedMonth(i + 1);
                        updateBirthDate(selectedDay, i + 1, selectedYear);
                      }}
                    >
                      <Text style={[styles.pickerText, selectedMonth === (i + 1) && { color: '#fff' }]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.datePickerItem}>
                <Text style={[styles.datePickerLabel, ds.textMuted]}>Année</Text>
                <ScrollView style={[styles.pickerScroll, ds.card]} showsVerticalScrollIndicator={false}>
                  {Array.from({length: 100}, (_, i) => 2010 - i).map(y => (
                    <TouchableOpacity
                      key={y}
                      style={[
                        styles.pickerOption,
                        selectedYear === y && { backgroundColor: theme.accentWarm }
                      ]}
                      onPress={() => {
                        setSelectedYear(y);
                        updateBirthDate(selectedDay, selectedMonth, y);
                      }}
                    >
                      <Text style={[styles.pickerText, selectedYear === y && { color: '#fff' }]}>{y}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Birth Place with search */}
            <Text style={[styles.inputLabel, ds.textMuted]}>Lieu de naissance</Text>
            <TextInput
              style={[styles.dateInput, ds.input, { borderColor: theme.border }]}
              placeholder="Tape le nom de ta ville..."
              placeholderTextColor={theme.textMuted}
              value={birthPlace}
              onChangeText={(text) => {
                setBirthPlace(text);
                searchCities(text);
              }}
              data-testid="profile-birthplace-input"
            />
            {cityResults.length > 0 && (
              <View style={[styles.citySuggestions, ds.card]}>
                {cityResults.map((city, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.citySuggestion, { borderBottomColor: theme.border }]}
                    onPress={() => {
                      setBirthPlace(`${city.city}, ${city.country}`);
                      setCityResults([]);
                    }}
                  >
                    <Ionicons name="location-outline" size={16} color={theme.accentWarm} />
                    <Text style={[styles.cityText, ds.text]}>{city.city}, {city.country}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Birth Hour */}
            <Text style={[styles.inputLabel, ds.textMuted]}>Heure de naissance (pour l'ascendant)</Text>
            <View style={styles.hourPickerContainer}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hourPicker}
              >
                {['Inconnue', '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'].map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[
                      styles.hourChip,
                      { borderColor: theme.border },
                      birthHour === (h === 'Inconnue' ? '' : h) && { backgroundColor: theme.accentWarm, borderColor: theme.accentWarm }
                    ]}
                    onPress={() => setBirthHour(h === 'Inconnue' ? '' : h)}
                  >
                    <Text style={[
                      styles.hourChipText,
                      ds.textMuted,
                      birthHour === (h === 'Inconnue' ? '' : h) && { color: '#fff' }
                    ]}>{h}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.accentWarm }, isLoadingProfile && { opacity: 0.6 }]}
              onPress={saveBirthDate}
              disabled={isLoadingProfile || !userName.trim() || !birthDateInput}
              data-testid="save-profile-btn"
            >
              {isLoadingProfile ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={[styles.saveButtonText, { marginLeft: 10 }]}>Les astres calculent...</Text>
                </View>
              ) : (
                <View style={styles.loadingRow}>
                  <Ionicons name="sparkles" size={20} color="#fff" />
                  <Text style={[styles.saveButtonText, { marginLeft: 10 }]}>Révéler mon portrait astral</Text>
                </View>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '500' },
  placeholder: { width: 36 },
  tabsScroll: { maxHeight: 50 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 6, paddingVertical: 4 },
  tab: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20 },
  tabText: { fontSize: 12, fontWeight: '500' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  // Empty Profile
  emptyProfile: { borderRadius: 20, padding: 32, alignItems: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '300', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  primaryButton: { paddingVertical: 14, paddingHorizontal: 28, borderRadius: 24 },
  primaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  
  // Date Card
  dateCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, marginBottom: 16 },
  dateInfo: { flex: 1, marginLeft: 12 },
  dateLabel: { fontSize: 11, marginBottom: 2 },
  dateValue: { fontSize: 15, fontWeight: '500' },
  
  // Profile Cards
  profileCard: { borderRadius: 16, padding: 24, marginBottom: 16, alignItems: 'center' },
  profileIconContainer: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  profileOgham: { fontSize: 32 },
  profileCardTitle: { fontSize: 12, fontWeight: '500', marginBottom: 4, letterSpacing: 1, textTransform: 'uppercase' },
  profileCardValue: { fontSize: 20, fontWeight: '300', marginBottom: 4 },
  profileCardTheme: { fontSize: 14, fontWeight: '500', marginBottom: 12 },
  profileCardDesc: { fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  profileChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 16 },
  profileChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  profileChipText: { fontSize: 11, fontWeight: '500' },
  shadowSection: { width: '100%', paddingTop: 16, marginTop: 8, marginBottom: 16, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'center' },
  shadowLabel: { fontSize: 12 },
  shadowText: { fontSize: 12, marginLeft: 4 },
  mansionArabicProfile: { fontSize: 40, marginBottom: 12 },
  
  // Moon Tab
  moonCard: { borderRadius: 20, padding: 28, alignItems: 'center', marginBottom: 20 },
  moonName: { fontSize: 22, fontWeight: '200', letterSpacing: 1, marginTop: 12, marginBottom: 4 },
  moonDay: { fontSize: 12, marginBottom: 16 },
  moonEnergy: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  
  // Reading
  readingCard: { borderRadius: 16, padding: 20, marginBottom: 24 },
  readingTitle: { fontSize: 16, fontWeight: '500', marginBottom: 12 },
  questionInput: { borderRadius: 12, padding: 14, fontSize: 14, marginBottom: 12 },
  readingButton: { paddingVertical: 14, borderRadius: 24, alignItems: 'center' },
  readingButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  readingResult: { marginTop: 16, paddingTop: 16, borderTopWidth: 1 },
  readingText: { fontSize: 15, lineHeight: 24, fontStyle: 'italic' },
  
  // Sections
  sectionTitle: { fontSize: 14, fontWeight: '500', marginBottom: 12 },
  introText: { fontSize: 13, marginBottom: 20, lineHeight: 20 },
  
  // Phases
  phasesList: { gap: 8 },
  phaseCard: { borderRadius: 14, padding: 16, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  phaseInfo: { flex: 1 },
  phaseName: { fontSize: 14, fontWeight: '500' },
  phaseMeaning: { fontSize: 12 },
  
  // Expanded
  expandedContent: { width: '100%', marginTop: 14, paddingTop: 14, borderTopWidth: 1 },
  expandedTitle: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  expandedText: { fontSize: 13, lineHeight: 20 },
  
  // Celtic
  treesList: { gap: 10 },
  treeCard: { borderRadius: 14, padding: 16 },
  treeHeader: { flexDirection: 'row', alignItems: 'center' },
  treeOgham: { fontSize: 26, width: 40 },
  treeBasic: { flex: 1 },
  treeName: { fontSize: 15, fontWeight: '500' },
  treeDates: { fontSize: 12 },
  qualitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12, marginBottom: 12 },
  qualityChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  qualityText: { fontSize: 11 },
  messageText: { fontSize: 13, fontStyle: 'italic', lineHeight: 20, marginTop: 8 },
  
  // Arabic
  currentMansionCard: { borderRadius: 20, padding: 28, alignItems: 'center', marginBottom: 24 },
  mansionArabicLarge: { fontSize: 40, marginBottom: 8 },
  mansionNameLarge: { fontSize: 20, fontWeight: '200', marginBottom: 4 },
  mansionMeaningLarge: { fontSize: 14, marginBottom: 12 },
  mansionMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  metaText: { fontSize: 12 },
  metaDot: { width: 4, height: 4, borderRadius: 2 },
  mansionNature: { fontSize: 13, fontStyle: 'italic', textAlign: 'center' },
  mansionsList: { gap: 8 },
  mansionCard: { borderRadius: 14, padding: 14 },
  mansionHeader: { flexDirection: 'row', alignItems: 'center' },
  mansionNumber: { fontSize: 12, fontWeight: '600', width: 24 },
  mansionArabic: { fontSize: 18, width: 56 },
  mansionBasic: { flex: 1 },
  mansionName: { fontSize: 13, fontWeight: '500' },
  mansionMeaning: { fontSize: 11 },
  natureText: { fontSize: 12, fontStyle: 'italic', marginTop: 8 },
  
  // Houses
  housesList: { gap: 10 },
  houseCard: { borderRadius: 14, padding: 16 },
  houseHeader: { flexDirection: 'row', alignItems: 'center' },
  houseNumber: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  houseNumberText: { fontSize: 14, fontWeight: '600' },
  houseBasic: { flex: 1, marginLeft: 12 },
  houseName: { fontSize: 15, fontWeight: '500' },
  houseTheme: { fontSize: 12 },
  rulerText: { fontSize: 12, marginBottom: 8 },
  governsSection: { marginTop: 12 },
  governsTitle: { fontSize: 12, marginBottom: 8 },
  governsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  governsChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  governsText: { fontSize: 11 },
  
  // Modal
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '500' },
  modalContent: { flex: 1 },
  modalIntroContainer: { alignItems: 'center', marginBottom: 24 },
  modalIntroIcon: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  modalIntro: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  inputLabel: { fontSize: 11, alignSelf: 'flex-start', marginBottom: 8, marginLeft: 4, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '600' },
  dateInput: { width: '100%', borderRadius: 14, padding: 16, fontSize: 16, borderWidth: 1, marginBottom: 20 },
  
  // Date Picker
  datePickerRow: { flexDirection: 'row', gap: 8, marginBottom: 20, width: '100%' },
  datePickerItem: { flex: 1 },
  datePickerLabel: { fontSize: 10, textAlign: 'center', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  pickerScroll: { height: 150, borderRadius: 12, paddingVertical: 4 },
  pickerOption: { paddingVertical: 10, paddingHorizontal: 8, marginHorizontal: 4, marginVertical: 2, borderRadius: 8, alignItems: 'center' },
  pickerText: { fontSize: 14, fontWeight: '500' },
  
  // City suggestions
  citySuggestions: { borderRadius: 12, marginTop: -16, marginBottom: 20, overflow: 'hidden' },
  citySuggestion: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, gap: 10 },
  cityText: { fontSize: 14 },
  
  // Hour picker
  hourPickerContainer: { marginBottom: 24, width: '100%' },
  hourPicker: { gap: 8, paddingVertical: 4 },
  hourChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  hourChipText: { fontSize: 13, fontWeight: '500' },
  
  // Save button
  saveButton: { paddingVertical: 16, paddingHorizontal: 32, borderRadius: 28, marginTop: 8, width: '100%' },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
