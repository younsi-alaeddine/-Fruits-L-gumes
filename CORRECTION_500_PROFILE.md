# ✅ CORRECTION ERREUR 500 - PROFILE UPDATE

**Date** : 23 Janvier 2026  
**Erreur** : `PUT /api/auth/profile 500` - "Unknown field `shop` for select statement"

---

## 🐛 PROBLÈMES IDENTIFIÉS

### 1. Erreur Prisma : `shop` n'existe pas

**Erreur** : `Unknown field 'shop' for select statement on model 'User'`

**Cause** : Le modèle `User` a une relation `shops` (pluriel, 1-to-many) et non `shop` (singulier).

**Correction** : Changé `shop: true` en `shops: { select: {...}, take: 1 }`

### 2. Body reçu comme string

**Problème** : Le body est parfois reçu comme une string au lieu d'un objet JSON.

**Correction** : Ajout d'une vérification et tentative de parsing si c'est une string.

---

## ✅ CORRECTIONS APPLIQUÉES

### 1. Select Prisma corrigé ✅

**Fichier** : `backend/routes/auth.js` (ligne 707)

**AVANT** :
```javascript
select: {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  shop: true  // ❌ N'existe pas
}
```

**APRÈS** :
```javascript
select: {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  shops: {  // ✅ Relation plurielle
    select: {
      id: true,
      name: true,
      city: true
    },
    take: 1
  }
}
```

### 2. Gestion du body string ✅

**Fichier** : `backend/routes/auth.js` (ligne 665-675)

Ajout d'une vérification pour parser le body si c'est une string JSON.

---

## 🧪 TEST

Après redémarrage du backend :

1. Aller sur la page Settings
2. Modifier le nom ou le téléphone
3. Cliquer sur "Enregistrer"
4. ✅ La requête devrait maintenant réussir (200 OK)

---

**Statut** : ✅ **CORRECTION APPLIQUÉE - BACKEND REDÉMARRÉ**
