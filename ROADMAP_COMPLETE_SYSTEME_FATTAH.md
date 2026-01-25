# 📋 ROADMAP COMPLÈTE SYSTÈME FATTAH
**Date** : 20 janvier 2026

---

## 🎯 OBJECTIF

Créer un système B2B complet pour Fattah (intermédiaire grossiste) avec :
- ✅ Gestion temporelle des commandes (12h-20h)
- ✅ Visibilité différée ADMIN (00h00)
- ✅ Workflow complet commandes → fournisseurs
- ✅ Séparation stricte : Fattah / Manager / Magasin
- ✅ Gestion prix d'achat / prix de vente / marges / commissions
- ✅ Rapports et statistiques détaillés

---

# 1️⃣ ADMIN – FATTAH (Intermédiaire / Grossiste)

## 📊 Dashboard Admin

### ✅ Existant
- [x] Statistiques globales (clients, magasins, utilisateurs, commandes, produits)
- [x] Commission totale (pas CA magasins)
- [x] Alerte horaire "Réception commandes à 00h00"
- [x] Actions rapides (nouveau client, magasin, utilisateur, produit)
- [x] Filtre temporel (commandes J-1 uniquement)

### ❌ Manquant
- [ ] Résumé commandes aujourd'hui / hier / semaine (avec graphiques)
- [ ] Statistiques ventes propres ADMIN (séparées des magasins)
- [ ] Top 5 produits commandés
- [ ] Top 5 magasins actifs
- [ ] Alertes commandes urgentes à traiter
- [ ] Calendrier commandes par jour
- [ ] Graphiques évolution commandes (7j / 30j)
- [ ] Indicateurs KPI (taux traitement, délai moyen, satisfaction)

---

## 📦 Commandes reçues

### ✅ Existant
- [x] Page `/admin/orders` créée
- [x] Liste des commandes
- [x] Commission totale (pas montant total)
- [x] Filtrage par statut

### ❌ Manquant
- [ ] **Détails commande** :
  - [ ] Produits avec quantités
  - [ ] Prix d'achat transmis par fournisseur
  - [ ] Prix de vente au magasin
  - [ ] Marge / Commission calculée
  - [ ] Statut workflow (reçue → validée → transmise → préparée → expédiée → livrée)
- [ ] **Filtres avancés** :
  - [ ] Par date (plage personnalisée)
  - [ ] Par magasin (dropdown)
  - [ ] Par manager (dropdown)
  - [ ] Par produit (recherche)
  - [ ] Par montant (min/max)
- [ ] **Recherche rapide** :
  - [ ] Par numéro commande
  - [ ] Par nom magasin
  - [ ] Par nom produit
- [ ] **Actions en masse** :
  - [ ] Sélection multiple commandes
  - [ ] Validation groupée
  - [ ] Export groupé (Excel/PDF)

---

## ⚙️ Traitement commandes

### ✅ Existant
- [x] Page Orders avec liste

### ❌ Manquant
- [ ] **Modal détail commande** avec :
  - [ ] Produits détaillés (tableau)
  - [ ] Quantités demandées
  - [ ] Stock disponible chez fournisseur (à renseigner)
  - [ ] Prix d'achat unitaire
  - [ ] Total HT / TTC
- [ ] **Workflow validation** :
  - [ ] Bouton "Valider commande"
  - [ ] Bouton "Refuser commande" (avec motif)
  - [ ] Bouton "Demander modification"
- [ ] **Transmission fournisseurs** :
  - [ ] Sélection fournisseur(s)
  - [ ] Génération bon commande fournisseur (PDF)
  - [ ] Email automatique au fournisseur
  - [ ] Date livraison attendue
- [ ] **Suivi traitement** :
  - [ ] Marquer "Préparée" (avec date)
  - [ ] Marquer "Expédiée" (avec transporteur, n° suivi)
  - [ ] Marquer "Livrée" (avec signature, date réception)
- [ ] **Génération documents** :
  - [ ] Bon commande PDF
  - [ ] Bon livraison PDF
  - [ ] Facture PDF
  - [ ] Export Excel détaillé

---

## 🏭 Fournisseurs

### ✅ Existant
- [x] Ressource `SUPPLIERS` dans permissions
- [x] ADMIN peut gérer fournisseurs (CRUD)

### ❌ Manquant - PAGE COMPLÈTE À CRÉER
- [ ] **Page `/admin/suppliers`** :
  - [ ] Liste fournisseurs (tableau)
  - [ ] Colonnes : Nom, Contact, Email, Téléphone, Adresse, Produits, Actions
  - [ ] Bouton "Ajouter fournisseur"
  - [ ] Recherche / Filtres
- [ ] **Modal ajout/modification fournisseur** :
  - [ ] Nom entreprise
  - [ ] Contact principal
  - [ ] Email / Téléphone
  - [ ] Adresse complète
  - [ ] SIRET / TVA
  - [ ] Délais livraison moyen
  - [ ] Conditions paiement
  - [ ] Notes
- [ ] **Prix fournisseur par produit** :
  - [ ] Tableau produits fournis
  - [ ] Prix unitaire par produit
  - [ ] Quantité minimale commande
  - [ ] Délai livraison par produit
- [ ] **Historique commandes fournisseur** :
  - [ ] Liste commandes envoyées
  - [ ] Montants totaux
  - [ ] Statuts
  - [ ] Dates
- [ ] **API** :
  - [ ] `src/api/suppliers.js` à créer
  - [ ] `getSuppliers()`, `createSupplier()`, `updateSupplier()`, `deleteSupplier()`
  - [ ] `getSupplierProducts()`, `updateSupplierPrice()`
  - [ ] `getSupplierOrders()`

---

## 💰 Ventes ADMIN

### ✅ Existant
- [x] Commission totale affichée dans Dashboard

### ❌ Manquant - PAGE COMPLÈTE À CRÉER
- [ ] **Page `/admin/sales`** :
  - [ ] Liste ventes propres Fattah (pas magasins)
  - [ ] Colonnes : Date, Client, Produits, Qté, Prix achat, Prix vente, Marge, Commission
  - [ ] Total HT / TTC
  - [ ] Filtres par période
- [ ] **Détail vente** :
  - [ ] Produits vendus
  - [ ] Prix d'achat fournisseur
  - [ ] Prix de vente client
  - [ ] Marge unitaire et totale
  - [ ] Commission Fattah
  - [ ] Mode paiement
  - [ ] Statut paiement
- [ ] **Rapports ventes** :
  - [ ] Par période (jour/semaine/mois/année)
  - [ ] Par produit (top ventes)
  - [ ] Par client (top clients)
  - [ ] Évolution graphique
- [ ] **API** :
  - [ ] `src/api/sales.js` à créer
  - [ ] `getSales()`, `getSaleDetails()`, `getSalesReport()`

---

## 📈 Rapports & Statistiques

### ✅ Existant
- [x] Dashboard avec stats basiques

### ❌ Manquant - PAGE COMPLÈTE À CRÉER
- [ ] **Page `/admin/reports`** :
  - [ ] **Rapports commandes** :
    - [ ] Commandes par période (graphique ligne)
    - [ ] Commandes par statut (graphique camembert)
    - [ ] Commandes par magasin (graphique barres)
    - [ ] Évolution quotidienne/hebdomadaire/mensuelle
  - [ ] **Rapports marges** :
    - [ ] Marge totale par période
    - [ ] Marge par commande
    - [ ] Marge par produit
    - [ ] Top 10 produits rentables
  - [ ] **Rapports commissions** :
    - [ ] Commission totale par période
    - [ ] Commission par client/magasin
    - [ ] Évolution graphique
  - [ ] **Rapports magasins** :
    - [ ] Activité par magasin
    - [ ] Top magasins commandes
    - [ ] Top magasins CA
  - [ ] **Export** :
    - [ ] PDF complet
    - [ ] Excel détaillé
    - [ ] Graphiques inclus
- [ ] **API** :
  - [ ] `src/api/reports.js` à créer
  - [ ] `getOrdersReport()`, `getMarginsReport()`, `getCommissionsReport()`, `getStoresReport()`

---

## ⚙️ Pages secondaires ADMIN

### ✅ Existant
- [x] `/admin/products` - Gestion produits
- [x] `/admin/settings` - Paramètres compte
- [x] `/admin/users` - Gestion utilisateurs
- [x] `/admin/clients` - Gestion clients
- [x] `/admin/stores` - Gestion magasins

### ❌ Manquant
- [ ] **Paramètres généraux système** :
  - [ ] Catégories produits
  - [ ] Unités de mesure
  - [ ] Taux de TVA
  - [ ] Taux commission par défaut
  - [ ] Horaires système (12h-20h modifiable)
  - [ ] Fenêtre livraison (10h-12h modifiable)
  - [ ] Templates emails
- [ ] **Gestion managers** :
  - [ ] Liste managers
  - [ ] Assignation magasins à manager
  - [ ] Permissions spécifiques
- [ ] **Notifications / Alertes** :
  - [ ] Configuration alertes
  - [ ] Templates notifications
  - [ ] Historique notifications envoyées
- [ ] **Historique interactions** :
  - [ ] Log actions ADMIN
  - [ ] Log interactions magasins/managers
  - [ ] Audit trail complet
- [ ] **Aide / FAQ** :
  - [ ] Guide utilisateur complet
  - [ ] Vidéos tutoriels
  - [ ] FAQ par rôle

---

# 2️⃣ MANAGER – Responsable multi-magasins

## 📊 Dashboard Manager

### ✅ Existant
- [x] Page `/manager/dashboard` créée
- [x] Liste des magasins assignés
- [x] Stats consolidées (commandes, CA)

### ❌ Manquant
- [ ] **Vue synthétique magasins** :
  - [ ] Carte par magasin avec :
    - [ ] Photo magasin
    - [ ] Stock actuel (niveau global)
    - [ ] Ventes du jour
    - [ ] Commandes en cours
    - [ ] Alertes (stock faible, commande urgente)
  - [ ] Graphiques :
    - [ ] Évolution ventes par magasin (7j)
    - [ ] Comparaison performance magasins
- [ ] **Alertes prioritaires** :
  - [ ] Produits faibles en stock (badge rouge)
  - [ ] Commandes non traitées (badge orange)
  - [ ] Ventes exceptionnelles (badge vert)
- [ ] **Statistiques globales** :
  - [ ] CA total tous magasins
  - [ ] Marge totale
  - [ ] Top 5 produits vendus
  - [ ] Top 3 magasins performants

---

## 🏪 Gestion des magasins

### ✅ Existant
- [x] Page `/manager/stores` créée
- [x] Liste des magasins assignés
- [x] Filtres basiques

### ❌ Manquant
- [ ] **Détails magasin** (modal ou page dédiée) :
  - [ ] **Onglet Infos** :
    - [ ] Nom, adresse, contact
    - [ ] Horaires ouverture
    - [ ] Manager assigné
    - [ ] Employés (liste)
  - [ ] **Onglet Stock** :
    - [ ] Liste produits disponibles
    - [ ] Quantités actuelles
    - [ ] Alertes stock faible
    - [ ] Historique mouvements
  - [ ] **Onglet Ventes** :
    - [ ] Ventes du jour/semaine/mois
    - [ ] Prix d'achat vs Prix de vente
    - [ ] Marge réalisée
    - [ ] Graphiques évolution
  - [ ] **Onglet Commandes** :
    - [ ] Commandes passées
    - [ ] Commandes en cours
    - [ ] Historique complet
- [ ] **Actions rapides** :
  - [ ] Créer commande pour ce magasin
  - [ ] Voir stock détaillé
  - [ ] Voir ventes détaillées

---

## 📦 Commandes Manager

### ✅ Existant
- [x] Page `/manager/orders` créée (placeholder)

### ❌ Manquant - PAGE COMPLÈTE À CRÉER
- [ ] **Page commandes consolidée** :
  - [ ] Liste toutes commandes de SES magasins
  - [ ] Colonnes : N°, Date, Magasin, Produits, Montant, Statut, Actions
  - [ ] Filtres :
    - [ ] Par magasin (dropdown)
    - [ ] Par date (plage)
    - [ ] Par statut
    - [ ] Par produit
- [ ] **Créer commande** :
  - [ ] Sélection magasin (dropdown)
  - [ ] Sélection produits (recherche + quantités)
  - [ ] Horaire 12h-20h respecté
  - [ ] Prix d'achat affiché (transmis par ADMIN)
  - [ ] Calcul automatique total
  - [ ] Validation avec résumé
- [ ] **Détail commande** :
  - [ ] Produits commandés (tableau)
  - [ ] Prix d'achat unitaire
  - [ ] Quantités
  - [ ] Total HT/TTC
  - [ ] Statut workflow :
    - [ ] Envoyée (12h-20h)
    - [ ] Reçue par ADMIN (00h00)
    - [ ] Validée par ADMIN
    - [ ] Transmise fournisseur
    - [ ] Préparée
    - [ ] Expédiée (n° suivi)
    - [ ] Livrée (10h-12h recommandé)
- [ ] **Historique commandes** :
  - [ ] Toutes commandes passées
  - [ ] Filtres avancés
  - [ ] Export Excel/PDF
- [ ] **Génération documents** :
  - [ ] Bon commande PDF
  - [ ] Bon réception PDF

---

## 📦 Stocks magasins

### ✅ Existant
- [x] Page `/manager/stocks` créée (placeholder)

### ❌ Manquant - PAGE COMPLÈTE À CRÉER
- [ ] **Vue stock consolidée** :
  - [ ] Liste tous produits tous magasins
  - [ ] Colonnes : Produit, Magasin, Qté actuelle, Qté mini, Statut, Actions
  - [ ] Filtres :
    - [ ] Par magasin
    - [ ] Par produit
    - [ ] Par statut (OK / Faible / Rupture)
- [ ] **Alertes stock** :
  - [ ] Produits faibles (badge orange)
  - [ ] Ruptures stock (badge rouge)
  - [ ] Notification automatique
- [ ] **Détail stock produit** :
  - [ ] Stock par magasin (tableau)
  - [ ] Graphique évolution stock (7j/30j)
  - [ ] Prévisions besoin (basé ventes)
- [ ] **Historique mouvements** :
  - [ ] Entrées (livraisons)
  - [ ] Sorties (ventes)
  - [ ] Ajustements manuels
  - [ ] Date, quantité, responsable
- [ ] **Actions** :
  - [ ] Créer commande réapprovisionnement
  - [ ] Ajustement manuel stock
  - [ ] Export Excel

---

## 💰 Ventes magasins

### ✅ Existant
- [x] Stats ventes dans Dashboard Manager

### ❌ Manquant - PAGE COMPLÈTE À CRÉER
- [ ] **Page `/manager/sales`** :
  - [ ] Liste ventes tous magasins
  - [ ] Colonnes : Date, Magasin, Produit, Qté, Prix achat, Prix vente, Marge
  - [ ] Filtres :
    - [ ] Par magasin
    - [ ] Par période
    - [ ] Par produit
- [ ] **Statistiques ventes** :
  - [ ] CA par magasin (graphique barres)
  - [ ] Évolution ventes (graphique ligne)
  - [ ] Top produits vendus (par magasin)
  - [ ] Comparaison magasins
- [ ] **Analyse marges** :
  - [ ] Marge par produit
  - [ ] Marge par magasin
  - [ ] Marge globale
  - [ ] Évolution graphique
- [ ] **Export** :
  - [ ] Excel détaillé
  - [ ] PDF rapport
  - [ ] Graphiques inclus

---

## 📈 Rapports Manager

### ✅ Existant
- [x] Page `/manager/reports` créée (placeholder)

### ❌ Manquant - PAGE COMPLÈTE À CRÉER
- [ ] **Rapports consolidés** :
  - [ ] Performance magasins (comparatif)
  - [ ] Évolution CA (7j/30j/1an)
  - [ ] Rentabilité par magasin
  - [ ] Top/Flop produits
- [ ] **Rapports personnalisés** :
  - [ ] Sélection période
  - [ ] Sélection magasins
  - [ ] Sélection métriques
  - [ ] Génération PDF/Excel
- [ ] **Graphiques avancés** :
  - [ ] Évolution temporelle (lignes)
  - [ ] Comparaison magasins (barres)
  - [ ] Répartition produits (camembert)
  - [ ] Heatmap activité

---

## ⚙️ Pages secondaires Manager

### ✅ Existant
- [x] `/manager/settings` - Paramètres compte

### ❌ Manquant
- [ ] **Notifications** :
  - [ ] Configuration alertes
  - [ ] Historique notifications
- [ ] **Profils magasins** :
  - [ ] Modification infos magasins
  - [ ] Gestion employés magasins
- [ ] **Aide / Guide** :
  - [ ] Guide workflow manager
  - [ ] FAQ spécifique manager
  - [ ] Tutoriels vidéo

---

# 3️⃣ SHOP – Magasin unique

## 📊 Dashboard magasin

### ✅ Existant
- [x] Page `/store/dashboard` créée
- [x] Stats basiques (commandes, ventes)
- [x] Badge fenêtre livraison (10h-12h)

### ❌ Manquant
- [ ] **Stock actuel** :
  - [ ] Top 10 produits en stock
  - [ ] Alertes stock faible (badge rouge)
  - [ ] Graphique niveau stock global
- [ ] **Ventes du jour** :
  - [ ] CA du jour
  - [ ] Nombre ventes
  - [ ] Top 5 produits vendus
  - [ ] Graphique ventes heure par heure
- [ ] **Commandes en attente** :
  - [ ] Commandes passées non livrées
  - [ ] Statut en cours (timeline)
  - [ ] Date livraison prévue
- [ ] **Fenêtre livraison** :
  - [ ] Badge animé 10h-12h (déjà fait ✅)
  - [ ] Notification si livraison prévue aujourd'hui
  - [ ] Préparation réception (checklist)

---

## 📦 Passer commandes

### ✅ Existant
- [x] Validation horaire 12h-20h
- [x] Alerte si hors horaires
- [x] Badge temps restant

### ❌ Manquant - À AMÉLIORER
- [ ] **Sélection produits** :
  - [ ] Catalogue complet avec photos
  - [ ] Recherche rapide par nom
  - [ ] Filtres par catégorie
  - [ ] Prix d'achat affiché (si transmis par ADMIN)
  - [ ] Indication stock fournisseur disponible
- [ ] **Panier intelligent** :
  - [ ] Ajout quantité avec +/-
  - [ ] Calcul automatique total
  - [ ] Suggestion marge possible (si prix vente renseigné)
  - [ ] Alerte si quantité > stock fournisseur
- [ ] **Validation commande** :
  - [ ] Résumé complet
  - [ ] Date livraison souhaitée
  - [ ] Commentaires / Notes
  - [ ] Confirmation avec recap
- [ ] **Prix d'achat** :
  - [ ] Affiché pour chaque produit
  - [ ] Calcul marge possible si prix vente connu
  - [ ] Historique prix d'achat (évolution)

---

## 📦 Historique commandes

### ✅ Existant
- [x] Page `/store/orders` créée
- [x] Liste commandes

### ❌ Manquant
- [ ] **Détail commande** :
  - [ ] Produits commandés (tableau)
  - [ ] Prix d'achat unitaire
  - [ ] Quantités
  - [ ] Total HT/TTC
  - [ ] Statut détaillé :
    - [ ] Envoyée (heure envoi)
    - [ ] Reçue par ADMIN (00h00)
    - [ ] Validée (date validation)
    - [ ] En préparation (fournisseur)
    - [ ] Expédiée (n° suivi + lien tracking)
    - [ ] Livrée (date réception + signature)
- [ ] **Filtres** :
  - [ ] Par date
  - [ ] Par statut
  - [ ] Par produit
- [ ] **Actions** :
  - [ ] Suivre commande (tracking)
  - [ ] Télécharger bon commande (PDF)
  - [ ] Réceptionner commande (signature)
  - [ ] Signaler problème
- [ ] **Export** :
  - [ ] Excel historique
  - [ ] PDF commande

---

## 📦 Stocks magasin

### ✅ Existant
- [x] Page `/store/stocks` créée
- [x] Liste produits

### ❌ Manquant
- [ ] **Liste produits détaillée** :
  - [ ] Photo produit
  - [ ] Nom + Description
  - [ ] Quantité actuelle
  - [ ] Quantité minimale
  - [ ] Statut (OK / Faible / Rupture)
  - [ ] Dernière entrée (date)
  - [ ] Prix d'achat moyen
- [ ] **Alertes stock** :
  - [ ] Badge rouge si rupture
  - [ ] Badge orange si < seuil mini
  - [ ] Notification push automatique
- [ ] **Historique mouvements** :
  - [ ] Entrées (livraisons) :
    - [ ] Date, quantité, fournisseur, prix unitaire
  - [ ] Sorties (ventes) :
    - [ ] Date, quantité, prix vente
  - [ ] Ajustements :
    - [ ] Date, quantité, motif, responsable
- [ ] **Actions** :
  - [ ] Ajustement manuel (avec motif)
  - [ ] Commander réapprovisionnement
  - [ ] Export Excel
- [ ] **Graphiques** :
  - [ ] Évolution stock 7j/30j
  - [ ] Prévision rupture (basé sur ventes)

---

## 💰 Ventes magasin

### ✅ Existant
- [x] Stats ventes dans Dashboard

### ❌ Manquant - PAGE COMPLÈTE À CRÉER
- [ ] **Page `/store/sales`** :
  - [ ] Liste ventes
  - [ ] Colonnes : Date, Heure, Produits, Qté, Prix achat, Prix vente, Marge, Client
  - [ ] Filtres :
    - [ ] Par date (jour/semaine/mois)
    - [ ] Par produit
    - [ ] Par client (si enregistré)
- [ ] **Statistiques ventes** :
  - [ ] CA jour/semaine/mois
  - [ ] Nombre ventes
  - [ ] Ticket moyen
  - [ ] Top produits vendus
- [ ] **Analyse marges** :
  - [ ] Prix d'achat vs Prix de vente
  - [ ] Marge unitaire et globale
  - [ ] Marge par produit
  - [ ] Évolution marge (graphique)
- [ ] **Graphiques** :
  - [ ] Évolution CA (ligne)
  - [ ] Ventes par produit (barres)
  - [ ] Ventes par heure (heatmap)
  - [ ] Comparaison périodes
- [ ] **Export** :
  - [ ] Excel détaillé
  - [ ] PDF rapport journalier/mensuel

---

## ⚙️ Pages secondaires Shop

### ✅ Existant
- [x] `/store/settings` - Paramètres compte
- [x] `/store/products` - Liste produits
- [x] `/store/preparation` - Préparation commandes
- [x] `/store/deliveries` - Livraisons
- [x] `/store/users` - Gestion utilisateurs magasin

### ❌ Manquant
- [ ] **Profil magasin** :
  - [ ] Infos contact (à modifier)
  - [ ] Adresse (à modifier)
  - [ ] Manager associé (lecture seule)
  - [ ] Horaires ouverture
- [ ] **Notifications suivi** :
  - [ ] Historique notifications reçues
  - [ ] Configuration alertes
- [ ] **Rapports simples** :
  - [ ] Rapport ventes journalier (auto)
  - [ ] Rapport commandes semaine
  - [ ] Rapport stock (état actuel)
- [ ] **Aide / Guide** :
  - [ ] Guide utilisateur magasin
  - [ ] FAQ magasin
  - [ ] Tutoriels commandes/stock/ventes

---

# 4️⃣ PAGES TRANSVERSALES / UTILITAIRES

## 🔔 Notifications / Alertes

### ✅ Existant
- [x] Composant `NotificationCenter` créé
- [x] Cloche avec badge dans header
- [x] Notifications mock par rôle

### ❌ Manquant - SYSTÈME COMPLET
- [ ] **Backend notifications** :
  - [ ] Table `notifications` en BDD
  - [ ] API `getNotifications()`, `markAsRead()`, `deleteNotification()`
  - [ ] Système événements (EventEmitter)
- [ ] **Types notifications** :
  - [ ] **ADMIN** :
    - [ ] Nouvelle commande reçue (00h00)
    - [ ] Commande urgente
    - [ ] Alerte stock fournisseur
  - [ ] **MANAGER** :
    - [ ] Commande validée
    - [ ] Commande expédiée
    - [ ] Alerte stock faible magasin
  - [ ] **SHOP** :
    - [ ] Commande validée
    - [ ] Commande en route (+ tracking)
    - [ ] Fenêtre livraison (10h-12h)
    - [ ] Stock faible produit
- [ ] **Configuration** :
  - [ ] Activer/désactiver types
  - [ ] Email + push
  - [ ] Fréquence rappels
- [ ] **Historique** :
  - [ ] Toutes notifications envoyées
  - [ ] Statut (lue/non lue)
  - [ ] Actions associées

---

## 📈 Rapports / Statistiques globaux

### ✅ Existant
- [x] Stats Dashboard par rôle

### ❌ Manquant - PAGES DÉDIÉES
- [ ] **ADMIN `/admin/analytics`** :
  - [ ] Graphiques avancés (Chart.js / Recharts)
  - [ ] KPI dashboard (taux conversion, délais, satisfaction)
  - [ ] Rapports personnalisables (période, métriques)
  - [ ] Export multi-format (PDF, Excel, PNG)
- [ ] **MANAGER `/manager/analytics`** :
  - [ ] Performance magasins (comparatif)
  - [ ] Rentabilité par magasin
  - [ ] Top/Flop produits magasins
  - [ ] Export rapports consolidés
- [ ] **SHOP `/store/analytics`** :
  - [ ] Résumé marge journalière
  - [ ] Évolution ventes 7j/30j
  - [ ] Top produits rentables
  - [ ] Export simple (PDF/Excel)

---

## ⚙️ Paramètres utilisateurs

### ✅ Existant
- [x] Pages Settings par rôle (ADMIN, MANAGER, SHOP)
- [x] Modification profil
- [x] Changement mot de passe

### ❌ Manquant
- [ ] **Photo profil** :
  - [ ] Upload image
  - [ ] Crop/resize
  - [ ] Aperçu
- [ ] **Infos contact** :
  - [ ] Téléphone (à ajouter)
  - [ ] Adresse (à ajouter)
- [ ] **Préférences** :
  - [ ] Langue (FR/EN/AR)
  - [ ] Fuseau horaire
  - [ ] Format date/heure
  - [ ] Devise
- [ ] **Notifications** :
  - [ ] Email activé/désactivé
  - [ ] Push activé/désactivé
  - [ ] Fréquence

---

## ❓ FAQ / Aide

### ✅ Existant
- [x] Aucune page aide actuellement

### ❌ Manquant - À CRÉER COMPLÈTEMENT
- [ ] **Page `/help`** (tous rôles) :
  - [ ] Guide complet workflow
  - [ ] Explications rôles
  - [ ] Horaires et règles
  - [ ] FAQ par section
  - [ ] Recherche dans l'aide
- [ ] **Tutoriels vidéo** :
  - [ ] Comment passer commande
  - [ ] Comment gérer stock
  - [ ] Comment consulter ventes
  - [ ] Comment générer rapports
- [ ] **Support** :
  - [ ] Formulaire contact support
  - [ ] Chat live (optionnel)
  - [ ] Ticket système

---

## 📜 Historique actions

### ✅ Existant
- [x] Aucun système d'audit actuellement

### ❌ Manquant - À CRÉER COMPLÈTEMENT
- [ ] **Audit trail backend** :
  - [ ] Table `audit_logs` en BDD
  - [ ] Log automatique actions critiques
  - [ ] Champs : user, action, resource, date, IP, détails
- [ ] **Page `/admin/audit`** (ADMIN uniquement) :
  - [ ] Liste toutes actions système
  - [ ] Filtres : user, action, date, resource
  - [ ] Recherche avancée
  - [ ] Export logs (Excel/CSV)
- [ ] **Actions logguées** :
  - [ ] Connexion/déconnexion
  - [ ] Création/modification/suppression (users, produits, commandes, etc.)
  - [ ] Validation commandes
  - [ ] Changements prix
  - [ ] Ajustements stock
  - [ ] Exports effectués

---

# 📊 RÉCAPITULATIF PAGES

## ✅ EXISTANT (31 pages)

| Rôle | Page | Statut |
|------|------|--------|
| **ADMIN** | Dashboard | ✅ Partiel |
| **ADMIN** | Orders | ✅ Partiel |
| **ADMIN** | Stores | ✅ Complet |
| **ADMIN** | Users | ✅ Complet |
| **ADMIN** | Clients | ✅ Complet |
| **ADMIN** | Products | ✅ Complet |
| **ADMIN** | Settings | ✅ Complet |
| **MANAGER** | Dashboard | ✅ Partiel |
| **MANAGER** | Stores | ✅ Partiel |
| **MANAGER** | Orders | ✅ Placeholder |
| **MANAGER** | Stocks | ✅ Placeholder |
| **MANAGER** | Reports | ✅ Placeholder |
| **MANAGER** | Settings | ✅ Complet |
| **STORE** | Dashboard | ✅ Partiel |
| **STORE** | Orders | ✅ Partiel |
| **STORE** | Preparation | ✅ Complet |
| **STORE** | Products | ✅ Complet |
| **STORE** | Stocks | ✅ Partiel |
| **STORE** | Deliveries | ✅ Complet |
| **STORE** | Users | ✅ Complet |
| **STORE** | Settings | ✅ Complet |
| **CLIENT** | Dashboard | ✅ Complet |
| **CLIENT** | Orders | ✅ Partiel |
| **CLIENT** | OrderCreate | ✅ Partiel |
| **CLIENT** | Stores | ✅ Complet |
| **CLIENT** | Products | ✅ Complet |
| **CLIENT** | Stocks | ✅ Complet |
| **CLIENT** | Finances | ✅ Complet |
| **CLIENT** | Users | ✅ Complet |
| **CLIENT** | Settings | ✅ Complet |
| **AUTH** | Login | ✅ Complet |

**TOTAL** : 31 pages créées

---

## ❌ MANQUANT (Pages à créer)

| Rôle | Page | Priorité |
|------|------|----------|
| **ADMIN** | `/admin/suppliers` | 🔴 Critique |
| **ADMIN** | `/admin/sales` | 🔴 Critique |
| **ADMIN** | `/admin/reports` | 🟠 Haute |
| **ADMIN** | `/admin/analytics` | 🟡 Moyenne |
| **ADMIN** | `/admin/audit` | 🟡 Moyenne |
| **ADMIN** | `/admin/system-settings` | 🟢 Basse |
| **MANAGER** | `/manager/sales` | 🔴 Critique |
| **MANAGER** | `/manager/analytics` | 🟠 Haute |
| **STORE** | `/store/sales` | 🔴 Critique |
| **STORE** | `/store/analytics` | 🟡 Moyenne |
| **GLOBAL** | `/help` | 🟠 Haute |
| **GLOBAL** | `/support` | 🟢 Basse |

**TOTAL** : 12 pages à créer

---

## 🔧 AMÉLIORATIONS (Pages partielles)

| Rôle | Page | Améliorations nécessaires |
|------|------|---------------------------|
| **ADMIN** | Dashboard | + Graphiques + Top produits/magasins + KPI |
| **ADMIN** | Orders | + Détails + Filtres avancés + Workflow complet |
| **MANAGER** | Dashboard | + Cartes magasins + Graphiques + Alertes |
| **MANAGER** | Stores | + Détails magasin + Onglets + Actions |
| **MANAGER** | Orders | Créer page complète (actuellement placeholder) |
| **MANAGER** | Stocks | Créer page complète (actuellement placeholder) |
| **MANAGER** | Reports | Créer page complète (actuellement placeholder) |
| **STORE** | Dashboard | + Stock actuel + Ventes jour + Graphiques |
| **STORE** | Orders | + Détails + Workflow + Tracking |
| **STORE** | Stocks | + Alertes + Historique + Graphiques |
| **CLIENT** | Orders | + Détails commande + Statut workflow |
| **CLIENT** | OrderCreate | + Catalogue amélioré + Panier intelligent |

**TOTAL** : 12 pages à améliorer

---

# 🎯 PLAN D'ACTION RECOMMANDÉ

## Phase 1 : CRITIQUE (2-3 semaines)
**Pages essentielles workflow commandes**

1. ✅ `/admin/suppliers` - Gestion fournisseurs
2. ✅ `/admin/sales` - Ventes ADMIN
3. ✅ `/manager/sales` - Ventes Manager
4. ✅ `/store/sales` - Ventes Magasin
5. ✅ Améliorer `/admin/orders` - Workflow complet
6. ✅ Créer `/manager/orders` - Commandes consolidées
7. ✅ Améliorer `/store/orders` - Détails + Tracking
8. ✅ Créer `/manager/stocks` - Stocks consolidés
9. ✅ Améliorer `/store/stocks` - Alertes + Historique

---

## Phase 2 : HAUTE PRIORITÉ (2-3 semaines)
**Rapports et analytics**

10. ✅ `/admin/reports` - Rapports ADMIN
11. ✅ `/manager/analytics` - Analytics Manager
12. ✅ `/help` - Système d'aide global
13. ✅ Améliorer Dashboards (graphiques + KPI)
14. ✅ Système notifications backend complet

---

## Phase 3 : MOYENNE PRIORITÉ (2-3 semaines)
**Analytics et audit**

15. ✅ `/admin/analytics` - Analytics avancé ADMIN
16. ✅ `/admin/audit` - Audit trail
17. ✅ `/store/analytics` - Analytics Magasin
18. ✅ Améliorer `/manager/stores` - Détails + onglets
19. ✅ Améliorer panier commande (intelligent)

---

## Phase 4 : BASSE PRIORITÉ (1-2 semaines)
**Finitions et support**

20. ✅ `/admin/system-settings` - Paramètres système
21. ✅ `/support` - Support client
22. ✅ Photos profil + Upload
23. ✅ Préférences utilisateurs avancées
24. ✅ Tutoriels vidéo

---

# 📦 API À CRÉER/AMÉLIORER

## ✅ Existant (6 APIs)
- [x] `src/api/orders.js`
- [x] `src/api/users.js`
- [x] `src/api/clients.js`
- [x] `src/api/stocks.js`
- [x] `src/api/stores.js`
- [x] `src/api/products.js`

## ❌ À créer
- [ ] `src/api/suppliers.js` 🔴
- [ ] `src/api/sales.js` 🔴
- [ ] `src/api/reports.js` 🟠
- [ ] `src/api/analytics.js` 🟠
- [ ] `src/api/notifications.js` 🟠
- [ ] `src/api/audit.js` 🟡
- [ ] `src/api/help.js` 🟢
- [ ] `src/api/upload.js` 🟢

---

# 🔥 FONCTIONNALITÉS PRIORITAIRES

## 1️⃣ Workflow commandes COMPLET
- [ ] Détails commande avec produits
- [ ] Statut workflow (7 étapes)
- [ ] Transmission fournisseurs
- [ ] Génération documents (PDF)
- [ ] Tracking livraison
- [ ] Réception avec signature

## 2️⃣ Gestion fournisseurs
- [ ] Page complète `/admin/suppliers`
- [ ] Prix fournisseur par produit
- [ ] Historique commandes fournisseur
- [ ] Génération bon commande fournisseur

## 3️⃣ Ventes et marges
- [ ] Pages ventes (ADMIN, MANAGER, STORE)
- [ ] Prix achat vs Prix vente
- [ ] Calcul marges automatique
- [ ] Graphiques évolution

## 4️⃣ Rapports et analytics
- [ ] Page rapports ADMIN
- [ ] Analytics MANAGER
- [ ] Graphiques avancés (Chart.js)
- [ ] Export multi-format

## 5️⃣ Notifications backend
- [ ] Table BDD notifications
- [ ] API complète
- [ ] Envoi automatique
- [ ] Email + Push

---

**ROADMAP COMPLÈTE CRÉÉE ! 📋✅**

**31 pages existantes**
**12 pages à créer**
**12 pages à améliorer**
**8 APIs à créer**

**Total estimé : 8-12 semaines développement complet**
