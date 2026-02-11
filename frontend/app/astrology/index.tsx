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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp, FadeInDown } from 'react-native-reanimated';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

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
  { tree: "Bouleau", dates: "24 déc - 20 jan", ogham: "ᚁ", meaning: "Renouveau et purification", personality: "Leader naturel, ambitieux et déterminé", element: "Air", qualities: ["Initiative", "Purification", "Nouveaux départs"], shadow: "Impatience, perfectionnisme", message: "Tu es le pionnier qui ouvre la voie. Ta capacité à voir les possibilités là où d'autres voient des obstacles est ton plus grand don." },
  { tree: "Sorbier", dates: "21 jan - 17 fév", ogham: "ᚂ", meaning: "Vision et protection", personality: "Visionnaire intuitif et penseur profond", element: "Feu", qualities: ["Intuition", "Protection", "Vision"], shadow: "Isolement, hypersensibilité", message: "Tu vois au-delà du voile. Ta connexion avec l'invisible te guide vers ta vérité." },
  { tree: "Frêne", dates: "18 fév - 17 mars", ogham: "ᚅ", meaning: "Connexion entre les mondes", personality: "Artistique, rêveur et connecté", element: "Eau", qualities: ["Imagination", "Connexion", "Sagesse"], shadow: "Fuite de la réalité", message: "Tu es le pont entre les mondes. Ta sensibilité est ta force, pas ta faiblesse." },
  { tree: "Aulne", dates: "18 mars - 14 avril", ogham: "ᚃ", meaning: "Courage et passion", personality: "Courageux, passionné et charismatique", element: "Feu", qualities: ["Courage", "Passion", "Leadership"], shadow: "Impulsivité, colère", message: "Ta flamme intérieure éclaire le chemin des autres. Canalise cette énergie vers ce qui compte vraiment." },
  { tree: "Saule", dates: "15 avril - 12 mai", ogham: "ᚄ", meaning: "Cycles lunaires et émotions", personality: "Sensible, patient et résilient", element: "Eau", qualities: ["Intuition lunaire", "Résilience", "Patience"], shadow: "Mélancolie, dépendance", message: "Comme le saule, tu plies mais ne romps jamais. Ta connexion à la lune te guide à travers les marées de la vie." },
  { tree: "Aubépine", dates: "13 mai - 9 juin", ogham: "ᚆ", meaning: "Dualité et transformation", personality: "Curieux, adaptable et créatif", element: "Air", qualities: ["Adaptabilité", "Curiosité", "Communication"], shadow: "Inconstance, superficialité", message: "Tu embrasses les paradoxes de la vie. Ta capacité à voir les deux côtés est un don précieux." },
  { tree: "Chêne", dates: "10 juin - 7 juil", ogham: "ᚇ", meaning: "Force et sagesse", personality: "Protecteur, généreux et sage", element: "Terre", qualities: ["Force", "Générosité", "Sagesse"], shadow: "Rigidité, orgueil", message: "Tu es le pilier sur lequel les autres s'appuient. Ta force vient de tes racines profondes." },
  { tree: "Houx", dates: "8 juil - 4 août", ogham: "ᚈ", meaning: "Royauté et persévérance", personality: "Noble, ambitieux et compétitif", element: "Feu", qualities: ["Persévérance", "Noblesse", "Ambition"], shadow: "Ego, compétitivité excessive", message: "Tu portes la couronne de celui qui ne renonce jamais. Ta détermination inspire les autres." },
  { tree: "Noisetier", dates: "5 août - 1 sept", ogham: "ᚉ", meaning: "Sagesse et inspiration", personality: "Intelligent, analytique et inspiré", element: "Air", qualities: ["Intelligence", "Analyse", "Inspiration"], shadow: "Suranalyse, froideur", message: "Tu es le gardien de la connaissance sacrée. Partage ta sagesse avec ceux qui cherchent." },
  { tree: "Vigne", dates: "2 sept - 29 sept", ogham: "ᚊ", meaning: "Raffinement et harmonie", personality: "Raffiné, charmant et équilibré", element: "Eau", qualities: ["Charme", "Équilibre", "Sens esthétique"], shadow: "Indécision, dépendance", message: "Tu recherches la beauté en toute chose. Ton sens de l'harmonie crée des ponts entre les gens." },
  { tree: "Lierre", dates: "30 sept - 27 oct", ogham: "ᚌ", meaning: "Transformation et survie", personality: "Loyal, spirituel et résilient", element: "Eau", qualities: ["Résilience", "Loyauté", "Spiritualité"], shadow: "Possessivité, jalousie", message: "Tu traverses les épreuves avec une force intérieure remarquable. Ta loyauté est légendaire." },
  { tree: "Roseau", dates: "28 oct - 24 nov", ogham: "ᚍ", meaning: "Secret et vérité", personality: "Mystérieux, courageux et perspicace", element: "Eau", qualities: ["Perspicacité", "Courage", "Mystère"], shadow: "Paranoïa, vengeance", message: "Tu perces les mystères que d'autres ignorent. Ta profondeur est ton trésor." },
  { tree: "Sureau", dates: "25 nov - 23 déc", ogham: "ᚏ", meaning: "Fin et renaissance", personality: "Libre, philosophe et transformateur", element: "Feu", qualities: ["Liberté", "Sagesse", "Transformation"], shadow: "Excentricité, impatience", message: "Tu marques la fin d'un cycle et le début d'un autre. Ta sagesse vient de nombreuses vies." },
];

const WESTERN_HOUSES = [
  { number: 1, name: "Ascendant", theme: "Le Moi", ruler: "Mars", description: "La Maison I représente ta personnalité extérieure, ton apparence physique et la première impression que tu donnes aux autres. C'est le masque que tu portes face au monde, ta façon naturelle d'aborder la vie.", governs: ["Apparence physique", "Personnalité visible", "Première impression", "Vitalité", "Nouvelle identité"] },
  { number: 2, name: "Possessions", theme: "Les Ressources", ruler: "Vénus", description: "La Maison II gouverne tes valeurs matérielles et spirituelles, tes finances, et ce que tu possèdes. Elle révèle ton rapport à l'argent, à la sécurité et à l'estime de soi.", governs: ["Finances", "Possessions", "Valeurs personnelles", "Estime de soi", "Talents naturels"] },
  { number: 3, name: "Communication", theme: "L'Expression", ruler: "Mercure", description: "La Maison III représente la communication, l'apprentissage, les frères et sœurs et l'environnement proche. Elle montre comment tu penses, communiques et interagis au quotidien.", governs: ["Communication", "Pensée", "Frères et sœurs", "Voyages courts", "Éducation primaire"] },
  { number: 4, name: "Foyer", theme: "Les Racines", ruler: "Lune", description: "La Maison IV est le fondement de ton être. Elle représente la famille, le foyer, les racines ancestrales et la vie privée. C'est ton sanctuaire intérieur.", governs: ["Famille", "Maison", "Racines", "Mère", "Fin de vie"] },
  { number: 5, name: "Créativité", theme: "La Joie", ruler: "Soleil", description: "La Maison V est celle de la création, du plaisir et de l'expression personnelle. Elle gouverne les enfants, les romances, les loisirs et tout ce qui te procure de la joie.", governs: ["Créativité", "Enfants", "Romance", "Loisirs", "Expression artistique"] },
  { number: 6, name: "Service", theme: "La Santé", ruler: "Mercure", description: "La Maison VI concerne le travail quotidien, la santé et les routines. Elle révèle ton approche du service aux autres et de ton bien-être physique.", governs: ["Santé", "Travail quotidien", "Routines", "Animaux domestiques", "Service"] },
  { number: 7, name: "Partenariats", theme: "Les Relations", ruler: "Vénus", description: "La Maison VII représente les associations, le mariage et les contrats. C'est le miroir de ta Maison I - comment tu te relies aux autres en relation intime.", governs: ["Mariage", "Partenariats", "Contrats", "Ennemis déclarés", "Relations publiques"] },
  { number: 8, name: "Transformation", theme: "La Renaissance", ruler: "Pluton", description: "La Maison VIII gouverne la mort symbolique, la renaissance, la sexualité et les ressources partagées. C'est le domaine des transformations profondes.", governs: ["Transformation", "Mort et renaissance", "Sexualité", "Héritage", "Mystères occultes"] },
  { number: 9, name: "Philosophie", theme: "L'Expansion", ruler: "Jupiter", description: "La Maison IX représente l'expansion de l'esprit : voyages lointains, études supérieures, philosophie et quête de sens. C'est ta vision du monde.", governs: ["Voyages lointains", "Philosophie", "Religion", "Études supérieures", "Publications"] },
  { number: 10, name: "Carrière", theme: "La Destinée", ruler: "Saturne", description: "La Maison X est le zénith de ton thème. Elle représente ta carrière, ta réputation, ton statut social et tes ambitions. C'est ta place dans le monde.", governs: ["Carrière", "Réputation", "Statut social", "Père", "Autorité"] },
  { number: 11, name: "Espoirs", theme: "Les Aspirations", ruler: "Uranus", description: "La Maison XI gouverne les amitiés, les groupes et les idéaux. Elle révèle tes espoirs pour le futur et ta place dans la communauté.", governs: ["Amis", "Groupes", "Espoirs", "Idéaux humanitaires", "Gains"] },
  { number: 12, name: "Inconscient", theme: "Le Caché", ruler: "Neptune", description: "La Maison XII est le royaume du caché, de l'inconscient et de la spiritualité profonde. Elle gouverne le karma, les secrets et la transcendance.", governs: ["Inconscient", "Secrets", "Karma", "Isolement", "Spiritualité profonde"] },
];

const MOON_PHASES = [
  { name: "Nouvelle Lune", emoji: "🌑", meaning: "Nouveaux départs", energy: "C'est le moment de planter des graines d'intention. L'énergie est tournée vers l'intérieur, propice à l'introspection et aux nouveaux commencements." },
  { name: "Premier Croissant", emoji: "🌒", meaning: "Croissance", energy: "L'énergie commence à se manifester. C'est le moment d'affirmer tes intentions et de faire les premiers pas vers tes objectifs." },
  { name: "Premier Quartier", emoji: "🌓", meaning: "Action", energy: "Moment de prise de décision et d'action. Les défis peuvent apparaître - ils sont là pour t'aider à clarifier ta direction." },
  { name: "Gibbeuse Croissante", emoji: "🌔", meaning: "Perfectionnement", energy: "L'énergie monte vers son apogée. C'est le moment de raffiner tes efforts et de préparer l'accomplissement." },
  { name: "Pleine Lune", emoji: "🌕", meaning: "Accomplissement", energy: "Moment de culmination et de révélation. Les émotions sont amplifiées. C'est le temps de la gratitude et de la célébration." },
  { name: "Gibbeuse Décroissante", emoji: "🌖", meaning: "Gratitude", energy: "L'énergie commence à se tourner vers le partage. C'est le moment de transmettre ce que tu as appris et reçu." },
  { name: "Dernier Quartier", emoji: "🌗", meaning: "Lâcher-prise", energy: "Moment de libération et de pardon. C'est le temps de laisser partir ce qui ne te sert plus." },
  { name: "Dernier Croissant", emoji: "🌘", meaning: "Repos", energy: "L'énergie se retire pour la régénération. C'est le moment de la réflexion profonde et de la préparation au nouveau cycle." },
];

export default function AstrologyScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<string>('lune');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [lunarReading, setLunarReading] = useState<string>('');
  const [isLoadingReading, setIsLoadingReading] = useState(false);
  const [userQuestion, setUserQuestion] = useState('');

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
    const dayInCycle = Math.floor(phase * 28) + 1;
    return { ...MOON_PHASES[index], dayInCycle, phaseIndex: index };
  };

  const getCurrentMansion = () => {
    const phase = getCurrentMoonPhase();
    return ARABIC_MANSIONS[(phase.dayInCycle - 1) % 28];
  };

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

  const renderMoonTab = () => (
    <Animated.View entering={FadeIn.duration(300)}>
      <View style={styles.moonCard}>
        <Text style={styles.moonEmoji}>{moonPhase.emoji}</Text>
        <Text style={styles.moonName}>{moonPhase.name}</Text>
        <Text style={styles.moonDay}>Jour {moonPhase.dayInCycle} du cycle lunaire</Text>
        <Text style={styles.moonEnergy}>{moonPhase.energy}</Text>
      </View>

      {/* AI Lunar Reading */}
      <View style={styles.readingCard}>
        <Text style={styles.readingTitle}>Que te dit la lune ?</Text>
        <TextInput
          style={styles.questionInput}
          placeholder="Pose une question (optionnel)..."
          placeholderTextColor="#B0B0A0"
          value={userQuestion}
          onChangeText={setUserQuestion}
        />
        <TouchableOpacity
          style={styles.readingButton}
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
          <Animated.View entering={FadeInUp.duration(400)} style={styles.readingResult}>
            <Text style={styles.readingText}>{lunarReading}</Text>
          </Animated.View>
        )}
      </View>

      <Text style={styles.sectionTitle}>Les 8 phases</Text>
      <View style={styles.phasesList}>
        {MOON_PHASES.map((phase, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.phaseCard, selectedItem?.name === phase.name && styles.cardSelected]}
            onPress={() => setSelectedItem(selectedItem?.name === phase.name ? null : phase)}
          >
            <Text style={styles.phaseEmoji}>{phase.emoji}</Text>
            <View style={styles.phaseInfo}>
              <Text style={styles.phaseName}>{phase.name}</Text>
              <Text style={styles.phaseMeaning}>{phase.meaning}</Text>
            </View>
            {selectedItem?.name === phase.name && (
              <Animated.View entering={FadeIn.duration(200)} style={styles.expandedContent}>
                <Text style={styles.expandedText}>{phase.energy}</Text>
              </Animated.View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

  const renderCelticTab = () => (
    <Animated.View entering={FadeIn.duration(300)}>
      <Text style={styles.introText}>
        L'astrologie celtique se base sur les 13 arbres sacrés du calendrier lunaire druidique. Chaque arbre possède une énergie unique qui influence ceux nés sous son règne.
      </Text>
      <View style={styles.treesList}>
        {CELTIC_TREES.map((tree) => (
          <TouchableOpacity
            key={tree.tree}
            style={[styles.treeCard, selectedItem?.tree === tree.tree && styles.cardSelected]}
            onPress={() => setSelectedItem(selectedItem?.tree === tree.tree ? null : tree)}
          >
            <View style={styles.treeHeader}>
              <Text style={styles.treeOgham}>{tree.ogham}</Text>
              <View style={styles.treeBasic}>
                <Text style={styles.treeName}>{tree.tree}</Text>
                <Text style={styles.treeDates}>{tree.dates}</Text>
              </View>
            </View>
            {selectedItem?.tree === tree.tree && (
              <Animated.View entering={FadeIn.duration(200)} style={styles.expandedContent}>
                <Text style={styles.expandedTitle}>{tree.meaning}</Text>
                <Text style={styles.expandedText}>{tree.personality}</Text>
                <View style={styles.qualitiesRow}>
                  {tree.qualities.map((q, i) => (
                    <View key={i} style={styles.qualityChip}>
                      <Text style={styles.qualityText}>{q}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.shadowText}>Ombre : {tree.shadow}</Text>
                <Text style={styles.messageText}>"{tree.message}"</Text>
              </Animated.View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

  const renderArabicTab = () => (
    <Animated.View entering={FadeIn.duration(300)}>
      <View style={styles.currentMansionCard}>
        <Text style={styles.mansionArabicLarge}>{currentMansion.arabic}</Text>
        <Text style={styles.mansionNameLarge}>{currentMansion.name}</Text>
        <Text style={styles.mansionMeaningLarge}>{currentMansion.meaning}</Text>
        <View style={styles.mansionMeta}>
          <Text style={styles.metaText}>{currentMansion.element}</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>{currentMansion.planet}</Text>
        </View>
        <Text style={styles.mansionNature}>{currentMansion.nature}</Text>
      </View>

      <Text style={styles.sectionTitle}>Les 28 Manzil</Text>
      <Text style={styles.introText}>
        Les demeures lunaires arabes (Manzil) divisent le zodiaque en 28 stations que la Lune traverse durant son cycle. Chaque demeure possède une influence unique.
      </Text>
      
      <View style={styles.mansionsList}>
        {ARABIC_MANSIONS.map((mansion) => (
          <TouchableOpacity
            key={mansion.number}
            style={[styles.mansionCard, selectedItem?.number === mansion.number && styles.cardSelected]}
            onPress={() => setSelectedItem(selectedItem?.number === mansion.number ? null : mansion)}
          >
            <View style={styles.mansionHeader}>
              <Text style={styles.mansionNumber}>{mansion.number}</Text>
              <Text style={styles.mansionArabic}>{mansion.arabic}</Text>
              <View style={styles.mansionBasic}>
                <Text style={styles.mansionName}>{mansion.name}</Text>
                <Text style={styles.mansionMeaning}>{mansion.meaning}</Text>
              </View>
            </View>
            {selectedItem?.number === mansion.number && (
              <Animated.View entering={FadeIn.duration(200)} style={styles.expandedContent}>
                <View style={styles.mansionMeta}>
                  <Text style={styles.metaText}>{mansion.element}</Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.metaText}>{mansion.planet}</Text>
                </View>
                <Text style={styles.expandedText}>{mansion.description}</Text>
                <Text style={styles.natureText}>{mansion.nature}</Text>
              </Animated.View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

  const renderHousesTab = () => (
    <Animated.View entering={FadeIn.duration(300)}>
      <Text style={styles.introText}>
        Les 12 maisons astrologiques représentent les différents domaines de la vie. Chaque maison colore l'expression des planètes qui s'y trouvent.
      </Text>
      <View style={styles.housesList}>
        {WESTERN_HOUSES.map((house) => (
          <TouchableOpacity
            key={house.number}
            style={[styles.houseCard, selectedItem?.number === house.number && styles.cardSelected]}
            onPress={() => setSelectedItem(selectedItem?.number === house.number ? null : house)}
          >
            <View style={styles.houseHeader}>
              <View style={styles.houseNumber}>
                <Text style={styles.houseNumberText}>{house.number}</Text>
              </View>
              <View style={styles.houseBasic}>
                <Text style={styles.houseName}>{house.name}</Text>
                <Text style={styles.houseTheme}>{house.theme}</Text>
              </View>
            </View>
            {selectedItem?.number === house.number && (
              <Animated.View entering={FadeIn.duration(200)} style={styles.expandedContent}>
                <Text style={styles.rulerText}>Maître : {house.ruler}</Text>
                <Text style={styles.expandedText}>{house.description}</Text>
                <View style={styles.governsSection}>
                  <Text style={styles.governsTitle}>Cette maison gouverne :</Text>
                  <View style={styles.governsList}>
                    {house.governs.map((g, i) => (
                      <View key={i} style={styles.governsChip}>
                        <Text style={styles.governsText}>{g}</Text>
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Ionicons name="chevron-down" size={28} color="#6B6B5B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Astres</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.tabs}>
        {['lune', 'celtique', 'arabe', 'maisons'].map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => { setTab(t); setSelectedItem(null); }}
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
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '500', color: '#4A4A4A' },
  placeholder: { width: 36 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 6, marginBottom: 8 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 20, backgroundColor: '#FFFFFF' },
  tabActive: { backgroundColor: '#4A4A4A' },
  tabText: { fontSize: 11, color: '#A0A090', fontWeight: '500' },
  tabTextActive: { color: '#FFFFFF' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  moonCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 28, alignItems: 'center', marginBottom: 20 },
  moonEmoji: { fontSize: 56, marginBottom: 12 },
  moonName: { fontSize: 22, fontWeight: '200', color: '#4A4A4A', letterSpacing: 1, marginBottom: 4 },
  moonDay: { fontSize: 12, color: '#A0A090', marginBottom: 16 },
  moonEnergy: { fontSize: 14, color: '#6B6B5B', textAlign: 'center', lineHeight: 22 },
  readingCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 24 },
  readingTitle: { fontSize: 16, fontWeight: '500', color: '#4A4A4A', marginBottom: 12 },
  questionInput: { backgroundColor: '#F5F0E8', borderRadius: 12, padding: 14, fontSize: 14, color: '#4A4A4A', marginBottom: 12 },
  readingButton: { backgroundColor: '#D4A574', paddingVertical: 14, borderRadius: 24, alignItems: 'center' },
  readingButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  readingResult: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F0EBE3' },
  readingText: { fontSize: 15, color: '#4A4A4A', lineHeight: 24, fontStyle: 'italic' },
  sectionTitle: { fontSize: 14, fontWeight: '500', color: '#4A4A4A', marginBottom: 12 },
  introText: { fontSize: 13, color: '#8B8B7D', marginBottom: 20, lineHeight: 20 },
  phasesList: { gap: 8 },
  phaseCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  cardSelected: { backgroundColor: '#FDF9F3', borderWidth: 1, borderColor: '#D4C4A8' },
  phaseEmoji: { fontSize: 28, marginRight: 14 },
  phaseInfo: { flex: 1 },
  phaseName: { fontSize: 14, fontWeight: '500', color: '#4A4A4A' },
  phaseMeaning: { fontSize: 12, color: '#A0A090' },
  expandedContent: { width: '100%', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F0EBE3' },
  expandedTitle: { fontSize: 14, fontWeight: '500', color: '#4A4A4A', marginBottom: 8 },
  expandedText: { fontSize: 13, color: '#6B6B5B', lineHeight: 20 },
  treesList: { gap: 10 },
  treeCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16 },
  treeHeader: { flexDirection: 'row', alignItems: 'center' },
  treeOgham: { fontSize: 26, color: '#8B9A7D', width: 40 },
  treeBasic: { flex: 1 },
  treeName: { fontSize: 15, fontWeight: '500', color: '#4A4A4A' },
  treeDates: { fontSize: 12, color: '#A0A090' },
  qualitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12, marginBottom: 12 },
  qualityChip: { backgroundColor: '#8B9A7D20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  qualityText: { fontSize: 11, color: '#8B9A7D' },
  shadowText: { fontSize: 12, color: '#C4A88B', marginBottom: 12 },
  messageText: { fontSize: 13, color: '#4A4A4A', fontStyle: 'italic', lineHeight: 20 },
  currentMansionCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 28, alignItems: 'center', marginBottom: 24 },
  mansionArabicLarge: { fontSize: 40, color: '#D4A574', marginBottom: 8 },
  mansionNameLarge: { fontSize: 20, fontWeight: '200', color: '#4A4A4A', marginBottom: 4 },
  mansionMeaningLarge: { fontSize: 14, color: '#6B6B5B', marginBottom: 12 },
  mansionMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  metaText: { fontSize: 12, color: '#8B8B7D' },
  metaDot: { color: '#D4D4C4' },
  mansionNature: { fontSize: 13, color: '#8B9A7D', fontStyle: 'italic', textAlign: 'center' },
  mansionsList: { gap: 8 },
  mansionCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14 },
  mansionHeader: { flexDirection: 'row', alignItems: 'center' },
  mansionNumber: { fontSize: 12, fontWeight: '600', color: '#A0A090', width: 24 },
  mansionArabic: { fontSize: 18, color: '#D4A574', width: 56 },
  mansionBasic: { flex: 1 },
  mansionName: { fontSize: 13, fontWeight: '500', color: '#4A4A4A' },
  mansionMeaning: { fontSize: 11, color: '#A0A090' },
  natureText: { fontSize: 12, color: '#8B9A7D', fontStyle: 'italic', marginTop: 8 },
  housesList: { gap: 10 },
  houseCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16 },
  houseHeader: { flexDirection: 'row', alignItems: 'center' },
  houseNumber: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F0E8', alignItems: 'center', justifyContent: 'center' },
  houseNumberText: { fontSize: 14, fontWeight: '600', color: '#4A4A4A' },
  houseBasic: { flex: 1, marginLeft: 12 },
  houseName: { fontSize: 15, fontWeight: '500', color: '#4A4A4A' },
  houseTheme: { fontSize: 12, color: '#A0A090' },
  rulerText: { fontSize: 12, color: '#D4A574', marginBottom: 8 },
  governsSection: { marginTop: 12 },
  governsTitle: { fontSize: 12, color: '#8B8B7D', marginBottom: 8 },
  governsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  governsChip: { backgroundColor: '#F5F0E8', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  governsText: { fontSize: 11, color: '#6B6B5B' },
});
