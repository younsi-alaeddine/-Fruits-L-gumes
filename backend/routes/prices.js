const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');
const { logAction } = require('../utils/auditTrail');

/**
 * GET /api/prices
 * Liste tous les produits avec leurs prix et statistiques
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { category, minPrice, maxPrice, search, hasVolumePrice, hasClientPrice } = req.query;
    
    const where = {
      isActive: true,
      deletedAt: null,
    };
    
    if (category) {
      where.OR = [
        { categoryId: category },
        { category: category }
      ];
    }
    
    if (minPrice !== undefined) {
      where.priceHT = { ...where.priceHT, gte: parseFloat(minPrice) };
    }
    
    if (maxPrice !== undefined) {
      where.priceHT = { ...where.priceHT, lte: parseFloat(maxPrice) };
    }
    
    if (search) {
      where.OR = [
        ...(where.OR || []),
        { name: { contains: search, mode: 'insensitive' } },
        { gencod: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const products = await prisma.product.findMany({
      where,
      include: {
        customCategory: {
          select: { id: true, name: true, color: true }
        },
        priceHistory: {
          take: 1,
          orderBy: { changedAt: 'desc' },
          select: {
            oldPriceHT: true,
            newPriceHT: true,
            changedAt: true
          }
        },
        volumePricing: {
          where: { isActive: true },
          orderBy: { minQuantity: 'asc' }
        },
        clientPricing: {
          where: { isActive: true },
          take: 5
        },
        _count: {
          select: {
            volumePricing: true,
            clientPricing: true,
            priceHistory: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    // Calculer les statistiques
    const stats = {
      totalProducts: products.length,
      avgPrice: products.length > 0 ? products.reduce((sum, p) => sum + p.priceHT, 0) / products.length : 0,
      minPrice: products.length > 0 ? Math.min(...products.map(p => p.priceHT)) : 0,
      maxPrice: products.length > 0 ? Math.max(...products.map(p => p.priceHT)) : 0,
      productsWithVolumePricing: products.filter(p => p._count.volumePricing > 0).length,
      productsWithClientPricing: products.filter(p => p._count.clientPricing > 0).length,
      recentChanges: products.filter(p => p.priceHistory.length > 0).length
    };
    
    // Enrichir avec les variations de prix
    const enrichedProducts = products.map(product => {
      const lastChange = product.priceHistory[0];
      let priceChange = null;
      let priceChangePercent = null;
      
      if (lastChange && lastChange.oldPriceHT) {
        priceChange = product.priceHT - lastChange.oldPriceHT;
        priceChangePercent = ((priceChange / lastChange.oldPriceHT) * 100).toFixed(2);
      }
      
      return {
        ...product,
        priceChange,
        priceChangePercent,
        hasVolumePricing: product._count.volumePricing > 0,
        hasClientPricing: product._count.clientPricing > 0
      };
    });
    
    res.json({
      success: true,
      products: enrichedProducts,
      stats
    });
  } catch (error) {
    logger.error('Erreur récupération prix:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des prix'
    });
  }
});

/**
 * GET /api/prices/history/:productId
 * Historique des prix d'un produit
 */
router.get('/history/:productId', authenticate, async (req, res) => {
  try {
    const history = await prisma.priceHistory.findMany({
      where: { productId: req.params.productId },
      orderBy: { changedAt: 'desc' },
      take: 50
    });
    
    res.json({
      success: true,
      history
    });
  } catch (error) {
    logger.error('Erreur récupération historique:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique'
    });
  }
});

/**
 * GET /api/prices/volume
 * Liste tous les tarifs dégressifs
 */
router.get('/volume', authenticate, async (req, res) => {
  try {
    const { productId } = req.query;
    
    const where = { isActive: true };
    if (productId) {
      where.productId = productId;
    }
    
    const volumePricing = await prisma.volumePricing.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            priceHT: true,
            unit: true
          }
        }
      },
      orderBy: [
        { productId: 'asc' },
        { minQuantity: 'asc' }
      ]
    });
    
    res.json({
      success: true,
      volumePricing
    });
  } catch (error) {
    logger.error('Erreur récupération tarifs dégressifs:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des tarifs dégressifs'
    });
  }
});

/**
 * POST /api/prices/volume
 * Créer un tarif dégressif
 */
router.post('/volume', authenticate, requireAdmin, [
  body('productId').notEmpty(),
  body('minQuantity').isFloat({ min: 0 }),
  body('priceHT').isFloat({ min: 0 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  
  try {
    const volumePrice = await prisma.volumePricing.create({
      data: {
        productId: req.body.productId,
        minQuantity: parseFloat(req.body.minQuantity),
        maxQuantity: req.body.maxQuantity ? parseFloat(req.body.maxQuantity) : null,
        priceHT: parseFloat(req.body.priceHT),
        discountPercent: req.body.discountPercent ? parseFloat(req.body.discountPercent) : null,
        isActive: req.body.isActive !== false
      }
    });
    
    await logAction(req.user.id, 'CREATE_VOLUME_PRICING', 'VolumePricing', volumePrice.id, volumePrice);
    
    res.status(201).json({
      success: true,
      volumePrice
    });
  } catch (error) {
    logger.error('Erreur création tarif dégressif:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du tarif dégressif'
    });
  }
});

/**
 * PUT /api/prices/volume/:id
 * Modifier un tarif dégressif
 */
router.put('/volume/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const volumePrice = await prisma.volumePricing.update({
      where: { id: req.params.id },
      data: {
        minQuantity: req.body.minQuantity ? parseFloat(req.body.minQuantity) : undefined,
        maxQuantity: req.body.maxQuantity !== undefined ? (req.body.maxQuantity ? parseFloat(req.body.maxQuantity) : null) : undefined,
        priceHT: req.body.priceHT ? parseFloat(req.body.priceHT) : undefined,
        discountPercent: req.body.discountPercent !== undefined ? (req.body.discountPercent ? parseFloat(req.body.discountPercent) : null) : undefined,
        isActive: req.body.isActive !== undefined ? req.body.isActive : undefined
      }
    });
    
    await logAction(req.user.id, 'UPDATE_VOLUME_PRICING', 'VolumePricing', volumePrice.id, volumePrice);
    
    res.json({
      success: true,
      volumePrice
    });
  } catch (error) {
    logger.error('Erreur modification tarif dégressif:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification du tarif dégressif'
    });
  }
});

/**
 * DELETE /api/prices/volume/:id
 * Supprimer un tarif dégressif
 */
router.delete('/volume/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.volumePricing.delete({
      where: { id: req.params.id }
    });
    
    await logAction(req.user.id, 'DELETE_VOLUME_PRICING', 'VolumePricing', req.params.id);
    
    res.json({
      success: true,
      message: 'Tarif dégressif supprimé'
    });
  } catch (error) {
    logger.error('Erreur suppression tarif dégressif:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du tarif dégressif'
    });
  }
});

/**
 * GET /api/prices/client
 * Liste tous les tarifs clients
 */
router.get('/client', authenticate, async (req, res) => {
  try {
    const { productId, userId } = req.query;
    
    const where = { isActive: true };
    if (productId) where.productId = productId;
    if (userId) where.userId = userId;
    
    const clientPricing = await prisma.clientPricing.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            priceHT: true,
            unit: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({
      success: true,
      clientPricing
    });
  } catch (error) {
    logger.error('Erreur récupération tarifs clients:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des tarifs clients'
    });
  }
});

/**
 * POST /api/prices/client
 * Créer un tarif client
 */
router.post('/client', authenticate, requireAdmin, [
  body('productId').notEmpty(),
  body('userId').notEmpty(),
  body('priceHT').isFloat({ min: 0 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  
  try {
    const clientPrice = await prisma.clientPricing.create({
      data: {
        productId: req.body.productId,
        userId: req.body.userId,
        priceHT: parseFloat(req.body.priceHT),
        priceHT_T2: req.body.priceHT_T2 ? parseFloat(req.body.priceHT_T2) : null,
        validFrom: req.body.validFrom ? new Date(req.body.validFrom) : new Date(),
        validUntil: req.body.validUntil ? new Date(req.body.validUntil) : null,
        notes: req.body.notes || null,
        isActive: req.body.isActive !== false
      }
    });
    
    await logAction(req.user.id, 'CREATE_CLIENT_PRICING', 'ClientPricing', clientPrice.id, clientPrice);
    
    res.status(201).json({
      success: true,
      clientPrice
    });
  } catch (error) {
    logger.error('Erreur création tarif client:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du tarif client'
    });
  }
});

/**
 * PUT /api/prices/client/:id
 * Modifier un tarif client
 */
router.put('/client/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const clientPrice = await prisma.clientPricing.update({
      where: { id: req.params.id },
      data: {
        priceHT: req.body.priceHT ? parseFloat(req.body.priceHT) : undefined,
        priceHT_T2: req.body.priceHT_T2 !== undefined ? (req.body.priceHT_T2 ? parseFloat(req.body.priceHT_T2) : null) : undefined,
        validFrom: req.body.validFrom ? new Date(req.body.validFrom) : undefined,
        validUntil: req.body.validUntil !== undefined ? (req.body.validUntil ? new Date(req.body.validUntil) : null) : undefined,
        notes: req.body.notes !== undefined ? req.body.notes : undefined,
        isActive: req.body.isActive !== undefined ? req.body.isActive : undefined
      }
    });
    
    await logAction(req.user.id, 'UPDATE_CLIENT_PRICING', 'ClientPricing', clientPrice.id, clientPrice);
    
    res.json({
      success: true,
      clientPrice
    });
  } catch (error) {
    logger.error('Erreur modification tarif client:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification du tarif client'
    });
  }
});

/**
 * DELETE /api/prices/client/:id
 * Supprimer un tarif client
 */
router.delete('/client/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.clientPricing.delete({
      where: { id: req.params.id }
    });
    
    await logAction(req.user.id, 'DELETE_CLIENT_PRICING', 'ClientPricing', req.params.id);
    
    res.json({
      success: true,
      message: 'Tarif client supprimé'
    });
  } catch (error) {
    logger.error('Erreur suppression tarif client:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du tarif client'
    });
  }
});

/**
 * POST /api/prices/bulk-update
 * Modification en masse des prix
 */
router.post('/bulk-update', authenticate, requireAdmin, [
  body('productIds').isArray(),
  body('action').isIn(['increase', 'decrease', 'set']),
  body('value').isFloat()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  
  try {
    const { productIds, action, value, valueType, reason } = req.body;
    const userId = req.user.id;
    
    // Récupérer les produits concernés
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        deletedAt: null
      }
    });
    
    const updates = [];
    const histories = [];
    
    for (const product of products) {
      let newPriceHT = product.priceHT;
      
      if (action === 'increase') {
        newPriceHT = valueType === 'percent' 
          ? product.priceHT * (1 + value / 100)
          : product.priceHT + value;
      } else if (action === 'decrease') {
        newPriceHT = valueType === 'percent'
          ? product.priceHT * (1 - value / 100)
          : product.priceHT - value;
      } else if (action === 'set') {
        newPriceHT = value;
      }
      
      newPriceHT = Math.max(0, newPriceHT); // Ne pas descendre en dessous de 0
      
      updates.push(
        prisma.product.update({
          where: { id: product.id },
          data: { priceHT: newPriceHT }
        })
      );
      
      histories.push(
        prisma.priceHistory.create({
          data: {
            productId: product.id,
            oldPriceHT: product.priceHT,
            newPriceHT: newPriceHT,
            oldPriceT2: product.priceHT_T2,
            newPriceT2: product.priceHT_T2,
            changeType: 'bulk',
            reason: reason || 'Modification en masse',
            changedBy: userId
          }
        })
      );
    }
    
    await prisma.$transaction([...updates, ...histories]);
    
    await logAction(userId, 'BULK_PRICE_UPDATE', 'Product', null, { 
      productIds, 
      action, 
      value, 
      valueType,
      count: products.length 
    });
    
    res.json({
      success: true,
      message: `${products.length} prix mis à jour avec succès`,
      updatedCount: products.length
    });
  } catch (error) {
    logger.error('Erreur modification en masse:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification en masse'
    });
  }
});

module.exports = router;
