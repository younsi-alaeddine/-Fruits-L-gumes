# ✅ CORRECTION ERREUR PROFILE UPDATE

**Date** : 23 Janvier 2026  
**Erreur** : `PUT /api/auth/profile 400 (Bad Request)` - "Unexpected token " in JSON at position 0"

---

## 🐛 PROBLÈME IDENTIFIÉ

L'erreur venait de l'appel à `updateUserProfile` dans `Settings.jsx` :

**AVANT** (incorrect) :
```javascript
await updateUserProfile(user.id, {
  firstName: profile.firstName,
  lastName: profile.lastName,
  phone: profile.phone,
})
```

**Problèmes** :
1. ❌ `updateUserProfile` ne prend qu'un seul paramètre `data`, pas deux
2. ❌ Le backend attend `name` (string), pas `firstName` et `lastName` séparément
3. ❌ L'envoi de `user.id` comme premier paramètre causait un JSON invalide

---

## ✅ CORRECTION APPLIQUÉE

**APRÈS** (correct) :
```javascript
await updateUserProfile({
  name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || user.name,
  phone: profile.phone,
})
```

**Améliorations** :
1. ✅ Un seul paramètre (objet `data`)
2. ✅ `name` est construit à partir de `firstName` et `lastName`
3. ✅ Fallback sur `user.name` si les champs sont vides
4. ✅ Initialisation du state corrigée pour extraire firstName/lastName du nom complet

---

## 📋 FICHIERS MODIFIÉS

1. ✅ `frontend/src/pages/client/Settings.jsx`
   - Ligne 17-22 : Initialisation du state avec extraction du nom
   - Ligne 69 : Correction de l'appel à `updateUserProfile`

---

## 🧪 TEST

Pour tester la correction :
1. Aller sur la page Settings
2. Modifier le nom ou le téléphone
3. Cliquer sur "Enregistrer"
4. Vérifier que la requête réussit (200 OK)

---

**Statut** : ✅ **CORRECTION APPLIQUÉE**
