# Audit détaillé page par page

**Date :** 2026-01-24  
**Périmètre :** Frontend (React) + APIs utilisées.

---

## 1. Problèmes transversaux

### 1.1 Layout / En-tête

| Élément | Problème | Détail |
|--------|----------|--------|
| Affichage utilisateur | **Bug** | `Layout` utilise `user.firstName` et `user.lastName`. L’API renvoie `user.name` (nom complet). → Affichage "undefined undefined" dans la barre supérieure. |
| Avatar header | Manque | Pas d’avatar dans le header ; uniquement initiales. Possibilité d’utiliser `user.avatarUrl` si présent. |

### 1.2 Structure des réponses API

Les réponses ne contiennent **pas** de propriété `data` au niveau racine :

- **GET /orders** → `{ success, orders, pagination }`
- **GET /shops** → `{ success, shops, pagination }`
- **GET /products** → `{ success, products, pagination }`
- **GET /admin/users** → `{ success, users, ... }` (à confirmer)
- **GET /admin/clients** → utilise `/shops` → `{ success, shops, pagination }`

De nombreuses pages font `response.data` ou `const { data } = await getX()` puis utilisent `data` comme liste. Il faut utiliser `response.orders`, `response.shops`, `response.products`, etc.

### 1.3 Statuts de commande (casse)

Le backend utilise des statuts **MAJUSCULES** (ex. `NEW`, `LIVREE`, `PREPARATION`, `LIVRAISON`). Plusieurs écrans comparent avec des libellés français en minuscules (`'livrée'`, `'envoyée'`, `'confirmée'`, `'en_préparation'`, `'prête'`).  
→ Les filtres / stats par statut peuvent ne jamais matcher.

### 1.4 Magasins (shops) selon le rôle

- **GET /shops** : réservé aux **ADMIN** (`requireAdmin`).
- **GET /api/client/shops** : pour les **CLIENT**, basé sur `req.context.accessibleShops`.

Le frontend utilise partout `getStores()` → `/shops`. Les rôles **CLIENT** et **MANAGER** reçoivent donc 403 sur cette route.  
→ StoreContext, Client Dashboard, Client Orders, Client Stores, Manager Dashboard, etc. sont impactés.

### 1.5 StoreContext

- Appelle `getStores()` (donc `/shops`) pour tous les rôles → 403 pour CLIENT/MANAGER.
- Filtre par `user.clientId` et `user.storeId`. Le modèle `User` n’a ni `clientId` ni `storeId` ; les accès se font via organisations / memberships.
- Utilise `response.data` alors que l’API renvoie `shops`.

### 1.6 User sans firstName / lastName

L’objet `user` issu de l’auth a `name`, `email`, etc., mais pas `firstName` / `lastName`.  
Les pages **Users** (Admin, Client) qui affichent ou éditent `user.firstName` / `user.lastName` travaillent avec des champs inexistants (sauf si mappage côté frontend).

---

## 2. Pages d’authentification

### 2.1 Login (`/login`)

| Point | Statut | Détail |
|-------|--------|--------|
| Route | OK | Accessible sans auth. |
| Formulaire login | OK | Email, mot de passe, validation basique. |
| Formulaire register | OK | Name, email, password, confirm, phone, shopName, address, city, postalCode. |
| `register` API | OK | Utilise `register` → `POST /auth/register`. |
| `login` API | OK | Utilise `login` → `POST /auth/login`, gère `requiresAdminApproval`, `requiresEmailVerification`. |
| Email non vérifié | OK | Alerte + bouton « Renvoyer l’email ». Gestion « déjà vérifié » en succès. |
| Redirection | OK | `getDefaultRouteForRole(result.user.role)` après login réussi. |
| Erreurs | À améliorer | `catch` : `showError('Erreur lors de la connexion')` générique ; `console.error` en dev. |

### 2.2 VerifyEmail (`/verify-email`)

| Point | Statut | Détail |
|-------|--------|--------|
| Route | OK | Accessible avec ou sans auth (déclaré dans les deux blocs). |
| Token | OK | `searchParams.get('token')`, appel `verifyEmail(token)`. |
| Rafraîchissement user | OK | Si token en localStorage, `getMe()` puis `userUpdated` pour mettre à jour email vérifié. |
| Boutons | OK | « Continuer vers l’application » / « Se connecter » selon présence du token. |
| UX | Mineur | Si non connecté, les deux boutons mènent au login ; redondant mais acceptable. |

---

## 3. Pages ADMIN

### 3.1 Dashboard (`/admin/dashboard`)

| Point | Problème | Détail |
|-------|----------|--------|
| API | Bug | `getClients()` → `/shops` → `{ shops }`. Utilise `clientsRes.data` → undefined. |
| API | Bug | `getStores()` → `{ shops }`. Utilise `storesRes.data` → undefined. |
| API | Bug | `getOrders()` → `{ orders, pagination }`. Utilise `ordersRes.data` → undefined. Idem pour users/products. |
| Stats | Bug | `stats.clients`, `stats.stores`, etc. restent à 0 ; `orders` peut faire planter si `.filter` sur undefined. |
| Commission | Bug | Filtre `o.status === 'livrée'` alors que backend = `LIVREE`. |
| Liens | OK | Cartes cliquables vers les bonnes routes admin. |
| OrderTimeAlert | OK | Alerte horaires de réception des commandes. |

### 3.2 Clients (`/admin/clients`)

| Point | Statut | Détail |
|-------|--------|--------|
| API | Incohérence | `getClients` appelle `/shops`. Ce sont des magasins, pas des "clients" au sens org. |
| Données | À vérifier | Utilise `response` de `getClients` ; s’attend probablement à une liste. Adapter au format `{ shops }`. |

### 3.3 Magasins / Stores (`/admin/stores`)

| Point | Statut | Détail |
|-------|--------|--------|
| API | OK | `getStores`, `getClients`, `getUsers` pour peupler modales etc. |
| Données | Bug | Même souci `response.data` vs `response.shops` / `response.users`. |

### 3.4 Commandes (`/admin/orders`)

| Point | Problème | Détail |
|-------|----------|--------|
| API | Bug | `const { data } = await getOrders()` → `data` inexistant. Il faut `response.orders`. |
| Pagination | À vérifier | Utilise `pagination` si conforme à l’API. |

### 3.5 Agrégation (`/admin/orders/aggregate`)

| Point | Problème | Détail |
|-------|----------|--------|
| API | Bug | `const { data } = await getOrders({ status: 'NEW' })` → idem, utiliser `orders`. |

### 3.6 Commandes fournisseur (`/admin/supplier-orders`)

| Point | Problème | Détail |
|-------|----------|--------|
| API | Bug | `const { data } = await getOrders({ status: 'AGGREGATED' })` → utiliser `orders`. |

### 3.7 Produits (`/admin/products`)

| Point | Statut | Détail |
|-------|--------|--------|
| API | À vérifier | `getProducts(params)`. Format `{ products, pagination }`. S’assurer que la page utilise `products` et non `data`. |

### 3.8 Paramètres (`/admin/settings`)

| Point | Statut | Détail |
|-------|--------|--------|
| Profil | OK | `updateUserProfile`, `getMe`, avatar, vérification email. |
| Mot de passe | OK | `changeUserPassword(prev, new)` après correctif. |
| Settings système | OK | `getSettings` / `updateSettings` (onglets général, fiscal, etc.). |
| Gestion erreurs | OK | Messages toast, pas de blocage si settings vides. |

### 3.9 Utilisateurs (`/admin/users`)

| Point | Problème | Détail |
|-------|----------|--------|
| Affichage | Bug | Utilise `user.firstName`, `user.lastName` alors que l’API renvoie `name`. |
| Filtres / recherche | À vérifier | Recherche sur `user.name` ; si backend envoie `firstName`/`lastName`, adapter. |

### 3.10 Rapports, Analytics, Exports, etc.

| Page | Problème | Détail |
|------|----------|--------|
| Reports | OK backend | `/reports/clients` corrigé (organisation au lieu de client). |
| Reports | API | Utilise `getOrdersReport`, `getStoresReport`, etc. Vérifier formats et champs (ex. `period`). |
| Analytics | API | `getProductsReport`, `getClientsReport`. Erreurs 500 possibles si paramètres ou modèles incorrects. |

### 3.11 Autres pages Admin

- **Categories, Pricing, Suppliers, Sales, Invoices, Returns, Payments, Notifications** : audit similaire (formats API, `.data` vs `.shops`/`.orders`/etc., gestion d’erreurs).

---

## 4. Pages CLIENT

### 4.1 Dashboard (`/client/dashboard`)

| Point | Problème | Détail |
|-------|----------|--------|
| Shops | Bug | `getStores()` → 403 pour CLIENT. Il faudrait `/client/shops` ou équivalent. |
| Orders | Contexte | `getOrders(params)` avec `clientId` / `storeId`. `user.clientId` n’existe pas. |
| Stats | Bug | Filtres sur `o.status` en minuscules (`'livrée'`, `'envoyée'`, etc.) au lieu de `LIVREE`, etc. |
| StoreSelector | OK | Affiché si plusieurs magasins (mais magasins non chargés si 403). |

### 4.2 Commandes (`/client/orders`)

| Point | Problème | Détail |
|-------|----------|--------|
| Shops | Bug | `getStores()` → 403. |
| Orders | Format | Fallback `response.orders || ... || response.shops` → utiliser `response.orders` explicitement. |
| Détail commande | Bug | `handleViewOrder` → `navigate(\`/client/orders/${order.id}\`)`. **Aucune route** `/client/orders/:id` définie → redirection * ou 404. |
| Création | OK | Lien vers `/client/orders/create` (route prévue). |

### 4.3 Création de commande (`/client/orders/create`)

| Point | Statut | Détail |
|-------|--------|--------|
| Route | OK | Déclarée uniquement pour CLIENT. |
| Shops / Products | Bug | `getStores()`, `getProducts()`. CLIENT 403 sur `/shops`. |

### 4.4 Magasins (`/client/stores`)

| Point | Problème | Détail |
|-------|----------|--------|
| API | Bug | `getStores()` → 403. Devrait utiliser `/client/shops`. |
| Données | Bug | `response.orders || ... || response.shops` pour des magasins ; incohérent. |
| Stats par magasin | Bug | `ordersResponse.data` ; API renvoie `orders`. Statuts en minuscules. |

### 4.5 Produits, Stocks, Livraisons, Finances, etc.

- Mêmes thèmes : **getStores** → 403, usage de `response.data` au lieu de `response.shops` / `response.orders`, statuts en minuscules si utilisés.

### 4.6 Paramètres (`/client/settings`)

| Point | Statut | Détail |
|-------|--------|--------|
| Profil / mot de passe / avatar | OK | Même logique que Admin Settings, correctifs appliqués. |

### 4.7 Users CLIENT

- Utilise `getUsers`, `getStores`. Adapter à l’API client (magasins) et au format des réponses.

---

## 5. Pages MANAGER

### 5.1 Dashboard (`/manager/dashboard`)

| Point | Problème | Détail |
|-------|----------|--------|
| Shops | Bug | `getStores({ managerId: user?.id })` → `/shops` ne gère pas `managerId` ; de plus, 403 pour MANAGER. |
| Orders | Bug | Boucle sur `getOrders({ storeId })` par magasin ; si aucun magasin chargé, vide. |
| Statuts | Bug | `'livrée'`, `'confirmée'`, `'en_préparation'` au lieu de `LIVREE`, etc. |

### 5.2 Magasins (`/manager/stores`)

| Point | Problème | Détail |
|-------|----------|--------|
| API | Bug | `getStores({ managerId })` → 403 + paramètre ignoré. Il faudrait une API type “mes magasins” pour MANAGER. |

### 5.3 Commandes, Stocks, Ventes, Rapports, Objectifs, etc.

- Même dépendance aux magasins et aux formats API. Sans endpoint dédié MANAGER pour les magasins, ces pages restent fragiles ou vides.

### 5.4 Paramètres (`/manager/settings`)

| Point | Statut | Détail |
|-------|--------|--------|
| Profil / mot de passe / avatar | OK | Correctifs appliqués. |
| Logs | À nettoyer | Un `console.log` restant (formulaire mis à jour). |

---

## 6. Page Help (`/help`)

| Point | Statut | Détail |
|-------|--------|--------|
| Route | OK | Globale, accessible à tous les rôles authentifiés. |
| Contenu | À vérifier | Selon implémentation (texte, liens, etc.). |

---

## 7. Composants et contextes

### 7.1 ProtectedRoute

- Vérification `requiredRole`, `requiredResource` / `requiredAction`.
- En cas de rôle non autorisé : redirection vers **LOGIN**. Pour un utilisateur connecté mais sans droit, un message « Accès refusé » serait souvent préférable.

### 7.2 OrderStatusBadge, OrderTimeAlert, etc.

- À vérifier selon utilisation des statuts (MAJUSCULES vs libellés affichés).

### 7.3 NotificationCenter, GlobalSearch

- Pas d’audit spécifique ici ; à traiter si besoin.

---

## 8. Synthèse des correctifs prioritaires

1. **Layout** : utiliser `user.name` (ou split prénom/nom) au lieu de `user.firstName` / `user.lastName` ; optionnel : afficher `user.avatarUrl` dans le header.
2. **Réponses API** : remplacer systématiquement `response.data` / `const { data }` par les bons champs (`orders`, `shops`, `products`, `users`, etc.) selon l’endpoint.
3. **Statuts commande** : utiliser les valeurs backend (`NEW`, `LIVREE`, `PREPARATION`, etc.) partout où l’on filtre ou compare.
4. **Magasins CLIENT/MANAGER** :
   - Introduire `getClientShops()` (ou équivalent) appelant `/client/shops`.
   - StoreContext : utiliser cette API pour CLIENT (et équivalent MANAGER si existant).
   - Remplacer `getStores()` par ces APIs dans toutes les pages CLIENT / MANAGER concernées.
5. **Route manquante** : ajouter `/client/orders/:id` (détail commande) ou adapter la navigation pour ne pas aller vers une route inexistante.
6. **Users (Admin/Client)** : aligner affichage et formulaires sur `user.name` ou sur un mapping explicite firstName/lastName si fourni par l’API.
7. **Nettoyage** : supprimer les `console.log` / `console.error` de debug en production (ex. Manager Settings).
8. **Erreurs API** : messages utilisateur plus explicites (ex. Login) et gestion centralisée si possible.

---

## 9. Pages sans route (orfelines ou sous-pages)

- **Admin** : `DeliveriesManagement`, `PromotionsManagement`, `ReportsAdvanced`, `ReturnsManagement`, `StockManagement` (peuvent être onglets ou sous-vues ; à mapper aux routes réelles).
- **Client** : `Analytics.jsx` existe mais n’a pas de route dans `App.jsx`.
- **Manager** : `Analytics.jsx` idem.

À clarifier selon le métier : soit ajouter des routes, soit les retirer du périmètre.

---

## 10. Correctifs déjà appliqués (cette session)

| Fichier | Correction |
|---------|------------|
| `Layout.jsx` | Header : `user.name` au lieu de firstName/lastName ; avatar via `user.avatarUrl` ; initiales depuis `name`. |
| `Manager Settings` | Suppression du `console.log` restant. |
| `Admin Dashboard` | `ordersRes.orders`, `clientsRes.shops`, `storesRes.shops`, `usersRes.users`, `productsRes.products` ; statut `LIVREE` pour commission. |
| **Session « maintenant »** | |
| `api/stores.js` | Ajout de `getClientShops()` → `GET /client/shops`. |
| `StoreContext` | CLIENT → `getClientShops`, autres → `getStores` ; `response.shops` ; filtre MANAGER/sous-rôles par `storeId`. |
| `Admin` Orders, OrdersAggregate, SupplierOrders | `.orders` / `.shops` / `.suppliers` / `.order` au lieu de `.data`. |
| `Client` Dashboard, Orders, Stores, Finances, Products, Stocks, OrderCreate | `getClientShops`, `.orders` / `.shops` / `.products` ; statuts `LIVREE`, `PREPARATION`, etc. |
| `Client` Preparation, Deliveries | `.orders`, statuts enum ; `getOrdersToPrepare` / `getOrdersInPreparation` avec `storeId` et `PREPARATION` / `SUPPLIER_ORDERED`. |
| `api/orders.js` | `getOrdersToPrepare(storeId)`, `getOrdersInPreparation(storeId)`, statuts `SUPPLIER_ORDERED` / `PREPARATION`. |
| `OrderStatusBadge` | Support des enum backend (NEW, LIVREE, PREPARATION, etc.) + anciens libellés. |
| `OrderDetail.jsx` | Nouvelle page détail commande CLIENT. |
| `App.jsx` | Route `ROUTES.CLIENT.ORDER_DETAIL` → `OrderDetail`. |
| `Admin/Client Users` | `user.name` pour affichage/recherche ; formulaire firstName/lastName dérivés de `name` ; envoi `name` à l’API. |
| `Manager` Dashboard, Stores, Sales, Users | `.shops` / `.orders` / `.users` / `.sales` ; statuts enum. |

---

*Document généré dans le cadre de l’audit fonctionnel du frontend. À mettre à jour après chaque vague de correctifs.*
