import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  Image,
  Dimensions,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const { width } = Dimensions.get('window');

interface Stats {
  users: { total: number; free: number; essentiel: number; premium: number; lifetime: number };
  codes: { total: number; used: number; available: number };
  revenue: { total: number; currency: string };
}

interface DatabaseStats {
  capsules: number;
  dreams: number;
  moods: number;
  soul_reports: number;
  gratitude_entries: number;
  sleep_entries: number;
  dream_symbols: number;
  lifetime_codes: number;
  astrology_profiles: number;
}

interface LifetimeCode {
  code: string;
  is_used: boolean;
  used_by_email?: string;
  used_at?: string;
  created_at: string;
  batch_name?: string;
}

interface User {
  user_id: string;
  email: string;
  subscription_tier: string;
  created_at: string;
  display_name?: string;
}

export default function AdminScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [codes, setCodes] = useState<LifetimeCode[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [generatedCodes, setGeneratedCodes] = useState<{ code: string; qr_code: string }[]>([]);
  const [codeCount, setCodeCount] = useState('10');
  const [batchName, setBatchName] = useState('');
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'codes' | 'database' | 'generate'>('stats');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  const ds = {
    container: { backgroundColor: theme.background },
    card: { backgroundColor: theme.card },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    textMuted: { color: theme.textMuted },
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'include',
      });

      if (response.ok) {
        setIsAuthenticated(true);
        loadAllData();
      } else {
        Alert.alert('Erreur', 'Mot de passe incorrect');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllData = () => {
    fetchStats();
    fetchDbStats();
    fetchCodes();
    fetchUsers();
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/stats`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchDbStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/database-stats`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setDbStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching db stats:', error);
    }
  };

  const fetchCodes = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/codes`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setCodes(data.codes);
      }
    } catch (error) {
      console.error('Error fetching codes:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleGenerateCodes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/generate-codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: parseInt(codeCount),
          batch_name: batchName || undefined,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedCodes(data.codes);
        fetchCodes();
        fetchStats();
        Alert.alert('Succès', `${data.codes.length} codes générés !`);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetUserTier = async (userId: string, tier: string) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/set-user-tier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, tier }),
        credentials: 'include',
      });

      if (response.ok) {
        Alert.alert('Succès', `Utilisateur mis à jour en ${tier}`);
        fetchUsers();
        fetchStats();
        setShowUserModal(false);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la mise à jour');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    Alert.alert(
      'Confirmer la suppression',
      'Cette action est irréversible. Toutes les données de cet utilisateur seront supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/api/admin/user/${userId}`, {
                method: 'DELETE',
                credentials: 'include',
              });

              if (response.ok) {
                Alert.alert('Succès', 'Utilisateur supprimé');
                fetchUsers();
                fetchStats();
                setShowUserModal(false);
              }
            } catch (error) {
              Alert.alert('Erreur', 'Erreur lors de la suppression');
            }
          },
        },
      ]
    );
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'lifetime': return '#F39C12';
      case 'premium': return '#9B59B6';
      case 'essentiel': return '#4A90D9';
      default: return theme.textMuted;
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'lifetime': return 'Fondateur';
      case 'premium': return 'Premium';
      case 'essentiel': return 'Essentiel';
      default: return 'Gratuit';
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, ds.container]}>
        <View style={styles.loginContainer}>
          <Animated.View entering={FadeIn.duration(500)}>
            <Ionicons name="shield-checkmark" size={60} color={theme.accent} />
          </Animated.View>
          
          <Text style={[styles.loginTitle, ds.text]}>Admin Latence</Text>
          <Text style={[styles.loginSubtitle, ds.textMuted]}>
            Console d'administration
          </Text>

          <TextInput
            style={[styles.passwordInput, ds.card, { color: theme.text }]}
            placeholder="Mot de passe admin"
            placeholderTextColor={theme.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: theme.accent }]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Accéder</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backLink}
            onPress={() => router.back()}
          >
            <Text style={[styles.backLinkText, ds.textMuted]}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, ds.container]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.iconColor} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Ionicons name="shield-checkmark" size={20} color="#F39C12" />
            <Text style={[styles.headerTitle, ds.text]}>Admin</Text>
          </View>
          <TouchableOpacity onPress={loadAllData}>
            <Ionicons name="refresh" size={24} color={theme.iconColor} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          <View style={styles.tabs}>
            {[
              { key: 'stats', icon: 'stats-chart', label: 'Stats' },
              { key: 'users', icon: 'people', label: 'Users' },
              { key: 'codes', icon: 'key', label: 'Codes' },
              { key: 'database', icon: 'server', label: 'DB' },
              { key: 'generate', icon: 'add-circle', label: 'Générer' },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && { backgroundColor: theme.accent }]}
                onPress={() => setActiveTab(tab.key as any)}
              >
                <Ionicons 
                  name={tab.icon as any} 
                  size={18} 
                  color={activeTab === tab.key ? '#fff' : theme.textSecondary} 
                />
                <Text style={[styles.tabText, activeTab === tab.key ? { color: '#fff' } : ds.textSecondary]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Stats Tab */}
        {activeTab === 'stats' && stats && (
          <Animated.View entering={FadeInUp.duration(500)}>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, ds.card]}>
                <Ionicons name="people" size={28} color={theme.accent} />
                <Text style={[styles.statValue, ds.text]}>{stats.users.total}</Text>
                <Text style={[styles.statLabel, ds.textMuted]}>Utilisateurs</Text>
              </View>
              <View style={[styles.statCard, ds.card]}>
                <Ionicons name="card" size={28} color="#4CAF50" />
                <Text style={[styles.statValue, ds.text]}>{stats.revenue.total}€</Text>
                <Text style={[styles.statLabel, ds.textMuted]}>Revenus</Text>
              </View>
            </View>

            <View style={[styles.detailCard, ds.card]}>
              <Text style={[styles.detailTitle, ds.text]}>Répartition des abonnements</Text>
              <View style={styles.tierBars}>
                {[
                  { tier: 'free', count: stats.users.free, color: theme.textMuted },
                  { tier: 'essentiel', count: stats.users.essentiel, color: '#4A90D9' },
                  { tier: 'premium', count: stats.users.premium, color: '#9B59B6' },
                  { tier: 'lifetime', count: stats.users.lifetime, color: '#F39C12' },
                ].map((item) => (
                  <View key={item.tier} style={styles.tierRow}>
                    <View style={styles.tierInfo}>
                      <View style={[styles.tierDot, { backgroundColor: item.color }]} />
                      <Text style={[styles.tierName, ds.textSecondary]}>
                        {getTierLabel(item.tier)}
                      </Text>
                    </View>
                    <View style={styles.tierBarContainer}>
                      <View 
                        style={[
                          styles.tierBar, 
                          { 
                            backgroundColor: item.color,
                            width: stats.users.total > 0 
                              ? `${(item.count / stats.users.total) * 100}%` 
                              : '0%'
                          }
                        ]} 
                      />
                    </View>
                    <Text style={[styles.tierCount, { color: item.color }]}>{item.count}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.detailCard, ds.card]}>
              <Text style={[styles.detailTitle, ds.text]}>Codes Accès à Vie</Text>
              <View style={styles.codesStats}>
                <View style={styles.codeStat}>
                  <Text style={[styles.codeStatValue, ds.text]}>{stats.codes.total}</Text>
                  <Text style={[styles.codeStatLabel, ds.textMuted]}>Total</Text>
                </View>
                <View style={styles.codeStat}>
                  <Text style={[styles.codeStatValue, { color: '#E57373' }]}>{stats.codes.used}</Text>
                  <Text style={[styles.codeStatLabel, ds.textMuted]}>Utilisés</Text>
                </View>
                <View style={styles.codeStat}>
                  <Text style={[styles.codeStatValue, { color: '#4CAF50' }]}>{stats.codes.available}</Text>
                  <Text style={[styles.codeStatLabel, ds.textMuted]}>Dispo</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <Animated.View entering={FadeInUp.duration(500)}>
            <Text style={[styles.sectionTitle, ds.text]}>{users.length} utilisateurs</Text>
            {users.map((user) => (
              <TouchableOpacity
                key={user.user_id}
                style={[styles.userCard, ds.card]}
                onPress={() => {
                  setSelectedUser(user);
                  setShowUserModal(true);
                }}
              >
                <View style={styles.userHeader}>
                  <View style={styles.userAvatar}>
                    <Ionicons name="person" size={20} color={theme.accent} />
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={[styles.userEmail, ds.text]} numberOfLines={1}>
                      {user.email}
                    </Text>
                    <Text style={[styles.userId, ds.textMuted]} numberOfLines={1}>
                      {user.user_id.slice(0, 8)}...
                    </Text>
                  </View>
                  <View style={[styles.tierBadge, { backgroundColor: `${getTierColor(user.subscription_tier)}20` }]}>
                    <Text style={[styles.tierBadgeText, { color: getTierColor(user.subscription_tier) }]}>
                      {getTierLabel(user.subscription_tier)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        {/* Codes Tab */}
        {activeTab === 'codes' && (
          <Animated.View entering={FadeInUp.duration(500)}>
            <Text style={[styles.sectionTitle, ds.text]}>{codes.length} codes</Text>
            {codes.map((code) => (
              <View key={code.code} style={[styles.codeCard, ds.card]}>
                <View style={styles.codeHeader}>
                  <Text style={[styles.codeText, ds.text]}>{code.code}</Text>
                  <View style={[
                    styles.codeBadge,
                    { backgroundColor: code.is_used ? '#E5737320' : '#4CAF5020' }
                  ]}>
                    <Text style={[
                      styles.codeBadgeText,
                      { color: code.is_used ? '#E57373' : '#4CAF50' }
                    ]}>
                      {code.is_used ? 'Utilisé' : 'Disponible'}
                    </Text>
                  </View>
                </View>
                {code.is_used && code.used_by_email && (
                  <Text style={[styles.codeUsedBy, ds.textMuted]}>
                    Par: {code.used_by_email}
                  </Text>
                )}
                <Text style={[styles.codeBatch, ds.textMuted]}>
                  {code.batch_name || 'Sans lot'}
                </Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Database Tab */}
        {activeTab === 'database' && dbStats && (
          <Animated.View entering={FadeInUp.duration(500)}>
            <Text style={[styles.sectionTitle, ds.text]}>Collections MongoDB</Text>
            <View style={[styles.dbCard, ds.card]}>
              {Object.entries(dbStats).map(([key, value]) => (
                <View key={key} style={styles.dbRow}>
                  <View style={styles.dbInfo}>
                    <Ionicons 
                      name={
                        key === 'capsules' ? 'document-text' :
                        key === 'dreams' ? 'moon' :
                        key === 'moods' ? 'heart' :
                        key === 'soul_reports' ? 'sparkles' :
                        key === 'gratitude_entries' ? 'heart-circle' :
                        key === 'sleep_entries' ? 'bed' :
                        key === 'dream_symbols' ? 'book' :
                        key === 'lifetime_codes' ? 'key' :
                        'planet'
                      } 
                      size={20} 
                      color={theme.accent} 
                    />
                    <Text style={[styles.dbName, ds.text]}>
                      {key.replace(/_/g, ' ')}
                    </Text>
                  </View>
                  <Text style={[styles.dbCount, { color: theme.accent }]}>{value}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Generate Tab */}
        {activeTab === 'generate' && (
          <Animated.View entering={FadeInUp.duration(500)}>
            <View style={[styles.generateCard, ds.card]}>
              <View style={styles.generateHeader}>
                <Ionicons name="key" size={32} color="#F39C12" />
                <Text style={[styles.generateTitle, ds.text]}>Codes Fondateur</Text>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, ds.textSecondary]}>Nombre de codes</Text>
                <TextInput
                  style={[styles.input, ds.card, { color: theme.text, borderColor: theme.border }]}
                  value={codeCount}
                  onChangeText={setCodeCount}
                  keyboardType="number-pad"
                  placeholder="10"
                  placeholderTextColor={theme.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, ds.textSecondary]}>Nom du lot</Text>
                <TextInput
                  style={[styles.input, ds.card, { color: theme.text, borderColor: theme.border }]}
                  value={batchName}
                  onChangeText={setBatchName}
                  placeholder="Ex: Lancement iOS 2026"
                  placeholderTextColor={theme.textMuted}
                />
              </View>

              <TouchableOpacity
                style={[styles.generateButton, { backgroundColor: '#F39C12' }]}
                onPress={handleGenerateCodes}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={20} color="#fff" />
                    <Text style={styles.generateButtonText}>Générer</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Generated Codes Preview */}
            {generatedCodes.length > 0 && (
              <View style={[styles.generatedContainer, ds.card]}>
                <Text style={[styles.generatedTitle, ds.text]}>
                  {generatedCodes.length} codes générés
                </Text>
                
                {generatedCodes.slice(0, 5).map((item) => (
                  <View key={item.code} style={styles.generatedItem}>
                    <View style={styles.qrContainer}>
                      <Image
                        source={{ uri: `data:image/png;base64,${item.qr_code}` }}
                        style={styles.qrImage}
                      />
                    </View>
                    <Text style={[styles.generatedCode, ds.text]}>{item.code}</Text>
                  </View>
                ))}

                {generatedCodes.length > 5 && (
                  <Text style={[styles.moreText, ds.textMuted]}>
                    + {generatedCodes.length - 5} autres codes
                  </Text>
                )}
              </View>
            )}
          </Animated.View>
        )}
      </ScrollView>

      {/* User Modal */}
      <Modal
        visible={showUserModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, ds.card]}>
            {selectedUser && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, ds.text]}>Gérer l'utilisateur</Text>
                  <TouchableOpacity onPress={() => setShowUserModal(false)}>
                    <Ionicons name="close" size={24} color={theme.iconColor} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalUserInfo}>
                  <Text style={[styles.modalEmail, ds.text]}>{selectedUser.email}</Text>
                  <Text style={[styles.modalId, ds.textMuted]}>{selectedUser.user_id}</Text>
                </View>

                <Text style={[styles.modalSection, ds.textSecondary]}>Changer l'abonnement</Text>
                <View style={styles.tierButtons}>
                  {['free', 'essentiel', 'premium', 'lifetime'].map((tier) => (
                    <TouchableOpacity
                      key={tier}
                      style={[
                        styles.tierButton,
                        { 
                          backgroundColor: selectedUser.subscription_tier === tier 
                            ? getTierColor(tier) 
                            : `${getTierColor(tier)}20`,
                          borderColor: getTierColor(tier),
                        }
                      ]}
                      onPress={() => handleSetUserTier(selectedUser.user_id, tier)}
                    >
                      <Text style={[
                        styles.tierButtonText,
                        { color: selectedUser.subscription_tier === tier ? '#fff' : getTierColor(tier) }
                      ]}>
                        {getTierLabel(tier)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteUser(selectedUser.user_id)}
                >
                  <Ionicons name="trash" size={18} color="#E57373" />
                  <Text style={styles.deleteButtonText}>Supprimer l'utilisateur</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loginContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loginTitle: { fontSize: 28, fontWeight: '300', marginTop: 24, marginBottom: 8 },
  loginSubtitle: { fontSize: 14, marginBottom: 32 },
  passwordInput: { width: '100%', borderRadius: 16, padding: 16, fontSize: 16, marginBottom: 16 },
  loginButton: { width: '100%', borderRadius: 25, padding: 16, alignItems: 'center' },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  backLink: { marginTop: 24 },
  backLinkText: { fontSize: 14 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  tabsScroll: { marginBottom: 20 },
  tabs: { flexDirection: 'row', gap: 10 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20 },
  tabText: { fontSize: 13, fontWeight: '500' },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 16, padding: 20, alignItems: 'center' },
  statValue: { fontSize: 32, fontWeight: '300', marginTop: 8 },
  statLabel: { fontSize: 13, marginTop: 4 },
  detailCard: { borderRadius: 16, padding: 20, marginBottom: 16 },
  detailTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  tierBars: { gap: 12 },
  tierRow: { flexDirection: 'row', alignItems: 'center' },
  tierInfo: { flexDirection: 'row', alignItems: 'center', width: 90 },
  tierDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  tierName: { fontSize: 13 },
  tierBarContainer: { flex: 1, height: 8, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 4, marginHorizontal: 12 },
  tierBar: { height: '100%', borderRadius: 4 },
  tierCount: { fontSize: 14, fontWeight: '600', width: 30, textAlign: 'right' },
  codesStats: { flexDirection: 'row', justifyContent: 'space-around' },
  codeStat: { alignItems: 'center' },
  codeStatValue: { fontSize: 28, fontWeight: '300' },
  codeStatLabel: { fontSize: 12, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  userCard: { borderRadius: 12, padding: 14, marginBottom: 10 },
  userHeader: { flexDirection: 'row', alignItems: 'center' },
  userAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(212, 165, 116, 0.15)', alignItems: 'center', justifyContent: 'center' },
  userInfo: { flex: 1, marginLeft: 12 },
  userEmail: { fontSize: 14, fontWeight: '500' },
  userId: { fontSize: 11, marginTop: 2 },
  tierBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  tierBadgeText: { fontSize: 11, fontWeight: '600' },
  codeCard: { borderRadius: 12, padding: 16, marginBottom: 12 },
  codeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  codeText: { fontSize: 14, fontWeight: '500', letterSpacing: 1 },
  codeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  codeBadgeText: { fontSize: 11, fontWeight: '500' },
  codeUsedBy: { fontSize: 12, marginBottom: 4 },
  codeBatch: { fontSize: 11 },
  dbCard: { borderRadius: 16, padding: 20 },
  dbRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  dbInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dbName: { fontSize: 14, textTransform: 'capitalize' },
  dbCount: { fontSize: 16, fontWeight: '600' },
  generateCard: { borderRadius: 16, padding: 24 },
  generateHeader: { alignItems: 'center', marginBottom: 24 },
  generateTitle: { fontSize: 18, fontWeight: '600', marginTop: 12 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 13, marginBottom: 8 },
  input: { borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1 },
  generateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 25, padding: 16, marginTop: 8 },
  generateButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  generatedContainer: { borderRadius: 16, padding: 20, marginTop: 24 },
  generatedTitle: { fontSize: 16, fontWeight: '500', marginBottom: 16 },
  generatedItem: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  qrContainer: { width: 60, height: 60, backgroundColor: '#fff', borderRadius: 8, padding: 4 },
  qrImage: { width: '100%', height: '100%' },
  generatedCode: { fontSize: 13, fontWeight: '500', letterSpacing: 1 },
  moreText: { fontSize: 13, textAlign: 'center', marginTop: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  modalUserInfo: { marginBottom: 24 },
  modalEmail: { fontSize: 16, fontWeight: '500' },
  modalId: { fontSize: 12, marginTop: 4 },
  modalSection: { fontSize: 13, marginBottom: 12 },
  tierButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  tierButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  tierButtonText: { fontSize: 13, fontWeight: '500' },
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, backgroundColor: '#E5737310' },
  deleteButtonText: { color: '#E57373', fontSize: 14, fontWeight: '500' },
});
