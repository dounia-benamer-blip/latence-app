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
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  Easing,
} from 'react-native-reanimated';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const DURATION_OPTIONS = [
  { days: 7, label: '7 jours' },
  { days: 30, label: '1 mois' },
  { days: 90, label: '3 mois' },
  { days: 180, label: '6 mois' },
  { days: 365, label: '1 an' },
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
    
    boxLidRotation.value = withTiming(-90, { duration: 1000, easing: Easing.bezier(0.4, 0, 0.2, 1) });
    
    setTimeout(() => {
      boxScale.value = withSequence(
        withSpring(0.9, { damping: 10 }),
        withSpring(1, { damping: 8 })
      );
    }, 800);
    
    setTimeout(() => {
      glowOpacity.value = withSequence(
        withTiming(0.8, { duration: 500 }),
        withTiming(0.2, { duration: 800 })
      );
    }, 1200);
    
    setTimeout(() => {
      lockScale.value = withSpring(1, { damping: 8 });
    }, 1500);
    
    setTimeout(() => {
      setIsSealed(true);
      setIsSealing(false);
    }, 2200);
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
      <Text style={styles.stepTitle}>Écrire</Text>
      <Text style={styles.stepSubtitle}>Choisis un prompt ou écris librement</Text>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.promptsScroll}
        contentContainerStyle={styles.promptsContent}
      >
        {prompts.slice(0, 6).map((prompt, index) => (
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
            <Text style={styles.promptText}>{prompt}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Titre</Text>
        <TextInput
          style={styles.titleInput}
          placeholder="Un nom pour ce souvenir..."
          placeholderTextColor="#B0B0A0"
          value={title}
          onChangeText={setTitle}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>
          {selectedPrompt || 'Tes pensées'}
        </Text>
        <TextInput
          style={styles.contentInput}
          placeholder="Écris ce que tu veux confier au temps..."
          placeholderTextColor="#B0B0A0"
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
      </TouchableOpacity>
    </Animated.View>
  );

  const renderStep2 = () => (
    <Animated.View entering={FadeIn.duration(500)} style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Sceller</Text>
      <Text style={styles.stepSubtitle}>Quand veux-tu ouvrir cette capsule ?</Text>

      <View style={styles.durationContainer}>
        {DURATION_OPTIONS.map((option, index) => (
          <Animated.View
            key={option.days}
            entering={FadeInUp.duration(400).delay(index * 80)}
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
        style={styles.backButton}
        onPress={() => setStep(1)}
      >
        <Text style={styles.backButtonText}>Modifier</Text>
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
        {isSealed ? 'Scellée' : 'Scellement...'}
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={24} color="#6B6B5B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Déposer</Text>
          <View style={styles.headerButton} />
        </Animated.View>

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
    backgroundColor: '#F5F0E8',
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
    fontSize: 16,
    fontWeight: '500',
    color: '#4A4A4A',
    letterSpacing: 0.5,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D4D4C4',
  },
  progressDotActive: {
    backgroundColor: '#8B9A7D',
  },
  progressLine: {
    width: 48,
    height: 2,
    backgroundColor: '#D4D4C4',
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: '#8B9A7D',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '300',
    color: '#4A4A4A',
    letterSpacing: 1,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#8B8B7D',
    marginBottom: 24,
  },
  promptsScroll: {
    marginBottom: 24,
    marginHorizontal: -24,
  },
  promptsContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  promptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  promptCardSelected: {
    backgroundColor: '#FDF9F3',
    borderWidth: 1,
    borderColor: '#D4C4A8',
  },
  promptText: {
    fontSize: 13,
    color: '#6B6B5B',
    lineHeight: 18,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    color: '#8B8B7D',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  titleInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#4A4A4A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  contentInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#4A4A4A',
    minHeight: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  nextButton: {
    backgroundColor: '#8B9A7D',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  nextButtonDisabled: {
    backgroundColor: '#D4D4C4',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.5,
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
    letterSpacing: 0.5,
  },
  backButton: {
    alignItems: 'center',
    marginTop: 20,
    padding: 10,
  },
  backButtonText: {
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
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  glow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#D4A574',
    opacity: 0.2,
  },
  boxBody: {
    width: 100,
    height: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D4C4A8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxLid: {
    position: 'absolute',
    top: 25,
    width: 108,
    height: 24,
    backgroundColor: '#F5F0E8',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 2,
    borderColor: '#D4C4A8',
    transformOrigin: 'bottom',
  },
  lidInner: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  lockContainer: {
    position: 'absolute',
    bottom: 15,
  },
  lockBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 8,
    borderWidth: 2,
    borderColor: '#D4A574',
  },
  sealingText: {
    fontSize: 24,
    fontWeight: '300',
    color: '#4A4A4A',
    letterSpacing: 1,
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
    letterSpacing: 0.5,
  },
});
