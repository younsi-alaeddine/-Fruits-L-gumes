# Oublis et problèmes corrigés (par rapport à la version existante)

**Date :** 2026-01-23

---

## 1. Parsing des réponses API

| Fichier | Problème | Correction |
|--------|----------|------------|
| **Admin Users** | `loadStores` utilisait `response.data` (objet complet) au lieu de la liste magasins | `setStores(response?.shops ?? [])` |
| **Admin Stores** | `loadManagers` utilisait `response.data` au lieu de la liste users | `setManagers(response?.users ?? [])` |
| **Admin Sales** | `setSales(salesRes.data)`, `setStats(statsRes.data)` alors que getSales retourne `{ orders, pagination }` et getSalesStats une autre structure | Utilisation de `salesRes?.orders`, stats dérivées des commandes (CA, marge, nb ventes, marge %) |
| **Manager Sales** | Idem | Même logique : orders + stats dérivées |
| **Reports** | `ordersReport = orders.data`, `marginsReport = margins.data`, `storesReport = stores.data` (`.data` inexistant) | Transform des réponses sales / performance / clients en `summary`, `timeline`, `topStores`, `byStatus` ; `marginsReport` depuis performance ; `storesReport` = `clients` |

---

## 2. Données métier incorrectes

| Problème | Correction |
|----------|------------|
| **Commission / marge** | Le modèle `Order` n’a pas de champ `commission` ; les rapports utilisaient `o.commission` | Utilisation de `o.totalMargin` partout (dashboard, Admin Orders, Reports, trends, performance) |
| **Admin Orders – totalCommission** | Somme sur `o.commission` pour les livrées | Somme sur `o.totalMargin` |
| **Admin Orders – détail modal** | TVA et TTC calculés en `totalHT * 0.2` / `totalHT * 1.2` | Utilisation de `order.totalTVA` et `order.totalTTC` avec repli sur formules si absents |
| **Admin Sales / Manager Sales** | Stats depuis getSalesStats (evolution) dont la forme ne correspondait pas | Stats calculées côté front à partir des commandes livrées (getSales) : totalRevenue, totalMargin, totalSales, averageMarginPercent |
| **Tableaux ventes** | Colonnes basées sur un modèle "sale" (saleNumber, totalPurchase, etc.) | Mapping des `orders` livrés : orderNumber, createdAt, shop, totalHT, totalTTC, totalMargin |

---

## 3. Backend

| Fichier | Problème | Correction |
|--------|----------|------------|
| **reports.js** | `prisma.client.count()` alors qu’il n’existe pas de modèle `Client` | `prisma.organization.count()` pour `totalClients` |
| **reports.js** | `order.commission` dans performance et trends | `order.totalMargin` |

---

## 4. Pagination et limites

| Fichier | Problème | Correction |
|--------|----------|------------|
| **Admin Orders** | `getOrders()` sans limite → 20 commandes, stats fausses | `getOrders({ limit: 2000 })` pour stats cohérentes |
| **Admin Sales** | Idem pour ventes | `getSales({ limit: 2000, ... })` |
| **Manager Sales** | Idem | `getSales({ limit: 2000, ... })` |

---

## 5. Rapports (Reports)

- **Période** : conversion `period` (day / week / month / year) en `startDate` / `endDate` pour les APIs.
- **APIs** : sales, performance, clients utilisent `startDate` / `endDate` ; les appels sont faits avec ces paramètres.
- **Transform** : à partir de la réponse sales (`stats`, `orders`), construction de `summary`, `timeline`, `topStores`, `byStatus` pour que la page Rapports affiche les bons blocs.
- **Sécurisation** : `maxOrders` dans la timeline avec `Math.max(1, ...)` pour éviter une division par zéro.

---

## 6. Fichiers modifiés

- `frontend/src/pages/admin/Users.jsx` – loadStores
- `frontend/src/pages/admin/Stores.jsx` – loadManagers
- `frontend/src/pages/admin/Orders.jsx` – totalCommission, modal TVA/TTC, limit getOrders
- `frontend/src/pages/admin/Sales.jsx` – source des ventes, stats, mapping table
- `frontend/src/pages/manager/Sales.jsx` – idem
- `frontend/src/pages/admin/Reports.jsx` – loadReports, transform, period → start/end
- `backend/routes/reports.js` – commission → totalMargin, client → organization
- `backend/routes/products.js` – totalShopStock, customSubCategory, priceTTC/tvaRate
- `frontend/src/pages/admin/Products.jsx` – prix (tvaRate), stock (totalShopStock), photo (uploadImgSrc)

---

## 7. Page Produits (Admin) – correctifs appliqués

- **Prix 0,00 €** : utilisation de `tvaRate` (schéma) au lieu de `tva` ; gestion de `priceHT` null/NaN. Backend : `priceTTC` calculé avec `tvaRate` et `priceHT` sécurisés.
- **Stock « 0 Rupture »** : pour l’admin, le stock affiché est **`totalShopStock`** (somme des `ShopStock` par produit). Repli sur `Product.stock` si absent. Backend : `groupBy` sur `ShopStock` par `productId`, `_sum.quantity`, puis `totalShopStock` attaché à chaque produit.
- **Photos** : `uploadImgSrc` pour construire l’URL absolue des images (`/uploads/...` → `origin + path`). Utilisé dans la liste et dans le modal d’édition.
- **Backend** : suppression du doublon `customSubCategory` dans l’`include` ; ajout de l’agrégat `totalShopStock` pour l’admin.

---

## 8. À vérifier côté produit

- **Admin Stores** : formulaire magasin avec `address.street`, `address.city`, etc. ; le modèle Shop a `address`, `city`, `postalCode` en champs plats. Si le formulaire ou l’API utilise du nested, il faudra aligner.
- **Categories / Products** : usage de `response.data.categories` et `response.data.subCategories` ; à confirmer selon le format réel des APIs categories.
- **Clients / Notifications / Goals / Promotions** : certaines pages utilisent encore `res.data` ; vérifier que la structure renvoyée par l’API correspond.

---

## 9. Build

- `npm run build` frontend : OK après ces correctifs.
