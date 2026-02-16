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
- [x] Profil astral complet : prenom, date de naissance, lieu de naissance, **heure de naissance**
- [x] Calculs : signe solaire, ascendant, phase lunaire, arbre celtique, demeure arabe, maison lunaire
- [x] Portrait astral AI par GPT-5 (interpretation personnalisee multi-traditions)
- [x] 5 onglets astrologie : Profil, Lune, Celtique, Arabe, Maisons

### Phase 3 - Ecriture AI + Carnet des reves (Complete - 16/02/2026)
- [x] Page Ecrire avec bouton "Eclairer" → interpretation AI poetique GPT-5
- [x] Carnet des reves complet :
  - Formulaire : description, recurrent (oui/non), cauchemar (oui/non), emotions
  - 10 emotions selectionnables (peur, joie, tristesse, colere, confusion, paix, angoisse, nostalgie, emerveillement, desir)
  - Interpretation Freud/Jung/Gestalt/Celtique/Symbolisme par GPT-5
  - Historique des reves avec badges (recurrent, cauchemar, interprete)
- [x] Correction icons Ionicons (font servie via backend /api/static)

## Endpoints API
- POST /api/astrology/profile - Creer profil + calculs + AI (avec birth_hour)
- GET /api/astrology/profile/latest - Dernier profil (zodiac, ascendant)
- POST /api/journal/interpret - Interpretation AI du journal (GPT-5)
- POST /api/dream/interpret - Interpretation AI du reve (GPT-5, Freud/Jung)
- GET /api/notifications/daily - Notification poetique du jour
- POST /api/mood, POST /api/companion/chat, POST /api/lunar-reading
- GET /api/capsules, POST /api/capsule, GET /api/dreams, POST /api/dream

## Architecture
- /app/frontend/app/capsule/write.tsx - Ecriture + AI interpretation
- /app/frontend/app/dreams/index.tsx - Carnet des reves complet
- /app/frontend/app/astrology/index.tsx - 5 onglets + profil astral
- /app/frontend/app/home.tsx - Dashboard + notification quotidienne
- /app/backend/server.py - API FastAPI + calculs astrologiques + AI GPT-5

## Backlog P1
- [ ] Animations plus elegantes (transitions, micro-interactions)
- [ ] Suivi d'humeur dans le temps (graphiques)
- [ ] Insights personnalises journal + astrologie

## Backlog P2
- [ ] Mode hors-ligne
- [ ] Partage de capsules
