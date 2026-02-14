# Analyseur TESS-W

Analyseur de données TESS-W enrichies - Photométrie • Météo • Astronomie

## 📋 Prérequis

Les fichiers .dat doivent être préalablement enrichis via l'[Enrichisseur Astronomique](https://remboucher.github.io/enrichisseur-astronomique/)

## 🚀 Installation locale

```bash
# Installer les dépendances
npm install

# Lancer l'application en mode développement
npm start
```

L'application s'ouvrira automatiquement à `http://localhost:3000`

## 🏗️ Build pour production

```bash
# Créer une version optimisée
npm run build
```

Les fichiers optimisés seront dans le dossier `build/`

## 📦 Déploiement

### Netlify (recommandé)

1. Connecter votre repo GitHub à Netlify
2. Configuration de build :
   - Build command: `npm run build`
   - Publish directory: `build`
3. Déployer !

### Autres plateformes

Le projet est compatible avec :
- Vercel
- GitHub Pages
- Cloudflare Pages
- AWS Amplify

## ✨ Fonctionnalités

- 📊 Histogrammes avec bins ajustables
- 📈 Boxplot et Violin plot mensuels
- 🎻 Ridgeline plot avec zoom et contrôles
- ⚡ Scatterplot avec régressions (linéaire et polynomiale)
- 📅 Chronologie du ciel
- 🔍 Filtres rapides (nuit astro, sans nuages, etc.)
- 📥 Export PNG de tous les graphiques
- 🎨 Interface sombre optimisée

## 🛠️ Technologies

- React 18
- Recharts 2.5
- Create React App

## 📝 Version

v6.0 - Février 2026

## 🔗 Liens utiles

- [Enrichisseur Astronomique](https://remboucher.github.io/enrichisseur-astronomique/)
- [Documentation React](https://react.dev)
- [Documentation Recharts](https://recharts.org)
