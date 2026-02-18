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
} from 'react-native-reanimated';
import { useTheme } from '../../src/context/ThemeContext';

const { width, height } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// Duration options with colored keys
const DURATION_OPTIONS = [
  { days: 7, label: '7 jours', keyColor: '#A8D4A8', keyName: 'Clé Émeraude' },
  { days: 15, label: '15 jours', keyColor: '#A8C4D4', keyName: 'Clé Saphir' },
  { days: 30, label: '1 mois', keyColor: '#D4A8D4', keyName: 'Clé Améthyste' },
  { days: 90, label: '3 mois', keyColor: '#D4C4A8', keyName: 'Clé Ambre' },
  { days: 180, label: '6 mois', keyColor: '#C47C7C', keyName: 'Clé Rubis' },
  { days: 365, label: '1 an', keyColor: '#D4A574', keyName: 'Clé Or' },
];

const PROMPTS = [
  "Qu'est-ce qui t'a fait sourire aujourd'hui ?",
  "Si tu pouvais envoyer un message à ton toi du futur ?",
  "Quel rêve secret portes-tu en toi ?",
  "Qu'est-ce que tu te pardonnes aujourd'hui ?",
];

// Animated Candle Component
const AnimatedCandle = ({ size = 60 }: { size?: number }) => {
  const flicker = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    flicker.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 150, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.6, { duration: 100 }),
        withTiming(0.9, { duration: 120 }),
        withTiming(0.7, { duration: 80 }),
        withTiming(1, { duration: 100 })
      ),
      -1,
      false
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.6, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const flameStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleX: interpolate(flicker.value, [0.6, 1], [0.85, 1.1]) },
      { scaleY: interpolate(flicker.value, [0.6, 1], [0.9, 1.15]) },
    ],
    opacity: interpolate(flicker.value, [0.6, 1], [0.85, 1]),
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0.6, 1], [0.3, 0.6]),
    transform: [{ scale: interpolate(glow.value, [0.6, 1], [1, 1.3]) }],
  }));

  return (
    <View style={[styles.candleContainer, { width: size * 1.5, height: size * 2.5 }]}>
      {/* Glow */}
      <Animated.View style={[styles.candleGlow, glowStyle, { width: size * 2, height: size * 2 }]} />
      {/* Candle body */}
      <View style={[styles.candleBody, { width: size * 0.4, height: size * 1.2 }]}>
        <View style={styles.candleWax} />
      </View>
      {/* Wick */}
      <View style={[styles.candleWick, { height: size * 0.15, bottom: size * 1.2 }]} />
      {/* Flame */}
      <Animated.View style={[styles.flameContainer, flameStyle, { bottom: size * 1.25 }]}>
        <View style={[styles.flameOuter, { width: size * 0.25, height: size * 0.45 }]} />
        <View style={[styles.flameInner, { width: size * 0.12, height: size * 0.25 }]} />
      </Animated.View>
    </View>
  );
};

export default function SealScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [step, setStep] = useState<'write' | 'duration' | 'sealing' | 'done'>('write');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [duration, setDuration] = useState<number | null>(null);
  const [selectedKey, setSelectedKey] = useState<typeof DURATION_OPTIONS[0] | null>(null);

  const ds = {
    container: { backgroundColor: theme.background },
    card: { backgroundColor: theme.card },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    textMuted: { color: theme.textMuted },
  };

  // Animation values
  const papyrusY = useSharedValue(0);
  const papyrusScale = useSharedValue(1);
  const papyrusRotate = useSharedValue(0);
  const papyrusOpacity = useSharedValue(1);
  
  const boxY = useSharedValue(150);
  const boxScale = useSharedValue(0.7);
  const boxOpacity = useSharedValue(0);
  
  const lidRotation = useSharedValue(0);
  const lidY = useSharedValue(0);
  
  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.5);
  
  const keyScale = useSharedValue(0);
  const keyOpacity = useSharedValue(0);
  const keyRotate = useSharedValue(-180);
  
  const sealTextOpacity = useSharedValue(0);
  const candleOpacity = useSharedValue(1);

  const papyrusStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: papyrusY.value },
      { scale: papyrusScale.value },
      { rotateZ: `${papyrusRotate.value}deg` },
    ],
    opacity: papyrusOpacity.value,
  }));

  const boxStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: boxY.value },
      { scale: boxScale.value },
    ],
    opacity: boxOpacity.value,
  }));

  const lidStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: lidY.value },
      { perspective: 500 },
      { rotateX: `${lidRotation.value}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const keyStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: keyScale.value },
      { rotateZ: `${keyRotate.value}deg` },
    ],
    opacity: keyOpacity.value,
  }));

  const sealTextStyle = useAnimatedStyle(() => ({
    opacity: sealTextOpacity.value,
  }));

  const candleStyle = useAnimatedStyle(() => ({
    opacity: candleOpacity.value,
  }));

  const startSealAnimation = () => {
    if (!duration) return;
    const key = DURATION_OPTIONS.find(d => d.days === duration);
    setSelectedKey(key || null);
    setStep('sealing');

    // Phase 1: Box appears
    boxOpacity.value = withTiming(1, { duration: 600 });
    boxY.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.back(1.2)) });
    boxScale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.back(1.2)) });

    // Phase 2: Lid opens
    lidRotation.value = withDelay(800, withTiming(-70, { duration: 700 }));
    lidY.value = withDelay(800, withTiming(-10, { duration: 500 }));

    // Phase 3: Papyrus floats and enters box
    papyrusY.value = withDelay(1500, withSequence(
      withTiming(-40, { duration: 500 }),
      withTiming(-50, { duration: 200 }),
      withTiming(120, { duration: 700, easing: Easing.in(Easing.cubic) })
    ));
    papyrusScale.value = withDelay(1500, withSequence(
      withTiming(1.1, { duration: 500 }),
      withTiming(1.05, { duration: 200 }),
      withTiming(0.3, { duration: 700 })
    ));
    papyrusRotate.value = withDelay(1500, withTiming(180, { duration: 1200 }));
    papyrusOpacity.value = withDelay(2600, withTiming(0, { duration: 200 }));

    // Phase 4: Lid closes
    lidRotation.value = withDelay(2800, withTiming(0, { duration: 600 }));
    lidY.value = withDelay(2800, withTiming(0, { duration: 500 }));

    // Phase 5: Golden glow
    glowOpacity.value = withDelay(3500, withSequence(
      withTiming(0.7, { duration: 400 }),
      withTiming(0.4, { duration: 300 }),
      withTiming(0.5, { duration: 200 })
    ));
    glowScale.value = withDelay(3500, withSequence(
      withTiming(1.6, { duration: 400 }),
      withTiming(1.3, { duration: 300 })
    ));

    // Phase 6: Box pulses
    boxScale.value = withDelay(3700, withSequence(
      withSpring(0.95, { damping: 8 }),
      withSpring(1.05, { damping: 8 }),
      withSpring(1, { damping: 10 })
    ));

    // Phase 7: Colored key appears with rotation
    keyOpacity.value = withDelay(4200, withTiming(1, { duration: 400 }));
    keyScale.value = withDelay(4200, withSpring(1, { damping: 8, stiffness: 100 }));
    keyRotate.value = withDelay(4200, withTiming(0, { duration: 800, easing: Easing.out(Easing.back(1.5)) }));

    // Phase 8: Text appears
    sealTextOpacity.value = withDelay(5000, withTiming(1, { duration: 600 }));

    // Dim candle
    candleOpacity.value = withDelay(3000, withTiming(0.3, { duration: 1500 }));

    setTimeout(() => saveCapsule(), 6000);
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
      {/* Candle at top */}
      <View style={styles.candleSection}>
        <AnimatedCandle size={50} />
      </View>

      <Text style={[styles.stepTitle, ds.text]}>Ta pensée</Text>
      
      <View style={styles.promptsRow}>
        {PROMPTS.slice(0, 2).map((prompt, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.promptChip, ds.card]}
            onPress={() => setContent(prompt + '\n\n')}
          >
            <Text style={[styles.promptText, ds.textMuted]} numberOfLines={2}>{prompt}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={[styles.titleInput, ds.card, ds.text]}
        placeholder="Titre (optionnel)"
        placeholderTextColor={theme.textMuted}
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        style={[styles.contentInput, ds.card, ds.text]}
        placeholder="Ce que tu veux confier au temps..."
        placeholderTextColor={theme.textMuted}
        value={content}
        onChangeText={setContent}
        multiline
        textAlignVertical="top"
      />

      <TouchableOpacity
        style={[styles.nextButton, { backgroundColor: theme.accent }, !content.trim() && styles.buttonDisabled]}
        onPress={() => setStep('duration')}
        disabled={!content.trim()}
      >
        <Text style={styles.nextButtonText}>Choisir la durée</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderDuration = () => (
    <Animated.View entering={FadeIn.duration(400)} style={styles.content}>
      <View style={styles.candleSection}>
        <AnimatedCandle size={50} />
      </View>

      <Text style={[styles.stepTitle, ds.text]}>Choisis ta clé</Text>
      <Text style={[styles.stepSubtitle, ds.textMuted]}>Chaque durée a sa clé unique. Elle sera gardée dans ton profil.</Text>

      <View style={styles.keysGrid}>
        {DURATION_OPTIONS.map((opt, i) => (
          <Animated.View key={opt.days} entering={FadeInUp.duration(300).delay(i * 60)}>
            <TouchableOpacity
              style={[
                styles.keyCard,
                ds.card,
                duration === opt.days && { borderColor: opt.keyColor, borderWidth: 2 },
              ]}
              onPress={() => setDuration(opt.days)}
            >
              <View style={[styles.keyIcon, { backgroundColor: opt.keyColor }]}>
                <Ionicons name="key" size={20} color="#fff" />
              </View>
              <Text style={[styles.keyLabel, ds.text]}>{opt.label}</Text>
              <Text style={[styles.keyName, { color: opt.keyColor }]}>{opt.keyName}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.sealButton, { backgroundColor: theme.accentWarm }, !duration && styles.buttonDisabled]}
        onPress={startSealAnimation}
        disabled={!duration}
      >
        <Ionicons name="lock-closed" size={18} color="#fff" />
        <Text style={styles.sealButtonText}>Sceller dans la boîte</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backLink} onPress={() => setStep('write')}>
        <Text style={[styles.backLinkText, ds.textMuted]}>Modifier le texte</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderSealing = () => (
    <View style={styles.sealingContainer}>
      {/* Candle */}
      <Animated.View style={[styles.sealingCandle, candleStyle]}>
        <AnimatedCandle size={40} />
      </Animated.View>

      {/* Glow */}
      <Animated.View style={[styles.glowCircle, glowStyle]} />

      {/* Papyrus */}
      <Animated.View style={[styles.papyrusContainer, papyrusStyle]}>
        <View style={styles.papyrus}>
          <View style={styles.papyrusLines}>
            <View style={styles.papyrusLine} />
            <View style={[styles.papyrusLine, { width: '85%' }]} />
            <View style={[styles.papyrusLine, { width: '70%' }]} />
            <View style={[styles.papyrusLine, { width: '90%' }]} />
          </View>
          <View style={styles.waxSeal} />
        </View>
      </Animated.View>

      {/* Wooden Box */}
      <Animated.View style={[styles.boxContainer, boxStyle]}>
        <View style={styles.woodBox}>
          {/* Box interior */}
          <View style={styles.boxInterior} />
          {/* Wood grain lines */}
          <View style={styles.woodGrain}>
            <View style={styles.grainLine} />
            <View style={styles.grainLine} />
            <View style={styles.grainLine} />
          </View>
          {/* Latence text engraved */}
          <Text style={styles.latenceText}>Latence</Text>
          {/* Metal corners */}
          <View style={[styles.metalCorner, { top: 4, left: 4 }]} />
          <View style={[styles.metalCorner, { top: 4, right: 4 }]} />
          <View style={[styles.metalCorner, { bottom: 4, left: 4 }]} />
          <View style={[styles.metalCorner, { bottom: 4, right: 4 }]} />
        </View>
        {/* Lid */}
        <Animated.View style={[styles.boxLid, lidStyle]}>
          <View style={styles.lidWoodGrain}>
            <View style={styles.grainLine} />
            <View style={styles.grainLine} />
          </View>
          <View style={styles.lidHandle} />
        </Animated.View>
      </Animated.View>

      {/* Colored Key */}
      <Animated.View style={[styles.keyWrapper, keyStyle]}>
        <View style={[styles.bigKey, { backgroundColor: selectedKey?.keyColor || '#D4A574' }]}>
          <Ionicons name="key" size={32} color="#fff" />
        </View>
      </Animated.View>

      {/* Text */}
      <Animated.View style={[styles.sealTextContainer, sealTextStyle]}>
        <Text style={[styles.sealingText, ds.textSecondary]}>Scellée...</Text>
        <Text style={[styles.keyObtainedText, { color: selectedKey?.keyColor }]}>
          {selectedKey?.keyName} obtenue
        </Text>
      </Animated.View>
    </View>
  );

  const renderDone = () => (
    <Animated.View entering={FadeIn.duration(600)} style={styles.doneContainer}>
      <View style={[styles.doneIconContainer, { backgroundColor: `${selectedKey?.keyColor}20` }]}>
        <View style={[styles.doneKey, { backgroundColor: selectedKey?.keyColor }]}>
          <Ionicons name="key" size={28} color="#fff" />
        </View>
      </View>
      <Text style={[styles.doneTitle, ds.text]}>Scellée</Text>
      <Text style={[styles.doneKeyName, { color: selectedKey?.keyColor }]}>{selectedKey?.keyName}</Text>
      <Text style={[styles.doneSubtitle, ds.textMuted]}>
        Ta pensée sera gardée précieusement.{'\n'}
        Ouverture dans {DURATION_OPTIONS.find(d => d.days === duration)?.label}
      </Text>
      <View style={[styles.keyCollectionNote, ds.card]}>
        <Ionicons name="information-circle-outline" size={16} color={theme.textMuted} />
        <Text style={[styles.keyNoteText, ds.textMuted]}>
          Cette clé est maintenant dans ton profil
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.doneButton, { backgroundColor: theme.accent }]}
        onPress={() => router.replace('/home')}
      >
        <Text style={styles.doneButtonText}>Terminé</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={[styles.container, ds.container]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        {step !== 'sealing' && step !== 'done' && (
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-down" size={28} color={theme.iconColor} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, ds.text]}>Sceller</Text>
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
  container: { flex: 1 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '500' },
  placeholder: { width: 36 },
  scrollContent: { flexGrow: 1, padding: 24 },
  content: { flex: 1 },

  // Candle
  candleSection: { alignItems: 'center', marginBottom: 20 },
  candleContainer: { alignItems: 'center', justifyContent: 'flex-end' },
  candleGlow: { position: 'absolute', borderRadius: 100, backgroundColor: 'rgba(255, 200, 100, 0.25)', bottom: '30%' },
  candleBody: { backgroundColor: '#F5E6D3', borderRadius: 4, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  candleWax: { position: 'absolute', top: 0, left: 0, right: 0, height: 8, backgroundColor: '#E8D9C5', borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  candleWick: { position: 'absolute', width: 2, backgroundColor: '#4A4A4A', borderRadius: 1 },
  flameContainer: { position: 'absolute', alignItems: 'center' },
  flameOuter: { backgroundColor: '#FF9500', borderRadius: 100, borderTopLeftRadius: 50, borderTopRightRadius: 50 },
  flameInner: { position: 'absolute', backgroundColor: '#FFD700', borderRadius: 50, bottom: 2 },

  stepTitle: { fontSize: 26, fontWeight: '200', letterSpacing: 1, marginBottom: 8 },
  stepSubtitle: { fontSize: 14, marginBottom: 24, lineHeight: 20 },
  
  promptsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  promptChip: { flex: 1, borderRadius: 12, padding: 14 },
  promptText: { fontSize: 12, lineHeight: 16 },
  titleInput: { borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 16 },
  contentInput: { borderRadius: 12, padding: 16, fontSize: 16, minHeight: 160, marginBottom: 24 },
  nextButton: { paddingVertical: 16, borderRadius: 28, alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  nextButtonText: { color: '#fff', fontSize: 15, fontWeight: '500' },

  // Keys Grid
  keysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  keyCard: { width: (width - 60) / 2, borderRadius: 16, padding: 16, alignItems: 'center' },
  keyIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  keyLabel: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  keyName: { fontSize: 11, fontWeight: '600' },

  sealButton: { flexDirection: 'row', paddingVertical: 18, borderRadius: 28, alignItems: 'center', justifyContent: 'center', gap: 10 },
  sealButtonText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  backLink: { alignItems: 'center', marginTop: 20 },
  backLinkText: { fontSize: 13 },

  // Sealing Animation
  sealingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 500, paddingVertical: 40 },
  sealingCandle: { position: 'absolute', top: 20 },
  glowCircle: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(212, 165, 116, 0.35)' },

  papyrusContainer: { position: 'absolute', top: 80, zIndex: 10 },
  papyrus: { width: 100, height: 120, backgroundColor: '#F5E6D3', borderRadius: 4, padding: 12, borderWidth: 1, borderColor: '#E0D0B8' },
  papyrusLines: { flex: 1, gap: 8 },
  papyrusLine: { height: 2, backgroundColor: '#D4C4A8', borderRadius: 1, width: '100%' },
  waxSeal: { position: 'absolute', bottom: 8, right: 8, width: 20, height: 20, borderRadius: 10, backgroundColor: '#C47C7C' },

  boxContainer: { marginTop: 100 },
  woodBox: { width: 160, height: 100, backgroundColor: '#8B6914', borderRadius: 8, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  boxInterior: { position: 'absolute', width: 140, height: 80, backgroundColor: '#2A2520', borderRadius: 4, opacity: 0.4 },
  woodGrain: { position: 'absolute', width: '100%', height: '100%', justifyContent: 'space-evenly', paddingHorizontal: 10 },
  grainLine: { height: 1, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 1 },
  latenceText: { color: '#D4A574', fontSize: 14, fontWeight: '300', letterSpacing: 3, textTransform: 'uppercase' },
  metalCorner: { position: 'absolute', width: 12, height: 12, backgroundColor: '#B8860B', borderRadius: 2 },
  
  boxLid: { position: 'absolute', top: -16, width: 170, height: 24, backgroundColor: '#A07818', borderTopLeftRadius: 8, borderTopRightRadius: 8, alignItems: 'center', justifyContent: 'center', transformOrigin: 'bottom' },
  lidWoodGrain: { position: 'absolute', width: '100%', height: '100%', flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', paddingHorizontal: 20 },
  lidHandle: { width: 30, height: 6, backgroundColor: '#B8860B', borderRadius: 3 },

  keyWrapper: { position: 'absolute', bottom: 120 },
  bigKey: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },

  sealTextContainer: { position: 'absolute', bottom: 50, alignItems: 'center' },
  sealingText: { fontSize: 22, fontWeight: '200', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 8 },
  keyObtainedText: { fontSize: 14, fontWeight: '600' },

  // Done Screen
  doneContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  doneIconContainer: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  doneKey: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  doneTitle: { fontSize: 32, fontWeight: '200', letterSpacing: 3, marginBottom: 8 },
  doneKeyName: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  doneSubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  keyCollectionNote: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginBottom: 32 },
  keyNoteText: { fontSize: 13 },
  doneButton: { paddingVertical: 14, paddingHorizontal: 40, borderRadius: 28 },
  doneButtonText: { color: '#fff', fontSize: 15, fontWeight: '500' },
});
