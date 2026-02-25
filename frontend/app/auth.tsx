import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp, FadeInDown } from 'react-native-reanimated';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useTheme } from '../src/context/ThemeContext';
import { useAuth } from '../src/context/AuthContext';

export default function AuthScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { login, register, loginWithGoogle, loginWithApple } = useAuth();
  
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [lifetimeCode, setLifetimeCode] = useState('');
  const [showCodeField, setShowCodeField] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);

  // Check Apple authentication availability
  React.useEffect(() => {
    AppleAuthentication.isAvailableAsync().then(setIsAppleAvailable);
  }, []);

  const ds = {
    container: { backgroundColor: theme.background },
    card: { backgroundColor: theme.card },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    textMuted: { color: theme.textMuted },
    input: { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text },
  };

  const handleSubmit = async () => {
    setError('');
    setIsLoading(true);

    try {
      let result;
      if (mode === 'login') {
        result = await login(email, password);
      } else {
        if (!name.trim()) {
          setError('Veuillez entrer votre nom');
          setIsLoading(false);
          return;
        }
        result = await register(email, password, name, lifetimeCode || undefined);
      }

      if (result.success) {
        router.replace('/home');
      } else {
        setError(result.error || 'Une erreur est survenue');
      }
    } catch (err) {
      setError('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      const result = await loginWithGoogle();
      if (result.success) {
        router.replace('/home');
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError('Erreur de connexion Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      const result = await loginWithApple();
      if (result.success) {
        router.replace('/home');
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError('Erreur de connexion Apple');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, ds.container]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={theme.iconColor} />
            </TouchableOpacity>
          </Animated.View>

          {/* Logo */}
          <Animated.View entering={FadeInUp.duration(600)} style={styles.logoContainer}>
            <Text style={[styles.logo, ds.text]}>Latence</Text>
            <Text style={[styles.subtitle, ds.textMuted]}>
              {mode === 'login' ? 'Retrouve ton sanctuaire' : 'Crée ton sanctuaire'}
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInUp.duration(600).delay(200)} style={styles.formContainer}>
            {mode === 'register' && (
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, ds.input]}
                  placeholder="Ton nom"
                  placeholderTextColor={theme.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, ds.input]}
                placeholder="Email"
                placeholderTextColor={theme.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, ds.input]}
                placeholder="Mot de passe"
                placeholderTextColor={theme.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {mode === 'register' && (
              <View>
                <TouchableOpacity
                  style={styles.codeToggle}
                  onPress={() => setShowCodeField(!showCodeField)}
                >
                  <Ionicons name="key-outline" size={18} color={theme.accent} />
                  <Text style={[styles.codeToggleText, { color: theme.accent }]}>
                    {showCodeField ? 'Masquer le code' : 'J\'ai un code Fondateur'}
                  </Text>
                </TouchableOpacity>
                
                {showCodeField && (
                  <Animated.View entering={FadeIn.duration(300)} style={styles.inputWrapper}>
                    <Ionicons name="key-outline" size={20} color="#F39C12" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, ds.input, { borderColor: '#F39C12' }]}
                      placeholder="Code Fondateur (ex: LATENCE-XXXX-XXXX)"
                      placeholderTextColor={theme.textMuted}
                      value={lifetimeCode}
                      onChangeText={setLifetimeCode}
                      autoCapitalize="characters"
                    />
                  </Animated.View>
                )}
              </View>
            )}

            {error ? (
              <Animated.Text entering={FadeIn.duration(300)} style={styles.errorText}>
                {error}
              </Animated.Text>
            ) : null}

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: theme.accent }]}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              <Text style={[styles.dividerText, ds.textMuted]}>ou</Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            </View>

            {/* Social Login */}
            <TouchableOpacity
              style={[styles.socialButton, ds.card]}
              onPress={handleGoogleLogin}
              activeOpacity={0.7}
              disabled={isLoading}
              data-testid="google-login-btn"
            >
              <Ionicons name="logo-google" size={20} color={theme.text} />
              <Text style={[styles.socialButtonText, ds.text]}>Continuer avec Google</Text>
            </TouchableOpacity>

            {/* Apple Sign-In - only show on iOS or if available */}
            {(Platform.OS === 'ios' || isAppleAvailable) && (
              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: '#000' }]}
                onPress={handleAppleLogin}
                activeOpacity={0.7}
                disabled={isLoading}
                data-testid="apple-login-btn"
              >
                <Ionicons name="logo-apple" size={20} color="#fff" />
                <Text style={[styles.socialButtonText, { color: '#fff' }]}>Continuer avec Apple</Text>
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* Toggle Mode */}
          <Animated.View entering={FadeInDown.duration(600).delay(400)} style={styles.toggleContainer}>
            <Text style={[styles.toggleText, ds.textMuted]}>
              {mode === 'login' ? 'Pas encore de compte ?' : 'Déjà un compte ?'}
            </Text>
            <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
              <Text style={[styles.toggleLink, { color: theme.accent }]}>
                {mode === 'login' ? 'Créer un compte' : 'Se connecter'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Guest Mode */}
          <TouchableOpacity
            style={styles.guestButton}
            onPress={() => router.replace('/')}
          >
            <Text style={[styles.guestText, ds.textMuted]}>Continuer en invité</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 42,
    fontWeight: '200',
    letterSpacing: 8,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    letterSpacing: 1,
  },
  formContainer: {
    gap: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  input: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    paddingLeft: 48,
    fontSize: 16,
    borderWidth: 1,
  },
  errorText: {
    color: '#E57373',
    fontSize: 14,
    textAlign: 'center',
  },
  submitButton: {
    borderRadius: 30,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 13,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 16,
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 32,
  },
  toggleText: {
    fontSize: 14,
  },
  toggleLink: {
    fontSize: 14,
    fontWeight: '500',
  },
  guestButton: {
    alignItems: 'center',
    marginTop: 24,
    padding: 12,
  },
  guestText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  codeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  codeToggleText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
