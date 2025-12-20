const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * GET /api/promotions
 * Liste des promotions
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { isActive } = req.query;
    
    const where = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
      // Ajouter vérification de validité si isActive est true
      if (isActive === 'true') {
        const now = new Date();
        where.validFrom = { lte: now };
        where.validTo = { gte: now };
      }
    }

    const promotions = await prisma.promotion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      promotions,
    });
  } catch (error) {
    logger.error('Erreur récupération promotions:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des promotions',
    });
  }
});

/**
 * GET /api/promotions/:code/validate
 * Valider un code promo
 */
router.get('/:code/validate', authenticate, async (req, res) => {
  try {
    const { code } = req.params;
    const { amount } = req.query; // Montant total de la commande

    const promotion = await prisma.promotion.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Code promo invalide',
      });
    }

    const now = new Date();
    
    // Vérifier si la promotion est active
    if (!promotion.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cette promotion n\'est plus active',
      });
    }

    // Vérifier les dates de validité
    if (now < promotion.validFrom || now > promotion.validTo) {
      return res.status(400).json({
        success: false,
        message: 'Cette promotion n\'est plus valide',
      });
    }

    // Vérifier la limite d'utilisation
    if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
      return res.status(400).json({
        success: false,
        message: 'Cette promotion a atteint sa limite d\'utilisation',
      });
    }

    // Vérifier le montant minimum
    const orderAmount = parseFloat(amount || 0);
    if (promotion.minAmount && orderAmount < promotion.minAmount) {
      return res.status(400).json({
        success: false,
        message: `Montant minimum requis: ${promotion.minAmount} €`,
      });
    }

    // Calculer la remise
    let discount = 0;
    if (promotion.type === 'PERCENTAGE') {
      discount = (orderAmount * promotion.value) / 100;
      if (promotion.maxDiscount) {
        discount = Math.min(discount, promotion.maxDiscount);
      }
    } else if (promotion.type === 'FIXED_AMOUNT') {
      discount = promotion.value;
    }

    res.json({
      success: true,
      promotion: {
        id: promotion.id,
        code: promotion.code,
        name: promotion.name,
        type: promotion.type,
        value: promotion.value,
        discount: discount.toFixed(2),
      },
    });
  } catch (error) {
    logger.error('Erreur validation code promo:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation du code promo',
    });
  }
});

/**
 * POST /api/promotions
 * Créer une promotion
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('code').notEmpty().withMessage('Code requis').isUppercase(),
    body('name').notEmpty().withMessage('Nom requis'),
    body('type').isIn(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING']).withMessage('Type invalide'),
    body('value').isFloat({ min: 0 }).withMessage('Valeur invalide'),
    body('validFrom').isISO8601().withMessage('Date de début invalide'),
    body('validTo').isISO8601().withMessage('Date de fin invalide'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        code,
        name,
        description,
        type,
        value,
        minAmount,
        maxDiscount,
        validFrom,
        validTo,
        usageLimit,
        appliesTo,
        productIds,
      } = req.body;

      // Vérifier que le code n'existe pas déjà
      const existing = await prisma.promotion.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Ce code promo existe déjà',
        });
      }

      const promotion = await prisma.promotion.create({
        data: {
          code: code.toUpperCase(),
          name,
          description,
          type,
          value: parseFloat(value),
          minAmount: minAmount ? parseFloat(minAmount) : null,
          maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
          validFrom: new Date(validFrom),
          validTo: new Date(validTo),
          usageLimit: usageLimit ? parseInt(usageLimit) : null,
          appliesTo: appliesTo || 'ENTIRE_ORDER',
          productIds: productIds || [],
        },
      });

      res.status(201).json({
        success: true,
        message: 'Promotion créée avec succès',
        promotion,
      });
    } catch (error) {
      logger.error('Erreur création promotion:', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la promotion',
      });
    }
  }
);

/**
 * PUT /api/promotions/:id
 * Modifier une promotion
 */
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      value,
      minAmount,
      maxDiscount,
      validFrom,
      validTo,
      usageLimit,
      isActive,
      appliesTo,
      productIds,
    } = req.body;

    const promotion = await prisma.promotion.findUnique({
      where: { id: req.params.id },
    });

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion non trouvée',
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (value !== undefined) updateData.value = parseFloat(value);
    if (minAmount !== undefined) updateData.minAmount = minAmount ? parseFloat(minAmount) : null;
    if (maxDiscount !== undefined) updateData.maxDiscount = maxDiscount ? parseFloat(maxDiscount) : null;
    if (validFrom !== undefined) updateData.validFrom = new Date(validFrom);
    if (validTo !== undefined) updateData.validTo = new Date(validTo);
    if (usageLimit !== undefined) updateData.usageLimit = usageLimit ? parseInt(usageLimit) : null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (appliesTo !== undefined) updateData.appliesTo = appliesTo;
    if (productIds !== undefined) updateData.productIds = productIds;

    const updated = await prisma.promotion.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json({
      success: true,
      message: 'Promotion modifiée avec succès',
      promotion: updated,
    });
  } catch (error) {
    logger.error('Erreur modification promotion:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification de la promotion',
    });
  }
});

/**
 * DELETE /api/promotions/:id
 * Supprimer une promotion
 */
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.promotion.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      message: 'Promotion supprimée',
    });
  } catch (error) {
    logger.error('Erreur suppression promotion:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la promotion',
    });
  }
});

module.exports = router;
