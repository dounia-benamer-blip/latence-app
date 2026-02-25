# 🚀 Instructions de Build iOS - Latence

## Étape 1 : Installer les outils
```bash
npm install -g eas-cli
```

## Étape 2 : Se connecter à Expo
```bash
eas login
```
(Utilise ton compte: dounb)

## Étape 3 : Lancer le build iOS
```bash
cd latence-frontend
eas build --platform ios --profile production
```

## Étape 4 : Répondre aux questions
- Apple ID: Dounia-Benamer@hotmail.fr  
- Team ID: MNPJV87Q6P
- Laisse EAS gérer les certificats automatiquement

## Étape 5 : Soumettre à l'App Store
Quand le build est terminé:
```bash
eas submit --platform ios
```

Le fichier .ipa sera automatiquement envoyé sur App Store Connect!
