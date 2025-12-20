const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * GET /api/messages
 * Liste des messages (conversations)
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { type = 'received' } = req.query; // received, sent
    
    const where = type === 'sent' 
      ? { fromUserId: req.user.id }
      : { toUserId: req.user.id };

    const messages = await prisma.message.findMany({
      where,
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        toUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    logger.error('Erreur récupération messages:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des messages',
    });
  }
});

/**
 * GET /api/messages/unread-count
 * Nombre de messages non lus
 */
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const count = await prisma.message.count({
      where: {
        toUserId: req.user.id,
        read: false,
      },
    });

    res.json({
      success: true,
      count,
    });
  } catch (error) {
    logger.error('Erreur récupération nombre messages non lus:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du nombre de messages',
    });
  }
});

/**
 * POST /api/messages
 * Envoyer un message
 */
router.post(
  '/',
  authenticate,
  [
    body('toUserId').notEmpty().withMessage('Destinataire requis'),
    body('content').notEmpty().withMessage('Contenu requis'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { toUserId, subject, content, relatedTo } = req.body;

      // Vérifier que le destinataire existe
      const recipient = await prisma.user.findUnique({
        where: { id: toUserId },
      });

      if (!recipient) {
        return res.status(404).json({
          success: false,
          message: 'Destinataire non trouvé',
        });
      }

      const message = await prisma.message.create({
        data: {
          fromUserId: req.user.id,
          toUserId,
          subject: subject || null,
          content,
          relatedTo: relatedTo || null,
        },
        include: {
          fromUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          toUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        message: 'Message envoyé avec succès',
        message: message,
      });
    } catch (error) {
      logger.error('Erreur envoi message:', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'envoi du message',
      });
    }
  }
);

/**
 * PUT /api/messages/:id/read
 * Marquer un message comme lu
 */
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const message = await prisma.message.update({
      where: {
        id: req.params.id,
        toUserId: req.user.id, // S'assurer que le message appartient à l'utilisateur
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: message,
    });
  } catch (error) {
    logger.error('Erreur marquage message comme lu:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors du marquage du message',
    });
  }
});

module.exports = router;
