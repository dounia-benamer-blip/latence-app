import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp, FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import { useAuth } from '../src/context/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: Record<string, any>;
}

export default function SubscriptionScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, subscriptionStatus, refreshSubscription, isAuthenticated } = useAuth();
  
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lifetimeCode, setLifetimeCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);

  const ds = {
    container: { backgroundColor: theme.background },
    card: { backgroundColor: theme.card },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    textMuted: { color: theme.textMuted },
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${API_URL}/api/subscription/plans`);
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }

    setIsProcessing(true);
    try {
      const originUrl = typeof window !== 'undefined' ? window.location.origin : '';
      
      const response = await fetch(`${API_URL}/api/subscription/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, origin_url: originUrl }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (typeof window !== 'undefined' && data.checkout_url) {
          window.location.href = data.checkout_url;
        }
      } else {
        const error = await response.json();
        Alert.alert('Erreur', error.detail || 'Une erreur est survenue');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleActivateCode = async () => {
    if (!lifetimeCode.trim()) return;

    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`${API_URL}/api/subscription/activate-lifetime`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: lifetimeCode }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Félicitations !', data.message);
        await refreshSubscription();
        setLifetimeCode('');
        setShowCodeInput(false);
      } else {
        Alert.alert('Erreur', data.detail || 'Code invalide');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setIsProcessing(false);
    }
  };

  const getTierBadge = () => {
    if (!subscriptionStatus) return null;
    
    const badges: Record<string, { color: string; icon: string }> = {
      free: { color: theme.textMuted, icon: 'sparkles-outline' },
      essentiel: { color: '#4A90D9', icon: 'star' },
      premium: { color: '#9B59B6', icon: 'diamond' },
      lifetime: { color: '#F39C12', icon: 'infinite' },
    };
    
    const badge = badges[subscriptionStatus.tier] || badges.free;
    
    return (
      <View style={[styles.tierBadge, { backgroundColor: `${badge.color}20` }]}>
        <Ionicons name={badge.icon as any} size={18} color={badge.color} />
        <Text style={[styles.tierBadgeText, { color: badge.color }]}>
          {subscriptionStatus.tier_name}
          {subscriptionStatus.is_founder && ' • Fondateur'}
        </Text>
      </View>
    );
  };

  const getFeatureIcon = (feature: string, enabled: boolean) => {
    return (
      <View style={[styles.featureItem, !enabled && styles.featureDisabled]}>
        <Ionicons 
          name={enabled ? 'checkmark-circle' : 'close-circle'} 
          size={18} 
          color={enabled ? theme.accent : theme.textMuted} 
        />
        <Text style={[styles.featureText, ds.textSecondary, !enabled && { color: theme.textMuted }]}>
          {getFeatureLabel(feature)}
        </Text>
      </View>
    );
  };

  const getFeatureLabel = (feature: string): string => {
    const labels: Record<string, string> = {
      journal_entries: 'Journal illimité',
      dreams: 'Carnet des rêves',
      mirror_queries: 'IA Miroir',
      astrology: 'Astrologie',
      oracle: 'Oracle des rêves',
      advanced_analysis: 'Analyse approfondie',
      statistics: 'Statistiques',
      cosmic_tree: 'Arbre cosmique',
      lunar_cycles: 'Cycles lunaires',
      cadence: 'Cadence',
      sagesse: 'Sagesse',
      lettre: 'Lettre à moi',
      seal: 'Sceller',
      dream_interpretation: 'Interprétation des rêves',
      unlimited_archive: 'Archivage illimité',
      seal_permanent: 'Scellés permanents',
      health_sync: 'Sync santé & sommeil',
    };
    return labels[feature] || feature.charAt(0).toUpperCase() + feature.slice(1);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, ds.container]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, ds.container]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.iconColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, ds.text]}>Abonnement</Text>
          <View style={styles.placeholder} />
        </Animated.View>

        {/* Current Status */}
        <Animated.View entering={FadeInUp.duration(500)} style={[styles.statusCard, ds.card]}>
          <Text style={[styles.statusLabel, ds.textMuted]}>Ton niveau actuel</Text>
          {getTierBadge()}
          
          {subscriptionStatus?.expires_at && (
            <Text style={[styles.expiryText, ds.textMuted]}>
              Expire le {new Date(subscriptionStatus.expires_at).toLocaleDateString('fr-FR')}
            </Text>
          )}
        </Animated.View>

        {/* Plans */}
        <Animated.View entering={FadeInUp.duration(500).delay(200)}>
          <Text style={[styles.sectionTitle, ds.text]}>Choisis ton chemin</Text>
          
          {plans.map((plan, index) => (
            <Animated.View 
              key={plan.id}
              entering={FadeInUp.duration(500).delay(300 + index * 100)}
              style={[
                styles.planCard, 
                ds.card,
                plan.id === 'premium' && styles.premiumCard,
                subscriptionStatus?.tier === plan.id && styles.currentPlanCard,
              ]}
            >
              {plan.id === 'premium' && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>Populaire</Text>
                </View>
              )}
              
              <View style={styles.planHeader}>
                <Text style={[styles.planName, ds.text]}>{plan.name}</Text>
                <View style={styles.priceContainer}>
                  <Text style={[styles.planPrice, ds.text]}>{plan.price}€</Text>
                  <Text style={[styles.planPeriod, ds.textMuted]}>/mois</Text>
                </View>
              </View>

              <View style={styles.featuresContainer}>
                {Object.entries(plan.features).slice(0, 6).map(([feature, value]) => (
                  <View key={feature}>
                    {getFeatureIcon(feature, value === true || value === -1)}
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.subscribeButton,
                  { backgroundColor: plan.id === 'premium' ? '#9B59B6' : theme.accent },
                  subscriptionStatus?.tier === plan.id && styles.currentButton,
                ]}
                onPress={() => handleSubscribe(plan.id)}
                disabled={isProcessing || subscriptionStatus?.tier === plan.id}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.subscribeButtonText}>
                    {subscriptionStatus?.tier === plan.id ? 'Actif' : 'Choisir'}
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Lifetime Code Section */}
        <Animated.View entering={FadeInDown.duration(500).delay(600)} style={styles.lifetimeSection}>
          <TouchableOpacity
            style={[styles.lifetimeCard, ds.card]}
            onPress={() => setShowCodeInput(!showCodeInput)}
            activeOpacity={0.8}
          >
            <Ionicons name="key" size={24} color="#F39C12" />
            <View style={styles.lifetimeTextContainer}>
              <Text style={[styles.lifetimeTitle, ds.text]}>Accès à Vie</Text>
              <Text style={[styles.lifetimeSubtitle, ds.textMuted]}>
                Tu as une carte Atelier Benamer ?
              </Text>
            </View>
            <Ionicons 
              name={showCodeInput ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color={theme.textMuted} 
            />
          </TouchableOpacity>

          {showCodeInput && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.codeInputContainer}>
              <TextInput
                style={[styles.codeInput, ds.card, { color: theme.text, borderColor: theme.border }]}
                placeholder="LATENCE-XXXX-XXXX-XXXX"
                placeholderTextColor={theme.textMuted}
                value={lifetimeCode}
                onChangeText={(text) => setLifetimeCode(text.toUpperCase())}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[styles.activateButton, { backgroundColor: '#F39C12' }]}
                onPress={handleActivateCode}
                disabled={isProcessing || !lifetimeCode.trim()}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.activateButtonText}>Activer</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>

        {/* Free Tier Info */}
        <Animated.View entering={FadeInDown.duration(500).delay(700)} style={styles.freeInfo}>
          <Ionicons name="gift-outline" size={18} color={theme.accent} />
          <Text style={[styles.freeInfoText, ds.textMuted]}>
            2 jours d'essai gratuit avec accès complet à toutes les fonctionnalités.
          </Text>
        </Animated.View>
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
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  placeholder: {
    width: 40,
  },
  statusCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  statusLabel: {
    fontSize: 13,
    marginBottom: 12,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  tierBadgeText: {
    fontSize: 15,
    fontWeight: '600',
  },
  expiryText: {
    fontSize: 12,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '300',
    letterSpacing: 1,
    marginBottom: 20,
    textAlign: 'center',
  },
  planCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  premiumCard: {
    borderWidth: 2,
    borderColor: '#9B59B6',
  },
  currentPlanCard: {
    opacity: 0.7,
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#9B59B6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  planName: {
    fontSize: 20,
    fontWeight: '500',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '300',
  },
  planPeriod: {
    fontSize: 14,
  },
  featuresContainer: {
    gap: 10,
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureDisabled: {
    opacity: 0.5,
  },
  featureText: {
    fontSize: 14,
  },
  subscribeButton: {
    borderRadius: 25,
    padding: 16,
    alignItems: 'center',
  },
  currentButton: {
    backgroundColor: '#999',
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  lifetimeSection: {
    marginTop: 24,
  },
  lifetimeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 16,
    padding: 20,
  },
  lifetimeTextContainer: {
    flex: 1,
  },
  lifetimeTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  lifetimeSubtitle: {
    fontSize: 13,
  },
  codeInputContainer: {
    marginTop: 16,
    marginBottom: 16,
    gap: 12,
  },
  codeInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    letterSpacing: 2,
    textAlign: 'center',
    borderWidth: 1,
  },
  activateButton: {
    borderRadius: 25,
    padding: 16,
    alignItems: 'center',
  },
  activateButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  freeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    justifyContent: 'center',
  },
  freeInfoText: {
    fontSize: 12,
    flex: 1,
  },
});
