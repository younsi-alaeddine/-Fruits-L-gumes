# ⚠️ Configuration URL Frontend - IMPORTANT

## Problème Identifié

Le lien de réinitialisation de mot de passe utilise `http://localhost:3000/` par défaut, ce qui **ne fonctionne que si vous accédez depuis le serveur lui-même**.

---

## 🔧 Solution : Configurer FRONTEND_URL

### Option 1 : Utiliser l'IP du serveur (Recommandé pour test)

Dans `/var/www/fruits-legumes/backend/.env`, ajoutez :

```env
FRONTEND_URL=http://72.62.27.96:3000
```

**OU** si vous avez un domaine :

```env
FRONTEND_URL=http://votre-domaine.com
# ou
FRONTEND_URL=https://votre-domaine.com
```

### Option 2 : Utiliser un domaine (Production)

Si vous avez un domaine configuré (ex: `fatah-commander.cloud`) :

```env
FRONTEND_URL=http://fatah-commander.cloud
# ou avec HTTPS
FRONTEND_URL=https://fatah-commander.cloud
```

---

## 📋 Étapes de Configuration

1. **Éditer le fichier .env** :
   ```bash
   cd /var/www/fruits-legumes/backend
   nano .env
   ```

2. **Ajouter la ligne** :
   ```env
   FRONTEND_URL=http://72.62.27.96:3000
   ```
   (Remplacez par votre IP ou domaine)

3. **Redémarrer le serveur** :
   ```bash
   pm2 restart fruits-legumes-backend
   ```

---

## ✅ Vérification

Après configuration, les nouveaux emails utiliseront la bonne URL.

**Test** :
```bash
cd /var/www/fruits-legumes/backend
node scripts/test-forgot-password.js votre-email@example.com
```

Le lien dans l'email devrait maintenant utiliser la bonne URL.

---

## 🌐 Accès au Frontend

### Si le frontend n'est pas démarré :

```bash
cd /var/www/fruits-legumes/frontend
npm start
```

Le frontend sera accessible sur :
- **Depuis le serveur** : `http://localhost:3000`
- **Depuis l'extérieur** : `http://72.62.27.96:3000`

### Si vous utilisez un reverse proxy (Nginx) :

Configurez Nginx pour rediriger vers le frontend, puis utilisez :
```env
FRONTEND_URL=http://votre-domaine.com
```

---

## ⚠️ Important

- **localhost:3000** ne fonctionne QUE depuis le serveur
- Pour accès externe, utilisez l'**IP du serveur** ou un **domaine**
- Assurez-vous que le **port 3000 est ouvert** dans le firewall si vous utilisez l'IP

---

## 🔒 Sécurité (Production)

En production, utilisez **HTTPS** :
```env
FRONTEND_URL=https://votre-domaine.com
```

Et configurez un **reverse proxy** (Nginx) avec certificat SSL.

---

**Configuration actuelle** : `http://localhost:3000` (par défaut)
**Recommandation** : Configurer `FRONTEND_URL` dans `.env`
