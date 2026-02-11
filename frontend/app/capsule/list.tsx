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
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Capsule {
  id: string;
  title: string;
  content?: string;
  duration_days: number;
  created_at: string;
  unlock_at: string;
  is_sealed: boolean;
  days_remaining?: number;
}

export default function CapsuleListScreen() {
  const router = useRouter();
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCapsules = async () => {
    try {
      const res = await fetch(`${API_URL}/api/capsules`);
      if (res.ok) {
        const data = await res.json();
        
        // Check each capsule's status
        const capsuleDetails = await Promise.all(
          data.map(async (c: Capsule) => {
            const detailRes = await fetch(`${API_URL}/api/capsule/${c.id}`);
            if (detailRes.ok) {
              return await detailRes.json();
            }
            return c;
          })
        );
        
        setCapsules(capsuleDetails);
      }
    } catch (e) {
      console.log('Error fetching capsules:', e);
    }
  };

  useEffect(() => {
    fetchCapsules();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCapsules();
    setRefreshing(false);
  };

  const getDurationLabel = (days: number) => {
    if (days === 7) return '7 jours';
    if (days === 30) return '1 mois';
    if (days === 90) return '3 mois';
    if (days === 180) return '6 mois';
    if (days === 365) return '1 an';
    return `${days} jours`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Capsules</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/capsule/create')}
        >
          <Ionicons name="add" size={24} color="#6C63FF" />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C63FF" />
        }
      >
        {capsules.length === 0 ? (
          <Animated.View entering={FadeInUp.duration(600)} style={styles.emptyState}>
            <Ionicons name="lock-closed" size={60} color="#3a3a5e" />
            <Text style={styles.emptyTitle}>Aucune capsule</Text>
            <Text style={styles.emptyText}>
              Crée ta première capsule temporelle pour sceller tes pensées
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/capsule/create')}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Créer une capsule</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View style={styles.capsuleList}>
            {capsules.map((capsule, index) => (
              <Animated.View
                key={capsule.id}
                entering={FadeInUp.duration(500).delay(index * 100)}
              >
                <TouchableOpacity
                  style={styles.capsuleCard}
                  onPress={() => router.push(`/capsule/${capsule.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.capsuleHeader}>
                    <View
                      style={[
                        styles.statusBadge,
                        capsule.is_sealed
                          ? styles.sealedBadge
                          : styles.unlockedBadge,
                      ]}
                    >
                      <Ionicons
                        name={capsule.is_sealed ? 'lock-closed' : 'lock-open'}
                        size={14}
                        color={capsule.is_sealed ? '#FFD700' : '#4ECDC4'}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          { color: capsule.is_sealed ? '#FFD700' : '#4ECDC4' },
                        ]}
                      >
                        {capsule.is_sealed ? 'Scellée' : 'Ouverte'}
                      </Text>
                    </View>
                    <Text style={styles.durationBadge}>
                      {getDurationLabel(capsule.duration_days)}
                    </Text>
                  </View>

                  <Text style={styles.capsuleTitle}>{capsule.title}</Text>

                  <View style={styles.capsuleMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar-outline" size={14} color="#6a6a8a" />
                      <Text style={styles.metaText}>
                        Créée {formatDistanceToNow(new Date(capsule.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </Text>
                    </View>
                    {capsule.is_sealed && capsule.days_remaining !== undefined && (
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={14} color="#9B59B6" />
                        <Text style={[styles.metaText, { color: '#9B59B6' }]}>
                          {capsule.days_remaining} jours restants
                        </Text>
                      </View>
                    )}
                  </View>

                  {!capsule.is_sealed && capsule.content && (
                    <Text style={styles.contentPreview} numberOfLines={2}>
                      {capsule.content}
                    </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
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
  addButton: {
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6a6a8a',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  createButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  capsuleList: {
    gap: 16,
  },
  capsuleCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 20,
  },
  capsuleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sealedBadge: {
    backgroundColor: '#FFD70020',
  },
  unlockedBadge: {
    backgroundColor: '#4ECDC420',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  durationBadge: {
    fontSize: 12,
    color: '#6a6a8a',
    backgroundColor: '#2a2a4e',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  capsuleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  capsuleMeta: {
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#6a6a8a',
  },
  contentPreview: {
    fontSize: 14,
    color: '#a0a0c0',
    marginTop: 12,
    lineHeight: 20,
  },
});
