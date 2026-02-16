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
- Profil astral complet avec :
  - Prénom
  - Date de naissance (sélecteurs Jour/Mois/Année)
  - Lieu de naissance (recherche parmi 80+ villes mondiales)
  - Heure de naissance (sélection horizontale intuitive)
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

### Phase 5 - Amélioration Profil Astral (16/02/2026)
- [x] **Base de données de villes mondiales** (80+ villes) :
  - France (Paris, Lyon, Marseille, Bordeaux, Toulouse, Nice...)
  - Europe (Londres, Berlin, Madrid, Rome, Amsterdam, Bruxelles...)
  - Afrique du Nord (Casablanca, Rabat, Marrakech, Alger, Tunis, Le Caire...)
  - Amériques (New York, Los Angeles, Montréal, São Paulo, Buenos Aires...)
  - Asie (Tokyo, Pékin, Shanghai, Séoul, Bangkok, Mumbai...)
  - Océanie (Sydney, Melbourne, Auckland)
- [x] **Sélecteur de date intuitif** (Jour | Mois | Année en colonnes)
- [x] **Sélecteur d'heure horizontal** (00:00 à 23:00)
- [x] **Recherche de ville** avec autocomplétion
- [x] **Calcul astral précis** via GPT-4o avec :
  - Signe solaire avec élément et planète
  - Ascendant avec élément
  - Phase lunaire de naissance
  - Arbre celtique et ses qualités
  - Demeure lunaire arabe
  - Portrait astral poétique personnalisé

## Modèle AI
- GPT-4o (rapide et de qualité)
- Temps de réponse: ~5-20 secondes selon la complexité

## Backlog P1
- [ ] Suivi d'humeur avec graphiques
- [ ] Micro-animations sur les interactions

## Backlog P2
- [ ] Mode hors-ligne
- [ ] Partage de capsules

## Architecture
```
/app/frontend/app/
├── index.tsx         # Onboarding/Mood
├── home.tsx          # Dashboard avec Miroir
├── mirror/           # IA MIROIR
├── astrology/        # Module astrologie AMÉLIORÉ
├── capsule/          # Journal et scellement
├── dreams/           # Carnet des rêves
└── profile.tsx       # Profil utilisateur

/app/backend/
└── server.py         # API complète avec :
    - /api/cities?q=xxx - Recherche de villes
    - /api/hours - Liste des heures
    - /api/astrology/profile - Calcul astral complet
    - /api/mirror/reflect - IA Miroir
    - /api/dream/interpret - Interprétation des rêves
```

## Base de données des villes
80+ villes mondiales avec coordonnées GPS (lat/lng) pour le calcul astrologique précis.
