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
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function WriteScreen() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [interpretation, setInterpretation] = useState('');
  const [saved, setSaved] = useState(false);

  const today = format(new Date(), "EEEE d MMMM", { locale: fr });

  const handleSave = async () => {
    if (!content.trim()) return;
    
    setIsSaving(true);
    try {
      await fetch(`${API_URL}/api/journal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          date: new Date().toISOString(),
        }),
      });
      setSaved(true);
    } catch (e) {
      console.log('Error saving:', e);
      setSaved(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInterpret = async () => {
    if (!content.trim()) return;
    
    setIsInterpreting(true);
    try {
      const res = await fetch(`${API_URL}/api/journal/interpret`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setInterpretation(data.interpretation);
      }
    } catch (e) {
      console.log('Error interpreting:', e);
    } finally {
      setIsInterpreting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            data-testid="write-back-btn"
          >
            <Ionicons name="chevron-down" size={28} color="#6B6B5B" />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            {saved && !interpretation && (
              <TouchableOpacity
                style={styles.interpretButton}
                onPress={handleInterpret}
                disabled={isInterpreting}
                data-testid="write-interpret-btn"
              >
                {isInterpreting ? (
                  <ActivityIndicator color="#A8B4C4" size="small" />
                ) : (
                  <>
                    <Ionicons name="sparkles-outline" size={16} color="#A8B4C4" />
                    <Text style={styles.interpretText}>Éclairer</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.saveButton, (!content.trim() || saved) && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!content.trim() || isSaving || saved}
              data-testid="write-save-btn"
            >
              <Text style={[styles.saveText, (!content.trim() || saved) && styles.saveTextDisabled]}>
                {isSaving ? '...' : saved ? 'Sauvé' : 'Sauver'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInUp.duration(500).delay(100)}>
            <Text style={styles.date}>{today}</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ecris ici..."
              placeholderTextColor="#C4C4B4"
              value={content}
              onChangeText={(text) => { setContent(text); if (saved) { setSaved(false); setInterpretation(''); }}}
              multiline
              autoFocus
              textAlignVertical="top"
              data-testid="write-content-input"
            />
          </Animated.View>

          {interpretation && (
            <Animated.View entering={FadeInUp.duration(600)} style={styles.interpretationCard}>
              <View style={styles.interpretationHeader}>
                <Ionicons name="sparkles" size={20} color="#C4A87C" />
                <Text style={styles.interpretationTitle}>Reflet</Text>
              </View>
              <Text style={styles.interpretationText}>{interpretation}</Text>
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
    paddingVertical: 16,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backButton: { padding: 4 },
  interpretButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A8B4C420',
  },
  interpretText: { color: '#A8B4C4', fontSize: 13, fontWeight: '500' },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#8B9A7D',
    borderRadius: 20,
  },
  saveButtonDisabled: { backgroundColor: '#D4D4C4' },
  saveText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  saveTextDisabled: { color: '#A0A090' },
  scrollContent: { padding: 24, paddingTop: 0, flexGrow: 1 },
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
    lineHeight: 28,
    minHeight: 200,
    fontWeight: '300',
  },
  interpretationCard: {
    marginTop: 32,
    backgroundColor: '#FDF9F3',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E8E0D4',
  },
  interpretationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  interpretationTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#C4A87C',
    letterSpacing: 0.5,
  },
  interpretationText: {
    fontSize: 15,
    color: '#6B6B5B',
    lineHeight: 24,
    fontStyle: 'italic',
  },
});
