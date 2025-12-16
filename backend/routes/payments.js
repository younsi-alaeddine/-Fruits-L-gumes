const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Toutes les routes nécessitent l'authentification et le rôle ADMIN
router.use(authenticate);
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
router.get('/', async (req, res) => {
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
    console.error('Erreur récupération paiements:', error);
    res.status(500).json({ message: 'Erreur serveur' });
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
      console.error('Erreur création paiement:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
);

/**
 * PUT /api/payments/:id
 * Modifier un paiement
 */
router.put(
  '/:id',
  [
    body('amount').optional().isFloat({ min: 0 }),
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
        return res.status(404).json({ message: 'Paiement non trouvé' });
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
        message: 'Paiement modifié avec succès',
        payment: updatedPayment
      });
    } catch (error) {
      console.error('Erreur modification paiement:', error);
      res.status(500).json({ message: 'Erreur serveur' });
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

    res.json({ message: 'Paiement supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression paiement:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * GET /api/payments/order/:orderId
 * Paiements d'une commande spécifique
 */
router.get('/order/:orderId', async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { orderId: req.params.orderId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ payments });
  } catch (error) {
    console.error('Erreur récupération paiements commande:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;

