const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { authenticate, requireClient } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * GET /api/client/shops
 * Liste des magasins accessibles par l'organisation du client
 */
router.get('/', authenticate, requireClient, async (req, res) => {
  try {
    const accessibleShopIds = (req.context?.accessibleShops || []).map(s => s.id);
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
          hasPrevPage: false
        }
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const where = {
      id: { in: accessibleShopIds },
      organizationId: { in: organizationIds }
    };

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
          siret: true,
          tvaNumber: true,
          contactPerson: true,
          contactEmail: true,
          contactPhone: true,
          organizationId: true,
          _count: {
            select: {
              orders: true
            }
          }
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit
      }),
      prisma.shop.count({ where })
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
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    logger.error('Erreur récupération magasins client', {
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
 * GET /api/client/shops/:id
 * Détails d'un magasin (accessible par l'organisation)
 */
router.get('/:id', authenticate, requireClient, async (req, res) => {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de magasin invalide'
      });
    }

    const accessibleShopIds = (req.context?.accessibleShops || []).map(s => s.id);
    const shopId = req.params.id;

    if (!accessibleShopIds.includes(shopId)) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé - Magasin non accessible'
      });
    }

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        postalCode: true,
        phone: true,
        siret: true,
        tvaNumber: true,
        contactPerson: true,
        contactEmail: true,
        contactPhone: true,
        organizationId: true,
        _count: {
          select: {
            orders: true
          }
        }
      }
    });

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Magasin non trouvé'
      });
    }

    res.json({
      success: true,
      shop
    });
  } catch (error) {
    logger.error('Erreur récupération magasin client', {
      error: error.message,
      shopId: req.params.id,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * POST /api/client/shops
 * Créer un nouveau magasin dans l'organisation du client
 */
router.post(
  '/',
  authenticate,
  requireClient,
  [
    body('name').trim().notEmpty().withMessage('Le nom du magasin est requis'),
    body('address').trim().notEmpty().withMessage('L\'adresse est requise'),
    body('city').trim().notEmpty().withMessage('La ville est requise'),
    body('postalCode').trim().matches(/^\d{5}$/).withMessage('Code postal invalide (5 chiffres)')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const organizationId = req.context?.activeOrganizationId || req.context?.organizationIds?.[0];
      if (!organizationId) {
        return res.status(400).json({
          success: false,
          message: 'Organisation non trouvée'
        });
      }

      const {
        name,
        address,
        city,
        postalCode,
        phone,
        siret,
        tvaNumber,
        contactPerson,
        contactEmail,
        contactPhone
      } = req.body;

      // Créer le magasin dans l'organisation
      const shop = await prisma.shop.create({
        data: {
          name,
          address,
          city,
          postalCode,
          phone,
          siret,
          tvaNumber,
          contactPerson,
          contactEmail,
          contactPhone,
          organizationId,
          userId: req.user.id // Utilisateur principal (contact)
        },
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          postalCode: true,
          phone: true,
          siret: true,
          tvaNumber: true,
          contactPerson: true,
          contactEmail: true,
          contactPhone: true,
          organizationId: true
        }
      });

      // Créer le membership si nécessaire et le shopMembership
      const membership = await prisma.membership.findFirst({
        where: {
          organizationId,
          userId: req.user.id
        }
      });

      if (membership) {
        await prisma.shopMembership.create({
          data: {
            membershipId: membership.id,
            shopId: shop.id
          }
        });
      }

      logger.info('Magasin créé par client', {
        shopId: shop.id,
        shopName: shop.name,
        organizationId,
        userId: req.user.id
      });

      res.status(201).json({
        success: true,
        message: 'Magasin créé avec succès',
        shop
      });
    } catch (error) {
      logger.error('Erreur création magasin client', {
        error: error.message,
        userId: req.user?.id
      });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du magasin'
      });
    }
  }
);

/**
 * PUT /api/client/shops/:id
 * Modifier un magasin (accessible par l'organisation)
 */
router.put(
  '/:id',
  authenticate,
  requireClient,
  [
    body('name').optional().trim().notEmpty(),
    body('address').optional().trim().notEmpty(),
    body('city').optional().trim().notEmpty(),
    body('postalCode').optional().trim().matches(/^\d{5}$/),
    body('phone').optional()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: 'ID de magasin invalide'
        });
      }

      const accessibleShopIds = (req.context?.accessibleShops || []).map(s => s.id);
      const shopId = req.params.id;

      if (!accessibleShopIds.includes(shopId)) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé - Magasin non accessible'
        });
      }

      const {
        name,
        address,
        city,
        postalCode,
        phone,
        siret,
        tvaNumber,
        contactPerson,
        contactEmail,
        contactPhone
      } = req.body;

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (address !== undefined) updateData.address = address;
      if (city !== undefined) updateData.city = city;
      if (postalCode !== undefined) updateData.postalCode = postalCode;
      if (phone !== undefined) updateData.phone = phone;
      if (siret !== undefined) updateData.siret = siret;
      if (tvaNumber !== undefined) updateData.tvaNumber = tvaNumber;
      if (contactPerson !== undefined) updateData.contactPerson = contactPerson;
      if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
      if (contactPhone !== undefined) updateData.contactPhone = contactPhone;

      const updatedShop = await prisma.shop.update({
        where: { id: shopId },
        data: updateData,
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          postalCode: true,
          phone: true,
          siret: true,
          tvaNumber: true,
          contactPerson: true,
          contactEmail: true,
          contactPhone: true,
          organizationId: true
        }
      });

      logger.info('Magasin modifié par client', {
        shopId: updatedShop.id,
        userId: req.user?.id
      });

      res.json({
        success: true,
        message: 'Magasin mis à jour avec succès',
        shop: updatedShop
      });
    } catch (error) {
      logger.error('Erreur modification magasin client', {
        error: error.message,
        shopId: req.params.id,
        userId: req.user?.id
      });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la modification du magasin'
      });
    }
  }
);

module.exports = router;
