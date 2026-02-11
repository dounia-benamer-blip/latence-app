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
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const HOUSES = [
  {
    number: 1,
    name: "Maison I - L'Ascendant",
    theme: "Le Moi",
    description: "Représente votre personnalité, apparence physique et la façon dont les autres vous perçoivent. C'est le masque que vous portez face au monde.",
    governs: ["Apparence", "Première impression", "Identité", "Vitalité"],
    element: "Personnel",
    color: "#E74C3C"
  },
  {
    number: 2,
    name: "Maison II - Les Possessions",
    theme: "Les Ressources",
    description: "Liée à vos valeurs matérielles, vos finances et ce que vous possédez. Elle révèle votre rapport à l'argent et à la sécurité.",
    governs: ["Argent", "Possessions", "Valeurs", "Estime de soi"],
    element: "Matériel",
    color: "#27AE60"
  },
  {
    number: 3,
    name: "Maison III - La Communication",
    theme: "L'Expression",
    description: "Gouverne la communication, l'apprentissage, les frères et sœurs et l'environnement proche. Elle montre comment vous pensez et communiquez.",
    governs: ["Communication", "Éducation", "Voyages courts", "Fratrie"],
    element: "Mental",
    color: "#F39C12"
  },
  {
    number: 4,
    name: "Maison IV - Le Foyer",
    theme: "Les Racines",
    description: "Représente la famille, le foyer, les racines et la vie privée. C'est le fondement émotionnel de votre être.",
    governs: ["Famille", "Maison", "Héritage", "Fin de vie"],
    element: "Émotionnel",
    color: "#3498DB"
  },
  {
    number: 5,
    name: "Maison V - La Créativité",
    theme: "L'Expression Créative",
    description: "Liée à la créativité, les plaisirs, les enfants et les romances. Elle révèle ce qui vous apporte de la joie.",
    governs: ["Créativité", "Romance", "Enfants", "Loisirs"],
    element: "Créatif",
    color: "#E91E63"
  },
  {
    number: 6,
    name: "Maison VI - Le Service",
    theme: "La Santé & le Travail",
    description: "Gouverne le travail quotidien, la santé et les routines. Elle montre votre approche du service et du bien-être.",
    governs: ["Santé", "Travail quotidien", "Routines", "Animaux"],
    element: "Pratique",
    color: "#00BCD4"
  },
  {
    number: 7,
    name: "Maison VII - Les Partenariats",
    theme: "Les Relations",
    description: "Représente le mariage, les associations et les contrats. C'est le miroir de votre Maison I - comment vous vous reliez aux autres.",
    governs: ["Mariage", "Partenariats", "Contrats", "Ennemis déclarés"],
    element: "Relationnel",
    color: "#9C27B0"
  },
  {
    number: 8,
    name: "Maison VIII - La Transformation",
    theme: "La Renaissance",
    description: "Liée à la mort, la renaissance, la sexualité et les ressources partagées. Elle gouverne les transformations profondes.",
    governs: ["Transformation", "Héritage", "Sexualité", "Mystères"],
    element: "Occulte",
    color: "#673AB7"
  },
  {
    number: 9,
    name: "Maison IX - La Philosophie",
    theme: "L'Expansion",
    description: "Gouverne les voyages lointains, l'enseignement supérieur et la spiritualité. Elle représente votre quête de sens.",
    governs: ["Voyages", "Philosophie", "Religion", "Études supérieures"],
    element: "Spirituel",
    color: "#2196F3"
  },
  {
    number: 10,
    name: "Maison X - La Carrière",
    theme: "La Destinée",
    description: "Représente la carrière, la réputation et le statut social. C'est votre place dans le monde et vos ambitions.",
    governs: ["Carrière", "Réputation", "Ambition", "Figure d'autorité"],
    element: "Social",
    color: "#795548"
  },
  {
    number: 11,
    name: "Maison XI - Les Espoirs",
    theme: "Les Aspirations",
    description: "Liée aux amis, aux groupes et aux idéaux. Elle révèle vos espoirs pour le futur et votre place dans la communauté.",
    governs: ["Amitiés", "Groupes", "Espoirs", "Idéaux humanitaires"],
    element: "Collectif",
    color: "#009688"
  },
  {
    number: 12,
    name: "Maison XII - L'Inconscient",
    theme: "Le Caché",
    description: "Gouverne l'inconscient, les secrets et la spiritualité profonde. C'est le royaume du karma et des vies passées.",
    governs: ["Inconscient", "Secrets", "Karma", "Retraite spirituelle"],
    element: "Transcendant",
    color: "#607D8B"
  }
];

export default function WesternAstrologyScreen() {
  const router = useRouter();
  const [selectedHouse, setSelectedHouse] = useState<number | null>(null);

  const renderHouseDetail = (house: typeof HOUSES[0]) => (
    <Animated.View entering={FadeInUp.duration(400)} style={styles.detailCard}>
      <TouchableOpacity
        style={styles.closeDetail}
        onPress={() => setSelectedHouse(null)}
      >
        <Ionicons name="close" size={24} color="#fff" />
      </TouchableOpacity>
      
      <View style={[styles.houseNumberBadge, { backgroundColor: house.color }]}>
        <Text style={styles.houseNumberText}>{house.number}</Text>
      </View>
      
      <Text style={styles.detailName}>{house.name}</Text>
      <Text style={styles.detailTheme}>{house.theme}</Text>
      
      <View style={styles.elementBadge}>
        <Ionicons name="planet" size={16} color={house.color} />
        <Text style={[styles.elementText, { color: house.color }]}>{house.element}</Text>
      </View>
      
      <Text style={styles.detailDescription}>{house.description}</Text>
      
      <View style={styles.governsSection}>
        <Text style={styles.governsTitle}>Cette maison gouverne :</Text>
        <View style={styles.governsList}>
          {house.governs.map((item, index) => (
            <View key={index} style={[styles.governsItem, { borderColor: house.color }]}>
              <Text style={styles.governsText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );

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
        <Text style={styles.headerTitle}>Les 12 Maisons</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <Animated.View entering={FadeInUp.duration(500)} style={styles.introCard}>
          <Ionicons name="planet" size={32} color="#E74C3C" />
          <Text style={styles.introTitle}>Astrologie Occidentale</Text>
          <Text style={styles.introText}>
            Les 12 maisons astrologiques représentent différents domaines de la vie.
            Chaque maison influence un aspect spécifique de votre existence.
          </Text>
        </Animated.View>

        {/* House Detail View */}
        {selectedHouse !== null && renderHouseDetail(HOUSES[selectedHouse - 1])}

        {/* Houses Grid */}
        {selectedHouse === null && (
          <View style={styles.housesGrid}>
            {HOUSES.map((house, index) => (
              <Animated.View
                key={house.number}
                entering={FadeInUp.duration(400).delay(index * 50)}
              >
                <TouchableOpacity
                  style={styles.houseCard}
                  onPress={() => setSelectedHouse(house.number)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.houseIcon, { backgroundColor: `${house.color}20` }]}>
                    <Text style={[styles.houseNumber, { color: house.color }]}>
                      {house.number}
                    </Text>
                  </View>
                  <View style={styles.houseInfo}>
                    <Text style={styles.houseName} numberOfLines={1}>
                      {house.name.split(' - ')[1]}
                    </Text>
                    <Text style={styles.houseTheme}>{house.theme}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#4a4a6a" />
                </TouchableOpacity>
              </Animated.View>
            ))}
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
    marginBottom: 24,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
  },
  introText: {
    fontSize: 14,
    color: '#a0a0c0',
    textAlign: 'center',
    lineHeight: 22,
  },
  housesGrid: {
    gap: 12,
  },
  houseCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  houseIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  houseNumber: {
    fontSize: 20,
    fontWeight: '700',
  },
  houseInfo: {
    flex: 1,
    marginLeft: 14,
  },
  houseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  houseTheme: {
    fontSize: 12,
    color: '#6a6a8a',
    marginTop: 4,
  },
  detailCard: {
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
  houseNumberBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  houseNumberText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  detailName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  detailTheme: {
    fontSize: 16,
    color: '#a0a0c0',
    textAlign: 'center',
    marginBottom: 16,
  },
  elementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  elementText: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailDescription: {
    fontSize: 15,
    color: '#d0d0e0',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  governsSection: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
    paddingTop: 20,
  },
  governsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a0a0c0',
    marginBottom: 12,
  },
  governsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  governsItem: {
    backgroundColor: '#0a0a1a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  governsText: {
    fontSize: 13,
    color: '#fff',
  },
});
