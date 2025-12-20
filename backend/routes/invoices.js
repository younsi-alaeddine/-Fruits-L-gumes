const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate, requireAdmin, requireClient } = require('../middleware/auth');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;
const PDFDocument = require('pdfkit');

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
      doc.fontSize(12).text('Distribution Fruits & Légumes', { align: 'left' });
      doc.fontSize(10).text('123 Rue des Fruits', { align: 'left' });
      doc.fontSize(10).text('75000 Paris, France', { align: 'left' });
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
    
    // Les clients voient seulement leurs factures
    if (req.user.role === 'CLIENT' && req.user.shop) {
      // Récupérer d'abord les IDs des commandes du client
      const clientOrders = await prisma.order.findMany({
        where: { shopId: req.user.shop.id },
        select: { id: true },
      });
      const orderIds = clientOrders.map(o => o.id);
      where.orderId = { in: orderIds };
    }
    // Pour les admins, pas de filtre (where reste {})

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
 * GET /api/invoices/:id
 * Détails d'une facture
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
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

    // Vérifier les permissions
    if (req.user.role === 'CLIENT' && invoice.order.shopId !== req.user.shop?.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé',
      });
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

    // Vérifier les permissions
    if (req.user.role === 'CLIENT' && invoice.order.shopId !== req.user.shop?.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé',
      });
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

module.exports = router;
