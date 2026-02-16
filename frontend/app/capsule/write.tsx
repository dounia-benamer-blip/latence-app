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

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

function formatToday(): string {
  const d = new Date();
  const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

export default function WriteScreen() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [interpretation, setInterpretation] = useState('');
  const [phase, setPhase] = useState<'write' | 'reflecting' | 'done'>('write');

  const handleSaveAndReflect = async () => {
    if (!content.trim()) return;

    setPhase('reflecting');
    setIsSaving(true);

    try {
      // Save journal entry
      fetch(`${API_URL}/api/journal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), date: new Date().toISOString() }),
      });

      // Get AI interpretation in parallel
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            data-testid="write-back-btn"
          >
            <Ionicons name="chevron-down" size={26} color="#8B8B7B" />
          </TouchableOpacity>

          {phase === 'write' && (
            <TouchableOpacity
              style={[styles.saveBtn, !content.trim() && styles.saveBtnDisabled]}
              onPress={handleSaveAndReflect}
              disabled={!content.trim() || isSaving}
              data-testid="write-save-btn"
            >
              <Ionicons name="sparkles" size={15} color={content.trim() ? '#fff' : '#B0B0A0'} />
              <Text style={[styles.saveBtnText, !content.trim() && styles.saveBtnTextDisabled]}>
                Déposer
              </Text>
            </TouchableOpacity>
          )}

          {phase === 'done' && (
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => router.back()}
              data-testid="write-done-btn"
            >
              <Text style={styles.doneBtnText}>Fermer</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Writing phase */}
          {phase === 'write' && (
            <Animated.View entering={FadeInUp.duration(400)}>
              <Text style={styles.date}>{formatToday()}</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Qu'est-ce qui traverse ton esprit ?"
                placeholderTextColor="#C4C4B4"
                value={content}
                onChangeText={setContent}
                multiline
                autoFocus
                textAlignVertical="top"
                data-testid="write-content-input"
              />
            </Animated.View>
          )}

          {/* Reflecting phase - loading */}
          {phase === 'reflecting' && (
            <Animated.View entering={FadeIn.duration(500)} style={styles.reflectingContainer}>
              <ActivityIndicator color="#C4A87C" size="large" />
              <Text style={styles.reflectingTitle}>Lecture en cours...</Text>
              <Text style={styles.reflectingSubtext}>L'IA lit tes mots avec attention</Text>
            </Animated.View>
          )}

          {/* Done phase - show interpretation */}
          {phase === 'done' && (
            <Animated.View entering={FadeInDown.duration(600)}>
              {/* Original text */}
              <Text style={styles.date}>{formatToday()}</Text>
              <Text style={styles.originalText}>{content}</Text>

              {/* AI Interpretation */}
              {interpretation ? (
                <Animated.View entering={FadeInUp.duration(600).delay(200)} style={styles.interpretCard}>
                  <View style={styles.interpretHeader}>
                    <View style={styles.interpretIcon}>
                      <Ionicons name="sparkles" size={18} color="#C4A87C" />
                    </View>
                    <Text style={styles.interpretTitle}>Reflet</Text>
                  </View>
                  <Text style={styles.interpretText}>{interpretation}</Text>
                </Animated.View>
              ) : (
                <View style={styles.interpretCard}>
                  <Text style={styles.interpretText}>Tes mots ont été déposés en silence.</Text>
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
  container: { flex: 1, backgroundColor: '#F5F0E8' },
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
    backgroundColor: '#8B9A7D',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  saveBtnDisabled: { backgroundColor: '#E0E0D8' },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  saveBtnTextDisabled: { color: '#B0B0A0' },
  doneBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#E8E0D4',
  },
  doneBtnText: { color: '#6B6B5B', fontSize: 14, fontWeight: '500' },
  scroll: { padding: 24, paddingTop: 8, flexGrow: 1 },
  date: {
    fontSize: 13,
    color: '#A0A090',
    textTransform: 'capitalize',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  textInput: {
    fontSize: 18,
    color: '#4A4A4A',
    lineHeight: 30,
    minHeight: 250,
    fontWeight: '300',
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
    color: '#C4A87C',
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  reflectingSubtext: {
    fontSize: 13,
    color: '#A0A090',
  },
  originalText: {
    fontSize: 16,
    color: '#6B6B5B',
    lineHeight: 26,
    fontWeight: '300',
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D4',
  },
  interpretCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderLeftWidth: 3,
    borderLeftColor: '#C4A87C',
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
    backgroundColor: '#C4A87C18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  interpretTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#C4A87C',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  interpretText: {
    fontSize: 15,
    color: '#3A3A3A',
    lineHeight: 26,
    fontStyle: 'italic',
  },
});
