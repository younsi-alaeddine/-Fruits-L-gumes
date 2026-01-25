const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate, requireAdmin, requireClient } = require('../middleware/auth');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;
const PDFDocument = require('pdfkit');
const { appInfo } = require('../config/appInfo');

/**
 * Générer un numéro de facture unique
 */
const generateInvoiceNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `FAC-${year}${month}-${random}`;
};

/**
 * Générer le PDF de la facture
 */
const generateInvoicePDF = async (invoice, order, shop) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // En-tête
      doc.fontSize(20).text('FACTURE', { align: 'center' });
      doc.moveDown();
      
      // Informations entreprise
      // Phase 2: make document header configurable (deploy-safe)
      doc.fontSize(12).text(appInfo.companyName, { align: 'left' });
      doc.fontSize(10).text(appInfo.companyAddressLine1, { align: 'left' });
      doc.fontSize(10).text(appInfo.companyAddressLine2, { align: 'left' });
      doc.moveDown();

      // Numéro de facture et date
      doc.fontSize(10);
      doc.text(`Numéro: ${invoice.invoiceNumber}`, { align: 'right' });
      doc.text(`Date: ${new Date(invoice.generatedAt).toLocaleDateString('fr-FR')}`, { align: 'right' });
      doc.moveDown(2);

      // Informations client
      doc.fontSize(12).text('Facturé à:', { underline: true });
      doc.fontSize(10);
      doc.text(shop.name);
      doc.text(shop.address);
      doc.text(`${shop.postalCode} ${shop.city}`);
      if (shop.phone) {
        doc.text(`Tél: ${shop.phone}`);
      }
      doc.moveDown(2);

      // Détails de la commande
      doc.fontSize(12).text('Détails de la commande:', { underline: true });
      doc.moveDown(0.5);
      
      // Tableau des produits
      const tableTop = doc.y;
      const itemHeight = 30;
      
      // En-têtes du tableau
      doc.fontSize(10);
      doc.text('Produit', 50, tableTop);
      doc.text('Qté', 250, tableTop);
      doc.text('Prix HT', 300, tableTop);
      doc.text('TVA', 360, tableTop);
      doc.text('Total TTC', 420, tableTop);
      
      let y = tableTop + 20;
      
      // Lignes des produits
      order.items.forEach(item => {
        doc.text(item.product.name, 50, y);
        doc.text(`${item.quantity} ${item.product.unit}`, 250, y);
        doc.text(`${item.priceHT.toFixed(2)} €`, 300, y);
        doc.text(`${item.product.tvaRate}%`, 360, y);
        doc.text(`${item.totalTTC.toFixed(2)} €`, 420, y);
        y += itemHeight;
      });
      
      doc.moveDown(2);
      
      // Totaux
      const totalsY = doc.y;
      doc.text('Sous-total HT:', 350, totalsY);
      doc.text(`${order.totalHT.toFixed(2)} €`, 470, totalsY);
      
      doc.text('TVA:', 350, totalsY + 20);
      doc.text(`${order.totalTVA.toFixed(2)} €`, 470, totalsY + 20);
      
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('Total TTC:', 350, totalsY + 40);
      doc.text(`${order.totalTTC.toFixed(2)} €`, 470, totalsY + 40);
      
      doc.font('Helvetica').fontSize(10);
      doc.moveDown(3);
      
      // Conditions de paiement
      doc.fontSize(10).text('Conditions de paiement:', { underline: true });
      doc.text('Paiement à réception de facture');
      doc.moveDown();
      doc.text('Merci de votre confiance !');
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * GET /api/invoices
 * Liste des factures
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let where = {};
    const shopIds = (req.context?.accessibleShops || []).map(s => s.id);

    if (req.user.role === 'ADMIN') {
      // No filter
    } else {
      if (shopIds.length === 0) {
        return res.status(400).json({ success: false, message: 'Magasin non trouvé' });
      }
      const scope = req.query.scope === 'org' ? 'org' : 'shop';
      let shopWhere;
      if (scope === 'org') {
        shopWhere = { shopId: { in: shopIds } };
      } else {
        const activeShopId = req.context?.activeShopId;
        if (!activeShopId) {
          return res.status(400).json({ success: false, message: 'Magasin non trouvé' });
        }
        shopWhere = { shopId: activeShopId };
      }
      const orders = await prisma.order.findMany({
        where: shopWhere,
        select: { id: true },
      });
      const orderIds = orders.map(o => o.id);
      if (orderIds.length === 0) {
        return res.json({
          success: true,
          invoices: [],
          pagination: { total: 0, page: parseInt(page) || 1, limit: parseInt(limit) || 20, totalPages: 0 },
        });
      }
      where.orderId = { in: orderIds };
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          order: {
            include: {
              shop: {
                select: {
                  id: true,
                  name: true,
                  city: true,
                  address: true,
                  postalCode: true,
                  phone: true,
                },
              },
              items: {
                include: {
                  product: {
                    select: {
                      id: true,
                      name: true,
                      unit: true,
                      priceHT: true,
                      tvaRate: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({
      success: true,
      invoices,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error('Erreur récupération factures:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des factures',
    });
  }
});

/**
 * GET /api/invoices/stats/advanced
 * Statistiques avancées sur les factures
 * NOTE: Cette route DOIT être avant /:id pour ne pas être capturée
 */
router.get('/stats/advanced', authenticate, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        generatedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      };
    }

    // Stats globales
    const [
      totalInvoices,
      draftInvoices,
      sentInvoices,
      paidInvoices,
      partialInvoices,
      overdueInvoices,
      totalRevenue,
      totalPaid,
      totalRemaining
    ] = await Promise.all([
      prisma.invoice.count({ where: dateFilter }),
      prisma.invoice.count({ where: { ...dateFilter, status: 'DRAFT' } }),
      prisma.invoice.count({ where: { ...dateFilter, status: 'SENT' } }),
      prisma.invoice.count({ where: { ...dateFilter, status: 'PAID' } }),
      prisma.invoice.count({ where: { ...dateFilter, status: 'PARTIAL' } }),
      prisma.invoice.count({ where: { ...dateFilter, status: 'OVERDUE' } }),
      prisma.invoice.aggregate({
        where: dateFilter,
        _sum: { totalTTC: true }
      }),
      prisma.invoice.aggregate({
        where: dateFilter,
        _sum: { paidAmount: true }
      }),
      prisma.invoice.aggregate({
        where: dateFilter,
        _sum: { remainingAmount: true }
      })
    ]);

    // Factures à échéance dans les 7 jours
    const upcomingDue = await prisma.invoice.count({
      where: {
        status: { in: ['SENT', 'PARTIAL'] },
        dueDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    res.json({
      success: true,
      stats: {
        total: totalInvoices,
        draft: draftInvoices,
        sent: sentInvoices,
        paid: paidInvoices,
        partial: partialInvoices,
        overdue: overdueInvoices,
        upcomingDue,
        revenue: {
          total: totalRevenue._sum.totalTTC || 0,
          paid: totalPaid._sum.paidAmount || 0,
          remaining: totalRemaining._sum.remainingAmount || 0
        }
      }
    });
  } catch (error) {
    logger.error('Erreur stats factures:', { error: error.message });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * GET /api/invoices/export/accounting
 * Export comptable des factures (CSV)
 * NOTE: Cette route DOIT être avant /:id
 */
router.get('/export/accounting', authenticate, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, format = 'csv' } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        generatedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      };
    }

    const invoices = await prisma.invoice.findMany({
      where: { ...dateFilter, status: { not: 'DRAFT' } },
      include: {
        order: {
          include: {
            shop: true
          }
        },
        payments: true
      },
      orderBy: { generatedAt: 'asc' }
    });

    if (format === 'csv') {
      // Générer CSV
      let csv = 'Date;Numéro Facture;Client;Montant HT;TVA;Montant TTC;Statut;Date Échéance;Montant Payé;Restant Dû\n';
      
      invoices.forEach(inv => {
        csv += `${new Date(inv.generatedAt).toLocaleDateString('fr-FR')};`;
        csv += `${inv.invoiceNumber};`;
        csv += `${inv.order.shop.name};`;
        csv += `${inv.totalHT.toFixed(2)};`;
        csv += `${inv.totalTVA.toFixed(2)};`;
        csv += `${inv.totalTTC.toFixed(2)};`;
        csv += `${inv.status};`;
        csv += `${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('fr-FR') : ''};`;
        csv += `${inv.paidAmount.toFixed(2)};`;
        csv += `${inv.remainingAmount.toFixed(2)}\n`;
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=export-factures-${Date.now()}.csv`);
      res.send('\ufeff' + csv); // BOM UTF-8
    } else {
      res.json({ success: true, invoices });
    }
  } catch (error) {
    logger.error('Erreur export comptable:', { error: error.message });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * GET /api/invoices/:id
 * Détails d'une facture
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    // SECURITY: Validate UUID format to prevent injection attacks
    // RISK: Invalid UUID format could cause database errors or expose information
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de facture invalide'
      });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
            shop: true,
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée',
      });
    }

    const canAccess = req.user.role === 'ADMIN' ||
      (req.context?.accessibleShops || []).some(s => s.id === invoice.order.shopId);
    if (!canAccess) {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }

    res.json({
      success: true,
      invoice,
    });
  } catch (error) {
    logger.error('Erreur récupération facture:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la facture',
    });
  }
});

/**
 * GET /api/invoices/:id/download
 * Télécharger le PDF de la facture
 */
router.get('/:id/download', authenticate, async (req, res) => {
  try {
    // SECURITY: Validate UUID format to prevent injection attacks
    // RISK: Invalid UUID format could cause database errors or expose information
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de facture invalide'
      });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
            shop: true,
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée',
      });
    }

    const canAccess = req.user.role === 'ADMIN' ||
      (req.context?.accessibleShops || []).some(s => s.id === invoice.order.shopId);
    if (!canAccess) {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }

    // Générer le PDF
    const pdfBuffer = await generateInvoicePDF(invoice, invoice.order, invoice.order.shop);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="facture-${invoice.invoiceNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    logger.error('Erreur génération PDF facture:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du PDF',
    });
  }
});

/**
 * POST /api/orders/:orderId/generate-invoice
 * Générer une facture pour une commande
 */
router.post('/orders/:orderId/generate-invoice', authenticate, requireAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;

    // Vérifier si une facture existe déjà
    const existingInvoice = await prisma.invoice.findUnique({
      where: { orderId },
    });

    if (existingInvoice) {
      return res.status(400).json({
        success: false,
        message: 'Une facture existe déjà pour cette commande',
        invoice: existingInvoice,
      });
    }

    // Récupérer la commande
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        shop: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée',
      });
    }

    // Vérifier que la commande est livrée
    if (order.status !== 'LIVREE') {
      return res.status(400).json({
        success: false,
        message: 'La commande doit être livrée pour générer une facture',
      });
    }

    // Générer le numéro de facture
    let invoiceNumber = generateInvoiceNumber();
    let exists = true;
    
    // S'assurer que le numéro est unique
    while (exists) {
      const check = await prisma.invoice.findUnique({
        where: { invoiceNumber },
      });
      if (!check) {
        exists = false;
      } else {
        invoiceNumber = generateInvoiceNumber();
      }
    }

    // Générer le PDF
    const pdfBuffer = await generateInvoicePDF(
      { invoiceNumber, generatedAt: new Date() },
      order,
      order.shop
    );

    // Créer le répertoire uploads/invoices s'il n'existe pas
    const invoicesDir = path.join(__dirname, '../uploads/invoices');
    await fs.mkdir(invoicesDir, { recursive: true });

    // Sauvegarder le PDF
    const filename = `invoice-${invoiceNumber}.pdf`;
    const filepath = path.join(invoicesDir, filename);
    await fs.writeFile(filepath, pdfBuffer);

    // Créer l'enregistrement de facture
    const invoice = await prisma.invoice.create({
      data: {
        orderId: order.id,
        invoiceNumber,
        fileUrl: `/uploads/invoices/${filename}`,
        generatedAt: new Date(),
      },
      include: {
        order: {
          include: {
            shop: {
              select: {
                name: true,
                city: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Facture générée avec succès',
      invoice,
    });
  } catch (error) {
    logger.error('Erreur génération facture:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération de la facture',
    });
  }
});

/**
 * POST /api/invoices/:id/send
 * Envoyer la facture par email
 */
router.post('/:id/send', authenticate, requireAdmin, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        order: {
          include: {
            shop: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée',
      });
    }

    // TODO: Implémenter l'envoi par email avec pièce jointe
    // Pour l'instant, marquer comme envoyée
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        sentAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Facture envoyée par email',
      invoice: updatedInvoice,
    });
  } catch (error) {
    logger.error('Erreur envoi facture par email:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi de la facture',
    });
  }
});

/**
 * POST /api/invoices/:id/payments
 * Enregistrer un paiement sur une facture
 */
router.post('/:id/payments', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, method, reference, paymentDate, notes } = req.body;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Montant invalide' });
    }
    if (!method) {
      return res.status(400).json({ success: false, message: 'Méthode de paiement requise' });
    }

    // Vérifier que la facture existe
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { payments: true }
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Facture non trouvée' });
    }

    // Vérifier que le montant ne dépasse pas le restant dû
    if (amount > invoice.remainingAmount) {
      return res.status(400).json({ 
        success: false, 
        message: `Le montant dépasse le restant dû (${invoice.remainingAmount.toFixed(2)} €)` 
      });
    }

    // Créer le paiement
    const payment = await prisma.payment.create({
      data: {
        invoiceId: id,
        amount: parseFloat(amount),
        paymentMethod: method,
        reference,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        notes,
        recordedBy: req.user.id,
        status: 'REGLE'
      }
    });

    // Mettre à jour la facture
    const newPaidAmount = invoice.paidAmount + parseFloat(amount);
    const newRemainingAmount = invoice.remainingAmount - parseFloat(amount);
    const newStatus = newRemainingAmount <= 0 ? 'PAID' : 'PARTIAL';

    await prisma.invoice.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        status: newStatus,
        paidAt: newStatus === 'PAID' ? new Date() : null
      }
    });

    logger.info('Paiement enregistré', { invoiceId: id, amount, method });

    res.json({
      success: true,
      payment,
      message: 'Paiement enregistré avec succès'
    });
  } catch (error) {
    logger.error('Erreur enregistrement paiement:', { error: error.message });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * GET /api/invoices/:id/payments
 * Liste des paiements d'une facture
 */
router.get('/:id/payments', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const payments = await prisma.payment.findMany({
      where: { invoiceId: id },
      orderBy: { paymentDate: 'desc' }
    });

    res.json({ success: true, payments });
  } catch (error) {
    logger.error('Erreur récupération paiements:', { error: error.message });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * POST /api/invoices/:id/credit-note
 * Créer un avoir pour une facture
 */
router.post('/:id/credit-note', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason, notes } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Montant invalide' });
    }
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Raison requise' });
    }

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Facture non trouvée' });
    }

    if (amount > invoice.totalTTC) {
      return res.status(400).json({ 
        success: false, 
        message: 'Le montant de l\'avoir ne peut pas dépasser le total de la facture' 
      });
    }

    // Générer numéro d'avoir
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const creditNoteNumber = `AV-${year}${month}-${random}`;

    // Créer l'avoir
    const creditNote = await prisma.creditNote.create({
      data: {
        creditNoteNumber,
        originalInvoiceId: id,
        amount: parseFloat(amount),
        reason,
        notes,
        status: 'PENDING'
      }
    });

    logger.info('Avoir créé', { invoiceId: id, creditNoteNumber, amount });

    res.json({
      success: true,
      creditNote,
      message: 'Avoir créé avec succès'
    });
  } catch (error) {
    logger.error('Erreur création avoir:', { error: error.message });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * POST /api/invoices/:id/credit-note/:creditNoteId/apply
 * Appliquer un avoir sur une facture
 */
router.post('/:id/credit-note/:creditNoteId/apply', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id, creditNoteId } = req.params;

    const [invoice, creditNote] = await Promise.all([
      prisma.invoice.findUnique({ where: { id } }),
      prisma.creditNote.findUnique({ where: { id: creditNoteId } })
    ]);

    if (!invoice || !creditNote) {
      return res.status(404).json({ success: false, message: 'Facture ou avoir non trouvé' });
    }

    if (creditNote.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Cet avoir a déjà été appliqué' });
    }

    // Appliquer l'avoir
    const newRemainingAmount = Math.max(0, invoice.remainingAmount - creditNote.amount);
    const newPaidAmount = invoice.paidAmount + Math.min(creditNote.amount, invoice.remainingAmount);
    const newStatus = newRemainingAmount <= 0 ? 'PAID' : 'PARTIAL';

    await prisma.$transaction([
      prisma.creditNote.update({
        where: { id: creditNoteId },
        data: {
          status: 'APPLIED',
          appliedAt: new Date(),
          appliedToInvoiceId: id
        }
      }),
      prisma.invoice.update({
        where: { id },
        data: {
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
          status: newStatus,
          paidAt: newStatus === 'PAID' ? new Date() : invoice.paidAt
        }
      })
    ]);

    logger.info('Avoir appliqué', { invoiceId: id, creditNoteId });

    res.json({
      success: true,
      message: 'Avoir appliqué avec succès'
    });
  } catch (error) {
    logger.error('Erreur application avoir:', { error: error.message });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * GET /api/invoices/stats
 * Statistiques avancées sur les factures
 */
router.get('/stats/advanced', authenticate, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        generatedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      };
    }

    // Stats globales
    const [
      totalInvoices,
      draftInvoices,
      sentInvoices,
      paidInvoices,
      partialInvoices,
      overdueInvoices,
      totalRevenue,
      totalPaid,
      totalRemaining
    ] = await Promise.all([
      prisma.invoice.count({ where: dateFilter }),
      prisma.invoice.count({ where: { ...dateFilter, status: 'DRAFT' } }),
      prisma.invoice.count({ where: { ...dateFilter, status: 'SENT' } }),
      prisma.invoice.count({ where: { ...dateFilter, status: 'PAID' } }),
      prisma.invoice.count({ where: { ...dateFilter, status: 'PARTIAL' } }),
      prisma.invoice.count({ where: { ...dateFilter, status: 'OVERDUE' } }),
      prisma.invoice.aggregate({
        where: dateFilter,
        _sum: { totalTTC: true }
      }),
      prisma.invoice.aggregate({
        where: dateFilter,
        _sum: { paidAmount: true }
      }),
      prisma.invoice.aggregate({
        where: dateFilter,
        _sum: { remainingAmount: true }
      })
    ]);

    // Factures à échéance dans les 7 jours
    const upcomingDue = await prisma.invoice.count({
      where: {
        status: { in: ['SENT', 'PARTIAL'] },
        dueDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    res.json({
      success: true,
      stats: {
        total: totalInvoices,
        draft: draftInvoices,
        sent: sentInvoices,
        paid: paidInvoices,
        partial: partialInvoices,
        overdue: overdueInvoices,
        upcomingDue,
        revenue: {
          total: totalRevenue._sum.totalTTC || 0,
          paid: totalPaid._sum.paidAmount || 0,
          remaining: totalRemaining._sum.remainingAmount || 0
        }
      }
    });
  } catch (error) {
    logger.error('Erreur stats factures:', { error: error.message });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * POST /api/invoices/:id/send-reminder
 * Envoyer une relance pour une facture
 */
router.post('/:id/send-reminder', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            shop: true
          }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Facture non trouvée' });
    }

    if (invoice.status === 'PAID') {
      return res.status(400).json({ success: false, message: 'Cette facture est déjà payée' });
    }

    // TODO: Implémenter l'envoi d'email de relance
    // await sendReminderEmail(invoice);

    // Mettre à jour les infos de relance
    await prisma.invoice.update({
      where: { id },
      data: {
        reminderSentAt: new Date(),
        reminderCount: invoice.reminderCount + 1
      }
    });

    logger.info('Relance envoyée', { invoiceId: id });

    res.json({
      success: true,
      message: 'Relance envoyée avec succès'
    });
  } catch (error) {
    logger.error('Erreur envoi relance:', { error: error.message });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * POST /api/invoices/proforma
 * Créer une facture proforma
 */
router.post('/proforma', authenticate, requireAdmin, async (req, res) => {
  try {
    const { orderId, dueDate, notes } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'ID commande requis' });
    }

    // Vérifier que la commande existe
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        shop: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }

    // Générer numéro proforma
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const proformaNumber = `PRO-${year}${month}-${random}`;

    // Créer la facture proforma (sans orderId unique)
    // Note: On utilise un nouveau modèle ou on marque le type comme PROFORMA
    const proforma = await prisma.invoice.create({
      data: {
        orderId: orderId,
        invoiceNumber: proformaNumber,
        type: 'PROFORMA',
        status: 'DRAFT',
        totalHT: order.totalHT,
        totalTVA: order.totalTVA,
        totalTTC: order.totalTTC,
        paidAmount: 0,
        remainingAmount: order.totalTTC,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
        paymentTerms: 'Proforma - Paiement avant livraison'
      }
    });

    logger.info('Facture proforma créée', { proformaNumber, orderId });

    res.json({
      success: true,
      proforma,
      message: 'Facture proforma créée avec succès'
    });
  } catch (error) {
    logger.error('Erreur création proforma:', { error: error.message });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;
