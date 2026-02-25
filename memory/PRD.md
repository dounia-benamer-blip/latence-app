# Latence - Application Mobile de Journaling

## Description
Application mobile de journaling immersive avec focus sur l'astrologie, le bien-être émotionnel et l'intégration IA. L'app est conçue pour être "cosy" et magique.

## Stack Technique
- **Frontend**: React Native (Expo), TypeScript, React Context API, react-native-reanimated
- **Backend**: FastAPI, MongoDB (motor async driver), Python
- **IA**: OpenAI GPT-4o via Emergent LLM Key
- **Paiements**: Stripe
- **Auth**: Email/Password + Google Sign-In + Apple Sign-In
- **Langue**: Français uniquement (i18n supprimé)

## Système d'Abonnement

### Free Trial
- 2 jours d'essai gratuit avec accès complet
- Après: accès restreint

### Essentiel (€9.99/mois)
- Journal illimité (Écrire)
- Carnet des rêves
- Sceller (capsules)
- Cadence
- Sagesse
- Lettre à Moi

### Premium (€18.99/mois)
- Toutes les fonctionnalités Essentiel +
- IA Miroir
- Astrologie (Cosmos)
- Oracle des Rêves
- Méditation
- Rituels Lunaires
- Rapport de l'Âme
- Dictionnaire Onirique

### Lifetime (Code)
- Accès via codes uniques générés depuis l'admin
- Badge "Fondateur"
- Accès Premium à vie

## Fonctionnalités Implémentées

### Authentication ✅
- [x] Email/Password login/register
- [x] Google Sign-In (Expo)
- [x] Apple Sign-In (Expo)
- [x] Session JWT

### Abonnements ✅
- [x] 3 tiers d'abonnement
- [x] Intégration Stripe
- [x] Codes Lifetime avec génération QR
- [x] Badges verrouillés pour features premium
- [x] Modal d'upgrade Premium
- [x] Champ code "Accès à Vie" visible et fonctionnel

### Admin Dashboard ✅
- [x] Statistiques utilisateurs
- [x] Génération de codes Lifetime
- [x] Visualisation des codes

### Modules Principaux ✅
- [x] **Cadence**: Rituels quotidiens améliorés (21 rituels variés : 7 matin, 7 après-midi, 7 soir)
  - Matin: Réveil en conscience, Intention du jour, Cohérence cardiaque, Éveil énergétique, Affirmation miroir, Gratitude préventive, Vibration du matin
  - Après-midi: Micro-pause sacrée, Ancrage sensoriel, Souffle de libération, Étirements conscients, Question profonde, Écriture automatique, Marche méditative
  - Soir: Rituel de transition, Lâcher prise, Scan corporel, 3 roses et épine, Auto-compassion, Voyage intérieur, Gratitudes du jour, Respiration 4-7-8
- [x] **Sagesse**: Citations sacrées
- [x] **Lettre à Moi**: Message futur
- [x] **Méditation**: Respiration guidée
- [x] **Rituels Lunaires**: Générés par IA
- [x] **IA Miroir**: Chat IA (Réflexion, Analyse, Question)
- [x] **Carnet des Rêves**: Enregistrement des rêves
- [x] **Oracle des Rêves**: Analyse IA des rêves
- [x] **Cosmos**: Astrologie (Zodiaque, Lune, Celtique, Arabe)

### Nouvelles Fonctionnalités ✅
- [x] **Rapport de l'Âme (Soul Report)**: Résumé hebdomadaire IA du parcours émotionnel
- [x] **Dictionnaire Onirique (Dream Dictionary)**: Dictionnaire personnel de symboles de rêves

### Préparation App Store ✅
- [x] app.json configuré avec bundleIdentifier, permissions, localisations
- [x] eas.json créé pour EAS Build
- [x] Guide complet APP_STORE_GUIDE.md

## APIs 

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/soul-report/latest` | GET | Dernier rapport |
| `/api/soul-reports` | GET | Liste des rapports |
| `/api/soul-report/generate` | POST | Génère un rapport |
| `/api/dream-dictionary` | GET/POST | Liste/Ajoute symboles |
| `/api/dream-dictionary/{id}` | DELETE | Supprime symbole |
| `/api/sacred-quote` | GET | Citation sacrée |
| `/api/mirror/reflect` | POST | IA Mirror |
| `/api/cadence/streak` | GET | Streak de l'utilisateur |
| `/api/cadence/complete` | POST | Marquer rituel complété |

## Historique des mises à jour

### 25 Février 2026 - Session Actuelle
- ✅ **Remplacement complet des emojis par icônes Ionicons**
  - Sélecteur d'humeur (12 émotions avec icônes ligne)
  - Menu principal home.tsx
  - Page Ambiance (sons avec icônes rainy, flame, leaf, water, cloudy, moon)
  - Page Progression (streak, mood distribution)
  - Page Gratitude (heart-outline)
  - Page Rituels (phases de lune)
  - Page Prompts (catégories)
  - Page Soul Report, Dreams, Dream Dictionary, Dream Oracle, Cadence, Sleep
- ✅ **Sons d'ambiance corrigés** - URLs SoundBible fonctionnelles (pluie, feu, forêt, vagues, vent, nuit)
- ✅ **Fichiers inutilisés supprimés** - tarot.tsx, compatibility.tsx
- ✅ **Configuration iOS mise à jour** - Permission microphone ajoutée (NSMicrophoneUsageDescription)
- ✅ **Styles emoji nettoyés** - Suppression des styles inutilisés (iconEmoji, streakEmoji, etc.)

### 19 Février 2026 - Session 3
- ✅ **Suppression complète de l'i18n** - Application en français uniquement
  - Suppression des dépendances i18next, react-i18next de package.json
  - Réécriture de dream-dictionary.tsx, soul-report.tsx, mirror/index.tsx sans i18n
  - Tous les textes hardcodés en français
- ✅ **Module Cadence amélioré** - 21 rituels intelligents et variés
  - Nouveaux types de rituels : ancrage, sonore, énergie, libération, affirmation, sensoriel
  - Techniques basées sur des pratiques de bien-être reconnues (cohérence cardiaque, respiration 4-7-8, ancrage 5-4-3-2-1)
- ✅ Tests frontend passés à 100%

### 19 Février 2026 - Session 2
- ✅ Configuration app.json pour App Store
- ✅ Création eas.json pour EAS Build
- ✅ Guide complet de soumission App Store (APP_STORE_GUIDE.md)

### 19 Février 2026 - Session 1
- ✅ Implémentation complète du Rapport de l'Âme (Soul Report)
- ✅ Implémentation complète du Dictionnaire Onirique (Dream Dictionary)
- ✅ Tests passés: Backend 100% (13/13), Frontend 100%

## Prochaines Étapes

### P0 - Immédiat
- [ ] **Soumission iOS** - L'utilisateur va acheter le compte Apple Developer (99€)
  - Suivre le guide APP_STORE_GUIDE.md
  - Configurer EAS projectId
  - Exécuter `eas build --platform ios`

### P1 - À Faire
- [ ] Refactorer le backend (découpage de auth.py en routes/)
- [ ] Maisons astrologiques détaillées

### P2 - Backlog
- [ ] Optimisation des performances
- [ ] Tests unitaires backend
- [ ] Migration expo-av vers expo-audio (SDK 54)

## Credentials Test
- **Admin**: admin@latence.app / adminpassword
- **Preview URL**: https://serene-mirror.preview.emergentagent.com

## Notes Techniques
- MongoDB via MONGO_URL en env
- Stripe en mode test
- Emergent LLM Key pour toutes les intégrations IA
- Application en français uniquement (i18n supprimé)
