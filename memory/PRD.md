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

### Internationalization (i18n) ✅ 
- [x] Framework i18next installé
- [x] Sélecteur de langue sur l'accueil (FR, EN, ES)
- [x] Fichiers JSON de traduction complets
- [x] UI traduite pour tous les modules
- [x] IA Mirror répond dans la langue choisie
- [x] Endpoint /api/sacred-quote multilingue
- [x] Phases lunaires traduites
- [x] Menus et modals traduits

### Modules Principaux
- [x] **Cadence**: Rituels quotidiens avec traduction i18n + activités physiques
- [x] **Sagesse**: Citations sacrées multilingues
- [x] **Lettre à Moi**: Message futur avec dates localisées
- [x] **Méditation**: Respiration guidée
- [x] **Rituels Lunaires**: Générés par IA
- [x] **IA Miroir**: Chat IA multilingue
- [x] **Carnet des Rêves**: Enregistrement des rêves
- [x] **Oracle des Rêves**: Analyse IA des rêves
- [x] **Cosmos**: Astrologie (Zodiaque, Lune, Celtique, Arabe)

### Nouvelles Fonctionnalités (Février 2026) ✅
- [x] **Rapport de l'Âme (Soul Report)**: Résumé hebdomadaire IA du parcours émotionnel
- [x] **Dictionnaire Onirique (Dream Dictionary)**: Dictionnaire personnel de symboles de rêves

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
- `/app/frontend/app/soul-report.tsx` - Rapport de l'Âme
- `/app/frontend/app/dream-dictionary.tsx` - Dictionnaire Onirique
- `/app/frontend/app/subscription.tsx` - Page Abonnement

### Backend
- `/app/backend/server.py` - API principale avec endpoints multilingues

## APIs Multilingues

| Endpoint | Paramètre langue |
|----------|------------------|
| `/api/sacred-quote` | `?lang=fr\|en\|es` |
| `/api/mirror/reflect` | `language` dans body |
| `/api/mirror/analyze-writing` | `language` dans body |
| `/api/mirror/deep-question` | `language` dans body |
| `/api/soul-report/generate` | `?lang=fr\|en\|es` |
| `/api/dream-dictionary` | `language` dans body (POST) |

## APIs Nouvelles

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/soul-report/latest` | GET | Retourne le dernier rapport |
| `/api/soul-reports` | GET | Liste tous les rapports |
| `/api/soul-report/generate` | POST | Génère un nouveau rapport |
| `/api/dream-dictionary` | GET | Liste les symboles |
| `/api/dream-dictionary` | POST | Ajoute un symbole |
| `/api/dream-dictionary/{id}` | DELETE | Supprime un symbole |

## Prochaines Étapes

### P0 - Priorité Haute
- [ ] Configuration pour App Store Connect (eas.json)
- [ ] Instructions de build production iOS

### P1 - Priorité Moyenne
- [ ] Améliorer module Cadence (streaks, rituels astraux)
- [ ] Notification quotidienne traduite (backend)

### P2 - Backlog
- [ ] Maisons astrologiques détaillées
- [ ] Refactor backend en modules (routes/)
- [ ] Nettoyage fichiers inutilisés (tarot.tsx, compatibility.tsx)

## Credentials Test

- **Admin**: admin@latence.app / adminpassword
- **Preview URL**: https://dream-journal-ai-3.preview.emergentagent.com

## Notes Techniques
- MongoDB via MONGO_URL en env
- Stripe en mode test
- Emergent LLM Key pour toutes les intégrations IA

## Historique des mises à jour

### 19 Février 2026
- ✅ Implémentation complète du Rapport de l'Âme (Soul Report)
- ✅ Implémentation complète du Dictionnaire Onirique (Dream Dictionary)
- ✅ Correction visibilité champ "Accès à Vie" sur page abonnement
- ✅ Tests passés: Backend 100% (13/13), Frontend 100%
