## Version v1.1 – Rapport (post go-live)

**Objectif v1.1 :** stabilité, monitoring, scalabilité – sans casser l’existant.

---

### 1) Changements livrés (v1.1)

#### 1.1 Auth / Récupération mot de passe
- **UI complète** :
  - Route publique `GET /forgot-password`
  - Route publique `GET /reset-password?token=...`
  - Lien “Mot de passe oublié ?” depuis l’écran login
- **API** :
  - `POST /api/auth/forgot-password` (déjà présent)
  - `POST /api/auth/reset-password` (déjà présent)

#### 1.2 Champs métier produits (origine, PVC, marge, unité/colis)
- **DB** : ajout champ `Product.pvc` + index
  - Migration appliquée : `20260130130000_add_product_pvc`
- **API produits** :
  - Support des champs : `origin`, `packaging`, `presentation`, `margin`, `cessionPrice`, `pvc`, `priceHT_T2`, `gencod`, `barcode`
  - Corrections validation : `tvaRate` optionnel sur création (valeur par défaut 5.5)
  - Fix bug : route `/api/products/search` dupliquée supprimée
- **UI Admin Produits** :
  - Mapping correct des champs `tvaRate`, `origin`, `packaging`, `presentation`, `margin`, `cessionPrice`, `pvc`
  - Champs enum via `<select>` pour éviter les erreurs de validation

#### 1.3 Monitoring prod
- **Endpoints** :
  - `GET /api/health` (existant)
  - `GET /api/health/db` (ajouté) → vérifie la connectivité DB via `SELECT 1`
- **Logs** :
  - `pm2-logrotate` installé + configuré (taille max, rétention, compression)

#### 1.4 Stabilité build
- Build frontend rendu robuste en environnement CI : `CI=false react-scripts build`
- Build validé (warnings ESLint non bloquants)

---

### 2) Vérifications (smoke tests)

- `https://fatah-commander.cloud/api/health` → **200**
- `https://fatah-commander.cloud/api/health/db` → **200**
- `https://fatah-commander.cloud/forgot-password` → **200**
- `https://fatah-commander.cloud/reset-password?token=test` → **200**
- `POST https://fatah-commander.cloud/api/auth/forgot-password` (email non existant) → **200** (message générique)

---

### 3) Risques / points d’attention

#### 3.1 Déploiement / source de vérité
- **Risque** : présence de 2 copies du projet (`/root/github-repo` et `/var/www/fruits-legumes`).
- **Décision v1.1** : backend PM2 basculé sur `/var/www/fruits-legumes/backend` pour être cohérent avec Nginx (frontend déjà servi depuis `/var/www/.../frontend/build`).

#### 3.2 Emails (password reset)
- **Risque** : si SMTP non configuré, la demande reset ne délivrera pas d’email.
- **Mitigation** : vérifier variables SMTP et tester envoi (v1.2 : alerte si SMTP manquant en prod).

#### 3.3 Warnings ESLint
- Non bloquants, mais augmentent la dette (à nettoyer progressivement).

---

### 4) Plan clair v1.2 (stabilité + industrialisation)

#### 4.1 Déploiement “propre”
- Standardiser une seule source de vérité (repo + pipeline)
- Script de déploiement : pull → install → build → migrate → restart PM2
- Vérifier que `.env` n’est jamais versionné

#### 4.2 Observabilité / alerting
- Uptime externe sur `/api/health` et `/api/health/db`
- Alerte PM2 “process down” + alerte disque + alerte erreurs 5xx
- Ajouter un “request id” par requête + logs structurés (winston) si besoin

#### 4.3 Performance / scalabilité
- Ajouter pagination partout où nécessaire (priorité : listes lourdes)
- Vérifier index DB sur colonnes filtrées (orders, invoices, products)
- Option cache : uniquement si métriques montrent contention (ex: stats dashboard)

---

### 5) Résumé exécutif

v1.1 apporte :
- reset password complet (UI + API déjà existante),
- champs produits métier + migration PVC,
- endpoints monitoring health/db,
- logs PM2 + rotation,
- fixes stabilité (validation produits, duplication route).

