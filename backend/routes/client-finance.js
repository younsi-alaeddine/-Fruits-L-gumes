const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate, requireClient } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * GET /api/client/finance/summary
 * Résumé financier du client (solde, factures, paiements)
 */
router.get('/summary', authenticate, requireClient, async (req, res) => {
  try {
    const shopId = req.user.shop?.id;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: 'Magasin non trouvé pour cet utilisateur',
      });
    }

    // Récupérer toutes les commandes du client
    const orders = await prisma.order.findMany({
      where: {
        shopId,
        status: { not: 'ANNULEE' },
      },
      include: {
        invoice: true,
        payments: {
          where: {
            status: 'PAYE',
          },
        },
      },
    });

    // Calculer les totaux
    const totalInvoiced = orders
      .filter(order => order.invoice)
      .reduce((sum, order) => sum + order.totalTTC, 0);

    const totalPaid = orders.reduce((sum, order) => {
      const orderPayments = order.payments.reduce((pSum, p) => pSum + p.amount, 0);
      return sum + orderPayments;
    }, 0);

    const balance = totalInvoiced - totalPaid; // Positif = dette, Négatif = crédit

    // Factures avec statut de paiement
    // Récupérer d'abord les IDs des commandes du client
    const clientOrderIds = orders.map(o => o.id);
    
    const invoices = await prisma.invoice.findMany({
      where: {
        orderId: { in: clientOrderIds },
      },
      include: {
        order: {
          include: {
            payments: {
              where: {
                status: 'PAYE',
              },
            },
          },
        },
      },
      orderBy: {
        generatedAt: 'desc',
      },
    });

    const invoicesWithStatus = invoices.map(invoice => {
      const orderPayments = invoice.order.payments.reduce((sum, p) => sum + p.amount, 0);
      const isPaid = orderPayments >= invoice.order.totalTTC;
      const paidAmount = orderPayments;
      const remainingAmount = invoice.order.totalTTC - orderPayments;

      return {
        ...invoice,
        paidAmount,
        remainingAmount,
        isPaid,
        paymentStatus: isPaid ? 'PAYE' : remainingAmount > 0 ? 'PARTIEL' : 'EN_ATTENTE',
      };
    });

    // Statistiques
    const stats = {
      totalInvoiced,
      totalPaid,
      balance, // Positif = dette, Négatif = crédit
      totalInvoices: invoices.length,
      paidInvoices: invoicesWithStatus.filter(inv => inv.isPaid).length,
      unpaidInvoices: invoicesWithStatus.filter(inv => !inv.isPaid).length,
      partialInvoices: invoicesWithStatus.filter(inv => inv.paymentStatus === 'PARTIEL').length,
    };

    res.json({
      success: true,
      summary: stats,
      invoices: invoicesWithStatus,
    });
  } catch (error) {
    logger.error('Erreur récupération résumé financier:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du résumé financier',
    });
  }
});

/**
 * GET /api/client/finance/invoices
 * Liste des factures avec statut de paiement
 */
router.get('/invoices', authenticate, requireClient, async (req, res) => {
  try {
    const shopId = req.user.shop?.id;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: 'Magasin non trouvé pour cet utilisateur',
      });
    }

    // Récupérer d'abord les IDs des commandes du client
    const clientOrders = await prisma.order.findMany({
      where: { shopId },
      select: { id: true },
    });
    const orderIds = clientOrders.map(o => o.id);

    const invoices = await prisma.invoice.findMany({
      where: {
        orderId: { in: orderIds },
      },
      include: {
        order: {
          include: {
            payments: {
              where: {
                status: 'PAYE',
              },
            },
          },
        },
      },
      orderBy: {
        generatedAt: 'desc',
      },
    });

    const invoicesWithStatus = invoices.map(invoice => {
      const orderPayments = invoice.order.payments.reduce((sum, p) => sum + p.amount, 0);
      const isPaid = orderPayments >= invoice.order.totalTTC;
      const paidAmount = orderPayments;
      const remainingAmount = invoice.order.totalTTC - orderPayments;

      return {
        ...invoice,
        orderTotal: invoice.order.totalTTC,
        paidAmount,
        remainingAmount,
        isPaid,
        paymentStatus: isPaid ? 'PAYE' : remainingAmount > 0 ? 'PARTIEL' : 'EN_ATTENTE',
      };
    });

    res.json({
      success: true,
      invoices: invoicesWithStatus,
    });
  } catch (error) {
    logger.error('Erreur récupération factures client:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des factures',
    });
  }
});

/**
 * GET /api/client/finance/payments
 * Liste des paiements du client
 */
router.get('/payments', authenticate, requireClient, async (req, res) => {
  try {
    const shopId = req.user.shop?.id;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: 'Magasin non trouvé pour cet utilisateur',
      });
    }

    const payments = await prisma.payment.findMany({
      where: {
        order: {
          shopId,
        },
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalTTC: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      payments,
    });
  } catch (error) {
    logger.error('Erreur récupération paiements client:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des paiements',
    });
  }
});

module.exports = router;
