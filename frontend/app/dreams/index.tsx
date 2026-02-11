import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const DREAM_TYPES = [
  { id: 'reve', label: 'Rêve', icon: 'cloudy-night', color: '#3498DB' },
  { id: 'cauchemar', label: 'Cauchemar', icon: 'thunderstorm', color: '#E74C3C' },
  { id: 'lucide', label: 'Rêve Lucide', icon: 'eye', color: '#9B59B6' },
  { id: 'recurrent', label: 'Récurrent', icon: 'repeat', color: '#27AE60' },
];

const EMOTIONS = [
  'Peur', 'Joie', 'Tristesse', 'Anxiété', 'Confusion',
  'Paix', 'Colère', 'Excitation', 'Nostalgie', 'Curiosité'
];

interface Dream {
  id: string;
  title: string;
  content: string;
  dream_type: string;
  emotions: string[];
  interpretation?: string;
  date: string;
}

export default function DreamsScreen() {
  const router = useRouter();
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [showNewDream, setShowNewDream] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // New dream form
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [dreamType, setDreamType] = useState('');
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [interpretation, setInterpretation] = useState('');

  useEffect(() => {
    fetchDreams();
  }, []);

  const fetchDreams = async () => {
    try {
      const res = await fetch(`${API_URL}/api/dreams`);
      if (res.ok) {
        const data = await res.json();
        setDreams(data);
      }
    } catch (e) {
      console.log('Error fetching dreams:', e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDreams();
    setRefreshing(false);
  };

  const toggleEmotion = (emotion: string) => {
    if (selectedEmotions.includes(emotion)) {
      setSelectedEmotions(selectedEmotions.filter(e => e !== emotion));
    } else if (selectedEmotions.length < 3) {
      setSelectedEmotions([...selectedEmotions, emotion]);
    }
  };

  const handleAnalyze = async () => {
    if (!content || !dreamType || selectedEmotions.length === 0) return;
    
    setIsAnalyzing(true);
    try {
      const res = await fetch(`${API_URL}/api/dream/interpret`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dream_content: content,
          dream_type: dreamType,
          emotions: selectedEmotions,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setInterpretation(data.interpretation);
      }
    } catch (e) {
      console.log('Error interpreting dream:', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveDream = async () => {
    if (!title || !content || !dreamType) return;
    
    try {
      const res = await fetch(`${API_URL}/api/dream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          dream_type: dreamType,
          emotions: selectedEmotions,
        }),
      });
      
      if (res.ok) {
        const dream = await res.json();
        
        // Save interpretation if exists
        if (interpretation) {
          await fetch(`${API_URL}/api/dream/${dream.id}/interpretation`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(interpretation),
          });
        }
        
        // Reset form and refresh
        setTitle('');
        setContent('');
        setDreamType('');
        setSelectedEmotions([]);
        setInterpretation('');
        setShowNewDream(false);
        fetchDreams();
      }
    } catch (e) {
      console.log('Error saving dream:', e);
    }
  };

  const getDreamTypeInfo = (typeId: string) => {
    return DREAM_TYPES.find(t => t.id === typeId);
  };

  const renderNewDreamForm = () => (
    <Animated.View entering={FadeInDown.duration(500)} style={styles.newDreamContainer}>
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>Nouveau Rêve</Text>
        <TouchableOpacity onPress={() => setShowNewDream(false)}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Dream Type Selection */}
      <Text style={styles.sectionLabel}>Type de rêve</Text>
      <View style={styles.typeGrid}>
        {DREAM_TYPES.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.typeCard,
              dreamType === type.id && { borderColor: type.color, backgroundColor: `${type.color}20` },
            ]}
            onPress={() => setDreamType(type.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={type.icon as any}
              size={24}
              color={dreamType === type.id ? type.color : '#6a6a8a'}
            />
            <Text
              style={[
                styles.typeLabel,
                dreamType === type.id && { color: type.color },
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Title Input */}
      <Text style={styles.sectionLabel}>Titre</Text>
      <TextInput
        style={styles.titleInput}
        placeholder="Donne un titre à ce rêve..."
        placeholderTextColor="#4a4a6a"
        value={title}
        onChangeText={setTitle}
      />

      {/* Dream Content */}
      <Text style={styles.sectionLabel}>Décris ton rêve</Text>
      <TextInput
        style={styles.contentInput}
        placeholder="Raconte ton rêve en détail... Les lieux, les personnes, les actions, les sensations..."
        placeholderTextColor="#4a4a6a"
        value={content}
        onChangeText={setContent}
        multiline
        textAlignVertical="top"
      />

      {/* Emotions */}
      <Text style={styles.sectionLabel}>Émotions ressenties (max 3)</Text>
      <View style={styles.emotionsGrid}>
        {EMOTIONS.map((emotion) => (
          <TouchableOpacity
            key={emotion}
            style={[
              styles.emotionChip,
              selectedEmotions.includes(emotion) && styles.emotionChipSelected,
            ]}
            onPress={() => toggleEmotion(emotion)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.emotionText,
                selectedEmotions.includes(emotion) && styles.emotionTextSelected,
              ]}
            >
              {emotion}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Analyze Button */}
      <TouchableOpacity
        style={[
          styles.analyzeButton,
          (!content || !dreamType || selectedEmotions.length === 0) && styles.buttonDisabled,
        ]}
        onPress={handleAnalyze}
        disabled={!content || !dreamType || selectedEmotions.length === 0 || isAnalyzing}
        activeOpacity={0.8}
      >
        {isAnalyzing ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons name="sparkles" size={20} color="#fff" />
            <Text style={styles.analyzeButtonText}>Analyser avec l'IA</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Interpretation Result */}
      {interpretation && (
        <Animated.View entering={FadeInUp.duration(500)} style={styles.interpretationCard}>
          <View style={styles.interpretationHeader}>
            <Ionicons name="bulb" size={20} color="#FFD700" />
            <Text style={styles.interpretationTitle}>Interprétation</Text>
          </View>
          <ScrollView style={styles.interpretationScroll} nestedScrollEnabled>
            <Text style={styles.interpretationText}>{interpretation}</Text>
          </ScrollView>
        </Animated.View>
      )}

      {/* Save Button */}
      <TouchableOpacity
        style={[
          styles.saveButton,
          (!title || !content || !dreamType) && styles.buttonDisabled,
        ]}
        onPress={handleSaveDream}
        disabled={!title || !content || !dreamType}
        activeOpacity={0.8}
      >
        <Ionicons name="save" size={20} color="#fff" />
        <Text style={styles.saveButtonText}>Enregistrer le rêve</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderDreamList = () => (
    <>
      {dreams.length === 0 ? (
        <Animated.View entering={FadeInUp.duration(600)} style={styles.emptyState}>
          <Ionicons name="cloudy-night" size={60} color="#3a3a5e" />
          <Text style={styles.emptyTitle}>Aucun rêve enregistré</Text>
          <Text style={styles.emptyText}>
            Commence à enregistrer tes rêves pour découvrir leurs significations cachées
          </Text>
        </Animated.View>
      ) : (
        <View style={styles.dreamList}>
          {dreams.map((dream, index) => {
            const typeInfo = getDreamTypeInfo(dream.dream_type);
            return (
              <Animated.View
                key={dream.id}
                entering={FadeInUp.duration(500).delay(index * 100)}
              >
                <TouchableOpacity
                  style={styles.dreamCard}
                  onPress={() => router.push(`/dreams/${dream.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.dreamHeader}>
                    <View style={[styles.typeBadge, { backgroundColor: `${typeInfo?.color}20` }]}>
                      <Ionicons
                        name={typeInfo?.icon as any}
                        size={16}
                        color={typeInfo?.color}
                      />
                      <Text style={[styles.typeBadgeText, { color: typeInfo?.color }]}>
                        {typeInfo?.label}
                      </Text>
                    </View>
                    <Text style={styles.dreamDate}>
                      {formatDistanceToNow(new Date(dream.date), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </Text>
                  </View>
                  
                  <Text style={styles.dreamTitle}>{dream.title}</Text>
                  <Text style={styles.dreamPreview} numberOfLines={2}>
                    {dream.content}
                  </Text>
                  
                  <View style={styles.dreamFooter}>
                    <View style={styles.emotionsList}>
                      {dream.emotions.slice(0, 3).map((emotion, i) => (
                        <View key={i} style={styles.emotionTag}>
                          <Text style={styles.emotionTagText}>{emotion}</Text>
                        </View>
                      ))}
                    </View>
                    {dream.interpretation && (
                      <View style={styles.interpretedBadge}>
                        <Ionicons name="checkmark-circle" size={14} color="#4ECDC4" />
                        <Text style={styles.interpretedText}>Analysé</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Carnet des Rêves</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowNewDream(true)}
        >
          <Ionicons name="add" size={24} color="#3498DB" />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C63FF" />
        }
      >
        {showNewDream ? renderNewDreamForm() : renderDreamList()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  addButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3498DB20',
    borderRadius: 20,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6a6a8a',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  dreamList: {
    gap: 16,
  },
  dreamCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 20,
  },
  dreamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dreamDate: {
    fontSize: 12,
    color: '#6a6a8a',
  },
  dreamTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  dreamPreview: {
    fontSize: 14,
    color: '#a0a0c0',
    lineHeight: 20,
    marginBottom: 12,
  },
  dreamFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emotionsList: {
    flexDirection: 'row',
    gap: 6,
  },
  emotionTag: {
    backgroundColor: '#2a2a4e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  emotionTagText: {
    fontSize: 10,
    color: '#a0a0c0',
  },
  interpretedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  interpretedText: {
    fontSize: 12,
    color: '#4ECDC4',
  },
  newDreamContainer: {
    gap: 16,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a0a0c0',
    marginBottom: 8,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    width: '48%',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeLabel: {
    fontSize: 12,
    color: '#6a6a8a',
    marginTop: 6,
    fontWeight: '600',
  },
  titleInput: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  contentInput: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2a2a4e',
    minHeight: 120,
  },
  emotionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emotionChip: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  emotionChipSelected: {
    backgroundColor: '#6C63FF20',
    borderColor: '#6C63FF',
  },
  emotionText: {
    fontSize: 13,
    color: '#6a6a8a',
  },
  emotionTextSelected: {
    color: '#6C63FF',
    fontWeight: '600',
  },
  analyzeButton: {
    backgroundColor: '#9B59B6',
    paddingVertical: 14,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonDisabled: {
    backgroundColor: '#3a3a5e',
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  interpretationCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFD70040',
  },
  interpretationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  interpretationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD700',
  },
  interpretationScroll: {
    maxHeight: 200,
  },
  interpretationText: {
    fontSize: 14,
    color: '#a0a0c0',
    lineHeight: 22,
  },
  saveButton: {
    backgroundColor: '#3498DB',
    paddingVertical: 16,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
