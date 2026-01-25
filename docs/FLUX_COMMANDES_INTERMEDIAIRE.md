# 📦 FLUX COMPLET DES COMMANDES - MODE INTERMÉDIAIRE

**Date** : 23 Janvier 2026  
**Version** : 2.0 (Intermediaire sans stock)

---

## 🎯 PRINCIPE FONDAMENTAL

L'ADMIN est un **INTERMÉDIAIRE (broker)** qui :
- ✅ **N'a AUCUN stock** interne
- ✅ **Agrège** les commandes des magasins
- ✅ **Passe des commandes TOTALES** aux fournisseurs
- ✅ **Gère les écarts** venant des fournisseurs
- ✅ **Facture** sur les quantités réellement livrées

---

## 📊 FLUX COMPLET EN 7 ÉTAPES

### **ÉTAPE 1 : CRÉATION DE LA COMMANDE** 👤 CLIENT (Magasin)

**Qui** : Le propriétaire du magasin (rôle CLIENT)  
**Où** : Page `/client/orders/create`  
**Quand** : Entre 12h et 20h (horaires de commande)

**Processus** :
1. Le client se connecte à son compte
2. Accède à "Nouvelle commande"
3. Sélectionne son magasin
4. Choisit les produits et quantités dans le catalogue
5. Sélectionne la date de livraison souhaitée
6. Clique sur "Envoyer la commande"

**Statut initial** : `NEW` (nouvelle commande)

**⚠️ IMPORTANT** :
- ✅ La commande peut être créée **même si le stock est insuffisant** (pas de vérification)
- ✅ **AUCUN stock n'est décrémenté** (l'admin n'a pas de stock)
- ✅ Un email de confirmation est envoyé au client
- ✅ Une notification est créée pour les admins (vous)

---

### **ÉTAPE 2 : AGRÉGATION DES COMMANDES** 👨‍💼 ADMIN (Vous)

**Qui** : Vous (rôle ADMIN)  
**Où** : Page `/admin/orders/aggregate`  
**Quand** : Après réception des commandes NEW

**Processus** :
1. Vous accédez à la page "Agrégation des commandes"
2. Vous voyez toutes les commandes avec statut `NEW`
3. Vous sélectionnez une date de livraison
4. Vous cliquez sur "Agréger"
5. Le système :
   - Groupe les commandes par date de livraison
   - Agrège les quantités par produit
   - Met à jour le statut des commandes → `AGGREGATED`

**Statut** : `NEW` → `AGGREGATED`

**Ce qui se passe** :
- Les commandes sont groupées par date de livraison
- Les quantités sont agrégées par produit
- Les commandes passent en statut `AGGREGATED`

---

### **ÉTAPE 3 : CRÉATION COMMANDE FOURNISSEUR** 👨‍💼 ADMIN (Vous)

**Qui** : Vous (rôle ADMIN)  
**Où** : Page `/admin/supplier-orders`  
**Quand** : Après agrégation

**Processus** :
1. Vous accédez à la page "Commandes Fournisseurs"
2. Vous sélectionnez un fournisseur
3. Vous sélectionnez une date de livraison (avec commandes agrégées)
4. Vous cliquez sur "Créer commande fournisseur"
5. Le système :
   - Groupe les produits par fournisseur
   - Crée une commande totale chez le fournisseur
   - Met à jour le statut des commandes → `SUPPLIER_ORDERED`

**Statut** : `AGGREGATED` → `SUPPLIER_ORDERED`

**Ce qui se passe** :
- Une `SupplierOrder` est créée avec les quantités agrégées
- Les commandes magasins sont liées à cette commande fournisseur
- Les commandes passent en statut `SUPPLIER_ORDERED`

---

### **ÉTAPE 4 : RÉCEPTION FOURNISSEUR** 📦 ADMIN/PRÉPARATEUR

**Qui** : Vous ou un préparateur (rôle ADMIN ou PREPARATEUR)  
**Où** : Page `/client/preparation` ou `/admin/orders`  
**Quand** : Après livraison par le fournisseur

**Processus** :
1. Le fournisseur livre les produits
2. Vous vérifiez les quantités reçues
3. Pour chaque produit :
   - Vous enregistrez la quantité réellement reçue (`quantityDelivered`)
   - Vous notez les écarts si nécessaire
4. Vous marquez la commande fournisseur comme "Livrée"
5. Les commandes magasins passent en statut `PREPARATION`

**Statut** : `SUPPLIER_ORDERED` → `PREPARATION`

**⚠️ IMPORTANT** :
- ✅ Les écarts sont enregistrés dans `quantityDelivered`
- ✅ La facturation se base sur `quantityDelivered`, pas `quantity`
- ✅ Les commissions sont calculées sur les quantités livrées

---

### **ÉTAPE 5 : PRÉPARATION DES COMMANDES** 📦 ADMIN/PRÉPARATEUR

**Qui** : Vous ou un préparateur (rôle ADMIN ou PREPARATEUR)  
**Où** : Page `/client/preparation`  
**Quand** : Après réception fournisseur

**Processus** :
1. Accès à la page "Préparation des commandes"
2. Sélection d'une commande avec statut `PREPARATION`
3. Pour chaque produit :
   - Vérification de la quantité disponible (depuis fournisseur)
   - Ajustement si nécessaire
   - Répartition entre les commandes magasins
4. Marquage comme "Prête pour livraison"

**Statut** : `PREPARATION` → `LIVRAISON`

**⚠️ IMPORTANT** :
- ✅ Les quantités préparées peuvent différer des quantités commandées
- ✅ Les écarts sont tracés par magasin
- ✅ La facturation se base sur les quantités réellement préparées

---

### **ÉTAPE 6 : LIVRAISON** 🚚 LIVREUR

**Qui** : Le livreur (rôle LIVREUR)  
**Où** : Page `/client/deliveries`  
**Quand** : Commande prête pour livraison

**Processus** :
1. Le livreur voit les commandes avec statut `LIVRAISON`
2. Il charge la commande dans son véhicule
3. Il part en livraison vers le magasin client
4. À l'arrivée, il marque la commande comme livrée

**Statut** : `LIVRAISON` → `LIVREE`

---

### **ÉTAPE 7 : RÉCEPTION PAR LE MAGASIN** ✅ CLIENT

**Qui** : Le propriétaire du magasin (rôle CLIENT)  
**Où** : Page `/client/orders`  
**Quand** : Après livraison

**Processus** :
1. Le client reçoit une notification de livraison
2. Il vérifie la commande reçue
3. Il peut confirmer la réception
4. La facture est générée automatiquement (basée sur `quantityDelivered`)

**Statut final** : `LIVREE`

---

## 📈 STATUTS DES COMMANDES

### OrderStatus (commandes magasins)

| Statut | Description | Qui peut changer | Action suivante |
|--------|-------------|-------------------|-----------------|
| `NEW` | Nouvelle commande créée | CLIENT | ADMIN agrège |
| `AGGREGATED` | ✅ Commandes agrégées | ADMIN | ADMIN crée commande fournisseur |
| `SUPPLIER_ORDERED` | ✅ Commande passée au fournisseur | ADMIN | Fournisseur livre |
| `PREPARATION` | En préparation (après réception fournisseur) | ADMIN/PREPARATEUR | Préparateur prépare |
| `LIVRAISON` | Prête pour livraison | ADMIN/PREPARATEUR | Livreur livre |
| `LIVREE` | Livrée au magasin | LIVREUR | Client confirme réception |
| `ANNULEE` | Commande annulée | ADMIN/CLIENT | - |

### SupplierOrderStatus (commandes fournisseurs)

| Statut | Description | Qui peut changer |
|--------|-------------|------------------|
| `DRAFT` | Brouillon | ADMIN |
| `SENT` | Envoyée au fournisseur | ADMIN |
| `CONFIRMED` | Confirmée par le fournisseur | Fournisseur |
| `DELIVERED` | Livrée par le fournisseur | ADMIN |
| `CANCELLED` | Annulée | ADMIN |

---

## 🔄 TRANSITIONS DE STATUT

### Machine à états (validée par middleware)

```
NEW → AGGREGATED (ADMIN uniquement)
  ↓
AGGREGATED → SUPPLIER_ORDERED (ADMIN uniquement)
  ↓
SUPPLIER_ORDERED → PREPARATION (ADMIN - après réception fournisseur)
  ↓
PREPARATION → LIVRAISON (ADMIN, PREPARATEUR)
  ↓
LIVRAISON → LIVREE (ADMIN, LIVREUR)
  ↓
* → ANNULEE (ADMIN ou CLIENT propriétaire)
```

**Protection** : Le middleware `orderStateMachine.js` valide toutes les transitions.

---

## 💰 GESTION FINANCIÈRE

### Facturation

- ✅ **Basée sur `quantityDelivered`** : Seules les quantités réellement livrées sont facturées
- ✅ **Écarts fournisseur** : Enregistrés dans `OrderItem.quantityDelivered`
- ✅ **Facture générée** : Automatiquement après statut `LIVREE`

### Commissions Fattah (ADMIN)

- ✅ **Calculées sur les quantités livrées** : `quantityDelivered`, pas `quantity`
- ✅ **Vue consolidée** : `/admin/analytics`
- ✅ **Rapports** : `/admin/reports`

---

## 🔔 NOTIFICATIONS EN TEMPS RÉEL

Le système utilise **WebSocket** pour les notifications :

1. **Nouvelle commande** (`NEW`) → Notification ADMIN
2. **Commandes agrégées** (`AGGREGATED`) → Notification ADMIN
3. **Commande fournisseur créée** (`SUPPLIER_ORDERED`) → Notification ADMIN
4. **Commande prête** (`LIVRAISON`) → Notification CLIENT + LIVREUR
5. **Commande livrée** (`LIVREE`) → Notification CLIENT

---

## 📋 RÉSUMÉ DU FLUX POUR VOUS (ADMIN)

```
1. CLIENT crée commande → Statut: NEW
   ↓
2. Vous recevez NOTIFICATION (temps réel)
   ↓
3. Vous AGRÉGEZ les commandes NEW → Statut: AGGREGATED
   (Page: /admin/orders/aggregate)
   ↓
4. Vous CRÉEZ commande fournisseur → Statut: SUPPLIER_ORDERED
   (Page: /admin/supplier-orders)
   ↓
5. Fournisseur LIVRE → Vous enregistrez quantités reçues
   → Statut: PREPARATION
   ↓
6. Vous/Préparateur PRÉPARE → Statut: LIVRAISON
   ↓
7. Livreur LIVRE → Statut: LIVREE
   ↓
8. CLIENT confirme réception
   ↓
9. Facture générée (basée sur quantityDelivered)
   ↓
10. Vous recevez votre COMMISSION
```

---

## 🎯 POINTS CLÉS À RETENIR

### ✅ Ce qui fonctionne automatiquement

1. **Notifications en temps réel** : Vous êtes alerté dès qu'une commande est créée
2. **Agrégation** : Groupement automatique par date et produit
3. **Groupement par fournisseur** : Automatique lors de la création de commande fournisseur
4. **Facturation** : Génération automatique basée sur quantités livrées
5. **Commissions** : Calcul automatique sur les quantités livrées

### ⚠️ Actions manuelles nécessaires

1. **Agréger les commandes** : Vous devez agréger les commandes NEW
2. **Créer commande fournisseur** : Vous devez créer la commande chez le fournisseur
3. **Enregistrer réception fournisseur** : Vous devez enregistrer les quantités reçues
4. **Gérer les écarts** : Vous devez noter les écarts entre commandé et reçu

---

## 🔍 OÙ VOIR LES COMMANDES

### En tant qu'ADMIN (Vous)

- **Toutes les commandes** : `/admin/orders`
- **Agrégation** : `/admin/orders/aggregate` ✅ NOUVEAU
- **Commandes fournisseur** : `/admin/supplier-orders` ✅ NOUVEAU
- **Dashboard** : `/admin/dashboard` (statistiques globales)
- **Analytics** : `/admin/analytics` (commissions, revenus)
- **Rapports** : `/admin/reports` (rapports détaillés)

### En tant que CLIENT (Magasin)

- **Ses commandes** : `/client/orders`
- **Créer commande** : `/client/orders/create`
- **Préparation** : `/client/preparation` (si préparateur)
- **Finances** : `/client/finances` (factures)

---

## ⚠️ DIFFÉRENCES AVEC L'ANCIEN SYSTÈME

### AVANT (avec stock admin)
- ❌ Stock décrémenté à la création
- ❌ Vérification de stock avant création
- ❌ Gestion de stock interne

### APRÈS (intermédiaire)
- ✅ Aucun stock décrémenté
- ✅ Pas de vérification de stock
- ✅ Agrégation obligatoire
- ✅ Commandes fournisseur
- ✅ Gestion des écarts fournisseur
- ✅ Facturation sur quantités livrées

---

## 📚 DOCUMENTATION TECHNIQUE

Pour les détails techniques, voir :
- `TRANSFORMATION_COMPLETE_GUIDE.md` - Guide technique complet
- `CHANGEMENTS_EFFECTUES.md` - Détails des modifications
- `TRANSFORMATION_FINALE_RESUME.md` - Résumé de la transformation

---

**Dernière mise à jour** : 23 Janvier 2026
