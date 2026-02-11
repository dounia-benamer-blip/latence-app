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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const DURATION_OPTIONS = [
  { days: 7, label: '7 jours', icon: 'calendar-outline' },
  { days: 30, label: '1 mois', icon: 'calendar' },
  { days: 90, label: '3 mois', icon: 'calendar' },
  { days: 180, label: '6 mois', icon: 'calendar' },
  { days: 365, label: '1 an', icon: 'calendar' },
];

export default function CreateCapsuleScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [isSealing, setIsSealing] = useState(false);
  const [isSealed, setIsSealed] = useState(false);

  // Animation values for sealing
  const boxLidRotation = useSharedValue(0);
  const boxScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const lockScale = useSharedValue(0);

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/prompts`);
      if (res.ok) {
        const data = await res.json();
        setPrompts(data.prompts);
      }
    } catch (e) {
      console.log('Error fetching prompts:', e);
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
    
    // Lid closes
    boxLidRotation.value = withTiming(-90, { duration: 800, easing: Easing.bezier(0.4, 0, 0.2, 1) });
    
    // Wait then scale down slightly
    setTimeout(() => {
      boxScale.value = withSequence(
        withSpring(0.9, { damping: 10 }),
        withSpring(1, { damping: 8 })
      );
    }, 600);
    
    // Glow effect
    setTimeout(() => {
      glowOpacity.value = withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0.3, { duration: 600 })
      );
    }, 1000);
    
    // Lock appears
    setTimeout(() => {
      lockScale.value = withSpring(1, { damping: 8 });
    }, 1200);
    
    // Mark as sealed
    setTimeout(() => {
      setIsSealed(true);
      setIsSealing(false);
    }, 1800);
  };

  const handleSeal = async () => {
    if (!title || !content || !duration) {
      Alert.alert('Incomplet', 'Veuillez remplir tous les champs.');
      return;
    }

    await playSealAnimation();

    try {
      await fetch(`${API_URL}/api/capsule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          prompt_used: selectedPrompt,
          duration_days: duration,
        }),
      });
    } catch (e) {
      console.log('Error creating capsule:', e);
    }
  };

  const renderStep1 = () => (
    <Animated.View entering={FadeIn.duration(500)} style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Choisis un prompt ou écris librement</Text>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.promptsScroll}
        contentContainerStyle={styles.promptsContent}
      >
        {prompts.map((prompt, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.promptCard,
              selectedPrompt === prompt && styles.promptCardSelected,
            ]}
            onPress={() => {
              setSelectedPrompt(prompt);
              setContent('');
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="sparkles" size={16} color="#FFD700" />
            <Text style={styles.promptText}>{prompt}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Titre de ta capsule</Text>
        <TextInput
          style={styles.titleInput}
          placeholder="Donne un nom à ce souvenir..."
          placeholderTextColor="#4a4a6a"
          value={title}
          onChangeText={setTitle}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>
          {selectedPrompt ? selectedPrompt : 'Tes pensées'}
        </Text>
        <TextInput
          style={styles.contentInput}
          placeholder="Écris ce que tu veux confier au temps..."
          placeholderTextColor="#4a4a6a"
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity
        style={[
          styles.nextButton,
          (!title || !content) && styles.nextButtonDisabled,
        ]}
        onPress={() => setStep(2)}
        disabled={!title || !content}
        activeOpacity={0.8}
      >
        <Text style={styles.nextButtonText}>Continuer</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );

  const renderStep2 = () => (
    <Animated.View entering={FadeIn.duration(500)} style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Quand veux-tu ouvrir cette capsule ?</Text>
      <Text style={styles.stepSubtitle}>Choisis la durée du scellement</Text>

      <View style={styles.durationGrid}>
        {DURATION_OPTIONS.map((option, index) => (
          <Animated.View
            key={option.days}
            entering={FadeInUp.duration(400).delay(index * 100)}
          >
            <TouchableOpacity
              style={[
                styles.durationCard,
                duration === option.days && styles.durationCardSelected,
              ]}
              onPress={() => setDuration(option.days)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={option.icon as any}
                size={28}
                color={duration === option.days ? '#6C63FF' : '#6a6a8a'}
              />
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
        <Ionicons name="lock-closed" size={20} color="#fff" />
        <Text style={styles.sealButtonText}>Sceller la capsule</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setStep(1)}
      >
        <Ionicons name="arrow-back" size={18} color="#6a6a8a" />
        <Text style={styles.backButtonText}>Modifier le contenu</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderSealingAnimation = () => (
    <Animated.View entering={FadeIn.duration(500)} style={styles.sealingContainer}>
      <Animated.View style={[styles.boxContainer, boxStyle]}>
        {/* Glow effect */}
        <Animated.View style={[styles.glow, glowStyle]} />
        
        {/* Box body */}
        <View style={styles.boxBody}>
          <Ionicons name="document-text" size={40} color="#6C63FF" />
        </View>
        
        {/* Box lid */}
        <Animated.View style={[styles.boxLid, lidStyle]}>
          <View style={styles.lidInner} />
        </Animated.View>
        
        {/* Lock icon */}
        <Animated.View style={[styles.lockContainer, lockStyle]}>
          <View style={styles.lockBadge}>
            <Ionicons name="lock-closed" size={30} color="#FFD700" />
          </View>
        </Animated.View>
      </Animated.View>

      <Text style={styles.sealingText}>
        {isSealed ? 'Capsule scellée !' : 'Scellement en cours...'}
      </Text>

      {isSealed && (
        <Animated.View entering={FadeInUp.duration(500).delay(200)}>
          <Text style={styles.sealedInfo}>
            Ta capsule sera déverrouillée dans{' '}
            {DURATION_OPTIONS.find((d) => d.days === duration)?.label}
          </Text>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => router.push('/home')}
            activeOpacity={0.8}
          >
            <Text style={styles.doneButtonText}>Retour à l'accueil</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nouvelle Capsule</Text>
          <View style={styles.headerButton} />
        </Animated.View>

        {/* Progress */}
        {!isSealing && !isSealed && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressDot, step >= 1 && styles.progressDotActive]} />
            <View style={[styles.progressLine, step >= 2 && styles.progressLineActive]} />
            <View style={[styles.progressDot, step >= 2 && styles.progressDotActive]} />
          </View>
        )}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {isSealing || isSealed
            ? renderSealingAnimation()
            : step === 1
            ? renderStep1()
            : renderStep2()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  keyboardView: {
    flex: 1,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2a2a4e',
  },
  progressDotActive: {
    backgroundColor: '#6C63FF',
  },
  progressLine: {
    width: 60,
    height: 3,
    backgroundColor: '#2a2a4e',
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: '#6C63FF',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#6a6a8a',
    marginBottom: 24,
  },
  promptsScroll: {
    marginBottom: 24,
    marginHorizontal: -20,
  },
  promptsContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  promptCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    width: 200,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  promptCardSelected: {
    borderColor: '#6C63FF',
    backgroundColor: '#6C63FF10',
  },
  promptText: {
    fontSize: 13,
    color: '#a0a0c0',
    marginTop: 8,
    lineHeight: 18,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#a0a0c0',
    marginBottom: 8,
  },
  titleInput: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  contentInput: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2a2a4e',
    minHeight: 150,
  },
  nextButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 16,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
  },
  nextButtonDisabled: {
    backgroundColor: '#3a3a5e',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 30,
  },
  durationCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: 100,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  durationCardSelected: {
    borderColor: '#6C63FF',
    backgroundColor: '#6C63FF10',
  },
  durationLabel: {
    fontSize: 14,
    color: '#6a6a8a',
    marginTop: 8,
    fontWeight: '600',
  },
  durationLabelSelected: {
    color: '#6C63FF',
  },
  sealButton: {
    backgroundColor: '#9B59B6',
    paddingVertical: 18,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  sealButtonDisabled: {
    backgroundColor: '#3a3a5e',
  },
  sealButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    padding: 10,
  },
  backButtonText: {
    color: '#6a6a8a',
    fontSize: 14,
  },
  sealingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  boxContainer: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#6C63FF',
    opacity: 0.3,
  },
  boxBody: {
    width: 120,
    height: 100,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxLid: {
    position: 'absolute',
    top: 20,
    width: 130,
    height: 30,
    backgroundColor: '#2a2a4e',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 3,
    borderColor: '#6C63FF',
    transformOrigin: 'bottom',
  },
  lidInner: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  lockContainer: {
    position: 'absolute',
    bottom: 20,
  },
  lockBadge: {
    backgroundColor: '#1a1a2e',
    borderRadius: 30,
    padding: 10,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  sealingText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  sealedInfo: {
    fontSize: 14,
    color: '#a0a0c0',
    textAlign: 'center',
    marginBottom: 30,
  },
  doneButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
