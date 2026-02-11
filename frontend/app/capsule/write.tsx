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
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function WriteScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<string[]>([]);

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

  const handleSaveDraft = async () => {
    if (!title || !content) return;
    
    try {
      const draft = {
        title,
        content,
        prompt_used: selectedPrompt,
        created_at: new Date().toISOString(),
      };
      await AsyncStorage.setItem('capsule_draft', JSON.stringify(draft));
      router.push('/capsule/seal');
    } catch (e) {
      console.log('Error saving draft:', e);
    }
  };

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
          <Text style={styles.headerTitle}>Écrire</Text>
          <View style={styles.headerButton} />
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInUp.duration(500)}>
            <Text style={styles.sectionTitle}>Une inspiration ?</Text>
            
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
                    setSelectedPrompt(selectedPrompt === prompt ? null : prompt);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.promptText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(500).delay(100)}>
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
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(500).delay(200)}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                (!title || !content) && styles.saveButtonDisabled,
              ]}
              onPress={handleSaveDraft}
              disabled={!title || !content}
              activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>Passer au scellement</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
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
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#8B8B7D',
    marginBottom: 16,
  },
  promptsScroll: {
    marginBottom: 32,
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
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 12,
    color: '#8B8B7D',
    marginBottom: 8,
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
    minHeight: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  saveButton: {
    backgroundColor: '#8B9A7D',
    paddingVertical: 16,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  saveButtonDisabled: {
    backgroundColor: '#D4D4C4',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
});
