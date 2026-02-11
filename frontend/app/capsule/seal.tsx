import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const DURATION_OPTIONS = [
  { days: 7, label: '7 jours' },
  { days: 30, label: '1 mois' },
  { days: 90, label: '3 mois' },
  { days: 180, label: '6 mois' },
  { days: 365, label: '1 an' },
];

export default function SealScreen() {
  const router = useRouter();
  const [draft, setDraft] = useState<any>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [isSealing, setIsSealing] = useState(false);
  const [isSealed, setIsSealed] = useState(false);

  const boxLidRotation = useSharedValue(0);
  const boxScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const lockScale = useSharedValue(0);

  useEffect(() => {
    loadDraft();
  }, []);

  const loadDraft = async () => {
    try {
      const draftData = await AsyncStorage.getItem('capsule_draft');
      if (draftData) {
        setDraft(JSON.parse(draftData));
      } else {
        Alert.alert('Aucun brouillon', 'Écris d\'abord une pensée.');
        router.back();
      }
    } catch (e) {
      console.log('Error loading draft:', e);
    }
  };

  const lidStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 500 },
      { rotateX: `${boxLidRotation.value}deg` },
    ],
  }));

  const boxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: boxScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const lockStyle = useAnimatedStyle(() => ({
    transform: [{ scale: lockScale.value }],
    opacity: lockScale.value,
  }));

  const playSealAnimation = async () => {
    setIsSealing(true);
    
    boxLidRotation.value = withTiming(-90, { duration: 1200, easing: Easing.bezier(0.4, 0, 0.2, 1) });
    
    setTimeout(() => {
      boxScale.value = withSequence(
        withSpring(0.85, { damping: 10 }),
        withSpring(1, { damping: 8 })
      );
    }, 1000);
    
    setTimeout(() => {
      glowOpacity.value = withSequence(
        withTiming(0.8, { duration: 600 }),
        withTiming(0.2, { duration: 800 })
      );
    }, 1400);
    
    setTimeout(() => {
      lockScale.value = withSpring(1, { damping: 8 });
    }, 1800);
    
    setTimeout(() => {
      setIsSealed(true);
      setIsSealing(false);
    }, 2500);
  };

  const handleSeal = async () => {
    if (!duration || !draft) {
      Alert.alert('Incomplet', 'Choisis une durée.');
      return;
    }

    await playSealAnimation();

    try {
      await fetch(`${API_URL}/api/capsule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draft.title,
          content: draft.content,
          prompt_used: draft.prompt_used,
          duration_days: duration,
        }),
      });
      
      await AsyncStorage.removeItem('capsule_draft');
    } catch (e) {
      console.log('Error creating capsule:', e);
    }
  };

  const renderDurationSelection = () => (
    <Animated.View entering={FadeIn.duration(500)} style={styles.content}>
      <View style={styles.draftPreview}>
        <Text style={styles.draftTitle}>{draft?.title}</Text>
        <Text style={styles.draftContent} numberOfLines={3}>{draft?.content}</Text>
      </View>

      <Text style={styles.sectionTitle}>Quand ouvrir cette capsule ?</Text>

      <View style={styles.durationContainer}>
        {DURATION_OPTIONS.map((option, index) => (
          <Animated.View
            key={option.days}
            entering={FadeInUp.duration(400).delay(index * 60)}
          >
            <TouchableOpacity
              style={[
                styles.durationCard,
                duration === option.days && styles.durationCardSelected,
              ]}
              onPress={() => setDuration(option.days)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.durationLabel,
                  duration === option.days && styles.durationLabelSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.sealButton,
          !duration && styles.sealButtonDisabled,
        ]}
        onPress={handleSeal}
        disabled={!duration || isSealing}
        activeOpacity={0.8}
      >
        <Ionicons name="lock-closed-outline" size={18} color="#fff" />
        <Text style={styles.sealButtonText}>Sceller</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backLink}
        onPress={() => router.back()}
      >
        <Text style={styles.backLinkText}>Modifier le texte</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderSealingAnimation = () => (
    <Animated.View entering={FadeIn.duration(500)} style={styles.sealingContainer}>
      <Animated.View style={[styles.boxContainer, boxStyle]}>
        <Animated.View style={[styles.glow, glowStyle]} />
        
        <View style={styles.boxBody}>
          <Ionicons name="document-text-outline" size={32} color="#8B9A7D" />
        </View>
        
        <Animated.View style={[styles.boxLid, lidStyle]}>
          <View style={styles.lidInner} />
        </Animated.View>
        
        <Animated.View style={[styles.lockContainer, lockStyle]}>
          <View style={styles.lockBadge}>
            <Ionicons name="lock-closed" size={24} color="#D4A574" />
          </View>
        </Animated.View>
      </Animated.View>

      <Text style={styles.sealingText}>
        {isSealed ? 'Scellée' : 'Scellement en cours...'}
      </Text>

      {isSealed && (
        <Animated.View entering={FadeInUp.duration(500).delay(200)}>
          <Text style={styles.sealedInfo}>
            Ouverture dans {DURATION_OPTIONS.find((d) => d.days === duration)?.label}
          </Text>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => router.push('/home')}
            activeOpacity={0.8}
          >
            <Text style={styles.doneButtonText}>Terminé</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          {!isSealing && !isSealed && (
            <Ionicons name="arrow-back" size={24} color="#6B6B5B" />
          )}
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sceller</Text>
        <View style={styles.headerButton} />
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isSealing || isSealed ? renderSealingAnimation() : renderDurationSelection()}
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
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4A4A4A',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  content: {
    flex: 1,
  },
  draftPreview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  draftTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4A4A4A',
    marginBottom: 8,
  },
  draftContent: {
    fontSize: 14,
    color: '#8B8B7D',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#8B8B7D',
    marginBottom: 16,
  },
  durationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 32,
  },
  durationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  durationCardSelected: {
    backgroundColor: '#FDF9F3',
    borderWidth: 1,
    borderColor: '#D4C4A8',
  },
  durationLabel: {
    fontSize: 14,
    color: '#8B8B7D',
    fontWeight: '500',
  },
  durationLabelSelected: {
    color: '#4A4A4A',
  },
  sealButton: {
    backgroundColor: '#D4A574',
    paddingVertical: 16,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sealButtonDisabled: {
    backgroundColor: '#D4D4C4',
  },
  sealButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  backLink: {
    alignItems: 'center',
    marginTop: 20,
    padding: 10,
  },
  backLinkText: {
    color: '#A0A090',
    fontSize: 13,
  },
  sealingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  boxContainer: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#D4A574',
    opacity: 0.2,
  },
  boxBody: {
    width: 110,
    height: 90,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#D4C4A8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxLid: {
    position: 'absolute',
    top: 28,
    width: 118,
    height: 26,
    backgroundColor: '#F5F0E8',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderWidth: 2,
    borderColor: '#D4C4A8',
    transformOrigin: 'bottom',
  },
  lidInner: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  lockContainer: {
    position: 'absolute',
    bottom: 18,
  },
  lockBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 10,
    borderWidth: 2,
    borderColor: '#D4A574',
  },
  sealingText: {
    fontSize: 26,
    fontWeight: '200',
    color: '#4A4A4A',
    letterSpacing: 2,
    marginBottom: 8,
  },
  sealedInfo: {
    fontSize: 14,
    color: '#8B8B7D',
    textAlign: 'center',
    marginBottom: 32,
  },
  doneButton: {
    backgroundColor: '#8B9A7D',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
});
