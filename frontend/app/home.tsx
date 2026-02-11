import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
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

export default function HomeScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [currentMood, setCurrentMood] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [capsuleCount, setCapsuleCount] = useState(0);
  const [dreamCount, setDreamCount] = useState(0);

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

        {/* Moon Phase */}
        <Animated.View entering={FadeInUp.duration(600).delay(100)} style={styles.moonCard}>
          <Text style={styles.moonEmoji}>{moonPhase.emoji}</Text>
          <Text style={styles.moonName}>{moonPhase.name}</Text>
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
      </ScrollView>
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
    marginBottom: 16,
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
});
