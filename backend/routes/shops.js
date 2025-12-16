const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const prisma = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

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
    const shops = await prisma.shop.findMany({
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

    res.json({ shops });
  } catch (error) {
    console.error('Erreur récupération magasins:', error);
    res.status(500).json({ message: 'Erreur serveur' });
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
      return res.status(404).json({ message: 'Magasin non trouvé' });
    }

    res.json({ shop });
  } catch (error) {
    console.error('Erreur récupération magasin:', error);
    res.status(500).json({ message: 'Erreur serveur' });
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
    body('postalCode').trim().matches(/^\d{5}$/).withMessage('Code postal invalide (5 chiffres)'),
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

      const { shopName, address, city, postalCode, phone, userName, email, password, userPhone } = req.body;

      // Vérifier si l'email existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);

      // Créer l'utilisateur et son magasin
      const user = await prisma.user.create({
        data: {
          name: userName,
          email,
          password: hashedPassword,
          phone: userPhone,
          role: 'CLIENT',
          shop: {
            create: {
              name: shopName,
              address,
              city,
              postalCode,
              phone
            }
          }
        },
        include: {
          shop: true
        }
      });

      res.status(201).json({
        message: 'Magasin créé avec succès',
        shop: user.shop
      });
    } catch (error) {
      console.error('Erreur création magasin:', error);
      res.status(500).json({ message: 'Erreur lors de la création du magasin' });
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
        return res.status(404).json({ message: 'Magasin non trouvé' });
      }

      const { name, address, city, postalCode, phone, userName, email, userPhone } = req.body;

      // Mettre à jour le magasin
      const updateData = {};
      if (name) updateData.name = name;
      if (address) updateData.address = address;
      if (city) updateData.city = city;
      if (postalCode) updateData.postalCode = postalCode;
      if (phone !== undefined) updateData.phone = phone;

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

      // Mettre à jour en transaction
      const updatedShop = await prisma.shop.update({
        where: { id: req.params.id },
        data: {
          ...updateData,
          user: {
            update: userUpdateData
          }
        },
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
        message: 'Magasin modifié avec succès',
        shop: updatedShop
      });
    } catch (error) {
      console.error('Erreur modification magasin:', error);
      res.status(500).json({ message: 'Erreur lors de la modification du magasin' });
    }
  }
);

/**
 * DELETE /api/shops/:id
 * Supprimer un magasin (et son utilisateur)
 */
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
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
      return res.status(404).json({ message: 'Magasin non trouvé' });
    }

    // Vérifier s'il y a des commandes
    if (shop._count.orders > 0) {
      return res.status(400).json({ 
        message: 'Impossible de supprimer un magasin avec des commandes. Désactivez-le plutôt.' 
      });
    }

    // Supprimer le magasin (cascade supprimera aussi l'utilisateur)
    await prisma.shop.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Magasin supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression magasin:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du magasin' });
  }
});

module.exports = router;

