import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../src/context/ThemeContext';
import AuraAvatar, { AURA_DATABASE } from './components/AuraAvatar';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function ProfileScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [email, setEmail] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentMood, setCurrentMood] = useState<string>('serein');
  const [astroProfile, setAstroProfile] = useState<any>(null);

  useEffect(() => {
    loadProfile();
    fetchCurrentMood();
  }, []);

  const fetchCurrentMood = async () => {
    try {
      const [moodRes, astroRes] = await Promise.all([
        fetch(`${API_URL}/api/mood/latest`),
        fetch(`${API_URL}/api/astrology/profile/latest`),
      ]);
      
      if (moodRes.ok) {
        const moodData = await moodRes.json();
        if (moodData?.mood) {
          setCurrentMood(moodData.mood);
        }
      }
      
      if (astroRes.ok) {
        const astroData = await astroRes.json();
        if (astroData?.name) {
          setAstroProfile(astroData);
          if (astroData.name) setFirstName(astroData.name);
        }
      }
    } catch (e) {
      console.log('Error fetching mood:', e);
    }
  };

  const loadProfile = async () => {
    try {
      const user = await AsyncStorage.getItem('user');
      const profile = await AsyncStorage.getItem('profile');
      
      if (user) {
        const userData = JSON.parse(user);
        setFirstName(userData.firstName || '');
        setLastName(userData.lastName || '');
        setEmail(userData.email || '');
      }
      
      if (profile) {
        const profileData = JSON.parse(profile);
        setBirthDate(profileData.birthDate || '');
        if (profileData.firstName) setFirstName(profileData.firstName);
        if (profileData.lastName) setLastName(profileData.lastName);
      }
    } catch (e) {
      console.log('Error loading profile:', e);
    }
  };

  const saveProfile = async () => {
    try {
      const profileData = {
        firstName,
        lastName,
        birthDate,
        email,
      };
      
      await AsyncStorage.setItem('profile', JSON.stringify(profileData));
      
      const user = await AsyncStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        userData.firstName = firstName;
        userData.lastName = lastName;
        await AsyncStorage.setItem('user', JSON.stringify(userData));
      }
      
      setIsEditing(false);
      Alert.alert('Enregistré', 'Ton profil a été mis à jour.');
    } catch (e) {
      console.log('Error saving profile:', e);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Veux-tu vraiment te déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Oui',
          onPress: async () => {
            await AsyncStorage.removeItem('user');
            router.replace('/');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#6B6B5B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => isEditing ? saveProfile() : setIsEditing(true)}
        >
          <Text style={styles.editButtonText}>
            {isEditing ? 'Enregistrer' : 'Modifier'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Aura Avatar with Meaning */}
        <Animated.View entering={FadeInUp.duration(500)} style={styles.avatarContainer}>
          <AuraAvatar 
            mood={currentMood} 
            size={100}
            userName={firstName || astroProfile?.name || ''}
            showMeaning={true}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(100)} style={styles.section}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Prénom</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Ton prénom"
              placeholderTextColor="#B0B0A0"
              editable={isEditing}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nom</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Ton nom"
              placeholderTextColor="#B0B0A0"
              editable={isEditing}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date de naissance</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={birthDate}
              onChangeText={setBirthDate}
              placeholder="JJ/MM/AAAA"
              placeholderTextColor="#B0B0A0"
              editable={isEditing}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={email}
              onChangeText={setEmail}
              placeholder="ton@email.com"
              placeholderTextColor="#B0B0A0"
              editable={isEditing}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(200)} style={styles.section}>
          <Text style={styles.sectionTitle}>Abonnement</Text>
          
          <TouchableOpacity 
            style={styles.healthCard}
            onPress={() => router.push('/subscription')}
          >
            <Ionicons name="diamond-outline" size={24} color="#9B59B6" />
            <View style={styles.healthText}>
              <Text style={styles.healthTitle}>Gérer mon abonnement</Text>
              <Text style={styles.healthSubtitle}>Plans et facturation</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C4C4B4" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(250)} style={styles.section}>
          <Text style={styles.sectionTitle}>Santé & Sommeil</Text>
          
          <TouchableOpacity style={styles.healthCard}>
            <Ionicons name="fitness-outline" size={24} color="#8B9A7D" />
            <View style={styles.healthText}>
              <Text style={styles.healthTitle}>Apple Santé</Text>
              <Text style={styles.healthSubtitle}>Connecter pour le sommeil</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C4C4B4" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(300)}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.brandingFooter}>Latence by Atelier Benamer</Text>
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
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  editButtonText: {
    fontSize: 14,
    color: '#8B9A7D',
    fontWeight: '500',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarText: {
    fontSize: 32,
    color: '#4A4A4A',
    fontWeight: '300',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A4A4A',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    color: '#8B8B7D',
    marginBottom: 8,
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
  inputDisabled: {
    backgroundColor: '#F8F5F0',
    color: '#6B6B5B',
  },
  healthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  healthText: {
    flex: 1,
    marginLeft: 16,
  },
  healthTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#4A4A4A',
  },
  healthSubtitle: {
    fontSize: 12,
    color: '#A0A090',
    marginTop: 2,
  },
  logoutButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 14,
    color: '#C4A88B',
  },
  brandingFooter: {
    textAlign: 'center',
    fontSize: 11,
    color: '#C4C4B4',
    marginTop: 32,
    letterSpacing: 1,
  },
});
