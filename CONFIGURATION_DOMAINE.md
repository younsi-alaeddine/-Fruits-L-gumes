# ✅ Configuration Domaine - fatah-commander.cloud

## Date : 2024-01-14

---

## 🌐 Configuration Appliquée

**Domaine configuré** : `https://fatah-commander.cloud`

### Fichier `.env` mis à jour :
```env
FRONTEND_URL=https://fatah-commander.cloud
```

---

## 📧 URLs dans les Emails

Tous les emails envoyés utiliseront maintenant ce domaine :

### 1. **Email de confirmation d'inscription** :
```
https://fatah-commander.cloud/verify-email?token=...
```

### 2. **Email de réinitialisation de mot de passe** :
```
https://fatah-commander.cloud/reset-password?token=...
```

---

## ✅ Vérification

### Test de l'URL :
```bash
cd /var/www/fruits-legumes/backend
node scripts/test-forgot-password.js votre-email@example.com
```

Le lien dans l'email devrait maintenant être :
```
https://fatah-commander.cloud/reset-password?token=...
```

---

## 🔧 Configuration Frontend

### Si le frontend est servi via Nginx/Apache :

Assurez-vous que votre serveur web (Nginx/Apache) est configuré pour :
1. **Écouter sur le domaine** `fatah-commander.cloud`
2. **Rediriger vers le frontend React** (port 3000 ou build statique)
3. **Avoir un certificat SSL** (HTTPS)

### Exemple de configuration Nginx :

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name fatah-commander.cloud;
    
    # Redirection HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name fatah-commander.cloud;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🚀 Accès à l'Application

### URLs d'accès :
- **Frontend** : `https://fatah-commander.cloud`
- **Backend API** : `https://fatah-commander.cloud/api` (si configuré)
- **Ou séparé** : `https://api.fatah-commander.cloud` (si sous-domaine)

---

## ⚠️ Points Importants

1. **HTTPS requis** : Le domaine utilise HTTPS, assurez-vous que :
   - Le certificat SSL est valide
   - Le frontend est accessible via HTTPS
   - Les liens dans les emails utilisent HTTPS

2. **CORS** : Si le backend est sur un autre domaine/sous-domaine, configurez CORS :
   ```javascript
   // backend/server.js
   app.use(cors({
     origin: 'https://fatah-commander.cloud',
     credentials: true
   }));
   ```

3. **Variables d'environnement Frontend** : Si nécessaire, configurez dans le frontend :
   ```env
   REACT_APP_API_URL=https://api.fatah-commander.cloud
   # ou
   REACT_APP_API_URL=https://fatah-commander.cloud/api
   ```

---

## ✅ Statut

**Configuration domaine : APPLIQUÉE** ✅

- ✅ `FRONTEND_URL` configuré : `https://fatah-commander.cloud`
- ✅ Serveur redémarré
- ✅ Nouveaux emails utiliseront le domaine

---

## 📝 Prochaines Étapes

1. **Vérifier que le frontend est accessible** sur `https://fatah-commander.cloud`
2. **Tester un email** pour confirmer que les liens utilisent le bon domaine
3. **Vérifier le certificat SSL** (doit être valide)
4. **Tester la réinitialisation de mot de passe** avec un nouveau lien

---

**🎉 Configuration domaine terminée !**
