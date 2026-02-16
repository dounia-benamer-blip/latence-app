# Latence - Application de Journal Intime Poetique

## Apercu
Application mobile de journal intime avec astrologie et bien-etre emotionnel.
Frontend: React Native (Expo) | Backend: FastAPI + MongoDB | AI: GPT-4o via Emergent LLM

## Fonctionnalites implementees

### Phase 1 - Base (Complete)
- Systeme de theme 3 etats : clair, sombre, silence (AMOLED)
- Page d'accueil avec phase lunaire, citations, navigation
- Onboarding : auth -> humeur -> energie -> sagesse
- Page d'ecriture de journal
- Page de capsules temporelles (sceller)
- Page de reves avec interpretation AI
- Compagnon poetique AI (dialogue interieur)

### Phase 2 - Corrections et Astrologie (Complete - 16/02/2026)
- [x] Grille de selection d'humeur 2x2 (fix: remplacement ScrollView imbrique par View + flex: 1 + gap)
- [x] 5 onglets astrologie visibles: Profil, Lune, Celtique, Arabe, Maisons
- [x] Onglet Lune comme defaut (UX amelioree)
- [x] Profil astral complet : prenom, date de naissance, lieu de naissance
- [x] Calculs astrologiques automatises backend (phase lunaire, arbre celtique, demeure arabe, maison lunaire)
- [x] Interpretation AI personnalisee via GPT-4o (portrait astrologique)
- [x] Notification poetique quotidienne basee sur la phase lunaire
- [x] Correction des icones Ionicons (font servie via backend /api/static)
- [x] +html.tsx pour injection CSS custom

## Endpoints API
- POST /api/astrology/profile - Creer profil + calculs + AI
- GET /api/astrology/profile/latest - Dernier profil
- GET /api/notifications/daily - Notification poetique du jour
- POST /api/mood - Enregistrer humeur
- POST /api/companion/chat - Dialogue AI
- POST /api/lunar-reading - Lecture lunaire AI
- GET /api/capsules, POST /api/capsule
- GET /api/dreams, POST /api/dream

## Architecture fichiers cles
- /app/frontend/app/index.tsx - Onboarding + grille humeur 2x2
- /app/frontend/app/home.tsx - Dashboard + notification quotidienne
- /app/frontend/app/astrology/index.tsx - 5 onglets astrologie + profil
- /app/frontend/app/+html.tsx - Template HTML custom (fonts)
- /app/frontend/src/context/ThemeContext.tsx - Theme 3 etats
- /app/backend/server.py - API FastAPI complete
- /app/backend/static/fonts/ - Ionicons font (fix proxy)

## Backlog P1
- [ ] Animations immersives (transitions, micro-interactions)
- [ ] Suivi d'humeur dans le temps (graphiques)
- [ ] Insights personnalises journal + astrologie

## Backlog P2
- [ ] Enregistrement de reves vocaux
- [ ] Partage de capsules
- [ ] Mode hors-ligne
