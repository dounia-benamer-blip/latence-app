import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useLanguage, Language } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

interface LanguageSelectorProps {
  style?: object;
}

export function LanguageSelector({ style }: LanguageSelectorProps) {
  const { language, setLanguage, languages } = useLanguage();
  const { theme } = useTheme();
  const [showModal, setShowModal] = useState(false);

  const currentLanguage = languages.find(l => l.code === language);

  return (
    <>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.card }, style]}
        onPress={() => setShowModal(true)}
        activeOpacity={0.7}
        data-testid="language-selector-btn"
      >
        <Text style={styles.flag}>{currentLanguage?.flag}</Text>
        <Text style={[styles.code, { color: theme.text }]}>{language.toUpperCase()}</Text>
        <Ionicons name="chevron-down" size={14} color={theme.textMuted} />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity 
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <Animated.View 
            entering={FadeIn.duration(200)}
            style={[styles.modal, { backgroundColor: theme.card }]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {language === 'fr' ? 'Langue' : language === 'en' ? 'Language' : 'Idioma'}
            </Text>
            
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  language === lang.code && { backgroundColor: `${theme.accent}20` }
                ]}
                onPress={() => {
                  setLanguage(lang.code);
                  setShowModal(false);
                }}
                data-testid={`language-${lang.code}`}
              >
                <Text style={styles.optionFlag}>{lang.flag}</Text>
                <Text style={[styles.optionName, { color: theme.text }]}>{lang.name}</Text>
                {language === lang.code && (
                  <Ionicons name="checkmark" size={20} color={theme.accent} />
                )}
              </TouchableOpacity>
            ))}
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  flag: {
    fontSize: 16,
  },
  code: {
    fontSize: 12,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  optionFlag: {
    fontSize: 24,
  },
  optionName: {
    fontSize: 16,
    flex: 1,
  },
});
