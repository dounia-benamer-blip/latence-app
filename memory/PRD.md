# Latence - Application de Journal Intime Poétique

## Aperçu
Application mobile de journal intime avec astrologie, IA et bien-être émotionnel.
Frontend: React Native (Expo) | Backend: FastAPI + MongoDB | AI: GPT-4o via Emergent LLM

## Fonctionnalités implémentées

### Phase 1 - Base
- Thème 3 états : clair, sombre, silence (AMOLED)
- Onboarding : auth → humeur 2x2 → énergie → sagesse → home
- Compagnon poétique AI, notification quotidienne lunaire

### Phase 2 - Astrologie AI
- Profil astral complet avec sélecteurs intuitifs
- Base de données 80+ villes mondiales
- Calculs précis : signe zodiacal (⭐), ascendant, phase lunaire, arbre celtique, demeure arabe
- Portrait astral AI par GPT-4o - texte poétique personnalisé

### Phase 3 - AI partout
- [x] Écrire : auto-interprétation AI après sauvegarde (texte visible)
- [x] Carnet des rêves : type, 10 émotions, interprétation Freud/Jung GPT-4o

### Phase 4 - IA Miroir + Littérature (16/02/2026)
- [x] **IA MIROIR** - 3 modes de psychanalyse poétique :
  - **Reflet** : Reflète tes pensées/émotions avec douceur
  - **Analyse** : Analyse ce que ton écriture révèle de toi
  - **Question** : Pose LA question profonde qui peut tout éclairer
- [x] **Bibliothèque de penseurs** - 100+ citations de tous horizons

### Phase 5 - AURA AVATAR (16/02/2026) ✨ NOUVEAU
- [x] **Avatar Aura Dynamique** qui change selon l'humeur :
  - **12 types d'auras** avec couleurs et significations uniques
  - Animation pulsante organique (3 couches qui respirent)
  - Rotation lente pour un effet vivant
  - Affichage de l'initiale de l'utilisateur au centre

- [x] **Base de données des Auras** :
  | Humeur | Aura | Couleurs | Élément |
  |--------|------|----------|---------|
  | Serein | Sérénité | Bleu-vert | Eau calme |
  | Joyeux | Joie | Or lumineux | Lumière solaire |
  | Rêveur | Onirique | Violet/lavande | Brume éthérée |
  | Mélancolique | Profondeur | Bleu-gris | Brume marine |
  | Fatigué | Repos | Terre/sable | Terre apaisée |
  | Inspiré | Inspiration | Rose/corail | Flamme créatrice |
  | Anxieux | Mouvement | Bleu électrique | Vent d'orage |
  | Nostalgique | Mémoire | Sépia/ambre | Sable du temps |
  | Perdu | Quête | Gris argenté | Brouillard sacré |
  | Reconnaissant | Gratitude | Vert printemps | Forêt vivante |
  | Contemplatif | Sagesse | Bleu profond | Ciel nocturne |
  | Éveillé | Éveil | Blanc pur | Lumière pure |

- [x] **Affichage de la signification** sur la page profil
- [x] **Avatar miniature** dans le header de l'accueil

## Modèle AI
- GPT-4o (rapide et de qualité)
- Temps de réponse: ~5-20 secondes

## Architecture
```
/app/frontend/app/
├── components/
│   └── AuraAvatar.tsx    # Composant Aura animé + Database
├── index.tsx             # Onboarding/Mood
├── home.tsx              # Dashboard avec Aura Avatar
├── profile.tsx           # Profil avec Aura + signification
├── mirror/               # IA MIROIR
├── astrology/            # Module astrologie
├── capsule/              # Journal et scellement
└── dreams/               # Carnet des rêves
```

## URL de l'app
**https://aura-astro.preview.emergentagent.com**
