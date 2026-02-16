import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp, FadeInDown } from 'react-native-reanimated';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const EMOTIONS = [
  { id: 'peur', label: 'Peur', icon: 'alert-circle-outline' },
  { id: 'joie', label: 'Joie', icon: 'happy-outline' },
  { id: 'tristesse', label: 'Tristesse', icon: 'water-outline' },
  { id: 'colere', label: 'Colère', icon: 'flame-outline' },
  { id: 'confusion', label: 'Confusion', icon: 'help-circle-outline' },
  { id: 'paix', label: 'Paix', icon: 'leaf-outline' },
  { id: 'angoisse', label: 'Angoisse', icon: 'thunderstorm-outline' },
  { id: 'nostalgie', label: 'Nostalgie', icon: 'time-outline' },
  { id: 'emerveillement', label: 'Émerveillement', icon: 'sparkles-outline' },
  { id: 'desir', label: 'Désir', icon: 'heart-outline' },
];

type Dream = {
  id: string;
  content: string;
  dream_type: string;
  is_recurring: boolean;
  is_nightmare: boolean;
  emotions: string[];
  interpretation?: string;
  created_at: string;
};

export default function DreamsScreen() {
  const router = useRouter();
  const [view, setView] = useState<'list' | 'new'>('list');
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);

  // New dream form
  const [content, setContent] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [isNightmare, setIsNightmare] = useState(false);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isInterpreting, setIsInterpreting] = useState(false);
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
    } finally {
      setLoading(false);
    }
  };

  const toggleEmotion = (id: string) => {
    setSelectedEmotions(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const getDreamType = () => {
    if (isNightmare) return 'cauchemar';
    if (isRecurring) return 'recurrent';
    return 'reve';
  };

  const handleSaveAndInterpret = async () => {
    if (!content.trim()) return;

    setIsSaving(true);
    setIsInterpreting(true);

    try {
      // Save dream
      const dreamData = {
        content: content.trim(),
        dream_type: getDreamType(),
        is_recurring: isRecurring,
        is_nightmare: isNightmare,
        emotions: selectedEmotions,
      };

      const saveRes = await fetch(`${API_URL}/api/dream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dreamData),
      });

      // Request interpretation
      const interpretRes = await fetch(`${API_URL}/api/dream/interpret`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dream_content: content.trim(),
          dream_type: getDreamType(),
          emotions: selectedEmotions.length > 0 ? selectedEmotions : ['non précisé'],
        }),
      });

      if (interpretRes.ok) {
        const interpData = await interpretRes.json();
        setInterpretation(interpData.interpretation);

        // Save interpretation to the dream
        if (saveRes.ok) {
          const savedDream = await saveRes.json();
          await fetch(`${API_URL}/api/dream/${savedDream.id}/interpretation`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(interpData.interpretation),
          });
        }
      }
    } catch (e) {
      console.log('Error:', e);
    } finally {
      setIsSaving(false);
      setIsInterpreting(false);
    }
  };

  const resetForm = () => {
    setContent('');
    setIsRecurring(false);
    setIsNightmare(false);
    setSelectedEmotions([]);
    setInterpretation('');
    setView('list');
    fetchDreams();
  };

  const renderList = () => (
    <Animated.View entering={FadeIn.duration(400)}>
      <View style={styles.listHeader}>
        <Text style={styles.title}>Carnet des rêves</Text>
        <TouchableOpacity
          style={styles.newDreamBtn}
          onPress={() => setView('new')}
          data-testid="new-dream-btn"
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>Tes rêves, interprétés par Freud, Jung et les anciens.</Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#C4A87C" />
      ) : dreams.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="moon-outline" size={48} color="#C4A87C" />
          <Text style={styles.emptyText}>Aucun rêve enregistré</Text>
          <Text style={styles.emptySubtext}>Commence ton carnet onirique</Text>
        </View>
      ) : (
        dreams.map((dream, i) => (
          <Animated.View
            key={dream.id}
            entering={FadeInUp.duration(400).delay(i * 80)}
          >
            <TouchableOpacity
              style={styles.dreamCard}
              onPress={() => router.push(`/dreams/${dream.id}`)}
              data-testid={`dream-card-${dream.id}`}
            >
              <View style={styles.dreamMeta}>
                <Ionicons
                  name={dream.is_nightmare ? 'thunderstorm-outline' : 'cloud-outline'}
                  size={18}
                  color={dream.is_nightmare ? '#C47C7C' : '#A8B4C4'}
                />
                <Text style={styles.dreamDate}>
                  {format(new Date(dream.created_at), 'd MMM yyyy', { locale: fr })}
                </Text>
                {dream.is_recurring && (
                  <View style={styles.recurringBadge}>
                    <Ionicons name="repeat-outline" size={12} color="#8B9A7D" />
                    <Text style={styles.recurringText}>Récurrent</Text>
                  </View>
                )}
              </View>
              <Text style={styles.dreamPreview} numberOfLines={2}>
                {dream.content}
              </Text>
              {dream.interpretation && (
                <View style={styles.hasInterpretation}>
                  <Ionicons name="sparkles" size={12} color="#C4A87C" />
                  <Text style={styles.hasInterpretationText}>Interprété</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        ))
      )}
    </Animated.View>
  );

  const renderNewDream = () => (
    <Animated.View entering={FadeIn.duration(400)}>
      {!interpretation ? (
        <>
          <Text style={styles.formTitle}>Raconte ton rêve</Text>
          <Text style={styles.formSubtitle}>
            Décris-le avec le plus de détails possible. Couleurs, sensations, personnages...
          </Text>

          <TextInput
            style={styles.dreamInput}
            placeholder="J'ai rêvé que..."
            placeholderTextColor="#C4C4B4"
            value={content}
            onChangeText={setContent}
            multiline
            autoFocus
            textAlignVertical="top"
            data-testid="dream-content-input"
          />

          {/* Dream type toggles */}
          <View style={styles.toggleSection}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Ionicons name="repeat-outline" size={20} color="#8B9A7D" />
                <Text style={styles.toggleLabel}>Rêve récurrent</Text>
              </View>
              <Switch
                value={isRecurring}
                onValueChange={setIsRecurring}
                trackColor={{ false: '#E0E0D8', true: '#8B9A7D' }}
                thumbColor="#fff"
                data-testid="dream-recurring-switch"
              />
            </View>
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Ionicons name="thunderstorm-outline" size={20} color="#C47C7C" />
                <Text style={styles.toggleLabel}>Cauchemar</Text>
              </View>
              <Switch
                value={isNightmare}
                onValueChange={setIsNightmare}
                trackColor={{ false: '#E0E0D8', true: '#C47C7C' }}
                thumbColor="#fff"
                data-testid="dream-nightmare-switch"
              />
            </View>
          </View>

          {/* Emotions */}
          <Text style={styles.sectionTitle}>Émotions ressenties</Text>
          <View style={styles.emotionsGrid}>
            {EMOTIONS.map(emo => (
              <TouchableOpacity
                key={emo.id}
                style={[
                  styles.emotionChip,
                  selectedEmotions.includes(emo.id) && styles.emotionChipActive,
                ]}
                onPress={() => toggleEmotion(emo.id)}
                data-testid={`emotion-${emo.id}`}
              >
                <Ionicons
                  name={emo.icon as any}
                  size={14}
                  color={selectedEmotions.includes(emo.id) ? '#fff' : '#8B8B7B'}
                />
                <Text
                  style={[
                    styles.emotionText,
                    selectedEmotions.includes(emo.id) && styles.emotionTextActive,
                  ]}
                >
                  {emo.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.interpretBtn, !content.trim() && styles.interpretBtnDisabled]}
            onPress={handleSaveAndInterpret}
            disabled={!content.trim() || isSaving}
            data-testid="dream-interpret-btn"
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="sparkles" size={18} color="#fff" />
                <Text style={styles.interpretBtnText}>Interpréter mon rêve</Text>
              </>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <Animated.View entering={FadeInDown.duration(600)}>
          <View style={styles.interpretationHeader}>
            <Ionicons name="sparkles" size={24} color="#C4A87C" />
            <Text style={styles.interpretationTitle}>Interprétation</Text>
          </View>

          <ScrollView style={styles.interpretationScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.interpretationText}>{interpretation}</Text>
          </ScrollView>

          <TouchableOpacity
            style={styles.doneBtn}
            onPress={resetForm}
            data-testid="dream-done-btn"
          >
            <Text style={styles.doneBtnText}>Retour au carnet</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.nav}>
        <TouchableOpacity
          onPress={() => view === 'new' ? resetForm() : router.back()}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          data-testid="dreams-back-btn"
        >
          <Ionicons name={view === 'new' ? 'arrow-back' : 'chevron-down'} size={26} color="#6B6B5B" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>
          {view === 'new' ? 'Nouveau rêve' : 'Carnet des rêves'}
        </Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {view === 'list' ? renderList() : renderNewDream()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  navTitle: { fontSize: 17, fontWeight: '500', color: '#4A4A4A', letterSpacing: 0.3 },
  scrollContent: { padding: 24, paddingTop: 8, paddingBottom: 40 },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 26, fontWeight: '300', color: '#2A2A2A', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#A0A090', marginBottom: 28, lineHeight: 18 },
  newDreamBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B9A7D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { fontSize: 16, color: '#6B6B5B', fontWeight: '400' },
  emptySubtext: { fontSize: 13, color: '#A0A090' },
  dreamCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
  },
  dreamMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  dreamDate: { fontSize: 12, color: '#A0A090' },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#8B9A7D15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  recurringText: { fontSize: 11, color: '#8B9A7D' },
  dreamPreview: { fontSize: 14, color: '#4A4A4A', lineHeight: 20 },
  hasInterpretation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
  },
  hasInterpretationText: { fontSize: 11, color: '#C4A87C' },
  formTitle: { fontSize: 22, fontWeight: '300', color: '#2A2A2A', marginBottom: 8 },
  formSubtitle: { fontSize: 13, color: '#A0A090', lineHeight: 18, marginBottom: 24 },
  dreamInput: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    color: '#4A4A4A',
    lineHeight: 24,
    minHeight: 160,
    fontWeight: '300',
    marginBottom: 20,
  },
  toggleSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  toggleInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggleLabel: { fontSize: 15, color: '#4A4A4A' },
  sectionTitle: {
    fontSize: 13,
    color: '#A0A090',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  emotionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 32 },
  emotionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emotionChipActive: { backgroundColor: '#8B9A7D' },
  emotionText: { fontSize: 13, color: '#8B8B7B' },
  emotionTextActive: { color: '#fff' },
  interpretBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#C4A87C',
    borderRadius: 24,
    paddingVertical: 16,
    marginBottom: 20,
  },
  interpretBtnDisabled: { opacity: 0.5 },
  interpretBtnText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  interpretationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  interpretationTitle: {
    fontSize: 20,
    fontWeight: '400',
    color: '#C4A87C',
    letterSpacing: 0.3,
  },
  interpretationScroll: { marginBottom: 24 },
  interpretationText: {
    fontSize: 15,
    color: '#4A4A4A',
    lineHeight: 26,
    fontWeight: '300',
  },
  doneBtn: {
    backgroundColor: '#8B9A7D',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneBtnText: { color: '#fff', fontSize: 15, fontWeight: '500' },
});
