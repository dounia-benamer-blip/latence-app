# Latence - Application de Journal Intime Poétique

## Vision Produit
Latence est une application mobile de journal intime poétique qui offre une expérience élégante, minimaliste et profonde pour l'introspection et le bien-être émotionnel.

## Personas Utilisateurs
- **Chercheurs spirituels** : Personnes intéressées par l'astrologie, la méditation et la sagesse ancestrale
- **Écrivains intimes** : Personnes souhaitant documenter leurs pensées et émotions de manière poétique
- **Personnes sensibles** : Utilisateurs recherchant un espace calme et esthétique pour la réflexion

## Exigences Principales

### 1. Modes de Thème
- **Mode Clair** : Fond beige élégant (#F5F0E8)
- **Mode Sombre** : Fond foncé confortable (#0D1117)
- **Mode Silence** : Fond AMOLED noir (#000000) pour utilisation nocturne sans agresser les yeux

### 2. Feature Astrologie ("Astres")
- **Phase Lunaire** : Affichage de la phase lunaire actuelle avec 8 phases expliquées
- **Astrologie Celtique** : 13 arbres sacrés avec symboles Ogham et significations
- **Demeures Arabes** : 28 Manzil avec noms arabes, éléments, planètes et influences
- **Maisons Occidentales** : 12 maisons astrologiques avec thèmes et domaines de vie
- **Profil Astral** : Calcul personnalisé basé sur la date de naissance

### 3. Journal Émotionnel
- 12 états émotionnels (Serein, Joyeux, Rêveur, Mélancolique, Fatigué, Inspiré, Anxieux, Nostalgique, Perdu, Reconnaissant, Contemplatif, Éveillé)
- Échelle d'énergie de 1 à 5
- Textes de sagesse personnalisés

### 4. Capsules Temporelles
- Écriture de pensées
- Scellement avec durée configurable
- Animation de scellement (à améliorer)

### 5. Dialogue Intérieur
- Compagnon AI poétique
- Conversations basées sur l'humeur

---

## Architecture Technique

### Stack
- **Frontend** : React Native / Expo (Web + Mobile)
- **Backend** : Python / FastAPI
- **Base de données** : MongoDB
- **AI** : OpenAI via Emergent LLM Key

### Structure des Fichiers
```
/app
├── frontend/
│   ├── app/
│   │   ├── index.tsx          # Écran d'accueil/auth
│   │   ├── home.tsx           # Dashboard principal
│   │   ├── astrology/         # Section astrologie
│   │   │   └── index.tsx      # Page avec 5 onglets
│   │   ├── capsule/           # Capsules temporelles
│   │   └── _layout.tsx        # Layout principal
│   └── src/
│       └── context/
│           └── ThemeContext.tsx  # Gestion des 3 thèmes
├── backend/
│   └── server.py              # API endpoints
└── memory/
    └── PRD.md                 # Ce document
```

---

## Ce qui a été implémenté ✅

### 11 Février 2025
- [x] Mode Silence (AMOLED noir) ajouté au système de thème
- [x] Toggle de thème avec cycle light → dark → silence → light
- [x] Page Astrologie complète avec 5 onglets :
  - Profil (date de naissance)
  - Lune (phases lunaires)
  - Celtique (13 arbres)
  - Arabe (28 demeures)
  - Maisons (12 maisons)
- [x] Données astrologiques complètes implémentées
- [x] Icône du toggle change selon le mode (lune → œil → soleil)
- [x] Tests automatisés passés à 100%

### Précédemment
- [x] Compagnon AI poétique
- [x] Écran de sélection d'humeur avec 12 états
- [x] Textes de sagesse quotidiens
- [x] Mode sombre
- [x] Remplacement des emojis par des icônes élégantes

---

## Backlog Priorisé

### P0 (Critique)
- [ ] Corriger la grille d'humeur (2x2 sur mobile au lieu de 1 colonne)
- [ ] Corriger le bug du bouton "Sceller" dans le flux de capsule

### P1 (Important)
- [ ] Animation de scellement (lettre qui s'enroule + halo)
- [ ] Profil astral avec calcul de maison lunaire basé sur date de naissance
- [ ] Recommandations de lecture basées sur l'humeur

### P2 (Souhaité)
- [ ] Suivi d'évolution émotionnelle dans le temps
- [ ] Journal de rêves avancé
- [ ] Notifications poétiques

### P3 (Futur)
- [ ] Mode offline
- [ ] Synchronisation multi-appareils
- [ ] Export du journal

---

## Bugs Connus

1. **Grille d'humeur** : Les cartes s'affichent en 1 colonne au lieu de 2x2 sur mobile
   - Cause : flexBasis et width % ne fonctionnent pas correctement sur React Native Web
   - Impact : Expérience mobile dégradée mais fonctionnelle

2. **Onglet "Profil" astrologie** : L'onglet est hors écran à gauche par défaut
   - Cause : ScrollView horizontal commence au début mais "Profil" n'est pas visible
   - Impact : L'utilisateur doit scroller pour voir l'onglet Profil

3. **Erreurs de log** : "shadow* style props are deprecated"
   - Cause : React Native Web recommande boxShadow
   - Impact : Aucun impact fonctionnel

---

## Notes Importantes
- L'esthétique doit rester "élégante, minimaliste, rare, belle"
- Pas d'emojis - utiliser uniquement des icônes Ionicons
- L'AI doit avoir un ton poétique, jamais médical
- Toutes les explications astrologiques doivent être claires et accessibles
