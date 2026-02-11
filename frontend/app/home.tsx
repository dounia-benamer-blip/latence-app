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

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface MenuItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  route: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'capsule',
    title: 'Capsule Temporelle',
    subtitle: 'Scelle tes pensées pour le futur',
    icon: 'lock-closed',
    color: '#9B59B6',
    route: '/capsule/create',
  },
  {
    id: 'dreams',
    title: 'Carnet des Rêves',
    subtitle: 'Journal et interprétation IA',
    icon: 'cloudy-night',
    color: '#3498DB',
    route: '/dreams',
  },
  {
    id: 'western',
    title: 'Astrologie Occidentale',
    subtitle: 'Les 12 maisons du zodiaque',
    icon: 'planet',
    color: '#E74C3C',
    route: '/astrology/western',
  },
  {
    id: 'celtic',
    title: 'Astrologie Celtique',
    subtitle: 'Les arbres sacrés et la lune',
    icon: 'leaf',
    color: '#27AE60',
    route: '/astrology/celtic',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [currentMood, setCurrentMood] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [capsuleCount, setCapsuleCount] = useState(0);
  const [dreamCount, setDreamCount] = useState(0);

  const fetchData = async () => {
    try {
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
    if (phase < 0.47) return { name: 'Lune Gibbeuse', emoji: '🌔' };
    if (phase < 0.53) return { name: 'Pleine Lune', emoji: '🌕' };
    if (phase < 0.72) return { name: 'Lune Gibbeuse', emoji: '🌖' };
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C63FF" />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <View>
            <Text style={styles.date}>{today}</Text>
            <Text style={styles.title}>Journal Astral</Text>
          </View>
          <View style={styles.moonBadge}>
            <Text style={styles.moonEmoji}>{moonPhase.emoji}</Text>
            <Text style={styles.moonName}>{moonPhase.name}</Text>
          </View>
        </Animated.View>

        {/* Current Mood */}
        {currentMood && (
          <Animated.View entering={FadeInUp.duration(600).delay(200)} style={styles.moodCard}>
            <View style={styles.moodHeader}>
              <Ionicons name="heart" size={20} color="#FF6B6B" />
              <Text style={styles.moodTitle}>Ton état actuel</Text>
            </View>
            <View style={styles.moodContent}>
              <Text style={styles.moodValue}>
                {currentMood.mood?.charAt(0).toUpperCase() + currentMood.mood?.slice(1)}
              </Text>
              <View style={styles.energyBadge}>
                <Text style={styles.energyLabel}>Énergie: {currentMood.energy_level}/5</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Stats Row */}
        <Animated.View entering={FadeInUp.duration(600).delay(300)} style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="lock-closed" size={24} color="#9B59B6" />
            <Text style={styles.statNumber}>{capsuleCount}</Text>
            <Text style={styles.statLabel}>Capsules</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cloudy-night" size={24} color="#3498DB" />
            <Text style={styles.statNumber}>{dreamCount}</Text>
            <Text style={styles.statLabel}>Rêves</Text>
          </View>
        </Animated.View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {MENU_ITEMS.map((item, index) => (
            <Animated.View
              key={item.id}
              entering={FadeInUp.duration(500).delay(400 + index * 100)}
            >
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIcon, { backgroundColor: `${item.color}20` }]}>
                  <Ionicons name={item.icon as any} size={28} color={item.color} />
                </View>
                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#4a4a6a" />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Quick Access - View Capsules */}
        <Animated.View entering={FadeInUp.duration(600).delay(800)}>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => router.push('/capsule/list')}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>Voir mes capsules scellées</Text>
            <Ionicons name="arrow-forward" size={18} color="#6C63FF" />
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  date: {
    fontSize: 14,
    color: '#6a6a8a',
    textTransform: 'capitalize',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
  },
  moonBadge: {
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 12,
    borderRadius: 16,
  },
  moonEmoji: {
    fontSize: 28,
  },
  moonName: {
    fontSize: 10,
    color: '#a0a0c0',
    marginTop: 4,
    textAlign: 'center',
  },
  moodCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  moodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  moodTitle: {
    fontSize: 14,
    color: '#a0a0c0',
  },
  moodContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moodValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  energyBadge: {
    backgroundColor: '#6C63FF20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  energyLabel: {
    fontSize: 12,
    color: '#6C63FF',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6a6a8a',
    marginTop: 4,
  },
  menuContainer: {
    gap: 12,
    marginBottom: 20,
  },
  menuItem: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    flex: 1,
    marginLeft: 16,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#6a6a8a',
    marginTop: 4,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#6C63FF',
    fontWeight: '600',
  },
});
