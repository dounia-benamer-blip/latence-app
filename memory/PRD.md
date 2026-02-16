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

## Tests - iteration 3: Backend 100%, Frontend 100%

## Backlog P1
- [ ] Animations plus elegantes (transitions, micro-interactions)
- [ ] Suivi d'humeur graphiques

## Backlog P2
- [ ] Mode hors-ligne
- [ ] Partage de capsules
