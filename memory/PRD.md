# Latence - Application de Journal Intime Poetique

## Apercu
Application mobile de journal intime avec astrologie et bien-etre emotionnel.
Frontend: React Native (Expo) | Backend: FastAPI + MongoDB | AI: GPT-5 via Emergent LLM

## Fonctionnalites implementees

### Phase 1 - Base (Complete)
- Systeme de theme 3 etats : clair, sombre, silence (AMOLED)
- Page d'accueil avec phase lunaire, citations, navigation
- Onboarding : auth -> humeur -> energie -> sagesse
- Compagnon poetique AI (dialogue interieur)
- Grille de selection d'humeur 2x2
- Notification poetique quotidienne

### Phase 2 - Astrologie + AI (Complete - 16/02/2026)
- [x] Profil astral complet : prenom, date/heure de naissance, lieu
- [x] Calculs : signe solaire, ascendant, phase lunaire, arbre celtique, demeure arabe, maison lunaire
- [x] Portrait astral AI par GPT-5 multi-traditions

### Phase 3 - Ecriture AI + Carnet des reves (Complete - 16/02/2026)
- [x] Page Ecrire avec bouton "Eclairer" - interpretation AI GPT-5
- [x] Carnet des reves complet : type (reve/cauchemar/lucide/recurrent), titre, emotions, interpretation Freud/Jung/Gestalt GPT-5
- [x] Bug fix: "Invalid time value" - remplacement date-fns format par formatDreamDate safe
- [x] Bug fix: champ API dream (date vs created_at, title requis)

## Endpoints API
- POST /api/astrology/profile (birth_hour), GET /api/astrology/profile/latest
- POST /api/journal/interpret (GPT-5), POST /api/dream/interpret (GPT-5 Freud/Jung)
- GET /api/notifications/daily
- POST /api/mood, POST /api/companion/chat, POST /api/lunar-reading
- GET/POST /api/capsules, GET/POST /api/dreams, PUT /api/dream/{id}/interpretation

## Architecture
- /app/frontend/app/capsule/write.tsx - Ecriture + AI
- /app/frontend/app/dreams/index.tsx - Carnet des reves
- /app/frontend/app/dreams/[id].tsx - Detail reve + interpretation
- /app/frontend/app/astrology/index.tsx - 5 onglets + profil
- /app/backend/server.py - API complete GPT-5

## Backlog P1
- [ ] Animations plus elegantes (transitions, micro-interactions)
- [ ] Suivi d'humeur dans le temps (graphiques)

## Backlog P2
- [ ] Mode hors-ligne
- [ ] Partage de capsules
