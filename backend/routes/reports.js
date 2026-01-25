const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');
const ExcelJS = require('exceljs');

/**
 * GET /api/reports/sales
 * Rapport de ventes
 */
router.get('/sales', authenticate, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;
    
    const where = {};
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        shop: {
          select: {
            name: true,
            city: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculer les statistiques
    const stats = {
      totalOrders: orders.length,
      totalHT: orders.reduce((sum, o) => sum + o.totalHT, 0),
      totalTVA: orders.reduce((sum, o) => sum + o.totalTVA, 0),
      totalTTC: orders.reduce((sum, o) => sum + o.totalTTC, 0),
      ordersByStatus: {
        NEW: orders.filter(o => o.status === 'NEW').length,
        PREPARATION: orders.filter(o => o.status === 'PREPARATION').length,
        LIVRAISON: orders.filter(o => o.status === 'LIVRAISON').length,
        LIVREE: orders.filter(o => o.status === 'LIVREE').length,
        ANNULEE: orders.filter(o => o.status === 'ANNULEE').length,
      },
    };

    if (format === 'excel') {
      // Générer un fichier Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Rapport de ventes');

      // En-têtes
      worksheet.columns = [
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Numéro', key: 'orderId', width: 20 },
        { header: 'Client', key: 'client', width: 30 },
        { header: 'Statut', key: 'status', width: 15 },
        { header: 'Total HT', key: 'totalHT', width: 12 },
        { header: 'TVA', key: 'totalTVA', width: 12 },
        { header: 'Total TTC', key: 'totalTTC', width: 12 },
      ];

      // Données
      orders.forEach(order => {
        worksheet.addRow({
          date: new Date(order.createdAt).toLocaleDateString('fr-FR'),
          orderId: order.id.substring(0, 8),
          client: order.shop.name,
          status: order.status,
          totalHT: order.totalHT.toFixed(2),
          totalTVA: order.totalTVA.toFixed(2),
          totalTTC: order.totalTTC.toFixed(2),
        });
      });

      // Résumé
      worksheet.addRow({});
      worksheet.addRow({ client: 'TOTAL', totalHT: stats.totalHT.toFixed(2), totalTVA: stats.totalTVA.toFixed(2), totalTTC: stats.totalTTC.toFixed(2) });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=rapport-ventes.xlsx');
      
      await workbook.xlsx.write(res);
      res.end();
    } else {
      res.json({
        success: true,
        stats,
        orders,
      });
    }
  } catch (error) {
    logger.error('Erreur génération rapport ventes:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du rapport',
    });
  }
});

/**
 * GET /api/reports/products
 * Rapport des produits
 */
router.get('/products', authenticate, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {};
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Agréger les ventes par produit
    const productSales = {};
    
    orders.forEach(order => {
      order.items.forEach(item => {
        const productId = item.productId;
        if (!productSales[productId]) {
          productSales[productId] = {
            product: item.product,
            quantity: 0,
            totalHT: 0,
            totalTTC: 0,
            orderCount: 0,
          };
        }
        productSales[productId].quantity += item.quantity;
        productSales[productId].totalHT += item.totalHT;
        productSales[productId].totalTTC += item.totalTTC;
        productSales[productId].orderCount += 1;
      });
    });

    const products = Object.values(productSales).sort((a, b) => b.totalTTC - a.totalTTC);

    res.json({
      success: true,
      products,
    });
  } catch (error) {
    logger.error('Erreur génération rapport produits:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du rapport',
    });
  }
});

/**
 * GET /api/reports/categories
 * Rapport par catégories
 */
router.get('/categories', authenticate, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {};
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    const categorySales = {};
    
    orders.forEach(order => {
      order.items.forEach(item => {
        const category = item.product.category || 'Non classé';
        if (!categorySales[category]) {
          categorySales[category] = {
            category,
            quantity: 0,
            totalHT: 0,
            totalTTC: 0,
            productCount: new Set(),
          };
        }
        categorySales[category].quantity += item.quantity;
        categorySales[category].totalHT += item.totalHT;
        categorySales[category].totalTTC += item.totalTTC;
        categorySales[category].productCount.add(item.productId);
      });
    });

    const categories = Object.values(categorySales).map(cat => ({
      ...cat,
      productCount: cat.productCount.size
    })).sort((a, b) => b.totalTTC - a.totalTTC);

    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    logger.error('Erreur génération rapport catégories:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du rapport',
    });
  }
});

/**
 * GET /api/reports/clients
 * Rapport par clients
 */
router.get('/clients', authenticate, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {};
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        shop: {
          include: {
            organization: true
          }
        },
      },
    });

    const clientSales = {};

    orders.forEach(order => {
      const clientId = order.shop?.organizationId || order.shopId || 'unknown';
      const clientName = order.shop?.organization?.name || order.shop?.name || 'Non défini';
      
      if (!clientSales[clientId]) {
        clientSales[clientId] = {
          clientId,
          clientName,
          orderCount: 0,
          totalHT: 0,
          totalTTC: 0,
          shopsCount: new Set(),
        };
      }
      clientSales[clientId].orderCount += 1;
      clientSales[clientId].totalHT += order.totalHT || 0;
      clientSales[clientId].totalTTC += order.totalTTC || 0;
      if (order.shopId) clientSales[clientId].shopsCount.add(order.shopId);
    });

    const clients = Object.values(clientSales).map(client => ({
      ...client,
      shopsCount: client.shopsCount.size,
      averageOrderValue: client.orderCount > 0 ? client.totalTTC / client.orderCount : 0
    })).sort((a, b) => b.totalTTC - a.totalTTC);

    res.json({
      success: true,
      clients,
    });
  } catch (error) {
    logger.error('Erreur génération rapport clients:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du rapport',
    });
  }
});

/**
 * GET /api/reports/trends
 * Rapport tendances (évolution dans le temps)
 */
router.get('/trends', authenticate, requireAdmin, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Calculer la date de début selon la période
    const now = new Date();
    const startDate = new Date();
    
    if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: now
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Grouper par jour/semaine/mois selon la période
    const timeline = {};
    
    orders.forEach(order => {
      let key;
      const date = new Date(order.createdAt);
      
      if (period === 'week') {
        key = date.toISOString().split('T')[0]; // Par jour
      } else if (period === 'month') {
        key = date.toISOString().split('T')[0]; // Par jour
      } else {
        // Par mois pour l'année
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      if (!timeline[key]) {
        timeline[key] = {
          date: key,
          orderCount: 0,
          revenue: 0,
          commission: 0
        };
      }
      
      timeline[key].orderCount += 1;
      timeline[key].revenue += order.totalTTC || 0;
      timeline[key].commission += order.totalMargin || 0;
    });

    const trends = Object.values(timeline).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    res.json({
      success: true,
      period,
      trends,
    });
  } catch (error) {
    logger.error('Erreur génération rapport tendances:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du rapport',
    });
  }
});

/**
 * GET /api/reports/performance
 * Rapport de performance global
 */
router.get('/performance', authenticate, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {};
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [orders, products, orgCount, shops] = await Promise.all([
      prisma.order.findMany({ where }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.organization.count(),
      prisma.shop.count()
    ]);

    const performance = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, o) => sum + (o.totalTTC || 0), 0),
      totalCommission: orders.reduce((sum, o) => sum + (o.totalMargin || 0), 0),
      averageOrderValue: orders.length > 0 ? orders.reduce((sum, o) => sum + (o.totalTTC || 0), 0) / orders.length : 0,
      activeProducts: products,
      totalClients: orgCount,
      totalShops: shops,
      ordersByStatus: {
        pending: orders.filter(o => ['en attente', 'nouveau', 'NEW'].includes(o.status)).length,
        validated: orders.filter(o => ['validée', 'VALIDATED'].includes(o.status)).length,
        delivered: orders.filter(o => ['livrée', 'DELIVERED'].includes(o.status)).length,
        cancelled: orders.filter(o => ['annulée', 'CANCELLED'].includes(o.status)).length
      }
    };

    res.json({
      success: true,
      performance,
    });
  } catch (error) {
    logger.error('Erreur génération rapport performance:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du rapport',
    });
  }
});

module.exports = router;
