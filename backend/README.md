# Backend API - Distribution Fruits & Légumes

API REST pour l'application de distribution B2B.

## 🚀 Démarrage rapide

```bash
# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Modifier .env avec vos paramètres

# Générer le client Prisma
npx prisma generate

# Créer les migrations
npx prisma migrate dev

# (Optionnel) Seed des données
node seed.js

# Démarrer le serveur
npm run dev
```

## 📡 Endpoints API

### Authentification
- `POST /api/auth/register` - Inscription client
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Informations utilisateur connecté

### Produits
- `GET /api/products` - Liste des produits
- `GET /api/products/:id` - Détails d'un produit
- `POST /api/products` - Créer un produit (ADMIN)
- `PUT /api/products/:id` - Modifier un produit (ADMIN)
- `DELETE /api/products/:id` - Désactiver un produit (ADMIN)

### Commandes
- `POST /api/orders` - Créer une commande (CLIENT)
- `GET /api/orders` - Liste des commandes
- `GET /api/orders/:id` - Détails d'une commande
- `PUT /api/orders/:id/status` - Modifier le statut (ADMIN)

### Admin
- `GET /api/admin/dashboard` - Statistiques dashboard
- `GET /api/admin/stats` - Statistiques avec filtres

### Magasins
- `GET /api/shops` - Liste des magasins (ADMIN)
- `GET /api/shops/:id` - Détails d'un magasin (ADMIN)

## 🔐 Authentification

Toutes les routes (sauf `/api/auth/*`) nécessitent un token JWT dans le header :

```
Authorization: Bearer <token>
```

## 📝 Format des réponses

### Succès
```json
{
  "message": "Opération réussie",
  "data": { ... }
}
```

### Erreur
```json
{
  "message": "Message d'erreur",
  "errors": [ ... ]
}
```

## 🗄️ Base de données

Utiliser Prisma Studio pour visualiser/modifier les données :

```bash
npx prisma studio
```

