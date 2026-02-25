import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import { TwinklingStars } from '../src/components/TwinklingStars';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface SoulReport {
  id: string;
  period: string;
  generated_at: string;
  summary: string;
  emotional_journey: string;
  dominant_themes: string[];
  growth_areas: string[];
  dream_insights: string;
  recommended_focus: string;
  affirmation: string;
  mood_distribution: Record<string, number>;
}

export default function SoulReportScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<SoulReport | null>(null);
  const [reports, setReports] = useState<SoulReport[]>([]);

  const ds = {
    container: { backgroundColor: theme.background },
    card: { backgroundColor: theme.card },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    textMuted: { color: theme.textMuted },
  };

  useEffect(() => {
    fetchLatestReport();
    fetchAllReports();
  }, []);

  const fetchLatestReport = async () => {
    try {
      const response = await fetch(`${API_URL}/api/soul-report/latest`);
      if (response.ok) {
        const data = await response.json();
        setReport(data);
      }
    } catch (error) {
      console.error('Error fetching soul report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllReports = async () => {
    try {
      const response = await fetch(`${API_URL}/api/soul-reports`);
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const generateNewReport = async () => {
    setGenerating(true);
    try {
      const response = await fetch(`${API_URL}/api/soul-report/generate?lang=fr`, {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        setReport(data);
        fetchAllReports();
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getMoodIcon = (mood: string) => {
    const icons: Record<string, string> = {
      serein: 'leaf-outline', joyeux: 'sunny-outline', reveur: 'moon-outline', melancolique: 'rainy-outline',
      fatigue: 'bed-outline', inspire: 'sparkles-outline', anxieux: 'pulse-outline', nostalgique: 'time-outline',
      perdu: 'compass-outline', reconnaissant: 'heart-outline', contemplatif: 'eye-outline', eveille: 'flash-outline'
    };
    return icons[mood] || 'sparkles-outline';
  };

  return (
    <SafeAreaView style={[styles.container, ds.container]}>
      <TwinklingStars density={isDark ? 40 : 20} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-down" size={28} color={theme.iconColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, ds.text]}>Rapport de l'Âme</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.accentWarm} />
            <Text style={[styles.loadingText, ds.textMuted]}>Chargement...</Text>
          </View>
        ) : report ? (
          <>
            {/* Current Report Card */}
            <Animated.View entering={FadeInUp.duration(600)} style={[styles.reportCard, ds.card]}>
              <View style={styles.reportHeader}>
                <View style={[styles.reportIcon, { backgroundColor: `${theme.accentWarm}20` }]}>
                  <Ionicons name="sparkles-outline" size={28} color={theme.accentWarm} />
                </View>
                <View style={styles.reportMeta}>
                  <Text style={[styles.reportPeriod, ds.text]}>{report.period}</Text>
                  <Text style={[styles.reportDate, ds.textMuted]}>{formatDate(report.generated_at)}</Text>
                </View>
              </View>

              {/* Summary */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, ds.text]}>
                  <Ionicons name="heart-outline" size={16} /> Résumé
                </Text>
                <Text style={[styles.sectionContent, ds.textSecondary]}>{report.summary}</Text>
              </View>

              {/* Emotional Journey */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, ds.text]}>
                  <Ionicons name="analytics-outline" size={16} /> Parcours émotionnel
                </Text>
                <Text style={[styles.sectionContent, ds.textSecondary]}>{report.emotional_journey}</Text>
              </View>

              {/* Mood Distribution */}
              {report.mood_distribution && Object.keys(report.mood_distribution).length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, ds.text]}>
                    <Ionicons name="pie-chart-outline" size={16} /> Distribution des humeurs
                  </Text>
                  <View style={styles.moodGrid}>
                    {Object.entries(report.mood_distribution).slice(0, 6).map(([mood, count]) => (
                      <View key={mood} style={[styles.moodBadge, { backgroundColor: `${theme.accent}15` }]}>
                        <Ionicons name={getMoodIcon(mood) as any} size={16} color={theme.accent} />
                        <Text style={[styles.moodLabel, ds.textSecondary]}>{mood}</Text>
                        <Text style={[styles.moodCount, { color: theme.accentWarm }]}>{count}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Dominant Themes */}
              {report.dominant_themes && report.dominant_themes.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, ds.text]}>
                    <Ionicons name="bulb-outline" size={16} /> Thèmes dominants
                  </Text>
                  <View style={styles.tagsContainer}>
                    {report.dominant_themes.map((theme_item, idx) => (
                      <View key={idx} style={[styles.tag, { backgroundColor: `${theme.accentWarm}20` }]}>
                        <Text style={[styles.tagText, { color: theme.accentWarm }]}>{theme_item}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Dream Insights */}
              {report.dream_insights && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, ds.text]}>
                    <Ionicons name="moon-outline" size={16} /> Éclairages oniriques
                  </Text>
                  <Text style={[styles.sectionContent, ds.textSecondary]}>{report.dream_insights}</Text>
                </View>
              )}

              {/* Growth Areas */}
              {report.growth_areas && report.growth_areas.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, ds.text]}>
                    <Ionicons name="trending-up-outline" size={16} /> Pistes de croissance
                  </Text>
                  {report.growth_areas.map((area, idx) => (
                    <View key={idx} style={styles.growthItem}>
                      <Ionicons name="leaf-outline" size={14} color={theme.accent} />
                      <Text style={[styles.growthText, ds.textSecondary]}>{area}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Recommended Focus */}
              {report.recommended_focus && (
                <View style={[styles.focusCard, { backgroundColor: `${theme.accent}10` }]}>
                  <Ionicons name="compass-outline" size={20} color={theme.accent} />
                  <View style={styles.focusContent}>
                    <Text style={[styles.focusLabel, ds.textMuted]}>Focus recommandé</Text>
                    <Text style={[styles.focusText, ds.text]}>{report.recommended_focus}</Text>
                  </View>
                </View>
              )}

              {/* Affirmation */}
              {report.affirmation && (
                <View style={[styles.affirmationCard, { borderLeftColor: theme.accentWarm }]}>
                  <Text style={[styles.affirmationLabel, ds.textMuted]}>Affirmation</Text>
                  <Text style={[styles.affirmationText, ds.text]}>"{report.affirmation}"</Text>
                </View>
              )}
            </Animated.View>

            {/* Generate New Report */}
            <Animated.View entering={FadeInUp.duration(600).delay(200)}>
              <TouchableOpacity
                style={[styles.generateButton, { backgroundColor: theme.accentWarm }]}
                onPress={generateNewReport}
                disabled={generating}
              >
                {generating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={20} color="#fff" />
                    <Text style={styles.generateButtonText}>Générer un nouveau rapport</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Previous Reports */}
            {reports.length > 1 && (
              <Animated.View entering={FadeInUp.duration(600).delay(300)}>
                <Text style={[styles.historyTitle, ds.text]}>Rapports précédents</Text>
                {reports.slice(1, 5).map((r, idx) => (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.historyCard, ds.card]}
                    onPress={() => setReport(r)}
                  >
                    <Text style={[styles.historyPeriod, ds.text]}>{r.period}</Text>
                    <Text style={[styles.historyDate, ds.textMuted]}>{formatDate(r.generated_at)}</Text>
                  </TouchableOpacity>
                ))}
              </Animated.View>
            )}
          </>
        ) : (
          /* No Report Yet */
          <Animated.View entering={FadeIn.duration(600)} style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: `${theme.accentWarm}15` }]}>
              <Ionicons name="leaf-outline" size={48} color={theme.accentWarm} />
            </View>
            <Text style={[styles.emptyTitle, ds.text]}>Aucun rapport encore</Text>
            <Text style={[styles.emptySubtitle, ds.textSecondary]}>Génère ton premier rapport de l'âme pour obtenir un aperçu de ton parcours émotionnel</Text>
            
            <TouchableOpacity
              style={[styles.generateButton, { backgroundColor: theme.accentWarm }]}
              onPress={generateNewReport}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={20} color="#fff" />
                  <Text style={styles.generateButtonText}>Générer mon premier rapport</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  backButton: { width: 40 },
  headerTitle: { fontSize: 20, fontWeight: '600', letterSpacing: 1 },
  placeholder: { width: 40 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  loadingText: { marginTop: 12, fontSize: 14 },
  
  reportCard: { borderRadius: 20, padding: 24, marginBottom: 20 },
  reportHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  reportIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  reportMeta: { marginLeft: 16, flex: 1 },
  reportPeriod: { fontSize: 18, fontWeight: '600' },
  reportDate: { fontSize: 13, marginTop: 2 },
  
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  sectionContent: { fontSize: 15, lineHeight: 24 },
  
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  moodBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 6 },
  moodLabel: { fontSize: 13, marginRight: 6 },
  moodCount: { fontSize: 13, fontWeight: '600' },
  
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  tagText: { fontSize: 13, fontWeight: '500' },
  
  growthItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  growthText: { fontSize: 14, lineHeight: 22, marginLeft: 10, flex: 1 },
  
  focusCard: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, borderRadius: 16, marginTop: 8 },
  focusContent: { marginLeft: 12, flex: 1 },
  focusLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  focusText: { fontSize: 15, lineHeight: 22 },
  
  affirmationCard: { borderLeftWidth: 3, paddingLeft: 16, marginTop: 16, paddingVertical: 8 },
  affirmationLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  affirmationText: { fontSize: 16, fontStyle: 'italic', lineHeight: 24 },
  
  generateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 30, marginBottom: 24, gap: 10 },
  generateButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  
  historyTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, marginTop: 8 },
  historyCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 10 },
  historyPeriod: { fontSize: 14, fontWeight: '500' },
  historyDate: { fontSize: 12 },
  
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '600', marginBottom: 10 },
  emptySubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, paddingHorizontal: 40, marginBottom: 30 },
});
