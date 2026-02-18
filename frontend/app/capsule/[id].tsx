import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Share,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../../src/context/ThemeContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

function safeDateFormat(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch { return dateStr; }
}

function timeAgo(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const diff = Date.now() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "aujourd'hui";
    if (days === 1) return 'hier';
    if (days < 30) return `il y a ${days} jours`;
    if (days < 365) return `il y a ${Math.floor(days / 30)} mois`;
    return `il y a ${Math.floor(days / 365)} ans`;
  } catch { return ''; }
}

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
}

export default function CapsuleDetailScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { id } = useLocalSearchParams();
  const [capsule, setCapsule] = useState<CapsuleDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const ds = {
    container: { backgroundColor: theme.background },
    card: { backgroundColor: theme.card },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    textMuted: { color: theme.textMuted },
  };

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
        message: `Ma capsule "${capsule.title}" sera ouverte le ${safeDateFormat(capsule.unlock_at)}.`,
      });
    } catch (e) {
      console.log('Error sharing:', e);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, ds.container]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, ds.textMuted]}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!capsule) {
    return (
      <SafeAreaView style={[styles.container, ds.container]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, ds.textMuted]}>Capsule introuvable</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backLink, { color: theme.accent }]}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, ds.container]}>
      <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.iconColor} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={22} color={theme.accent} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {capsule.is_sealed ? (
          <Animated.View entering={FadeInUp.duration(600)} style={styles.sealedContainer}>
            <View style={[styles.sealedIcon, ds.card]}>
              <Ionicons name="lock-closed" size={40} color={theme.accentWarm} />
            </View>
            
            <Text style={[styles.sealedTitle, ds.text]}>{capsule.title}</Text>
            
            <View style={[styles.sealedBadge, { backgroundColor: `${theme.accentWarm}20` }]}>
              <Text style={[styles.sealedBadgeText, { color: theme.accentWarm }]}>
                {capsule.days_remaining} jours restants
              </Text>
            </View>
            
            <View style={[styles.infoCard, ds.card]}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, ds.textMuted]}>Déposée</Text>
                <Text style={[styles.infoValue, ds.text]}>
                  {safeDateFormat(capsule.created_at)}
                </Text>
              </View>
              <View style={[styles.infoDivider, { backgroundColor: theme.border }]} />
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, ds.textMuted]}>Ouverture</Text>
                <Text style={[styles.infoValue, ds.text]}>
                  {safeDateFormat(capsule.unlock_at)}
                </Text>
              </View>
            </View>
            
            <Text style={[styles.sealedMessage, ds.textMuted]}>
              Patience, le temps fait son œuvre...
            </Text>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInUp.duration(600)} style={styles.unlockedContainer}>
            <View style={[styles.unlockedIcon, ds.card]}>
              <Ionicons name="lock-open" size={40} color={theme.accent} />
            </View>
            
            <Text style={[styles.unlockedTitle, ds.text]}>{capsule.title}</Text>
            
            {capsule.prompt_used && (
              <View style={[styles.promptCard, { backgroundColor: theme.cardSelected, borderColor: theme.border }]}>
                <Text style={[styles.promptText, ds.textSecondary]}>{capsule.prompt_used}</Text>
              </View>
            )}
            
            <View style={[styles.contentCard, ds.card]}>
              <Text style={[styles.contentText, ds.text]}>{capsule.content}</Text>
            </View>
            
            <Text style={[styles.metaText, ds.textMuted]}>
              Déposée {timeAgo(capsule.created_at)}
            </Text>
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
  loadingText: {
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
  shareButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  sealedContainer: {
    alignItems: 'center',
  },
  sealedIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sealedTitle: {
    fontSize: 24,
    fontWeight: '300',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  sealedBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 32,
  },
  sealedBadgeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  infoCard: {
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  infoDivider: {
    height: 1,
    marginVertical: 16,
  },
  sealedMessage: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  unlockedContainer: {
    alignItems: 'center',
  },
  unlockedIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  unlockedTitle: {
    fontSize: 24,
    fontWeight: '300',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  promptCard: {
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
  },
  promptText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  contentCard: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
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
  metaText: {
    fontSize: 12,
  },
});
