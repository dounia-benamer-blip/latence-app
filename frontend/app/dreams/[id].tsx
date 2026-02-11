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
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const DREAM_TYPES: { [key: string]: { label: string; icon: string; color: string } } = {
  reve: { label: 'Rêve', icon: 'cloudy-night', color: '#3498DB' },
  cauchemar: { label: 'Cauchemar', icon: 'thunderstorm', color: '#E74C3C' },
  lucide: { label: 'Rêve Lucide', icon: 'eye', color: '#9B59B6' },
  recurrent: { label: 'Récurrent', icon: 'repeat', color: '#27AE60' },
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
  const { id } = useLocalSearchParams();
  const [dream, setDream] = useState<Dream | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
        
        // Save interpretation
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
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
        </View>
      </SafeAreaView>
    );
  }

  if (!dream) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Rêve introuvable</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const typeInfo = DREAM_TYPES[dream.dream_type] || DREAM_TYPES.reve;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détail du rêve</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Type Badge */}
        <Animated.View entering={FadeInUp.duration(500)} style={styles.typeContainer}>
          <View style={[styles.typeBadge, { backgroundColor: `${typeInfo.color}20` }]}>
            <Ionicons name={typeInfo.icon as any} size={24} color={typeInfo.color} />
            <Text style={[styles.typeText, { color: typeInfo.color }]}>{typeInfo.label}</Text>
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInUp.duration(500).delay(100)}>
          <Text style={styles.title}>{dream.title}</Text>
          <Text style={styles.date}>
            {format(new Date(dream.date), "EEEE d MMMM yyyy", { locale: fr })}
          </Text>
        </Animated.View>

        {/* Emotions */}
        <Animated.View entering={FadeInUp.duration(500).delay(200)} style={styles.emotionsContainer}>
          <Text style={styles.sectionLabel}>Émotions ressenties</Text>
          <View style={styles.emotionsList}>
            {dream.emotions.map((emotion, index) => (
              <View key={index} style={styles.emotionChip}>
                <Text style={styles.emotionText}>{emotion}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Dream Content */}
        <Animated.View entering={FadeInUp.duration(500).delay(300)} style={styles.contentCard}>
          <View style={styles.contentHeader}>
            <Ionicons name="document-text" size={18} color="#6C63FF" />
            <Text style={styles.contentTitle}>Le rêve</Text>
          </View>
          <Text style={styles.contentText}>{dream.content}</Text>
        </Animated.View>

        {/* Interpretation */}
        {dream.interpretation ? (
          <Animated.View entering={FadeInUp.duration(500).delay(400)} style={styles.interpretationCard}>
            <View style={styles.interpretationHeader}>
              <Ionicons name="bulb" size={20} color="#FFD700" />
              <Text style={styles.interpretationTitle}>Interprétation IA</Text>
            </View>
            <Text style={styles.interpretationText}>{dream.interpretation}</Text>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInUp.duration(500).delay(400)} style={styles.analyzeContainer}>
            <Text style={styles.analyzePrompt}>
              Tu n'as pas encore analysé ce rêve. Veux-tu découvrir sa signification ?
            </Text>
            <TouchableOpacity
              style={styles.analyzeButton}
              onPress={handleAnalyze}
              disabled={isAnalyzing}
              activeOpacity={0.8}
            >
              {isAnalyzing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={20} color="#fff" />
                  <Text style={styles.analyzeButtonText}>Analyser avec l'IA</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6a6a8a',
  },
  backLink: {
    color: '#6C63FF',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  typeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  typeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#6a6a8a',
    textAlign: 'center',
    textTransform: 'capitalize',
    marginBottom: 24,
  },
  emotionsContainer: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a0a0c0',
    marginBottom: 12,
  },
  emotionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emotionChip: {
    backgroundColor: '#6C63FF20',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6C63FF40',
  },
  emotionText: {
    fontSize: 13,
    color: '#6C63FF',
    fontWeight: '500',
  },
  contentCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6C63FF',
  },
  contentText: {
    fontSize: 15,
    color: '#e0e0f0',
    lineHeight: 24,
  },
  interpretationCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FFD70030',
  },
  interpretationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  interpretationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD700',
  },
  interpretationText: {
    fontSize: 14,
    color: '#a0a0c0',
    lineHeight: 24,
  },
  analyzeContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  analyzePrompt: {
    fontSize: 14,
    color: '#6a6a8a',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  analyzeButton: {
    backgroundColor: '#9B59B6',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
