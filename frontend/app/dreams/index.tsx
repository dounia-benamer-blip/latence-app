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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp, FadeInDown } from 'react-native-reanimated';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const DREAM_TYPES = [
  { id: 'reve', label: 'Rêve', icon: 'cloud-outline', color: '#A8B4C4' },
  { id: 'cauchemar', label: 'Cauchemar', icon: 'thunderstorm-outline', color: '#C47C7C' },
  { id: 'lucide', label: 'Lucide', icon: 'eye-outline', color: '#8B9A7D' },
  { id: 'recurrent', label: 'Récurrent', icon: 'repeat-outline', color: '#C4A87C' },
];

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
  title: string;
  content: string;
  dream_type: string;
  emotions: string[];
  interpretation?: string | null;
  date: string;
};

function formatDreamDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return '';
  }
}

export default function DreamsScreen() {
  const router = useRouter();
  const [view, setView] = useState<'list' | 'new'>('list');
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [dreamType, setDreamType] = useState('reve');
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [interpretation, setInterpretation] = useState('');

  useEffect(() => { fetchDreams(); }, []);

  const fetchDreams = async () => {
    try {
      const res = await fetch(`${API_URL}/api/dreams`);
      if (res.ok) setDreams(await res.json());
    } catch (e) {
      console.log('Fetch dreams error:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleEmotion = (id: string) => {
    setSelectedEmotions(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const handleSaveAndInterpret = async () => {
    if (!content.trim()) return;
    setIsSaving(true);

    try {
      const dreamTitle = title.trim() || content.trim().substring(0, 50) + '...';

      // Save dream
      const saveRes = await fetch(`${API_URL}/api/dream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: dreamTitle,
          content: content.trim(),
          dream_type: dreamType,
          emotions: selectedEmotions.length > 0 ? selectedEmotions : ['non précisé'],
        }),
      });

      let savedDream: Dream | null = null;
      if (saveRes.ok) savedDream = await saveRes.json();

      // Request AI interpretation
      const interpretRes = await fetch(`${API_URL}/api/dream/interpret`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dream_content: content.trim(),
          dream_type: dreamType,
          emotions: selectedEmotions.length > 0 ? selectedEmotions : ['non précisé'],
        }),
      });

      if (interpretRes.ok) {
        const data = await interpretRes.json();
        setInterpretation(data.interpretation || '');

        // Save interpretation to the dream
        if (savedDream?.id && data.interpretation) {
          await fetch(`${API_URL}/api/dream/${savedDream.id}/interpretation`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data.interpretation),
          });
        }
      }
    } catch (e) {
      console.log('Error:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setDreamType('reve');
    setSelectedEmotions([]);
    setInterpretation('');
    setView('list');
    fetchDreams();
  };

  const getTypeInfo = (typeId: string) =>
    DREAM_TYPES.find(t => t.id === typeId) || DREAM_TYPES[0];

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
        dreams.map((dream, i) => {
          const typeInfo = getTypeInfo(dream.dream_type);
          return (
            <Animated.View key={dream.id} entering={FadeInUp.duration(400).delay(i * 80)}>
              <TouchableOpacity
                style={styles.dreamCard}
                onPress={() => router.push(`/dreams/${dream.id}`)}
                data-testid={`dream-card-${dream.id}`}
              >
                <View style={styles.dreamMeta}>
                  <Ionicons name={typeInfo.icon as any} size={18} color={typeInfo.color} />
                  <Text style={styles.dreamDate}>{formatDreamDate(dream.date)}</Text>
                  <View style={[styles.typeBadge, { backgroundColor: `${typeInfo.color}18` }]}>
                    <Text style={[styles.typeText, { color: typeInfo.color }]}>{typeInfo.label}</Text>
                  </View>
                </View>
                <Text style={styles.dreamTitle} numberOfLines={1}>{dream.title}</Text>
                <Text style={styles.dreamPreview} numberOfLines={2}>{dream.content}</Text>
                {dream.interpretation && (
                  <View style={styles.hasInterpretation}>
                    <Ionicons name="sparkles" size={12} color="#C4A87C" />
                    <Text style={styles.hasInterpretationText}>Interprété</Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })
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

          {/* Dream Type selector */}
          <Text style={styles.sectionTitle}>Type de rêve</Text>
          <View style={styles.typeGrid}>
            {DREAM_TYPES.map(t => (
              <TouchableOpacity
                key={t.id}
                style={[styles.typeChip, dreamType === t.id && { backgroundColor: t.color }]}
                onPress={() => setDreamType(t.id)}
                data-testid={`type-${t.id}`}
              >
                <Ionicons name={t.icon as any} size={16} color={dreamType === t.id ? '#fff' : t.color} />
                <Text style={[styles.typeChipText, dreamType === t.id && { color: '#fff' }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.titleInput}
            placeholder="Titre (optionnel)"
            placeholderTextColor="#C4C4B4"
            value={title}
            onChangeText={setTitle}
            data-testid="dream-title-input"
          />

          <TextInput
            style={styles.dreamInput}
            placeholder="J'ai rêvé que..."
            placeholderTextColor="#C4C4B4"
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            data-testid="dream-content-input"
          />

          {/* Emotions */}
          <Text style={styles.sectionTitle}>Émotions au réveil</Text>
          <View style={styles.emotionsGrid}>
            {EMOTIONS.map(emo => (
              <TouchableOpacity
                key={emo.id}
                style={[styles.emotionChip, selectedEmotions.includes(emo.id) && styles.emotionChipActive]}
                onPress={() => toggleEmotion(emo.id)}
                data-testid={`emotion-${emo.id}`}
              >
                <Ionicons
                  name={emo.icon as any}
                  size={14}
                  color={selectedEmotions.includes(emo.id) ? '#fff' : '#8B8B7B'}
                />
                <Text style={[styles.emotionText, selectedEmotions.includes(emo.id) && styles.emotionTextActive]}>
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
          <Text style={styles.interpretationText}>{interpretation}</Text>
          <TouchableOpacity style={styles.doneBtn} onPress={resetForm} data-testid="dream-done-btn">
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
        <Text style={styles.navTitle}>{view === 'new' ? 'Nouveau rêve' : 'Carnet des rêves'}</Text>
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
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  navTitle: { fontSize: 17, fontWeight: '500', color: '#4A4A4A', letterSpacing: 0.3 },
  scrollContent: { padding: 24, paddingTop: 8, paddingBottom: 40 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '300', color: '#2A2A2A', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#A0A090', marginBottom: 28, lineHeight: 18 },
  newDreamBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#8B9A7D', alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { fontSize: 16, color: '#6B6B5B' },
  emptySubtext: { fontSize: 13, color: '#A0A090' },
  dreamCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 12 },
  dreamMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  dreamDate: { fontSize: 12, color: '#A0A090' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  typeText: { fontSize: 11, fontWeight: '500' },
  dreamTitle: { fontSize: 15, fontWeight: '500', color: '#3A3A3A', marginBottom: 4 },
  dreamPreview: { fontSize: 13, color: '#6B6B5B', lineHeight: 18 },
  hasInterpretation: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  hasInterpretationText: { fontSize: 11, color: '#C4A87C' },
  formTitle: { fontSize: 22, fontWeight: '300', color: '#2A2A2A', marginBottom: 8 },
  formSubtitle: { fontSize: 13, color: '#A0A090', lineHeight: 18, marginBottom: 24 },
  sectionTitle: { fontSize: 12, color: '#A0A090', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  typeChipText: { fontSize: 13, color: '#6B6B5B' },
  titleInput: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#4A4A4A', marginBottom: 12 },
  dreamInput: { backgroundColor: '#fff', borderRadius: 16, padding: 20, fontSize: 16, color: '#4A4A4A', lineHeight: 24, minHeight: 150, fontWeight: '300', marginBottom: 20 },
  emotionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 32 },
  emotionChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  emotionChipActive: { backgroundColor: '#8B9A7D' },
  emotionText: { fontSize: 13, color: '#8B8B7B' },
  emotionTextActive: { color: '#fff' },
  interpretBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#C4A87C', borderRadius: 24, paddingVertical: 16, marginBottom: 20 },
  interpretBtnDisabled: { opacity: 0.5 },
  interpretBtnText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  interpretationHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  interpretationTitle: { fontSize: 20, fontWeight: '400', color: '#C4A87C', letterSpacing: 0.3 },
  interpretationText: { fontSize: 15, color: '#4A4A4A', lineHeight: 26, fontWeight: '300', marginBottom: 24 },
  doneBtn: { backgroundColor: '#8B9A7D', borderRadius: 24, paddingVertical: 16, alignItems: 'center' },
  doneBtnText: { color: '#fff', fontSize: 15, fontWeight: '500' },
});
