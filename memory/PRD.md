# Latence - Application de Journal Intime Poetique

## Apercu
Application mobile de journal intime avec astrologie et bien-etre emotionnel.
Frontend: React Native (Expo) | Backend: FastAPI + MongoDB | AI: GPT-5 via Emergent LLM

## Fonctionnalites implementees

### Phase 1 - Base
- Theme 3 etats : clair, sombre, silence (AMOLED)
- Onboarding : auth -> humeur 2x2 -> energie -> sagesse -> home
- Compagnon poetique AI, notification quotidienne lunaire

### Phase 2 - Astrologie AI
- Profil astral : prenom, date/heure de naissance, lieu
- Calculs : signe solaire, ascendant, phase lunaire, arbre celtique, demeure arabe, maison lunaire
- Portrait astral AI par GPT-5

### Phase 3 - AI partout + Bug fixes (16/02/2026)
- [x] Ecrire : auto-interpretation AI GPT-5 apres sauvegarde (3 phases: write -> reflecting -> done)
- [x] Carnet des reves : type (reve/cauchemar/lucide/recurrent), 10 emotions, interpretation Freud/Jung GPT-5
- [x] Fix: date-fns crashes remplaces par fonctions safe (formatDreamDate, safeDateFormat, timeAgo, formatToday)
- [x] Fix: capsule badge "undefined jours" -> "Xj restants" (backend days_remaining)
- [x] Fix: dreams list crash "Invalid time value"
- [x] Fix: Ionicons font loading via backend /api/static
- [x] Fix: bouton "Continuer" invisible sur mobile -> deplace dans stickyBottom View

### Phase 4 - Ameliorations UX (16/02/2026)
- [x] Animation de scellement REFINED - Animation elegante en 9 phases:
  - Phase 1: Apparition majestueuse de la boite (0-800ms)
  - Phase 2: Ouverture ceremonieuse du couvercle (800-1600ms)
  - Phase 3: Envol de la lettre avec rotation spirale (1600-3000ms)
  - Phase 4: Fermeture solennelle (3100-4000ms)
  - Phase 5: Aura doree pulsante (4000-5200ms)
  - Phase 6: Scellement magique avec pulse (4200-5000ms)
  - Phase 7: Etoiles ephemeres (4500-5500ms)
  - Phase 8: Cadenas celeste avec rebond (5000-5800ms)
  - Phase 9: Murmure final (5500-6200ms)
- [x] Styles visuels raffines: couleurs dorees, ombres elegantes, proportions ameliorees

## Tests - iteration 4: Backend 100%, Frontend 100%

## Modele AI
- Utilise GPT-4o (rapide et economique)
- Temps de reponse: Reves ~12s, Journal ~7s, Astrologie ~19s

## Backlog P1
- [ ] Suivi d'humeur graphiques
- [ ] Micro-animations sur les interactions (hover, tap)

## Backlog P2
- [ ] Mode hors-ligne
- [ ] Partage de capsules
- [ ] Deepening des traditions astrologiques (Celtic, Arabic, Houses) avec AI

## Architecture
```
/app/frontend/app/
├── index.tsx         # Onboarding/Mood (FIXED: bouton sticky)
├── home.tsx          # Dashboard principal
├── _layout.tsx       # Tab navigator
├── astrology/        # Module astrologie
├── capsule/
│   ├── seal.tsx      # Animation de scellement (REFINED)
│   ├── write.tsx     # Creation de journal
│   ├── list.tsx      # Liste des capsules
│   └── [id].tsx      # Detail capsule
├── dreams/
│   ├── index.tsx     # Liste des reves
│   ├── new.tsx       # Nouveau reve
│   └── [id].tsx      # Detail reve
└── +html.tsx         # Template HTML custom

/app/backend/
├── server.py         # API FastAPI complete
└── static/fonts/     # Ionicons.ttf
```

## Endpoints API cles
- POST /api/mood - Enregistrer humeur
- GET /api/sacred-text/{mood} - Texte sacre par humeur
- POST /api/capsule - Creer capsule
- GET /api/capsules - Liste capsules
- POST /api/dream - Creer reve
- GET /api/dreams - Liste reves
- POST /api/dream/interpret - Interpreter reve (AI)
- POST /api/journal/interpret - Interpreter journal (AI)
- POST /api/astrology/profile - Creer profil astral (AI)
- GET /api/notifications/daily - Notification lunaire
