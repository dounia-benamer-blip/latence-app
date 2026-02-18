import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import { CandleFlame } from '../src/components/CandleFlame';
import { TwinklingStars } from '../src/components/TwinklingStars';

// Moon phase rituals
const MOON_RITUALS = {
  'Nouvelle Lune': {
    icon: '🌑',
    theme: 'Intentions & Nouveaux Départs',
    energy: 'Introspection, plantation de graines',
    rituals: [
      {
        title: 'Rituel des Intentions',
        duration: '15 min',
        description: 'Écris 3 intentions pour ce nouveau cycle lunaire. Que veux-tu manifester dans ta vie ?',
        steps: [
          'Allume une bougie blanche',
          'Prends 3 respirations profondes',
          'Écris tes 3 intentions sur papier',
          'Lis-les à voix haute',
          'Place le papier sous ta bougie jusqu\'à ce qu\'elle se consume',
        ],
      },
      {
        title: 'Méditation de la Graine',
        duration: '10 min',
        description: 'Visualise tes rêves comme des graines plantées dans un sol fertile.',
        steps: [
          'Assieds-toi confortablement dans l\'obscurité',
          'Ferme les yeux et respire lentement',
          'Imagine une graine dans ta main',
          'Cette graine contient ton intention la plus chère',
          'Plante-la mentalement dans un sol riche',
          'Visualise-la germer et grandir',
        ],
      },
    ],
  },
  'Premier Croissant': {
    icon: '🌒',
    theme: 'Action & Courage',
    energy: 'Premiers pas, surmonter les doutes',
    rituals: [
      {
        title: 'Rituel du Premier Pas',
        duration: '10 min',
        description: 'Identifie une action concrète pour avancer vers tes intentions.',
        steps: [
          'Relis tes intentions de la nouvelle lune',
          'Choisis une petite action à faire aujourd\'hui',
          'Écris cette action sur un post-it',
          'Colle-le où tu le verras souvent',
          'Accomplis cette action dans les 24h',
        ],
      },
    ],
  },
  'Premier Quartier': {
    icon: '🌓',
    theme: 'Décisions & Engagement',
    energy: 'Surmonter les obstacles, persévérance',
    rituals: [
      {
        title: 'Rituel de l\'Engagement',
        duration: '15 min',
        description: 'Renforce ta détermination face aux défis qui se présentent.',
        steps: [
          'Identifie un obstacle actuel',
          'Écris 3 façons de le surmonter',
          'Choisis celle qui résonne le plus',
          'Prends un engagement écrit envers toi-même',
          'Signe et date ton engagement',
        ],
      },
    ],
  },
  'Gibbeuse Croissante': {
    icon: '🌔',
    theme: 'Raffinement & Patience',
    energy: 'Ajustements, perfectionner',
    rituals: [
      {
        title: 'Rituel du Raffinement',
        duration: '20 min',
        description: 'Analyse ce qui fonctionne et ce qui doit être ajusté.',
        steps: [
          'Revois tes progrès depuis la nouvelle lune',
          'Note ce qui avance bien',
          'Identifie ce qui bloque',
          'Ajuste ta stratégie si nécessaire',
          'Célèbre tes petites victoires',
        ],
      },
    ],
  },
  'Pleine Lune': {
    icon: '🌕',
    theme: 'Gratitude & Libération',
    energy: 'Culmination, émotions intenses, lâcher-prise',
    rituals: [
      {
        title: 'Rituel de Gratitude',
        duration: '15 min',
        description: 'Célèbre tes accomplissements et exprime ta gratitude.',
        steps: [
          'Allume une bougie dorée ou orange',
          'Écris 10 choses pour lesquelles tu es reconnaissant(e)',
          'Lis-les à voix haute face à la lune',
          'Ressens la gratitude dans ton cœur',
          'Termine par 3 respirations profondes',
        ],
      },
      {
        title: 'Rituel de Libération',
        duration: '20 min',
        description: 'Libère ce qui ne te sert plus pour faire place au nouveau.',
        steps: [
          'Écris ce que tu veux libérer sur un papier',
          'Peurs, doutes, habitudes, relations...',
          'Lis chaque chose à voix haute en disant "Je te libère"',
          'Brûle le papier en sécurité (ou déchire-le en petits morceaux)',
          'Visualise ces énergies quitter ton corps',
        ],
      },
    ],
  },
  'Gibbeuse Décroissante': {
    icon: '🌖',
    theme: 'Partage & Transmission',
    energy: 'Donner, enseigner, diffuser',
    rituals: [
      {
        title: 'Rituel du Don',
        duration: '15 min',
        description: 'Partage ta sagesse et tes ressources avec les autres.',
        steps: [
          'Réfléchis à ce que tu peux offrir',
          'Temps, conseils, objets, attention...',
          'Choisis une personne à qui donner',
          'Accomplis cet acte de générosité',
          'Note comment cela te fait sentir',
        ],
      },
    ],
  },
  'Dernier Quartier': {
    icon: '🌗',
    theme: 'Introspection & Bilan',
    energy: 'Réflexion, faire le point',
    rituals: [
      {
        title: 'Rituel du Bilan',
        duration: '20 min',
        description: 'Fais le bilan de ce cycle lunaire qui se termine.',
        steps: [
          'Relis tes intentions de la nouvelle lune',
          'Qu\'as-tu accompli ? Qu\'as-tu appris ?',
          'Quels obstacles as-tu rencontrés ?',
          'Comment as-tu grandi ?',
          'Qu\'est-ce que tu feras différemment ?',
        ],
      },
    ],
  },
  'Dernier Croissant': {
    icon: '🌘',
    theme: 'Repos & Préparation',
    energy: 'Lâcher-prise, se ressourcer',
    rituals: [
      {
        title: 'Rituel du Repos',
        duration: '30 min',
        description: 'Accorde-toi un moment de repos total avant le nouveau cycle.',
        steps: [
          'Prends un bain ou une douche en conscience',
          'Imagine l\'eau emporter les énergies du cycle passé',
          'Reste dans le silence quelques minutes',
          'Ne planifie rien, sois juste présent(e)',
          'Prépare-toi mentalement pour le nouveau cycle',
        ],
      },
    ],
  },
};

// Get current moon phase
const getMoonPhase = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // Simplified moon phase calculation
  const c = Math.floor(365.25 * year);
  const e = Math.floor(30.6 * month);
  const jd = c + e + day - 694039.09;
  const phase = jd / 29.53;
  const phaseDay = Math.floor((phase - Math.floor(phase)) * 29.53);
  
  if (phaseDay < 1.85) return 'Nouvelle Lune';
  if (phaseDay < 5.53) return 'Premier Croissant';
  if (phaseDay < 9.22) return 'Premier Quartier';
  if (phaseDay < 12.91) return 'Gibbeuse Croissante';
  if (phaseDay < 16.61) return 'Pleine Lune';
  if (phaseDay < 20.30) return 'Gibbeuse Décroissante';
  if (phaseDay < 23.99) return 'Dernier Quartier';
  if (phaseDay < 27.68) return 'Dernier Croissant';
  return 'Nouvelle Lune';
};

export default function RitualsScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [currentPhase, setCurrentPhase] = useState(getMoonPhase());
  const [selectedRitual, setSelectedRitual] = useState<number | null>(null);
  const [journalEntry, setJournalEntry] = useState('');
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const ds = {
    container: { backgroundColor: theme.background },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    textMuted: { color: theme.textMuted },
    card: { backgroundColor: theme.card },
  };

  const phaseData = MOON_RITUALS[currentPhase as keyof typeof MOON_RITUALS];

  const toggleStep = (stepIndex: number) => {
    if (completedSteps.includes(stepIndex)) {
      setCompletedSteps(completedSteps.filter(i => i !== stepIndex));
    } else {
      setCompletedSteps([...completedSteps, stepIndex]);
    }
  };

  const selectRitual = (index: number) => {
    setSelectedRitual(selectedRitual === index ? null : index);
    setCompletedSteps([]);
  };

  return (
    <SafeAreaView style={[styles.container, ds.container]}>
      <TwinklingStars starCount={30} minSize={1} maxSize={2} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-down" size={28} color={theme.iconColor} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <CandleFlame size="small" intensity="gentle" />
          <Text style={[styles.headerTitle, ds.text]}>Rituels</Text>
          <CandleFlame size="small" intensity="gentle" />
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Current Moon Phase */}
        <Animated.View entering={FadeIn.duration(500)} style={[styles.phaseCard, ds.card]}>
          <Text style={styles.phaseIcon}>{phaseData.icon}</Text>
          <Text style={[styles.phaseName, ds.text]}>{currentPhase}</Text>
          <Text style={[styles.phaseTheme, { color: theme.accentWarm }]}>{phaseData.theme}</Text>
          <Text style={[styles.phaseEnergy, ds.textMuted]}>{phaseData.energy}</Text>
        </Animated.View>

        {/* Rituals List */}
        <Text style={[styles.sectionTitle, ds.text]}>Rituels suggérés</Text>
        
        {phaseData.rituals.map((ritual, index) => (
          <Animated.View
            key={index}
            entering={FadeInUp.duration(400).delay(index * 100)}
          >
            <TouchableOpacity
              style={[
                styles.ritualCard, 
                ds.card,
                selectedRitual === index && { borderColor: theme.accentWarm, borderWidth: 2 }
              ]}
              onPress={() => selectRitual(index)}
            >
              <View style={styles.ritualHeader}>
                <View>
                  <Text style={[styles.ritualTitle, ds.text]}>{ritual.title}</Text>
                  <Text style={[styles.ritualDuration, ds.textMuted]}>
                    <Ionicons name="time-outline" size={12} /> {ritual.duration}
                  </Text>
                </View>
                <Ionicons 
                  name={selectedRitual === index ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={theme.iconColor} 
                />
              </View>
              <Text style={[styles.ritualDescription, ds.textSecondary]}>
                {ritual.description}
              </Text>

              {/* Expanded Content */}
              {selectedRitual === index && (
                <Animated.View entering={FadeIn} style={styles.ritualContent}>
                  <Text style={[styles.stepsTitle, ds.text]}>Étapes du rituel</Text>
                  {ritual.steps.map((step, stepIndex) => (
                    <TouchableOpacity
                      key={stepIndex}
                      style={styles.stepRow}
                      onPress={() => toggleStep(stepIndex)}
                    >
                      <View style={[
                        styles.stepCheckbox,
                        { borderColor: theme.accentWarm },
                        completedSteps.includes(stepIndex) && { backgroundColor: theme.accentWarm }
                      ]}>
                        {completedSteps.includes(stepIndex) && (
                          <Ionicons name="checkmark" size={14} color="#fff" />
                        )}
                      </View>
                      <Text style={[
                        styles.stepText,
                        ds.text,
                        completedSteps.includes(stepIndex) && styles.stepCompleted
                      ]}>
                        {step}
                      </Text>
                    </TouchableOpacity>
                  ))}

                  {/* Progress */}
                  {completedSteps.length > 0 && (
                    <View style={styles.progressContainer}>
                      <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                        <View 
                          style={[
                            styles.progressFill, 
                            { 
                              backgroundColor: theme.accentWarm,
                              width: `${(completedSteps.length / ritual.steps.length) * 100}%` 
                            }
                          ]} 
                        />
                      </View>
                      <Text style={[styles.progressText, ds.textMuted]}>
                        {completedSteps.length}/{ritual.steps.length} étapes
                      </Text>
                    </View>
                  )}

                  {/* Journal Entry */}
                  <Text style={[styles.journalTitle, ds.text]}>Notes du rituel</Text>
                  <TextInput
                    style={[styles.journalInput, ds.text, { borderColor: theme.border, backgroundColor: theme.inputBackground }]}
                    placeholder="Comment te sens-tu après ce rituel ?"
                    placeholderTextColor={theme.textMuted}
                    multiline
                    value={journalEntry}
                    onChangeText={setJournalEntry}
                  />
                </Animated.View>
              )}
            </TouchableOpacity>
          </Animated.View>
        ))}

        {/* Phase Selector */}
        <Text style={[styles.sectionTitle, ds.text, { marginTop: 30 }]}>Explorer d'autres phases</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.phasesScroll}>
          {Object.entries(MOON_RITUALS).map(([phase, data]) => (
            <TouchableOpacity
              key={phase}
              style={[
                styles.phaseChip,
                { backgroundColor: phase === currentPhase ? theme.accentWarm : theme.card }
              ]}
              onPress={() => {
                setCurrentPhase(phase);
                setSelectedRitual(null);
                setCompletedSteps([]);
              }}
            >
              <Text style={styles.phaseChipIcon}>{data.icon}</Text>
              <Text style={[
                styles.phaseChipText,
                { color: phase === currentPhase ? '#fff' : theme.textSecondary }
              ]}>
                {phase.split(' ').slice(-1)[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backButton: { padding: 4 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 18, fontWeight: '600', letterSpacing: 1 },
  placeholder: { width: 36 },
  scrollContent: { padding: 20, paddingBottom: 40 },

  phaseCard: { alignItems: 'center', padding: 24, borderRadius: 20, marginBottom: 24 },
  phaseIcon: { fontSize: 50, marginBottom: 12 },
  phaseName: { fontSize: 22, fontWeight: '600', marginBottom: 6 },
  phaseTheme: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  phaseEnergy: { fontSize: 13, textAlign: 'center', fontStyle: 'italic' },

  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },

  ritualCard: { padding: 16, borderRadius: 16, marginBottom: 12 },
  ritualHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  ritualTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  ritualDuration: { fontSize: 12 },
  ritualDescription: { fontSize: 14, lineHeight: 20 },

  ritualContent: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)' },
  stepsTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  stepCheckbox: { 
    width: 22, 
    height: 22, 
    borderRadius: 11, 
    borderWidth: 2, 
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { flex: 1, fontSize: 14, lineHeight: 20 },
  stepCompleted: { textDecorationLine: 'line-through', opacity: 0.6 },

  progressContainer: { marginTop: 16, marginBottom: 20 },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 12, marginTop: 6, textAlign: 'right' },

  journalTitle: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  journalInput: { 
    borderWidth: 1, 
    borderRadius: 12, 
    padding: 14, 
    fontSize: 14, 
    minHeight: 80,
    textAlignVertical: 'top',
  },

  phasesScroll: { marginTop: 8 },
  phaseChip: { 
    alignItems: 'center', 
    paddingVertical: 10, 
    paddingHorizontal: 14, 
    borderRadius: 16, 
    marginRight: 10,
  },
  phaseChipIcon: { fontSize: 20, marginBottom: 4 },
  phaseChipText: { fontSize: 11, fontWeight: '500' },
});
