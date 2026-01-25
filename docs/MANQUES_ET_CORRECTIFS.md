# Manques (affichage, pages, logique) – audit et correctifs

**Date :** 2026-01-23

---

## 1. Correctifs appliqués

### 1.1 Affichage

| Problème | Correction |
|----------|------------|
| **Client Stores** – Adresse / contact | Colonnes Adresse et Contact utilisaient `street`, `zipCode`, `email`. API renvoie `address`, `postalCode`, `city`, `contactPhone`, `contactEmail`, `contactPerson`. Affichage corrigé pour utiliser ces champs. |
| **Manager Users** – Données fictives | Utilisation de `mockUsers` et magasins en dur. Remplacement par `getUsers` et `getStores`. Gestion des 403 (message d’erreur, liste vide). |

### 1.2 Pages / routes manquantes

| Problème | Correction |
|----------|------------|
| **Route /client/stores/:id** | Aucune route pour « Voir détails » magasin → 404. **Ajout** de `StoreDetail.jsx`, `getClientShop` (API), `ROUTES.CLIENT.STORE_DETAIL` et route dans `App.jsx`. |
| **Client Orders – filtre magasin depuis URL** | Lien « Commandes » depuis Stores vers `/client/orders?store=xxx` sans lecture de `?store=`. **Ajout** de `useSearchParams`, lecture de `store` au chargement et initialisation de `selectedStoreId` + `localStorage.selectedStoreId`. |

### 1.3 Logique manquante

| Problème | Correction |
|----------|------------|
| **NotificationCenter** | Utilisation de notifications simulées uniquement. **Remplacé** par API réelle : `getNotifications`, `getUnreadCount`, `markAsRead`, `markAllAsRead`, `deleteNotification`. Rafraîchissement au montage et à l’ouverture du panneau. |
| **Header X-Shop-Id** | Le backend s’attend à `X-Shop-Id` pour `activeShopId` (commandes, etc.). L’API front ne l’envoyait pas. **Ajout** dans l’intercepteur axios : envoi de `X-Shop-Id` depuis `localStorage.selectedStoreId` lorsqu’il est présent. |
| **Orders ?store= → localStorage** | Lors de la sélection du magasin depuis l’URL, `selectedStoreId` était mis à jour mais pas `localStorage`. **Ajout** de `localStorage.setItem('selectedStoreId', storeFromUrl)` pour garder la cohérence avec l’intercepteur. |

### 1.4 Manager Users

- Suppression des mocks, utilisation de `getUsers` et `getStores`.
- Filtre par magasin avec liste issue de l’API (ou uniquement « Tous » si 403).
- État vide « Aucun utilisateur trouvé » et message d’erreur en cas d’échec.
- Bouton « Ajouter employé » et actions (Modifier / Rôles / Supprimer) **désactivés** ou à titre indicatif, réservés à l’admin, en attendant une API manager dédiée.

---

## 2. Session « Compléter tout » – correctifs additionnels

### 2.1 Backend

- **`GET /api/manager/shops`** : Liste des magasins accessibles au manager (organisation + memberships). Route `manager.js`, middleware `requireManager`.
- **`GET /api/manager/users`** : Utilisateurs de l’organisation du manager (même org via memberships), avec `store` / `storeId` issus des shop memberships.
- **`GET /api/search?q=...`** : Recherche globale ADMIN (produits, commandes, users, magasins). Route `search.js`, `requireAdmin`. Réponse `{ results: { products, clients, orders, users, stores } }`.

### 2.2 Frontend

- **Manager** : Dashboard, Stores, Sales, Users utilisent `getManagerShops` et `getManagerUsers`. Stores et Users affichent les vraies données.
- **Page Help** : Cartes Documentation / Tutoriels / FAQ cliquables (scroll vers FAQ), Support = `mailto`. FAQ enrichie (commande, admin, livraison, magasins, email vérifié).
- **Recherche globale** : `api/search.js` appelle `GET /search` ; fallback 404/403 avec `results` vides. `GlobalSearch` utilise l’API réelle.
- **StoreContext** : Au chargement des magasins, si `localStorage.selectedStoreId` correspond à un magasin de la liste, on l’utilise pour `selectedStoreId`.

### 2.3 Points restants (mineurs)

- **EmailTemplates** : Fallback conservé si l’API ne renvoie pas le format attendu.
- **Analytics** : `getCustomerBehavior` / `getForecast` restent des stubs côté frontend.
- **Promotions** : « À venir » = statut de promotion, pas une section manquante.

---

## 3. Fichiers modifiés

### Session 1 (audit manques)

- `frontend/src/pages/client/Orders.jsx` – `useSearchParams`, `?store=`, `localStorage`
- `frontend/src/pages/client/Stores.jsx` – Colonnes adresse / contact
- `frontend/src/pages/client/StoreDetail.jsx` – **Création**
- `frontend/src/api/stores.js` – `getClientShop`
- `frontend/src/constants/routes.js` – `STORE_DETAIL`
- `frontend/src/App.jsx` – Route `StoreDetail`
- `frontend/src/components/NotificationCenter.jsx` – API réelle
- `frontend/src/config/api.js` – `X-Shop-Id`
- `frontend/src/pages/manager/Users.jsx` – API réelle, suppression mocks

### Session 2 (« compléter tout »)

- `backend/routes/manager.js` – **Création** (`GET /shops`, `GET /users`)
- `backend/routes/search.js` – **Création** (`GET /?q=`)
- `backend/server.js` – Montage `/api/manager`, `/api/search`
- `frontend/src/api/stores.js` – `getManagerShops`
- `frontend/src/api/users.js` – `getManagerUsers`
- `frontend/src/api/search.js` – `GET /search`, fallback 404/403
- `frontend/src/contexts/StoreContext.jsx` – `getManagerShops` pour MANAGER, init `selectedStoreId` depuis `localStorage`
- `frontend/src/pages/manager/Dashboard.jsx` – `getManagerShops`, parsing orders, statuts `LIVREE`
- `frontend/src/pages/manager/Stores.jsx` – `getManagerShops`, colonnes adresse/contact, recherche
- `frontend/src/pages/manager/Sales.jsx` – `getManagerShops`
- `frontend/src/pages/manager/Users.jsx` – `getManagerUsers` + `getManagerShops`
- `frontend/src/pages/Help.jsx` – Liens, scroll FAQ, FAQ enrichie, Support `mailto`

---

## 4. Vérifications recommandées

1. **Client** : Magasins → « Voir détails » → StoreDetail ; « Commandes » → Orders avec filtre magasin ; Orders avec `?store=` en URL.
2. **Notifications** : Cloche → chargement depuis l’API ; marquer comme lu / tout lire / supprimer.
3. **Manager Users** : Connexion manager → Équipes ; si 403, message d’erreur et liste vide.
4. **X-Shop-Id** : Sélection d’un magasin (StoreSelector ou Stores) puis passage de commande / orders ; vérifier que le backend reçoit bien le magasin actif.
