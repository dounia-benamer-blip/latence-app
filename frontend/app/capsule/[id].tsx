import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Share,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface CapsuleDetail {
  id: string;
  title: string;
  content?: string;
  prompt_used?: string;
  duration_days: number;
  created_at: string;
  unlock_at: string;
  is_sealed: boolean;
  days_remaining?: number;
  share_link?: string;
}

export default function CapsuleDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [capsule, setCapsule] = useState<CapsuleDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCapsule();
  }, [id]);

  const fetchCapsule = async () => {
    try {
      const res = await fetch(`${API_URL}/api/capsule/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCapsule(data);
      }
    } catch (e) {
      console.log('Error fetching capsule:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!capsule) return;
    
    try {
      await Share.share({
        message: `🔮 Ma capsule temporelle "${capsule.title}" sera ouverte ${format(
          new Date(capsule.unlock_at),
          "'le' d MMMM yyyy",
          { locale: fr }
        )}. Rejoins-moi sur Journal Astral !`,
      });
    } catch (e) {
      console.log('Error sharing:', e);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!capsule) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Capsule introuvable</Text>
          <TouchableOpacity
            style={styles.backLink}
            onPress={() => router.back()}
          >
            <Text style={styles.backLinkText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color="#6C63FF" />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {capsule.is_sealed ? (
          /* Sealed Capsule View */
          <Animated.View entering={FadeInUp.duration(600)} style={styles.sealedContainer}>
            <View style={styles.sealedIcon}>
              <Ionicons name="lock-closed" size={50} color="#FFD700" />
            </View>
            
            <Text style={styles.sealedTitle}>{capsule.title}</Text>
            
            <View style={styles.sealedBadge}>
              <Ionicons name="time" size={18} color="#9B59B6" />
              <Text style={styles.sealedBadgeText}>
                {capsule.days_remaining} jours restants
              </Text>
            </View>
            
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Créée le</Text>
                <Text style={styles.infoValue}>
                  {format(new Date(capsule.created_at), "d MMMM yyyy", { locale: fr })}
                </Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ouverture le</Text>
                <Text style={styles.infoValue}>
                  {format(new Date(capsule.unlock_at), "d MMMM yyyy", { locale: fr })}
                </Text>
              </View>
            </View>
            
            <Text style={styles.sealedMessage}>
              Cette capsule est scellée et ne peut pas être ouverte avant la date prévue.
              Patience, le temps fait son œuvre... ✨
            </Text>
          </Animated.View>
        ) : (
          /* Unlocked Capsule View */
          <Animated.View entering={FadeInUp.duration(600)} style={styles.unlockedContainer}>
            <View style={styles.unlockedIcon}>
              <Ionicons name="sparkles" size={50} color="#4ECDC4" />
            </View>
            
            <Text style={styles.unlockedTitle}>{capsule.title}</Text>
            
            <View style={styles.unlockedBadge}>
              <Ionicons name="lock-open" size={18} color="#4ECDC4" />
              <Text style={styles.unlockedBadgeText}>Déverrouillée</Text>
            </View>
            
            {capsule.prompt_used && (
              <View style={styles.promptCard}>
                <Ionicons name="chatbubble-outline" size={16} color="#FFD700" />
                <Text style={styles.promptText}>{capsule.prompt_used}</Text>
              </View>
            )}
            
            <View style={styles.contentCard}>
              <Text style={styles.contentText}>{capsule.content}</Text>
            </View>
            
            <View style={styles.metaCard}>
              <Text style={styles.metaText}>
                Scellée le {format(new Date(capsule.created_at), "d MMMM yyyy", { locale: fr })}
              </Text>
              <Text style={styles.metaText}>
                Ouverte {formatDistanceToNow(new Date(capsule.unlock_at), {
                  addSuffix: true,
                  locale: fr,
                })}
              </Text>
            </View>
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
  loadingText: {
    fontSize: 16,
    color: '#6a6a8a',
  },
  backLink: {
    marginTop: 20,
  },
  backLinkText: {
    color: '#6C63FF',
    fontSize: 14,
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
  shareButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C63FF20',
    borderRadius: 20,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sealedContainer: {
    alignItems: 'center',
  },
  sealedIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFD70020',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  sealedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  sealedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#9B59B620',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  sealedBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9B59B6',
  },
  infoCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6a6a8a',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#2a2a4e',
    marginVertical: 16,
  },
  sealedMessage: {
    fontSize: 14,
    color: '#a0a0c0',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  unlockedContainer: {
    alignItems: 'center',
  },
  unlockedIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4ECDC420',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  unlockedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  unlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#4ECDC420',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  unlockedBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  promptCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  promptText: {
    flex: 1,
    fontSize: 14,
    color: '#FFD700',
    fontStyle: 'italic',
  },
  contentCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    marginBottom: 16,
  },
  contentText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 26,
  },
  metaCard: {
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6a6a8a',
  },
});
