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
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import { TwinklingStars } from '../src/components/TwinklingStars';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface DreamSymbol {
  id: string;
  symbol: string;
  personal_meaning: string;
  universal_meaning: string;
  occurrences: number;
  last_seen: string;
  emotions: string[];
  ai_insight?: string;
}

export default function DreamDictionaryScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [symbols, setSymbols] = useState<DreamSymbol[]>([]);
  const [filteredSymbols, setFilteredSymbols] = useState<DreamSymbol[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState<DreamSymbol | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [saving, setSaving] = useState(false);

  const ds = {
    container: { backgroundColor: theme.background },
    card: { backgroundColor: theme.card },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    textMuted: { color: theme.textMuted },
    input: { backgroundColor: theme.inputBackground, color: theme.text },
  };

  useEffect(() => {
    fetchSymbols();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = symbols.filter(s => 
        s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.personal_meaning.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSymbols(filtered);
    } else {
      setFilteredSymbols(symbols);
    }
  }, [searchQuery, symbols]);

  const fetchSymbols = async () => {
    try {
      const response = await fetch(`${API_URL}/api/dream-dictionary`);
      if (response.ok) {
        const data = await response.json();
        setSymbols(data);
        setFilteredSymbols(data);
      }
    } catch (error) {
      console.error('Error fetching symbols:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSymbol = async () => {
    if (!newSymbol.trim() || !newMeaning.trim()) return;
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/dream-dictionary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: newSymbol.trim(),
          personal_meaning: newMeaning.trim(),
          language: 'fr',
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setSymbols([data, ...symbols]);
        setShowAddModal(false);
        setNewSymbol('');
        setNewMeaning('');
      }
    } catch (error) {
      console.error('Error adding symbol:', error);
    } finally {
      setSaving(false);
    }
  };

  const getSymbolIcon = (symbol: string) => {
    const iconMap: Record<string, string> = {
      eau: '💧', water: '💧', agua: '💧',
      feu: '🔥', fire: '🔥', fuego: '🔥',
      lune: '🌙', moon: '🌙', luna: '🌙',
      soleil: '☀️', sun: '☀️', sol: '☀️',
      arbre: '🌳', tree: '🌳', árbol: '🌳',
      maison: '🏠', house: '🏠', casa: '🏠',
      serpent: '🐍', snake: '🐍', serpiente: '🐍',
      oiseau: '🦅', bird: '🦅', pájaro: '🦅',
      vol: '🕊️', flight: '🕊️', vuelo: '🕊️',
      chute: '🌀', fall: '🌀', caída: '🌀',
      mort: '🦋', death: '🦋', muerte: '🦋',
      forêt: '🌲', forest: '🌲', bosque: '🌲',
      mer: '🌊', sea: '🌊', mar: '🌊',
      montagne: '⛰️', mountain: '⛰️', montaña: '⛰️',
    };
    const key = symbol.toLowerCase();
    return iconMap[key] || '✨';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <SafeAreaView style={[styles.container, ds.container]}>
      <TwinklingStars density={isDark ? 40 : 20} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-down" size={28} color={theme.iconColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, ds.text]}>Dictionnaire Onirique</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addButton}>
          <Ionicons name="add-circle-outline" size={26} color={theme.accentWarm} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={theme.textMuted} />
        <TextInput
          style={[styles.searchInput, ds.input]}
          placeholder="Rechercher un symbole..."
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.accentWarm} />
            <Text style={[styles.loadingText, ds.textMuted]}>Chargement...</Text>
          </View>
        ) : filteredSymbols.length > 0 ? (
          <>
            <Text style={[styles.subtitle, ds.textMuted]}>
              {filteredSymbols.length} symbole{filteredSymbols.length > 1 ? 's' : ''} dans ton dictionnaire
            </Text>
            
            {filteredSymbols.map((symbol, idx) => (
              <Animated.View key={symbol.id} entering={FadeInUp.duration(400).delay(idx * 50)}>
                <TouchableOpacity
                  style={[styles.symbolCard, ds.card]}
                  onPress={() => setSelectedSymbol(symbol)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.symbolIcon, { backgroundColor: `${theme.accentWarm}15` }]}>
                    <Text style={styles.symbolEmoji}>{getSymbolIcon(symbol.symbol)}</Text>
                  </View>
                  <View style={styles.symbolContent}>
                    <Text style={[styles.symbolName, ds.text]}>{symbol.symbol}</Text>
                    <Text style={[styles.symbolMeaning, ds.textSecondary]} numberOfLines={2}>
                      {symbol.personal_meaning}
                    </Text>
                    <View style={styles.symbolMeta}>
                      <Text style={[styles.symbolOccurrences, { color: theme.accent }]}>
                        {symbol.occurrences}x
                      </Text>
                      <Text style={[styles.symbolDate, ds.textMuted]}>
                        {formatDate(symbol.last_seen)}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                </TouchableOpacity>
              </Animated.View>
            ))}
          </>
        ) : (
          <Animated.View entering={FadeIn.duration(600)} style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: `${theme.accentWarm}15` }]}>
              <Text style={styles.emptyEmoji}>📖</Text>
            </View>
            <Text style={[styles.emptyTitle, ds.text]}>Ton dictionnaire est vide</Text>
            <Text style={[styles.emptySubtitle, ds.textSecondary]}>Commence à construire ton lexique personnel des symboles de tes rêves</Text>
            
            <TouchableOpacity
              style={[styles.addFirstButton, { backgroundColor: theme.accentWarm }]}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addFirstText}>Ajouter mon premier symbole</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>

      {/* Symbol Detail Modal */}
      <Modal
        visible={!!selectedSymbol}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedSymbol(null)}
      >
        <SafeAreaView style={[styles.modalContainer, ds.container]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, ds.text]}>{selectedSymbol?.symbol}</Text>
            <TouchableOpacity onPress={() => setSelectedSymbol(null)}>
              <Ionicons name="close" size={28} color={theme.iconColor} />
            </TouchableOpacity>
          </View>

          {selectedSymbol && (
            <ScrollView style={styles.modalContent}>
              <View style={[styles.detailIconContainer, { backgroundColor: `${theme.accentWarm}15` }]}>
                <Text style={styles.detailEmoji}>{getSymbolIcon(selectedSymbol.symbol)}</Text>
              </View>

              <View style={[styles.detailSection, ds.card]}>
                <Text style={[styles.detailLabel, ds.textMuted]}>Ta signification</Text>
                <Text style={[styles.detailText, ds.text]}>{selectedSymbol.personal_meaning}</Text>
              </View>

              {selectedSymbol.universal_meaning && (
                <View style={[styles.detailSection, ds.card]}>
                  <Text style={[styles.detailLabel, ds.textMuted]}>Signification universelle</Text>
                  <Text style={[styles.detailText, ds.textSecondary]}>{selectedSymbol.universal_meaning}</Text>
                </View>
              )}

              {selectedSymbol.ai_insight && (
                <View style={[styles.detailSection, ds.card, { borderLeftWidth: 3, borderLeftColor: theme.accentWarm }]}>
                  <Text style={[styles.detailLabel, ds.textMuted]}>Analyse IA</Text>
                  <Text style={[styles.detailText, ds.textSecondary]}>{selectedSymbol.ai_insight}</Text>
                </View>
              )}

              <View style={styles.statsRow}>
                <View style={[styles.statBox, ds.card]}>
                  <Text style={[styles.statNumber, { color: theme.accentWarm }]}>{selectedSymbol.occurrences}</Text>
                  <Text style={[styles.statLabel, ds.textMuted]}>Apparitions</Text>
                </View>
                <View style={[styles.statBox, ds.card]}>
                  <Text style={[styles.statNumber, { color: theme.accent }]}>{formatDate(selectedSymbol.last_seen)}</Text>
                  <Text style={[styles.statLabel, ds.textMuted]}>Dernière fois</Text>
                </View>
              </View>

              {selectedSymbol.emotions && selectedSymbol.emotions.length > 0 && (
                <View style={styles.emotionsSection}>
                  <Text style={[styles.detailLabel, ds.textMuted]}>Émotions associées</Text>
                  <View style={styles.emotionsTags}>
                    {selectedSymbol.emotions.map((emotion, idx) => (
                      <View key={idx} style={[styles.emotionTag, { backgroundColor: `${theme.accent}15` }]}>
                        <Text style={[styles.emotionText, { color: theme.accent }]}>{emotion}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Add Symbol Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, ds.container]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, ds.text]}>Nouveau symbole</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={28} color={theme.iconColor} />
            </TouchableOpacity>
          </View>

          <View style={styles.addFormContainer}>
            <Text style={[styles.formLabel, ds.text]}>Nom du symbole</Text>
            <TextInput
              style={[styles.formInput, ds.card, ds.text]}
              placeholder="Ex: Eau, Lune, Maison..."
              placeholderTextColor={theme.textMuted}
              value={newSymbol}
              onChangeText={setNewSymbol}
            />

            <Text style={[styles.formLabel, ds.text]}>Ta signification personnelle</Text>
            <TextInput
              style={[styles.formInput, styles.formTextarea, ds.card, ds.text]}
              placeholder="Que représente ce symbole pour toi ?"
              placeholderTextColor={theme.textMuted}
              value={newMeaning}
              onChangeText={setNewMeaning}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.accentWarm }, (!newSymbol.trim() || !newMeaning.trim()) && styles.saveButtonDisabled]}
              onPress={addSymbol}
              disabled={!newSymbol.trim() || !newMeaning.trim() || saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Enregistrer</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  backButton: { width: 40 },
  headerTitle: { fontSize: 20, fontWeight: '600', letterSpacing: 1 },
  addButton: { width: 40, alignItems: 'flex-end' },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 16, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 25, backgroundColor: 'rgba(0,0,0,0.05)' },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, backgroundColor: 'transparent' },
  
  scrollContent: { padding: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  loadingText: { marginTop: 12, fontSize: 14 },
  
  subtitle: { fontSize: 13, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
  
  symbolCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12 },
  symbolIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  symbolEmoji: { fontSize: 24 },
  symbolContent: { flex: 1, marginLeft: 14 },
  symbolName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  symbolMeaning: { fontSize: 13, lineHeight: 18, marginBottom: 6 },
  symbolMeta: { flexDirection: 'row', alignItems: 'center' },
  symbolOccurrences: { fontSize: 12, fontWeight: '600', marginRight: 12 },
  symbolDate: { fontSize: 11 },
  
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: '600', marginBottom: 10 },
  emptySubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, paddingHorizontal: 40, marginBottom: 30 },
  addFirstButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 25, gap: 8 },
  addFirstText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  modalContent: { padding: 20 },
  
  detailIconContainer: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 24 },
  detailEmoji: { fontSize: 48 },
  detailSection: { padding: 16, borderRadius: 16, marginBottom: 16 },
  detailLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  detailText: { fontSize: 15, lineHeight: 24 },
  
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statBox: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  statLabel: { fontSize: 11, textTransform: 'uppercase' },
  
  emotionsSection: { marginTop: 8 },
  emotionsTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  emotionTag: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  emotionText: { fontSize: 13 },
  
  addFormContainer: { padding: 20 },
  formLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  formInput: { padding: 16, borderRadius: 12, fontSize: 15 },
  formTextarea: { height: 120, textAlignVertical: 'top' },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 25, marginTop: 30, gap: 8 },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
