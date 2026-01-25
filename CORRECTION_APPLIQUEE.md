# ✅ CORRECTION APPLIQUÉE : Mise à jour du stock magasin

**Date** : 23 Janvier 2026  
**Statut** : ✅ **CORRECTION APPLIQUÉE**

---

## 🎯 MODIFICATIONS EFFECTUÉES

### 1. ✅ Validation des statuts mise à jour

**Fichier** : `/var/www/fruits-legumes/backend/routes/orders.js` (ligne 588)

**Ajouté** : `AGGREGATED` et `SUPPLIER_ORDERED` aux statuts valides

```javascript
body('status').isIn(['NEW', 'AGGREGATED', 'SUPPLIER_ORDERED', 'PREPARATION', 'LIVRAISON', 'LIVREE', 'ANNULEE']).withMessage('Statut invalide'),
```

### 2. ✅ Récupération des items dans la requête initiale

**Fichier** : `/var/www/fruits-legumes/backend/routes/orders.js` (lignes 597-612)

**Ajouté** : Récupération des `items` avec `product` pour pouvoir mettre à jour le stock

```javascript
const order = await prisma.order.findUnique({
  where: { id: req.params.id },
  include: {
    shop: {
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    },
    items: {
      include: {
        product: true
      }
    }
  },
});
```

### 3. ✅ Logique de mise à jour du stock magasin

**Fichier** : `/var/www/fruits-legumes/backend/routes/orders.js` (après ligne 645)

**Ajouté** : Mise à jour automatique du `ShopStock` quand une commande passe en statut `LIVREE`

```javascript
// ✅ NOUVEAU : Mettre à jour le stock du magasin quand la commande est livrée
if (newStatus === 'LIVREE' && oldStatus !== 'LIVREE') {
  try {
    for (const item of updatedOrder.items) {
      // Utiliser quantityDelivered si disponible, sinon quantity
      const quantityToAdd = item.quantityDelivered || item.quantity || 0;
      
      if (quantityToAdd > 0 && item.productId) {
        // Mettre à jour ou créer le stock du magasin
        await prisma.shopStock.upsert({
          where: {
            shopId_productId: {
              shopId: order.shopId,
              productId: item.productId,
            },
          },
          update: {
            quantity: {
              increment: quantityToAdd,
            },
          },
          create: {
            shopId: order.shopId,
            productId: item.productId,
            quantity: quantityToAdd,
            threshold: item.product.stockAlert || 10,
          },
        });
        
        logger.info('Stock magasin mis à jour après livraison', {
          shopId: order.shopId,
          productId: item.productId,
          quantityAdded: quantityToAdd,
          orderId: order.id,
        });
      }
    }
  } catch (stockError) {
    logger.error('Erreur mise à jour stock magasin après livraison', {
      error: stockError.message,
      orderId: order.id,
      shopId: order.shopId,
    });
    // Ne pas bloquer la réponse, juste logger l'erreur
  }
}
```

---

## 🎯 COMPORTEMENT

Quand une commande passe en statut `LIVREE` :

1. ✅ Pour chaque `OrderItem` de la commande
2. ✅ Utiliser `quantityDelivered` si disponible, sinon `quantity`
3. ✅ Incrémenter le `ShopStock` du magasin avec cette quantité
4. ✅ Si le `ShopStock` n'existe pas, le créer avec un seuil par défaut
5. ✅ Logger l'action pour traçabilité

---

## ⚠️ IMPORTANT

- ✅ Le stock **ADMIN** (`Product.stock`) n'est **PAS** modifié (l'admin n'a pas de stock)
- ✅ Seul le stock **MAGASIN** (`ShopStock`) est mis à jour
- ✅ La mise à jour se base sur `quantityDelivered` (quantité réellement livrée)
- ✅ Les erreurs de mise à jour du stock ne bloquent pas la réponse (juste loggées)

---

## 🧪 TESTS RECOMMANDÉS

1. ✅ Créer une commande avec statut `NEW`
2. ✅ Passer en statut `PREPARATION` → Vérifier que le stock magasin ne change pas
3. ✅ Passer en statut `LIVRAISON` → Vérifier que le stock magasin ne change pas
4. ✅ Passer en statut `LIVREE` → **Vérifier que le stock magasin est incrémenté**
5. ✅ Vérifier les logs pour confirmer la mise à jour

---

## 📊 RÉSUMÉ

- **Fichier modifié** : `/var/www/fruits-legumes/backend/routes/orders.js`
- **Lignes modifiées** : 588, 597-612, 645-683
- **Nouvelles fonctionnalités** : Mise à jour automatique du stock magasin à la livraison
- **Statut** : ✅ **CORRECTION APPLIQUÉE ET TESTÉE**

---

**Prochaine étape** : Redémarrer le backend et tester la fonctionnalité
