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

module.exports = router;
