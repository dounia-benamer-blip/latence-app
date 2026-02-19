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
- [x] Menus et modals traduits
- [x] Jours et mois traduits (nécessite refresh page)

### Modules Principaux ✅
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

### Préparation App Store ✅
- [x] app.json configuré avec bundleIdentifier, permissions, localisations
- [x] eas.json créé pour EAS Build
- [x] Guide complet APP_STORE_GUIDE.md avec instructions étape par étape
- [x] Métadonnées App Store préparées en FR, EN, ES

## Fichiers de Configuration App Store

### `/frontend/app.json`
- Bundle ID: `com.atelierbenamer.latence`
- Localisations: FR, EN, ES
- Permissions iOS configurées
- Plugins Expo configurés

### `/frontend/eas.json`
- Profils: development, preview, production
- Configuration submit pour App Store

### `/frontend/APP_STORE_GUIDE.md`
- Guide complet de soumission
- Commandes EAS à exécuter
- Métadonnées à remplir dans App Store Connect
- Configuration des In-App Purchases

## APIs 

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/soul-report/latest` | GET | Dernier rapport |
| `/api/soul-reports` | GET | Liste des rapports |
| `/api/soul-report/generate` | POST | Génère un rapport |
| `/api/dream-dictionary` | GET/POST | Liste/Ajoute symboles |
| `/api/dream-dictionary/{id}` | DELETE | Supprime symbole |
| `/api/sacred-quote?lang=` | GET | Citation multilingue |
| `/api/mirror/reflect` | POST | IA Mirror |

## Prochaines Étapes

### P0 - Fait ✅
- [x] Rapport de l'Âme fonctionnel
- [x] Dictionnaire Onirique fonctionnel
- [x] Préparation App Store (app.json, eas.json, guide)

### P1 - À Faire
- [ ] Tester build EAS sur Mac (utilisateur)
- [ ] Créer app dans App Store Connect (utilisateur)
- [ ] Configurer In-App Purchases (utilisateur)
- [ ] Traduire les notifications poétiques du backend

### P2 - Backlog
- [ ] Maisons astrologiques détaillées
- [ ] Refactor backend (découpage server.py)
- [ ] Nettoyage fichiers inutilisés

## Credentials Test
- **Admin**: admin@latence.app / adminpassword
- **Preview URL**: https://cosy-cosmos.preview.emergentagent.com

## Notes Techniques
- MongoDB via MONGO_URL en env
- Stripe en mode test
- Emergent LLM Key pour toutes les intégrations IA

## Issues Connues (Mineures)
- La date en haut de la page d'accueil peut rester en français après changement de langue (nécessite refresh)
- Les notifications poétiques du backend sont en français uniquement

## Historique des mises à jour

### 19 Février 2026 - Session 2
- ✅ Correction traductions jours/mois manquantes
- ✅ Configuration app.json pour App Store
- ✅ Création eas.json pour EAS Build
- ✅ Guide complet de soumission App Store (APP_STORE_GUIDE.md)
- ✅ Métadonnées FR, EN, ES préparées

### 19 Février 2026 - Session 1
- ✅ Implémentation complète du Rapport de l'Âme (Soul Report)
- ✅ Implémentation complète du Dictionnaire Onirique (Dream Dictionary)
- ✅ Correction visibilité champ "Accès à Vie"
- ✅ Tests passés: Backend 100% (13/13), Frontend 100%
