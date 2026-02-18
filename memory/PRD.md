# Latence - PRD (Product Requirements Document)

## Application Overview
Journal intime immersif centré sur la lune, l'astrologie et le bien-être émotionnel avec intégration IA.

## Core Features Implemented

### 1. Page d'accueil (home.tsx)
- ✅ Phase lunaire actuelle avec message poétique
- ✅ Avatar Aura animé
- ✅ Compteurs (capsules, rêves)
- ✅ Menu de navigation complet

### 2. Rituels Lunaires (rituals.tsx) - NOUVEAU
- ✅ Lune animée avec effet de halo
- ✅ Affichage de la phase actuelle avec infos (élément, jour du cycle)
- ✅ Sélecteur de 8 phases lunaires
- ✅ Champ d'intention personnalisé
- ✅ Génération IA de rituels complets
- ✅ Checklist interactive des étapes
- ✅ Affirmation finale

### 3. Oracle des Rêves (dream-oracle.tsx) - NOUVEAU
- ✅ Intégré dans la section Rêves
- ✅ Œil animé mystique avec effets
- ✅ Analyse des patterns de rêves
- ✅ Symboles révélés avec icônes et significations
- ✅ Message profond de l'inconscient (IA)
- ✅ Conseils de guidance spirituelle

### 4. Carnet des Rêves (dreams/index.tsx) - AMÉLIORÉ
- ✅ Liste des rêves avec types (Lucide, Cauchemar, Récurrent, Rêve)
- ✅ Bouton Oracle des Rêves intégré
- ✅ **NOUVEAU**: Boutons modifier et supprimer sur chaque rêve
- ✅ Modal de confirmation de suppression
- ✅ Création et interprétation IA de rêves
- ✅ Sélecteur d'émotions

### 5. Page Sceller (capsule/seal.tsx) - REDESIGN COMPLET
- ✅ Bougie animée avec flamme et halo
- ✅ Prompts inspirants
- ✅ **Système de clés colorées:**
  - 🟢 Clé Émeraude (7 jours)
  - 🔵 Clé Saphir (15 jours)
  - 🟣 Clé Améthyste (1 mois)
  - 🟡 Clé Ambre (3 mois)
  - 🔴 Clé Rubis (6 mois)
  - 🥇 Clé Or (1 an)
- ✅ Animation de scellement:
  - Boîte en bois avec "LATENCE" gravé
  - Papyrus qui flotte et entre dans la boîte
  - Couvercle qui s'ouvre et se ferme
  - Effet de lueur dorée
  - Clé colorée qui apparaît avec rotation
- ✅ Écran de confirmation avec nom de la clé

### 6. Cosmos/Astrologie (astrology/index.tsx)
- ✅ Calcul du signe zodiacal, ascendant, signe lunaire
- ✅ Traditions celtique et arabe
- ✅ Interprétations IA personnalisées
- ✅ Bougies et étoiles animées

### 7. Miroir IA (mirror/)
- ✅ Conversation psychanalytique
- ✅ Style littéraire et poétique

### 8. Méditation (meditation.tsx)
- ✅ Exercices de respiration guidée
- ✅ Animations de souffle

### 9. Statistiques (stats.tsx)
- ✅ UI prête (backend à compléter)

## API Endpoints Backend

### Rêves
- POST /api/dream - Créer un rêve
- GET /api/dreams - Liste des rêves
- GET /api/dream/{id} - Détail d'un rêve
- PUT /api/dream/{id} - Modifier un rêve ✅ NOUVEAU
- DELETE /api/dream/{id} - Supprimer un rêve ✅ NOUVEAU
- POST /api/dream/interpret - Interpréter un rêve
- POST /api/dream-oracle/analyze - Analyser patterns

### Rituels Lunaires
- GET /api/lunar-phase/current - Phase actuelle
- POST /api/lunar-rituals/generate - Générer un rituel

### Capsules
- POST /api/capsule - Créer une capsule
- GET /api/capsules - Liste des capsules

### Astrologie
- POST /api/astrology/profile - Créer profil
- GET /api/astrology/profile/latest - Dernier profil

## Removed Features
- ❌ Tarot (retiré à la demande de l'utilisateur)
- ❌ Compatibilité amoureuse (retirée)

## Tech Stack
- **Frontend**: React Native (Expo), TypeScript, React Native Reanimated
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **AI**: OpenAI GPT-4o via emergentintegrations

## Design
- Thème chaleureux beige/crème
- Animations douces (bougies, étoiles, lune)
- Focus sur l'expérience lunaire et mystique

## Future Tasks (Backlog)
- [ ] Maisons astrologiques dans Cosmos
- [ ] Capsules vocales
- [ ] IA Psychologue avancée
- [ ] Visuels carte des étoiles
- [ ] Collection de clés dans le profil

---
*Dernière mise à jour: 18 février 2026*
