# 🔍 DEBUG - ERREUR PROFILE UPDATE

**Date** : 23 Janvier 2026  
**Erreur** : `PUT /api/auth/profile 400` - Body reçu comme string (ID utilisateur)

---

## 🐛 PROBLÈME

Le body est reçu comme une **string contenant l'ID utilisateur** (`b7716241-dd6f-4379-824b-bb103ff50218`) au lieu d'un objet JSON avec `{name: "...", phone: "..."}`.

---

## ✅ LOGS DE DÉBOGAGE AJOUTÉS

### Frontend

1. **`frontend/src/config/api.js`** - Interceptor Request
   - Logs pour toutes les requêtes `PUT /auth/profile`
   - Affiche : URL, Method, Data, Data Type, Headers

2. **`frontend/src/api/users.js`** - Fonction `updateUserProfile`
   - Log : `📤 updateUserProfile appelé avec:` + données + type

3. **`frontend/src/pages/client/Settings.jsx`** - Handler `handleSaveProfile`
   - Log : `📤 Données envoyées:` + `profileData`

### Backend

1. **`backend/server.js`** - Middleware de logging
   - **Body RAW** (avant parsing JSON) : affiche le body brut reçu
   - **Body APRÈS parsing** : affiche le body après `express.json()`

2. **`backend/routes/auth.js`** - Route `PUT /profile`
   - Log : `PUT /profile - Body reçu (raw)` avec tous les détails
   - Log : `PUT /profile - Body reçu comme string` si c'est une string
   - Log : `PUT /profile - Erreur parsing JSON` si le parsing échoue

---

## 🧪 PROCHAINES ÉTAPES

1. **Tester à nouveau** la mise à jour du profil
2. **Vérifier les logs dans la console du navigateur** :
   - `📤 Données envoyées:` (Settings.jsx)
   - `📤 updateUserProfile appelé avec:` (users.js)
   - `🔍 Interceptor Request - Data:` (api.js)
3. **Vérifier les logs backend** :
   ```bash
   cd /var/www/fruits-legumes/backend
   tail -f logs/combined.log | grep "PUT /profile\|Body RAW\|Body APRÈS"
   ```

---

## 📋 CAUSES POSSIBLES

1. **Frontend envoie mal les données** : L'objet est transformé en string quelque part
2. **Middleware transforme le body** : Un middleware backend transforme le body
3. **Proxy (Nginx) modifie le body** : Un proxy entre le frontend et le backend modifie le body
4. **Problème de sérialisation Axios** : Axios ne sérialise pas correctement l'objet

---

## 🔧 CORRECTIONS DÉJÀ APPLIQUÉES

1. ✅ Amélioration du middleware `sanitizeXSS`
2. ✅ Gestion améliorée du body string dans `auth.js`
3. ✅ Correction select Prisma (`shop` → `shops`)
4. ✅ Ajout de logs de débogage complets

---

**Statut** : 🔍 **EN ATTENTE DE LOGS POUR IDENTIFIER LA CAUSE EXACTE**

**Action requise** : Tester à nouveau et partager les logs de la console du navigateur et du backend.
