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
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp, FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import { useAuth } from '../src/context/AuthContext';
import { TwinklingStars } from '../src/components/TwinklingStars';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const { width } = Dimensions.get('window');

export default function PaywallScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { user, subscriptionStatus, refreshSubscription } = useAuth();
  
  const [selectedPlan, setSelectedPlan] = useState<'essentiel' | 'premium'>('premium');
  const [lifetimeCode, setLifetimeCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [codeError, setCodeError] = useState('');

  const ds = {
    container: { backgroundColor: theme.background },
    card: { backgroundColor: theme.card },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    textMuted: { color: theme.textMuted },
  };

  // If user already has premium, redirect to home
  useEffect(() => {
    if (subscriptionStatus?.tier === 'premium' || 
        subscriptionStatus?.tier === 'lifetime' ||
        subscriptionStatus?.tier === 'essentiel') {
      router.replace('/home');
    }
  }, [subscriptionStatus]);

  const handleActivateCode = async () => {
    if (!lifetimeCode.trim()) return;
    
    setIsLoading(true);
    setCodeError('');
    
    try {
      const response = await fetch(`${API_URL}/api/subscription/activate-lifetime`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: lifetimeCode.trim().toUpperCase() }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        await refreshSubscription();
        router.replace('/home');
      } else {
        setCodeError(data.detail || 'Code invalide');
      }
    } catch (error) {
      setCodeError('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTrial = async () => {
    setIsLoading(true);
    try {
      // For now, just start a free trial by setting tier to essentiel for 3 days
      const response = await fetch(`${API_URL}/api/subscription/start-trial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan }),
        credentials: 'include',
      });

      if (response.ok) {
        await refreshSubscription();
        router.replace('/home');
      }
    } catch (error) {
      console.error('Error starting trial:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const plans = {
    essentiel: {
      name: 'Essentiel',
      price: '4,99',
      period: '/mois',
      color: '#4A90D9',
      features: [
        'Journal illimité',
        'Rêves et symboles',
        'Cadence quotidienne',
        'Sons d\'ambiance',
        'Gratitudes',
      ],
    },
    premium: {
      name: 'Premium',
      price: '18,99',
      period: '/mois',
      color: '#9B59B6',
      popular: true,
      features: [
        'Tout Essentiel +',
        'Dialogue intérieur IA',
        'Oracle des rêves',
        'Rapport de l\'âme',
        'Astrologie complète',
        'Rituals lunaires',
      ],
    },
  };

  return (
    <SafeAreaView style={[styles.container, ds.container]}>
      {isDark && <TwinklingStars />}
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: `${theme.accent}15` }]}>
            <Ionicons name="moon" size={40} color={theme.accent} />
          </View>
          <Text style={[styles.title, ds.text]}>Bienvenue sur Latence</Text>
          <Text style={[styles.subtitle, ds.textMuted]}>
            Choisis ton chemin vers la sérénité
          </Text>
        </Animated.View>

        {/* Trial Badge */}
        <Animated.View entering={FadeIn.delay(200).duration(500)} style={styles.trialBadge}>
          <Ionicons name="gift-outline" size={18} color="#F39C12" />
          <Text style={styles.trialText}>3 jours d'essai gratuit</Text>
        </Animated.View>

        {/* Plans */}
        <View style={styles.plansContainer}>
          {(['essentiel', 'premium'] as const).map((planKey, index) => {
            const plan = plans[planKey];
            const isSelected = selectedPlan === planKey;
            
            return (
              <Animated.View
                key={planKey}
                entering={FadeInUp.delay(300 + index * 100).duration(500)}
              >
                <TouchableOpacity
                  style={[
                    styles.planCard,
                    ds.card,
                    isSelected && { borderColor: plan.color, borderWidth: 2 },
                  ]}
                  onPress={() => setSelectedPlan(planKey)}
                  activeOpacity={0.8}
                >
                  {plan.popular && (
                    <View style={[styles.popularBadge, { backgroundColor: plan.color }]}>
                      <Text style={styles.popularText}>Populaire</Text>
                    </View>
                  )}
                  
                  <View style={styles.planHeader}>
                    <View style={[styles.radioOuter, { borderColor: plan.color }]}>
                      {isSelected && (
                        <View style={[styles.radioInner, { backgroundColor: plan.color }]} />
                      )}
                    </View>
                    <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
                  </View>

                  <View style={styles.priceRow}>
                    <Text style={[styles.price, ds.text]}>{plan.price}€</Text>
                    <Text style={[styles.period, ds.textMuted]}>{plan.period}</Text>
                  </View>

                  <View style={styles.featuresContainer}>
                    {plan.features.map((feature, i) => (
                      <View key={i} style={styles.featureRow}>
                        <Ionicons name="checkmark" size={16} color={plan.color} />
                        <Text style={[styles.featureText, ds.textSecondary]}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* CTA Button */}
        <Animated.View entering={FadeInUp.delay(600).duration(500)}>
          <TouchableOpacity
            style={[styles.ctaButton, { backgroundColor: plans[selectedPlan].color }]}
            onPress={handleStartTrial}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.ctaText}>Commencer l'essai gratuit</Text>
            )}
          </TouchableOpacity>
          
          <Text style={[styles.ctaSubtext, ds.textMuted]}>
            Annule à tout moment pendant les 3 jours
          </Text>
        </Animated.View>

        {/* Lifetime Code */}
        <Animated.View entering={FadeIn.delay(800).duration(500)} style={styles.codeSection}>
          <TouchableOpacity
            style={styles.codeToggle}
            onPress={() => setShowCodeInput(!showCodeInput)}
          >
            <Ionicons name="key-outline" size={18} color="#F39C12" />
            <Text style={[styles.codeToggleText, { color: '#F39C12' }]}>
              {showCodeInput ? 'Masquer' : 'J\'ai un code Fondateur'}
            </Text>
          </TouchableOpacity>

          {showCodeInput && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.codeInputContainer}>
              <TextInput
                style={[styles.codeInput, ds.card, { color: theme.text, borderColor: '#F39C12' }]}
                placeholder="LATENCE-XXXX-XXXX-XXXX"
                placeholderTextColor={theme.textMuted}
                value={lifetimeCode}
                onChangeText={setLifetimeCode}
                autoCapitalize="characters"
              />
              
              {codeError ? (
                <Text style={styles.codeError}>{codeError}</Text>
              ) : null}

              <TouchableOpacity
                style={[styles.activateButton, { backgroundColor: '#F39C12' }]}
                onPress={handleActivateCode}
                disabled={isLoading || !lifetimeCode.trim()}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.activateText}>Activer mon accès Fondateur</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>

        {/* Legal */}
        <Text style={[styles.legal, ds.textMuted]}>
          En continuant, tu acceptes nos conditions d'utilisation et notre politique de confidentialité.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  
  header: { alignItems: 'center', marginBottom: 24 },
  logoContainer: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '300', letterSpacing: 1, marginBottom: 8 },
  subtitle: { fontSize: 15, textAlign: 'center' },
  
  trialBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    backgroundColor: '#F39C1215', 
    paddingVertical: 10, 
    paddingHorizontal: 20, 
    borderRadius: 20, 
    alignSelf: 'center',
    marginBottom: 24,
  },
  trialText: { color: '#F39C12', fontSize: 14, fontWeight: '600' },
  
  plansContainer: { gap: 16, marginBottom: 24 },
  planCard: { borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'transparent', position: 'relative', overflow: 'hidden' },
  popularBadge: { position: 'absolute', top: 0, right: 0, paddingVertical: 6, paddingHorizontal: 14, borderBottomLeftRadius: 12 },
  popularText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
  planName: { fontSize: 18, fontWeight: '600' },
  
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 16 },
  price: { fontSize: 32, fontWeight: '300' },
  period: { fontSize: 14, marginLeft: 4 },
  
  featuresContainer: { gap: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { fontSize: 14 },
  
  ctaButton: { borderRadius: 28, paddingVertical: 18, alignItems: 'center', marginBottom: 12 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  ctaSubtext: { fontSize: 12, textAlign: 'center', marginBottom: 32 },
  
  codeSection: { alignItems: 'center' },
  codeToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  codeToggleText: { fontSize: 14, fontWeight: '500' },
  
  codeInputContainer: { width: '100%', marginTop: 12 },
  codeInput: { borderRadius: 16, padding: 16, fontSize: 15, borderWidth: 1, textAlign: 'center', letterSpacing: 2 },
  codeError: { color: '#E57373', fontSize: 13, textAlign: 'center', marginTop: 8 },
  activateButton: { borderRadius: 24, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  activateText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  
  legal: { fontSize: 11, textAlign: 'center', marginTop: 24, lineHeight: 16 },
});
