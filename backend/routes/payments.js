const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const logger = require('../utils/logger');
const { appInfo } = require('../config/appInfo');

/**
 * Générer un numéro de reçu unique
 */
const generateReceiptNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `REC-${year}${month}-${random}`;
};

/**
 * Générer le PDF du reçu de paiement
 */
const generatePaymentReceiptPDF = async (payment, order, shop) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // En-tête
      doc.fontSize(20).text('REÇU DE PAIEMENT', { align: 'center' });
      doc.moveDown();
      
      // Informations entreprise
      // Phase 2: make document header configurable (deploy-safe)
      doc.fontSize(12).text(appInfo.companyName, { align: 'left' });
      doc.fontSize(10).text(appInfo.companyAddressLine1, { align: 'left' });
      doc.fontSize(10).text(appInfo.companyAddressLine2, { align: 'left' });
      doc.moveDown();

      // Numéro de reçu et date
      doc.fontSize(10);
      doc.text(`Numéro: ${payment.receiptNumber || payment.id.substring(0, 8)}`, { align: 'right' });
      doc.text(`Date: ${payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('fr-FR') : new Date(payment.createdAt).toLocaleDateString('fr-FR')}`, { align: 'right' });
      doc.moveDown(2);

      // Informations client
      doc.fontSize(12).text('Reçu de:', { underline: true });
      doc.fontSize(10);
      doc.text(shop.name);
      doc.text(shop.address);
      doc.text(`${shop.postalCode} ${shop.city}`);
      if (shop.phone) {
        doc.text(`Tél: ${shop.phone}`);
      }
      doc.moveDown(2);

      // Détails du paiement
      doc.fontSize(12).text('Détails du paiement:', { underline: true });
      doc.moveDown(0.5);
      
      doc.fontSize(10);
      doc.text(`Commande: ${order.orderNumber || order.id.substring(0, 8)}`, 50, doc.y);
      doc.moveDown();
      doc.text(`Montant: ${payment.amount.toFixed(2)} €`, 50, doc.y);
      doc.moveDown();
      doc.text(`Méthode: ${payment.paymentMethod || 'Non spécifiée'}`, 50, doc.y);
      doc.moveDown();
      doc.text(`Statut: ${payment.status}`, 50, doc.y);
      doc.moveDown(2);
      
      // Notes
      if (payment.notes) {
        doc.fontSize(10).text('Notes:', { underline: true });
        doc.text(payment.notes);
        doc.moveDown();
      }
      
      // Total en gras
      doc.fontSize(14).font('Helvetica-Bold');
      doc.text(`Total payé: ${payment.amount.toFixed(2)} €`, 50, doc.y);
      doc.moveDown(2);
      
      doc.fontSize(10).font('Helvetica');
      doc.text('Merci pour votre paiement.', { align: 'center' });
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Toutes les routes nécessitent l'authentification
router.use(authenticate);

/**
 * GET /api/payments/:id/download-receipt
 * Télécharger le PDF du reçu de paiement (accessible aux clients et admins)
 */
router.get('/:id/download-receipt', async (req, res) => {
  try {
    // SECURITY: Validate UUID format to prevent injection attacks
    // RISK: Invalid UUID format could cause database errors or expose information
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de paiement invalide'
      });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: {
        order: {
          include: {
            shop: true,
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Paiement non trouvé',
      });
    }

    // Vérifier les permissions
    // Les admins ont accès à tous les reçus
    if (!req.user || req.user.role !== 'ADMIN') {
      // Pour les clients, vérifier que le paiement appartient à leur magasin
      if (req.user && req.user.role === 'CLIENT') {
        const accessibleShopIds = (req.context?.accessibleShops || []).map(s => s.id);
        // Vérifier que l'utilisateur a au moins un magasin associé
        if (accessibleShopIds.length === 0) {
          logger.warn('Client sans magasin tente de télécharger un reçu', {
            userId: req.user.id,
            paymentId: req.params.id,
          });
          return res.status(403).json({
            success: false,
            message: 'Accès refusé - Aucun magasin associé',
          });
        }
        
        // Vérifier que le paiement appartient au magasin du client
        if (!accessibleShopIds.includes(payment.order.shopId)) {
          logger.warn('Client tente de télécharger un reçu d\'un autre magasin', {
            userId: req.user.id,
            clientShopIds: accessibleShopIds,
            paymentShopId: payment.order.shopId,
            paymentId: req.params.id,
          });
          return res.status(403).json({
            success: false,
            message: 'Accès refusé - Ce paiement ne vous appartient pas',
          });
        }
      } else {
        // Autres rôles non autorisés
        return res.status(403).json({
          success: false,
          message: 'Accès refusé - Permissions insuffisantes',
        });
      }
    }

    // Générer le numéro de reçu s'il n'existe pas
    if (!payment.receiptNumber) {
      let receiptNumber = generateReceiptNumber();
      let exists = await prisma.payment.findUnique({ where: { receiptNumber } });
      while (exists) {
        receiptNumber = generateReceiptNumber();
        exists = await prisma.payment.findUnique({ where: { receiptNumber } });
      }
      
      await prisma.payment.update({
        where: { id: payment.id },
        data: { receiptNumber },
      });
      payment.receiptNumber = receiptNumber;
    }

    const pdfBuffer = await generatePaymentReceiptPDF(payment, payment.order, payment.order.shop);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="recu-paiement-${payment.receiptNumber || payment.id.substring(0, 8)}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    logger.error('Erreur génération PDF reçu de paiement:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du PDF',
    });
  }
});

// Les routes suivantes nécessitent ADMIN
router.use(requireAdmin);

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Liste des paiements avec filtres
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: orderId
 *         schema:
 *           type: string
 *         description: Filtrer par ID de commande
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [EN_ATTENTE, PAYE, IMPAYE, REMBOURSE]
 *         description: Filtrer par statut
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de début
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de fin
 *     responses:
 *       200:
 *         description: Liste des paiements récupérée avec succès
 *       403:
 *         description: Accès refusé - Admin requis
 */
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { orderId, status, startDate, endDate } = req.query;
    const where = {};

    if (orderId) where.orderId = orderId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) {
        where.paymentDate.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.paymentDate.lte = end;
      }
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        order: {
          include: {
            shop: {
              select: {
                id: true,
                name: true,
                city: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ payments });
  } catch (error) {
    // SECURITY: Use logger instead of console.error to prevent sensitive data exposure
    // RISK: console.error may expose stack traces and sensitive data in production logs
    logger.error('Erreur récupération paiements', { 
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
 * /api/payments:
 *   post:
 *     summary: Créer un nouveau paiement
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - amount
 *             properties:
 *               orderId:
 *                 type: string
 *               amount:
 *                 type: number
 *                 minimum: 0
 *               paymentMethod:
 *                 type: string
 *                 enum: [CASH, CARD, TRANSFER, CHECK]
 *               paymentDate:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [EN_ATTENTE, PAYE, IMPAYE, REMBOURSE]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Paiement créé avec succès
 *       400:
 *         description: Erreur de validation
 *       404:
 *         description: Commande non trouvée
 *       403:
 *         description: Accès refusé - Admin requis
 */
router.post(
  '/',
  [
    body('orderId').notEmpty().withMessage('ID de commande requis'),
    body('amount').isFloat({ min: 0 }).withMessage('Montant invalide'),
    body('paymentMethod').optional().isIn(['CASH', 'CARD', 'TRANSFER', 'CHECK']),
    body('paymentDate').optional().isISO8601(),
    body('status').optional().isIn(['EN_ATTENTE', 'PAYE', 'IMPAYE', 'REMBOURSE']),
    body('notes').optional(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { orderId, amount, paymentMethod, paymentDate, status, notes } = req.body;

      // Vérifier que la commande existe
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          payments: true
        }
      });

      if (!order) {
        return res.status(404).json({ message: 'Commande non trouvée' });
      }

      // Calculer le total déjà payé
      const totalPaid = order.payments
        .filter(p => p.status === 'PAYE')
        .reduce((sum, p) => sum + p.amount, 0);

      // Créer le paiement
      const payment = await prisma.payment.create({
        data: {
          orderId,
          amount: parseFloat(amount),
          paymentMethod: paymentMethod || null,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          status: status || 'EN_ATTENTE',
          notes: notes || null
        },
        include: {
          order: {
            include: {
              shop: {
                select: {
                  id: true,
                  name: true,
                  city: true
                }
              }
            }
          }
        }
      });

      // Mettre à jour le statut de paiement de la commande
      const newTotalPaid = totalPaid + parseFloat(amount);
      let newPaymentStatus = 'EN_ATTENTE';
      
      if (status === 'PAYE') {
        if (newTotalPaid >= order.totalTTC) {
          newPaymentStatus = 'PAYE';
        } else if (newTotalPaid > 0) {
          newPaymentStatus = 'EN_ATTENTE';
        }
      } else if (status === 'IMPAYE') {
        newPaymentStatus = 'IMPAYE';
      }

      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: newPaymentStatus }
      });

      res.status(201).json({
        message: 'Paiement créé avec succès',
        payment
      });
    } catch (error) {
      // SECURITY: Use logger instead of console.error to prevent sensitive data exposure
      logger.error('Erreur création paiement', { 
        error: error.message,
        userId: req.user?.id,
        orderId: req.body?.orderId 
      });
      res.status(500).json({ 
        success: false,
        message: 'Erreur serveur' 
      });
    }
  }
);

/**
 * PUT /api/payments/:id
 * Modifier un paiement
 */
router.put(
  '/:id',
  requireAdmin,
  [
    body('amount').optional().isFloat({ min: 0 }),
    body('paymentMethod').optional().isIn(['CASH', 'CARD', 'TRANSFER', 'CHECK']),
    body('paymentDate').optional().isISO8601(),
    body('status').optional().isIn(['EN_ATTENTE', 'PAYE', 'IMPAYE', 'REMBOURSE']),
    body('notes').optional(),
  ],
  async (req, res) => {
    try {
      // SECURITY: Validate UUID format to prevent injection attacks
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(req.params.id)) {
        return res.status(400).json({ 
          success: false,
          message: 'ID de paiement invalide' 
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }

      const { amount, paymentMethod, paymentDate, status, notes } = req.body;

      const payment = await prisma.payment.findUnique({
        where: { id: req.params.id },
        include: {
          order: {
            include: {
              payments: true
            }
          }
        }
      });

      if (!payment) {
        return res.status(404).json({ 
          success: false,
          message: 'Paiement non trouvé' 
        });
      }

      const updateData = {};
      if (amount !== undefined) updateData.amount = parseFloat(amount);
      if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
      if (paymentDate !== undefined) updateData.paymentDate = new Date(paymentDate);
      if (status !== undefined) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;

      const updatedPayment = await prisma.payment.update({
        where: { id: req.params.id },
        data: updateData,
        include: {
          order: {
            include: {
              shop: {
                select: {
                  id: true,
                  name: true,
                  city: true
                }
              }
            }
          }
        }
      });

      // Mettre à jour le statut de paiement de la commande
      const order = updatedPayment.order;
      const totalPaid = order.payments
        .filter(p => p.status === 'PAYE')
        .reduce((sum, p) => sum + p.amount, 0);

      let newPaymentStatus = 'EN_ATTENTE';
      if (totalPaid >= order.totalTTC) {
        newPaymentStatus = 'PAYE';
      } else if (totalPaid > 0) {
        newPaymentStatus = 'EN_ATTENTE';
      } else {
        newPaymentStatus = 'IMPAYE';
      }

      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: newPaymentStatus }
      });

      res.json({
        success: true,
        message: 'Paiement modifié avec succès',
        payment: updatedPayment
      });
    } catch (error) {
      // SECURITY: Use logger instead of console.error to prevent sensitive data exposure
      logger.error('Erreur modification paiement', { 
        error: error.message,
        userId: req.user?.id,
        paymentId: req.params.id 
      });
      res.status(500).json({ 
        success: false,
        message: 'Erreur serveur' 
      });
    }
  }
);

/**
 * DELETE /api/payments/:id
 * Supprimer un paiement
 */
router.delete('/:id', async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: {
        order: {
          include: {
            payments: true
          }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({ message: 'Paiement non trouvé' });
    }

    await prisma.payment.delete({
      where: { id: req.params.id }
    });

    // Mettre à jour le statut de paiement de la commande
    const order = payment.order;
    const totalPaid = order.payments
      .filter(p => p.id !== payment.id && p.status === 'PAYE')
      .reduce((sum, p) => sum + p.amount, 0);

    let newPaymentStatus = 'EN_ATTENTE';
    if (totalPaid >= order.totalTTC) {
      newPaymentStatus = 'PAYE';
    } else if (totalPaid > 0) {
      newPaymentStatus = 'EN_ATTENTE';
    } else {
      newPaymentStatus = 'IMPAYE';
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: newPaymentStatus }
    });

    res.json({ 
      success: true,
      message: 'Paiement supprimé avec succès' 
    });
  } catch (error) {
    // SECURITY: Use logger instead of console.error to prevent sensitive data exposure
    logger.error('Erreur suppression paiement', { 
      error: error.message,
      userId: req.user?.id,
      paymentId: req.params.id 
    });
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur' 
    });
  }
});

/**
 * GET /api/payments/order/:orderId
 * Paiements d'une commande spécifique
 */
router.get('/order/:orderId', requireAdmin, async (req, res) => {
  try {
    // SECURITY: Validate UUID format to prevent injection attacks
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(req.params.orderId)) {
      return res.status(400).json({ 
        success: false,
        message: 'ID de commande invalide' 
      });
    }

    const payments = await prisma.payment.findMany({
      where: { orderId: req.params.orderId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ 
      success: true,
      payments 
    });
  } catch (error) {
    // SECURITY: Use logger instead of console.error to prevent sensitive data exposure
    logger.error('Erreur récupération paiements commande', { 
      error: error.message,
      userId: req.user?.id,
      orderId: req.params.orderId 
    });
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur' 
    });
  }
});

/**
 * GET /api/payments/stats
 * Statistiques des paiements
 */
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {};
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.paymentDate.lte = end;
      }
    }

    const payments = await prisma.payment.findMany({ where });
    
    const stats = {
      total: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      paid: payments.filter(p => p.status === 'PAYE').length,
      pending: payments.filter(p => p.status === 'EN_ATTENTE').length,
      unpaid: payments.filter(p => p.status === 'IMPAYE').length,
      byMethod: {},
      byStatus: {}
    };

    payments.forEach(p => {
      stats.byMethod[p.paymentMethod] = (stats.byMethod[p.paymentMethod] || 0) + p.amount;
      stats.byStatus[p.status] = (stats.byStatus[p.status] || 0) + 1;
    });

    res.json({ success: true, stats });
  } catch (error) {
    logger.error('Erreur stats paiements', { error: error.message });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * GET /api/payments/schedule
 * Échéancier des paiements (paiements à venir)
 */
router.get('/schedule', requireAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(days));

    // Paiements en attente avec date prévue
    const scheduledPayments = await prisma.payment.findMany({
      where: {
        status: 'EN_ATTENTE',
        paymentDate: {
          lte: futureDate
        }
      },
      include: {
        order: {
          include: {
            shop: {
              select: {
                id: true,
                name: true,
                city: true
              }
            }
          }
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true
          }
        }
      },
      orderBy: { paymentDate: 'asc' }
    });

    // Commandes avec paiements impayés
    const unpaidOrders = await prisma.order.findMany({
      where: {
        paymentStatus: { in: ['EN_ATTENTE', 'IMPAYE'] },
        deliveryDate: {
          lte: futureDate
        }
      },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            city: true
          }
        },
        payments: {
          where: { status: 'PAYE' }
        }
      },
      orderBy: { deliveryDate: 'asc' }
    });

    const schedule = unpaidOrders.map(order => {
      const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0);
      const remaining = order.totalTTC - totalPaid;
      
      return {
        type: 'ORDER',
        id: order.id,
        reference: order.orderNumber,
        client: order.shop.name,
        amount: remaining,
        dueDate: order.deliveryDate,
        daysOverdue: order.deliveryDate ? Math.floor((new Date() - new Date(order.deliveryDate)) / (1000 * 60 * 60 * 24)) : 0,
        status: order.paymentStatus
      };
    });

    scheduledPayments.forEach(payment => {
      schedule.push({
        type: 'PAYMENT',
        id: payment.id,
        reference: payment.receiptNumber || payment.id.substring(0, 8),
        client: payment.order?.shop?.name || payment.invoice?.invoiceNumber || 'N/A',
        amount: payment.amount,
        dueDate: payment.paymentDate,
        daysOverdue: payment.paymentDate ? Math.floor((new Date() - new Date(payment.paymentDate)) / (1000 * 60 * 60 * 24)) : 0,
        status: payment.status
      });
    });

    schedule.sort((a, b) => {
      const dateA = a.dueDate ? new Date(a.dueDate) : new Date(0);
      const dateB = b.dueDate ? new Date(b.dueDate) : new Date(0);
      return dateA - dateB;
    });

    res.json({ success: true, schedule });
  } catch (error) {
    logger.error('Erreur échéancier paiements', { error: error.message });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * GET /api/payments/overdue
 * Paiements en retard (recouvrement)
 */
router.get('/overdue', requireAdmin, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Commandes impayées avec date de livraison passée
    const overdueOrders = await prisma.order.findMany({
      where: {
        paymentStatus: { in: ['EN_ATTENTE', 'IMPAYE'] },
        deliveryDate: {
          lt: today
        }
      },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            city: true,
            phone: true,
            email: true
          }
        },
        payments: {
          where: { status: 'PAYE' }
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true
          }
        }
      },
      orderBy: { deliveryDate: 'asc' }
    });

    const overdue = overdueOrders.map(order => {
      const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0);
      const remaining = order.totalTTC - totalPaid;
      const daysOverdue = order.deliveryDate ? Math.floor((today - new Date(order.deliveryDate)) / (1000 * 60 * 60 * 24)) : 0;

      return {
        id: order.id,
        type: 'ORDER',
        reference: order.orderNumber || order.id.substring(0, 8),
        invoiceNumber: order.invoice?.invoiceNumber,
        client: {
          id: order.shop.id,
          name: order.shop.name,
          city: order.shop.city,
          phone: order.shop.phone,
          email: order.shop.email
        },
        amount: order.totalTTC,
        paid: totalPaid,
        remaining,
        dueDate: order.deliveryDate,
        daysOverdue,
        status: order.paymentStatus,
        createdAt: order.createdAt
      };
    });

    // Paiements en attente avec date passée
    const overduePayments = await prisma.payment.findMany({
      where: {
        status: 'EN_ATTENTE',
        paymentDate: {
          lt: today
        }
      },
      include: {
        order: {
          include: {
            shop: {
              select: {
                id: true,
                name: true,
                city: true,
                phone: true,
                email: true
              }
            }
          }
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true
          }
        }
      }
    });

    overduePayments.forEach(payment => {
      const daysOverdue = payment.paymentDate ? Math.floor((today - new Date(payment.paymentDate)) / (1000 * 60 * 60 * 24)) : 0;
      
      overdue.push({
        id: payment.id,
        type: 'PAYMENT',
        reference: payment.receiptNumber || payment.id.substring(0, 8),
        invoiceNumber: payment.invoice?.invoiceNumber,
        client: {
          id: payment.order?.shop?.id,
          name: payment.order?.shop?.name || 'N/A',
          city: payment.order?.shop?.city,
          phone: payment.order?.shop?.phone,
          email: payment.order?.shop?.email
        },
        amount: payment.amount,
        paid: 0,
        remaining: payment.amount,
        dueDate: payment.paymentDate,
        daysOverdue,
        status: payment.status,
        createdAt: payment.createdAt
      });
    });

    overdue.sort((a, b) => b.daysOverdue - a.daysOverdue);

    const totalOverdue = overdue.reduce((sum, item) => sum + item.remaining, 0);

    res.json({
      success: true,
      overdue,
      totalOverdue,
      count: overdue.length
    });
  } catch (error) {
    logger.error('Erreur recouvrement', { error: error.message });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * POST /api/payments/:id/mark-paid
 * Marquer un paiement comme payé
 */
router.post('/:id/mark-paid', requireAdmin, async (req, res) => {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(req.params.id)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: {
        order: {
          include: { payments: true }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Paiement non trouvé' });
    }

    const updated = await prisma.payment.update({
      where: { id: req.params.id },
      data: {
        status: 'PAYE',
        paymentDate: new Date()
      },
      include: {
        order: {
          include: {
            shop: true
          }
        }
      }
    });

    // Mettre à jour le statut de la commande
    if (updated.order) {
      const totalPaid = updated.order.payments
        .filter(p => p.id === payment.id ? true : p.status === 'PAYE')
        .reduce((sum, p) => sum + p.amount, 0);

      let newPaymentStatus = 'EN_ATTENTE';
      if (totalPaid >= updated.order.totalTTC) {
        newPaymentStatus = 'PAYE';
      } else if (totalPaid > 0) {
        newPaymentStatus = 'EN_ATTENTE';
      }

      await prisma.order.update({
        where: { id: updated.order.id },
        data: { paymentStatus: newPaymentStatus }
      });
    }

    res.json({
      success: true,
      message: 'Paiement marqué comme payé',
      payment: updated
    });
  } catch (error) {
    logger.error('Erreur marquer payé', { error: error.message });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;

