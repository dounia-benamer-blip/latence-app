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
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const DREAM_TYPES = [
  { id: 'reve', label: 'Rêve', icon: 'cloudy-night-outline' },
  { id: 'cauchemar', label: 'Cauchemar', icon: 'thunderstorm-outline' },
  { id: 'lucide', label: 'Lucide', icon: 'eye-outline' },
  { id: 'recurrent', label: 'Récurrent', icon: 'repeat-outline' },
];

const EMOTIONS = [
  'Peur', 'Joie', 'Tristesse', 'Paix', 'Confusion', 
  'Colère', 'Nostalgie', 'Curiosité'
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
        
        if (interpretation) {
          await fetch(`${API_URL}/api/dream/${dream.id}/interpretation`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(interpretation),
          });
        }
        
        resetForm();
        setShowNewDream(false);
        fetchDreams();
      }
    } catch (e) {
      console.log('Error saving dream:', e);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setDreamType('');
    setSelectedEmotions([]);
    setInterpretation('');
  };

  const getDreamTypeInfo = (typeId: string) => {
    return DREAM_TYPES.find(t => t.id === typeId);
  };

  const renderNewDreamForm = () => (
    <Animated.View entering={FadeInDown.duration(500)} style={styles.formContainer}>
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>Nouveau rêve</Text>
        <TouchableOpacity onPress={() => { resetForm(); setShowNewDream(false); }}>
          <Ionicons name="close" size={24} color="#6B6B5B" />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionLabel}>Type</Text>
      <View style={styles.typeRow}>
        {DREAM_TYPES.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.typeChip,
              dreamType === type.id && styles.typeChipSelected,
            ]}
            onPress={() => setDreamType(type.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={type.icon as any}
              size={18}
              color={dreamType === type.id ? '#4A4A4A' : '#A0A090'}
            />
            <Text
              style={[
                styles.typeLabel,
                dreamType === type.id && styles.typeLabelSelected,
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Titre</Text>
      <TextInput
        style={styles.input}
        placeholder="Un nom pour ce rêve..."
        placeholderTextColor="#B0B0A0"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.sectionLabel}>Récit</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Décris ton rêve en détail..."
        placeholderTextColor="#B0B0A0"
        value={content}
        onChangeText={setContent}
        multiline
        textAlignVertical="top"
      />

      <Text style={styles.sectionLabel}>Émotions (max 3)</Text>
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
          <Text style={styles.analyzeButtonText}>Interpréter</Text>
        )}
      </TouchableOpacity>

      {interpretation && (
        <Animated.View entering={FadeInUp.duration(500)} style={styles.interpretationCard}>
          <Text style={styles.interpretationTitle}>Interprétation</Text>
          <ScrollView style={styles.interpretationScroll} nestedScrollEnabled>
            <Text style={styles.interpretationText}>{interpretation}</Text>
          </ScrollView>
        </Animated.View>
      )}

      <TouchableOpacity
        style={[
          styles.saveButton,
          (!title || !content || !dreamType) && styles.buttonDisabled,
        ]}
        onPress={handleSaveDream}
        disabled={!title || !content || !dreamType}
        activeOpacity={0.8}
      >
        <Text style={styles.saveButtonText}>Enregistrer</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderDreamList = () => (
    <>
      {dreams.length === 0 ? (
        <Animated.View entering={FadeInUp.duration(600)} style={styles.emptyState}>
          <Ionicons name="cloudy-night-outline" size={48} color="#C4C4B4" />
          <Text style={styles.emptyTitle}>Aucun rêve</Text>
          <Text style={styles.emptyText}>
            Enregistre tes rêves pour découvrir leurs significations
          </Text>
        </Animated.View>
      ) : (
        <View style={styles.dreamList}>
          {dreams.map((dream, index) => {
            const typeInfo = getDreamTypeInfo(dream.dream_type);
            return (
              <Animated.View
                key={dream.id}
                entering={FadeInUp.duration(500).delay(index * 80)}
              >
                <TouchableOpacity
                  style={styles.dreamCard}
                  onPress={() => router.push(`/dreams/${dream.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.dreamHeader}>
                    <Ionicons
                      name={typeInfo?.icon as any}
                      size={18}
                      color="#8B8B7D"
                    />
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
                  
                  {dream.interpretation && (
                    <View style={styles.analyzedBadge}>
                      <Text style={styles.analyzedText}>Interprété</Text>
                    </View>
                  )}
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
      <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#6B6B5B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rêves</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowNewDream(true)}
        >
          <Ionicons name="add" size={24} color="#8B9A7D" />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B9A7D" />
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
    backgroundColor: '#F5F0E8',
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
    fontSize: 16,
    fontWeight: '500',
    color: '#4A4A4A',
    letterSpacing: 0.5,
  },
  addButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#4A4A4A',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#A0A090',
    textAlign: 'center',
  },
  dreamList: {
    gap: 12,
  },
  dreamCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  dreamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dreamDate: {
    fontSize: 12,
    color: '#A0A090',
  },
  dreamTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4A4A4A',
    marginBottom: 8,
  },
  dreamPreview: {
    fontSize: 14,
    color: '#8B8B7D',
    lineHeight: 20,
  },
  analyzedBadge: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#8B9A7D20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  analyzedText: {
    fontSize: 11,
    color: '#8B9A7D',
    fontWeight: '500',
  },
  formContainer: {
    gap: 16,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '300',
    color: '#4A4A4A',
    letterSpacing: 0.5,
  },
  sectionLabel: {
    fontSize: 12,
    color: '#8B8B7D',
    letterSpacing: 0.5,
    marginBottom: -8,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  typeChipSelected: {
    backgroundColor: '#FDF9F3',
    borderWidth: 1,
    borderColor: '#D4C4A8',
  },
  typeLabel: {
    fontSize: 13,
    color: '#A0A090',
  },
  typeLabelSelected: {
    color: '#4A4A4A',
    fontWeight: '500',
  },
  input: {
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
  textArea: {
    minHeight: 100,
  },
  emotionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emotionChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  emotionChipSelected: {
    backgroundColor: '#FDF9F3',
    borderWidth: 1,
    borderColor: '#D4C4A8',
  },
  emotionText: {
    fontSize: 13,
    color: '#A0A090',
  },
  emotionTextSelected: {
    color: '#4A4A4A',
    fontWeight: '500',
  },
  analyzeButton: {
    backgroundColor: '#A8B4C4',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#D4D4C4',
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  interpretationCard: {
    backgroundColor: '#FDF9F3',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E0D4',
  },
  interpretationTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A4A4A',
    marginBottom: 12,
  },
  interpretationScroll: {
    maxHeight: 180,
  },
  interpretationText: {
    fontSize: 13,
    color: '#6B6B5B',
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: '#8B9A7D',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
