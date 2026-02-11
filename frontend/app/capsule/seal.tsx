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
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

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

  // Animation values
  const lidRotation = useSharedValue(0);
  const boxScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const lockScale = useSharedValue(0);
  const lockOpacity = useSharedValue(0);

  const lidStyle = useAnimatedStyle(() => ({
    transform: [{ rotateX: `${lidRotation.value}deg` }],
  }));

  const boxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: boxScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: 1 + glowOpacity.value * 0.3 }],
  }));

  const lockStyle = useAnimatedStyle(() => ({
    transform: [{ scale: lockScale.value }],
    opacity: lockOpacity.value,
  }));

  const startSealAnimation = () => {
    setStep('sealing');
    
    // Lid closes slowly
    lidRotation.value = withTiming(-95, { 
      duration: 1500, 
      easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
    });
    
    // Box pulse
    boxScale.value = withDelay(1200, withSequence(
      withSpring(0.92, { damping: 8, stiffness: 100 }),
      withSpring(1.02, { damping: 8, stiffness: 100 }),
      withSpring(1, { damping: 10, stiffness: 100 })
    ));
    
    // Glow appears
    glowOpacity.value = withDelay(1400, withSequence(
      withTiming(0.8, { duration: 400 }),
      withTiming(0.2, { duration: 800 })
    ));
    
    // Lock appears
    lockOpacity.value = withDelay(1800, withTiming(1, { duration: 300 }));
    lockScale.value = withDelay(1800, withSpring(1, { damping: 8, stiffness: 120 }));
    
    // Save to backend and transition
    setTimeout(() => {
      saveCapsule();
    }, 2500);
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
        <Ionicons name="lock-closed" size={18} color="#fff" />
        <Text style={styles.sealButtonText}>Sceller</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backLink} onPress={() => setStep('write')}>
        <Text style={styles.backLinkText}>Modifier le texte</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderSealing = () => (
    <View style={styles.sealingContainer}>
      <Animated.View style={[styles.glowCircle, glowStyle]} />
      
      <Animated.View style={[styles.boxWrapper, boxStyle]}>
        <View style={styles.boxBody}>
          <Ionicons name="document-text" size={28} color="#8B9A7D" />
        </View>
        <Animated.View style={[styles.boxLid, lidStyle]} />
      </Animated.View>
      
      <Animated.View style={[styles.lockWrapper, lockStyle]}>
        <Ionicons name="lock-closed" size={28} color="#D4A574" />
      </Animated.View>
      
      <Text style={styles.sealingText}>Scellement...</Text>
    </View>
  );

  const renderDone = () => (
    <Animated.View entering={FadeIn.duration(600)} style={styles.doneContainer}>
      <View style={styles.doneIcon}>
        <Ionicons name="checkmark" size={40} color="#8B9A7D" />
      </View>
      <Text style={styles.doneTitle}>Scellée</Text>
      <Text style={styles.doneSubtitle}>
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
    paddingVertical: 16,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  sealButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  backLink: {
    alignItems: 'center',
    marginTop: 20,
  },
  backLinkText: {
    color: '#A0A090',
    fontSize: 13,
  },
  sealingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  glowCircle: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#D4A574',
  },
  boxWrapper: {
    width: 120,
    height: 100,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  boxBody: {
    width: 100,
    height: 70,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D4C4A8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxLid: {
    position: 'absolute',
    top: 0,
    width: 104,
    height: 20,
    backgroundColor: '#EDE8E0',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: '#D4C4A8',
  },
  lockWrapper: {
    marginTop: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#D4A574',
  },
  sealingText: {
    marginTop: 32,
    fontSize: 18,
    fontWeight: '300',
    color: '#6B6B5B',
    letterSpacing: 2,
  },
  doneContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  doneIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#8B9A7D20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  doneTitle: {
    fontSize: 28,
    fontWeight: '200',
    color: '#4A4A4A',
    letterSpacing: 2,
    marginBottom: 8,
  },
  doneSubtitle: {
    fontSize: 14,
    color: '#8B8B7D',
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
