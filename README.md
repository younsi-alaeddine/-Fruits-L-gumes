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

### 🚀 Démarrage Rapide pour Nouveaux Utilisateurs

1. **Premier lancement :**
   ```bash
   # Installer les dépendances
   cd backend && npm install
   cd ../frontend && npm install
   
   # Configurer la base de données
   cd ../backend
   npx prisma generate
   npx prisma migrate dev
   
   # Créer un admin
   npm run create-admin
   ```

2. **Démarrer l'application :**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

3. **Première connexion :**
   - Aller sur http://localhost:3000
   - Se connecter avec le compte admin créé
   - Ou créer un compte client via `/register`

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

## 📖 Guide d'Utilisation

### 🎭 Rôles Utilisateurs et Permissions

L'application supporte plusieurs rôles avec des permissions différentes :

| Rôle | Accès | Permissions Principales |
|------|-------|------------------------|
| **CLIENT** | Dashboard client | Passer commandes, voir historique, consulter factures, messages |
| **ADMIN** | Dashboard admin complet | Toutes les permissions (produits, commandes, clients, stats, paramètres) |
| **PREPARATEUR** | Dashboard préparateur | Voir commandes à préparer, changer statut PREPARATION → LIVRAISON |
| **LIVREUR** | Dashboard livreur | Voir livraisons assignées, changer statut LIVRAISON → LIVREE |
| **COMMERCIAL** | Dashboard commercial | Gestion clients, devis, commandes, statistiques ventes |
| **STOCK_MANAGER** | Dashboard stock | Gestion stock, alertes, ajustements |
| **FINANCE** | Dashboard finance | Facturation, paiements, rapports financiers |
| **MANAGER** | Dashboard manager | Vue d'ensemble, statistiques, rapports consolidés |

**Routes par rôle :**
- `/client/*` : Accessible aux CLIENT
- `/admin/*` : Accessible aux ADMIN
- `/preparateur/*` : Accessible aux PREPARATEUR
- `/livreur/*` : Accessible aux LIVREUR
- `/commercial/*` : Accessible aux COMMERCIAL
- `/stock/*` : Accessible aux STOCK_MANAGER
- `/finance/*` : Accessible aux FINANCE
- `/manager/*` : Accessible aux MANAGER

---

## 🔄 Déroulement du Programme - Workflow Complet

### 📋 Processus de Commande (Cycle de Vie)

#### Étape 1 : Inscription Client
1. Le client accède à la page d'inscription (`/register`)
2. Remplit le formulaire :
   - Nom et prénom
   - Email (unique)
   - Mot de passe
   - Informations du magasin (nom, adresse, ville, code postal, téléphone)
3. Le compte CLIENT est créé automatiquement
4. Le client reçoit un email de confirmation (si configuré)

#### Étape 2 : Connexion
1. Accès à la page de connexion (`/login`)
2. Saisie de l'email et du mot de passe
3. Authentification JWT
4. Redirection selon le rôle :
   - **CLIENT** → Dashboard client (`/client`)
   - **ADMIN** → Dashboard admin (`/admin`)
   - Autres rôles → Leurs dashboards respectifs

#### Étape 3 : Consultation du Catalogue (Client)
1. Le client accède à son dashboard
2. Visualise le catalogue de produits disponibles
3. Peut filtrer par :
   - Catégories (Fruits, Légumes, Herbes, etc.)
   - Sous-catégories
   - Recherche textuelle
4. Chaque produit affiche :
   - Photo
   - Nom
   - Prix HT
   - Prix TTC (avec TVA)
   - Unité (kg, pièce, caisse, botte)
   - Stock disponible

#### Étape 4 : Création d'une Commande
1. **Ajout au panier** :
   - Le client clique sur un produit
   - Sélectionne la quantité désirée
   - Ajoute au panier

2. **Gestion du panier** :
   - Visualisation des produits sélectionnés
   - Modification des quantités
   - Suppression d'articles
   - Calcul automatique des totaux (HT, TVA, TTC)

3. **Validation de commande** :
   - Le client clique sur "Passer commande"
   - La commande est créée avec le statut **NEW** (Nouvelle)
   - Numéro de commande généré automatiquement
   - Notification envoyée à l'admin

#### Étape 5 : Traitement de la Commande (Admin/Préparateur)

**Statut : NEW → PREPARATION**
1. L'admin ou le préparateur voit la nouvelle commande
2. Vérifie la disponibilité des produits
3. Change le statut à **PREPARATION**
4. Notification envoyée au client

**Statut : PREPARATION → LIVRAISON**
1. Les produits sont préparés
2. Le statut passe à **LIVRAISON**
3. Un créneau de livraison est planifié (date et heure)
4. Un livreur est assigné (optionnel)
5. Notification envoyée au client

**Statut : LIVRAISON → LIVREE**
1. Le livreur effectue la livraison
2. Le statut passe à **LIVREE**
3. La facture est générée automatiquement
4. Notification envoyée au client

**Paiement** :
- Après livraison, le paiement peut être enregistré
- Statuts de paiement : EN_ATTENTE, PARTIEL, PAYE
- Méthodes : CASH, CARD, TRANSFER, CHEQUE

---

### 👨‍💼 Utilisation pour l'Administrateur

#### Dashboard Admin
- **Statistiques globales** :
  - Chiffre d'affaires du jour/mois
  - Nombre de commandes
  - Commandes en attente
  - Graphiques de performance

- **Gestion des Produits** :
  1. Accéder à "Produits" dans le menu
  2. Créer un nouveau produit :
     - Nom, catégorie, sous-catégorie
     - Prix HT
     - Taux de TVA (5,5% ou 20%)
     - Unité de mesure
     - Stock initial
     - Photo (upload)
  3. Modifier un produit existant
  4. Désactiver/Activer un produit

- **Gestion des Commandes** :
  1. Visualiser toutes les commandes
  2. Filtrer par :
     - Client
     - Date (jour, semaine, mois)
     - Statut
  3. Modifier le statut d'une commande
  4. Voir les détails (produits, quantités, totaux)
  5. Télécharger le bon de commande (PDF)

- **Gestion des Clients** :
  1. Voir la liste des magasins clients
  2. Voir les détails d'un client
  3. Historique des commandes par client
  4. Statistiques par client

- **Stock** :
  - Visualiser les niveaux de stock
  - Alertes de stock faible
  - Ajustements de stock

- **Facturation** :
  - Génération automatique après livraison
  - Visualisation des factures
  - Téléchargement PDF
  - Export comptable

- **Rapports** :
  - Rapports de vente
  - Rapports par période
  - Export Excel/PDF

---

### 🏪 Utilisation pour le Client (Magasin)

#### Dashboard Client
- Vue d'ensemble de ses commandes
- Statistiques personnelles
- Commandes récentes

#### Passer une Commande
1. Accéder au catalogue
2. Parcourir les produits disponibles
3. Ajouter les produits au panier avec les quantités
4. Vérifier le panier (totaux HT, TVA, TTC)
5. Valider la commande

#### Suivi des Commandes
1. Accéder à "Mes Commandes"
2. Voir toutes ses commandes avec leur statut :
   - **NEW** : Nouvelle commande (en attente)
   - **PREPARATION** : En cours de préparation
   - **LIVRAISON** : En cours de livraison
   - **LIVREE** : Commande livrée
   - **ANNULEE** : Commande annulée
3. Voir les détails de chaque commande
4. Recevoir des notifications lors des changements de statut

#### Commandes Récurrentes
1. Créer une commande récurrente
2. Définir la fréquence (hebdomadaire, mensuelle)
3. Définir le jour de la semaine ou du mois
4. Sélectionner les produits et quantités
5. La commande sera créée automatiquement selon la programmation

#### Finances
- Visualiser sa situation financière
- Consulter les factures
- Télécharger les factures PDF
- Voir l'historique des paiements
- Solde dû

#### Messages
- Communication avec l'admin
- Recevoir des messages concernant les commandes

---

### 🔄 Workflow Détaillé des Statuts de Commande

```
┌─────────┐
│   NEW   │  ← Commande créée par le client
└────┬────┘
     │
     ▼
┌─────────────┐
│ PREPARATION │  ← Admin/Préparateur commence la préparation
└────┬────────┘
     │
     ▼
┌───────────┐
│ LIVRAISON │  ← Commande préparée, en cours de livraison
└────┬──────┘
     │
     ▼
┌─────────┐
│ LIVREE  │  ← Commande livrée, facture générée
└─────────┘

     OU

┌─────────┐
│ANNULEE  │  ← Commande annulée (peut être annulée à tout moment)
└─────────┘
```

---

### 💼 Fonctionnalités Avancées

#### Devis (Quotes)
1. Le client peut demander un devis
2. L'admin crée un devis avec produits et prix
3. Le devis est envoyé au client
4. Le client peut accepter → Converti en commande
5. Statuts : DRAFT, SENT, ACCEPTED, REJECTED, CONVERTED

#### Promotions
1. L'admin crée une promotion (réduction, dates)
2. Les produits en promotion sont marqués
3. Réduction appliquée automatiquement

#### Notifications
- Notifications en temps réel pour :
  - Changement de statut de commande
  - Nouveaux messages
  - Alertes de stock
  - Promotions

#### Audit Trail
- Toutes les actions importantes sont enregistrées
- Consultation dans les logs d'audit (admin)
- Historique complet des modifications

---

## 📊 Modèle de Données

### User
- Informations d'authentification
- Rôle (ADMIN, CLIENT, PREPARATEUR, LIVREUR, etc.)

### Shop
- Informations du magasin client
- Lié à un User

### Product
- Informations produit
- Prix HT, taux TVA, unité
- Photo optionnelle
- Statut actif/inactif
- Stock disponible

### Order
- Commande d'un magasin
- Statut (NEW, PREPARATION, LIVRAISON, LIVREE, ANNULEE)
- Statut de paiement (EN_ATTENTE, PARTIEL, PAYE)
- Totaux HT, TVA, TTC calculés automatiquement

### OrderItem
- Item d'une commande
- Quantité, prix, totaux

## 📱 Utilisation Mobile et Responsive

L'application est entièrement responsive et fonctionne sur :
- 📱 **Smartphones** : Interface optimisée tactile
- 📱 **Tablettes** : Vue adaptée format tablette
- 💻 **Ordinateurs** : Interface complète desktop

### Navigation Mobile
- Menu hamburger pour accéder aux sections
- Interface tactile optimisée
- Gestes de navigation intuitifs

---

## 🔧 Fonctionnalités Techniques

### Calculs Automatiques
- **Totaux HT** : Calculé automatiquement (quantité × prix HT)
- **TVA** : Calculée selon le taux du produit (5,5% ou 20%)
- **Totaux TTC** : HT + TVA

### Validation des Données
- Validation côté client (React)
- Validation côté serveur (Express-validator)
- Messages d'erreur clairs

### Sécurité
- Authentification JWT avec refresh token
- Mots de passe hashés (bcrypt)
- Protection CSRF
- Rate limiting sur les routes sensibles
- Sanitization des entrées utilisateur

---

## 📋 Exemples de Cas d'Usage

### Cas 1 : Client passe sa première commande
1. Client s'inscrit avec ses informations
2. Reçoit confirmation par email
3. Se connecte à son compte
4. Parcourt le catalogue
5. Ajoute 5kg de tomates, 3kg de pommes au panier
6. Valide la commande (total calculé : 25€ HT, 1,38€ TVA, 26,38€ TTC)
7. Reçoit une notification : "Commande #123 créée"
8. Suit l'évolution sur "Mes Commandes"

### Cas 2 : Admin traite une commande
1. Admin voit la notification : "Nouvelle commande #123"
2. Ouvre la commande, vérifie les produits
3. Change le statut à "PREPARATION"
4. Client reçoit notification : "Votre commande est en préparation"
5. Préparateur prépare les produits
6. Admin change le statut à "LIVRAISON"
7. Planifie la livraison pour demain 10h-12h
8. Assigne un livreur
9. Client reçoit notification avec créneau de livraison
10. Livreur livre la commande
11. Admin change le statut à "LIVREE"
12. Facture générée automatiquement
13. Client peut télécharger la facture

### Cas 3 : Client configure une commande récurrente
1. Client crée une commande récurrente hebdomadaire
2. Configure : Chaque lundi à 9h
3. Sélectionne les produits : 10kg tomates, 5kg pommes
4. La commande est créée automatiquement chaque lundi
5. Le client reçoit une notification chaque semaine

---

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

## 📚 Récapitulatif des Fonctionnalités

### ✅ Fonctionnalités Principales

| Fonctionnalité | Client | Admin | Autres Rôles |
|----------------|--------|-------|--------------|
| Passer commande | ✅ | - | - |
| Voir catalogue | ✅ | ✅ | ✅ (selon rôle) |
| Gérer produits | - | ✅ | - |
| Gérer commandes | Voir ses commandes | Gérer toutes | Selon rôle |
| Gérer clients | - | ✅ | Commercial |
| Gérer stock | - | ✅ | Stock Manager |
| Facturation | Voir factures | Générer factures | Finance |
| Rapports | Ses stats | Tous rapports | Rapports spécifiques |
| Messages | ✅ | ✅ | ✅ |
| Notifications | ✅ | ✅ | ✅ |

### 📊 Statuts de Commande

| Statut | Description | Qui peut changer |
|--------|-------------|------------------|
| **NEW** | Commande créée, en attente | Admin, Préparateur |
| **PREPARATION** | En cours de préparation | Admin, Préparateur |
| **LIVRAISON** | En cours de livraison | Admin, Livreur |
| **LIVREE** | Commande livrée | Admin, Livreur |
| **ANNULEE** | Commande annulée | Admin, Client (avant préparation) |

### 💰 Statuts de Paiement

| Statut | Description |
|--------|-------------|
| **EN_ATTENTE** | Paiement non effectué |
| **PARTIEL** | Paiement partiel |
| **PAYE** | Commande payée intégralement |

---

## 🎓 Guide de Formation Utilisateur

### Pour les Clients (10 minutes)
1. S'inscrire et créer un compte
2. Se connecter
3. Parcourir le catalogue
4. Ajouter des produits au panier
5. Passer une commande
6. Suivre le statut de la commande
7. Consulter les factures

### Pour les Administrateurs (30 minutes)
1. Se connecter
2. Créer des produits (nom, prix, catégorie, photo)
3. Gérer le stock
4. Voir les nouvelles commandes
5. Changer le statut des commandes
6. Planifier les livraisons
7. Générer des factures
8. Consulter les statistiques
9. Gérer les clients
10. Créer des promotions

---

## 🎯 Fonctionnalités Manquantes par Rôle

### 📊 Vue d'Ensemble

| Rôle | Pages Existantes | Pages Manquantes | Priorité |
|------|------------------|------------------|----------|
| **CLIENT** | 7 | ~10 | 🔴 HAUTE |
| **ADMIN** | 15 | ~12 | 🟡 MOYENNE |
| **PREPARATEUR** | 2 | ~6 | 🔴 HAUTE |
| **LIVREUR** | 2 | ~8 | 🔴 HAUTE |
| **COMMERCIAL** | 2 | ~8 | 🔴 HAUTE |
| **STOCK_MANAGER** | 2 | ~10 | 🔴 HAUTE |
| **FINANCE** | 2 | ~9 | 🔴 HAUTE |
| **MANAGER** | 2 | ~7 | 🟡 MOYENNE |

### 👤 CLIENT - Fonctionnalités Manquantes

1. **Catalogue dédié** (`/client/catalog`) - Vue catalogue avec filtres avancés, recherche, tri
2. **Panier avancé** (`/client/cart`) - Gestion dédiée du panier, sauvegarde
3. **Devis** (`/client/quotes`) - Demander et gérer les devis
4. **Suivi livraison** (`/client/deliveries`) - Suivi GPS, statut temps réel
5. **Adresses** (`/client/addresses`) - Gestion de plusieurs adresses
6. **Statistiques** (`/client/statistics`) - Graphiques de consommation
7. **Promotions** (`/client/promotions`) - Voir toutes les promotions
8. **Avis produits** - Noter et commenter les produits
9. **Support** (`/client/support`) - FAQ, centre d'aide
10. **Export données** - Export commandes/factures

### 📦 PREPARATEUR - Fonctionnalités Manquantes

1. **Liste commandes** (`/preparateur/orders`) - Commandes à préparer avec filtres
2. **Fiche préparation** (`/preparateur/preparation/:id`) - Détails avec validation
3. **Gestion stock** - Déduction automatique lors de la préparation
4. **Statistiques** (`/preparateur/statistics`) - Performance, temps moyen
5. **Historique** (`/preparateur/history`) - Historique des préparations
6. **Notifications** - Alertes nouvelles commandes en temps réel

### 🚚 LIVREUR - Fonctionnalités Manquantes

1. **Liste livraisons** (`/livreur/deliveries`) - Livraisons assignées avec détails
2. **Optimisation itinéraire** (`/livreur/route`) - Calcul trajet optimal, carte
3. **Suivi GPS** (`/livreur/tracking`) - Géolocalisation temps réel
4. **Fiche livraison** (`/livreur/delivery/:id`) - Signature électronique, photo
5. **Paiements** - Enregistrer paiements à la livraison
6. **Statistiques** (`/livreur/statistics`) - Performance, kilomètres
7. **Historique** (`/livreur/history`) - Historique complet
8. **Incidents** (`/livreur/incidents`) - Signaler incidents de livraison

### 💼 COMMERCIAL - Fonctionnalités Manquantes

1. **Gestion clients** (`/commercial/clients`) - Liste, détails, historique
2. **Gestion devis** (`/commercial/quotes`) - Créer, envoyer, suivre devis
3. **Prospects** (`/commercial/prospects`) - Gestion des prospects
4. **Visites** (`/commercial/visits`) - Planifier et suivre les visites
5. **Objectifs** (`/commercial/objectives`) - Objectifs de vente, commissions
6. **Statistiques** (`/commercial/statistics`) - CA par client, évolution
7. **Promotions** (`/commercial/promotions`) - Promotions ciblées
8. **Rapports** (`/commercial/reports`) - Rapports commerciaux

### 📊 STOCK_MANAGER - Fonctionnalités Manquantes

1. **Gestion stock** (`/stock/products`) - Liste complète avec filtres
2. **Alertes** (`/stock/alerts`) - Ruptures, stock faible
3. **Mouvements** (`/stock/movements`) - Historique entrées/sorties
4. **Réceptions** (`/stock/receptions`) - Enregistrer réceptions
5. **Inventaire** (`/stock/inventory`) - Planifier et effectuer inventaires
6. **Fournisseurs** (`/stock/suppliers`) - Gestion commandes fournisseurs
7. **Prévisions** (`/stock/forecast`) - Prévisions de consommation
8. **Rapports** (`/stock/reports`) - Rapports de stock
9. **Emplacements** (`/stock/locations`) - Gestion des emplacements
10. **Lots** - Gestion des lots et dates de péremption

### 💰 FINANCE - Fonctionnalités Manquantes

1. **Factures** (`/finance/invoices`) - Gestion complète, relances
2. **Paiements** (`/finance/payments`) - Rapprochements, remboursements
3. **Comptabilité** (`/finance/accounting`) - Écritures, grand livre
4. **Trésorerie** (`/finance/cashflow`) - Prévisions, flux de trésorerie
5. **Relances** (`/finance/reminders`) - Factures impayées, relances
6. **Rapports** (`/finance/reports`) - Bilan, compte de résultat, TVA
7. **Règlements** (`/finance/settlements`) - Avoirs, notes de crédit
8. **Intégration** (`/finance/integration`) - Export comptable, FEC
9. **Taxes** (`/finance/taxes`) - Déclarations TVA

### 👔 MANAGER - Fonctionnalités Manquantes

1. **Vue d'ensemble** (`/manager/overview`) - KPIs globaux consolidés
2. **Équipes** (`/manager/teams`) - Gestion des équipes, performance
3. **Rapports** (`/manager/reports`) - Rapports multi-départements
4. **Objectifs** (`/manager/objectives`) - Définir et suivre objectifs
5. **Analytics** (`/manager/analytics`) - Analyses prédictives, tendances
6. **Alertes** (`/manager/alerts`) - Alertes critiques système
7. **Permissions** (`/manager/permissions`) - Gestion des permissions

### 👨‍💼 ADMIN - Fonctionnalités Manquantes

1. **Devis** (`/admin/quotes`) - Gestion complète des devis
2. **Livraisons** (`/admin/deliveries`) - Liste détaillée, tournées
3. **Retours** (`/admin/returns`) - Gestion retours et réclamations
4. **Fournisseurs** (`/admin/suppliers`) - Gestion des fournisseurs
5. **Tarifs** (`/admin/pricing`) - Tarifs par client, remises
6. **Contrats** (`/admin/contracts`) - Gestion des contrats clients
7. **Alertes** (`/admin/alerts`) - Configuration alertes système
8. **Import/Export** (`/admin/import-export`) - Import CSV/Excel
9. **Templates** (`/admin/templates`) - Templates emails, factures
10. **Backup** (`/admin/backup`) - Sauvegardes et restauration
11. **Intégrations** (`/admin/integrations`) - API externes, webhooks
12. **Multi-entrepôts** - Gestion de plusieurs entrepôts

### 🔄 Fonctionnalités Transversales Manquantes

1. **Recherche globale** - Barre de recherche universelle
2. **Export/Impression** - Export Excel/PDF pour toutes les listes
3. **Notifications avancées** - Centre de notifications amélioré
4. **Calendrier global** (`/calendar`) - Vue calendrier des événements
5. **Chat amélioré** - Chat temps réel avec groupes
6. **Gestion fichiers** (`/files`) - Upload et partage de documents
7. **Dashboard personnalisable** - Widgets configurables
8. **Mode sombre** - Thème sombre/clair
9. **Multi-langue** - Support français/anglais
10. **PWA complète** - Application mobile installable

---

## 📄 Licence

Projet privé - Tous droits réservés

## 👥 Support

Pour toute question ou problème, contacter l'équipe de développement.

