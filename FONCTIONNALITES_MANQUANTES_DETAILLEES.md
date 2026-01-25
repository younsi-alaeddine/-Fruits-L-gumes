# 📋 Fonctionnalités Manquantes - Analyse par rapport aux Captures d'Écran

## Date : 2024-01-14

Analyse détaillée des fonctionnalités présentes dans l'application de référence (U-Métiers) mais manquantes dans notre implémentation.

---

## 🔴 FONCTIONNALITÉS CRITIQUES MANQUANTES

### 1. **Filtres de Produits Avancés** ❌
**Présent dans la référence** : Barre de filtres avec boutons multiples
**Manquant** : Filtres par statut de produit

**Filtres à ajouter** :
- ✅ "Tous produits" (déjà présent via catégories)
- ❌ **"Rupture"** - Produits en rupture de stock
- ❌ **"Opportu"** - Produits opportunité
- ❌ **"Délai d'Appro"** - Produits avec délai d'approvisionnement
- ❌ **"Animation"** - Produits en animation commerciale
- ❌ **"Erreur"** - Produits avec erreur
- ❌ **"DLC Longue"** - Date limite de consommation longue
- ❌ **"DLC Courte"** - Date limite de consommation courte
- ❌ **"Ajustés"** - Produits ajustés
- ❌ **"Déjà commandé"** - Produits déjà dans une commande
- ❌ **"En campagne"** - Produits en campagne promotionnelle
- ❌ **"Plier" / "Déplier"** - Affichage compact/étendu

**Impact** : ⚠️ HAUTE - Essentiel pour la navigation et la gestion des produits

---

### 2. **Colonnes Manquantes dans le Tableau** ❌

**Colonnes présentes dans la référence mais manquantes** :
- ❌ **"Pre. Ass" (Pré-assigné)** - Indique si un produit est pré-assigné
- ❌ **"Op." (Opération)** - Colonne avec icônes d'opérations/actions
- ❌ **"Prés" (Présentation)** - Format de présentation du produit (PCE, SAC, BAR, etc.)
- ❌ **"Rupt" (Rupture)** - Indicateur visuel de rupture (icône/indicateur)

**Impact** : ⚠️ MOYENNE - Améliore la lisibilité et la gestion

---

### 3. **Groupement par Catégories avec Prix** ❌
**Présent dans la référence** : Sections groupées comme "FRUITS STICKES A 0,99x", "LEGUMES STICKES A 1,50"

**Manquant** :
- ❌ Groupement automatique par prix de vente
- ❌ Affichage du nombre de produits par groupe
- ❌ Sections collapsibles/expandables

**Exemple de structure attendue** :
```
FRUITS STICKES A 0,99x (1 Produit(s))
  └─ [Liste des produits à 0,99€]

LEGUMES STICKES A 1,50 (1 Produit(s))
  └─ [Liste des produits à 1,50€]
```

**Impact** : ⚠️ MOYENNE - Améliore l'organisation visuelle

---

### 4. **Stratégie de Prix et Ajustement de Colis** ❌
**Présent dans la référence** : Section "Stratégie prix" avec :
- Commande initiale : 10 colis
- Ajustement autorisé : entre 7 et 13 colis
- Affichage du nombre de colis actuel : 48

**Manquant** :
- ❌ Configuration de stratégie de prix par commande
- ❌ Définition de plage d'ajustement (min/max colis)
- ❌ Indicateur visuel si la commande est en ajustement
- ❌ Alerte si hors plage autorisée

**Impact** : ⚠️ HAUTE - Contrôle qualité et conformité

---

### 5. **Indicateurs Financiers Détaillés (Perm/Promo/Total)** ❌
**Présent dans la référence** : Tableau avec 3 colonnes (Perm, Promo, Total)

**Structure actuelle** : Une seule valeur
**Structure attendue** :
```
| Métrique      | Perm | Promo | Total |
|---------------|------|-------|-------|
| Nb réf        | 12   | 12    | 12    |
| Nb colis      | 42   | 42    | 42    |
| Poids         | 0    | 496   | 496   |
| PC            | 0    | 877   | 877   |
| PVC           | 0    | 1059  | 1059  |
| Marge (€)     | 0    | 127   | 127   |
| Marge (%)     | 0,00 | 12,69 | 12,69 |
| Pds promo CA % | -    | -     | 100,00|
```

**Manquant** :
- ❌ Séparation Perm/Promo/Total
- ❌ Colonne "PC" (Purchase Cost / Prix de cession total)
- ❌ Calcul séparé des marges permanentes vs promotionnelles

**Impact** : ⚠️ HAUTE - Analyse financière détaillée

---

### 6. **Boutons d'Action Manquants** ❌
**Présent dans la référence** :
- ❌ **"Stratégie prix"** - Configuration de la stratégie
- ❌ **"Tableau bord"** - Accès au tableau de bord
- ❌ **"Imprimer"** - Impression de la commande
- ❌ **"Exporter"** - Export Excel/CSV

**Impact** : ⚠️ MOYENNE - Fonctionnalités pratiques

---

### 7. **Réglages** ❌
**Présent dans la référence** :
- ❌ **"Réglages Centrale"** - Configuration centrale
- ❌ **"Réglages Utilisateurs"** - Préférences utilisateur

**Impact** : ⚠️ BASSE - Personnalisation

---

### 8. **Pagination Avancée** ❌
**Présent dans la référence** :
- Affichage : "Affichage des produits 1-40 sur 494"
- Options : 10, 20, 30, 40, 50 produits par page
- Navigation : "Page 1 sur 13"

**Manquant** :
- ❌ Pagination avec sélection du nombre d'éléments par page
- ❌ Compteur d'affichage (X-Y sur Z)
- ❌ Navigation par pages

**Impact** : ⚠️ MOYENNE - Performance et UX

---

### 9. **Informations d'Ajustement de Commande** ❌
**Présent dans la référence** :
- "Commande en AJUSTEMENT"
- "Initiale: 10 colis, ajustement autorisé entre 7 et 13"
- "Nombre Colis: 48"
- "PVC provisoire"

**Manquant** :
- ❌ Bannière d'alerte pour commande en ajustement
- ❌ Affichage des limites min/max
- ❌ Indicateur "PVC provisoire" vs "PVC final"

**Impact** : ⚠️ MOYENNE - Gestion des ajustements

---

### 10. **Icônes et Indicateurs Visuels** ❌
**Présent dans la référence** :
- ❌ Icônes dans la colonne "Op." (opérations)
- ❌ Indicateurs visuels de rupture (rouge)
- ❌ Badges de statut produits
- ❌ Icônes de panier, recherche, etc.

**Impact** : ⚠️ BASSE - Améliore l'UX mais non critique

---

### 11. **Recherche par Gencod/Barcode** ❌
**Présent dans la référence** : "Nº pdt, gencod, libellé"

**Manquant** :
- ❌ Recherche par code produit
- ❌ Recherche par code-barres (gencod/EAN)
- ❌ Recherche par libellé (déjà présent)

**Impact** : ⚠️ MOYENNE - Efficacité de recherche

---

### 12. **Affichage "Présentation" dans le Tableau** ❌
**Présent dans la référence** : Colonne "Prés" avec valeurs comme PCE, SAC, BAR, KGS

**Manquant** :
- ❌ Colonne dédiée à la présentation
- ❌ Distinction entre "Conditionnement" et "Présentation"

**Note** : Nous avons "Conditionnement" mais pas "Présentation" comme colonne séparée

**Impact** : ⚠️ BASSE - Information redondante mais peut être utile

---

### 13. **Sélection de Magasin/Point de Vente** ❌
**Présent dans la référence** : Dropdown avec "20077" et "MARLY LE ROI"

**Manquant** :
- ❌ Sélection du magasin/point de vente
- ❌ Affichage du code magasin
- ❌ Filtrage par magasin

**Impact** : ⚠️ BASSE - Si multi-magasins

---

### 14. **Avertissements et Alertes Système** ❌
**Présent dans la référence** : "Avertissement d... Récemment émis"

**Manquant** :
- ❌ Système d'avertissements récents
- ❌ Centre d'alertes
- ❌ Notifications d'événements système

**Impact** : ⚠️ BASSE - Information mais non critique

---

## 📊 RÉSUMÉ PAR PRIORITÉ

### 🔴 PRIORITÉ HAUTE (À implémenter rapidement)
1. ✅ Filtres de produits avancés (Rupture, Opportu, Animation, etc.)
2. ✅ Indicateurs financiers détaillés (Perm/Promo/Total)
3. ✅ Stratégie de prix et ajustement de colis
4. ✅ Colonnes manquantes (Pre. Ass, Op., Prés, Rupt)

### 🟡 PRIORITÉ MOYENNE (Important mais pas urgent)
5. ✅ Groupement par catégories avec prix
6. ✅ Pagination avancée
7. ✅ Recherche par gencod/barcode
8. ✅ Boutons d'action (Imprimer, Exporter, Tableau bord)
9. ✅ Informations d'ajustement de commande

### 🟢 PRIORITÉ BASSE (Améliorations UX)
10. ✅ Icônes et indicateurs visuels
11. ✅ Réglages (Centrale, Utilisateurs)
12. ✅ Sélection magasin/point de vente
13. ✅ Avertissements et alertes système
14. ✅ Colonne "Présentation" séparée

---

## 🎯 PLAN D'IMPLÉMENTATION RECOMMANDÉ

### Phase 1 (1-2 semaines) - Priorité HAUTE
1. Ajouter les filtres de produits avancés
2. Implémenter les indicateurs financiers Perm/Promo/Total
3. Ajouter la stratégie de prix et ajustement de colis
4. Ajouter les colonnes manquantes au tableau

### Phase 2 (2-3 semaines) - Priorité MOYENNE
5. Implémenter le groupement par catégories avec prix
6. Ajouter la pagination avancée
7. Améliorer la recherche (gencod/barcode)
8. Ajouter les boutons d'action (Imprimer, Exporter)

### Phase 3 (1 semaine) - Priorité BASSE
9. Améliorer l'UI avec icônes et indicateurs
10. Ajouter les réglages
11. Implémenter les avertissements système

---

## 📝 NOTES TECHNIQUES

### Modifications nécessaires au schéma Prisma
- Ajouter champ `presentation` au modèle Product
- Ajouter champ `preAssigned` au modèle Product
- Ajouter champ `supplyDelay` au modèle Product
- Ajouter champ `dlcType` (LONGUE/COURTE) au modèle Product
- Ajouter champ `isInCampaign` au modèle Product
- Ajouter champ `gencod` ou `barcode` au modèle Product
- Ajouter modèle `OrderAdjustment` pour gérer les ajustements

### Nouvelles routes API nécessaires
- `GET /api/products/filters` - Liste des filtres disponibles
- `POST /api/orders/:id/adjust` - Ajuster une commande
- `GET /api/orders/:id/print` - Générer PDF pour impression
- `POST /api/orders/export` - Export Excel/CSV
- `GET /api/products/search?gencod=xxx` - Recherche par gencod

### Composants React à créer
- `ProductFiltersBar.js` - Barre de filtres avancés
- `FinancialIndicatorsTable.js` - Tableau Perm/Promo/Total
- `OrderAdjustmentPanel.js` - Panneau d'ajustement
- `PrintExportButtons.js` - Boutons impression/export
- `ProductGrouping.js` - Groupement par catégories/prix

---

## ✅ FONCTIONNALITÉS DÉJÀ PRÉSENTES

Pour référence, voici ce qui est **déjà implémenté** :
- ✅ Bandeau contextuel (date, heure limite, météo, messages)
- ✅ Navigation principale (Accueil, Commande, Livraison, etc.)
- ✅ Sélection date commande/livraison
- ✅ Regroupement/positionnement
- ✅ Tableau produits avec colonnes principales
- ✅ Origine, Conditionnement, Prix, Marge
- ✅ Quantités (promo, demandée, commandée)
- ✅ Indicateurs financiers de base
- ✅ Recherche par produit
- ✅ Toggle T1/T2
- ✅ Boutons Actualiser, Ardoise
- ✅ Workflow Commande → Panier → Confirmer
- ✅ Assistance informatique

---

**Total fonctionnalités manquantes identifiées : 14**
- 🔴 Priorité HAUTE : 4
- 🟡 Priorité MOYENNE : 5
- 🟢 Priorité BASSE : 5
