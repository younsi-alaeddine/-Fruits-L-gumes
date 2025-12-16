const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

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

    res.json({ products: productsWithAlert });
  } catch (error) {
    console.error('Erreur récupération stock:', error);
    res.status(500).json({ message: 'Erreur serveur' });
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
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
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
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
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
        message: `Stock ajusté de ${quantity > 0 ? '+' : ''}${quantity}`,
        product: {
          ...updatedProduct,
          isLowStock: updatedProduct.stock <= updatedProduct.stockAlert
        }
      });
    } catch (error) {
      console.error('Erreur ajustement stock:', error);
      res.status(500).json({ message: 'Erreur serveur' });
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
      count: lowStockProducts.length,
      products: lowStockProducts.map(p => ({ ...p, isLowStock: true }))
    });
  } catch (error) {
    console.error('Erreur récupération alertes stock:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;

