const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { authenticate, requireAdmin, requireClient } = require('../middleware/auth');
const logger = require('../utils/logger');
const { logAction } = require('../utils/auditTrail');
const { calculateOrderItemTotals, calculateOrderTotals } = require('../utils/calculations');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs').promises;

/**
 * Générer un numéro de devis unique
 */
const generateQuoteNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `DEV-${year}${month}-${random}`;
};

/**
 * Générer le PDF du devis
 */
const generateQuotePDF = async (quote, shop) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // En-tête
      doc.fontSize(20).text('DEVIS', { align: 'center' });
      doc.moveDown();
      
      // Informations entreprise
      doc.fontSize(12).text('Distribution Fruits & Légumes', { align: 'left' });
      doc.fontSize(10).text('123 Rue des Fruits', { align: 'left' });
      doc.fontSize(10).text('75000 Paris, France', { align: 'left' });
      doc.moveDown();

      // Numéro de devis et date
      doc.fontSize(10);
      doc.text(`Numéro: ${quote.quoteNumber}`, { align: 'right' });
      doc.text(`Date: ${new Date(quote.createdAt).toLocaleDateString('fr-FR')}`, { align: 'right' });
      doc.text(`Valable jusqu'au: ${new Date(quote.validUntil).toLocaleDateString('fr-FR')}`, { align: 'right' });
      doc.moveDown(2);

      // Informations client
      doc.fontSize(12).text('Devis pour:', { underline: true });
      doc.fontSize(10);
      doc.text(shop.name);
      doc.text(shop.address);
      doc.text(`${shop.postalCode} ${shop.city}`);
      if (shop.phone) {
        doc.text(`Tél: ${shop.phone}`);
      }
      doc.moveDown(2);

      // Détails du devis
      doc.fontSize(12).text('Détails du devis:', { underline: true });
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
      quote.items.forEach(item => {
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
      doc.text(`${quote.totalHT.toFixed(2)} €`, 470, totalsY);
      
      doc.text('TVA:', 350, totalsY + 20);
      doc.text(`${quote.totalTVA.toFixed(2)} €`, 470, totalsY + 20);
      
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('Total TTC:', 350, totalsY + 40);
      doc.text(`${quote.totalTTC.toFixed(2)} €`, 470, totalsY + 40);
      
      doc.fontSize(10).font('Helvetica');
      doc.moveDown(2);
      
      // Notes
      if (quote.notes) {
        doc.fontSize(10).text('Notes:', { underline: true });
        doc.text(quote.notes);
        doc.moveDown();
      }
      
      // Conditions
      doc.fontSize(10).text('Conditions:', { underline: true });
      doc.text('Ce devis est valable jusqu\'à la date indiquée ci-dessus.');
      doc.text('Les prix sont exprimés en euros TTC.');
      doc.text('En cas d\'acceptation, ce devis pourra être converti en commande.');
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * GET /api/quotes
 * Liste des devis
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, shopId, page = 1, limit = 20 } = req.query;
    const where = {};
    
    // Les clients voient seulement leurs devis
    if (req.user.role === 'CLIENT' && req.user.shop) {
      where.shopId = req.user.shop.id;
    }
    
    // Filtres admin
    if (req.user.role === 'ADMIN') {
      if (shopId) where.shopId = shopId;
      if (status) where.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        include: {
          shop: {
            select: {
              id: true,
              name: true,
              city: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  unit: true,
                  tvaRate: true,
                },
              },
            },
          },
          convertedToOrder: {
            select: {
              id: true,
              orderNumber: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.quote.count({ where }),
    ]);

    res.json({
      success: true,
      quotes,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error('Erreur récupération devis:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des devis',
    });
  }
});

/**
 * GET /api/quotes/:id
 * Détails d'un devis
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: req.params.id },
      include: {
        shop: true,
        items: {
          include: {
            product: true,
          },
        },
        convertedToOrder: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
          },
        },
      },
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Devis non trouvé',
      });
    }

    // Vérifier les permissions
    if (req.user.role === 'CLIENT' && quote.shopId !== req.user.shop?.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé',
      });
    }

    res.json({
      success: true,
      quote,
    });
  } catch (error) {
    logger.error('Erreur récupération devis:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du devis',
    });
  }
});

/**
 * POST /api/quotes
 * Créer un devis (Admin uniquement)
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('shopId').notEmpty().withMessage('ID magasin requis'),
    body('items').isArray({ min: 1 }).withMessage('Au moins un produit est requis'),
    body('items.*.productId').notEmpty().withMessage('ID produit requis'),
    body('items.*.quantity').isFloat({ min: 0.01 }).withMessage('Quantité invalide'),
    body('validUntil').isISO8601().withMessage('Date de validité invalide'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { shopId, items, validUntil, notes } = req.body;

      // Vérifier que le magasin existe
      const shop = await prisma.shop.findUnique({
        where: { id: shopId },
      });

      if (!shop) {
        return res.status(404).json({
          success: false,
          message: 'Magasin non trouvé',
        });
      }

      // Récupérer les produits
      const productIds = items.map(item => item.productId);
      const products = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          isActive: true,
        },
      });

      if (products.length !== productIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Un ou plusieurs produits ne sont pas disponibles',
        });
      }

      // Créer les items avec calculs
      const quoteItems = items.map(item => {
        const product = products.find(p => p.id === item.productId);
        const quantity = parseFloat(item.quantity);
        const priceHT = product.priceHT;
        const totals = calculateOrderItemTotals(quantity, priceHT, product.tvaRate);
        
        return {
          productId: product.id,
          quantity,
          priceHT,
          totalHT: totals.totalHT,
          totalTVA: totals.totalTVA,
          totalTTC: totals.totalTTC,
        };
      });

      // Calculer les totaux
      const totals = calculateOrderTotals(quoteItems);

      // Générer le numéro de devis
      let quoteNumber = generateQuoteNumber();
      let exists = await prisma.quote.findUnique({ where: { quoteNumber } });
      while (exists) {
        quoteNumber = generateQuoteNumber();
        exists = await prisma.quote.findUnique({ where: { quoteNumber } });
      }

      // Créer le devis
      const quote = await prisma.quote.create({
        data: {
          shopId,
          quoteNumber,
          validUntil: new Date(validUntil),
          status: 'DRAFT',
          totalHT: totals.totalHT,
          totalTVA: totals.totalTVA,
          totalTTC: totals.totalTTC,
          notes: notes || null,
          items: {
            create: quoteItems.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              priceHT: item.priceHT,
              totalHT: item.totalHT,
              totalTVA: item.totalTVA,
              totalTTC: item.totalTTC,
            })),
          },
        },
        include: {
          shop: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      await logAction('CREATE', 'Quote', quote.id, req.user.id, {
        quoteNumber: quote.quoteNumber,
        shopId: shopId,
      }, req);

      res.status(201).json({
        success: true,
        message: 'Devis créé avec succès',
        quote,
      });
    } catch (error) {
      logger.error('Erreur création devis:', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du devis',
      });
    }
  }
);

/**
 * PUT /api/quotes/:id
 * Modifier un devis (Admin uniquement)
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  [
    body('items').optional().isArray({ min: 1 }).withMessage('Au moins un produit est requis'),
    body('validUntil').optional().isISO8601().withMessage('Date de validité invalide'),
    body('status').optional().isIn(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const quote = await prisma.quote.findUnique({
        where: { id: req.params.id },
        include: { items: true },
      });

      if (!quote) {
        return res.status(404).json({
          success: false,
          message: 'Devis non trouvé',
        });
      }

      if (quote.status === 'CONVERTED') {
        return res.status(400).json({
          success: false,
          message: 'Impossible de modifier un devis déjà converti en commande',
        });
      }

      const updateData = {};

      if (req.body.status) {
        updateData.status = req.body.status;
      }

      if (req.body.validUntil) {
        updateData.validUntil = new Date(req.body.validUntil);
      }

      if (req.body.notes !== undefined) {
        updateData.notes = req.body.notes;
      }

      // Si les items changent, recalculer
      if (req.body.items) {
        const productIds = req.body.items.map(item => item.productId);
        const products = await prisma.product.findMany({
          where: {
            id: { in: productIds },
            isActive: true,
          },
        });

        if (products.length !== productIds.length) {
          return res.status(400).json({
            success: false,
            message: 'Un ou plusieurs produits ne sont pas disponibles',
          });
        }

        const quoteItems = req.body.items.map(item => {
          const product = products.find(p => p.id === item.productId);
          const quantity = parseFloat(item.quantity);
          const priceHT = product.priceHT;
          const totals = calculateOrderItemTotals(quantity, priceHT, product.tvaRate);
          
          return {
            productId: product.id,
            quantity,
            priceHT,
            totalHT: totals.totalHT,
            totalTVA: totals.totalTVA,
            totalTTC: totals.totalTTC,
          };
        });

        const totals = calculateOrderTotals(quoteItems);
        updateData.totalHT = totals.totalHT;
        updateData.totalTVA = totals.totalTVA;
        updateData.totalTTC = totals.totalTTC;

        // Supprimer les anciens items et créer les nouveaux
        await prisma.quoteItem.deleteMany({
          where: { quoteId: quote.id },
        });

        await prisma.quoteItem.createMany({
          data: quoteItems.map(item => ({
            quoteId: quote.id,
            productId: item.productId,
            quantity: item.quantity,
            priceHT: item.priceHT,
            totalHT: item.totalHT,
            totalTVA: item.totalTVA,
            totalTTC: item.totalTTC,
          })),
        });
      }

      const updatedQuote = await prisma.quote.update({
        where: { id: req.params.id },
        data: updateData,
        include: {
          shop: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      await logAction('UPDATE', 'Quote', updatedQuote.id, req.user.id, {
        changes: updateData,
      }, req);

      res.json({
        success: true,
        message: 'Devis modifié avec succès',
        quote: updatedQuote,
      });
    } catch (error) {
      logger.error('Erreur modification devis:', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la modification du devis',
      });
    }
  }
);

/**
 * POST /api/quotes/:id/send
 * Envoyer un devis au client (Admin uniquement)
 */
router.post('/:id/send', authenticate, requireAdmin, async (req, res) => {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: req.params.id },
      include: {
        shop: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Devis non trouvé',
      });
    }

    // Mettre à jour le statut
    const updatedQuote = await prisma.quote.update({
      where: { id: req.params.id },
      data: { status: 'SENT' },
    });

    // TODO: Envoyer par email
    // await sendQuoteEmail(quote, quote.shop);

    await logAction('UPDATE', 'Quote', quote.id, req.user.id, {
      action: 'sent',
    }, req);

    res.json({
      success: true,
      message: 'Devis envoyé avec succès',
      quote: updatedQuote,
    });
  } catch (error) {
    logger.error('Erreur envoi devis:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi du devis',
    });
  }
});

/**
 * POST /api/quotes/:id/convert
 * Convertir un devis en commande (Admin uniquement)
 */
router.post('/:id/convert', authenticate, requireAdmin, async (req, res) => {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: req.params.id },
      include: {
        shop: true,
        items: {
          include: {
            product: true,
          },
        },
        convertedToOrder: true,
      },
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Devis non trouvé',
      });
    }

    if (quote.convertedToOrder) {
      return res.status(400).json({
        success: false,
        message: 'Ce devis a déjà été converti en commande',
        order: quote.convertedToOrder,
      });
    }

    if (new Date(quote.validUntil) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Ce devis a expiré',
      });
    }

    // Générer le numéro de commande
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    let orderNumber = `CMD-${year}${month}-${random}`;
    let exists = await prisma.order.findUnique({ where: { orderNumber } });
    while (exists) {
      orderNumber = `CMD-${year}${month}-${random}`;
      exists = await prisma.order.findUnique({ where: { orderNumber } });
    }

    // Créer la commande
    const order = await prisma.order.create({
      data: {
        shopId: quote.shopId,
        orderNumber,
        status: 'NEW',
        paymentStatus: 'EN_ATTENTE',
        totalHT: quote.totalHT,
        totalTVA: quote.totalTVA,
        totalTTC: quote.totalTTC,
        items: {
          create: quote.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            priceHT: item.priceHT,
            totalHT: item.totalHT,
            totalTVA: item.totalTVA,
            totalTTC: item.totalTTC,
          })),
        },
      },
    });

    // Mettre à jour le devis
    const updatedQuote = await prisma.quote.update({
      where: { id: quote.id },
      data: {
        status: 'CONVERTED',
        convertedToOrderId: order.id,
      },
    });

    await logAction('UPDATE', 'Quote', quote.id, req.user.id, {
      action: 'converted',
      orderId: order.id,
    }, req);

    res.json({
      success: true,
      message: 'Devis converti en commande avec succès',
      quote: updatedQuote,
      order,
    });
  } catch (error) {
    logger.error('Erreur conversion devis:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la conversion du devis',
    });
  }
});

/**
 * GET /api/quotes/:id/download
 * Télécharger le PDF du devis
 */
router.get('/:id/download', authenticate, async (req, res) => {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: req.params.id },
      include: {
        shop: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Devis non trouvé',
      });
    }

    // Vérifier les permissions
    if (req.user.role === 'CLIENT' && quote.shopId !== req.user.shop?.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé',
      });
    }

    const pdfBuffer = await generateQuotePDF(quote, quote.shop);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="devis-${quote.quoteNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    logger.error('Erreur génération PDF devis:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du PDF',
    });
  }
});

/**
 * DELETE /api/quotes/:id
 * Supprimer un devis (Admin uniquement)
 */
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: req.params.id },
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Devis non trouvé',
      });
    }

    if (quote.status === 'CONVERTED') {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer un devis converti en commande',
      });
    }

    await prisma.quote.delete({
      where: { id: req.params.id },
    });

    await logAction('DELETE', 'Quote', quote.id, req.user.id, {
      quoteNumber: quote.quoteNumber,
    }, req);

    res.json({
      success: true,
      message: 'Devis supprimé avec succès',
    });
  } catch (error) {
    logger.error('Erreur suppression devis:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du devis',
    });
  }
});

module.exports = router;
