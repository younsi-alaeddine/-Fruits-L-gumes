const prisma = require('../config/database');
const logger = require('./logger');

/**
 * Agrège les commandes par date de livraison et produit
 * @param {Array} orders - Liste des commandes à agréger
 * @param {Date} deliveryDate - Date de livraison cible
 * @returns {Array} Données agrégées par produit
 */
async function aggregateOrdersByDateAndProduct(orders, deliveryDate) {
  const aggregation = {};
  
  for (const order of orders) {
    for (const item of order.items) {
      const key = `${item.productId}_${deliveryDate.toISOString().split('T')[0]}`;
      
      if (!aggregation[key]) {
        aggregation[key] = {
          productId: item.productId,
          product: item.product,
          deliveryDate: deliveryDate,
          totalQuantity: 0,
          orders: [],
          shops: new Set()
        };
      }
      
      aggregation[key].totalQuantity += item.quantity;
      aggregation[key].orders.push({
        orderId: order.id,
        orderNumber: order.orderNumber,
        shopId: order.shopId,
        shop: order.shop,
        quantity: item.quantity
      });
      aggregation[key].shops.add(order.shopId);
    }
  }
  
  // Convertir Set en Array pour shops
  return Object.values(aggregation).map(item => ({
    ...item,
    shops: Array.from(item.shops)
  }));
}

/**
 * Groupe les items agrégés par fournisseur
 * @param {Array} aggregatedItems - Items agrégés
 * @returns {Object} Groupé par supplierId
 */
async function groupBySupplier(aggregatedItems) {
  const grouped = {};
  
  for (const item of aggregatedItems) {
    // Récupérer le fournisseur du produit
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      include: {
        supplierProducts: {
          include: { supplier: true }
        }
      }
    });
    
    if (!product || !product.supplierProducts.length) {
      // Produit sans fournisseur assigné
      const noSupplierKey = 'NO_SUPPLIER';
      if (!grouped[noSupplierKey]) {
        grouped[noSupplierKey] = {
          supplierId: null,
          supplier: null,
          items: []
        };
      }
      grouped[noSupplierKey].items.push(item);
      continue;
    }
    
    // Prendre le premier fournisseur (ou le principal)
    const supplierProduct = product.supplierProducts[0];
    const supplierId = supplierProduct.supplierId;
    
    if (!grouped[supplierId]) {
      grouped[supplierId] = {
        supplierId,
        supplier: supplierProduct.supplier,
        items: []
      };
    }
    
    grouped[supplierId].items.push(item);
  }
  
  return grouped;
}

/**
 * Crée une commande fournisseur depuis les données agrégées
 * @param {Object} aggregatedData - Données agrégées par fournisseur
 * @param {String} supplierId - ID du fournisseur
 * @param {String} userId - ID de l'utilisateur (admin)
 * @returns {Object} SupplierOrder créée
 */
async function createSupplierOrderFromAggregation(aggregatedData, supplierId, userId) {
  const supplier = aggregatedData.supplier;
  const items = aggregatedData.items;
  
  // Générer numéro de commande
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const orderNumber = `SO-${year}${month}-${random}`;
  
  // Calculer totaux
  let totalHT = 0;
  let totalTTC = 0;
  
  const supplierOrderItems = [];
  
  for (const item of items) {
    // Prix fournisseur (à récupérer depuis SupplierProduct)
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      include: {
        supplierProducts: {
          where: { supplierId },
          include: { supplier: true }
        }
      }
    });
    
    const supplierProduct = product?.supplierProducts?.[0];
    const unitPrice = supplierProduct?.price || product?.priceHT || 0;
    const itemTotalHT = unitPrice * item.totalQuantity;
    const tvaRate = product?.tvaRate || 5.5;
    const itemTotalTTC = itemTotalHT * (1 + tvaRate / 100);
    
    totalHT += itemTotalHT;
    totalTTC += itemTotalTTC;
    
    supplierOrderItems.push({
      productName: product?.name || 'Produit inconnu',
      reference: supplierProduct?.reference || product?.gencod || null,
      quantity: item.totalQuantity,
      unit: product?.unit || 'kg',
      unitPrice,
      totalHT: itemTotalHT
    });
  }
  
  // Créer la commande fournisseur
  const supplierOrder = await prisma.supplierOrder.create({
    data: {
      orderNumber,
      supplierId,
      userId,
      status: 'DRAFT',
      totalHT,
      totalTTC,
      items: {
        create: supplierOrderItems
      }
    },
    include: {
      supplier: true,
      items: true
    }
  });
  
  logger.info('Commande fournisseur créée depuis agrégation', {
    supplierOrderId: supplierOrder.id,
    supplierId,
    itemsCount: supplierOrderItems.length,
    totalHT
  });
  
  return supplierOrder;
}

module.exports = {
  aggregateOrdersByDateAndProduct,
  groupBySupplier,
  createSupplierOrderFromAggregation
};
