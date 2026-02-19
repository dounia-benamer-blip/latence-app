# Latence - PRD Final

## Vision
Journal intime immersif centré sur la lune, l'introspection et la sagesse universelle.

---

## Modules Principaux

### Cadence - Rythme Intérieur
- Micro-rituels quotidiens personnalisés (pas de sport)
- Adaptés à l'heure du jour et la phase lunaire
- Types : Respiration, Introspection, Gratitude, Silence
- Réflexion du soir

### Sagesse - Citations Universelles  
- Citations de poètes soufis (Rumi, Hafiz)
- Textes sacrés (sans catégorisation)
- Philosophes et sages de toutes traditions
- Sauvegarder et partager

### Lettre à Moi-Même
- Écrire au futur soi
- Choix de la date de livraison (1 mois à 5 ans)
- Notification à la livraison

### Rituels Lunaires
- Rituels IA selon la phase de lune
- Préparation, étapes avec checkboxes
- Affirmation finale

### Oracle des Rêves (Premium)
- Analyse des patterns de rêves
- Symboles révélés avec significations
- Message de l'inconscient

### Carnet des Rêves
- Créer, modifier, supprimer des rêves
- Types : Rêve, Cauchemar, Lucide, Récurrent
- Interprétation IA (Premium)

### Sceller - Capsules Temporelles
- Bougie animée
- Système de clés colorées :
  - Émeraude (7j) | Saphir (15j) | Améthyste (1 mois)
  - Ambre (3 mois) | Rubis (6 mois) | Or (1 an)
- Animation boîte "LATENCE" en bois

### Cosmos - Astrologie (Premium)
- Zodiacal, Ascendant, Lunaire
- Celtique et Arabe
- Interprétations IA

### Méditation
- Exercices de respiration
- Animations de souffle

### Miroir IA (Premium)
- Conversation psychanalytique
- Style littéraire

---

## API Endpoints

### Auth & Subscription
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- GET /api/auth/subscription-status
- POST /api/subscription/create-checkout
- GET /api/subscription/checkout-status/:session_id
- POST /api/subscription/activate-lifetime

### Admin
- POST /api/admin/login
- GET /api/admin/stats
- POST /api/admin/generate-codes
- GET /api/admin/codes
- GET /api/admin/users
- GET /api/admin/transactions

### Cadence
- GET /api/cadence/daily
- GET /api/cadence/streak
- POST /api/cadence/complete

### Citations
- GET /api/sacred-quote

### Lettre
- POST /api/letter
- GET /api/letters
- GET /api/letters/delivered

### Rituels
- GET /api/lunar-phase/current
- POST /api/lunar-rituals/generate

### Rêves
- POST /api/dream
- GET /api/dreams
- PUT /api/dream/:id
- DELETE /api/dream/:id
- POST /api/dream-oracle/analyze

### Capsules
- POST /api/capsule
- GET /api/capsules

---

## Tech Stack
- **Frontend**: React Native (Expo), TypeScript, Reanimated
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **AI**: OpenAI GPT-4o via emergentintegrations
- **Paiements**: Stripe via emergentintegrations

---

## Système d'Abonnement

### Essai Gratuit - 2 jours
- Accès complet à toutes les fonctionnalités
- Journal, Rêves, IA Miroir, Astrologie, tout !
- Automatiquement converti en mode limité après 2 jours

### Essentiel - 9.99€/mois
- Journal illimité
- Cadence (rituels)
- Sagesse (citations)
- Lettre à moi-même
- Scellés permanents
- Carnet des rêves (ÉCRITURE SEULEMENT)
- Archivage illimité
- Cycles lunaires
- Statistiques
- **❌ PAS d'Oracle des Rêves**
- **❌ PAS d'IA Miroir**
- **❌ PAS d'Astrologie**

### Premium - 18.99€/mois
- **TOUT Essentiel +**
- Oracle des rêves (analyse IA)
- IA Miroir illimitée
- Astrologie complète
- Analyse approfondie
- Arbre cosmique
- Sync santé & sommeil

### Accès à Vie (Membre Fondateur)
- Accès complet permanent
- Badge "Membre Fondateur"
- Via codes uniques `LATENCE-XXXX-XXXX-XXXX`
- QR codes pour cartes physiques Atelier Benamer

---

## Design
- Thème beige/crème chaleureux
- Animations : bougies, étoiles, orbes
- Focus mystique et introspectif
- **Logo épuré** : "Latence" + "by Atelier Benamer" (sans lune)
- 3 thèmes : Light (#FAF6F0), Dark (#1A1612), Silence (#0C0A08)

---

## Changelog

### 19 Février 2026 - Itération 7
- ✅ **Restrictions UI pour abonnements**:
  - Badges "Premium" avec cadenas sur les fonctionnalités verrouillées (Miroir, Oracle, Cosmos)
  - Popup "Passer en Premium" quand utilisateur non-premium clique
  - Bouton "Découvrir Premium" redirige vers /subscription
  - Carnet des Rêves séparé de l'Oracle (accès libre vs Premium)
- ✅ **Oracle des Rêves séparé**:
  - Page `/dream-oracle` dédiée avec vérification Premium
  - Nouveau menu item séparé du Carnet des Rêves
- ✅ **Tests automatisés passent**: 4/4 cas de test validés

### 19 Février 2026 - Itération 6
- ✅ **Système de paiement complet**:
  - Authentification email/password + Google OAuth + Apple
  - Page abonnement avec plans Essentiel (9.99€) et Premium (18.99€)
  - Intégration Stripe checkout
  - Codes d'accès à vie avec QR codes
  - Dashboard admin protégé
- ✅ Nouvelles pages : `/auth`, `/subscription`, `/admin`
- ✅ Backend : auth.py avec 15+ endpoints
- ✅ 23 tests API passent, frontend 100% fonctionnel

### 18 Février 2026 - Itération 5
- ✅ **Mode Nuit Global** : Thème sombre fonctionne dans TOUS les modules
- ✅ 3 thèmes fonctionnels : Light (#FAF6F0), Dark (#1A1612), Silence (#0C0A08)
- ✅ Persistance du thème via AsyncStorage

### 18 Février 2026 - Itération 4
- ✅ Bug fix: "Lettre à Moi-Même" - envoi fonctionnel
- ✅ Design: Lune retirée du logo d'accueil
- ✅ Backend: Ajout endpoints `/api/cadence/streak` et `/api/cadence/complete`
- ✅ Testing: 100% des tests passent (frontend + backend)

---

## Comment Générer les Codes d'Accès à Vie

### Accès au Dashboard Admin
1. Accédez à l'URL: `/admin`
2. Entrez le mot de passe admin: `latence_admin_2024`
3. Vous verrez 3 onglets: **Stats**, **Codes**, **Générer**

### Générer de Nouveaux Codes
1. Cliquez sur l'onglet **Générer**
2. Entrez le nombre de codes à créer (max 100)
3. Optionnel: Nommez le lot (ex: "Lancement Mars 2026")
4. Cliquez sur **Générer les codes**
5. Les codes s'affichent avec leurs QR codes
6. Chaque code est au format: `LATENCE-XXXX-XXXX-XXXX`

### Utilisation des Codes
- Les codes sont à usage unique
- Un utilisateur entre son code sur la page `/subscription`
- Le code lui donne un accès Premium à vie + badge "Membre Fondateur"

---

## Prochaines étapes (Backlog)

### P0 - Prioritaire
- [x] Système de paiement (TERMINÉ)
- [x] Restrictions d'accès selon le tier d'abonnement (TERMINÉ)
- [ ] Améliorer le module Cadence avec 6 nouvelles fonctionnalités:
  - Intention du jour
  - Suivi de streaks avancé
  - Rituels astraux personnalisés
  - Sagesse intégrée
  - Journal de gratitude
  - Bilan du soir

### P1 - Planifié
- [ ] Maisons Astrologiques dans Cosmos

### P2 - Future
- [ ] Rapport de l'Âme (Soul Report)
- [ ] Dictionnaire Onirique (Dream Dictionary)
- [ ] Notifications de renouvellement d'abonnement
- [ ] Migration base de données MongoDB (critique)

### Refactoring
- [ ] Supprimer fichiers inutilisés: `tarot.tsx`, `compatibility.tsx`
- [ ] Restructurer backend en modules

---

*Latence - by Atelier Benamer*
*Dernière mise à jour: 19 février 2026*
