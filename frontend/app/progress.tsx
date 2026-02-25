import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import { TwinklingStars } from '../src/components/TwinklingStars';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface MoodEntry {
  mood: string;
  date: string;
  energy_level: number;
}

interface StatsData {
  streak: number;
  longest_streak: number;
  total_entries: number;
  this_week: number;
  mood_distribution: Record<string, number>;
  recent_moods: MoodEntry[];
  calendar: Record<string, boolean>;
}

const MOOD_COLORS: Record<string, string> = {
  serein: '#8BC34A',
  joyeux: '#FFEB3B',
  reveur: '#9C27B0',
  melancolique: '#607D8B',
  fatigue: '#795548',
  inspire: '#FF9800',
  anxieux: '#F44336',
  nostalgique: '#3F51B5',
  perdu: '#9E9E9E',
  reconnaissant: '#E91E63',
  contemplatif: '#00BCD4',
  eveille: '#FFC107',
};

const MOOD_ICONS: Record<string, string> = {
  serein: 'leaf-outline',
  joyeux: 'sunny-outline', 
  reveur: 'cloud-outline',
  melancolique: 'rainy-outline',
  fatigue: 'moon-outline',
  inspire: 'sparkles-outline',
  anxieux: 'water-outline',
  nostalgique: 'time-outline',
  perdu: 'compass-outline',
  reconnaissant: 'heart-outline',
  contemplatif: 'eye-outline',
  eveille: 'flash-outline',
};

export default function ProgressScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  const ds = {
    container: { backgroundColor: theme.background },
    card: { backgroundColor: theme.card },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    textMuted: { color: theme.textMuted },
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/progress/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.log('Error fetching stats:', e);
    } finally {
      setLoading(false);
    }
  };

  const getStreakMessage = (streak: number) => {
    if (streak === 0) return "Commence ta série !";
    if (streak < 3) return "Bon début !";
    if (streak < 7) return "Tu tiens le rythme !";
    if (streak < 14) return "Impressionnant !";
    if (streak < 30) return "Tu es en feu !";
    return "Incroyable discipline !";
  };

  const renderMoodGraph = () => {
    if (!stats?.recent_moods || stats.recent_moods.length === 0) return null;
    
    const moods = viewMode === 'week' ? stats.recent_moods.slice(0, 7) : stats.recent_moods.slice(0, 30);
    const moodValues: Record<string, number> = {
      joyeux: 5, inspire: 5, eveille: 5, reconnaissant: 4,
      serein: 4, contemplatif: 3, reveur: 3, nostalgique: 2,
      fatigue: 2, melancolique: 2, perdu: 1, anxieux: 1,
    };
    
    const maxHeight = 100;
    
    return (
      <View style={styles.graphContainer}>
        <View style={styles.graphBars}>
          {moods.reverse().map((entry, i) => {
            const value = moodValues[entry.mood] || 3;
            const height = (value / 5) * maxHeight;
            const color = MOOD_COLORS[entry.mood] || theme.accent;
            const day = new Date(entry.date).toLocaleDateString('fr-FR', { weekday: 'short' }).charAt(0).toUpperCase();
            
            return (
              <View key={i} style={styles.barWrapper}>
                <View style={[styles.bar, { height, backgroundColor: color }]} />
                <Text style={[styles.barLabel, ds.textMuted]}>{day}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderCalendar = () => {
    if (!stats?.calendar) return null;
    
    const today = new Date();
    const days = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const hasEntry = stats.calendar[dateStr];
      days.push({ date: dateStr, hasEntry, day: date.getDate() });
    }
    
    return (
      <View style={styles.calendarGrid}>
        {days.map((d, i) => (
          <View
            key={i}
            style={[
              styles.calendarDay,
              d.hasEntry ? { backgroundColor: theme.accentWarm } : { backgroundColor: `${theme.textMuted}20` }
            ]}
          >
            <Text style={[styles.calendarDayText, { color: d.hasEntry ? '#fff' : theme.textMuted }]}>
              {d.day}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderMoodDistribution = () => {
    if (!stats?.mood_distribution) return null;
    
    const entries = Object.entries(stats.mood_distribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    const total = entries.reduce((sum, [_, count]) => sum + count, 0);
    
    return (
      <View style={styles.distributionContainer}>
        {entries.map(([mood, count], i) => {
          const percentage = Math.round((count / total) * 100);
          const iconName = MOOD_ICONS[mood] || 'ellipse-outline';
          return (
            <View key={mood} style={styles.distributionRow}>
              <View style={styles.distributionLeft}>
                <Ionicons name={iconName as any} size={18} color={MOOD_COLORS[mood] || theme.accent} />
                <Text style={[styles.distributionMood, ds.text]}>{mood}</Text>
              </View>
              <View style={styles.distributionBarContainer}>
                <View 
                  style={[
                    styles.distributionBar, 
                    { width: `${percentage}%`, backgroundColor: MOOD_COLORS[mood] || theme.accent }
                  ]} 
                />
              </View>
              <Text style={[styles.distributionPercent, ds.textMuted]}>{percentage}%</Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, ds.container]}>
      <TwinklingStars density={isDark ? 30 : 15} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-down" size={28} color={theme.iconColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, ds.text]}>Ma Progression</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.accentWarm} style={{ marginTop: 40 }} />
        ) : stats ? (
          <>
            {/* Streak Card */}
            <Animated.View entering={FadeInUp.duration(500)} style={[styles.streakCard, { backgroundColor: theme.accentWarm }]}>
              <View style={styles.streakIcon}>
                <Ionicons name="flame-outline" size={48} color="#fff" />
              </View>
              <View style={styles.streakInfo}>
                <Text style={styles.streakNumber}>{stats.streak}</Text>
                <Text style={styles.streakLabel}>jours consécutifs</Text>
              </View>
              <Text style={styles.streakMessage}>{getStreakMessage(stats.streak)}</Text>
            </Animated.View>

            {/* Quick Stats */}
            <Animated.View entering={FadeInUp.duration(500).delay(100)} style={styles.quickStats}>
              <View style={[styles.statBox, ds.card]}>
                <Text style={[styles.statNumber, { color: theme.accentWarm }]}>{stats.longest_streak}</Text>
                <Text style={[styles.statLabel, ds.textMuted]}>Record</Text>
              </View>
              <View style={[styles.statBox, ds.card]}>
                <Text style={[styles.statNumber, { color: theme.accent }]}>{stats.this_week}</Text>
                <Text style={[styles.statLabel, ds.textMuted]}>Cette semaine</Text>
              </View>
              <View style={[styles.statBox, ds.card]}>
                <Text style={[styles.statNumber, { color: theme.accentWarm }]}>{stats.total_entries}</Text>
                <Text style={[styles.statLabel, ds.textMuted]}>Total</Text>
              </View>
            </Animated.View>

            {/* Mood Graph */}
            <Animated.View entering={FadeInUp.duration(500).delay(200)} style={[styles.section, ds.card]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, ds.text]}>Évolution de l'humeur</Text>
                <View style={styles.toggleContainer}>
                  <TouchableOpacity
                    style={[styles.toggleBtn, viewMode === 'week' && { backgroundColor: theme.accentWarm }]}
                    onPress={() => setViewMode('week')}
                  >
                    <Text style={[styles.toggleText, viewMode === 'week' && { color: '#fff' }]}>7j</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toggleBtn, viewMode === 'month' && { backgroundColor: theme.accentWarm }]}
                    onPress={() => setViewMode('month')}
                  >
                    <Text style={[styles.toggleText, viewMode === 'month' && { color: '#fff' }]}>30j</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {renderMoodGraph()}
            </Animated.View>

            {/* Calendar */}
            <Animated.View entering={FadeInUp.duration(500).delay(300)} style={[styles.section, ds.card]}>
              <Text style={[styles.sectionTitle, ds.text]}>30 derniers jours</Text>
              {renderCalendar()}
            </Animated.View>

            {/* Mood Distribution */}
            <Animated.View entering={FadeInUp.duration(500).delay(400)} style={[styles.section, ds.card]}>
              <Text style={[styles.sectionTitle, ds.text]}>Tes humeurs dominantes</Text>
              {renderMoodDistribution()}
            </Animated.View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, ds.textSecondary]}>Commence à tracker tes humeurs pour voir ta progression !</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  streakCard: { borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 20 },
  streakIcon: { marginBottom: 8 },
  streakEmoji: { fontSize: 48 },
  streakInfo: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
  streakNumber: { fontSize: 56, fontWeight: '700', color: '#fff' },
  streakLabel: { fontSize: 18, color: 'rgba(255,255,255,0.9)', marginLeft: 8 },
  streakMessage: { fontSize: 16, color: 'rgba(255,255,255,0.8)', fontStyle: 'italic' },
  
  quickStats: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statBox: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' },
  statNumber: { fontSize: 28, fontWeight: '700' },
  statLabel: { fontSize: 11, textTransform: 'uppercase', marginTop: 4 },
  
  section: { borderRadius: 20, padding: 20, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  
  toggleContainer: { flexDirection: 'row', gap: 4 },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  toggleText: { fontSize: 13, fontWeight: '500' },
  
  graphContainer: { marginTop: 8 },
  graphBars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120 },
  barWrapper: { alignItems: 'center', flex: 1 },
  bar: { width: 20, borderRadius: 10, marginBottom: 8 },
  barLabel: { fontSize: 11 },
  
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  calendarDay: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  calendarDayText: { fontSize: 12, fontWeight: '500' },
  
  distributionContainer: { marginTop: 8 },
  distributionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  distributionLeft: { flexDirection: 'row', alignItems: 'center', width: 100 },
  distributionEmoji: { fontSize: 18, marginRight: 8 },
  distributionMood: { fontSize: 13, textTransform: 'capitalize' },
  distributionBarContainer: { flex: 1, height: 8, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 4, marginHorizontal: 10 },
  distributionBar: { height: '100%', borderRadius: 4 },
  distributionPercent: { width: 40, textAlign: 'right', fontSize: 13 },
  
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 15, textAlign: 'center' },
});
