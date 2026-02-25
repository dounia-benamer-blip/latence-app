import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp, FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import { useFonts } from '../src/context/FontContext';
import { TwinklingStars } from '../src/components/TwinklingStars';
import VoiceRecorder from '../src/components/VoiceRecorder';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const DAILY_PROMPTS = [
  { category: 'introspection', prompts: [
    "Qu'est-ce qui t'a fait sourire aujourd'hui ?",
    "Si tu pouvais revivre un moment de cette semaine, lequel choisirais-tu ?",
    "Qu'est-ce que tu n'as pas eu le courage de dire aujourd'hui ?",
    "Quelle peur t'a empêché d'agir récemment ?",
    "Qu'est-ce qui te manque le plus en ce moment ?",
  ]},
  { category: 'gratitude', prompts: [
    "Nomme 3 petites choses qui ont rendu ta journée meilleure.",
    "Qui mérite un merci que tu n'as pas encore dit ?",
    "Quel privilège invisible as-tu tendance à oublier ?",
    "Qu'est-ce qui va bien dans ta vie que tu ne remarques plus ?",
  ]},
  { category: 'reves', prompts: [
    "Si tu n'avais pas peur de l'échec, que ferais-tu ?",
    "Décris ta vie idéale dans 5 ans.",
    "Quel rêve as-tu abandonné trop tôt ?",
    "Qu'est-ce que tu ferais si tu savais que tu ne pouvais pas échouer ?",
  ]},
  { category: 'relations', prompts: [
    "À qui tu penses en ce moment et pourquoi ?",
    "Quelle conversation évites-tu depuis trop longtemps ?",
    "Qui t'a appris quelque chose d'important cette année ?",
    "Si tu pouvais envoyer un message à n'importe qui, ce serait quoi ?",
  ]},
  { category: 'croissance', prompts: [
    "Qu'as-tu appris sur toi-même récemment ?",
    "Quel défaut essaies-tu de transformer en force ?",
    "Dans quel domaine de ta vie veux-tu progresser ?",
    "Qu'est-ce que le 'toi' d'il y a un an ne croirait pas ?",
  ]},
];

export default function PromptsScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [category, setCategory] = useState('');
  const [response, setResponse] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const ds = {
    container: { backgroundColor: theme.background },
    card: { backgroundColor: theme.card },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    textMuted: { color: theme.textMuted },
  };

  useEffect(() => {
    getNewPrompt();
    fetchHistory();
  }, []);

  const getNewPrompt = () => {
    const randomCat = DAILY_PROMPTS[Math.floor(Math.random() * DAILY_PROMPTS.length)];
    const randomPrompt = randomCat.prompts[Math.floor(Math.random() * randomCat.prompts.length)];
    setCategory(randomCat.category);
    setCurrentPrompt(randomPrompt);
    setResponse('');
    setSaved(false);
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/api/prompts/history`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.log('Error fetching history:', e);
    }
  };

  const handleSave = async () => {
    if (!response.trim()) return;
    setIsSaving(true);

    try {
      const res = await fetch(`${API_URL}/api/prompts/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentPrompt,
          response: response.trim(),
          category,
        }),
      });

      if (res.ok) {
        setSaved(true);
        fetchHistory();
      }
    } catch (e) {
      console.log('Error saving response:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const getCategoryInfo = (cat: string) => {
    const info: Record<string, { emoji: string; label: string; color: string }> = {
      introspection: { emoji: '🪞', label: 'Introspection', color: '#9C27B0' },
      gratitude: { emoji: '🙏', label: 'Gratitude', color: '#E91E63' },
      reves: { emoji: '✨', label: 'Rêves', color: '#FF9800' },
      relations: { emoji: '💜', label: 'Relations', color: '#3F51B5' },
      croissance: { emoji: '🌱', label: 'Croissance', color: '#4CAF50' },
    };
    return info[cat] || { emoji: '📝', label: 'Écriture', color: theme.accentWarm };
  };

  const catInfo = getCategoryInfo(category);

  return (
    <SafeAreaView style={[styles.container, ds.container]}>
      <TwinklingStars density={isDark ? 30 : 15} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-down" size={28} color={theme.iconColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, ds.text]}>Prompt du jour</Text>
        <TouchableOpacity onPress={getNewPrompt}>
          <Ionicons name="refresh-outline" size={24} color={theme.iconColor} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Prompt Card */}
        <Animated.View entering={FadeInUp.duration(500)} style={[styles.promptCard, { borderLeftColor: catInfo.color }]}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryEmoji}>{catInfo.emoji}</Text>
            <Text style={[styles.categoryLabel, { color: catInfo.color }]}>{catInfo.label}</Text>
          </View>
          
          <Text style={[styles.promptText, ds.text]}>{currentPrompt}</Text>
        </Animated.View>

        {/* Response Area */}
        <Animated.View entering={FadeInUp.duration(500).delay(100)}>
          {/* Voice Recorder */}
          <VoiceRecorder
            onTranscription={(text) => setResponse(prev => prev ? `${prev} ${text}` : text)}
            theme={theme}
            placeholder="🎙️ Dicte ta réponse..."
          />
          
          <TextInput
            style={[styles.responseInput, ds.card, ds.text]}
            placeholder="Écris ta réponse ici..."
            placeholderTextColor={theme.textMuted}
            value={response}
            onChangeText={setResponse}
            multiline
            textAlignVertical="top"
          />

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveBtn,
              { backgroundColor: saved ? '#4CAF50' : theme.accentWarm },
              !response.trim() && styles.saveBtnDisabled
            ]}
            onPress={saved ? getNewPrompt : handleSave}
            disabled={!response.trim() && !saved || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : saved ? (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>Nouveau prompt</Text>
              </>
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>Enregistrer</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* History */}
        {history.length > 0 && (
          <Animated.View entering={FadeInUp.duration(500).delay(200)} style={styles.historySection}>
            <Text style={[styles.historyTitle, ds.text]}>Réponses précédentes</Text>
            
            {history.slice(0, 5).map((item, i) => (
              <View key={i} style={[styles.historyCard, ds.card]}>
                <Text style={[styles.historyPrompt, ds.textSecondary]} numberOfLines={1}>
                  {item.prompt}
                </Text>
                <Text style={[styles.historyResponse, ds.text]} numberOfLines={2}>
                  {item.response}
                </Text>
                <Text style={[styles.historyDate, ds.textMuted]}>
                  {new Date(item.created_at).toLocaleDateString('fr-FR')}
                </Text>
              </View>
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  promptCard: { borderRadius: 20, padding: 24, backgroundColor: 'rgba(0,0,0,0.03)', borderLeftWidth: 4, marginBottom: 24 },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  categoryEmoji: { fontSize: 20, marginRight: 8 },
  categoryLabel: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  promptText: { fontSize: 22, fontWeight: '500', lineHeight: 32 },
  
  responseInput: { borderRadius: 16, padding: 16, minHeight: 150, fontSize: 16, lineHeight: 24, textAlignVertical: 'top' },
  
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 30, marginTop: 16, gap: 10 },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  
  historySection: { marginTop: 40 },
  historyTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  historyCard: { padding: 16, borderRadius: 16, marginBottom: 12 },
  historyPrompt: { fontSize: 13, marginBottom: 8, fontStyle: 'italic' },
  historyResponse: { fontSize: 15, lineHeight: 22, marginBottom: 8 },
  historyDate: { fontSize: 12 },
});
