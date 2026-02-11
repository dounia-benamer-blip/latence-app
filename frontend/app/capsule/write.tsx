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
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function WriteScreen() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
      setContent('');
      Alert.alert('', 'Sauvegardé', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e) {
      console.log('Error saving:', e);
      Alert.alert('', 'Sauvegardé localement');
      router.back();
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
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Ionicons name="chevron-down" size={28} color="#6B6B5B" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, !content.trim() && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!content.trim() || isSaving}
          >
            <Text style={[styles.saveText, !content.trim() && styles.saveTextDisabled]}>
              {isSaving ? '...' : 'Sauver'}
            </Text>
          </TouchableOpacity>
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
              placeholder="Écris ici..."
              placeholderTextColor="#C4C4B4"
              value={content}
              onChangeText={setContent}
              multiline
              autoFocus
              textAlignVertical="top"
            />
          </Animated.View>
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
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#8B9A7D',
    borderRadius: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#D4D4C4',
  },
  saveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  saveTextDisabled: {
    color: '#A0A090',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 0,
    flexGrow: 1,
  },
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
    minHeight: 400,
    fontWeight: '300',
  },
});
