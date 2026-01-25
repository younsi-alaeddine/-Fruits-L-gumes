const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');
const multer = require('multer');
const path = require('path');

// Configuration multer pour photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/returns/');
  },
  filename: (req, file, cb) => {
    cb(null, `return-${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Seules les images sont autorisées'));
  }
});

/**
 * Générer un numéro de retour unique
 */
const generateReturnNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `RET-${year}${month}-${random}`;
};

/**
 * GET /api/returns
 * Liste des retours
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (startDate && endDate) {
      where.requestedAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }
    
    const returns = await prisma.return.findMany({
      where,
      include: {
        order: {
          select: {
            orderNumber: true,
            shop: {
              select: {
                name: true
              }
            }
          }
        },
        items: true,
        creditNote: true
      },
      orderBy: { requestedAt: 'desc' }
    });

    res.json({
      success: true,
      returns
    });
  } catch (error) {
    logger.error('Erreur récupération retours:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * GET /api/returns/:id
 * Détails d'un retour
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const returnData = await prisma.return.findUnique({
      where: { id: req.params.id },
      include: {
        order: {
          include: {
            shop: true
          }
        },
        items: true,
        creditNote: true
      }
    });

    if (!returnData) {
      return res.status(404).json({
        success: false,
        message: 'Retour non trouvé'
      });
    }

    res.json({
      success: true,
      return: returnData
    });
  } catch (error) {
    logger.error('Erreur récupération retour:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * POST /api/returns
 * Créer un retour
 */
router.post('/', authenticate, upload.single('photo'), [
  body('orderId').notEmpty().withMessage('Order ID requis'),
  body('reason').notEmpty().withMessage('Raison requise'),
  body('items').isArray({ min: 1 }).withMessage('Au moins 1 produit requis'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { orderId, reason, description, items } = req.body;
    const photoUrl = req.file ? `/uploads/returns/${req.file.filename}` : null;

    // Vérifier que la commande existe
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    // Calculer le montant total
    const totalAmount = items.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity) * parseFloat(item.unitPrice));
    }, 0);

    // Créer le retour
    const returnData = await prisma.return.create({
      data: {
        returnNumber: generateReturnNumber(),
        orderId,
        status: 'PENDING',
        reason,
        description,
        totalAmount,
        photoUrl,
        requestedBy: req.user.id,
        items: {
          create: items.map(item => ({
            productId: item.productId,
            productName: item.productName,
            quantity: parseFloat(item.quantity),
            unitPrice: parseFloat(item.unitPrice),
            totalPrice: parseFloat(item.quantity) * parseFloat(item.unitPrice),
            reason: item.reason,
            notes: item.notes
          }))
        }
      },
      include: {
        items: true,
        order: {
          include: {
            shop: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Retour créé avec succès',
      return: returnData
    });
  } catch (error) {
    logger.error('Erreur création retour:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * PUT /api/returns/:id/approve
 * Approuver un retour
 */
router.put('/:id/approve', authenticate, requireAdmin, [
  body('refundMethod').isIn(['CREDIT_NOTE', 'REFUND', 'REPLACEMENT']).withMessage('Méthode invalide'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { refundMethod, notes } = req.body;
    
    const returnData = await prisma.return.findUnique({
      where: { id: req.params.id },
      include: { order: true }
    });

    if (!returnData) {
      return res.status(404).json({
        success: false,
        message: 'Retour non trouvé'
      });
    }

    // Si méthode = CREDIT_NOTE, créer un avoir automatiquement
    let creditNoteId = null;
    if (refundMethod === 'CREDIT_NOTE') {
      const creditNote = await prisma.creditNote.create({
        data: {
          creditNoteNumber: `AV-${Date.now()}`,
          originalInvoiceId: returnData.order.invoiceId || 'temp', // À ajuster
          amount: returnData.totalAmount,
          reason: `Retour produit - ${returnData.returnNumber}`,
          status: 'PENDING'
        }
      });
      creditNoteId = creditNote.id;
    }

    const updated = await prisma.return.update({
      where: { id: req.params.id },
      data: {
        status: 'APPROVED',
        refundMethod,
        creditNoteId,
        processedBy: req.user.id,
        processedAt: new Date(),
        notes
      },
      include: {
        items: true,
        order: true,
        creditNote: true
      }
    });

    res.json({
      success: true,
      message: 'Retour approuvé',
      return: updated
    });
  } catch (error) {
    logger.error('Erreur approbation retour:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * PUT /api/returns/:id/reject
 * Rejeter un retour
 */
router.put('/:id/reject', authenticate, requireAdmin, [
  body('reason').notEmpty().withMessage('Raison requise'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { reason } = req.body;

    const updated = await prisma.return.update({
      where: { id: req.params.id },
      data: {
        status: 'REJECTED',
        processedBy: req.user.id,
        processedAt: new Date(),
        notes: reason
      },
      include: {
        items: true,
        order: true
      }
    });

    res.json({
      success: true,
      message: 'Retour rejeté',
      return: updated
    });
  } catch (error) {
    logger.error('Erreur rejet retour:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * GET /api/returns/stats
 * Statistiques des retours
 */
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const returns = await prisma.return.findMany();

    const stats = {
      total: returns.length,
      pending: returns.filter(r => r.status === 'PENDING').length,
      approved: returns.filter(r => r.status === 'APPROVED').length,
      rejected: returns.filter(r => r.status === 'REJECTED').length,
      refunded: returns.filter(r => r.status === 'REFUNDED').length,
      totalAmount: returns.reduce((sum, r) => sum + r.totalAmount, 0),
      byReason: {}
    };

    // Grouper par raison
    returns.forEach(r => {
      if (!stats.byReason[r.reason]) {
        stats.byReason[r.reason] = 0;
      }
      stats.byReason[r.reason]++;
    });

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Erreur stats retours:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

module.exports = router;
