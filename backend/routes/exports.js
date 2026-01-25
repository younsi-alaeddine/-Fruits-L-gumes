const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * GET /api/exports
 * Liste des types d'export disponibles (Admin only)
 */
router.get('/', authenticate, requireAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'API Exports',
    availableExports: [
      'orders',
      'products',
      'invoices',
      'customers',
      'reports'
    ]
  });
});

/**
 * GET /api/exports/orders
 * Export des commandes
 */
router.get('/orders', authenticate, requireAdmin, async (req, res) => {
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
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (format === 'csv') {
      // ✅ Export CSV des commandes
      const csvHeaders = ['N° Commande', 'Date', 'Magasin', 'Statut', 'Total HT', 'Total TTC', 'Produits'];
      const csvRows = orders.map(order => [
        order.orderNumber || order.id.substring(0, 8),
        new Date(order.createdAt).toLocaleDateString('fr-FR'),
        order.shop?.name || 'N/A',
        order.status,
        order.totalHT?.toFixed(2) || '0.00',
        order.totalTTC?.toFixed(2) || '0.00',
        order.items?.length || 0
      ]);
      
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=commandes-${Date.now()}.csv`);
      res.send('\ufeff' + csvContent); // BOM pour Excel
    } else {
      res.json({
        success: true,
        data: orders,
        count: orders.length
      });
    }
  } catch (error) {
    logger.error('Export orders error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'export des commandes',
      error: error.message
    });
  }
});

/**
 * GET /api/exports/products
 * Export des produits
 */
router.get('/products', authenticate, requireAdmin, async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    
    const products = await prisma.product.findMany({
      include: {
        customCategory: {
          select: {
            name: true
          }
        },
        supplierProducts: {
          include: {
            supplier: {
              select: {
                name: true
              }
            }
          },
          take: 1
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    if (format === 'csv') {
      // ✅ Export CSV des produits
      const csvHeaders = ['Nom', 'Catégorie', 'Prix HT', 'TVA', 'Unité', 'Stock', 'Fournisseur'];
      const csvRows = products.map(product => [
        product.name,
        product.customCategory?.name || product.category || 'N/A',
        product.priceHT?.toFixed(2) || '0.00',
        product.tvaRate?.toFixed(2) || '5.50',
        product.unit || 'kg',
        product.stock?.toFixed(2) || '0.00',
        product.supplierProducts?.[0]?.supplier?.name || 'N/A'
      ]);
      
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=produits-${Date.now()}.csv`);
      res.send('\ufeff' + csvContent); // BOM pour Excel
    } else {
      res.json({
        success: true,
        data: products,
        count: products.length
      });
    }
  } catch (error) {
    logger.error('Export products error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'export des produits',
      error: error.message
    });
  }
});

module.exports = router;
