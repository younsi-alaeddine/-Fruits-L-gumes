const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const prisma = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/shops:
 *   get:
 *     summary: Liste des magasins (ADMIN uniquement)
 *     tags: [Shops]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des magasins récupérée avec succès
 *       403:
 *         description: Accès refusé - Admin requis
 */
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const total = await prisma.shop.count();

    const shops = await prisma.shop.findMany({
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        _count: {
          select: {
            orders: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

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
    // SECURITY: Use logger instead of console.error to prevent sensitive data exposure
    logger.error('Erreur récupération magasins', { 
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
 * /api/shops/{id}:
 *   get:
 *     summary: Détails d'un magasin
 *     tags: [Shops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du magasin
 *     responses:
 *       200:
 *         description: Détails du magasin récupérés avec succès
 *       404:
 *         description: Magasin non trouvé
 *       403:
 *         description: Accès refusé - Admin requis
 */
router.get('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    // SECURITY: Validate UUID format to prevent injection attacks
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(req.params.id)) {
      return res.status(400).json({ 
        success: false,
        message: 'ID de magasin invalide' 
      });
    }

    const shop = await prisma.shop.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            items: {
              include: {
                product: true
              }
            }
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
    // SECURITY: Use logger instead of console.error to prevent sensitive data exposure
    logger.error('Erreur récupération magasin', { 
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
 * @swagger
 * /api/shops:
 *   post:
 *     summary: Créer un nouveau magasin avec son utilisateur
 *     tags: [Shops]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shopName
 *               - address
 *               - city
 *               - postalCode
 *               - userName
 *               - email
 *               - password
 *             properties:
 *               shopName:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               postalCode:
 *                 type: string
 *                 pattern: '^[0-9]{5}$'
 *               phone:
 *                 type: string
 *               userName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       201:
 *         description: Magasin créé avec succès
 *       400:
 *         description: Erreur de validation
 *       403:
 *         description: Accès refusé - Admin requis
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('shopName').trim().notEmpty().withMessage('Le nom du magasin est requis'),
    body('address').trim().notEmpty().withMessage('L\'adresse est requise'),
    body('city').trim().notEmpty().withMessage('La ville est requise'),
    body('postalCode').customSanitizer((v) => String(v ?? '').trim()).matches(/^\d{5}$/).withMessage('Code postal invalide (5 chiffres)'),
    body('userName').trim().notEmpty().withMessage('Le nom de l\'utilisateur est requis'),
    body('email').isEmail().withMessage('Email invalide'),
    body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit faire au moins 6 caractères'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { shopName, address, city, postalCode, phone, userName, email, password, userPhone, siret } = req.body;

      // Vérifier si l'email existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);

      // Créer l'utilisateur et son magasin (User.shops = one-to-many)
      // emailVerified + isApproved = true : client créé par admin, pas d'email de vérification ni d'approbation
      const user = await prisma.user.create({
        data: {
          name: userName,
          email,
          password: hashedPassword,
          phone: userPhone,
          role: 'CLIENT',
          emailVerified: true,
          isApproved: true,
          approvedBy: req.user?.id ?? null,
          approvedAt: new Date(),
          shops: {
            create: {
              name: shopName,
              address,
              city,
              postalCode,
              phone,
              ...(siret != null && siret !== '' && { siret: String(siret).trim() })
            }
          }
        },
        include: {
          shops: true
        }
      });

      const createdShop = user.shops?.[0];
      res.status(201).json({
        success: true,
        message: 'Magasin créé avec succès',
        shop: createdShop
      });
    } catch (error) {
      logger.error('Erreur création magasin', { 
        error: error.message,
        code: error.code,
        stack: error.stack,
        userId: req.user?.id 
      });
      if (error.code === 'P2002') {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }
      const msg = error.message || 'Erreur lors de la création du magasin';
      res.status(500).json({ success: false, message: msg });
    }
  }
);

/**
 * PUT /api/shops/:id
 * Modifier un magasin
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  [
    body('name').optional().trim().notEmpty(),
    body('address').optional().trim().notEmpty(),
    body('city').optional().trim().notEmpty(),
    body('postalCode').optional().trim().matches(/^\d{5}$/),
    body('userName').optional().trim().notEmpty(),
    body('email').optional().isEmail(),
    body('phone').optional(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const shop = await prisma.shop.findUnique({
        where: { id: req.params.id },
        include: { user: true }
      });

      if (!shop) {
        return res.status(404).json({ 
          success: false,
          message: 'Magasin non trouvé' 
        });
      }

      const { name, address, city, postalCode, phone, userName, email, userPhone, siret } = req.body;

      // Mettre à jour le magasin
      const updateData = {};
      if (name) updateData.name = name;
      if (address) updateData.address = address;
      if (city) updateData.city = city;
      if (postalCode) updateData.postalCode = postalCode;
      if (phone !== undefined) updateData.phone = phone;
      if (siret !== undefined) updateData.siret = siret === '' || siret == null ? null : String(siret).trim();

      // Mettre à jour l'utilisateur si nécessaire
      const userUpdateData = {};
      if (userName) userUpdateData.name = userName;
      if (email) {
        // Vérifier si l'email n'est pas déjà utilisé par un autre utilisateur
        const existingUser = await prisma.user.findUnique({
          where: { email }
        });
        if (existingUser && existingUser.id !== shop.userId) {
          return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }
        userUpdateData.email = email;
      }
      if (userPhone !== undefined) userUpdateData.phone = userPhone;

      const hasUserUpdates = Object.keys(userUpdateData).length > 0;
      const canUpdateUser = shop.userId != null && hasUserUpdates;

      const updatePayload = {
        ...updateData,
        ...(canUpdateUser && {
          user: { update: userUpdateData }
        })
      };

      const updatedShop = await prisma.shop.update({
        where: { id: req.params.id },
        data: updatePayload,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          _count: {
            select: {
              orders: true
            }
          }
        }
      });

      res.json({
        success: true,
        message: 'Magasin modifié avec succès',
        shop: updatedShop
      });
    } catch (error) {
      logger.error('Erreur modification magasin', { 
        error: error.message,
        code: error.code,
        stack: error.stack,
        shopId: req.params.id,
        userId: req.user?.id 
      });
      const msg = process.env.NODE_ENV === 'production'
        ? 'Erreur lors de la modification du magasin'
        : (error.message || 'Erreur lors de la modification du magasin');
      res.status(500).json({ 
        success: false,
        message: msg 
      });
    }
  }
);

/**
 * DELETE /api/shops/:id
 * Supprimer un magasin (et son utilisateur)
 */
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    // SECURITY: Validate UUID format to prevent injection attacks
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(req.params.id)) {
      return res.status(400).json({ 
        success: false,
        message: 'ID de magasin invalide' 
      });
    }

    const shop = await prisma.shop.findUnique({
      where: { id: req.params.id },
      include: {
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

    // Vérifier s'il y a des commandes
    if (shop._count.orders > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Impossible de supprimer un magasin avec des commandes. Désactivez-le plutôt.' 
      });
    }

    // Supprimer le magasin (cascade supprimera aussi l'utilisateur)
    await prisma.shop.delete({
      where: { id: req.params.id }
    });

    res.json({ 
      success: true,
      message: 'Magasin supprimé avec succès' 
    });
  } catch (error) {
    // SECURITY: Use logger instead of console.error to prevent sensitive data exposure
    logger.error('Erreur suppression magasin', { 
      error: error.message,
      shopId: req.params.id,
      userId: req.user?.id 
    });
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la suppression du magasin' 
    });
  }
});

module.exports = router;

