# Latence - PRD Final

## Vision
Journal intime immersif centré sur la lune, l'introspection et la sagesse universelle.

---

## Modules Principaux

### 🔮 Cadence - Rythme Intérieur
- Micro-rituels quotidiens personnalisés (pas de sport)
- Adaptés à l'heure du jour et la phase lunaire
- Types : Respiration, Introspection, Gratitude, Silence
- Réflexion du soir

### ✨ Sagesse - Citations Universelles  
- Citations de poètes soufis (Rumi, Hafiz)
- Textes sacrés (sans catégorisation)
- Philosophes et sages de toutes traditions
- Sauvegarder et partager

### 💌 Lettre à Moi-Même
- Écrire au futur soi
- Choix de la date de livraison (1 mois à 5 ans)
- Notification à la livraison

### 🌙 Rituels Lunaires
- Rituels IA selon la phase de lune
- Préparation, étapes avec checkboxes
- Affirmation finale

### 👁️ Oracle des Rêves (dans Rêves)
- Analyse des patterns de rêves
- Symboles révélés avec significations
- Message de l'inconscient

### 📖 Carnet des Rêves
- Créer, modifier, supprimer des rêves
- Types : Rêve, Cauchemar, Lucide, Récurrent
- Interprétation IA

### 📦 Sceller - Capsules Temporelles
- Bougie animée
- Système de clés colorées :
  - 🟢 Émeraude (7j) | 🔵 Saphir (15j) | 🟣 Améthyste (1 mois)
  - 🟡 Ambre (3 mois) | 🔴 Rubis (6 mois) | 🥇 Or (1 an)
- Animation boîte "LATENCE" en bois

### 🌌 Cosmos - Astrologie
- Zodiacal, Ascendant, Lunaire
- Celtique et Arabe
- Interprétations IA

### 🧘 Méditation
- Exercices de respiration
- Animations de souffle

### 🪞 Miroir IA
- Conversation psychanalytique
- Style littéraire

---

## API Endpoints

### Cadence
- GET /api/cadence/daily
- GET /api/cadence/streak (NEW)
- POST /api/cadence/complete (NEW)

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
- PUT /api/dream/{id}
- DELETE /api/dream/{id}
- POST /api/dream-oracle/analyze

### Capsules
- POST /api/capsule
- GET /api/capsules

---

## Tech Stack
- **Frontend**: React Native (Expo), TypeScript, Reanimated
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **AI**: OpenAI GPT-4o

---

## Design
- Thème beige/crème chaleureux
- Animations : bougies, étoiles, orbes
- Focus mystique et introspectif
- **Logo épuré** : "Latence" + "by Atelier Benamer" (sans lune)

---

## Changelog

### 18 Février 2026 - Itération 5
- ✅ **Mode Nuit Global** : Thème sombre fonctionne dans TOUS les modules
- ✅ Mise à jour fichiers capsule (write, list, [id]) pour utiliser useTheme
- ✅ Mise à jour dreams/[id].tsx pour utiliser useTheme
- ✅ 3 thèmes fonctionnels : Light (#FAF6F0), Dark (#1A1612), Silence (#0C0A08)
- ✅ Persistance du thème via AsyncStorage

### 18 Février 2026 - Itération 4
- ✅ Bug fix: "Lettre à Moi-Même" - envoi fonctionnel
- ✅ Design: Lune retirée du logo d'accueil
- ✅ Backend: Ajout endpoints `/api/cadence/streak` et `/api/cadence/complete`
- ✅ Testing: 100% des tests passent (frontend + backend)

---

## Prochaines étapes (Backlog)

### P0 - Prioritaire
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

### Refactoring
- [ ] Supprimer fichiers inutilisés: `tarot.tsx`, `compatibility.tsx`
- [ ] Restructurer backend en modules

---

*Latence - by Atelier Benamer*
*Dernière mise à jour: 18 février 2026*
