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
import { formatDistanceToNow } from 'date-fns';
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
      <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#6B6B5B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Capsules</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/capsule/create')}
        >
          <Ionicons name="add" size={24} color="#8B9A7D" />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B9A7D" />
        }
      >
        {capsules.length === 0 ? (
          <Animated.View entering={FadeInUp.duration(600)} style={styles.emptyState}>
            <Ionicons name="lock-closed-outline" size={48} color="#C4C4B4" />
            <Text style={styles.emptyTitle}>Aucune capsule</Text>
            <Text style={styles.emptyText}>
              Dépose ta première pensée pour le futur
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/capsule/create')}
              activeOpacity={0.8}
            >
              <Text style={styles.createButtonText}>Déposer</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View style={styles.capsuleList}>
            {capsules.map((capsule, index) => (
              <Animated.View
                key={capsule.id}
                entering={FadeInUp.duration(500).delay(index * 80)}
              >
                <TouchableOpacity
                  style={styles.capsuleCard}
                  onPress={() => router.push(`/capsule/${capsule.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.capsuleHeader}>
                    <Ionicons
                      name={capsule.is_sealed ? 'lock-closed-outline' : 'lock-open-outline'}
                      size={18}
                      color={capsule.is_sealed ? '#D4A574' : '#8B9A7D'}
                    />
                    <Text style={styles.durationBadge}>
                      {getDurationLabel(capsule.duration_days)}
                    </Text>
                  </View>

                  <Text style={styles.capsuleTitle}>{capsule.title}</Text>

                  <View style={styles.capsuleMeta}>
                    <Text style={styles.metaText}>
                      {formatDistanceToNow(new Date(capsule.created_at), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </Text>
                    {capsule.is_sealed && capsule.days_remaining !== undefined && (
                      <Text style={styles.remainingText}>
                        {capsule.days_remaining}j restants
                      </Text>
                    )}
                  </View>
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
    backgroundColor: '#F5F0E8',
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
    fontSize: 16,
    fontWeight: '500',
    color: '#4A4A4A',
    letterSpacing: 0.5,
  },
  addButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#4A4A4A',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#A0A090',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#8B9A7D',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  capsuleList: {
    gap: 12,
  },
  capsuleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  capsuleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  durationBadge: {
    fontSize: 11,
    color: '#A0A090',
    backgroundColor: '#F5F0E8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  capsuleTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4A4A4A',
    marginBottom: 12,
  },
  capsuleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 12,
    color: '#A0A090',
  },
  remainingText: {
    fontSize: 12,
    color: '#D4A574',
    fontWeight: '500',
  },
});
