# Latence - PRD Final

## Vision
Journal intime immersif centré sur la lune, l'introspection et la sagesse universelle.

---

## Statut: PRODUCTION READY ✅

### Implémentations Complètes

| Fonctionnalité | Statut |
|----------------|--------|
| MongoDB (persistance données) | ✅ Complet |
| Système d'abonnement (3 tiers) | ✅ Complet |
| Google Sign-In (Emergent Auth) | ✅ Complet |
| Apple Sign-In | ✅ Complet |
| Push Notifications (Expo) | ✅ Complet |
| Admin Dashboard | ✅ Complet |
| Restrictions Premium UI | ✅ Complet |
| Stripe Payments | ✅ Complet |
| Codes Lifetime (QR) | ✅ Complet |
| **Multi-langues (FR/EN/ES)** | ✅ Complet |

---

## Modules Principaux

### Cadence - Rythme Intérieur
- Micro-rituels quotidiens personnalisés
- Adaptés à l'heure du jour et la phase lunaire

### Sagesse - Citations Universelles  
- Citations de poètes soufis, textes sacrés, philosophes

### Lettre à Moi-Même
- Écrire au futur soi avec date de livraison

### Rituels Lunaires (Premium)
- Rituels IA selon la phase de lune

### Oracle des Rêves (Premium)
- Analyse des patterns de rêves par IA

### Carnet des Rêves
- Créer, modifier, supprimer des rêves

### Sceller - Capsules Temporelles
- Bougie animée, clés colorées (7j à 1 an)

### Cosmos - Astrologie (Premium)
- Zodiacal, Lunaire, Celtique, Arabe

### Méditation (Premium)
- Exercices de respiration guidée

### Miroir IA (Premium)
- Conversation psychanalytique

---

## Système d'Abonnement

### Essai Gratuit - 2 jours
- Accès complet à toutes les fonctionnalités

### Essentiel - 9.99€/mois
- Journal, Cadence, Sagesse, Lettre, Sceller, Carnet des rêves
- **❌ PAS:** Oracle, IA Miroir, Astrologie, Méditation, Rituels

### Premium - 18.99€/mois
- **TOUT** inclus

### Accès à Vie (Membre Fondateur)
- Via codes uniques `LATENCE-XXXX-XXXX-XXXX`
- QR codes pour cartes physiques Atelier Benamer

---

## Authentification

### Méthodes Supportées
1. **Email/Password** - Inscription classique
2. **Google Sign-In** - Via Emergent Auth (OAuth 2.0)
3. **Apple Sign-In** - Via expo-apple-authentication (iOS)

### Flux OAuth
1. Utilisateur clique "Continuer avec Google/Apple"
2. Redirection vers provider OAuth
3. Callback avec session_id
4. Backend crée session + cookie httpOnly
5. Utilisateur redirigé vers /home

---

## Push Notifications

### Configuration
- Package: `expo-notifications`
- Service: Expo Push API
- Android Channel: "Latence" (importance MAX)

### Types de Notifications
1. **Capsule prête** - Quand une capsule peut être ouverte
2. **Lettre livrée** - Quand une lettre du passé arrive
3. **Rappel quotidien** - Invitation à journaliser (20h)

### Endpoints
- `POST /api/auth/push-token` - Enregistrer token utilisateur
- `POST /api/notifications/check` - Vérifier et envoyer notifications pendantes
- `POST /api/notifications/daily-reminder` - Déclencher rappel quotidien
- `POST /api/admin/send-notification` - Envoyer notification admin

---

## API Endpoints

### Auth & Subscription
- `POST /api/auth/register` - Inscription email
- `POST /api/auth/login` - Connexion email
- `POST /api/auth/session` - OAuth Google callback
- `POST /api/auth/apple` - Apple Sign-In callback
- `GET /api/auth/me` - Utilisateur courant
- `POST /api/auth/logout` - Déconnexion
- `POST /api/auth/push-token` - Enregistrer push token
- `GET /api/auth/subscription-status` - Statut abonnement

### Subscription
- `GET /api/subscription/plans` - Plans disponibles
- `POST /api/subscription/create-checkout` - Créer session Stripe
- `GET /api/subscription/checkout-status/:id` - Statut paiement
- `POST /api/subscription/activate-lifetime` - Activer code lifetime

### Admin
- `POST /api/admin/login` - Connexion admin
- `GET /api/admin/stats` - Statistiques dashboard
- `POST /api/admin/generate-codes` - Générer codes QR
- `GET /api/admin/codes` - Liste des codes
- `GET /api/admin/users` - Liste utilisateurs
- `POST /api/admin/send-notification` - Envoyer notification

### Notifications
- `POST /api/notifications/check` - Vérifier capsules/lettres
- `POST /api/notifications/daily-reminder` - Rappel quotidien

---

## Tech Stack
- **Frontend**: React Native (Expo), TypeScript, Reanimated
- **Backend**: FastAPI (Python), Motor (async MongoDB)
- **Database**: MongoDB
- **AI**: OpenAI GPT-4o via emergentintegrations
- **Paiements**: Stripe via emergentintegrations
- **Auth**: Emergent Auth (Google), expo-apple-authentication
- **Push**: Expo Push Notifications

---

## Architecture Backend

```
/app/backend/
├── server.py          # FastAPI app principal, routes
├── auth.py            # Auth, subscription, admin routes
├── notifications.py   # Service de notifications push
└── .env               # MONGO_URL, DB_NAME, EMERGENT_LLM_KEY, STRIPE_API_KEY
```

## Architecture Frontend

```
/app/frontend/
├── app/
│   ├── home.tsx           # Écran principal avec restrictions Premium
│   ├── auth.tsx           # Login/Register avec Google/Apple
│   ├── subscription.tsx   # Plans d'abonnement
│   ├── admin.tsx          # Dashboard admin
│   ├── dream-oracle.tsx   # Oracle des rêves (Premium)
│   └── ...
├── src/
│   ├── context/
│   │   ├── AuthContext.tsx   # Auth state, OAuth, push notifications
│   │   └── ThemeContext.tsx  # Thèmes Light/Dark/Silence
│   └── components/
└── .env
```

---

## Credentials

### Admin Dashboard
- URL: `/admin`
- Mot de passe: `latence_admin_2024`

### Test Account
- Créer via `/auth` (inscription)

---

## Changelog

### 19 Février 2026 - Production Ready
- ✅ **MongoDB** - Base de données persistante (déjà configurée)
- ✅ **Google Sign-In** - Intégration Emergent Auth complète
- ✅ **Apple Sign-In** - expo-apple-authentication intégré
- ✅ **Push Notifications** - Expo Push configuré:
  - Notifications capsules prêtes
  - Notifications lettres livrées
  - Rappels quotidiens journalisation
- ✅ **Endpoints notification** ajoutés au backend

### 19 Février 2026 - Restrictions Premium
- ✅ Badges "Premium" sur 5 fonctionnalités (Miroir, Oracle, Cosmos, Méditation, Rituels)
- ✅ Popup "Passer en Premium" pour utilisateurs non-premium
- ✅ Oracle des Rêves séparé du Carnet

### 19 Février 2026 - Système Abonnement
- ✅ Auth email/password
- ✅ Page subscription avec plans
- ✅ Stripe checkout intégré
- ✅ Codes lifetime avec QR
- ✅ Dashboard admin

---

## Déploiement

### Cron Jobs Recommandés
Pour production, configurer ces jobs:

```bash
# Vérifier capsules/lettres toutes les heures
0 * * * * curl -X POST https://your-app.com/api/notifications/check

# Rappel quotidien à 20h
0 20 * * * curl -X POST https://your-app.com/api/notifications/daily-reminder
```

---

## Notes pour App Store

### iOS (Apple)
- Apple Sign-In est **requis** si d'autres méthodes OAuth sont présentes
- ✅ Implémenté

### Android
- Google Sign-In fonctionne via WebBrowser
- Push notifications via Expo + FCM (configuration EAS requise)

---

*Latence - by Atelier Benamer*
*Dernière mise à jour: 19 février 2026*
