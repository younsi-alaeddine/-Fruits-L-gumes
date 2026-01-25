const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

// Toutes les routes nécessitent l'authentification et le rôle ADMIN
router.use(authenticate);
router.use(requireAdmin);

/**
 * @swagger
 * /api/stock:
 *   get:
 *     summary: Liste des produits avec leur stock
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lowStock
 *         schema:
 *           type: boolean
 *         description: Filtrer les produits en stock faible
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtrer par catégorie
 *     responses:
 *       200:
 *         description: Liste des produits récupérée avec succès
 *       403:
 *         description: Accès refusé - Admin requis
 */
router.get('/', async (req, res) => {
  try {
    const { lowStock, category } = req.query;
    const where = {};

    if (lowStock === 'true') {
      where.stock = { lte: prisma.product.fields.stockAlert };
    }

    if (category) {
      where.category = category;
    }

    const products = await prisma.product.findMany({
      where: {
        ...where,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        stock: true,
        stockAlert: true,
        unit: true,
        category: true,
        isActive: true
      },
      orderBy: [
        { stock: 'asc' },
        { name: 'asc' }
      ]
    });

    // Ajouter un flag pour indiquer si le stock est faible
    const productsWithAlert = products.map(product => ({
      ...product,
      isLowStock: product.stock <= product.stockAlert
    }));

    res.json({ 
      success: true,
      products: productsWithAlert 
    });
  } catch (error) {
    // SECURITY: Use logger instead of console.error to prevent sensitive data exposure
    logger.error('Erreur récupération stock', { 
      error: error.message,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur' 
    });
  }
});

/**
 * @swagger
 * /api/stock/{id}:
 *   put:
 *     summary: Mettre à jour le stock d'un produit
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du produit
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stock
 *             properties:
 *               stock:
 *                 type: number
 *                 minimum: 0
 *               stockAlert:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Stock mis à jour avec succès
 *       400:
 *         description: Erreur de validation
 *       404:
 *         description: Produit non trouvé
 *       403:
 *         description: Accès refusé - Admin requis
 */
router.put(
  '/:id',
  [
    body('stock').isFloat({ min: 0 }).withMessage('Stock invalide'),
    body('stockAlert').optional().isFloat({ min: 0 }).withMessage('Seuil d\'alerte invalide'),
  ],
  async (req, res) => {
    try {
      // SECURITY: Validate UUID format to prevent injection attacks
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(req.params.id)) {
        return res.status(400).json({ 
          success: false,
          message: 'ID de produit invalide' 
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }

      const { stock, stockAlert } = req.body;

      const product = await prisma.product.findUnique({
        where: { id: req.params.id }
      });

      if (!product) {
        return res.status(404).json({ message: 'Produit non trouvé' });
      }

      const updateData = {
        stock: parseFloat(stock)
      };

      if (stockAlert !== undefined) {
        updateData.stockAlert = parseFloat(stockAlert);
      }

      const updatedProduct = await prisma.product.update({
        where: { id: req.params.id },
        data: updateData,
        select: {
          id: true,
          name: true,
          stock: true,
          stockAlert: true,
          unit: true,
          isLowStock: true
        }
      });

      res.json({
        message: 'Stock mis à jour avec succès',
        product: {
          ...updatedProduct,
          isLowStock: updatedProduct.stock <= updatedProduct.stockAlert
        }
      });
    } catch (error) {
      console.error('Erreur mise à jour stock:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
);

/**
 * POST /api/stock/:id/adjust
 * Ajuster le stock (ajouter ou retirer)
 */
router.post(
  '/:id/adjust',
  [
    body('quantity').isFloat().withMessage('Quantité invalide'),
    body('reason').optional().trim(),
  ],
  async (req, res) => {
    try {
      // SECURITY: Validate UUID format to prevent injection attacks
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(req.params.id)) {
        return res.status(400).json({ 
          success: false,
          message: 'ID de produit invalide' 
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }

      const { quantity, reason } = req.body;

      const product = await prisma.product.findUnique({
        where: { id: req.params.id }
      });

      if (!product) {
        return res.status(404).json({ message: 'Produit non trouvé' });
      }

      const newStock = Math.max(0, product.stock + parseFloat(quantity));

      const updatedProduct = await prisma.product.update({
        where: { id: req.params.id },
        data: { stock: newStock },
        select: {
          id: true,
          name: true,
          stock: true,
          stockAlert: true,
          unit: true
        }
      });

      res.json({
        success: true,
        message: `Stock ajusté de ${quantity > 0 ? '+' : ''}${quantity}`,
        product: {
          ...updatedProduct,
          isLowStock: updatedProduct.stock <= updatedProduct.stockAlert
        }
      });
    } catch (error) {
      // SECURITY: Use logger instead of console.error to prevent sensitive data exposure
      logger.error('Erreur ajustement stock', { 
        error: error.message,
        productId: req.params.id,
        userId: req.user?.id 
      });
      res.status(500).json({ 
        success: false,
        message: 'Erreur serveur' 
      });
    }
  }
);

/**
 * GET /api/stock/alerts
 * Produits avec stock faible
 */
router.get('/alerts', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        stock: true,
        stockAlert: true,
        unit: true,
        category: true
      },
      orderBy: [
        { stock: 'asc' },
        { name: 'asc' }
      ]
    });

    // Filtrer les produits avec stock faible
    const lowStockProducts = products.filter(p => p.stock <= p.stockAlert);

    res.json({ 
      success: true,
      count: lowStockProducts.length,
      products: lowStockProducts.map(p => ({ ...p, isLowStock: true }))
    });
  } catch (error) {
    // SECURITY: Use logger instead of console.error to prevent sensitive data exposure
    logger.error('Erreur récupération alertes stock', { 
      error: error.message,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur' 
    });
  }
});

/**
 * GET /api/stock/stats
 * Statistiques globales des stocks
 */
router.get('/stats', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        stock: true,
        stockAlert: true,
        category: true
      }
    });

    const stats = {
      totalProducts: products.length,
      lowStockCount: products.filter(p => p.stock <= p.stockAlert).length,
      outOfStockCount: products.filter(p => p.stock === 0).length,
      totalStockValue: products.reduce((sum, p) => sum + p.stock, 0),
      categoriesBreakdown: {}
    };

    // Breakdown par catégorie
    products.forEach(p => {
      if (!stats.categoriesBreakdown[p.category]) {
        stats.categoriesBreakdown[p.category] = {
          total: 0,
          lowStock: 0,
          outOfStock: 0
        };
      }
      stats.categoriesBreakdown[p.category].total++;
      if (p.stock <= p.stockAlert) stats.categoriesBreakdown[p.category].lowStock++;
      if (p.stock === 0) stats.categoriesBreakdown[p.category].outOfStock++;
    });

    res.json({ success: true, stats });
  } catch (error) {
    logger.error('Erreur stats stock', { error: error.message });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * GET /api/stock/movements/:productId
 * Historique des mouvements de stock pour un produit
 */
router.get('/movements/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 50 } = req.query;

    // Récupérer les OrderItems comme mouvements de stock
    const movements = await prisma.orderItem.findMany({
      where: { productId },
      select: {
        id: true,
        quantity: true,
        priceUnit: true,
        createdAt: true,
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            shop: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    const formattedMovements = movements.map(m => ({
      id: m.id,
      type: 'ORDER',
      quantity: -m.quantity, // Négatif car c'est une sortie
      date: m.createdAt,
      reference: m.order.orderNumber,
      shop: m.order.shop?.name,
      notes: `Commande ${m.order.status}`
    }));

    res.json({ 
      success: true,
      movements: formattedMovements,
      count: formattedMovements.length
    });
  } catch (error) {
    logger.error('Erreur mouvements stock', { error: error.message });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * POST /api/stock/inventory
 * Créer un inventaire physique
 */
router.post('/inventory', [
  body('items').isArray().withMessage('Items requis'),
  body('items.*.productId').notEmpty().withMessage('Product ID requis'),
  body('items.*.physicalCount').isFloat({ min: 0 }).withMessage('Comptage invalide'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { items, notes } = req.body;
    const results = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });

      if (!product) continue;

      const difference = item.physicalCount - product.stock;

      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: item.physicalCount }
      });

      results.push({
        productId: item.productId,
        productName: product.name,
        previousStock: product.stock,
        newStock: item.physicalCount,
        difference,
        notes: item.notes
      });
    }

    res.json({
      success: true,
      message: `Inventaire effectué : ${results.length} produits`,
      results
    });
  } catch (error) {
    logger.error('Erreur inventaire', { error: error.message });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;

