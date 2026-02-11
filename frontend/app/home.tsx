import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface MenuItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  route: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'ecrire',
    title: 'Écrire',
    subtitle: 'Déposer une pensée',
    icon: 'create-outline',
    route: '/capsule/write',
  },
  {
    id: 'sceller',
    title: 'Sceller',
    subtitle: 'Fermer une capsule',
    icon: 'lock-closed-outline',
    route: '/capsule/seal',
  },
  {
    id: 'dreams',
    title: 'Rêves',
    subtitle: 'Journal et interprétation',
    icon: 'cloudy-night-outline',
    route: '/dreams',
  },
  {
    id: 'astro',
    title: 'Astres',
    subtitle: 'Lune, Celtique, Arabe, Maisons',
    icon: 'moon-outline',
    route: '/astrology',
  },
];

interface BookRecommendation {
  title: string;
  author: string;
  why: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [currentMood, setCurrentMood] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [capsuleCount, setCapsuleCount] = useState(0);
  const [dreamCount, setDreamCount] = useState(0);
  
  // AI Companion
  const [showCompanion, setShowCompanion] = useState(false);
  const [companionMessage, setCompanionMessage] = useState('');
  const [companionResponse, setCompanionResponse] = useState('');
  const [isLoadingCompanion, setIsLoadingCompanion] = useState(false);
  
  // Book recommendations
  const [bookRecommendations, setBookRecommendations] = useState<BookRecommendation[]>([]);
  const [showBooks, setShowBooks] = useState(false);

  const fetchData = async () => {
    try {
      const user = await AsyncStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        if (userData.firstName) {
          setUserName(userData.firstName);
        }
      }

      const [moodRes, capsulesRes, dreamsRes] = await Promise.all([
        fetch(`${API_URL}/api/mood/latest`),
        fetch(`${API_URL}/api/capsules`),
        fetch(`${API_URL}/api/dreams`),
      ]);
      
      if (moodRes.ok) {
        const mood = await moodRes.json();
        setCurrentMood(mood);
        
        // Fetch book recommendations based on mood
        if (mood?.mood) {
          try {
            const booksRes = await fetch(`${API_URL}/api/book-recommendations/${mood.mood}`);
            if (booksRes.ok) {
              const booksData = await booksRes.json();
              setBookRecommendations(booksData.recommendations || []);
            }
          } catch (e) {
            console.log('Error fetching books:', e);
          }
        }
      }
      if (capsulesRes.ok) {
        const capsules = await capsulesRes.json();
        setCapsuleCount(capsules.length);
      }
      if (dreamsRes.ok) {
        const dreams = await dreamsRes.json();
        setDreamCount(dreams.length);
      }
    } catch (e) {
      console.log('Error fetching data:', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const getMoonPhase = () => {
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
    
    if (phase < 0.03) return { name: 'Nouvelle Lune', emoji: '🌑' };
    if (phase < 0.25) return { name: 'Premier Croissant', emoji: '🌒' };
    if (phase < 0.28) return { name: 'Premier Quartier', emoji: '🌓' };
    if (phase < 0.47) return { name: 'Gibbeuse', emoji: '🌔' };
    if (phase < 0.53) return { name: 'Pleine Lune', emoji: '🌕' };
    if (phase < 0.72) return { name: 'Gibbeuse', emoji: '🌖' };
    if (phase < 0.78) return { name: 'Dernier Quartier', emoji: '🌗' };
    if (phase < 0.97) return { name: 'Dernier Croissant', emoji: '🌘' };
    return { name: 'Nouvelle Lune', emoji: '🌑' };
  };

  const handleCompanionChat = async () => {
    if (!companionMessage.trim() || !currentMood) return;
    
    setIsLoadingCompanion(true);
    try {
      const res = await fetch(`${API_URL}/api/companion/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood: currentMood.mood,
          energy_level: currentMood.energy_level,
          message: companionMessage,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setCompanionResponse(data.response);
      }
    } catch (e) {
      console.log('Error with companion:', e);
      setCompanionResponse("Les étoiles murmurent doucement... Que souhaitez-vous partager ?");
    } finally {
      setIsLoadingCompanion(false);
    }
  };

  const openCompanion = async () => {
    setShowCompanion(true);
    setCompanionResponse('');
    setCompanionMessage('');
    
    // Get initial greeting
    if (currentMood) {
      setIsLoadingCompanion(true);
      try {
        const res = await fetch(`${API_URL}/api/companion/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mood: currentMood.mood,
            energy_level: currentMood.energy_level,
          }),
        });
        
        if (res.ok) {
          const data = await res.json();
          setCompanionResponse(data.response);
        }
      } catch (e) {
        setCompanionResponse("Bienvenue, voyageur. Que porte votre cœur ce soir ?");
      } finally {
        setIsLoadingCompanion(false);
      }
    }
  };

  const moonPhase = getMoonPhase();
  const today = format(new Date(), "EEEE d MMMM", { locale: fr });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B9A7D" />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <View>
            <Text style={styles.date}>{today}</Text>
            <Text style={styles.title}>Latence</Text>
            <Text style={styles.byLine}>by Atelier Benamer</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => router.push('/profile')}
          >
            <Ionicons name="person-outline" size={22} color="#6B6B5B" />
          </TouchableOpacity>
        </Animated.View>

        {/* Moon Phase Card */}
        <Animated.View entering={FadeInUp.duration(600).delay(100)} style={styles.moonCard}>
          <Text style={styles.moonEmoji}>{moonPhase.emoji}</Text>
          <Text style={styles.moonName}>{moonPhase.name}</Text>
        </Animated.View>

        {/* AI Companion Button */}
        <Animated.View entering={FadeInUp.duration(600).delay(150)}>
          <TouchableOpacity 
            style={styles.companionButton}
            onPress={openCompanion}
            activeOpacity={0.8}
          >
            <View style={styles.companionIcon}>
              <Text style={styles.companionEmoji}>✨</Text>
            </View>
            <View style={styles.companionText}>
              <Text style={styles.companionTitle}>Dialogue intérieur</Text>
              <Text style={styles.companionSubtitle}>Parler avec ton compagnon poétique</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C4C4B4" />
          </TouchableOpacity>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInUp.duration(600).delay(200)} style={styles.statsRow}>
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => router.push('/capsule/list')}
          >
            <Text style={styles.statNumber}>{capsuleCount}</Text>
            <Text style={styles.statLabel}>capsules</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => router.push('/dreams')}
          >
            <Text style={styles.statNumber}>{dreamCount}</Text>
            <Text style={styles.statLabel}>rêves</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Menu */}
        <View style={styles.menuContainer}>
          {MENU_ITEMS.map((item, index) => (
            <Animated.View
              key={item.id}
              entering={FadeInUp.duration(500).delay(300 + index * 80)}
            >
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.7}
              >
                <View style={styles.menuIcon}>
                  <Ionicons name={item.icon as any} size={24} color="#6B6B5B" />
                </View>
                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#C4C4B4" />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Book Recommendations */}
        {bookRecommendations.length > 0 && (
          <Animated.View entering={FadeInUp.duration(600).delay(600)}>
            <TouchableOpacity 
              style={styles.booksSection}
              onPress={() => setShowBooks(true)}
            >
              <View style={styles.booksHeader}>
                <Text style={styles.booksTitle}>📚 Lectures suggérées</Text>
                <Text style={styles.booksSubtitle}>Pour prolonger ce moment</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C4C4B4" />
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>

      {/* AI Companion Modal */}
      <Modal
        visible={showCompanion}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCompanion(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Dialogue intérieur</Text>
            <TouchableOpacity onPress={() => setShowCompanion(false)}>
              <Ionicons name="close" size={28} color="#6B6B5B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentContainer}>
            <View style={styles.companionIntro}>
              <Text style={styles.companionIntroEmoji}>🌙</Text>
              <Text style={styles.companionIntroText}>
                Un espace pour explorer tes pensées et émotions à travers un dialogue poétique et bienveillant.
              </Text>
            </View>

            {companionResponse && (
              <Animated.View entering={FadeIn.duration(400)} style={styles.responseCard}>
                <Text style={styles.responseText}>{companionResponse}</Text>
              </Animated.View>
            )}

            {isLoadingCompanion && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#8B9A7D" />
              </View>
            )}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.companionInput}
              placeholder="Qu'habite ton esprit en ce moment ?"
              placeholderTextColor="#B0B0A0"
              value={companionMessage}
              onChangeText={setCompanionMessage}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, !companionMessage.trim() && styles.sendButtonDisabled]}
              onPress={handleCompanionChat}
              disabled={!companionMessage.trim() || isLoadingCompanion}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Books Modal */}
      <Modal
        visible={showBooks}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBooks(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Lectures suggérées</Text>
            <TouchableOpacity onPress={() => setShowBooks(false)}>
              <Ionicons name="close" size={28} color="#6B6B5B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} contentContainerStyle={styles.booksContainer}>
            <Text style={styles.booksIntro}>
              Basé sur ton humeur actuelle, voici quelques lectures qui pourraient résonner avec toi...
            </Text>
            
            {bookRecommendations.map((book, index) => (
              <Animated.View 
                key={index} 
                entering={FadeInUp.duration(400).delay(index * 100)}
                style={styles.bookCard}
              >
                <Text style={styles.bookTitle}>{book.title}</Text>
                <Text style={styles.bookAuthor}>{book.author}</Text>
                <Text style={styles.bookWhy}>{book.why}</Text>
              </Animated.View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  date: {
    fontSize: 12,
    color: '#A0A090',
    textTransform: 'capitalize',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 32,
    fontWeight: '200',
    color: '#4A4A4A',
    letterSpacing: 4,
  },
  byLine: {
    fontSize: 10,
    color: '#A0A090',
    letterSpacing: 1,
    marginTop: 2,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  moonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  moonEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  moonName: {
    fontSize: 14,
    color: '#6B6B5B',
    fontWeight: '500',
  },
  companionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#D4A57430',
  },
  companionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D4A57420',
    alignItems: 'center',
    justifyContent: 'center',
  },
  companionEmoji: {
    fontSize: 22,
  },
  companionText: {
    flex: 1,
    marginLeft: 12,
  },
  companionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#4A4A4A',
  },
  companionSubtitle: {
    fontSize: 12,
    color: '#A0A090',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '300',
    color: '#4A4A4A',
  },
  statLabel: {
    fontSize: 12,
    color: '#A0A090',
    marginTop: 4,
  },
  menuContainer: {
    gap: 12,
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F0E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    flex: 1,
    marginLeft: 16,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4A4A4A',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#A0A090',
    marginTop: 2,
  },
  booksSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  booksHeader: {
    flex: 1,
  },
  booksTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#4A4A4A',
  },
  booksSubtitle: {
    fontSize: 12,
    color: '#A0A090',
    marginTop: 2,
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D4',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#4A4A4A',
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: 24,
  },
  companionIntro: {
    alignItems: 'center',
    marginBottom: 24,
  },
  companionIntroEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  companionIntroText: {
    fontSize: 14,
    color: '#8B8B7D',
    textAlign: 'center',
    lineHeight: 22,
  },
  responseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  responseText: {
    fontSize: 16,
    color: '#4A4A4A',
    lineHeight: 26,
    fontStyle: 'italic',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E8E0D4',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  companionInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#4A4A4A',
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B9A7D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#D4D4C4',
  },
  
  // Books Modal
  booksContainer: {
    padding: 24,
  },
  booksIntro: {
    fontSize: 14,
    color: '#8B8B7D',
    marginBottom: 20,
    lineHeight: 22,
  },
  bookCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4A4A4A',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 13,
    color: '#8B8B7D',
    marginBottom: 12,
  },
  bookWhy: {
    fontSize: 13,
    color: '#6B6B5B',
    fontStyle: 'italic',
  },
});
