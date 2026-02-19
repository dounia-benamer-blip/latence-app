import React, { useState } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp, FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../src/context/ThemeContext';
import VoiceRecorder from '../../src/components/VoiceRecorder';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

function formatToday(): string {
  const d = new Date();
  const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

export default function WriteScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [interpretation, setInterpretation] = useState('');
  const [phase, setPhase] = useState<'write' | 'reflecting' | 'done'>('write');

  const ds = {
    container: { backgroundColor: theme.background },
    card: { backgroundColor: theme.card },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    textMuted: { color: theme.textMuted },
    border: { borderColor: theme.border },
    input: { backgroundColor: theme.inputBackground, color: theme.text },
  };

  const handleSaveAndReflect = async () => {
    if (!content.trim()) return;

    setPhase('reflecting');
    setIsSaving(true);

    try {
      fetch(`${API_URL}/api/journal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), date: new Date().toISOString() }),
      });

      const res = await fetch(`${API_URL}/api/journal/interpret`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setInterpretation(data.interpretation || '');
      }
      setPhase('done');
    } catch (e) {
      console.log('Error:', e);
      setPhase('done');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, ds.container]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            data-testid="write-back-btn"
          >
            <Ionicons name="chevron-down" size={26} color={theme.iconColor} />
          </TouchableOpacity>

          {phase === 'write' && (
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: theme.accent }, !content.trim() && { backgroundColor: theme.border }]}
              onPress={handleSaveAndReflect}
              disabled={!content.trim() || isSaving}
              data-testid="write-save-btn"
            >
              <Ionicons name="sparkles" size={15} color={content.trim() ? '#fff' : theme.textMuted} />
              <Text style={[styles.saveBtnText, !content.trim() && { color: theme.textMuted }]}>
                Déposer
              </Text>
            </TouchableOpacity>
          )}

          {phase === 'done' && (
            <TouchableOpacity
              style={[styles.doneBtn, ds.card]}
              onPress={() => router.back()}
              data-testid="write-done-btn"
            >
              <Text style={[styles.doneBtnText, ds.textSecondary]}>Fermer</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {phase === 'write' && (
            <Animated.View entering={FadeInUp.duration(400)}>
              <Text style={[styles.date, ds.textMuted]}>{formatToday()}</Text>
              
              {/* Voice Recorder */}
              <VoiceRecorder
                onTranscription={(text) => setContent(prev => prev ? `${prev}\n${text}` : text)}
                theme={theme}
                placeholder="🎙️ Dicte tes pensées..."
              />
              
              <TextInput
                style={[styles.textInput, ds.text]}
                placeholder="Qu'est-ce qui traverse ton esprit ?"
                placeholderTextColor={theme.textMuted}
                value={content}
                onChangeText={setContent}
                multiline
                autoFocus
                textAlignVertical="top"
                data-testid="write-content-input"
              />
            </Animated.View>
          )}

          {phase === 'reflecting' && (
            <Animated.View entering={FadeIn.duration(500)} style={styles.reflectingContainer}>
              <ActivityIndicator color={theme.accentWarm} size="large" />
              <Text style={[styles.reflectingTitle, { color: theme.accentWarm }]}>Lecture en cours...</Text>
              <Text style={[styles.reflectingSubtext, ds.textMuted]}>L'IA lit tes mots avec attention</Text>
            </Animated.View>
          )}

          {phase === 'done' && (
            <Animated.View entering={FadeInDown.duration(600)}>
              <Text style={[styles.date, ds.textMuted]}>{formatToday()}</Text>
              <Text style={[styles.originalText, ds.textSecondary, { borderBottomColor: theme.border }]}>{content}</Text>

              {interpretation ? (
                <Animated.View entering={FadeInUp.duration(600).delay(200)} style={[styles.interpretCard, ds.card, { borderLeftColor: theme.accentWarm }]}>
                  <View style={styles.interpretHeader}>
                    <View style={[styles.interpretIcon, { backgroundColor: `${theme.accentWarm}18` }]}>
                      <Ionicons name="sparkles" size={18} color={theme.accentWarm} />
                    </View>
                    <Text style={[styles.interpretTitle, { color: theme.accentWarm }]}>Reflet</Text>
                  </View>
                  <Text style={[styles.interpretText, ds.text]}>{interpretation}</Text>
                </Animated.View>
              ) : (
                <View style={[styles.interpretCard, ds.card]}>
                  <Text style={[styles.interpretText, ds.text]}>Tes mots ont été déposés en silence.</Text>
                </View>
              )}
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  doneBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  doneBtnText: { fontSize: 14, fontWeight: '500' },
  scroll: { padding: 24, paddingTop: 8, flexGrow: 1 },
  date: {
    fontSize: 13,
    textTransform: 'capitalize',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  textInput: {
    fontSize: 18,
    lineHeight: 30,
    minHeight: 250,
    fontWeight: '400',
  },
  reflectingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
    gap: 16,
  },
  reflectingTitle: {
    fontSize: 18,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  reflectingSubtext: {
    fontSize: 13,
  },
  originalText: {
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '300',
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
  },
  interpretCard: {
    borderRadius: 20,
    padding: 24,
    borderLeftWidth: 3,
  },
  interpretHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  interpretIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  interpretTitle: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  interpretText: {
    fontSize: 15,
    lineHeight: 26,
    fontStyle: 'italic',
  },
});
