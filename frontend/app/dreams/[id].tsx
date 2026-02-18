import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../../src/context/ThemeContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

function formatDreamDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return '';
  }
}

const DREAM_TYPES: { [key: string]: { label: string; icon: string } } = {
  reve: { label: 'Rêve', icon: 'cloudy-night-outline' },
  cauchemar: { label: 'Cauchemar', icon: 'thunderstorm-outline' },
  lucide: { label: 'Lucide', icon: 'eye-outline' },
  recurrent: { label: 'Récurrent', icon: 'repeat-outline' },
};

interface Dream {
  id: string;
  title: string;
  content: string;
  dream_type: string;
  emotions: string[];
  interpretation?: string;
  date: string;
}

export default function DreamDetailScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { id } = useLocalSearchParams();
  const [dream, setDream] = useState<Dream | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const ds = {
    container: { backgroundColor: theme.background },
    card: { backgroundColor: theme.card },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    textMuted: { color: theme.textMuted },
  };

  useEffect(() => {
    fetchDream();
  }, [id]);

  const fetchDream = async () => {
    try {
      const res = await fetch(`${API_URL}/api/dream/${id}`);
      if (res.ok) {
        const data = await res.json();
        setDream(data);
      }
    } catch (e) {
      console.log('Error fetching dream:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!dream) return;
    
    setIsAnalyzing(true);
    try {
      const res = await fetch(`${API_URL}/api/dream/interpret`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dream_content: dream.content,
          dream_type: dream.dream_type,
          emotions: dream.emotions,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        
        await fetch(`${API_URL}/api/dream/${dream.id}/interpretation`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data.interpretation),
        });
        
        setDream({ ...dream, interpretation: data.interpretation });
      }
    } catch (e) {
      console.log('Error interpreting dream:', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, ds.container]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!dream) {
    return (
      <SafeAreaView style={[styles.container, ds.container]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.errorText, ds.textMuted]}>Rêve introuvable</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backLink, { color: theme.accent }]}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const typeInfo = DREAM_TYPES[dream.dream_type] || DREAM_TYPES.reve;

  return (
    <SafeAreaView style={[styles.container, ds.container]}>
      <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.iconColor} />
        </TouchableOpacity>
        <View style={styles.placeholder} />
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.duration(500)} style={styles.typeContainer}>
          <View style={[styles.typeBadge, ds.card]}>
            <Ionicons name={typeInfo.icon as any} size={20} color={theme.textSecondary} />
            <Text style={[styles.typeText, ds.text]}>{typeInfo.label}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(100)}>
          <Text style={[styles.title, ds.text]}>{dream.title}</Text>
          <Text style={[styles.date, ds.textMuted]}>
            {formatDreamDate(dream.date)}
          </Text>
        </Animated.View>

        {dream.emotions.length > 0 && (
          <Animated.View entering={FadeInUp.duration(500).delay(200)} style={styles.emotionsContainer}>
            {dream.emotions.map((emotion, index) => (
              <View key={index} style={[styles.emotionChip, ds.card]}>
                <Text style={[styles.emotionText, ds.textSecondary]}>{emotion}</Text>
              </View>
            ))}
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.duration(500).delay(300)} style={[styles.contentCard, ds.card]}>
          <Text style={[styles.contentText, ds.text]}>{dream.content}</Text>
        </Animated.View>

        {dream.interpretation ? (
          <Animated.View entering={FadeInUp.duration(500).delay(400)} style={[styles.interpretationCard, { backgroundColor: theme.cardSelected, borderColor: theme.border }]}>
            <Text style={[styles.interpretationTitle, ds.text]}>Interprétation</Text>
            <Text style={[styles.interpretationText, ds.textSecondary]}>{dream.interpretation}</Text>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInUp.duration(500).delay(400)} style={styles.analyzeContainer}>
            <Text style={[styles.analyzePrompt, ds.textMuted]}>
              Découvrir la signification de ce rêve ?
            </Text>
            <TouchableOpacity
              style={[styles.analyzeButton, { backgroundColor: theme.accentSoft }]}
              onPress={handleAnalyze}
              disabled={isAnalyzing}
              activeOpacity={0.8}
            >
              {isAnalyzing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.analyzeButtonText}>Interpréter</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 14,
  },
  backLink: {
    fontSize: 14,
    marginTop: 16,
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
  placeholder: {
    width: 40,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  typeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  title: {
    fontSize: 26,
    fontWeight: '300',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  date: {
    fontSize: 13,
    textAlign: 'center',
    textTransform: 'capitalize',
    marginBottom: 24,
  },
  emotionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  emotionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  emotionText: {
    fontSize: 13,
  },
  contentCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  contentText: {
    fontSize: 15,
    lineHeight: 24,
  },
  interpretationCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
  },
  interpretationTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
  },
  interpretationText: {
    fontSize: 14,
    lineHeight: 22,
  },
  analyzeContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  analyzePrompt: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  analyzeButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
