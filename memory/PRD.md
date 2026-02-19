# Latence - Application Mobile de Journaling

## Description
Application mobile de journaling immersive avec focus sur l'astrologie, le bien-être émotionnel et l'intégration IA. L'app est conçue pour être "cosy" et magique.

## Stack Technique
- **Frontend**: React Native (Expo), TypeScript, React Context API, react-native-reanimated
- **Backend**: FastAPI, MongoDB (motor async driver), Python
- **IA**: OpenAI GPT-4o via Emergent LLM Key
- **Paiements**: Stripe
- **Auth**: Email/Password + Google Sign-In + Apple Sign-In
- **i18n**: i18next, react-i18next (FR, EN, ES)

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

### Admin Dashboard ✅
- [x] Statistiques utilisateurs
- [x] Génération de codes Lifetime
- [x] Visualisation des codes

### Internationalization (i18n) ✅ (Février 2026)
- [x] Framework i18next installé
- [x] Sélecteur de langue sur l'accueil (FR, EN, ES)
- [x] Fichiers JSON de traduction complets
- [x] UI traduite pour tous les modules
- [x] IA Mirror répond dans la langue choisie
- [x] Endpoint /api/sacred-quote multilingue
- [x] Phases lunaires traduites
- [x] Menus et modals traduits

### Modules Principaux
- [x] **Cadence**: Rituels quotidiens avec traduction i18n
- [x] **Sagesse**: Citations sacrées multilingues
- [x] **Lettre à Moi**: Message futur avec dates localisées
- [x] **Méditation**: Respiration guidée
- [x] **Rituels Lunaires**: Générés par IA
- [x] **IA Miroir**: Chat IA multilingue
- [x] **Carnet des Rêves**: Enregistrement des rêves
- [x] **Oracle des Rêves**: Analyse IA des rêves
- [x] **Cosmos**: Astrologie (Zodiaque, Lune, Celtique, Arabe)

### Push Notifications (Base) ✅
- [x] Structure expo-notifications
- [x] Endpoints backend pour tokens

## Fichiers Clés

### Frontend
- `/app/frontend/src/i18n/locales/fr.json` - Traductions FR
- `/app/frontend/src/i18n/locales/en.json` - Traductions EN
- `/app/frontend/src/i18n/locales/es.json` - Traductions ES
- `/app/frontend/src/context/LanguageContext.tsx` - Context langue
- `/app/frontend/src/components/LanguageSelector.tsx` - Sélecteur
- `/app/frontend/app/home.tsx` - Page d'accueil
- `/app/frontend/app/cadence.tsx` - Module Cadence
- `/app/frontend/app/citations.tsx` - Module Sagesse
- `/app/frontend/app/mirror/index.tsx` - IA Miroir

### Backend
- `/app/backend/server.py` - API principale avec endpoints multilingues

## APIs Multilingues

| Endpoint | Paramètre langue |
|----------|------------------|
| `/api/sacred-quote` | `?lang=fr\|en\|es` |
| `/api/mirror/reflect` | `language` dans body |
| `/api/mirror/analyze-writing` | `language` dans body |
| `/api/mirror/deep-question` | `language` dans body |

## Prochaines Étapes

### P0 - Priorité Haute
- [ ] Configuration pour App Store Connect
- [ ] Notification quotidienne traduite (backend)

### P1 - Priorité Moyenne
- [ ] Améliorer module Cadence (6 fonctionnalités)
- [ ] Corriger casse labels abonnement

### P2 - Backlog
- [ ] Maisons astrologiques
- [ ] Rapport de l'Âme (Soul Report)
- [ ] Dictionnaire Onirique
- [ ] Refactor backend en modules

## Credentials Test

- **Admin**: admin@latence.app / adminpassword
- **Preview URL**: https://dream-journal-ai-3.preview.emergentagent.com

## Notes Techniques
- MongoDB via MONGO_URL en env
- Stripe en mode test
- Emergent LLM Key pour toutes les intégrations IA
