const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { authenticate, requireClient } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * GET /api/recurring-orders
 * Liste des commandes récurrentes
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const where = {};
    
    // Les clients voient seulement leurs commandes récurrentes
    if (req.user.role === 'CLIENT' && req.user.shop) {
      where.shopId = req.user.shop.id;
    }

    const recurringOrders = await prisma.recurringOrder.findMany({
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
                id: true,
                name: true,
                priceHT: true,
                unit: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      recurringOrders,
    });
  } catch (error) {
    logger.error('Erreur récupération commandes récurrentes:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des commandes récurrentes',
    });
  }
});

/**
 * GET /api/recurring-orders/:id
 * Détails d'une commande récurrente
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const recurringOrder = await prisma.recurringOrder.findUnique({
      where: { id: req.params.id },
      include: {
        shop: {
          select: {
            name: true,
            city: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!recurringOrder) {
      return res.status(404).json({
        success: false,
        message: 'Commande récurrente non trouvée',
      });
    }

    // Vérifier les permissions
    if (req.user.role === 'CLIENT' && recurringOrder.shopId !== req.user.shop?.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé',
      });
    }

    res.json({
      success: true,
      recurringOrder,
    });
  } catch (error) {
    logger.error('Erreur récupération commande récurrente:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la commande récurrente',
    });
  }
});

/**
 * POST /api/recurring-orders
 * Créer une commande récurrente
 */
router.post(
  '/',
  authenticate,
  requireClient,
  [
    body('name').notEmpty().withMessage('Nom requis'),
    body('frequency').isIn(['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM']).withMessage('Fréquence invalide'),
    body('items').isArray({ min: 1 }).withMessage('Au moins un produit est requis'),
    body('items.*.productId').notEmpty().withMessage('ID produit requis'),
    body('items.*.quantity').isFloat({ min: 0.01 }).withMessage('Quantité invalide'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, frequency, dayOfWeek, dayOfMonth, items } = req.body;
      const shopId = req.user.shop?.id;

      if (!shopId) {
        return res.status(400).json({
          success: false,
          message: 'Magasin non trouvé pour cet utilisateur',
        });
      }

      // Vérifier que les produits existent et sont actifs
      const productIds = items.map(item => item.productId);
      const products = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          isActive: true,
          isVisibleToClients: true,
        },
      });

      if (products.length !== productIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Un ou plusieurs produits ne sont pas disponibles',
        });
      }

      // Calculer nextRun en fonction de la fréquence
      const now = new Date();
      let nextRun = new Date(now);
      
      switch (frequency) {
        case 'DAILY':
          nextRun.setDate(now.getDate() + 1);
          break;
        case 'WEEKLY':
          if (dayOfWeek !== undefined) {
            const daysUntil = (dayOfWeek - now.getDay() + 7) % 7 || 7;
            nextRun.setDate(now.getDate() + daysUntil);
          } else {
            nextRun.setDate(now.getDate() + 7);
          }
          break;
        case 'MONTHLY':
          if (dayOfMonth !== undefined) {
            nextRun.setMonth(now.getMonth() + 1);
            nextRun.setDate(dayOfMonth);
          } else {
            nextRun.setMonth(now.getMonth() + 1);
          }
          break;
        default:
          nextRun.setDate(now.getDate() + 1);
      }

      // Créer la commande récurrente
      const recurringOrder = await prisma.recurringOrder.create({
        data: {
          shopId,
          name,
          frequency,
          dayOfWeek: dayOfWeek || null,
          dayOfMonth: dayOfMonth || null,
          nextRun,
          items: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: parseFloat(item.quantity),
            })),
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  priceHT: true,
                  unit: true,
                },
              },
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        message: 'Commande récurrente créée avec succès',
        recurringOrder,
      });
    } catch (error) {
      logger.error('Erreur création commande récurrente:', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la commande récurrente',
      });
    }
  }
);

/**
 * PUT /api/recurring-orders/:id
 * Modifier une commande récurrente
 */
router.put('/:id', authenticate, requireClient, async (req, res) => {
  try {
    const { name, frequency, dayOfWeek, dayOfMonth, items, isActive } = req.body;
    
    const recurringOrder = await prisma.recurringOrder.findUnique({
      where: { id: req.params.id },
    });

    if (!recurringOrder) {
      return res.status(404).json({
        success: false,
        message: 'Commande récurrente non trouvée',
      });
    }

    // Vérifier les permissions
    if (recurringOrder.shopId !== req.user.shop?.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé',
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (frequency !== undefined) updateData.frequency = frequency;
    if (dayOfWeek !== undefined) updateData.dayOfWeek = dayOfWeek;
    if (dayOfMonth !== undefined) updateData.dayOfMonth = dayOfMonth;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Si items sont fournis, remplacer tous les items
    if (items && Array.isArray(items)) {
      await prisma.recurringItem.deleteMany({
        where: { recurringOrderId: recurringOrder.id },
      });
      
      updateData.items = {
        create: items.map(item => ({
          productId: item.productId,
          quantity: parseFloat(item.quantity),
        })),
      };
    }

    const updated = await prisma.recurringOrder.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                priceHT: true,
                unit: true,
              },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Commande récurrente modifiée avec succès',
      recurringOrder: updated,
    });
  } catch (error) {
    logger.error('Erreur modification commande récurrente:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification de la commande récurrente',
    });
  }
});

/**
 * DELETE /api/recurring-orders/:id
 * Supprimer une commande récurrente
 */
router.delete('/:id', authenticate, requireClient, async (req, res) => {
  try {
    const recurringOrder = await prisma.recurringOrder.findUnique({
      where: { id: req.params.id },
    });

    if (!recurringOrder) {
      return res.status(404).json({
        success: false,
        message: 'Commande récurrente non trouvée',
      });
    }

    // Vérifier les permissions
    if (recurringOrder.shopId !== req.user.shop?.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé',
      });
    }

    await prisma.recurringOrder.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      message: 'Commande récurrente supprimée',
    });
  } catch (error) {
    logger.error('Erreur suppression commande récurrente:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la commande récurrente',
    });
  }
});

/**
 * POST /api/recurring-orders/:id/run
 * Exécuter manuellement une commande récurrente
 */
router.post('/:id/run', authenticate, async (req, res) => {
  try {
    const recurringOrder = await prisma.recurringOrder.findUnique({
      where: { id: req.params.id },
      include: {
        shop: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!recurringOrder) {
      return res.status(404).json({
        success: false,
        message: 'Commande récurrente non trouvée',
      });
    }

    if (!recurringOrder.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cette commande récurrente n\'est pas active',
      });
    }

    // Créer une commande normale à partir de la commande récurrente
    const { calculateOrderItemTotals, calculateOrderTotals } = require('../utils/calculations');
    
    const orderItems = recurringOrder.items.map(item => {
      const totals = calculateOrderItemTotals(
        item.quantity,
        item.product.priceHT,
        item.product.tvaRate
      );
      return {
        productId: item.product.id,
        quantity: item.quantity,
        priceHT: item.product.priceHT,
        ...totals,
      };
    });

    const orderTotals = calculateOrderTotals(orderItems);

    const order = await prisma.order.create({
      data: {
        shopId: recurringOrder.shopId,
        status: 'NEW',
        ...orderTotals,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        shop: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
    });

    // Mettre à jour lastRun et nextRun
    const now = new Date();
    let nextRun = new Date(now);
    
    switch (recurringOrder.frequency) {
      case 'DAILY':
        nextRun.setDate(now.getDate() + 1);
        break;
      case 'WEEKLY':
        const daysUntil = ((recurringOrder.dayOfWeek || 0) - now.getDay() + 7) % 7 || 7;
        nextRun.setDate(now.getDate() + daysUntil);
        break;
      case 'MONTHLY':
        nextRun.setMonth(now.getMonth() + 1);
        if (recurringOrder.dayOfMonth) {
          nextRun.setDate(recurringOrder.dayOfMonth);
        }
        break;
    }

    await prisma.recurringOrder.update({
      where: { id: recurringOrder.id },
      data: {
        lastRun: now,
        nextRun,
      },
    });

    // Notifier les admins
    try {
      const notificationService = require('../utils/notificationService');
      await notificationService.notifyNewOrder(order);
    } catch (notifError) {
      logger.warn('Erreur création notification commande récurrente exécutée', {
        error: notifError.message,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Commande créée à partir de la commande récurrente',
      order,
    });
  } catch (error) {
    logger.error('Erreur exécution commande récurrente:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'exécution de la commande récurrente',
    });
  }
});

module.exports = router;
