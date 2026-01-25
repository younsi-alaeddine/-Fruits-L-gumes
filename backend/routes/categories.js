const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');
const { logAction } = require('../utils/auditTrail');

/**
 * GET /api/categories
 * Liste toutes les catégories avec leurs sous-catégories
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      include: {
        subCategories: {
          where: {
            isActive: true,
            deletedAt: null,
          },
          include: {
            _count: {
              select: {
                products: {
                  where: { deletedAt: null }
                }
              }
            }
          },
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            products: {
              where: { deletedAt: null }
            },
            subCategories: {
              where: {
                isActive: true,
                deletedAt: null
              }
            }
          }
        }
      },
      orderBy: {
        order: 'asc',
      },
    });

    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    logger.error('Erreur récupération catégories:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des catégories',
    });
  }
});

/**
 * GET /api/categories/:id
 * Récupère une catégorie spécifique
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: {
        subCategories: {
          where: {
            isActive: true,
            deletedAt: null,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée',
      });
    }

    res.json({
      success: true,
      category,
    });
  } catch (error) {
    logger.error('Erreur récupération catégorie:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la catégorie',
    });
  }
});

/**
 * POST /api/categories
 * Créer une nouvelle catégorie (Admin seulement)
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('name').trim().notEmpty().withMessage('Le nom est requis'),
    body('icon').optional().trim(),
    body('color').optional().trim(),
    body('description').optional().trim(),
    body('order').optional().isInt().withMessage('L\'ordre doit être un nombre'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, icon, color, description, order } = req.body;

      // Vérifier si la catégorie existe déjà
      const existing = await prisma.category.findUnique({
        where: { name },
      });

      if (existing && !existing.deletedAt) {
        return res.status(400).json({
          success: false,
          message: 'Une catégorie avec ce nom existe déjà',
        });
      }

      // Si elle existe mais est supprimée, la restaurer
      if (existing && existing.deletedAt) {
        const updated = await prisma.category.update({
          where: { id: existing.id },
          data: {
            name,
            icon: icon || null,
            color: color || null,
            description: description || null,
            order: order || 0,
            isActive: true,
            deletedAt: null,
          },
        });

        await logAction('UPDATE', 'Category', updated.id, req.user.id, {
          action: 'restored',
          name: updated.name,
        }, req);

        return res.json({
          success: true,
          message: 'Catégorie restaurée avec succès',
          category: updated,
        });
      }

      const category = await prisma.category.create({
        data: {
          name,
          icon: icon || null,
          color: color || null,
          description: description || null,
          order: order || 0,
        },
      });

      await logAction('CREATE', 'Category', category.id, req.user.id, {
        name: category.name,
      }, req);

      res.status(201).json({
        success: true,
        message: 'Catégorie créée avec succès',
        category,
      });
    } catch (error) {
      logger.error('Erreur création catégorie:', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la catégorie',
      });
    }
  }
);

/**
 * PUT /api/categories/:id
 * Modifier une catégorie (Admin seulement)
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  [
    body('name').optional().trim().notEmpty().withMessage('Le nom ne peut pas être vide'),
    body('icon').optional().trim(),
    body('color').optional().trim(),
    body('description').optional().trim(),
    body('order').optional().isInt().withMessage('L\'ordre doit être un nombre'),
    body('isActive').optional().isBoolean().withMessage('isActive doit être un booléen'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const category = await prisma.category.findUnique({
        where: { id: req.params.id },
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Catégorie non trouvée',
        });
      }

      const { name, icon, color, description, order, isActive } = req.body;
      const updateData = {};

      if (name !== undefined) {
        // Vérifier si le nouveau nom n'est pas déjà utilisé
        if (name !== category.name) {
          const existing = await prisma.category.findUnique({
            where: { name },
          });
          if (existing && existing.id !== category.id) {
            return res.status(400).json({
              success: false,
              message: 'Une catégorie avec ce nom existe déjà',
            });
          }
        }
        updateData.name = name;
      }
      if (icon !== undefined) updateData.icon = icon;
      if (color !== undefined) updateData.color = color;
      if (description !== undefined) updateData.description = description;
      if (order !== undefined) updateData.order = order;
      if (isActive !== undefined) updateData.isActive = isActive;

      const updated = await prisma.category.update({
        where: { id: req.params.id },
        data: updateData,
      });

      await logAction('UPDATE', 'Category', updated.id, req.user.id, {
        changes: updateData,
      }, req);

      res.json({
        success: true,
        message: 'Catégorie modifiée avec succès',
        category: updated,
      });
    } catch (error) {
      logger.error('Erreur modification catégorie:', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la modification de la catégorie',
      });
    }
  }
);

/**
 * DELETE /api/categories/:id
 * Supprimer (soft delete) une catégorie (Admin seulement)
 */
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: {
        products: {
          where: {
            deletedAt: null,
          },
          take: 1,
        },
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée',
      });
    }

    // Vérifier s'il y a des produits utilisant cette catégorie
    if (category.products.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer une catégorie qui contient des produits. Veuillez d\'abord déplacer ou supprimer les produits.',
      });
    }

    // Soft delete
    await prisma.category.update({
      where: { id: req.params.id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    // Soft delete des sous-catégories aussi
    await prisma.subCategory.updateMany({
      where: { categoryId: req.params.id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    await logAction('DELETE', 'Category', category.id, req.user.id, {
      name: category.name,
    }, req);

    res.json({
      success: true,
      message: 'Catégorie supprimée avec succès',
    });
  } catch (error) {
    logger.error('Erreur suppression catégorie:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la catégorie',
    });
  }
});

// ==================== SOUS-CATÉGORIES ====================

/**
 * GET /api/categories/:categoryId/subcategories
 * Liste toutes les sous-catégories d'une catégorie
 */
router.get('/:categoryId/subcategories', authenticate, async (req, res) => {
  try {
    const subCategories = await prisma.subCategory.findMany({
      where: {
        categoryId: req.params.categoryId,
        isActive: true,
        deletedAt: null,
      },
      orderBy: {
        order: 'asc',
      },
    });

    res.json({
      success: true,
      subCategories,
    });
  } catch (error) {
    logger.error('Erreur récupération sous-catégories:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des sous-catégories',
    });
  }
});

/**
 * POST /api/categories/:categoryId/subcategories
 * Créer une nouvelle sous-catégorie (Admin seulement)
 */
router.post(
  '/:categoryId/subcategories',
  authenticate,
  requireAdmin,
  [
    body('name').trim().notEmpty().withMessage('Le nom est requis'),
    body('icon').optional().trim(),
    body('description').optional().trim(),
    body('order').optional().isInt().withMessage('L\'ordre doit être un nombre'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Vérifier que la catégorie parente existe
      const category = await prisma.category.findUnique({
        where: { id: req.params.categoryId },
      });

      if (!category || category.deletedAt) {
        return res.status(404).json({
          success: false,
          message: 'Catégorie parente non trouvée',
        });
      }

      const { name, icon, description, order } = req.body;

      // Vérifier si la sous-catégorie existe déjà pour cette catégorie
      const existing = await prisma.subCategory.findUnique({
        where: {
          categoryId_name: {
            categoryId: req.params.categoryId,
            name,
          },
        },
      });

      if (existing && !existing.deletedAt) {
        return res.status(400).json({
          success: false,
          message: 'Une sous-catégorie avec ce nom existe déjà dans cette catégorie',
        });
      }

      // Si elle existe mais est supprimée, la restaurer
      if (existing && existing.deletedAt) {
        const updated = await prisma.subCategory.update({
          where: { id: existing.id },
          data: {
            name,
            icon: icon || null,
            description: description || null,
            order: order || 0,
            isActive: true,
            deletedAt: null,
          },
        });

        await logAction('UPDATE', 'SubCategory', updated.id, req.user.id, {
          action: 'restored',
          name: updated.name,
          categoryId: req.params.categoryId,
        }, req);

        return res.json({
          success: true,
          message: 'Sous-catégorie restaurée avec succès',
          subCategory: updated,
        });
      }

      const subCategory = await prisma.subCategory.create({
        data: {
          name,
          icon: icon || null,
          description: description || null,
          order: order || 0,
          categoryId: req.params.categoryId,
        },
      });

      await logAction('CREATE', 'SubCategory', subCategory.id, req.user.id, {
        name: subCategory.name,
        categoryId: req.params.categoryId,
      }, req);

      res.status(201).json({
        success: true,
        message: 'Sous-catégorie créée avec succès',
        subCategory,
      });
    } catch (error) {
      logger.error('Erreur création sous-catégorie:', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la sous-catégorie',
      });
    }
  }
);

/**
 * PUT /api/categories/subcategories/:id
 * Modifier une sous-catégorie (Admin seulement)
 */
router.put(
  '/subcategories/:id',
  authenticate,
  requireAdmin,
  [
    body('name').optional().trim().notEmpty().withMessage('Le nom ne peut pas être vide'),
    body('icon').optional().trim(),
    body('description').optional().trim(),
    body('order').optional().isInt().withMessage('L\'ordre doit être un nombre'),
    body('isActive').optional().isBoolean().withMessage('isActive doit être un booléen'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const subCategory = await prisma.subCategory.findUnique({
        where: { id: req.params.id },
      });

      if (!subCategory) {
        return res.status(404).json({
          success: false,
          message: 'Sous-catégorie non trouvée',
        });
      }

      const { name, icon, description, order, isActive } = req.body;
      const updateData = {};

      if (name !== undefined) {
        // Vérifier si le nouveau nom n'est pas déjà utilisé dans la même catégorie
        if (name !== subCategory.name) {
          const existing = await prisma.subCategory.findUnique({
            where: {
              categoryId_name: {
                categoryId: subCategory.categoryId,
                name,
              },
            },
          });
          if (existing && existing.id !== subCategory.id) {
            return res.status(400).json({
              success: false,
              message: 'Une sous-catégorie avec ce nom existe déjà dans cette catégorie',
            });
          }
        }
        updateData.name = name;
      }
      if (icon !== undefined) updateData.icon = icon;
      if (description !== undefined) updateData.description = description;
      if (order !== undefined) updateData.order = order;
      if (isActive !== undefined) updateData.isActive = isActive;

      const updated = await prisma.subCategory.update({
        where: { id: req.params.id },
        data: updateData,
      });

      await logAction('UPDATE', 'SubCategory', updated.id, req.user.id, {
        changes: updateData,
      }, req);

      res.json({
        success: true,
        message: 'Sous-catégorie modifiée avec succès',
        subCategory: updated,
      });
    } catch (error) {
      logger.error('Erreur modification sous-catégorie:', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la modification de la sous-catégorie',
      });
    }
  }
);

/**
 * DELETE /api/categories/subcategories/:id
 * Supprimer (soft delete) une sous-catégorie (Admin seulement)
 */
router.delete('/subcategories/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const subCategory = await prisma.subCategory.findUnique({
      where: { id: req.params.id },
      include: {
        products: {
          where: {
            deletedAt: null,
          },
          take: 1,
        },
      },
    });

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: 'Sous-catégorie non trouvée',
      });
    }

    // Vérifier s'il y a des produits utilisant cette sous-catégorie
    if (subCategory.products.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer une sous-catégorie qui contient des produits. Veuillez d\'abord déplacer ou supprimer les produits.',
      });
    }

    // Soft delete
    await prisma.subCategory.update({
      where: { id: req.params.id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    await logAction('DELETE', 'SubCategory', subCategory.id, req.user.id, {
      name: subCategory.name,
      categoryId: subCategory.categoryId,
    }, req);

    res.json({
      success: true,
      message: 'Sous-catégorie supprimée avec succès',
    });
  } catch (error) {
    logger.error('Erreur suppression sous-catégorie:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la sous-catégorie',
    });
  }
});

module.exports = router;
