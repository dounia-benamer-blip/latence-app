import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../../src/context/ThemeContext';
import VoiceRecorder from '../../src/components/VoiceRecorder';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Message {
  id: string;
  type: 'user' | 'mirror';
  content: string;
}

// Questions concrètes mais profondes
const STARTER_QUESTIONS = [
  "Qu'est-ce qui t'a fait sourire aujourd'hui, même brièvement ?",
  "Y a-t-il quelque chose que tu évites de regarder en face ?",
  "Si tu pouvais changer une seule chose dans ta vie demain, ce serait quoi ?",
  "Qu'est-ce qui te pèse en ce moment ?",
  "De quoi as-tu vraiment besoin là, maintenant ?",
  "Quelle émotion revient souvent ces derniers jours ?",
  "Qu'est-ce que tu n'oses pas dire à voix haute ?",
  "Qu'est-ce qui te manque ?",
  "Qu'est-ce que tu repousses depuis trop longtemps ?",
  "Comment te sens-tu vraiment, sans filtre ?",
];

export default function MirrorScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');

  useEffect(() => {
    // Poser une question au démarrage
    const randomQ = STARTER_QUESTIONS[Math.floor(Math.random() * STARTER_QUESTIONS.length)];
    setCurrentQuestion(randomQ);
  }, []);

  const handleVoiceTranscription = (text: string) => {
    if (text.trim()) {
      setInputText(text);
      // Envoyer automatiquement après transcription
      sendMessageWithText(text);
    }
  };

  const sendMessageWithText = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: text.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/mirror/reflect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context: messages.slice(-4).map(m => m.content).join(' | '),
          question: currentQuestion,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        
        const mirrorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'mirror',
          content: data.reflection || "Continue, je t'écoute...",
        };
        setMessages(prev => [...prev, mirrorMessage]);
        
        // Nouvelle question pour la suite
        const newQ = STARTER_QUESTIONS[Math.floor(Math.random() * STARTER_QUESTIONS.length)];
        setCurrentQuestion(newQ);
      }
    } catch (e) {
      console.log('Mirror error:', e);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'mirror',
        content: "Je t'écoute. Prends ton temps.",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const sendMessage = () => sendMessageWithText(inputText);

  const askNewQuestion = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/mirror/deep-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: messages.slice(-4).map(m => m.content).join(' | '),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const question = data.question || STARTER_QUESTIONS[Math.floor(Math.random() * STARTER_QUESTIONS.length)];
        
        const mirrorMessage: Message = {
          id: Date.now().toString(),
          type: 'mirror',
          content: question,
        };
        setMessages(prev => [...prev, mirrorMessage]);
        setCurrentQuestion(question);
      }
    } catch (e) {
      const fallbackQ = STARTER_QUESTIONS[Math.floor(Math.random() * STARTER_QUESTIONS.length)];
      const mirrorMessage: Message = {
        id: Date.now().toString(),
        type: 'mirror',
        content: fallbackQ,
      };
      setMessages(prev => [...prev, mirrorMessage]);
      setCurrentQuestion(fallbackQ);
    } finally {
      setIsLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const ds = {
    container: { backgroundColor: theme.background },
    card: { backgroundColor: theme.card },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
  };

  return (
    <SafeAreaView style={[styles.container, ds.container]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-down" size={28} color={theme.iconColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, ds.text]}>Miroir</Text>
          <TouchableOpacity onPress={askNewQuestion} disabled={isLoading}>
            <Ionicons name="refresh-outline" size={24} color={theme.iconColor} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <Animated.View entering={FadeIn.duration(500)} style={styles.emptyState}>
              <View style={[styles.mirrorIcon, { backgroundColor: `${theme.accentWarm}15` }]}>
                <Ionicons name="eye" size={56} color={theme.accentWarm} />
              </View>
              
              <Text style={[styles.questionText, ds.text]}>{currentQuestion}</Text>
              
              <Text style={[styles.hint, ds.textSecondary]}>
                Appuie sur le micro et réponds à voix haute
              </Text>
            </Animated.View>
          ) : (
            <>
              {messages.map((msg, index) => (
                <Animated.View
                  key={msg.id}
                  entering={FadeInUp.duration(300).delay(index * 30)}
                  style={[
                    styles.messageBubble,
                    msg.type === 'user' ? styles.userBubble : styles.mirrorBubble,
                    msg.type === 'user'
                      ? { backgroundColor: theme.accentWarm }
                      : { backgroundColor: theme.card },
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      msg.type === 'user' ? styles.userText : ds.text,
                    ]}
                  >
                    {msg.content}
                  </Text>
                </Animated.View>
              ))}

              {isLoading && (
                <View style={[styles.loadingBubble, ds.card]}>
                  <ActivityIndicator color={theme.accentWarm} size="small" />
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Input Area - Voice First */}
        <View style={[styles.inputArea, ds.card]}>
          {/* Voice Recorder - Principal */}
          <VoiceRecorder
            onTranscription={handleVoiceTranscription}
            theme={theme}
            placeholder="Appuie et parle..."
          />
          
          {/* Text Input Toggle */}
          <TouchableOpacity 
            style={styles.textToggle}
            onPress={() => setShowTextInput(!showTextInput)}
          >
            <Ionicons 
              name={showTextInput ? "chevron-down" : "create-outline"} 
              size={20} 
              color={theme.textMuted} 
            />
            <Text style={[styles.textToggleLabel, { color: theme.textMuted }]}>
              {showTextInput ? "Masquer" : "Écrire à la place"}
            </Text>
          </TouchableOpacity>

          {/* Text Input (optionnel) */}
          {showTextInput && (
            <View style={styles.textInputRow}>
              <TextInput
                style={[styles.textInput, { backgroundColor: theme.inputBackground, color: theme.text }]}
                placeholder="Ou écris ici..."
                placeholderTextColor={theme.textMuted}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={1000}
              />
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  { backgroundColor: inputText.trim() ? theme.accentWarm : theme.inputBackground },
                ]}
                onPress={sendMessage}
                disabled={!inputText.trim() || isLoading}
              >
                <Ionicons
                  name="arrow-up"
                  size={20}
                  color={inputText.trim() ? '#fff' : theme.textMuted}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
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
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 20, paddingBottom: 20 },
  
  emptyState: { alignItems: 'center', paddingTop: 40 },
  mirrorIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  questionText: { 
    fontSize: 22, 
    fontWeight: '500', 
    textAlign: 'center', 
    lineHeight: 32,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  hint: { 
    fontSize: 14, 
    textAlign: 'center',
    opacity: 0.7,
  },
  
  messageBubble: { 
    marginBottom: 12, 
    padding: 16, 
    borderRadius: 20, 
    maxWidth: '85%' 
  },
  userBubble: { alignSelf: 'flex-end' },
  mirrorBubble: { alignSelf: 'flex-start' },
  messageText: { fontSize: 16, lineHeight: 24 },
  userText: { color: '#fff' },
  
  loadingBubble: {
    padding: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
    width: 60,
    alignItems: 'center',
  },
  
  inputArea: {
    padding: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  
  textToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  textToggleLabel: { fontSize: 13 },
  
  textInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  textInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
