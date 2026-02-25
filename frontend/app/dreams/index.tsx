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
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp, FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../src/context/ThemeContext';
import { useFonts } from '../../src/context/FontContext';
import VoiceRecorder from '../../src/components/VoiceRecorder';

const { width } = Dimensions.get('window');
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
  const { theme } = useTheme();
  const { fontsLoaded, handwritingFont } = useFonts();
  const [view, setView] = useState<'list' | 'new' | 'edit'>('list');
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDream, setEditingDream] = useState<Dream | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [dreamType, setDreamType] = useState('reve');
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [interpretation, setInterpretation] = useState('');
  
  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [dreamToDelete, setDreamToDelete] = useState<Dream | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handwritingStyle = fontsLoaded ? { fontFamily: handwritingFont, fontSize: 22 } : { fontSize: 18 };

  const ds = {
    container: { backgroundColor: theme.background },
    card: { backgroundColor: theme.card },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    textMuted: { color: theme.textMuted },
  };

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
            body: JSON.stringify({ interpretation: data.interpretation }),
          });
        }
      }
    } catch (e) {
      console.log('Error:', e);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleUpdateDream = async () => {
    if (!content.trim() || !editingDream) return;
    setIsSaving(true);

    try {
      const dreamTitle = title.trim() || content.trim().substring(0, 50) + '...';
      
      const res = await fetch(`${API_URL}/api/dream/${editingDream.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: dreamTitle,
          content: content.trim(),
          dream_type: dreamType,
          emotions: selectedEmotions.length > 0 ? selectedEmotions : ['non précisé'],
        }),
      });

      if (res.ok) {
        resetForm();
        fetchDreams();
      }
    } catch (e) {
      console.log('Error updating:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = (dream: Dream) => {
    setDreamToDelete(dream);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!dreamToDelete) return;
    setIsDeleting(true);
    
    try {
      const res = await fetch(`${API_URL}/api/dream/${dreamToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setDreams(prev => prev.filter(d => d.id !== dreamToDelete.id));
      }
    } catch (e) {
      console.log('Error deleting:', e);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setDreamToDelete(null);
    }
  };

  const startEdit = (dream: Dream) => {
    setEditingDream(dream);
    setTitle(dream.title);
    setContent(dream.content);
    setDreamType(dream.dream_type);
    setSelectedEmotions(dream.emotions || []);
    setView('edit');
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setDreamType('reve');
    setSelectedEmotions([]);
    setInterpretation('');
    setEditingDream(null);
    setView('list');
    fetchDreams();
  };

  const getTypeInfo = (typeId: string) =>
    DREAM_TYPES.find(t => t.id === typeId) || DREAM_TYPES[0];

  const renderList = () => (
    <Animated.View entering={FadeIn.duration(400)}>
      <View style={styles.listHeader}>
        <Text style={[styles.title, ds.text]}>Carnet des rêves</Text>
        <TouchableOpacity
          style={[styles.newDreamBtn, { backgroundColor: theme.accent }]}
          onPress={() => setView('new')}
          data-testid="new-dream-btn"
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      <Text style={[styles.subtitle, ds.textMuted]}>Tes rêves, interprétés par Freud, Jung et les anciens.</Text>

      {/* Oracle des Rêves Button */}
      <TouchableOpacity
        style={[styles.oracleCard, ds.card]}
        onPress={() => router.push('/dream-oracle')}
        data-testid="oracle-btn"
      >
        <View style={[styles.oracleIcon, { backgroundColor: `${theme.accentWarm}20` }]}>
          <Text style={styles.oracleEmoji}>👁️</Text>
        </View>
        <View style={styles.oracleTextContainer}>
          <Text style={[styles.oracleTitle, ds.text]}>Oracle des Rêves</Text>
          <Text style={[styles.oracleSubtitle, ds.textMuted]}>Analyse les patterns de tes rêves</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={theme.accent} />
      ) : dreams.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="moon-outline" size={48} color={theme.accentWarm} />
          <Text style={[styles.emptyText, ds.textSecondary]}>Aucun rêve enregistré</Text>
          <Text style={[styles.emptySubtext, ds.textMuted]}>Commence ton carnet onirique</Text>
        </View>
      ) : (
        dreams.map((dream, i) => {
          const typeInfo = getTypeInfo(dream.dream_type);
          return (
            <Animated.View key={dream.id} entering={FadeInUp.duration(400).delay(i * 80)}>
              <View style={[styles.dreamCard, ds.card]}>
                <TouchableOpacity
                  style={styles.dreamContent}
                  onPress={() => router.push(`/dreams/${dream.id}`)}
                  data-testid={`dream-card-${dream.id}`}
                >
                  <View style={styles.dreamMeta}>
                    <Ionicons name={typeInfo.icon as any} size={18} color={typeInfo.color} />
                    <Text style={[styles.dreamDate, ds.textMuted]}>{formatDreamDate(dream.date)}</Text>
                    <View style={[styles.typeBadge, { backgroundColor: `${typeInfo.color}18` }]}>
                      <Text style={[styles.typeText, { color: typeInfo.color }]}>{typeInfo.label}</Text>
                    </View>
                  </View>
                  <Text style={[styles.dreamTitle, ds.text]} numberOfLines={1}>{dream.title}</Text>
                  <Text style={[styles.dreamPreview, ds.textSecondary]} numberOfLines={2}>{dream.content}</Text>
                  {dream.interpretation && (
                    <View style={styles.hasInterpretation}>
                      <Ionicons name="sparkles" size={12} color={theme.accentWarm} />
                      <Text style={[styles.hasInterpretationText, { color: theme.accentWarm }]}>Interprété</Text>
                    </View>
                  )}
                </TouchableOpacity>
                
                {/* Action buttons */}
                <View style={styles.dreamActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: `${theme.accent}15` }]}
                    onPress={() => startEdit(dream)}
                    data-testid={`edit-dream-${dream.id}`}
                  >
                    <Ionicons name="pencil-outline" size={18} color={theme.accent} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: 'rgba(196, 124, 124, 0.15)' }]}
                    onPress={() => confirmDelete(dream)}
                    data-testid={`delete-dream-${dream.id}`}
                  >
                    <Ionicons name="trash-outline" size={18} color="#C47C7C" />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          );
        })
      )}
    </Animated.View>
  );

  const renderForm = (isEdit: boolean) => (
    <Animated.View entering={FadeIn.duration(400)}>
      {!interpretation ? (
        <>
          <Text style={[styles.formTitle, ds.text]}>{isEdit ? 'Modifier le rêve' : 'Raconte ton rêve'}</Text>
          <Text style={[styles.formSubtitle, ds.textMuted]}>
            Décris-le avec le plus de détails possible. Couleurs, sensations, personnages...
          </Text>

          {/* Dream Type selector */}
          <Text style={[styles.sectionTitle, ds.textMuted]}>Type de rêve</Text>
          <View style={styles.typeGrid}>
            {DREAM_TYPES.map(t => (
              <TouchableOpacity
                key={t.id}
                style={[styles.typeChip, ds.card, dreamType === t.id && { backgroundColor: t.color }]}
                onPress={() => setDreamType(t.id)}
                data-testid={`type-${t.id}`}
              >
                <Ionicons name={t.icon as any} size={16} color={dreamType === t.id ? '#fff' : t.color} />
                <Text style={[styles.typeChipText, dreamType === t.id && { color: '#fff' }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={[styles.titleInput, ds.card, ds.text]}
            placeholder="Titre (optionnel)"
            placeholderTextColor={theme.textMuted}
            value={title}
            onChangeText={setTitle}
            data-testid="dream-title-input"
          />

          {/* Voice Recorder */}
          <VoiceRecorder
            onTranscription={(text) => setContent(prev => prev ? `${prev}\n${text}` : text)}
            theme={theme}
            placeholder="🎙️ Dicte ton rêve..."
          />

          <TextInput
            style={[styles.dreamInput, ds.card, ds.text]}
            placeholder="J'ai rêvé que..."
            placeholderTextColor={theme.textMuted}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            data-testid="dream-content-input"
          />

          {/* Emotions */}
          <Text style={[styles.sectionTitle, ds.textMuted]}>Émotions au réveil</Text>
          <View style={styles.emotionsGrid}>
            {EMOTIONS.map(emo => (
              <TouchableOpacity
                key={emo.id}
                style={[styles.emotionChip, ds.card, selectedEmotions.includes(emo.id) && { backgroundColor: theme.accent }]}
                onPress={() => toggleEmotion(emo.id)}
                data-testid={`emotion-${emo.id}`}
              >
                <Ionicons
                  name={emo.icon as any}
                  size={14}
                  color={selectedEmotions.includes(emo.id) ? '#fff' : theme.textMuted}
                />
                <Text style={[styles.emotionText, selectedEmotions.includes(emo.id) && { color: '#fff' }]}>
                  {emo.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.interpretBtn, { backgroundColor: theme.accentWarm }, !content.trim() && styles.interpretBtnDisabled]}
            onPress={isEdit ? handleUpdateDream : handleSaveAndInterpret}
            disabled={!content.trim() || isSaving}
            data-testid="dream-interpret-btn"
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name={isEdit ? "checkmark" : "sparkles"} size={18} color="#fff" />
                <Text style={styles.interpretBtnText}>{isEdit ? 'Sauvegarder' : 'Interpréter mon rêve'}</Text>
              </>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <Animated.View entering={FadeInDown.duration(600)}>
          <View style={styles.interpretationHeader}>
            <Ionicons name="sparkles" size={24} color={theme.accentWarm} />
            <Text style={[styles.interpretationTitle, { color: theme.accentWarm }]}>Interprétation</Text>
          </View>
          <Text style={[styles.interpretationText, ds.text]}>{interpretation}</Text>
          <TouchableOpacity style={[styles.doneBtn, { backgroundColor: theme.accent }]} onPress={resetForm} data-testid="dream-done-btn">
            <Text style={styles.doneBtnText}>Retour au carnet</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  );

  return (
    <SafeAreaView style={[styles.container, ds.container]}>
      <View style={styles.nav}>
        <TouchableOpacity
          onPress={() => view === 'list' ? router.back() : resetForm()}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          data-testid="dreams-back-btn"
        >
          <Ionicons name={view === 'list' ? 'chevron-down' : 'arrow-back'} size={26} color={theme.iconColor} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, ds.text]}>
          {view === 'new' ? 'Nouveau rêve' : view === 'edit' ? 'Modifier' : 'Carnet des rêves'}
        </Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {view === 'list' ? renderList() : renderForm(view === 'edit')}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.deleteModal, ds.card]}>
            <Ionicons name="warning-outline" size={48} color="#C47C7C" style={{ marginBottom: 16 }} />
            <Text style={[styles.deleteTitle, ds.text]}>Supprimer ce rêve ?</Text>
            <Text style={[styles.deleteSubtitle, ds.textMuted]}>
              "{dreamToDelete?.title}" sera supprimé définitivement.
            </Text>
            <View style={styles.deleteButtons}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: theme.border }]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={[styles.cancelBtnText, ds.text]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDeleteBtn}
                onPress={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmDeleteText}>Supprimer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  navTitle: { fontSize: 17, fontWeight: '500', letterSpacing: 0.3 },
  scrollContent: { padding: 24, paddingTop: 8, paddingBottom: 40 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '300', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginBottom: 20, lineHeight: 18 },
  newDreamBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  
  // Oracle Card
  oracleCard: { 
    borderRadius: 16, 
    padding: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20,
  },
  oracleIcon: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  oracleEmoji: { fontSize: 26 },
  oracleTextContainer: { flex: 1, marginLeft: 14 },
  oracleTitle: { fontSize: 16, fontWeight: '500' },
  oracleSubtitle: { fontSize: 12, marginTop: 2 },

  emptyState: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { fontSize: 16 },
  emptySubtext: { fontSize: 13 },
  
  dreamCard: { borderRadius: 16, marginBottom: 12, overflow: 'hidden' },
  dreamContent: { padding: 18 },
  dreamMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  dreamDate: { fontSize: 12 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  typeText: { fontSize: 11, fontWeight: '500' },
  dreamTitle: { fontSize: 15, fontWeight: '500', marginBottom: 4 },
  dreamPreview: { fontSize: 13, lineHeight: 18 },
  hasInterpretation: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  hasInterpretationText: { fontSize: 11 },
  
  dreamActions: { 
    flexDirection: 'row', 
    borderTopWidth: 1, 
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  actionBtn: { 
    flex: 1, 
    paddingVertical: 10, 
    borderRadius: 10, 
    alignItems: 'center',
  },

  formTitle: { fontSize: 22, fontWeight: '300', marginBottom: 8 },
  formSubtitle: { fontSize: 13, lineHeight: 18, marginBottom: 24 },
  sectionTitle: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  typeChipText: { fontSize: 13 },
  titleInput: { borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, marginBottom: 12 },
  dreamInput: { borderRadius: 16, padding: 20, fontSize: 16, lineHeight: 24, minHeight: 150, fontWeight: '300', marginBottom: 20 },
  emotionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 32 },
  emotionChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  emotionText: { fontSize: 13 },
  interpretBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 24, paddingVertical: 16, marginBottom: 20 },
  interpretBtnDisabled: { opacity: 0.5 },
  interpretBtnText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  interpretationHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  interpretationTitle: { fontSize: 20, fontWeight: '400', letterSpacing: 0.3 },
  interpretationText: { fontSize: 15, lineHeight: 26, fontWeight: '300', marginBottom: 24 },
  doneBtn: { borderRadius: 24, paddingVertical: 16, alignItems: 'center' },
  doneBtnText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  
  // Delete Modal
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 24,
  },
  deleteModal: { 
    width: '100%', 
    maxWidth: 340, 
    borderRadius: 20, 
    padding: 28, 
    alignItems: 'center',
  },
  deleteTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  deleteSubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  deleteButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '500' },
  confirmDeleteBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#C47C7C', alignItems: 'center' },
  confirmDeleteText: { color: '#fff', fontSize: 15, fontWeight: '500' },
});
