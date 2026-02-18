# Latence - Journal Immersif Astrologique

## Vision
Application mobile de journal intime avec une forte orientation astrologie, bien-être émotionnel et IA omniprésente.

## Fonctionnalités Implémentées

### 1. Thème Chaleureux & Cosy ✅
- **Light Theme**: Tons beige/crème chauds, ambiance bougie
- **Dark Theme**: Brun foncé chaleureux, lueur de bougie
- **Silence Theme**: Noir profond avec touches chaudes

### 2. Module Cosmos (ex-Astres) ✅
- Onglets améliorés avec icônes: Mon Profil, Lune, Celtique, Arabe, Maisons
- Navigation fluide et visible

### 3. Profil Astrologique Complet ✅
- **Signe Solaire**: Avec élément et planète
- **Signe Lunaire**: Calcul précis + description détaillée
  - Nature émotionnelle, Instincts, Moi intérieur
  - Besoins, Don, Description poétique
- **Arbre Celtique**: Base de données 13 arbres
  - Ogham, élément, planète, qualités
  - Personnalité, ombre, don, message
- **Demeure Arabe**: Base de données 28 demeures
  - Nom arabe, traduction, étoiles
  - Nature, influence, personnalité, don, message

### 4. Modules IA ✅
- **Écrire & Sceller**: Journal avec interprétation IA
- **Carnet des Rêves**: Log et interprétation des rêves
- **IA Miroir**: 3 modes (Réflexion, Analyse, Questionnement)
- **Dialogue Intérieur**: Compagnon poétique IA

### 5. Aura Avatar ✅
- Avatar pulsant reflétant l'humeur
- Intégré au header et à la page profil

### 6. Citations Personnalisées ✅
- `/api/sacred-text-personalized`: Citations basées sur profil astral + humeur

## Architecture Technique

### Frontend
- React Native + Expo (Router)
- TypeScript
- React Native Reanimated

### Backend  
- FastAPI (Python)
- MongoDB
- GPT-4o via emergentintegrations

## Prochaines Étapes (Backlog)

### P1 - Visuels Immersifs
- [ ] Fond étoilé animé pour Cosmos
- [ ] Visualisation lune plus grande
- [ ] Carte stellaire

### P2 - Personnalisation Avancée
- [ ] Aura change selon profil astral (pas seulement humeur)
- [ ] Profil astral résumé sur page d'accueil

### P3 - Engagement
- [ ] Notifications quotidiennes basées sur phase lunaire
- [ ] Module 4 citations philosophiques personnalisées
