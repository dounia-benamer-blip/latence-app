import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import { TwinklingStars } from '../src/components/TwinklingStars';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const DELIVERY_OPTIONS = [
  { key: '1_month', label: 'Dans 1 mois', description: 'Un premier rendez-vous avec toi-même', months: 1 },
  { key: '3_months', label: 'Dans 3 mois', description: 'Le temps d\'une saison', months: 3 },
  { key: '6_months', label: 'Dans 6 mois', description: 'Un demi-voyage autour du soleil', months: 6 },
  { key: '1_year', label: 'Dans 1 an', description: 'Une révolution complète', months: 12 },
  { key: '5_years', label: 'Dans 5 ans', description: 'Un message du passé lointain', months: 60 },
];

const FloatingEnvelope = ({ size = 80 }: { size?: number }) => {
  const float = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const envelopeStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(float.value, [0, 1], [0, -12]) }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0.5, 1], [0.2, 0.5]),
    transform: [{ scale: interpolate(glow.value, [0.5, 1], [1, 1.3]) }],
  }));

  return (
    <View style={[styles.envelopeContainer, { width: size * 2, height: size * 2 }]}>
      <Animated.View
        style={[styles.envelopeGlow, glowStyle, { width: size * 1.6, height: size * 1.6, borderRadius: size * 0.8 }]}
      />
      <Animated.View style={envelopeStyle}>
        <Text style={{ fontSize: size }}>💌</Text>
      </Animated.View>
    </View>
  );
};

export default function LettreScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [step, setStep] = useState<'write' | 'schedule' | 'sent'>('write');
  const [content, setContent] = useState('');
  const [deliveryMonths, setDeliveryMonths] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const ds = {
    container: { backgroundColor: theme.background },
    card: { backgroundColor: theme.card },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    textMuted: { color: theme.textMuted },
  };

  const getDeliveryDate = () => {
    if (!deliveryMonths) return '';
    const date = new Date();
    date.setMonth(date.getMonth() + deliveryMonths);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const saveLetter = async () => {
    if (!content.trim() || !deliveryMonths) return;
    setSaving(true);

    try {
      await fetch(`${API_URL}/api/letter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          delivery_months: deliveryMonths,
          delivery_date: getDeliveryDate(),
        }),
      });
    } catch (e) {
      console.log('Save letter error:', e);
    }

    setSaving(false);
    setStep('sent');
  };

  const renderWrite = () => (
    <Animated.View entering={FadeIn.duration(400)}>
      <FloatingEnvelope size={60} />

      <Text style={[styles.title, ds.text]}>Lettre à ton futur toi</Text>
      <Text style={[styles.subtitle, ds.textSecondary]}>
        Écris des mots que tu aimerais recevoir plus tard. Un message d'espoir, de gratitude ou simplement ce que tu vis aujourd'hui.
      </Text>

      <View style={[styles.promptCard, ds.card]}>
        <Ionicons name="bulb-outline" size={18} color={theme.accentWarm} />
        <Text style={[styles.promptText, ds.textMuted]}>
          Qu'est-ce que tu voudrais te rappeler ? Quels rêves portes-tu ? Qu'est-ce qui compte vraiment pour toi en ce moment ?
        </Text>
      </View>

      <TextInput
        style={[styles.letterInput, ds.card, ds.text]}
        placeholder="Cher moi du futur..."
        placeholderTextColor={theme.textMuted}
        value={content}
        onChangeText={setContent}
        multiline
        textAlignVertical="top"
      />

      <TouchableOpacity
        style={[styles.nextButton, { backgroundColor: theme.accent }, !content.trim() && styles.buttonDisabled]}
        onPress={() => setStep('schedule')}
        disabled={!content.trim()}
      >
        <Text style={styles.nextButtonText}>Choisir la date d'envoi</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderSchedule = () => (
    <Animated.View entering={FadeIn.duration(400)}>
      <Text style={[styles.title, ds.text]}>Choisir la date</Text>
      <Text style={[styles.subtitle, ds.textSecondary]}>
        Quand souhaites-tu recevoir cette lettre ?
      </Text>

      <View style={styles.optionsGrid}>
        {DELIVERY_OPTIONS.map((option, i) => (
          <Animated.View key={option.key} entering={FadeInUp.duration(300).delay(i * 60)}>
            <TouchableOpacity
              style={[
                styles.optionCard,
                ds.card,
                deliveryMonths === option.months && { borderColor: theme.accentWarm, borderWidth: 2 },
              ]}
              onPress={() => setDeliveryMonths(option.months)}
            >
              <Text style={[styles.optionLabel, ds.text]}>{option.label}</Text>
              <Text style={[styles.optionDescription, ds.textMuted]}>{option.description}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      {deliveryMonths && (
        <Animated.View entering={FadeIn.duration(300)} style={[styles.datePreview, ds.card]}>
          <Ionicons name="calendar-outline" size={18} color={theme.accentWarm} />
          <Text style={[styles.dateText, ds.text]}>Livraison le {getDeliveryDate()}</Text>
        </Animated.View>
      )}

      <TouchableOpacity
        style={[styles.sendButton, { backgroundColor: theme.accentWarm }, !deliveryMonths && styles.buttonDisabled]}
        onPress={saveLetter}
        disabled={!deliveryMonths || saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons name="paper-plane" size={18} color="#fff" />
            <Text style={styles.sendButtonText}>Envoyer vers le futur</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.backLink} onPress={() => setStep('write')}>
        <Text style={[styles.backLinkText, ds.textMuted]}>Modifier ma lettre</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderSent = () => (
    <Animated.View entering={FadeIn.duration(600)} style={styles.sentContainer}>
      <View style={[styles.sentIconContainer, { backgroundColor: `${theme.accentWarm}20` }]}>
        <Text style={styles.sentEmoji}>💌</Text>
      </View>
      <Text style={[styles.sentTitle, ds.text]}>Lettre envoyée</Text>
      <Text style={[styles.sentSubtitle, ds.textSecondary]}>
        Ta lettre voyagera dans le temps et t'attendra le {getDeliveryDate()}.
      </Text>
      <View style={[styles.sentNote, ds.card]}>
        <Ionicons name="time-outline" size={16} color={theme.textMuted} />
        <Text style={[styles.sentNoteText, ds.textMuted]}>
          Tu recevras une notification quand il sera temps de lire ta lettre.
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.doneButton, { backgroundColor: theme.accent }]}
        onPress={() => router.replace('/home')}
      >
        <Text style={styles.doneButtonText}>Retourner à l'accueil</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={[styles.container, ds.container]}>
      <TwinklingStars starCount={30} minSize={1} maxSize={2} />

      {step !== 'sent' && (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-down" size={28} color={theme.iconColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, ds.text]}>Lettre</Text>
          <View style={styles.placeholder} />
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 'write' && renderWrite()}
        {step === 'schedule' && renderSchedule()}
        {step === 'sent' && renderSent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '500', letterSpacing: 1 },
  placeholder: { width: 36 },
  scrollContent: { padding: 24, paddingBottom: 40 },

  envelopeContainer: { alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 20 },
  envelopeGlow: { position: 'absolute', backgroundColor: 'rgba(212, 165, 116, 0.2)' },

  title: { fontSize: 24, fontWeight: '200', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },

  promptCard: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, borderRadius: 12, marginBottom: 20, gap: 12 },
  promptText: { flex: 1, fontSize: 13, lineHeight: 20 },

  letterInput: { borderRadius: 16, padding: 20, fontSize: 16, lineHeight: 26, minHeight: 200, marginBottom: 24, fontWeight: '300' },

  nextButton: { paddingVertical: 16, borderRadius: 28, alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  nextButtonText: { color: '#fff', fontSize: 15, fontWeight: '500' },

  optionsGrid: { marginBottom: 24 },
  optionCard: { padding: 18, borderRadius: 14, marginBottom: 12 },
  optionLabel: { fontSize: 17, fontWeight: '500', marginBottom: 4 },
  optionDescription: { fontSize: 13 },

  datePreview: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 24, gap: 10, justifyContent: 'center' },
  dateText: { fontSize: 14, fontWeight: '500' },

  sendButton: { flexDirection: 'row', paddingVertical: 18, borderRadius: 28, alignItems: 'center', justifyContent: 'center', gap: 10 },
  sendButtonText: { color: '#fff', fontSize: 16, fontWeight: '500' },

  backLink: { alignItems: 'center', marginTop: 20 },
  backLinkText: { fontSize: 13 },

  sentContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  sentIconContainer: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  sentEmoji: { fontSize: 50 },
  sentTitle: { fontSize: 28, fontWeight: '200', letterSpacing: 2, marginBottom: 12 },
  sentSubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  sentNote: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, gap: 10, marginBottom: 32 },
  sentNoteText: { fontSize: 13 },
  doneButton: { paddingVertical: 14, paddingHorizontal: 40, borderRadius: 28 },
  doneButtonText: { color: '#fff', fontSize: 15, fontWeight: '500' },
});
