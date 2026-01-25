const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate, requireManager } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * GET /api/manager/shops
 * Liste des magasins accessibles au manager (organisation + memberships)
 */
router.get('/shops', authenticate, requireManager, async (req, res) => {
  try {
    const accessibleShopIds = (req.context?.accessibleShops || []).map((s) => s.id);
    const organizationIds = req.context?.organizationIds || [];

    if (accessibleShopIds.length === 0) {
      return res.json({
        success: true,
        shops: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const where = {
      id: { in: accessibleShopIds },
      organizationId: organizationIds.length ? { in: organizationIds } : undefined,
    };
    if (!where.organizationId) delete where.organizationId;

    const [shops, total] = await Promise.all([
      prisma.shop.findMany({
        where,
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          postalCode: true,
          phone: true,
          contactPerson: true,
          contactEmail: true,
          contactPhone: true,
          organizationId: true,
          _count: { select: { orders: true } },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.shop.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    res.json({
      success: true,
      shops,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    logger.error('Erreur récupération magasins manager', {
      error: error.message,
      userId: req.user?.id,
    });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
});

/**
 * GET /api/manager/users
 * Utilisateurs de l’organisation du manager (même org(s) via memberships)
 */
router.get('/users', authenticate, requireManager, async (req, res) => {
  try {
    const organizationIds = req.context?.organizationIds || [];
    const accessibleShopIds = (req.context?.accessibleShops || []).map((s) => s.id);

    if (organizationIds.length === 0) {
      return res.json({
        success: true,
        users: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const membershipUserIds = await prisma.membership.findMany({
      where: {
        organizationId: { in: organizationIds },
        status: 'ACTIVE',
      },
      select: { userId: true },
      distinct: ['userId'],
    });
    const userIds = membershipUserIds.map((m) => m.userId);
    if (userIds.length === 0) {
      return res.json({
        success: true,
        users: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
    }

    const total = userIds.length;
    const paginatedIds = userIds.slice(skip, skip + limit);

    const users = await prisma.user.findMany({
      where: { id: { in: paginatedIds } },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isApproved: true,
        approvedAt: true,
        createdAt: true,
        memberships: {
          where: { status: 'ACTIVE', organizationId: { in: organizationIds } },
          select: {
            shopMemberships: {
              where: { status: 'ACTIVE' },
              select: { shopId: true },
            },
          },
        },
      },
    });

    const allUserShopIds = new Set();
    users.forEach((u) => {
      (u.memberships || []).forEach((m) => {
        (m.shopMemberships || []).forEach((sm) => allUserShopIds.add(sm.shopId));
      });
    });
    const shopList = allUserShopIds.size
      ? await prisma.shop.findMany({
          where: { id: { in: [...allUserShopIds] } },
          select: { id: true, name: true },
        })
      : [];
    const shopMap = Object.fromEntries(shopList.map((s) => [s.id, s.name]));

    const enriched = users.map((u) => {
      const shopIdsUser = (u.memberships || [])
        .flatMap((m) => (m.shopMemberships || []).map((sm) => sm.shopId))
        .filter(Boolean);
      const firstId = shopIdsUser[0];
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        isApproved: u.isApproved,
        approvedAt: u.approvedAt,
        createdAt: u.createdAt,
        storeId: firstId || null,
        store: firstId ? shopMap[firstId] || null : null,
      };
    });

    const totalPages = Math.max(1, Math.ceil(total / limit));

    res.json({
      success: true,
      users: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    logger.error('Erreur récupération users manager', {
      error: error.message,
      userId: req.user?.id,
    });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
});

module.exports = router;
