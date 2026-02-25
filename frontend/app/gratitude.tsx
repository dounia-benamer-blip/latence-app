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

interface GratitudeEntry {
  id: string;
  date: string;
  items: string[];
  reflection?: string;
}

export default function GratitudeScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [items, setItems] = useState<string[]>(['', '', '']);
  const [reflection, setReflection] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [todayEntry, setTodayEntry] = useState<GratitudeEntry | null>(null);
  const [weekEntries, setWeekEntries] = useState<GratitudeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const ds = {
    container: { backgroundColor: theme.background },
    card: { backgroundColor: theme.card },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    textMuted: { color: theme.textMuted },
  };

  useEffect(() => {
    fetchGratitudeData();
  }, []);

  const fetchGratitudeData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/gratitude/today`);
      if (res.ok) {
        const data = await res.json();
        if (data.id) {
          setTodayEntry(data);
          setItems(data.items.length >= 3 ? data.items : [...data.items, ...Array(3 - data.items.length).fill('')]);
          setReflection(data.reflection || '');
        }
      }
      
      const weekRes = await fetch(`${API_URL}/api/gratitude/week`);
      if (weekRes.ok) {
        const weekData = await weekRes.json();
        setWeekEntries(weekData);
      }
    } catch (e) {
      console.log('Error fetching gratitude:', e);
    } finally {
      setLoading(false);
    }
  };

  const updateItem = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);
  };

  const handleSave = async () => {
    const validItems = items.filter(i => i.trim());
    if (validItems.length === 0) return;
    
    setIsSaving(true);

    try {
      const res = await fetch(`${API_URL}/api/gratitude`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: validItems,
          reflection: reflection.trim() || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTodayEntry(data);
        fetchGratitudeData();
      }
    } catch (e) {
      console.log('Error saving gratitude:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days[date.getDay()];
  };

  const hasContent = items.some(i => i.trim());

  return (
    <SafeAreaView style={[styles.container, ds.container]}>
      <TwinklingStars density={isDark ? 30 : 15} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-down" size={28} color={theme.iconColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, ds.text]}>Gratitudes</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.accentWarm} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Today's Gratitude */}
            <Animated.View entering={FadeInUp.duration(500)}>
              <View style={styles.iconContainer}>
                <View style={[styles.iconCircle, { backgroundColor: `${theme.accentWarm}20` }]}>
                  <Ionicons name="heart-outline" size={40} color={theme.accentWarm} />
                </View>
              </View>
              
              <Text style={[styles.title, ds.text]}>3 gratitudes du jour</Text>
              <Text style={[styles.subtitle, ds.textMuted]}>Pour quoi es-tu reconnaissant(e) aujourd'hui ?</Text>

              {/* Gratitude Inputs */}
              {items.map((item, index) => (
                <Animated.View 
                  key={index} 
                  entering={FadeInUp.duration(400).delay(index * 100)}
                  style={[styles.inputRow, ds.card]}
                >
                  <View style={[styles.numberBadge, { backgroundColor: theme.accentWarm }]}>
                    <Text style={styles.numberText}>{index + 1}</Text>
                  </View>
                  <TextInput
                    style={[styles.input, ds.text]}
                    placeholder={
                      index === 0 ? "Un petit bonheur..." :
                      index === 1 ? "Une personne..." :
                      "Un moment..."
                    }
                    placeholderTextColor={theme.textMuted}
                    value={item}
                    onChangeText={(v) => updateItem(index, v)}
                    multiline
                  />
                </Animated.View>
              ))}

              {/* Optional Reflection */}
              <Text style={[styles.reflectionLabel, ds.textMuted]}>Réflexion (optionnel)</Text>
              <TextInput
                style={[styles.reflectionInput, ds.card, ds.text]}
                placeholder="Qu'est-ce que ces gratitudes t'apportent ?"
                placeholderTextColor={theme.textMuted}
                value={reflection}
                onChangeText={setReflection}
                multiline
              />

              {/* Save Button */}
              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  { backgroundColor: theme.accentWarm },
                  !hasContent && styles.saveBtnDisabled
                ]}
                onPress={handleSave}
                disabled={!hasContent || isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="heart" size={20} color="#fff" />
                    <Text style={styles.saveBtnText}>
                      {todayEntry ? 'Mettre à jour' : 'Enregistrer'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Week Overview */}
            {weekEntries.length > 0 && (
              <Animated.View entering={FadeInUp.duration(500).delay(300)} style={styles.weekSection}>
                <Text style={[styles.weekTitle, ds.text]}>Cette semaine</Text>
                <Text style={[styles.weekSubtitle, ds.textMuted]}>
                  {weekEntries.length} jour{weekEntries.length > 1 ? 's' : ''} de gratitude
                </Text>
                
                <View style={styles.weekGrid}>
                  {weekEntries.slice(0, 7).map((entry, i) => (
                    <View key={i} style={[styles.weekDay, ds.card]}>
                      <Text style={[styles.weekDayLabel, ds.textMuted]}>{formatDate(entry.date)}</Text>
                      <Ionicons name="heart" size={18} color={theme.accentWarm} />
                      <Text style={[styles.weekDayCount, { color: theme.accentWarm }]}>
                        {entry.items.length}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Recent Gratitudes */}
                <View style={styles.recentSection}>
                  <Text style={[styles.recentTitle, ds.textSecondary]}>Gratitudes récentes</Text>
                  {weekEntries.slice(0, 3).flatMap(e => e.items.slice(0, 2)).slice(0, 5).map((item, i) => (
                    <View key={i} style={styles.recentItem}>
                      <Ionicons name="heart-outline" size={14} color={theme.accentWarm} />
                      <Text style={[styles.recentText, ds.textSecondary]} numberOfLines={1}>{item}</Text>
                    </View>
                  ))}
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
  
  iconContainer: { alignItems: 'center', marginBottom: 20 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  iconEmoji: { fontSize: 40 },
  
  title: { fontSize: 24, fontWeight: '600', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  
  inputRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, borderRadius: 16, marginBottom: 12 },
  numberBadge: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 2 },
  numberText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  input: { flex: 1, fontSize: 15, minHeight: 40 },
  
  reflectionLabel: { fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginTop: 16, marginBottom: 10 },
  reflectionInput: { padding: 16, borderRadius: 16, minHeight: 80, textAlignVertical: 'top', fontSize: 15 },
  
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 30, marginTop: 24, gap: 10 },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  
  weekSection: { marginTop: 40 },
  weekTitle: { fontSize: 18, fontWeight: '600' },
  weekSubtitle: { fontSize: 13, marginTop: 4, marginBottom: 16 },
  weekGrid: { flexDirection: 'row', gap: 8 },
  weekDay: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center' },
  weekDayLabel: { fontSize: 11, marginBottom: 4 },
  weekDayEmoji: { fontSize: 18 },
  weekDayCount: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  
  recentSection: { marginTop: 24 },
  recentTitle: { fontSize: 14, fontWeight: '500', marginBottom: 12 },
  recentItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  recentText: { fontSize: 14, marginLeft: 10, flex: 1 },
});
