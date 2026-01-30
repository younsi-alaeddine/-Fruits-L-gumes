# ✅ CORRECTION CONFIGURATION API

**Date**: 20 janvier 2026  
**Problème résolu**: API inaccessible depuis le navigateur

---

## ❌ **PROBLÈME INITIAL**

L'API frontend pointait vers `http://localhost:5000/api`, ce qui ne fonctionne PAS car :

1. **Le frontend s'exécute dans le navigateur du client** (machine de l'utilisateur)
2. `localhost:5000` pointe vers la machine locale du **client**, pas vers le **serveur**
3. Le backend est sur le **serveur** à `localhost:5000` (accessible uniquement depuis le serveur)

**Résultat** : Toutes les requêtes API échouaient avec "Impossible de contacter le serveur"

---

## ✅ **SOLUTION APPLIQUÉE**

### 1. **Utilisation de Chemins Relatifs**

**Fichier**: `/var/www/fruits-legumes/frontend/src/config/api.js`

```javascript
// ❌ AVANT
const API_BASE_URL = 'http://localhost:5000/api'

// ✅ APRÈS
const API_BASE_URL = '/api'
```

### 2. **Nginx Reverse Proxy (déjà configuré)**

**Fichier**: `/etc/nginx/sites-available/fruits-legumes`

```nginx
location /api/ {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**Fonctionnement** :
- Client : `https://fatah-commander.cloud/api/products`
- Nginx : Redirige vers `http://localhost:5000/api/products` (sur le serveur)
- Backend : Traite la requête et retourne les données
- Nginx : Retourne la réponse au client

### 3. **Fichiers .env Créés**

**`.env.production`** (utilisé en production)
```bash
REACT_APP_API_URL=/api
```

**`.env.development`** (pour développement local)
```bash
REACT_APP_API_URL=https://fatah-commander.cloud/api
```

---

## 🔧 **CONFIGURATION COMPLÈTE**

### **Architecture**

```
Client (Navigateur)
    ↓ HTTPS
https://fatah-commander.cloud/api/products
    ↓
Nginx (Reverse Proxy)
    ↓ HTTP (interne serveur)
http://localhost:5000/api/products
    ↓
Backend Express.js
    ↓
PostgreSQL (localhost:5432)
```

### **Avantages de cette configuration**

✅ **Sécurité** : Backend non exposé directement  
✅ **HTTPS** : Tout passe par SSL  
✅ **CORS** : Plus de problèmes cross-origin  
✅ **Performance** : Nginx gère la compression, cache, etc.  
✅ **Simplicité** : Une seule URL pour frontend et API

---

## 🧪 **TESTS**

### **1. Test Health Check**
```bash
curl https://fatah-commander.cloud/api/health
```

**Réponse attendue** :
```json
{
  "status": "OK",
  "message": "API fonctionnelle",
  "database": "connected"
}
```

### **2. Test depuis le navigateur**
1. Ouvrir https://fatah-commander.cloud
2. Ouvrir Console développeur (F12)
3. Taper :
```javascript
fetch('/api/health')
  .then(r => r.json())
  .then(data => console.log(data))
```

**Résultat** : `{"status":"OK", "database":"connected"}`

---

## 📁 **FICHIERS MODIFIÉS**

1. `/var/www/fruits-legumes/frontend/src/config/api.js`
   - Changé `API_BASE_URL` de `http://localhost:5000/api` → `/api`

2. `/var/www/fruits-legumes/frontend/.env.production` (créé)
   - Configuration pour production

3. `/var/www/fruits-legumes/frontend/.env.development` (créé)
   - Configuration pour dev local

4. `/var/www/fruits-legumes/frontend/build/` (rebuild)
   - Nouveau build avec chemins relatifs

---

## ✅ **RÉSULTAT**

**L'API est maintenant accessible depuis le navigateur !**

- ✅ Toutes les requêtes passent par HTTPS
- ✅ Nginx fait le proxy vers le backend
- ✅ PostgreSQL connecté et fonctionnel
- ✅ Système opérationnel

---

## 🚀 **PROCHAINES ÉTAPES**

1. **Créer un compte administrateur**
   ```bash
   cd /var/www/fruits-legumes/backend
   npm run create-admin
   ```

2. **Se connecter au système**
   - URL : https://fatah-commander.cloud
   - Utiliser le compte créé

3. **Ajouter des produits**
   - Dashboard ADMIN → Produits → Ajouter

4. **Créer des magasins (clients)**
   - Dashboard ADMIN → Clients → Ajouter

5. **Tester une commande complète**
   - Se connecter en CLIENT
   - Créer une commande (12h-20h)
   - Se connecter en ADMIN
   - Valider la commande (visible à partir de 00h00)

---

**✅ SYSTÈME OPÉRATIONNEL AVEC API RÉELLE !**
