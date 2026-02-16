import React, { useState, useRef } from 'react';
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

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Message {
  id: string;
  type: 'user' | 'mirror';
  content: string;
  timestamp: Date;
}

export default function MirrorScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'reflect' | 'analyze' | 'question'>('reflect');

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const endpoints = {
        reflect: '/api/mirror/reflect',
        analyze: '/api/mirror/analyze-writing',
        question: '/api/mirror/deep-question',
      };

      const res = await fetch(`${API_URL}${endpoints[mode]}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          context: messages.slice(-4).map(m => m.content).join(' | '),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const responseKey = mode === 'analyze' ? 'analysis' : mode === 'question' ? 'question' : 'reflection';
        
        const mirrorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'mirror',
          content: data[responseKey] || 'Le miroir se trouble...',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, mirrorMessage]);
      }
    } catch (e) {
      console.log('Mirror error:', e);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'mirror',
        content: 'Le miroir se trouble un instant... Que ressens-tu vraiment en ce moment ?',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
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
    input: { backgroundColor: theme.inputBackground, color: theme.text },
  };

  return (
    <SafeAreaView style={[styles.container, ds.container]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
            <Ionicons name="chevron-down" size={28} color={theme.iconColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, ds.text]}>IA Miroir</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Mode Selector */}
        <View style={styles.modeContainer}>
          {[
            { id: 'reflect', icon: 'eye-outline', label: 'Reflet' },
            { id: 'analyze', icon: 'document-text-outline', label: 'Analyse' },
            { id: 'question', icon: 'help-circle-outline', label: 'Question' },
          ].map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[
                styles.modeBtn,
                mode === m.id && { backgroundColor: theme.accentWarm },
              ]}
              onPress={() => setMode(m.id as any)}
            >
              <Ionicons
                name={m.icon as any}
                size={18}
                color={mode === m.id ? '#fff' : theme.textMuted}
              />
              <Text
                style={[
                  styles.modeBtnText,
                  { color: mode === m.id ? '#fff' : theme.textMuted },
                ]}
              >
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 && (
            <Animated.View entering={FadeIn.duration(500)} style={styles.emptyState}>
              <View style={[styles.mirrorIcon, { backgroundColor: `${theme.accentWarm}15` }]}>
                <Ionicons name="eye" size={48} color={theme.accentWarm} />
              </View>
              <Text style={[styles.emptyTitle, ds.text]}>Le Miroir t'attend</Text>
              <Text style={[styles.emptySubtitle, ds.textSecondary]}>
                {mode === 'reflect' && 'Confie ce qui traverse ton esprit. Je te le refléterai avec douceur.'}
                {mode === 'analyze' && 'Écris librement. Je lirai ce que tes mots révèlent de toi.'}
                {mode === 'question' && 'Partage ton état. Je te poserai LA question qui peut tout éclairer.'}
              </Text>
            </Animated.View>
          )}

          {messages.map((msg, index) => (
            <Animated.View
              key={msg.id}
              entering={FadeInUp.duration(400).delay(index * 50)}
              style={[
                styles.messageBubble,
                msg.type === 'user' ? styles.userBubble : styles.mirrorBubble,
                msg.type === 'user'
                  ? { backgroundColor: theme.accentWarm }
                  : { backgroundColor: theme.card, borderLeftColor: theme.accentWarm },
              ]}
            >
              {msg.type === 'mirror' && (
                <View style={styles.mirrorHeader}>
                  <Ionicons name="eye" size={16} color={theme.accentWarm} />
                  <Text style={[styles.mirrorLabel, { color: theme.accentWarm }]}>Miroir</Text>
                </View>
              )}
              <Text
                style={[
                  styles.messageText,
                  msg.type === 'user' ? styles.userText : { color: theme.text },
                ]}
              >
                {msg.content}
              </Text>
            </Animated.View>
          ))}

          {isLoading && (
            <View style={[styles.loadingBubble, ds.card]}>
              <ActivityIndicator color={theme.accentWarm} size="small" />
              <Text style={[styles.loadingText, ds.textSecondary]}>Le miroir contemple...</Text>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={[styles.inputContainer, ds.card]}>
          <TextInput
            style={[styles.textInput, ds.input]}
            placeholder="Confie ce qui traverse ton esprit..."
            placeholderTextColor={theme.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={2000}
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
              size={22}
              color={inputText.trim() ? '#fff' : theme.textMuted}
            />
          </TouchableOpacity>
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
  headerTitle: { fontSize: 16, fontWeight: '500' },
  placeholder: { width: 28 },
  
  modeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  modeBtnText: { fontSize: 12, fontWeight: '500' },
  
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 20 },
  
  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  mirrorIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: { fontSize: 22, fontWeight: '300', marginBottom: 12, letterSpacing: 1 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  
  messageBubble: { marginBottom: 12, padding: 16, borderRadius: 16, maxWidth: '90%' },
  userBubble: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  mirrorBubble: { alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderLeftWidth: 3 },
  mirrorHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  mirrorLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  messageText: { fontSize: 15, lineHeight: 24 },
  userText: { color: '#fff' },
  
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  loadingText: { fontSize: 13, fontStyle: 'italic' },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 10,
  },
  textInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
