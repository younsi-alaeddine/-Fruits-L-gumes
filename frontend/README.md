# Frontend React - Distribution Fruits & Légumes

Interface utilisateur React pour l'application de distribution B2B.

## 🚀 Démarrage rapide

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm start
```

L'application sera accessible sur http://localhost:3000

## 📁 Structure

- `/src/components` - Composants réutilisables
- `/src/pages` - Pages de l'application
  - `/client` - Pages pour les clients
  - `/admin` - Pages pour les administrateurs
- `/src/context` - Contextes React (Auth)
- `/src/services` - Services API

## 🔧 Configuration

L'URL de l'API est configurée dans `/src/services/api.js`.

Par défaut, le proxy dans `package.json` redirige vers `http://localhost:5000`.

Pour la production, modifier la variable d'environnement :

```env
REACT_APP_API_URL=https://api.votredomaine.com/api
```

## 🎨 Routes

- `/login` - Connexion
- `/register` - Inscription
- `/client` - Catalogue produits (CLIENT)
- `/client/orders` - Mes commandes (CLIENT)
- `/admin` - Dashboard (ADMIN)
- `/admin/orders` - Gestion commandes (ADMIN)
- `/admin/products` - Gestion produits (ADMIN)
- `/admin/shops` - Gestion magasins (ADMIN)

## 📦 Build production

```bash
npm run build
```

Les fichiers optimisés seront dans le dossier `build/`.

