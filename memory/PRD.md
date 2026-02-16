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
- Profil astral : prénom, date/heure de naissance, lieu
- Calculs : signe zodiacal (étoile, pas soleil), ascendant, phase lunaire, arbre celtique, demeure arabe, maison lunaire
- Portrait astral AI par GPT-4o

### Phase 3 - AI partout + Bug fixes
- [x] Écrire : auto-interprétation AI après sauvegarde
- [x] Carnet des rêves : type, 10 émotions, interprétation Freud/Jung GPT-4o
- [x] Fix: texte visible dans "Écrire" (couleur #2A2A2A)
- [x] Fix: date-fns crashes → fonctions safe
- [x] Fix: capsule badge "undefined jours" → "Xj restants"
- [x] Fix: bouton "Continuer" sticky en bas

### Phase 4 - IA Miroir + Littérature (16/02/2026)
- [x] **IA MIROIR** - 3 modes de psychanalyse poétique :
  - **Reflet** : Reflète tes pensées/émotions avec douceur
  - **Analyse** : Analyse ce que ton écriture révèle de toi
  - **Question** : Pose LA question profonde qui peut tout éclairer
- [x] **Bibliothèque de penseurs élargie** - 100+ citations de :
  - Rumi, Khalil Gibran, Marc Aurèle, Lao Tseu, Bouddha, Sénèque, Confucius
  - Ibn Arabi, Thich Nhat Hanh, Jung, Nietzsche, Camus, Dostoïevski
  - Pessoa, Victor Hugo, Platon, Gandhi, Einstein, et bien d'autres
- [x] Animation de scellement élégante en 9 phases
- [x] Icône étoile au lieu de soleil pour l'astrologie

## Modèle AI
- Utilise GPT-4o (rapide et de qualité)
- Temps de réponse: ~5-15 secondes selon la complexité

## Tests
- Backend: 100% fonctionnel
- Frontend: 100% fonctionnel
- IA Miroir: Testé et opérationnel

## Backlog P1
- [ ] Suivi d'humeur avec graphiques
- [ ] Micro-animations sur les interactions

## Backlog P2
- [ ] Mode hors-ligne
- [ ] Partage de capsules
- [ ] Approfondissement des traditions astrologiques avec AI

## Architecture
```
/app/frontend/app/
├── index.tsx         # Onboarding/Mood
├── home.tsx          # Dashboard avec Miroir
├── _layout.tsx       # Tab navigator
├── mirror/           # IA MIROIR (NOUVEAU)
│   └── index.tsx     # Chat avec 3 modes
├── astrology/        # Module astrologie
├── capsule/
│   ├── seal.tsx      # Animation élégante
│   ├── write.tsx     # Écriture (texte visible)
│   └── list.tsx      # Liste capsules
├── dreams/           # Journal des rêves
└── profile.tsx       # Profil utilisateur

/app/backend/
└── server.py         # API avec :
    - /api/mirror/reflect
    - /api/mirror/analyze-writing
    - /api/mirror/deep-question
    - /api/dream/interpret
    - /api/journal/interpret
    - /api/astrology/profile
```

## Penseurs et Sagesses
L'app puise dans les traditions :
- Soufisme (Rumi, Ibn Arabi)
- Bouddhisme (Bouddha, Thich Nhat Hanh)
- Taoïsme (Lao Tseu)
- Stoïcisme (Marc Aurèle, Sénèque, Épictète)
- Philosophie grecque (Platon, Socrate)
- Sagesses africaines, celtiques, arabes, indiennes, japonaises
- Littérature (Hugo, Camus, Pessoa, Dostoïevski, Gibran)
- Psychanalyse poétique (Jung - non clinique)
