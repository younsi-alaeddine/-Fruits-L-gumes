# ✅ CHANGEMENT EMAIL ADMIN

**Date** : 23 Janvier 2026  
**Ancien email** : `admin@example.com`  
**Nouveau email** : `contact.carreprimeur@gmail.com`

---

## ✅ FICHIERS MODIFIÉS

1. ✅ `backend/scripts/create-admin.js` - Email de création admin
2. ✅ `backend/scripts/reset-admin-password.js` - Email pour reset password
3. ✅ `backend/scripts/test-all-routes.js` - Email de test
4. ✅ `backend/scripts/test-forgot-password.js` - Exemple d'email
5. ✅ `backend/routes/auth.js` - Documentation Swagger

---

## ⚠️ ACTION REQUISE : MISE À JOUR BASE DE DONNÉES

Si un utilisateur admin existe déjà avec l'ancien email, vous devez mettre à jour la base de données :

```sql
UPDATE users 
SET email = 'contact.carreprimeur@gmail.com' 
WHERE email = 'admin@example.com';
```

**OU** via Prisma :

```bash
cd /var/www/fruits-legumes/backend
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.updateMany({
  where: { email: 'admin@example.com' },
  data: { email: 'contact.carreprimeur@gmail.com' }
}).then(() => {
  console.log('✅ Email mis à jour');
  prisma.\$disconnect();
});
"
```

---

## 📋 VÉRIFICATION

Pour vérifier que le changement a été appliqué :

```bash
cd /var/www/fruits-legumes/backend
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findMany({
  where: { role: 'ADMIN' },
  select: { email: true, name: true }
}).then(users => {
  console.log('Admins:', users);
  prisma.\$disconnect();
});
"
```

---

**Statut** : ✅ **FICHIERS MODIFIÉS - MISE À JOUR BASE DE DONNÉES REQUISE**
