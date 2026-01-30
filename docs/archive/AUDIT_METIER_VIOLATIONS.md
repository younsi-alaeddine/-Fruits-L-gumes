# 🚨 AUDIT MÉTIER - VIOLATIONS DÉTECTÉES
**Date** : 20 janvier 2026

## 🎯 CONTEXTE MÉTIER

**Fattah** = Intermédiaire B2B (grossiste SANS stock)
- ❌ Pas de dépôt
- ❌ Pas de stock
- ✅ Reçoit des commandes (orders)
- ✅ Passe commandes aux fournisseurs
- ✅ Gère ses ventes propres (admin)
- ✅ Gère commissions/marges

**3 Rôles stricts** :
1. **ADMIN (Fattah)** - Intermédiaire
2. **MANAGER** - Propriétaire de plusieurs magasins
3. **SHOP** - Point de vente individuel

---

## 🚨 VIOLATIONS CRITIQUES DÉTECTÉES

### ❌ VIOLATION #1 : ADMIN voit le CA total (Dashboard)

**Fichier** : `/src/pages/admin/Dashboard.jsx`
**Lignes** : 44-46, 114-119

```javascript
// INCORRECT
const revenue = orders
  .filter((o) => o.status === 'livrée')
  .reduce((sum, o) => sum + (o.totalTTC || o.total || 0), 0)

// Affiche
{
  title: 'Chiffre d\'affaires',
  value: `${stats.revenue.toFixed(2)} €`,
}
```

**❌ Problème** : Calcule le CA TOTAL de toutes les commandes magasins

**✅ Devrait** : Afficher uniquement la **Commission/Marge de Fattah**

**Règle violée** : Fattah ne voit PAS le CA des magasins

---

### ❌ VIOLATION #2 : ADMIN voit le Montant total (Orders)

**Fichier** : `/src/pages/admin/Orders.jsx`
**Lignes** : 121, 259-269

```javascript
// INCORRECT
totalAmount: orders.reduce((sum, order) => sum + (order.totalTTC || order.total || 0), 0),

// Affiche dans statistiques
<div className="card ...">
  <p className="text-sm text-gray-600 mb-1">Montant total</p>
  <p className="text-2xl font-bold text-gray-900">
    {stats.totalAmount.toFixed(2)} €
  </p>
</div>
```

**❌ Problème** : Affiche le montant total de TOUTES les commandes

**✅ Devrait** : Afficher uniquement la **Commission totale de Fattah**

**Règle violée** : Fattah ne voit PAS les montants totaux des commandes magasins

---

### ❌ VIOLATION #3 : ADMIN a accès aux STOCKS (Permissions)

**Fichier** : `/src/constants/permissions.js`
**Ligne** : 32

```javascript
// INCORRECT
ADMIN: {
  [RESOURCES.STOCKS]: [ACTIONS.READ, ACTIONS.UPDATE],  // ❌ VIOLATION !
}
```

**❌ Problème** : ADMIN peut lire et modifier les stocks

**✅ Devrait** : ADMIN n'a **AUCUN** accès aux stocks

**Règle violée** : Fattah ne gère AUCUN stock, ne voit AUCUN stock

---

### ❌ VIOLATION #4 : MANAGER confondu avec STORE (Routes)

**Fichier** : `/src/constants/routes.js`
**Lignes** : 56-61

```javascript
// INCORRECT
export const getDefaultRouteForRole = (role) => {
  switch (role) {
    case 'MANAGER':
    case 'PREPARATEUR':
    case 'LIVREUR':
    case 'COMMERCIAL':
    case 'STOCK_MANAGER':
      return ROUTES.STORE.DASHBOARD  // ❌ VIOLATION !
  }
}
```

**❌ Problème** : MANAGER utilise les pages STORE (un seul magasin)

**✅ Devrait** : MANAGER a ses propres pages (multi-magasins)

**Règle violée** : MANAGER ≠ SHOP

---

### ❌ VIOLATION #5 : Aucune page MANAGER n'existe

**Fichier** : `/src/pages/manager/*.jsx`
**Résultat** : **0 fichiers trouvés**

**❌ Problème** : Le rôle MANAGER n'a aucune interface dédiée

**✅ Devrait** : MANAGER a ses propres pages :
- Dashboard MANAGER (vue multi-magasins)
- Liste de SES magasins
- Stocks de SES magasins (multi)
- Création de commandes pour SES magasins

**Règle violée** : MANAGER doit voir TOUS ses magasins

---

## 📊 RÉSUMÉ DES VIOLATIONS

| # | Violation | Fichier | Sévérité | Impact |
|---|-----------|---------|----------|--------|
| 1 | CA total affiché à ADMIN | Dashboard.jsx | 🔴 CRITIQUE | Voit CA magasins |
| 2 | Montant total affiché à ADMIN | Orders.jsx | 🔴 CRITIQUE | Voit montants magasins |
| 3 | ADMIN a accès STOCKS | permissions.js | 🔴 CRITIQUE | Peut voir/modifier stocks |
| 4 | MANAGER → STORE | routes.js | 🔴 CRITIQUE | Pas de multi-magasins |
| 5 | Aucune page MANAGER | `/pages/manager/` | 🔴 CRITIQUE | Rôle non fonctionnel |

---

## ✅ CORRECTIONS NÉCESSAIRES

### 🔧 CORRECTION #1 : Dashboard ADMIN

**Fichier** : `/src/pages/admin/Dashboard.jsx`

```javascript
// AVANT (INCORRECT)
const revenue = orders
  .filter((o) => o.status === 'livrée')
  .reduce((sum, o) => sum + (o.totalTTC || o.total || 0), 0)

// APRÈS (CORRECT)
const commission = orders
  .filter((o) => o.status === 'livrée')
  .reduce((sum, o) => sum + (o.commission || 0), 0)  // Seulement la commission Fattah

// Dans statCards
{
  title: 'Commission totale',  // Pas "Chiffre d'affaires"
  value: `${stats.commission.toFixed(2)} €`,
  icon: DollarSign,
  color: 'green',
  route: ROUTES.ADMIN.ORDERS,
}
```

**Note** : Nécessite d'ajouter un champ `commission` dans le modèle Order

---

### 🔧 CORRECTION #2 : Orders ADMIN

**Fichier** : `/src/pages/admin/Orders.jsx`

```javascript
// AVANT (INCORRECT)
totalAmount: orders.reduce((sum, order) => sum + (order.totalTTC || order.total || 0), 0),

// APRÈS (CORRECT)
totalCommission: orders.reduce((sum, order) => sum + (order.commission || 0), 0),

// Dans l'affichage
<div className="card ...">
  <p className="text-sm text-gray-600 mb-1">Commission totale</p>
  <p className="text-2xl font-bold text-gray-900">
    {stats.totalCommission.toFixed(2)} €
  </p>
</div>
```

---

### 🔧 CORRECTION #3 : Permissions ADMIN

**Fichier** : `/src/constants/permissions.js`

```javascript
// AVANT (INCORRECT)
ADMIN: {
  [RESOURCES.CLIENTS]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.UPDATE, ACTIONS.DELETE],
  [RESOURCES.STORES]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.UPDATE, ACTIONS.DELETE],
  [RESOURCES.USERS]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.UPDATE, ACTIONS.DELETE],
  [RESOURCES.ORDERS]: [ACTIONS.READ, ACTIONS.UPDATE],
  [RESOURCES.PRODUCTS]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.UPDATE, ACTIONS.DELETE],
  [RESOURCES.STOCKS]: [ACTIONS.READ, ACTIONS.UPDATE],  // ❌ À SUPPRIMER
  [RESOURCES.INVOICES]: [ACTIONS.READ],
},

// APRÈS (CORRECT)
ADMIN: {
  [RESOURCES.CLIENTS]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.UPDATE, ACTIONS.DELETE],
  [RESOURCES.STORES]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.UPDATE, ACTIONS.DELETE],
  [RESOURCES.USERS]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.UPDATE, ACTIONS.DELETE],
  [RESOURCES.ORDERS]: [ACTIONS.READ, ACTIONS.UPDATE],
  [RESOURCES.PRODUCTS]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.UPDATE, ACTIONS.DELETE],
  // ❌ STOCKS supprimé - ADMIN n'y a AUCUN accès
  [RESOURCES.INVOICES]: [ACTIONS.READ],
  [RESOURCES.SUPPLIERS]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.UPDATE, ACTIONS.DELETE],  // ✅ AJOUTER
  [RESOURCES.COMMISSIONS]: [ACTIONS.READ],  // ✅ AJOUTER
},
```

---

### 🔧 CORRECTION #4 : Routes MANAGER

**Fichier** : `/src/constants/routes.js`

```javascript
// AJOUTER dans ROUTES
MANAGER: {
  DASHBOARD: '/manager/dashboard',
  STORES: '/manager/stores',  // Liste de SES magasins
  ORDERS: '/manager/orders',  // Commandes de SES magasins
  STOCKS: '/manager/stocks',  // Stocks de SES magasins
  REPORTS: '/manager/reports',  // Rapports multi-magasins
  SETTINGS: '/manager/settings',
},

// CORRIGER dans getDefaultRouteForRole
export const getDefaultRouteForRole = (role) => {
  switch (role) {
    case 'ADMIN':
      return ROUTES.ADMIN.DASHBOARD
    case 'CLIENT':
      return ROUTES.CLIENT.DASHBOARD
    case 'MANAGER':
      return ROUTES.MANAGER.DASHBOARD  // ✅ Route dédiée
    case 'PREPARATEUR':
    case 'LIVREUR':
    case 'COMMERCIAL':
    case 'STOCK_MANAGER':
      return ROUTES.STORE.DASHBOARD
    default:
      return ROUTES.LOGIN
  }
}
```

---

### 🔧 CORRECTION #5 : Créer pages MANAGER

**À créer** : `/src/pages/manager/*.jsx`

Pages nécessaires :
1. ✅ **Dashboard.jsx** - Vue multi-magasins
2. ✅ **Stores.jsx** - Liste de SES magasins (avec filtres)
3. ✅ **Orders.jsx** - Commandes de TOUS ses magasins
4. ✅ **Stocks.jsx** - Stocks agrégés de SES magasins
5. ✅ **Reports.jsx** - Rapports consolidés
6. ✅ **Settings.jsx** - Paramètres MANAGER

**Fonctionnalités clés** :
- Sélecteur de magasin (vue par magasin OU agrégée)
- Filtrage par magasin
- Création de commandes pour n'importe lequel de SES magasins
- Vue consolidée des stocks (par magasin)
- ❌ NE PEUT PAS voir les magasins des autres managers

---

## 🎯 PRIORITÉS DE CORRECTION

### 🔴 PRIORITÉ 1 (CRITIQUE) - À faire IMMÉDIATEMENT

1. **Supprimer accès STOCKS pour ADMIN** (permissions.js)
2. **Changer "Chiffre d'affaires" → "Commission"** (Dashboard ADMIN)
3. **Changer "Montant total" → "Commission totale"** (Orders ADMIN)

### 🟠 PRIORITÉ 2 (HAUTE) - À faire rapidement

4. **Créer structure pages MANAGER** (/pages/manager/)
5. **Créer routes MANAGER** (routes.js)
6. **Séparer MANAGER de STORE** (routes.js)

### 🟡 PRIORITÉ 3 (MOYENNE) - Amélioration

7. **Ajouter champ "commission" dans modèle Order** (backend)
8. **Créer ressources SUPPLIERS et COMMISSIONS** (permissions.js)
9. **Implémenter Dashboard MANAGER multi-magasins**

---

## 🎁 BONUS : Recommandations métier

### ✅ Champs à ajouter au modèle Order

```javascript
Order {
  // ... champs existants
  totalTTC: Number,  // Montant total (pour le magasin)
  commission: Number,  // Commission de Fattah (ce qu'il voit)
  margin: Number,  // Marge de Fattah (optionnel)
  supplierCost: Number,  // Coût fournisseur (optionnel)
}
```

### ✅ Nouvelles ressources à ajouter

```javascript
export const RESOURCES = {
  // ... existants
  SUPPLIERS: 'suppliers',  // Fournisseurs (ADMIN uniquement)
  COMMISSIONS: 'commissions',  // Commissions (ADMIN uniquement)
}
```

---

## ✅ RÉSULTAT ATTENDU APRÈS CORRECTIONS

### 🎯 ADMIN (Fattah)
- ✅ Voit : Commandes reçues, Commission totale, Fournisseurs
- ❌ Ne voit PAS : Stocks, CA magasins, Ventes magasins

### 🎯 MANAGER
- ✅ Voit : SES magasins, Stocks de SES magasins, Commandes de SES magasins
- ✅ Peut : Créer commandes pour SES magasins
- ❌ Ne voit PAS : Autres managers, Ventes admin, Commission Fattah

### 🎯 SHOP
- ✅ Voit : SON stock, SES ventes, SES commandes
- ❌ Ne voit PAS : Autres magasins, Ventes admin, Commission Fattah

---

## 📋 CHECKLIST DE VALIDATION POST-CORRECTION

- [ ] ADMIN ne voit AUCUN stock
- [ ] ADMIN voit uniquement SES commissions (pas CA magasins)
- [ ] MANAGER a ses propres pages (multi-magasins)
- [ ] MANAGER voit UNIQUEMENT SES magasins
- [ ] SHOP voit UNIQUEMENT SON magasin
- [ ] Séparation stricte des ventes (ADMIN ≠ SHOP)
- [ ] Commandes = seul lien entre ADMIN et magasins
- [ ] RBAC strict respecté partout

---

**Audit complet terminé - 5 violations critiques détectées**

**Toutes les violations violent le principe fondamental : Fattah = Intermédiaire SANS stock**
