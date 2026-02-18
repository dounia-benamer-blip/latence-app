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
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// Mood colors
const MOOD_COLORS: Record<string, string> = {
  serein: '#8B9A7D',
  joyeux: '#D4A574',
  reveur: '#9D8BA8',
  melancolique: '#7D8A9A',
  fatigue: '#9A8B7D',
  inspire: '#A89D7D',
  anxieux: '#9A7D7D',
  nostalgique: '#8A7D9A',
  perdu: '#7D7D8A',
  reconnaissant: '#7DA87D',
  contemplatif: '#8A9D9A',
  eveille: '#D4A574',
};

interface MoodEntry {
  mood: string;
  energy: number;
  date: string;
}

interface Stats {
  totalEntries: number;
  moodDistribution: Record<string, number>;
  averageEnergy: number;
  streak: number;
  mostCommonMood: string;
  moodHistory: MoodEntry[];
}

export default function StatsScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');

  const ds = {
    container: { backgroundColor: theme.background },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    textMuted: { color: theme.textMuted },
    card: { backgroundColor: theme.card },
  };

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/mood/stats?range=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        // Generate mock stats if API doesn't exist yet
        setStats(generateMockStats());
      }
    } catch (error) {
      setStats(generateMockStats());
    }
    setLoading(false);
  };

  const generateMockStats = (): Stats => {
    const moods = ['serein', 'joyeux', 'reveur', 'melancolique', 'inspire', 'contemplatif'];
    const distribution: Record<string, number> = {};
    moods.forEach(m => distribution[m] = Math.floor(Math.random() * 10) + 1);
    
    const history: MoodEntry[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      history.push({
        mood: moods[Math.floor(Math.random() * moods.length)],
        energy: Math.floor(Math.random() * 5) + 1,
        date: date.toISOString(),
      });
    }

    const totalEntries = Object.values(distribution).reduce((a, b) => a + b, 0);
    const mostCommonMood = Object.entries(distribution).sort((a, b) => b[1] - a[1])[0][0];

    return {
      totalEntries,
      moodDistribution: distribution,
      averageEnergy: 3.2,
      streak: 5,
      mostCommonMood,
      moodHistory: history,
    };
  };

  const renderMoodBar = (mood: string, count: number, maxCount: number) => {
    const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
    const color = MOOD_COLORS[mood] || theme.accent;
    
    return (
      <Animated.View 
        key={mood} 
        entering={FadeInUp.duration(400).delay(100)}
        style={styles.moodBarContainer}
      >
        <View style={styles.moodBarLabel}>
          <Text style={[styles.moodName, ds.text]}>{mood}</Text>
          <Text style={[styles.moodCount, ds.textMuted]}>{count}</Text>
        </View>
        <View style={[styles.barBackground, { backgroundColor: theme.border }]}>
          <Animated.View 
            style={[
              styles.barFill, 
              { width: `${percentage}%`, backgroundColor: color }
            ]} 
          />
        </View>
      </Animated.View>
    );
  };

  const renderEnergyDot = (energy: number, index: number) => {
    const colors = ['#9A7D7D', '#9A8B7D', '#9D9A7D', '#8B9A7D', '#7DA87D'];
    return (
      <Animated.View
        key={index}
        entering={FadeIn.duration(300).delay(index * 50)}
        style={[styles.energyDot, { backgroundColor: colors[energy - 1] || theme.accent }]}
      >
        <Text style={styles.energyDotText}>{energy}</Text>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, ds.container]}>
        <ActivityIndicator size="large" color={theme.accent} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  const maxMoodCount = stats ? Math.max(...Object.values(stats.moodDistribution)) : 0;

  return (
    <SafeAreaView style={[styles.container, ds.container]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-down" size={28} color={theme.iconColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, ds.text]}>Statistiques</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          {(['week', 'month', 'all'] as const).map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                timeRange === range 
                  ? { backgroundColor: theme.accentWarm } 
                  : { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }
              ]}
              onPress={() => setTimeRange(range)}
            >
              <Text style={[
                styles.timeRangeText,
                timeRange === range ? { color: '#fff' } : ds.text
              ]}>
                {range === 'week' ? 'Semaine' : range === 'month' ? 'Mois' : 'Tout'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Cards */}
        <Animated.View entering={FadeInUp.duration(400)} style={styles.summaryGrid}>
          <View style={[styles.summaryCard, ds.card]}>
            <Ionicons name="calendar-outline" size={24} color={theme.accentWarm} />
            <Text style={[styles.summaryValue, ds.text]}>{stats?.totalEntries || 0}</Text>
            <Text style={[styles.summaryLabel, ds.textMuted]}>Entrées</Text>
          </View>
          
          <View style={[styles.summaryCard, ds.card]}>
            <Ionicons name="flame-outline" size={24} color={theme.accent} />
            <Text style={[styles.summaryValue, ds.text]}>{stats?.streak || 0}</Text>
            <Text style={[styles.summaryLabel, ds.textMuted]}>Jours de suite</Text>
          </View>
          
          <View style={[styles.summaryCard, ds.card]}>
            <Ionicons name="battery-half-outline" size={24} color={theme.accentWarm} />
            <Text style={[styles.summaryValue, ds.text]}>{stats?.averageEnergy.toFixed(1) || '0'}</Text>
            <Text style={[styles.summaryLabel, ds.textMuted]}>Énergie moy.</Text>
          </View>
        </Animated.View>

        {/* Most Common Mood */}
        {stats?.mostCommonMood && (
          <Animated.View entering={FadeInUp.duration(400).delay(100)} style={[styles.featuredCard, ds.card]}>
            <Text style={[styles.featuredLabel, ds.textMuted]}>TON HUMEUR DOMINANTE</Text>
            <View style={styles.featuredMood}>
              <View style={[styles.featuredMoodDot, { backgroundColor: MOOD_COLORS[stats.mostCommonMood] }]} />
              <Text style={[styles.featuredMoodText, ds.text]}>
                {stats.mostCommonMood.charAt(0).toUpperCase() + stats.mostCommonMood.slice(1)}
              </Text>
            </View>
            <Text style={[styles.featuredDescription, ds.textSecondary]}>
              C'est l'état émotionnel que tu as le plus souvent ressenti cette période.
            </Text>
          </Animated.View>
        )}

        {/* Mood Distribution */}
        <Animated.View entering={FadeInUp.duration(400).delay(150)} style={[styles.section, ds.card]}>
          <Text style={[styles.sectionTitle, ds.text]}>Distribution des humeurs</Text>
          <View style={styles.moodBarsContainer}>
            {stats && Object.entries(stats.moodDistribution)
              .sort((a, b) => b[1] - a[1])
              .map(([mood, count]) => renderMoodBar(mood, count, maxMoodCount))}
          </View>
        </Animated.View>

        {/* Energy History */}
        <Animated.View entering={FadeInUp.duration(400).delay(200)} style={[styles.section, ds.card]}>
          <Text style={[styles.sectionTitle, ds.text]}>Ton énergie cette semaine</Text>
          <View style={styles.energyHistory}>
            {stats?.moodHistory.map((entry, i) => (
              <View key={i} style={styles.energyDay}>
                {renderEnergyDot(entry.energy, i)}
                <Text style={[styles.dayLabel, ds.textMuted]}>
                  {new Date(entry.date).toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 3)}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Insight */}
        <Animated.View entering={FadeInUp.duration(400).delay(250)} style={[styles.insightCard, { backgroundColor: `${theme.accent}15`, borderColor: theme.accent }]}>
          <Ionicons name="bulb-outline" size={20} color={theme.accent} />
          <Text style={[styles.insightText, { color: theme.accent }]}>
            Continue à noter tes humeurs régulièrement pour découvrir des patterns et mieux te connaître.
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', letterSpacing: 1 },
  placeholder: { width: 36 },
  scrollContent: { padding: 20, paddingBottom: 40 },

  timeRangeContainer: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 24 },
  timeRangeButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  timeRangeText: { fontSize: 14, fontWeight: '500' },

  summaryGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  summaryCard: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' },
  summaryValue: { fontSize: 28, fontWeight: '700', marginTop: 8 },
  summaryLabel: { fontSize: 11, marginTop: 4, textAlign: 'center' },

  featuredCard: { padding: 20, borderRadius: 16, marginBottom: 20, alignItems: 'center' },
  featuredLabel: { fontSize: 10, letterSpacing: 2, marginBottom: 12 },
  featuredMood: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featuredMoodDot: { width: 12, height: 12, borderRadius: 6 },
  featuredMoodText: { fontSize: 24, fontWeight: '600' },
  featuredDescription: { fontSize: 13, textAlign: 'center', marginTop: 12, lineHeight: 20 },

  section: { padding: 20, borderRadius: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },

  moodBarsContainer: { gap: 12 },
  moodBarContainer: { gap: 6 },
  moodBarLabel: { flexDirection: 'row', justifyContent: 'space-between' },
  moodName: { fontSize: 14, textTransform: 'capitalize' },
  moodCount: { fontSize: 12 },
  barBackground: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },

  energyHistory: { flexDirection: 'row', justifyContent: 'space-between' },
  energyDay: { alignItems: 'center', gap: 8 },
  energyDot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  energyDotText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  dayLabel: { fontSize: 11 },

  insightCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12, borderWidth: 1 },
  insightText: { flex: 1, fontSize: 13, lineHeight: 20 },
});
