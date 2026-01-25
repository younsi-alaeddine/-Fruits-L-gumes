const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * GET /api/search?q=...
 * Recherche globale (produits, commandes, utilisateurs, magasins) – ADMIN
 */
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) {
      return res.json({
        success: true,
        results: {
          products: [],
          clients: [],
          orders: [],
          users: [],
          stores: [],
        },
      });
    }

    const term = { contains: q, mode: 'insensitive' };
    const take = 10;

    const [products, orders, users, stores] = await Promise.all([
      prisma.product.findMany({
        where: {
          OR: [
            { name: term },
            { gencod: term },
            { barcode: q },
          ].filter((c) => Object.keys(c.OR?.[0] || c).length > 0),
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          gencod: true,
          barcode: true,
          unitPrice: true,
          customCategory: { select: { name: true } },
        },
        take,
      }),
      prisma.order.findMany({
        where: {
          OR: [
            { orderNumber: term },
            ...(/^[0-9a-f-]{36}$/i.test(q) ? [{ id: q }] : []),
          ],
        },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalTTC: true,
          orderDate: true,
          shop: { select: { id: true, name: true } },
        },
        take,
        orderBy: { orderDate: 'desc' },
      }),
      prisma.user.findMany({
        where: {
          OR: [
            { name: term },
            { email: term },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
        take,
      }),
      prisma.shop.findMany({
        where: { name: term },
        select: {
          id: true,
          name: true,
          city: true,
          address: true,
        },
        take,
      }),
    ]);

    const results = {
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.gencod || p.barcode,
        category: p.customCategory,
        price: p.priceHT,
      })),
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        totalTTC: o.totalTTC,
        orderDate: o.orderDate,
        createdAt: o.orderDate,
        shop: o.shop ? { name: o.shop.name } : null,
      })),
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
      })),
      stores: stores.map((s) => ({ ...s, email: s.contactEmail })),
      clients: stores.map((s) => ({ ...s, email: s.contactEmail })),
    };

    res.json({ success: true, results });
  } catch (error) {
    logger.error('Erreur recherche globale', { error: error.message, q: req.query.q });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche',
    });
  }
});

module.exports = router;
