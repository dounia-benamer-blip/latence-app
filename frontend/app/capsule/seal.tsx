import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  withRepeat,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const DURATION_OPTIONS = [
  { days: 7, label: '7 jours' },
  { days: 30, label: '1 mois' },
  { days: 90, label: '3 mois' },
  { days: 180, label: '6 mois' },
  { days: 365, label: '1 an' },
];

const PROMPTS = [
  "Qu'est-ce qui t'a fait sourire aujourd'hui ?",
  "Si tu pouvais envoyer un message à ton toi du futur ?",
  "Quel rêve secret portes-tu en toi ?",
  "Qu'est-ce que tu te pardonnes aujourd'hui ?",
];

export default function SealScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'write' | 'duration' | 'sealing' | 'done'>('write');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [duration, setDuration] = useState<number | null>(null);

  // Animation values for the magical sealing animation
  const letterY = useSharedValue(0);
  const letterScale = useSharedValue(1);
  const letterRotateZ = useSharedValue(0);
  const letterOpacity = useSharedValue(1);
  
  const boxY = useSharedValue(100);
  const boxScale = useSharedValue(0.8);
  const boxOpacity = useSharedValue(0);
  
  const lidRotation = useSharedValue(0);
  const lidY = useSharedValue(0);
  
  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.5);
  
  const lockScale = useSharedValue(0);
  const lockOpacity = useSharedValue(0);
  
  const particlesOpacity = useSharedValue(0);
  
  const sealTextOpacity = useSharedValue(0);

  // Letter animation - starts floating, then rolls and enters the box
  const letterStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: letterY.value },
      { scale: letterScale.value },
      { rotateZ: `${letterRotateZ.value}deg` },
    ],
    opacity: letterOpacity.value,
  }));

  // Box animation
  const boxStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: boxY.value },
      { scale: boxScale.value },
    ],
    opacity: boxOpacity.value,
  }));

  // Lid animation - opens and closes
  const lidStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: lidY.value },
      { rotateX: `${lidRotation.value}deg` },
    ],
  }));

  // Golden glow animation
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  // Lock animation
  const lockStyle = useAnimatedStyle(() => ({
    transform: [{ scale: lockScale.value }],
    opacity: lockOpacity.value,
  }));

  // Particles animation
  const particlesStyle = useAnimatedStyle(() => ({
    opacity: particlesOpacity.value,
  }));

  // Seal text
  const sealTextStyle = useAnimatedStyle(() => ({
    opacity: sealTextOpacity.value,
  }));

  const startSealAnimation = () => {
    setStep('sealing');
    
    // Phase 1: Box appears (0-500ms)
    boxOpacity.value = withTiming(1, { duration: 400 });
    boxY.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.back(1.2)) });
    boxScale.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.back(1.2)) });
    
    // Phase 2: Lid opens (500-1000ms)
    lidRotation.value = withDelay(500, withTiming(-70, { 
      duration: 600, 
      easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
    }));
    lidY.value = withDelay(500, withTiming(-8, { duration: 400 }));
    
    // Phase 3: Letter rises, rolls and enters box (1000-2200ms)
    letterY.value = withDelay(900, withSequence(
      withTiming(-30, { duration: 400, easing: Easing.out(Easing.quad) }),
      withTiming(120, { duration: 700, easing: Easing.in(Easing.quad) })
    ));
    letterScale.value = withDelay(1000, withSequence(
      withTiming(1.1, { duration: 300 }),
      withTiming(0.4, { duration: 700 })
    ));
    letterRotateZ.value = withDelay(1000, withTiming(180, { duration: 900 }));
    letterOpacity.value = withDelay(1800, withTiming(0, { duration: 300 }));
    
    // Phase 4: Lid closes (2200-3000ms)
    lidRotation.value = withDelay(2200, withTiming(0, { 
      duration: 600, 
      easing: Easing.bezier(0.6, 0.05, 0.28, 0.91) 
    }));
    lidY.value = withDelay(2200, withTiming(0, { duration: 400 }));
    
    // Phase 5: Glow appears (2800-3800ms)
    glowOpacity.value = withDelay(2800, withSequence(
      withTiming(0.9, { duration: 400, easing: Easing.out(Easing.quad) }),
      withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.quad) })
    ));
    glowScale.value = withDelay(2800, withSequence(
      withTiming(1.5, { duration: 400 }),
      withTiming(1.2, { duration: 800 })
    ));
    
    // Phase 6: Box pulse effect (3000-3500ms)
    boxScale.value = withDelay(3000, withSequence(
      withSpring(0.9, { damping: 6, stiffness: 200 }),
      withSpring(1.05, { damping: 6, stiffness: 200 }),
      withSpring(1, { damping: 10, stiffness: 100 })
    ));
    
    // Phase 7: Particles fly out (3200-4000ms)
    particlesOpacity.value = withDelay(3200, withSequence(
      withTiming(1, { duration: 300 }),
      withTiming(0, { duration: 600 })
    ));
    
    // Phase 8: Lock appears (3600-4200ms)
    lockScale.value = withDelay(3600, withSequence(
      withSpring(1.2, { damping: 6, stiffness: 150 }),
      withSpring(1, { damping: 10, stiffness: 100 })
    ));
    lockOpacity.value = withDelay(3600, withTiming(1, { duration: 300 }));
    
    // Phase 9: Seal text (4200-4800ms)
    sealTextOpacity.value = withDelay(4200, withTiming(1, { duration: 500 }));
    
    // Save capsule and transition
    setTimeout(() => {
      saveCapsule();
    }, 5000);
  };

  const saveCapsule = async () => {
    try {
      await fetch(`${API_URL}/api/capsule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || 'Sans titre',
          content,
          duration_days: duration,
        }),
      });
    } catch (e) {
      console.log('Error saving capsule:', e);
    }
    setStep('done');
  };

  const renderWrite = () => (
    <Animated.View entering={FadeIn.duration(400)} style={styles.content}>
      <Text style={styles.stepTitle}>Ta pensée</Text>
      
      <View style={styles.promptsRow}>
        {PROMPTS.slice(0, 2).map((prompt, i) => (
          <TouchableOpacity
            key={i}
            style={styles.promptChip}
            onPress={() => setContent(prompt + '\n\n')}
          >
            <Text style={styles.promptText} numberOfLines={2}>{prompt}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.titleInput}
        placeholder="Titre (optionnel)"
        placeholderTextColor="#B0B0A0"
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        style={styles.contentInput}
        placeholder="Ce que tu veux confier au temps..."
        placeholderTextColor="#B0B0A0"
        value={content}
        onChangeText={setContent}
        multiline
        textAlignVertical="top"
      />

      <TouchableOpacity
        style={[styles.nextButton, !content.trim() && styles.buttonDisabled]}
        onPress={() => setStep('duration')}
        disabled={!content.trim()}
      >
        <Text style={styles.nextButtonText}>Choisir la durée</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderDuration = () => (
    <Animated.View entering={FadeIn.duration(400)} style={styles.content}>
      <Text style={styles.stepTitle}>Quand l'ouvrir ?</Text>
      <Text style={styles.stepSubtitle}>Cette capsule restera scellée jusqu'à la date choisie</Text>

      <View style={styles.durationGrid}>
        {DURATION_OPTIONS.map((opt, i) => (
          <Animated.View key={opt.days} entering={FadeInUp.duration(300).delay(i * 60)}>
            <TouchableOpacity
              style={[
                styles.durationCard,
                duration === opt.days && styles.durationCardSelected,
              ]}
              onPress={() => setDuration(opt.days)}
            >
              <Text style={[
                styles.durationText,
                duration === opt.days && styles.durationTextSelected,
              ]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.sealButton, !duration && styles.buttonDisabled]}
        onPress={startSealAnimation}
        disabled={!duration}
      >
        <Text style={styles.sealButtonText}>✨ Sceller ✨</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backLink} onPress={() => setStep('write')}>
        <Text style={styles.backLinkText}>Modifier le texte</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderSealing = () => (
    <View style={styles.sealingContainer}>
      {/* Background glow */}
      <Animated.View style={[styles.glowCircle, glowStyle]} />
      <Animated.View style={[styles.glowCircleInner, glowStyle]} />
      
      {/* Floating particles */}
      <Animated.View style={[styles.particlesContainer, particlesStyle]}>
        {[...Array(8)].map((_, i) => (
          <View 
            key={i} 
            style={[
              styles.particle, 
              { 
                top: 40 + Math.random() * 100,
                left: 50 + Math.random() * 120,
                backgroundColor: i % 2 === 0 ? '#D4A574' : '#FFD700',
              }
            ]} 
          />
        ))}
      </Animated.View>
      
      {/* Letter that floats and enters the box */}
      <Animated.View style={[styles.letterContainer, letterStyle]}>
        <View style={styles.letter}>
          <View style={styles.letterLines}>
            <View style={styles.letterLine} />
            <View style={[styles.letterLine, { width: '80%' }]} />
            <View style={[styles.letterLine, { width: '60%' }]} />
          </View>
        </View>
      </Animated.View>
      
      {/* The magical box */}
      <Animated.View style={[styles.boxContainer, boxStyle]}>
        <View style={styles.boxBody}>
          <View style={styles.boxInner} />
          <View style={styles.boxOrnament} />
        </View>
        <Animated.View style={[styles.boxLid, lidStyle]}>
          <View style={styles.lidOrnament} />
        </Animated.View>
      </Animated.View>
      
      {/* Lock that appears after sealing */}
      <Animated.View style={[styles.lockWrapper, lockStyle]}>
        <Text style={styles.lockEmoji}>🔒</Text>
      </Animated.View>
      
      {/* Text */}
      <Animated.View style={[styles.sealTextContainer, sealTextStyle]}>
        <Text style={styles.sealingText}>Scellée...</Text>
      </Animated.View>
    </View>
  );

  const renderDone = () => (
    <Animated.View entering={FadeIn.duration(600)} style={styles.doneContainer}>
      <View style={styles.doneIconContainer}>
        <Text style={styles.doneEmoji}>✨</Text>
      </View>
      <Text style={styles.doneTitle}>Scellée</Text>
      <Text style={styles.doneSubtitle}>
        Ta pensée sera gardée précieusement.{'\n'}
        Ouverture dans {DURATION_OPTIONS.find(d => d.days === duration)?.label}
      </Text>
      <TouchableOpacity
        style={styles.doneButton}
        onPress={() => router.replace('/home')}
      >
        <Text style={styles.doneButtonText}>Terminé</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        {step !== 'sealing' && step !== 'done' && (
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Ionicons name="chevron-down" size={28} color="#6B6B5B" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Sceller</Text>
            <View style={styles.placeholder} />
          </View>
        )}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 'write' && renderWrite()}
          {step === 'duration' && renderDuration()}
          {step === 'sealing' && renderSealing()}
          {step === 'done' && renderDone()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4A4A4A',
  },
  placeholder: {
    width: 36,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  content: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: '200',
    color: '#4A4A4A',
    letterSpacing: 1,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#8B8B7D',
    marginBottom: 28,
  },
  promptsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  promptChip: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
  },
  promptText: {
    fontSize: 12,
    color: '#8B8B7D',
    lineHeight: 16,
  },
  titleInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#4A4A4A',
    marginBottom: 16,
  },
  contentInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#4A4A4A',
    minHeight: 160,
    marginBottom: 24,
  },
  nextButton: {
    backgroundColor: '#8B9A7D',
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#D4D4C4',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 32,
  },
  durationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 22,
  },
  durationCardSelected: {
    backgroundColor: '#4A4A4A',
  },
  durationText: {
    fontSize: 14,
    color: '#6B6B5B',
    fontWeight: '500',
  },
  durationTextSelected: {
    color: '#FFFFFF',
  },
  sealButton: {
    backgroundColor: '#D4A574',
    paddingVertical: 18,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sealButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 1,
  },
  backLink: {
    alignItems: 'center',
    marginTop: 20,
  },
  backLinkText: {
    color: '#A0A090',
    fontSize: 13,
  },
  
  // ======= SEALING ANIMATION STYLES =======
  sealingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    minHeight: 400,
  },
  glowCircle: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#D4A574',
  },
  glowCircleInner: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#FFD700',
  },
  particlesContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  letterContainer: {
    position: 'absolute',
    top: 60,
    zIndex: 10,
  },
  letter: {
    width: 90,
    height: 70,
    backgroundColor: '#FFFEF8',
    borderRadius: 4,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E8E0D4',
  },
  letterLines: {
    flex: 1,
    gap: 6,
  },
  letterLine: {
    height: 4,
    backgroundColor: '#D4D0C4',
    borderRadius: 2,
    width: '100%',
  },
  boxContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  boxBody: {
    width: 120,
    height: 80,
    backgroundColor: '#EDE8E0',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D4A574',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  boxInner: {
    width: 100,
    height: 60,
    backgroundColor: '#3A3530',
    borderRadius: 4,
    opacity: 0.3,
  },
  boxOrnament: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#D4A574',
    bottom: -10,
  },
  boxLid: {
    position: 'absolute',
    top: -10,
    width: 130,
    height: 20,
    backgroundColor: '#F5EFE6',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: '#D4A574',
    alignItems: 'center',
    justifyContent: 'center',
    transformOrigin: 'bottom',
  },
  lidOrnament: {
    width: 30,
    height: 6,
    backgroundColor: '#D4A574',
    borderRadius: 3,
  },
  lockWrapper: {
    position: 'absolute',
    bottom: 100,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#D4A574',
    shadowColor: '#D4A574',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  lockEmoji: {
    fontSize: 28,
  },
  sealTextContainer: {
    position: 'absolute',
    bottom: 50,
  },
  sealingText: {
    fontSize: 20,
    fontWeight: '200',
    color: '#6B6B5B',
    letterSpacing: 3,
  },
  
  // ======= DONE SCREEN STYLES =======
  doneContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  doneIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#D4A57420',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  doneEmoji: {
    fontSize: 48,
  },
  doneTitle: {
    fontSize: 32,
    fontWeight: '200',
    color: '#4A4A4A',
    letterSpacing: 3,
    marginBottom: 12,
  },
  doneSubtitle: {
    fontSize: 14,
    color: '#8B8B7D',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  doneButton: {
    backgroundColor: '#8B9A7D',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 28,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
});
