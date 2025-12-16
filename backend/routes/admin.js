const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');
const bcrypt = require('bcrypt');

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Statistiques du dashboard admin
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 stats:
 *                   type: object
 *                   properties:
 *                     ordersToday:
 *                       type: object
 *                     ordersMonth:
 *                       type: object
 *                     totalsByShop:
 *                       type: array
 *       403:
 *         description: Accès refusé - Admin requis
 */
router.get('/dashboard', authenticate, requireAdmin, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Commandes du jour
    const ordersToday = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        },
        status: { not: 'ANNULEE' }
      },
      _sum: {
        totalTTC: true,
        totalHT: true,
        totalTVA: true
      },
      _count: {
        id: true
      }
    });

    // Commandes du mois
    const ordersMonth = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: firstDayOfMonth
        },
        status: { not: 'ANNULEE' }
      },
      _sum: {
        totalTTC: true,
        totalHT: true,
        totalTVA: true
      },
      _count: {
        id: true
      }
    });

    // Totaux par client (mois en cours)
    const totalsByShop = await prisma.order.groupBy({
      by: ['shopId'],
      where: {
        createdAt: {
          gte: firstDayOfMonth
        },
        status: { not: 'ANNULEE' }
      },
      _sum: {
        totalTTC: true,
        totalHT: true,
        totalTVA: true
      },
      _count: {
        id: true
      }
    });

    // Récupérer les noms des magasins
    const shopIds = totalsByShop.map(t => t.shopId);
    const shops = await prisma.shop.findMany({
      where: { id: { in: shopIds } },
      select: {
        id: true,
        name: true,
        city: true
      }
    });

    const totalsByShopWithNames = totalsByShop.map(total => {
      const shop = shops.find(s => s.id === total.shopId);
      return {
        shopId: total.shopId,
        shopName: shop?.name || 'Inconnu',
        shopCity: shop?.city || '',
        totalHT: total._sum.totalHT || 0,
        totalTVA: total._sum.totalTVA || 0,
        totalTTC: total._sum.totalTTC || 0,
        orderCount: total._count.id
      };
    });

    // Commandes par statut (toutes)
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    // Commandes par statut (aujourd'hui)
    const ordersByStatusToday = await prisma.order.groupBy({
      by: ['status'],
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      },
      _count: {
        id: true
      }
    });

    res.json({
      today: {
        totalHT: ordersToday._sum.totalHT || 0,
        totalTVA: ordersToday._sum.totalTVA || 0,
        totalTTC: ordersToday._sum.totalTTC || 0,
        orderCount: ordersToday._count.id || 0
      },
      month: {
        totalHT: ordersMonth._sum.totalHT || 0,
        totalTVA: ordersMonth._sum.totalTVA || 0,
        totalTTC: ordersMonth._sum.totalTTC || 0,
        orderCount: ordersMonth._count.id || 0
      },
      totalsByShop: totalsByShopWithNames.sort((a, b) => b.totalTTC - a.totalTTC),
      ordersByStatus: ordersByStatus.map(s => ({
        status: s.status,
        count: s._count.id
      })),
      ordersByStatusToday: ordersByStatusToday.map(s => ({
        status: s.status,
        count: s._count.id
      }))
    });
  } catch (error) {
    console.error('Erreur dashboard:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @swagger
 * /api/admin/stats/sales-evolution:
 *   get:
 *     summary: Évolution des ventes sur une période
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Nombre de jours à analyser
 *     responses:
 *       200:
 *         description: Données d'évolution récupérées avec succès
 *       403:
 *         description: Accès refusé - Admin requis
 */
router.get('/stats/sales-evolution', authenticate, requireAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: { not: 'ANNULEE' }
      },
      select: {
        createdAt: true,
        totalTTC: true,
        totalHT: true
      },
      orderBy: { createdAt: 'asc' }
    });

    const dailyData = {};
    orders.forEach(order => {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { date: dateKey, totalTTC: 0, totalHT: 0, count: 0 };
      }
      dailyData[dateKey].totalTTC += order.totalTTC;
      dailyData[dateKey].totalHT += order.totalHT;
      dailyData[dateKey].count += 1;
    });

    const evolution = Object.values(dailyData).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    res.json({ evolution });
  } catch (error) {
    console.error('Erreur récupération évolution ventes:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @swagger
 * /api/admin/stats/top-products:
 *   get:
 *     summary: Top produits les plus vendus
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Nombre de produits à retourner
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year, all]
 *           default: month
 *         description: Période d'analyse
 *     responses:
 *       200:
 *         description: Top produits récupérés avec succès
 *       403:
 *         description: Accès refusé - Admin requis
 */
router.get('/stats/top-products', authenticate, requireAdmin, async (req, res) => {
  try {
    const { limit = 10, period = 'month' } = req.query;
    
    let startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    } else {
      startDate = new Date(0);
    }

    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          createdAt: { gte: startDate },
          status: { not: 'ANNULEE' }
        }
      },
      _sum: {
        quantity: true,
        totalTTC: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: parseInt(limit)
    });

    const productIds = topProducts.map(p => p.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        unit: true
      }
    });

    const topProductsWithNames = topProducts.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        productName: product?.name || 'Produit inconnu',
        unit: product?.unit || 'unité',
        totalQuantity: item._sum.quantity || 0,
        totalRevenue: item._sum.totalTTC || 0
      };
    });

    res.json({ topProducts: topProductsWithNames });
  } catch (error) {
    console.error('Erreur récupération top produits:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @swagger
 * /api/admin/stats/category-distribution:
 *   get:
 *     summary: Répartition des ventes par catégorie
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year, all]
 *           default: month
 *         description: Période d'analyse
 *     responses:
 *       200:
 *         description: Répartition par catégorie récupérée avec succès
 *       403:
 *         description: Accès refusé - Admin requis
 */
router.get('/stats/category-distribution', authenticate, requireAdmin, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    } else {
      startDate = new Date(0);
    }

    const categoryStats = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          createdAt: { gte: startDate },
          status: { not: 'ANNULEE' }
        }
      },
      _sum: {
        totalTTC: true
      }
    });

    const productIds = categoryStats.map(s => s.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        category: true
      }
    });

    const categoryMap = {};
    categoryStats.forEach(stat => {
      const product = products.find(p => p.id === stat.productId);
      const category = product?.category || 'AUTRE';
      if (!categoryMap[category]) {
        categoryMap[category] = 0;
      }
      categoryMap[category] += stat._sum.totalTTC || 0;
    });

    const distribution = Object.entries(categoryMap).map(([category, totalRevenue]) => ({
      category,
      totalRevenue
    }));

    res.json({ distribution });
  } catch (error) {
    console.error('Erreur récupération répartition catégories:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @swagger
 * /api/admin/totals-by-shop:
 *   get:
 *     summary: Totaux par magasin pour une période
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month, all]
 *           default: today
 *         description: Période d'analyse
 *     responses:
 *       200:
 *         description: Totaux par magasin récupérés avec succès
 *       403:
 *         description: Accès refusé - Admin requis
 */
router.get('/totals-by-shop', authenticate, requireAdmin, async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    
    let startDate = new Date();
    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else {
      startDate = new Date(0);
    }

    const totalsByShop = await prisma.order.groupBy({
      by: ['shopId'],
      where: {
        createdAt: { gte: startDate },
        status: { not: 'ANNULEE' }
      },
      _sum: {
        totalTTC: true,
        totalHT: true,
        totalTVA: true
      },
      _count: {
        id: true
      }
    });

    const shopIds = totalsByShop.map(t => t.shopId);
    const shops = await prisma.shop.findMany({
      where: { id: { in: shopIds } },
      select: {
        id: true,
        name: true,
        city: true
      }
    });

    const totals = totalsByShop.map(total => {
      const shop = shops.find(s => s.id === total.shopId);
      return {
        shopId: total.shopId,
        shopName: shop?.name || 'Inconnu',
        shopCity: shop?.city || '',
        totalHT: total._sum.totalHT || 0,
        totalTVA: total._sum.totalTVA || 0,
        totalTTC: total._sum.totalTTC || 0,
        orderCount: total._count.id
      };
    });

    res.json({ totals: totals.sort((a, b) => b.totalTTC - a.totalTTC) });
  } catch (error) {
    console.error('Erreur récupération totaux par magasin:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Liste des utilisateurs avec pagination
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Nombre d'éléments par page
 *     responses:
 *       200:
 *         description: Liste des utilisateurs récupérée avec succès
 *       403:
 *         description: Accès refusé - Admin requis
 */
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const total = await prisma.user.count();

    const users = await prisma.user.findMany({
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        shop: {
          select: {
            id: true,
            name: true,
            city: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * PUT /api/admin/users/:id
 * Modifier un utilisateur
 */
router.put(
  '/users/:id',
  authenticate,
  requireAdmin,
  [
    body('name').optional().trim().notEmpty().withMessage('Nom requis'),
    body('email').optional().isEmail().withMessage('Email invalide'),
    body('phone').optional().trim(),
    body('role').optional().isIn(['ADMIN', 'CLIENT']).withMessage('Rôle invalide')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, phone, role } = req.body;
      const updateData = {};

      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (role !== undefined) updateData.role = role;

      const updatedUser = await prisma.user.update({
        where: { id: req.params.id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          shop: true
        }
      });

      res.json({
        success: true,
        message: 'Utilisateur modifié avec succès',
        user: updatedUser
      });
    } catch (error) {
      console.error('Erreur modification utilisateur:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
);

/**
 * PUT /api/admin/users/:id/password
 * Réinitialiser le mot de passe d'un utilisateur
 */
router.put(
  '/users/:id/password',
  authenticate,
  requireAdmin,
  [
    body('newPassword').isLength({ min: 6 }).withMessage('Mot de passe doit faire au moins 6 caractères')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { newPassword } = req.body;
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: req.params.id },
        data: { password: hashedPassword }
      });

      res.json({
        success: true,
        message: 'Mot de passe réinitialisé avec succès'
      });
    } catch (error) {
      console.error('Erreur réinitialisation mot de passe:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
);

/**
 * DELETE /api/admin/users/:id
 * Supprimer un utilisateur (soft delete)
 */
router.delete('/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() }
    });

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * GET /api/admin/export/orders
 * Export des commandes en CSV/Excel
 */
router.get('/export/orders', authenticate, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, shopId, status } = req.query;
    
    let where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }
    if (shopId) where.shopId = shopId;
    if (status) where.status = status;

    const orders = await prisma.order.findMany({
      where,
      include: {
        shop: {
          select: {
            name: true,
            city: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                unit: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format CSV
    const csvRows = [];
    csvRows.push('ID,Date,Magasin,Ville,Statut,Total HT,Total TVA,Total TTC');
    
    orders.forEach(order => {
      csvRows.push([
        order.id,
        order.createdAt.toISOString().split('T')[0],
        order.shop?.name || '',
        order.shop?.city || '',
        order.status,
        order.totalHT.toFixed(2),
        order.totalTVA.toFixed(2),
        order.totalTTC.toFixed(2)
      ].join(','));
    });

    const csv = csvRows.join('\n');
    const filename = `commandes_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\ufeff' + csv); // BOM pour Excel
  } catch (error) {
    console.error('Erreur export commandes:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * GET /api/admin/export/statistics
 * Export des statistiques en CSV
 */
router.get('/export/statistics', authenticate, requireAdmin, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    } else {
      startDate = new Date(0);
    }

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { not: 'ANNULEE' }
      },
      include: {
        shop: {
          select: {
            name: true
          }
        }
      }
    });

    const csvRows = [];
    csvRows.push('Date,Magasin,Total HT,Total TVA,Total TTC');
    
    orders.forEach(order => {
      csvRows.push([
        order.createdAt.toISOString().split('T')[0],
        order.shop?.name || '',
        order.totalHT.toFixed(2),
        order.totalTVA.toFixed(2),
        order.totalTTC.toFixed(2)
      ].join(','));
    });

    const csv = csvRows.join('\n');
    const filename = `statistiques_${period}_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\ufeff' + csv);
  } catch (error) {
    console.error('Erreur export statistiques:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @swagger
 * /api/admin/preparation:
 *   get:
 *     summary: Récupérer les commandes à préparer et les produits à acheter pour une date donnée
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date au format YYYY-MM-DD (par défaut aujourd'hui)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [NEW, PREPARATION, LIVRAISON]
 *         description: Filtrer par statut
 *       - in: query
 *         name: shopId
 *         schema:
 *           type: string
 *         description: Filtrer par magasin
 *     responses:
 *       200:
 *         description: Données de préparation récupérées avec succès
 *       403:
 *         description: Accès refusé - Admin requis
 */
router.get('/preparation', authenticate, requireAdmin, async (req, res) => {
  try {
    const { date, status, shopId } = req.query;
    const selectedDate = date ? new Date(date) : new Date();
    
    // Définir le début et la fin de la journée
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Construire les conditions de filtrage
    const whereConditions = {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay
      },
      status: {
        in: ['NEW', 'PREPARATION', 'LIVRAISON']
      }
    };

    // Ajouter le filtre de statut si spécifié
    if (status && ['NEW', 'PREPARATION', 'LIVRAISON'].includes(status)) {
      whereConditions.status = status;
    }

    // Ajouter le filtre de magasin si spécifié
    if (shopId) {
      whereConditions.shopId = shopId;
    }

    // Récupérer les commandes du jour (NEW, PREPARATION, LIVRAISON)
    const orders = await prisma.order.findMany({
      where: whereConditions,
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            city: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                unit: true,
                stock: true,
                priceHT: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Analyser les produits à acheter
    const productsMap = new Map();
    
    orders.forEach(order => {
      order.items.forEach(item => {
        const product = item.product;
        const requestedQty = item.quantity;
        const availableStock = product.stock || 0;
        
        if (requestedQty > availableStock) {
          const qtyToBuy = requestedQty - availableStock;
          
          if (productsMap.has(product.id)) {
            const existing = productsMap.get(product.id);
            existing.totalRequested += requestedQty;
            existing.quantityToBuy += qtyToBuy;
            existing.orders.push(order.id);
          } else {
            productsMap.set(product.id, {
              productId: product.id,
              productName: product.name,
              unit: product.unit,
              currentStock: availableStock,
              totalRequested: requestedQty,
              quantityToBuy: qtyToBuy,
              priceHT: product.priceHT,
              orders: [order.id]
            });
          }
        } else {
          // Même si le stock est suffisant, on peut vouloir tracker la demande
          if (!productsMap.has(product.id)) {
            productsMap.set(product.id, {
              productId: product.id,
              productName: product.name,
              unit: product.unit,
              currentStock: availableStock,
              totalRequested: requestedQty,
              quantityToBuy: 0,
              priceHT: product.priceHT,
              orders: [order.id]
            });
          } else {
            const existing = productsMap.get(product.id);
            existing.totalRequested += requestedQty;
            existing.orders.push(order.id);
          }
        }
      });
    });

    // Convertir en tableau et filtrer seulement ceux qui nécessitent un achat
    const productsToBuy = Array.from(productsMap.values())
      .filter(item => item.quantityToBuy > 0)
      .sort((a, b) => b.quantityToBuy - a.quantityToBuy);

    // Marquer les items qui nécessitent un achat
    const ordersWithPurchaseInfo = orders.map(order => ({
      ...order,
      items: order.items.map(item => ({
        ...item,
        needsPurchase: (item.product.stock || 0) < item.quantity
      }))
    }));

    // Calculer les statistiques
    const stats = {
      totalOrders: orders.length,
      totalAmount: orders.reduce((sum, o) => sum + o.totalTTC, 0),
      productsNeeded: productsToBuy.length,
      totalQuantityNeeded: productsToBuy.reduce((sum, p) => sum + p.quantityToBuy, 0)
    };

    res.json({
      success: true,
      orders: ordersWithPurchaseInfo,
      productsToBuy,
      stats
    });
  } catch (error) {
    console.error('Erreur récupération données préparation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

module.exports = router;
