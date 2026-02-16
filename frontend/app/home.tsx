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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, ThemeMode } from '../src/context/ThemeContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

function formatToday(): string {
  const d = new Date();
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

// Get icon name for theme toggle
const getThemeIcon = (mode: ThemeMode): string => {
  switch (mode) {
    case 'light': return 'moon-outline';      // Click to go to dark
    case 'dark': return 'eye-outline';        // Click to go to silence
    case 'silence': return 'sunny-outline';   // Click to go to light
    default: return 'moon-outline';
  }
};

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
  const { theme, themeMode, isDark, toggleTheme } = useTheme();
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
  
  // Daily notification
  const [dailyNotification, setDailyNotification] = useState<{message: string; moon_phase: string} | null>(null);

  const fetchData = async () => {
    try {
      const user = await AsyncStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        if (userData.firstName) {
          setUserName(userData.firstName);
        }
      }

      const [moodRes, capsulesRes, dreamsRes, notifRes] = await Promise.all([
        fetch(`${API_URL}/api/mood/latest`),
        fetch(`${API_URL}/api/capsules`),
        fetch(`${API_URL}/api/dreams`),
        fetch(`${API_URL}/api/notifications/daily`),
      ]);
      
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setDailyNotification(notifData);
      }
      
      if (moodRes.ok) {
        const mood = await moodRes.json();
        setCurrentMood(mood);
        
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
    
    if (phase < 0.03) return { name: 'Nouvelle Lune', icon: 'moon-outline' };
    if (phase < 0.25) return { name: 'Premier Croissant', icon: 'moon-outline' };
    if (phase < 0.28) return { name: 'Premier Quartier', icon: 'moon-outline' };
    if (phase < 0.47) return { name: 'Gibbeuse Croissante', icon: 'moon-outline' };
    if (phase < 0.53) return { name: 'Pleine Lune', icon: 'moon' };
    if (phase < 0.72) return { name: 'Gibbeuse Décroissante', icon: 'moon' };
    if (phase < 0.78) return { name: 'Dernier Quartier', icon: 'moon-outline' };
    if (phase < 0.97) return { name: 'Dernier Croissant', icon: 'moon-outline' };
    return { name: 'Nouvelle Lune', icon: 'moon-outline' };
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
  const today = formatToday();

  // Dynamic styles based on theme
  const dynamicStyles = {
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    card: {
      backgroundColor: theme.card,
    },
    text: {
      color: theme.text,
    },
    textSecondary: {
      color: theme.textSecondary,
    },
    textMuted: {
      color: theme.textMuted,
    },
    input: {
      backgroundColor: theme.inputBackground,
      color: theme.text,
    },
    modalBg: {
      backgroundColor: theme.background,
    },
    border: {
      borderColor: theme.border,
    },
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <View>
            <Text style={[styles.date, dynamicStyles.textMuted]}>{today}</Text>
            <Text style={[styles.title, dynamicStyles.text]}>Latence</Text>
            <Text style={[styles.byLine, dynamicStyles.textMuted]}>by Atelier Benamer</Text>
          </View>
          <View style={styles.headerButtons}>
            {/* Theme Toggle Button */}
            <TouchableOpacity 
              style={[styles.themeButton, dynamicStyles.card]}
              onPress={toggleTheme}
              activeOpacity={0.7}
              data-testid="theme-toggle"
            >
              <Ionicons 
                name={getThemeIcon(themeMode) as any} 
                size={20} 
                color={theme.accentWarm} 
              />
            </TouchableOpacity>
            {/* Profile Button */}
            <TouchableOpacity 
              style={[styles.profileButton, dynamicStyles.card]}
              onPress={() => router.push('/profile')}
            >
              <Ionicons name="person-outline" size={22} color={theme.iconColor} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Moon Phase Card */}
        <Animated.View entering={FadeInUp.duration(600).delay(100)} style={[styles.moonCard, dynamicStyles.card]}>
          <Ionicons name={moonPhase.icon as any} size={48} color={theme.accentWarm} />
          <Text style={[styles.moonName, dynamicStyles.textSecondary]}>{moonPhase.name}</Text>
        </Animated.View>

        {/* Daily Poetic Notification */}
        {dailyNotification && (
          <Animated.View entering={FadeInUp.duration(600).delay(120)} style={[styles.notificationCard, dynamicStyles.card, { borderLeftColor: theme.accentWarm }]} data-testid="daily-notification">
            <Text style={[styles.notificationText, dynamicStyles.text]}>{dailyNotification.message}</Text>
          </Animated.View>
        )}

        {/* AI Companion Button */}
        <Animated.View entering={FadeInUp.duration(600).delay(150)}>
          <TouchableOpacity 
            style={[styles.companionButton, dynamicStyles.card, { borderColor: `${theme.accentWarm}30` }]}
            onPress={openCompanion}
            activeOpacity={0.8}
          >
            <View style={[styles.companionIcon, { backgroundColor: `${theme.accentWarm}20` }]}>
              <Ionicons name="sparkles-outline" size={22} color={theme.accentWarm} />
            </View>
            <View style={styles.companionText}>
              <Text style={[styles.companionTitle, dynamicStyles.text]}>Dialogue intérieur</Text>
              <Text style={[styles.companionSubtitle, dynamicStyles.textMuted]}>Parler avec ton compagnon poétique</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
          </TouchableOpacity>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInUp.duration(600).delay(200)} style={styles.statsRow}>
          <TouchableOpacity 
            style={[styles.statCard, dynamicStyles.card]}
            onPress={() => router.push('/capsule/list')}
          >
            <Text style={[styles.statNumber, dynamicStyles.text]}>{capsuleCount}</Text>
            <Text style={[styles.statLabel, dynamicStyles.textMuted]}>capsules</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.statCard, dynamicStyles.card]}
            onPress={() => router.push('/dreams')}
          >
            <Text style={[styles.statNumber, dynamicStyles.text]}>{dreamCount}</Text>
            <Text style={[styles.statLabel, dynamicStyles.textMuted]}>rêves</Text>
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
                style={[styles.menuItem, dynamicStyles.card]}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIcon, { backgroundColor: theme.background }]}>
                  <Ionicons name={item.icon as any} size={24} color={theme.iconColor} />
                </View>
                <View style={styles.menuText}>
                  <Text style={[styles.menuTitle, dynamicStyles.text]}>{item.title}</Text>
                  <Text style={[styles.menuSubtitle, dynamicStyles.textMuted]}>{item.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Book Recommendations */}
        {bookRecommendations.length > 0 && (
          <Animated.View entering={FadeInUp.duration(600).delay(600)}>
            <TouchableOpacity 
              style={[styles.booksSection, dynamicStyles.card]}
              onPress={() => setShowBooks(true)}
            >
              <View style={[styles.booksIconContainer, { backgroundColor: `${theme.accentWarm}20` }]}>
                <Ionicons name="book-outline" size={20} color={theme.accentWarm} />
              </View>
              <View style={styles.booksHeader}>
                <Text style={[styles.booksTitle, dynamicStyles.text]}>Lectures suggérées</Text>
                <Text style={[styles.booksSubtitle, dynamicStyles.textMuted]}>Pour prolonger ce moment</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
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
        <SafeAreaView style={[styles.modalContainer, dynamicStyles.modalBg]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, dynamicStyles.text]}>Dialogue intérieur</Text>
            <TouchableOpacity onPress={() => setShowCompanion(false)}>
              <Ionicons name="close" size={28} color={theme.iconColor} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentContainer}>
            <View style={styles.companionIntro}>
              <Ionicons name="moon-outline" size={48} color={theme.accentWarm} style={{ marginBottom: 16 }} />
              <Text style={[styles.companionIntroText, dynamicStyles.textSecondary]}>
                Un espace pour explorer tes pensées et émotions à travers un dialogue poétique et bienveillant.
              </Text>
            </View>

            {companionResponse && (
              <Animated.View entering={FadeIn.duration(400)} style={[styles.responseCard, dynamicStyles.card]}>
                <Text style={[styles.responseText, dynamicStyles.text]}>{companionResponse}</Text>
              </Animated.View>
            )}

            {isLoadingCompanion && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.accent} />
              </View>
            )}
          </ScrollView>

          <View style={[styles.inputContainer, { borderTopColor: theme.border }]}>
            <TextInput
              style={[styles.companionInput, dynamicStyles.input]}
              placeholder="Qu'habite ton esprit en ce moment ?"
              placeholderTextColor={theme.textMuted}
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
        <SafeAreaView style={[styles.modalContainer, dynamicStyles.modalBg]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, dynamicStyles.text]}>Lectures suggérées</Text>
            <TouchableOpacity onPress={() => setShowBooks(false)}>
              <Ionicons name="close" size={28} color={theme.iconColor} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} contentContainerStyle={styles.booksContainer}>
            <Text style={[styles.booksIntro, dynamicStyles.textSecondary]}>
              Basé sur ton humeur actuelle, voici quelques lectures qui pourraient résonner avec toi...
            </Text>
            
            {bookRecommendations.map((book, index) => (
              <Animated.View 
                key={index} 
                entering={FadeInUp.duration(400).delay(index * 100)}
                style={[styles.bookCard, dynamicStyles.card]}
              >
                <Text style={[styles.bookTitle, dynamicStyles.text]}>{book.title}</Text>
                <Text style={[styles.bookAuthor, dynamicStyles.textSecondary]}>{book.author}</Text>
                <Text style={[styles.bookWhy, dynamicStyles.textSecondary]}>{book.why}</Text>
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
    textTransform: 'capitalize',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 32,
    fontWeight: '200',
    letterSpacing: 4,
  },
  byLine: {
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  themeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  moonCard: {
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
    fontWeight: '500',
  },
  notificationCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderLeftWidth: 3,
  },
  notificationText: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  companionButton: {
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
  },
  companionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  },
  companionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
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
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  menuContainer: {
    gap: 12,
  },
  menuItem: {
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
  },
  menuSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  booksSection: {
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
  booksIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  booksHeader: {
    flex: 1,
  },
  booksTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  booksSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '500',
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
    textAlign: 'center',
    lineHeight: 22,
  },
  responseCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  responseText: {
    fontSize: 16,
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
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  companionInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
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
    marginBottom: 20,
    lineHeight: 22,
  },
  bookCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 13,
    marginBottom: 12,
  },
  bookWhy: {
    fontSize: 13,
    fontStyle: 'italic',
  },
});
