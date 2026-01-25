# Liste des problèmes identifiés et corrigés

Audit réalisé pour corriger tous les détails connus du système (auth, profil, avatar, paramètres, rapports, API).

---

## 1. Auth & mot de passe

| Problème | Correction |
|----------|------------|
| Frontend appelle `PUT /auth/change-password`, backend expose uniquement `PUT /auth/password` | Ajout route `PUT /auth/change-password` (alias) dans `routes/auth.js` |
| Settings (Admin, Client, Manager) appellent `changeUserPassword(user.id, password.current, password.new)` alors que l’API attend `(currentPassword, newPassword)` | Appels corrigés en `changeUserPassword(password.current, password.new)` dans les 3 Settings |
| `GET /auth/me` ne renvoyait pas `avatarUrl` | `avatarUrl` ajouté au `select` Prisma dans `/me` |

---

## 2. Avatar & profil

| Problème | Correction |
|----------|------------|
| Client et Manager Settings utilisaient `avatarInputRef` et `uploadingAvatar` sans les déclarer | Ajout de `uploadingAvatar`, `avatarInputRef` (`useState` / `useRef`) dans Client et Manager (l’`input` et le handler existaient déjà) |
| Photo mise à jour côté backend mais pas affichée (cache, `getMe` sans `avatarUrl`) | Cache-bust sur `avatarUrl` après upload + `avatarUrl` dans `/me` (déjà fait) |

---

## 3. API & frontend

| Problème | Correction |
|----------|------------|
| `resetUserPassword` appelait `POST /admin/users/:id/reset-password` alors que le backend expose `PUT /admin/users/:id/password` | `users.js` modifié : `PUT /admin/users/:id/password` avec `{ newPassword }` |
| Logs de debug excessifs (`updateUserProfile`, interceptor) | Réduction des `console.log` dans `users.js` et `api.js` (optionnel, peut rester en dev) |

---

## 4. Rapports (reports)

| Problème | Correction |
|----------|------------|
| `GET /api/reports/clients` utilise `shop.client` et `shop.clientId` alors que `Shop` a `organizationId` / `organization` | Utilisation de `organization` à la place de `client` dans `routes/reports.js` (clients) |

---

## 5. Paramètres (settings)

| Problème | Correction |
|----------|------------|
| `GET /api/settings` 500 possible si erreur Prisma (ex. table `Setting` manquante) | Gestion d’erreur déjà présente ; pas de changement. Vérifier migrations et Prisma. |

---

## 6. Service Worker, PWA, icônes

| Problème | Correction |
|----------|------------|
| Erreur manifest « icon-192.png Download error or resource isn't a valid image » | Les fichiers existent dans `public/`. Vérifier que les icônes sont des PNG valides et accessibles (pas de blocage CORS, chemins corrects). |

---

## 7. Uploads & Nginx

| Problème | Correction |
|----------|------------|
| Route `/api/auth/avatar` 404 (ancienne instance sur le port 5000) | Route dédiée `routes/avatar.js` montée sur `/api/auth/avatar` ; une seule instance backend sur le port 5000. |
| `location /uploads/` Nginx → `backend/uploads/` | Déjà configuré ; pas de changement. |

---

## Fichiers modifiés

- `backend/routes/auth.js` : alias `/change-password`, `avatarUrl` dans `/me`
- `backend/routes/avatar.js` : création (déjà fait)
- `backend/routes/reports.js` : clients → `organization`
- `backend/server.js` : montage `/api/auth/avatar`
- `frontend/src/api/users.js` : `resetUserPassword` → PUT, `uploadProfileAvatar` + cache-bust, réduction logs
- `frontend/src/api/auth.js` : pas de changement (déjà `/change-password`)
- `frontend/src/pages/admin/Settings.jsx` : `changeUserPassword(password.current, password.new)`
- `frontend/src/pages/client/Settings.jsx` : idem + `uploadingAvatar` / `avatarInputRef`
- `frontend/src/pages/manager/Settings.jsx` : idem + `uploadingAvatar` / `avatarInputRef`
- `frontend/src/config/api.js` : FormData Content-Type, éventuelle réduction des logs

---

## Vérifications post-déploiement

1. Backend : une seule instance (ex. PM2) écoute sur le port 5000.
2. Connexion → Paramètres → Modification profil / mot de passe / avatar : tout fonctionne.
3. Admin → Rapports → Clients : pas de 500.
4. Admin → Paramètres système : `GET /api/settings` OK.
5. Hard refresh (Ctrl+Shift+R) et, si besoin, désinscription du Service Worker pour éviter cache obsolète.
