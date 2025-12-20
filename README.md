# Application B2B de Distribution de Fruits et Légumes

Application web professionnelle pour une entreprise de distribution en gros de fruits et légumes en France.

## 🎯 Fonctionnalités

### Pour les Clients (Magasins)
- ✅ Inscription et authentification
- ✅ Catalogue de produits avec photos
- ✅ Panier dynamique avec gestion des quantités
- ✅ Création de commandes
- ✅ Consultation de l'historique des commandes
- ✅ Interface responsive (mobile, tablette, desktop)

### Pour l'Administrateur (Grossiste)
- ✅ Dashboard avec statistiques (jour, mois, par client)
- ✅ Gestion complète des produits (CRUD)
- ✅ Upload de photos produits
- ✅ Visualisation de toutes les commandes
- ✅ Filtres avancés (client, date, statut)
- ✅ Modification du statut des commandes
- ✅ Gestion des magasins clients

## 🛠️ Stack Technique

### Backend
- **Node.js** + **Express.js**
- **PostgreSQL** (base de données)
- **Prisma ORM** (gestion de la base de données)
- **JWT** + **bcrypt** (authentification sécurisée)
- **Multer** (upload de fichiers)

### Frontend
- **React.js** (interface utilisateur)
- **React Router** (routing)
- **Axios** (appels API)
- **React Toastify** (notifications)

## 📋 Prérequis

- Node.js (v16 ou supérieur)
- PostgreSQL (v12 ou supérieur)
- npm ou yarn

## 🚀 Installation

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd "projet france khalil"
```

### 2. Installer les dépendances

```bash
# Installer les dépendances racine et backend
npm install

# Installer les dépendances frontend
cd frontend
npm install
cd ..
```

Ou utiliser la commande raccourcie :

```bash
npm run install-all
```

### 3. Configuration de la base de données

1. Créer une base de données PostgreSQL :

```sql
CREATE DATABASE fruits_legumes_db;
```

2. Configurer les variables d'environnement :

Copier le fichier `.env.example` vers `.env` dans le dossier `backend` :

```bash
cp backend/.env.example backend/.env
```

3. Modifier `backend/.env` avec vos paramètres :

```env
DATABASE_URL="postgresql://user:password@localhost:5432/fruits_legumes_db?schema=public"
JWT_SECRET="votre_secret_jwt_tres_securise_changez_moi"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV=development
UPLOAD_DIR="./uploads"
```

### 4. Initialiser la base de données

```bash
# Générer le client Prisma
cd backend
npx prisma generate

# Créer les migrations
npx prisma migrate dev --name init

# (Optionnel) Ouvrir Prisma Studio pour visualiser la base
npx prisma studio
```

### 5. Créer un utilisateur administrateur

Vous pouvez créer un admin via Prisma Studio ou directement en SQL :

```sql
-- Hasher le mot de passe "admin123" avec bcrypt
-- Utiliser un outil en ligne ou Node.js pour générer le hash
-- Exemple de hash pour "admin123": $2b$10$...

INSERT INTO users (id, name, email, password, role, "createdAt")
VALUES (
  gen_random_uuid(),
  'Administrateur',
  'admin@example.com',
  '$2b$10$VotreHashBcryptIci',
  'ADMIN',
  NOW()
);
```

Ou utiliser un script Node.js temporaire pour créer l'admin.

## 🏃 Démarrage

### Mode développement (backend + frontend simultanément)

```bash
npm run dev
```

### Ou démarrer séparément

**Backend :**
```bash
cd backend
npm run dev
```

**Frontend :**
```bash
cd frontend
npm start
```

L'application sera accessible sur :
- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:5000

## 📁 Structure du Projet

```
.
├── backend/
│   ├── config/
│   │   └── database.js          # Configuration Prisma
│   ├── middleware/
│   │   └── auth.js               # Middleware JWT
│   ├── routes/
│   │   ├── auth.js               # Routes authentification
│   │   ├── products.js           # Routes produits
│   │   ├── orders.js             # Routes commandes
│   │   ├── admin.js              # Routes admin (stats)
│   │   └── shops.js              # Routes magasins
│   ├── utils/
│   │   ├── jwt.js                # Utilitaires JWT
│   │   └── calculations.js       # Calculs HT/TVA/TTC
│   ├── prisma/
│   │   └── schema.prisma         # Schéma Prisma
│   ├── uploads/                  # Photos produits (créé automatiquement)
│   └── server.js                 # Point d'entrée serveur
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/           # Composants réutilisables
│   │   ├── context/              # Contextes React (Auth)
│   │   ├── pages/                # Pages de l'application
│   │   │   ├── client/           # Pages client
│   │   │   └── admin/            # Pages admin
│   │   ├── services/             # Services API
│   │   └── App.js                # Composant principal
│   └── package.json
│
└── README.md
```

## 🔐 Authentification

### Comptes de Démonstration

Pour créer des comptes demo avec des données complètes :

```bash
cd backend
node seed-demo.js
```

**Comptes créés :**
- **Admin** : `admin@demo.com` / `admin123`
- **Client 1** : `client1@demo.com` / `client123` (Épicerie du Centre - Paris)
- **Client 2** : `client2@demo.com` / `client123` (Super Marché Lyon)
- **Client 3** : `client3@demo.com` / `client123` (Fruits & Légumes Marseille)

Voir `COMPTES_DEMO.md` pour plus de détails.

### Créer un compte client manuellement
1. Aller sur `/register`
2. Remplir le formulaire d'inscription
3. Un compte CLIENT est créé automatiquement

### Se connecter en tant qu'admin
Utiliser le compte demo `admin@demo.com` / `admin123` ou créer un utilisateur avec le rôle `ADMIN` en base de données

## 📊 Modèle de Données

### User
- Informations d'authentification
- Rôle (ADMIN ou CLIENT)

### Shop
- Informations du magasin client
- Lié à un User

### Product
- Informations produit
- Prix HT, taux TVA, unité
- Photo optionnelle
- Statut actif/inactif

### Order
- Commande d'un magasin
- Statut (NEW, PREPARATION, LIVRAISON, LIVREE, ANNULEE)
- Totaux HT, TVA, TTC calculés automatiquement

### OrderItem
- Item d'une commande
- Quantité, prix, totaux

## 🔒 Sécurité

- ✅ Mots de passe hashés avec bcrypt
- ✅ Authentification JWT
- ✅ Protection des routes par rôle
- ✅ Validation des données (express-validator)
- ✅ CORS configuré
- ✅ Préparation RGPD (données clients)

## 📝 Format des Données

- **Dates** : Format français (JJ/MM/AAAA)
- **Prix** : Format français avec €
- **TVA** : 5,5% ou 20% (configurable par produit)
- **Devise** : Euro (€)

## 🧪 Exemples de Données

### Produit exemple
```json
{
  "name": "Tomates",
  "priceHT": 2.50,
  "tvaRate": 5.5,
  "unit": "kg",
  "isActive": true
}
```

### Commande exemple
```json
{
  "items": [
    {
      "productId": "uuid-du-produit",
      "quantity": 5
    }
  ]
}
```

## 🐛 Dépannage

### Erreur de connexion à la base de données
- Vérifier que PostgreSQL est démarré
- Vérifier les credentials dans `backend/.env`
- Vérifier que la base de données existe

### Erreur Prisma
```bash
cd backend
npx prisma generate
npx prisma migrate reset  # Attention : supprime les données
```

### Erreur CORS
- Vérifier que le proxy est configuré dans `frontend/package.json`
- Vérifier l'URL de l'API dans `frontend/src/services/api.js`

### Photos non affichées
- Vérifier que le dossier `backend/uploads/products` existe
- Vérifier les permissions d'écriture
- Vérifier l'URL dans le frontend (http://localhost:5000)

## 📦 Production

### Déploiement sur VPS

Pour déployer sur un serveur VPS, consultez le guide complet :
- **[GUIDE_DEPLOIEMENT_VPS.md](./GUIDE_DEPLOIEMENT_VPS.md)** - Guide complet de déploiement VPS

**Démarrage rapide :**
```bash
# 1. Sur le serveur VPS
sudo bash scripts/setup-vps.sh

# 2. Configurer ecosystem.config.js avec vos variables d'environnement
# 3. Configurer nginx.conf avec votre domaine
# 4. Démarrer l'application
pm2 start ecosystem.config.js
```

### Déploiement sur Render

Pour déployer sur Render, utilisez le fichier `render.yaml` :
- Le fichier `render.yaml` est déjà configuré
- Connectez votre repository GitHub à Render
- Render détectera automatiquement la configuration

### Build frontend
```bash
cd frontend
npm run build
```

### Variables d'environnement production
- `NODE_ENV=production`
- `DATABASE_URL` avec credentials production
- `JWT_SECRET` fort et sécurisé
- `FRONTEND_URL` avec le domaine de production
- Configurer CORS pour le domaine de production

## 📄 Licence

Projet privé - Tous droits réservés

## 👥 Support

Pour toute question ou problème, contacter l'équipe de développement.

