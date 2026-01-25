const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * GET /api/notifications
 * Liste des notifications de l'utilisateur
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, read, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      userId: req.user.id,
    };

    if (read !== undefined) {
      where.read = read === 'true';
    }

    if (type) {
      where.type = type;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.notification.count({ where }),
    ]);

    res.json({
      success: true,
      notifications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error('Erreur récupération notifications:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des notifications',
    });
  }
});

/**
 * GET /api/notifications/unread-count
 * Nombre de notifications non lues
 */
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const count = await prisma.notification.count({
      where: {
        userId: req.user.id,
        read: false,
      },
    });

    res.json({
      success: true,
      count,
    });
  } catch (error) {
    logger.error('Erreur récupération nombre non lus:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du nombre de notifications',
    });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Marquer une notification comme lue
 */
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    // Prisma `update` ne supporte que des champs uniques dans `where`.
    // On vérifie d'abord la propriété (anti-IDOR), puis on met à jour par `id`.
    const existing = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée',
      });
    }

    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true, readAt: new Date() },
    });

    res.json({
      success: true,
      notification,
    });
  } catch (error) {
    logger.error('Erreur marquage notification comme lue:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors du marquage de la notification',
    });
  }
});

/**
 * PUT /api/notifications/read-all
 * Marquer toutes les notifications comme lues
 */
router.put('/read-all', authenticate, async (req, res) => {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    res.json({
      success: true,
      count: result.count,
    });
  } catch (error) {
    logger.error('Erreur marquage toutes notifications comme lues:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors du marquage des notifications',
    });
  }
});

/**
 * DELETE /api/notifications/:id
 * Supprimer une notification
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // Prisma `delete` ne supporte que des champs uniques dans `where`.
    const existing = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      select: { id: true },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée',
      });
    }

    await prisma.notification.delete({ where: { id: req.params.id } });

    res.json({
      success: true,
      message: 'Notification supprimée',
    });
  } catch (error) {
    logger.error('Erreur suppression notification:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la notification',
    });
  }
});

module.exports = router;
