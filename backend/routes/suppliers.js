const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');
const { logAction } = require('../utils/auditTrail');

/**
 * GET /api/suppliers
 * Liste tous les fournisseurs avec statistiques
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, isActive, minRating, sortBy } = req.query;
    
    const where = {
      deletedAt: null
    };
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    
    if (minRating) {
      where.rating = { gte: parseFloat(minRating) };
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contact: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    let orderBy = { createdAt: 'desc' };
    if (sortBy === 'name') orderBy = { name: 'asc' };
    if (sortBy === 'rating') orderBy = { rating: 'desc' };
    if (sortBy === 'totalOrders') orderBy = { totalOrders: 'desc' };
    
    const suppliers = await prisma.supplier.findMany({
      where,
      include: {
        _count: {
          select: {
            products: true,
            orders: true,
            evaluations: true
          }
        }
      },
      orderBy
    });
    
    // Stats globales
    const stats = {
      total: suppliers.length,
      active: suppliers.filter(s => s.isActive).length,
      totalOrders: suppliers.reduce((sum, s) => sum + s.totalOrders, 0),
      totalSpent: suppliers.reduce((sum, s) => sum + s.totalSpent, 0),
      avgRating: suppliers.length > 0 
        ? suppliers.reduce((sum, s) => sum + (s.rating || 0), 0) / suppliers.length 
        : 0
    };
    
    res.json({
      success: true,
      suppliers,
      stats
    });
  } catch (error) {
    logger.error('Erreur récupération fournisseurs:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des fournisseurs'
    });
  }
});

/**
 * GET /api/suppliers/:id
 * Détails d'un fournisseur
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: req.params.id },
      include: {
        products: {
          where: { isAvailable: true },
          include: {
            product: {
              select: { id: true, name: true, photoUrl: true }
            }
          },
          orderBy: { productName: 'asc' }
        },
        orders: {
          orderBy: { orderDate: 'desc' },
          take: 10,
          include: {
            items: true,
            user: {
              select: { id: true, name: true }
            }
          }
        },
        evaluations: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: {
              select: { id: true, name: true }
            }
          }
        },
        documents: {
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            products: true,
            orders: true,
            evaluations: true,
            documents: true
          }
        }
      }
    });
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Fournisseur non trouvé'
      });
    }
    
    res.json({
      success: true,
      supplier
    });
  } catch (error) {
    logger.error('Erreur récupération fournisseur:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du fournisseur'
    });
  }
});

/**
 * POST /api/suppliers
 * Créer un fournisseur
 */
router.post('/', authenticate, requireAdmin, [
  body('name').notEmpty().withMessage('Le nom est requis'),
  body('email').isEmail().withMessage('Email invalide'),
  body('phone').notEmpty().withMessage('Le téléphone est requis')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  
  try {
    const supplier = await prisma.supplier.create({
      data: {
        name: req.body.name,
        contact: req.body.contact || '',
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address || null,
        city: req.body.city || null,
        postalCode: req.body.postalCode || null,
        country: req.body.country || 'France',
        siret: req.body.siret || null,
        tva: req.body.tva || null,
        paymentTerms: req.body.paymentTerms || 'Net 30 jours',
        averageDeliveryDays: parseInt(req.body.averageDeliveryDays) || 2,
        minOrderAmount: req.body.minOrderAmount ? parseFloat(req.body.minOrderAmount) : 0,
        website: req.body.website || null,
        notes: req.body.notes || null,
        isActive: req.body.isActive !== false
      }
    });
    
    await logAction(req.user.id, 'CREATE_SUPPLIER', 'Supplier', supplier.id, supplier);
    
    res.status(201).json({
      success: true,
      supplier
    });
  } catch (error) {
    logger.error('Erreur création fournisseur:', { error: error.message });
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du fournisseur'
    });
  }
});

/**
 * PUT /api/suppliers/:id
 * Modifier un fournisseur
 */
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const supplier = await prisma.supplier.update({
      where: { id: req.params.id },
      data: {
        name: req.body.name,
        contact: req.body.contact,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
        city: req.body.city,
        postalCode: req.body.postalCode,
        country: req.body.country,
        siret: req.body.siret,
        tva: req.body.tva,
        paymentTerms: req.body.paymentTerms,
        averageDeliveryDays: req.body.averageDeliveryDays ? parseInt(req.body.averageDeliveryDays) : undefined,
        minOrderAmount: req.body.minOrderAmount !== undefined ? parseFloat(req.body.minOrderAmount) : undefined,
        website: req.body.website,
        notes: req.body.notes,
        isActive: req.body.isActive !== undefined ? req.body.isActive : undefined
      }
    });
    
    await logAction(req.user.id, 'UPDATE_SUPPLIER', 'Supplier', supplier.id, supplier);
    
    res.json({
      success: true,
      supplier
    });
  } catch (error) {
    logger.error('Erreur modification fournisseur:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification du fournisseur'
    });
  }
});

/**
 * DELETE /api/suppliers/:id
 * Supprimer un fournisseur (soft delete)
 */
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    // Vérifier s'il y a des commandes en cours
    const activeOrders = await prisma.supplierOrder.count({
      where: {
        supplierId: req.params.id,
        status: { in: ['SENT', 'CONFIRMED', 'IN_TRANSIT'] }
      }
    });
    
    if (activeOrders > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer : ${activeOrders} commande(s) en cours`
      });
    }
    
    await prisma.supplier.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() }
    });
    
    await logAction(req.user.id, 'DELETE_SUPPLIER', 'Supplier', req.params.id);
    
    res.json({
      success: true,
      message: 'Fournisseur supprimé'
    });
  } catch (error) {
    logger.error('Erreur suppression fournisseur:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du fournisseur'
    });
  }
});

/**
 * GET /api/suppliers/:id/products
 * Catalogue produits d'un fournisseur
 */
router.get('/:id/products', authenticate, async (req, res) => {
  try {
    const products = await prisma.supplierProduct.findMany({
      where: { supplierId: req.params.id },
      include: {
        product: {
          select: { id: true, name: true, photoUrl: true, stock: true }
        }
      },
      orderBy: { productName: 'asc' }
    });
    
    res.json({
      success: true,
      products
    });
  } catch (error) {
    logger.error('Erreur récupération produits fournisseur:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des produits'
    });
  }
});

/**
 * POST /api/suppliers/:id/products
 * Ajouter un produit au catalogue fournisseur
 */
router.post('/:id/products', authenticate, requireAdmin, async (req, res) => {
  try {
    const supplierProduct = await prisma.supplierProduct.create({
      data: {
        supplierId: req.params.id,
        productId: req.body.productId || null,
        productName: req.body.productName,
        reference: req.body.reference || null,
        unitPrice: parseFloat(req.body.unitPrice),
        unit: req.body.unit || 'kg',
        minOrderQty: req.body.minOrderQty ? parseFloat(req.body.minOrderQty) : 1,
        packageSize: req.body.packageSize ? parseFloat(req.body.packageSize) : null,
        deliveryDays: req.body.deliveryDays ? parseInt(req.body.deliveryDays) : 2,
        isAvailable: req.body.isAvailable !== false,
        notes: req.body.notes || null
      }
    });
    
    res.status(201).json({
      success: true,
      product: supplierProduct
    });
  } catch (error) {
    logger.error('Erreur ajout produit fournisseur:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout du produit'
    });
  }
});

/**
 * PUT /api/suppliers/:id/products/:productId
 * Modifier un produit du catalogue
 */
router.put('/:id/products/:productId', authenticate, requireAdmin, async (req, res) => {
  try {
    const supplierProduct = await prisma.supplierProduct.update({
      where: { id: req.params.productId },
      data: {
        productName: req.body.productName,
        reference: req.body.reference,
        unitPrice: req.body.unitPrice ? parseFloat(req.body.unitPrice) : undefined,
        unit: req.body.unit,
        minOrderQty: req.body.minOrderQty ? parseFloat(req.body.minOrderQty) : undefined,
        packageSize: req.body.packageSize !== undefined ? (req.body.packageSize ? parseFloat(req.body.packageSize) : null) : undefined,
        deliveryDays: req.body.deliveryDays ? parseInt(req.body.deliveryDays) : undefined,
        isAvailable: req.body.isAvailable !== undefined ? req.body.isAvailable : undefined,
        notes: req.body.notes !== undefined ? req.body.notes : undefined,
        lastPriceUpdate: req.body.unitPrice ? new Date() : undefined
      }
    });
    
    res.json({
      success: true,
      product: supplierProduct
    });
  } catch (error) {
    logger.error('Erreur modification produit fournisseur:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification du produit'
    });
  }
});

/**
 * DELETE /api/suppliers/:id/products/:productId
 * Supprimer un produit du catalogue
 */
router.delete('/:id/products/:productId', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.supplierProduct.delete({
      where: { id: req.params.productId }
    });
    
    res.json({
      success: true,
      message: 'Produit supprimé du catalogue'
    });
  } catch (error) {
    logger.error('Erreur suppression produit fournisseur:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du produit'
    });
  }
});

/**
 * GET /api/suppliers/:id/orders
 * Commandes d'un fournisseur
 */
router.get('/:id/orders', authenticate, async (req, res) => {
  try {
    const orders = await prisma.supplierOrder.findMany({
      where: { supplierId: req.params.id },
      include: {
        items: true,
        user: {
          select: { id: true, name: true }
        }
      },
      orderBy: { orderDate: 'desc' }
    });
    
    res.json({
      success: true,
      orders
    });
  } catch (error) {
    logger.error('Erreur récupération commandes fournisseur:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des commandes'
    });
  }
});

/**
 * POST /api/suppliers/:id/orders
 * Créer une commande fournisseur
 */
router.post('/:id/orders', authenticate, requireAdmin, async (req, res) => {
  try {
    const { items, expectedDate, notes } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La commande doit contenir au moins un produit'
      });
    }
    
    // Générer numéro de commande
    const lastOrder = await prisma.supplierOrder.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    const orderNumber = `CF${String((lastOrder?.orderNumber?.slice(2) || 0) + 1).padStart(6, '0')}`;
    
    // Calculer totaux
    let totalHT = 0;
    const orderItems = items.map(item => {
      const itemTotal = parseFloat(item.quantity) * parseFloat(item.unitPrice);
      totalHT += itemTotal;
      return {
        supplierProductId: item.supplierProductId || null,
        productName: item.productName,
        reference: item.reference || null,
        quantity: parseFloat(item.quantity),
        unit: item.unit,
        unitPrice: parseFloat(item.unitPrice),
        totalHT: itemTotal
      };
    });
    
    const order = await prisma.supplierOrder.create({
      data: {
        orderNumber,
        supplierId: req.params.id,
        userId: req.user.id,
        status: 'SENT',
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        totalHT,
        totalTTC: totalHT * 1.2, // TVA 20% par défaut
        notes: notes || null,
        items: {
          create: orderItems
        }
      },
      include: {
        items: true
      }
    });
    
    // Mettre à jour stats fournisseur
    await prisma.supplier.update({
      where: { id: req.params.id },
      data: {
        totalOrders: { increment: 1 },
        totalSpent: { increment: totalHT }
      }
    });
    
    await logAction(req.user.id, 'CREATE_SUPPLIER_ORDER', 'SupplierOrder', order.id, order);
    
    res.status(201).json({
      success: true,
      order
    });
  } catch (error) {
    logger.error('Erreur création commande fournisseur:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la commande'
    });
  }
});

/**
 * PUT /api/suppliers/:id/orders/:orderId
 * Modifier statut commande
 */
router.put('/:id/orders/:orderId', authenticate, requireAdmin, async (req, res) => {
  try {
    const data = {};
    
    if (req.body.status) data.status = req.body.status;
    if (req.body.expectedDate) data.expectedDate = new Date(req.body.expectedDate);
    if (req.body.deliveredDate) data.deliveredDate = new Date(req.body.deliveredDate);
    if (req.body.trackingNumber !== undefined) data.trackingNumber = req.body.trackingNumber;
    if (req.body.invoiceNumber !== undefined) data.invoiceNumber = req.body.invoiceNumber;
    if (req.body.invoiceUrl !== undefined) data.invoiceUrl = req.body.invoiceUrl;
    if (req.body.isPaid !== undefined) {
      data.isPaid = req.body.isPaid;
      if (req.body.isPaid) data.paidAt = new Date();
    }
    if (req.body.paymentMethod !== undefined) data.paymentMethod = req.body.paymentMethod;
    if (req.body.notes !== undefined) data.notes = req.body.notes;
    
    const order = await prisma.supplierOrder.update({
      where: { id: req.params.orderId },
      data
    });
    
    res.json({
      success: true,
      order
    });
  } catch (error) {
    logger.error('Erreur modification commande:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification de la commande'
    });
  }
});

/**
 * GET /api/suppliers/:id/evaluations
 * Évaluations d'un fournisseur
 */
router.get('/:id/evaluations', authenticate, async (req, res) => {
  try {
    const evaluations = await prisma.supplierEvaluation.findMany({
      where: { supplierId: req.params.id },
      include: {
        user: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({
      success: true,
      evaluations
    });
  } catch (error) {
    logger.error('Erreur récupération évaluations:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des évaluations'
    });
  }
});

/**
 * POST /api/suppliers/:id/evaluations
 * Créer une évaluation
 */
router.post('/:id/evaluations', authenticate, async (req, res) => {
  try {
    const evaluation = await prisma.supplierEvaluation.create({
      data: {
        supplierId: req.params.id,
        userId: req.user.id,
        orderId: req.body.orderId || null,
        rating: parseInt(req.body.rating),
        qualityScore: req.body.qualityScore ? parseInt(req.body.qualityScore) : null,
        deliveryScore: req.body.deliveryScore ? parseInt(req.body.deliveryScore) : null,
        serviceScore: req.body.serviceScore ? parseInt(req.body.serviceScore) : null,
        priceScore: req.body.priceScore ? parseInt(req.body.priceScore) : null,
        comment: req.body.comment || null,
        wouldRecommend: req.body.wouldRecommend !== false
      }
    });
    
    // Recalculer note moyenne
    const allEvaluations = await prisma.supplierEvaluation.findMany({
      where: { supplierId: req.params.id },
      select: { rating: true }
    });
    
    const avgRating = allEvaluations.reduce((sum, e) => sum + e.rating, 0) / allEvaluations.length;
    
    await prisma.supplier.update({
      where: { id: req.params.id },
      data: { rating: avgRating }
    });
    
    res.status(201).json({
      success: true,
      evaluation
    });
  } catch (error) {
    logger.error('Erreur création évaluation:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'évaluation'
    });
  }
});

module.exports = router;
