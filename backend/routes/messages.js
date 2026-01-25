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
    // SECURITY: Validate UUID format to prevent injection attacks
    // RISK: Invalid UUID format could cause database errors or expose information
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de message invalide'
      });
    }

    // SECURITY: Ownership check - verify message exists and belongs to user before updating
    // RISK: Without prior check, update could fail silently or expose information
    const messageExists = await prisma.message.findUnique({
      where: { id: req.params.id }
    });

    if (!messageExists) {
      return res.status(404).json({
        success: false,
        message: 'Message non trouvé'
      });
    }

    // SECURITY: Ownership check - users can only mark their own received messages as read
    // RISK: Without this check, users could mark any message as read (IDOR)
    if (messageExists.toUserId !== req.user.id) {
      logger.warn('Tentative de modification de message non autorisée', {
        userId: req.user.id,
        messageId: req.params.id,
        messageToUserId: messageExists.toUserId
      });
      return res.status(403).json({
        success: false,
        message: 'Accès refusé'
      });
    }

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
