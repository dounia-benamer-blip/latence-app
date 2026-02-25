import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import { TwinklingStars } from '../src/components/TwinklingStars';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const SLEEP_QUALITIES = [
  { id: 1, label: 'Très mauvaise', icon: 'cloudy-night-outline', color: '#E74C3C' },
  { id: 2, label: 'Mauvaise', icon: 'partly-sunny-outline', color: '#E67E22' },
  { id: 3, label: 'Moyenne', icon: 'sunny-outline', color: '#F1C40F' },
  { id: 4, label: 'Bonne', icon: 'moon-outline', color: '#27AE60' },
  { id: 5, label: 'Excellente', icon: 'bed-outline', color: '#3498DB' },
];

const HOURS = ['4h', '5h', '6h', '7h', '8h', '9h', '10h', '11h', '12h'];

interface SleepEntry {
  id: string;
  date: string;
  quality: number;
  hours: string;
  notes?: string;
  woke_up_naturally: boolean;
  had_dreams: boolean;
}

export default function SleepTrackerScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [quality, setQuality] = useState<number | null>(null);
  const [hours, setHours] = useState<string>('7h');
  const [notes, setNotes] = useState('');
  const [wokeNaturally, setWokeNaturally] = useState<boolean | null>(null);
  const [hadDreams, setHadDreams] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [todayEntry, setTodayEntry] = useState<SleepEntry | null>(null);
  const [weekStats, setWeekStats] = useState<SleepEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const ds = {
    container: { backgroundColor: theme.background },
    card: { backgroundColor: theme.card },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    textMuted: { color: theme.textMuted },
  };

  useEffect(() => {
    fetchSleepData();
  }, []);

  const fetchSleepData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/sleep/today`);
      if (res.ok) {
        const data = await res.json();
        if (data.id) {
          setTodayEntry(data);
          setQuality(data.quality);
          setHours(data.hours);
          setNotes(data.notes || '');
          setWokeNaturally(data.woke_up_naturally);
          setHadDreams(data.had_dreams);
        }
      }
      
      const weekRes = await fetch(`${API_URL}/api/sleep/week`);
      if (weekRes.ok) {
        const weekData = await weekRes.json();
        setWeekStats(weekData);
      }
    } catch (e) {
      console.log('Error fetching sleep data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (quality === null) return;
    setIsSaving(true);

    try {
      const res = await fetch(`${API_URL}/api/sleep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quality,
          hours,
          notes: notes.trim() || null,
          woke_up_naturally: wokeNaturally,
          had_dreams: hadDreams,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTodayEntry(data);
        fetchSleepData();
      }
    } catch (e) {
      console.log('Error saving sleep:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const getAverageQuality = () => {
    if (weekStats.length === 0) return 0;
    const sum = weekStats.reduce((acc, s) => acc + s.quality, 0);
    return (sum / weekStats.length).toFixed(1);
  };

  const getAverageHours = () => {
    if (weekStats.length === 0) return '0h';
    const sum = weekStats.reduce((acc, s) => acc + parseInt(s.hours), 0);
    return `${(sum / weekStats.length).toFixed(1)}h`;
  };

  return (
    <SafeAreaView style={[styles.container, ds.container]}>
      <TwinklingStars density={isDark ? 30 : 15} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-down" size={28} color={theme.iconColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, ds.text]}>Suivi du Sommeil</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.accentWarm} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Today's Sleep */}
            <Animated.View entering={FadeInUp.duration(500)}>
              <Text style={[styles.sectionTitle, ds.text]}>Comment était ta nuit ?</Text>
              
              {/* Quality */}
              <View style={styles.qualityGrid}>
                {SLEEP_QUALITIES.map((q) => (
                  <TouchableOpacity
                    key={q.id}
                    style={[
                      styles.qualityCard,
                      ds.card,
                      quality === q.id && { backgroundColor: q.color, borderColor: q.color }
                    ]}
                    onPress={() => setQuality(q.id)}
                  >
                    <Ionicons name={q.icon as any} size={28} color={quality === q.id ? '#fff' : q.color} />
                    <Text style={[
                      styles.qualityLabel,
                      { color: quality === q.id ? '#fff' : theme.textSecondary }
                    ]}>
                      {q.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Hours */}
              <Text style={[styles.label, ds.textMuted]}>Heures de sommeil</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hoursScroll}>
                {HOURS.map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[
                      styles.hourChip,
                      ds.card,
                      hours === h && { backgroundColor: theme.accent }
                    ]}
                    onPress={() => setHours(h)}
                  >
                    <Text style={[
                      styles.hourText,
                      { color: hours === h ? '#fff' : theme.text }
                    ]}>
                      {h}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Quick questions */}
              <View style={styles.questionsRow}>
                <View style={styles.questionBox}>
                  <Text style={[styles.questionText, ds.textSecondary]}>Réveil naturel ?</Text>
                  <View style={styles.yesNoRow}>
                    <TouchableOpacity
                      style={[styles.yesNoBtn, wokeNaturally === true && { backgroundColor: theme.accent }]}
                      onPress={() => setWokeNaturally(true)}
                    >
                      <Text style={[styles.yesNoText, wokeNaturally === true && { color: '#fff' }]}>Oui</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.yesNoBtn, wokeNaturally === false && { backgroundColor: theme.accent }]}
                      onPress={() => setWokeNaturally(false)}
                    >
                      <Text style={[styles.yesNoText, wokeNaturally === false && { color: '#fff' }]}>Non</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.questionBox}>
                  <Text style={[styles.questionText, ds.textSecondary]}>Des rêves ?</Text>
                  <View style={styles.yesNoRow}>
                    <TouchableOpacity
                      style={[styles.yesNoBtn, hadDreams === true && { backgroundColor: theme.accent }]}
                      onPress={() => setHadDreams(true)}
                    >
                      <Text style={[styles.yesNoText, hadDreams === true && { color: '#fff' }]}>Oui</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.yesNoBtn, hadDreams === false && { backgroundColor: theme.accent }]}
                      onPress={() => setHadDreams(false)}
                    >
                      <Text style={[styles.yesNoText, hadDreams === false && { color: '#fff' }]}>Non</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Notes */}
              <TextInput
                style={[styles.notesInput, ds.card, ds.text]}
                placeholder="Notes (optionnel)..."
                placeholderTextColor={theme.textMuted}
                value={notes}
                onChangeText={setNotes}
                multiline
              />

              {/* Save Button */}
              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  { backgroundColor: theme.accentWarm },
                  quality === null && styles.saveBtnDisabled
                ]}
                onPress={handleSave}
                disabled={quality === null || isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="moon" size={20} color="#fff" />
                    <Text style={styles.saveBtnText}>
                      {todayEntry ? 'Mettre à jour' : 'Enregistrer'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Week Stats */}
            {weekStats.length > 0 && (
              <Animated.View entering={FadeInUp.duration(500).delay(200)} style={styles.statsSection}>
                <Text style={[styles.sectionTitle, ds.text]}>Cette semaine</Text>
                
                <View style={styles.statsRow}>
                  <View style={[styles.statCard, ds.card]}>
                    <Text style={[styles.statNumber, { color: theme.accentWarm }]}>{getAverageQuality()}</Text>
                    <Text style={[styles.statLabel, ds.textMuted]}>Qualité moy.</Text>
                  </View>
                  <View style={[styles.statCard, ds.card]}>
                    <Text style={[styles.statNumber, { color: theme.accent }]}>{getAverageHours()}</Text>
                    <Text style={[styles.statLabel, ds.textMuted]}>Heures moy.</Text>
                  </View>
                  <View style={[styles.statCard, ds.card]}>
                    <Text style={[styles.statNumber, { color: theme.accentWarm }]}>{weekStats.length}</Text>
                    <Text style={[styles.statLabel, ds.textMuted]}>Nuits</Text>
                  </View>
                </View>

                {/* Mini calendar */}
                <View style={styles.miniCalendar}>
                  {weekStats.slice(0, 7).map((entry, i) => {
                    const q = SLEEP_QUALITIES.find(sq => sq.id === entry.quality);
                    return (
                      <View key={i} style={styles.miniDay}>
                        <Text style={styles.miniEmoji}>{q?.emoji || '😐'}</Text>
                        <Text style={[styles.miniHours, ds.textMuted]}>{entry.hours}</Text>
                      </View>
                    );
                  })}
                </View>
              </Animated.View>
            )}
          </>
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
  
  sectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 16 },
  label: { fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginTop: 20, marginBottom: 12 },
  
  qualityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  qualityCard: { width: '30%', flexGrow: 1, padding: 14, borderRadius: 16, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  qualityEmoji: { fontSize: 28, marginBottom: 6 },
  qualityLabel: { fontSize: 12, textAlign: 'center' },
  
  hoursScroll: { marginBottom: 16 },
  hourChip: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, marginRight: 10 },
  hourText: { fontSize: 16, fontWeight: '600' },
  
  questionsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  questionBox: { flex: 1 },
  questionText: { fontSize: 14, marginBottom: 8 },
  yesNoRow: { flexDirection: 'row', gap: 8 },
  yesNoBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.05)' },
  yesNoText: { fontSize: 14, fontWeight: '500' },
  
  notesInput: { marginTop: 20, padding: 16, borderRadius: 16, minHeight: 80, textAlignVertical: 'top', fontSize: 15 },
  
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 30, marginTop: 24, gap: 10 },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  
  statsSection: { marginTop: 40 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: '700' },
  statLabel: { fontSize: 11, textTransform: 'uppercase', marginTop: 4 },
  
  miniCalendar: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  miniDay: { alignItems: 'center' },
  miniEmoji: { fontSize: 20 },
  miniHours: { fontSize: 11, marginTop: 4 },
});
