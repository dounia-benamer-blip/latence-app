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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Stats {
  users: { total: number; free: number; essentiel: number; premium: number; lifetime: number };
  codes: { total: number; used: number; available: number };
  revenue: { total: number; currency: string };
}

interface LifetimeCode {
  code: string;
  is_used: boolean;
  used_by_email?: string;
  used_at?: string;
  created_at: string;
  batch_name?: string;
}

export default function AdminScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [codes, setCodes] = useState<LifetimeCode[]>([]);
  const [generatedCodes, setGeneratedCodes] = useState<{ code: string; qr_code: string }[]>([]);
  const [codeCount, setCodeCount] = useState('10');
  const [batchName, setBatchName] = useState('');
  const [activeTab, setActiveTab] = useState<'stats' | 'codes' | 'generate'>('stats');

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
        fetchStats();
        fetchCodes();
      } else {
        Alert.alert('Erreur', 'Mot de passe incorrect');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
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

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, ds.container]}>
        <View style={styles.loginContainer}>
          <Animated.View entering={FadeIn.duration(500)}>
            <Ionicons name="shield-checkmark" size={60} color={theme.accent} />
          </Animated.View>
          
          <Text style={[styles.loginTitle, ds.text]}>Admin Latence</Text>
          <Text style={[styles.loginSubtitle, ds.textMuted]}>
            Accès réservé à l'équipe
          </Text>

          <TextInput
            style={[styles.passwordInput, ds.card, { color: theme.text }]}
            placeholder="Mot de passe"
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
          <Text style={[styles.headerTitle, ds.text]}>Admin</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['stats', 'codes', 'generate'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && { backgroundColor: theme.accent }]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab ? { color: '#fff' } : ds.textSecondary]}>
                {tab === 'stats' ? 'Stats' : tab === 'codes' ? 'Codes' : 'Générer'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Tab */}
        {activeTab === 'stats' && stats && (
          <Animated.View entering={FadeInUp.duration(500)}>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, ds.card]}>
                <Text style={[styles.statValue, ds.text]}>{stats.users.total}</Text>
                <Text style={[styles.statLabel, ds.textMuted]}>Utilisateurs</Text>
              </View>
              <View style={[styles.statCard, ds.card]}>
                <Text style={[styles.statValue, ds.text]}>{stats.revenue.total}€</Text>
                <Text style={[styles.statLabel, ds.textMuted]}>Revenus</Text>
              </View>
            </View>

            <View style={[styles.detailCard, ds.card]}>
              <Text style={[styles.detailTitle, ds.text]}>Répartition</Text>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, ds.textSecondary]}>Gratuit</Text>
                <Text style={[styles.detailValue, ds.text]}>{stats.users.free}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, ds.textSecondary]}>Essentiel</Text>
                <Text style={[styles.detailValue, { color: '#4A90D9' }]}>{stats.users.essentiel}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, ds.textSecondary]}>Premium</Text>
                <Text style={[styles.detailValue, { color: '#9B59B6' }]}>{stats.users.premium}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, ds.textSecondary]}>Fondateurs</Text>
                <Text style={[styles.detailValue, { color: '#F39C12' }]}>{stats.users.lifetime}</Text>
              </View>
            </View>

            <View style={[styles.detailCard, ds.card]}>
              <Text style={[styles.detailTitle, ds.text]}>Codes Accès à Vie</Text>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, ds.textSecondary]}>Total</Text>
                <Text style={[styles.detailValue, ds.text]}>{stats.codes.total}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, ds.textSecondary]}>Utilisés</Text>
                <Text style={[styles.detailValue, ds.text]}>{stats.codes.used}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, ds.textSecondary]}>Disponibles</Text>
                <Text style={[styles.detailValue, { color: theme.accent }]}>{stats.codes.available}</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Codes Tab */}
        {activeTab === 'codes' && (
          <Animated.View entering={FadeInUp.duration(500)}>
            {codes.map((code, index) => (
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

        {/* Generate Tab */}
        {activeTab === 'generate' && (
          <Animated.View entering={FadeInUp.duration(500)}>
            <View style={[styles.generateCard, ds.card]}>
              <Text style={[styles.generateTitle, ds.text]}>Générer des codes</Text>
              
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
                <Text style={[styles.inputLabel, ds.textSecondary]}>Nom du lot (optionnel)</Text>
                <TextInput
                  style={[styles.input, ds.card, { color: theme.text, borderColor: theme.border }]}
                  value={batchName}
                  onChangeText={setBatchName}
                  placeholder="Ex: Lancement Mars 2026"
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
                    <Ionicons name="key" size={20} color="#fff" />
                    <Text style={styles.generateButtonText}>Générer les codes</Text>
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
                
                {generatedCodes.slice(0, 5).map((item, index) => (
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loginContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: '300',
    marginTop: 24,
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 14,
    marginBottom: 32,
  },
  passwordInput: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  loginButton: {
    width: '100%',
    borderRadius: 25,
    padding: 16,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  backLink: {
    marginTop: 24,
  },
  backLinkText: {
    fontSize: 14,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '500',
  },
  placeholder: {
    width: 24,
  },
  tabs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '300',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
  },
  detailCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  codeCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  codeText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 1,
  },
  codeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  codeBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  codeUsedBy: {
    fontSize: 12,
    marginBottom: 4,
  },
  codeBatch: {
    fontSize: 11,
  },
  generateCard: {
    borderRadius: 16,
    padding: 24,
  },
  generateTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 25,
    padding: 16,
    marginTop: 8,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  generatedContainer: {
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
  },
  generatedTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
  },
  generatedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  qrContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 4,
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  generatedCode: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 1,
  },
  moreText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
  },
});
