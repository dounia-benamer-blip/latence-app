import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

// ============================================
// AURA COLORS DATABASE - Based on Mood/Energy
// ============================================

export const AURA_DATABASE = {
  serein: {
    name: 'Aura de Sérénité',
    colors: ['#7EC8E3', '#A8E6CF', '#B5EAD7'],
    meaning: 'Ton aura rayonne d\'un bleu-vert apaisant. Elle révèle une âme en paix, connectée à son centre. Cette couleur indique une harmonie intérieure et une capacité à naviguer les tempêtes avec grâce.',
    element: 'Eau calme',
  },
  joyeux: {
    name: 'Aura de Joie',
    colors: ['#FFD93D', '#FFE66D', '#FFF3B0'],
    meaning: 'Ton aura brille d\'un or lumineux. Elle témoigne d\'une âme qui rayonne, qui attire naturellement les autres par sa lumière. Cette énergie solaire nourrit tout ce qu\'elle touche.',
    element: 'Lumière solaire',
  },
  reveur: {
    name: 'Aura Onirique',
    colors: ['#C3B1E1', '#E0BBE4', '#D4A5FF'],
    meaning: 'Ton aura ondule dans des teintes de violet et lavande. Elle révèle un esprit qui voyage entre les mondes, connecté à l\'invisible et aux rêves. Les créatifs et les visionnaires portent souvent cette couleur.',
    element: 'Brume éthérée',
  },
  melancolique: {
    name: 'Aura de Profondeur',
    colors: ['#6B7B8C', '#8BA4B4', '#A5C4D4'],
    meaning: 'Ton aura porte des nuances de bleu-gris, comme un ciel d\'hiver. Elle témoigne d\'une âme qui traverse une période de réflexion profonde. Cette mélancolie est la marque des poètes et des penseurs.',
    element: 'Brume marine',
  },
  fatigue: {
    name: 'Aura en Repos',
    colors: ['#C4B7A6', '#D5C4A1', '#E8DFD0'],
    meaning: 'Ton aura pulse doucement dans des tons de terre et de sable. Elle indique que ton être a besoin de repos et de ressourcement. Comme la terre en jachère, tu prépares ta prochaine floraison.',
    element: 'Terre apaisée',
  },
  inspire: {
    name: 'Aura d\'Inspiration',
    colors: ['#FF9A8B', '#FF6B95', '#FF99AC'],
    meaning: 'Ton aura flamboie dans des roses et coraux vibrants. Elle révèle une âme en feu créatif, traversée par les muses. Cette énergie est celle des artistes au moment de leur création.',
    element: 'Flamme créatrice',
  },
  anxieux: {
    name: 'Aura en Mouvement',
    colors: ['#87A2FB', '#A4B8FC', '#C7D3FD'],
    meaning: 'Ton aura vibre dans des bleus électriques. Elle témoigne d\'une énergie nerveuse qui cherche à se canaliser. Cette agitation cache souvent une grande sensibilité et une intelligence vive.',
    element: 'Vent d\'orage',
  },
  nostalgique: {
    name: 'Aura de Mémoire',
    colors: ['#D4A574', '#E8C39E', '#F5DEB3'],
    meaning: 'Ton aura baigne dans des teintes de sépia et d\'ambre. Elle révèle une âme qui chérit ses souvenirs et honore son passé. Cette couleur est celle des gardiens de mémoire.',
    element: 'Sable du temps',
  },
  perdu: {
    name: 'Aura en Quête',
    colors: ['#9CA3AF', '#D1D5DB', '#E5E7EB'],
    meaning: 'Ton aura scintille dans des gris argentés, comme une brume mystérieuse. Elle indique une âme en recherche, à un carrefour de son existence. C\'est le prélude à une grande transformation.',
    element: 'Brouillard sacré',
  },
  reconnaissant: {
    name: 'Aura de Gratitude',
    colors: ['#90EE90', '#98FB98', '#B2F5B2'],
    meaning: 'Ton aura rayonne d\'un vert printanier. Elle témoigne d\'un cœur ouvert qui reconnaît les bénédictions de la vie. Cette énergie de gratitude attire l\'abondance.',
    element: 'Forêt vivante',
  },
  contemplatif: {
    name: 'Aura de Sagesse',
    colors: ['#4A6FA5', '#6B8BB8', '#8CADD1'],
    meaning: 'Ton aura s\'étend dans des bleus profonds et sereins. Elle révèle une âme contemplative, connectée aux mystères de l\'existence. Les sages et les méditants portent cette couleur.',
    element: 'Ciel nocturne',
  },
  eveille: {
    name: 'Aura d\'Éveil',
    colors: ['#FFFFFF', '#F8F9FA', '#E9ECEF'],
    meaning: 'Ton aura brille d\'une lumière pure et cristalline. Elle témoigne d\'un état de conscience élevé, d\'une connexion avec le divin. Cette clarté est rare et précieuse.',
    element: 'Lumière pure',
  },
};

interface AuraAvatarProps {
  mood?: string;
  size?: number;
  showMeaning?: boolean;
  userName?: string;
}

export default function AuraAvatar({ 
  mood = 'serein', 
  size = 80,
  showMeaning = false,
  userName = '',
}: AuraAvatarProps) {
  // Animation values
  const pulse1 = useSharedValue(1);
  const pulse2 = useSharedValue(1);
  const pulse3 = useSharedValue(1);
  const rotation = useSharedValue(0);
  const opacity1 = useSharedValue(0.6);
  const opacity2 = useSharedValue(0.4);
  const opacity3 = useSharedValue(0.2);

  const aura = AURA_DATABASE[mood as keyof typeof AURA_DATABASE] || AURA_DATABASE.serein;
  const [color1, color2, color3] = aura.colors;
  const initial = userName ? userName.charAt(0).toUpperCase() : '✧';

  useEffect(() => {
    // Pulsing animation for each layer
    pulse1.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 2000, easing: Easing.inOut(Easing.sine) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    );

    pulse2.value = withRepeat(
      withSequence(
        withTiming(1.25, { duration: 2500, easing: Easing.inOut(Easing.sine) }),
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    );

    pulse3.value = withRepeat(
      withSequence(
        withTiming(1.35, { duration: 3000, easing: Easing.inOut(Easing.sine) }),
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      true
    );

    // Slow rotation
    rotation.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );

    // Opacity breathing
    opacity1.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1500 }),
        withTiming(0.5, { duration: 1500 })
      ),
      -1,
      true
    );

    opacity2.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 2000 }),
        withTiming(0.3, { duration: 2000 })
      ),
      -1,
      true
    );

    opacity3.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 2500 }),
        withTiming(0.15, { duration: 2500 })
      ),
      -1,
      true
    );
  }, [mood]);

  // Animated styles for each aura layer
  const layer1Style = useAnimatedStyle(() => ({
    transform: [
      { scale: pulse1.value },
      { rotate: `${rotation.value}deg` }
    ],
    opacity: opacity1.value,
  }));

  const layer2Style = useAnimatedStyle(() => ({
    transform: [
      { scale: pulse2.value },
      { rotate: `${-rotation.value * 0.5}deg` }
    ],
    opacity: opacity2.value,
  }));

  const layer3Style = useAnimatedStyle(() => ({
    transform: [
      { scale: pulse3.value },
      { rotate: `${rotation.value * 0.3}deg` }
    ],
    opacity: opacity3.value,
  }));

  const coreSize = size;
  const layer1Size = size * 1.3;
  const layer2Size = size * 1.6;
  const layer3Size = size * 1.9;

  return (
    <View style={styles.container}>
      <View style={[styles.auraContainer, { width: layer3Size, height: layer3Size }]}>
        {/* Outer aura layer */}
        <Animated.View
          style={[
            styles.auraLayer,
            layer3Style,
            {
              width: layer3Size,
              height: layer3Size,
              borderRadius: layer3Size / 2,
              backgroundColor: color3,
            },
          ]}
        />
        
        {/* Middle aura layer */}
        <Animated.View
          style={[
            styles.auraLayer,
            layer2Style,
            {
              width: layer2Size,
              height: layer2Size,
              borderRadius: layer2Size / 2,
              backgroundColor: color2,
            },
          ]}
        />
        
        {/* Inner aura layer */}
        <Animated.View
          style={[
            styles.auraLayer,
            layer1Style,
            {
              width: layer1Size,
              height: layer1Size,
              borderRadius: layer1Size / 2,
              backgroundColor: color1,
            },
          ]}
        />
        
        {/* Core - the user initial */}
        <View
          style={[
            styles.core,
            {
              width: coreSize,
              height: coreSize,
              borderRadius: coreSize / 2,
              backgroundColor: color1,
            },
          ]}
        >
          <Text style={[styles.initial, { fontSize: coreSize * 0.45 }]}>
            {initial}
          </Text>
        </View>
      </View>

      {/* Aura name and meaning */}
      {showMeaning && (
        <View style={styles.meaningContainer}>
          <Text style={styles.auraName}>{aura.name}</Text>
          <Text style={styles.element}>{aura.element}</Text>
          <Text style={styles.meaning}>{aura.meaning}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  auraContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  auraLayer: {
    position: 'absolute',
  },
  core: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  initial: {
    color: '#fff',
    fontWeight: '300',
    letterSpacing: 1,
  },
  meaningContainer: {
    marginTop: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  auraName: {
    fontSize: 18,
    fontWeight: '300',
    color: '#6B6B5B',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  element: {
    fontSize: 12,
    color: '#9B9B8B',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  meaning: {
    fontSize: 14,
    color: '#7B7B6B',
    textAlign: 'center',
    lineHeight: 22,
  },
});
