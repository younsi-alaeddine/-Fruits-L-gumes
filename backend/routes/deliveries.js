const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');
const PDFDocument = require('pdfkit');

/**
 * Générer un numéro de bon de livraison unique
 */
const generateDeliveryNoteNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `BL-${year}${month}-${random}`;
};

/**
 * Générer le PDF du bon de livraison
 */
const generateDeliveryNotePDF = async (delivery, order, shop, driver) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // En-tête
      doc.fontSize(20).text('BON DE LIVRAISON', { align: 'center' });
      doc.moveDown();
      
      // Informations entreprise
      doc.fontSize(12).text('Distribution Fruits & Légumes', { align: 'left' });
      doc.fontSize(10).text('123 Rue des Fruits', { align: 'left' });
      doc.fontSize(10).text('75000 Paris, France', { align: 'left' });
      doc.moveDown();

      // Numéro de bon et date
      doc.fontSize(10);
      doc.text(`Numéro: ${delivery.deliveryNoteNumber || delivery.id.substring(0, 8)}`, { align: 'right' });
      doc.text(`Date de livraison: ${new Date(delivery.deliveryDate).toLocaleDateString('fr-FR')}`, { align: 'right' });
      if (delivery.timeSlot) {
        doc.text(`Créneau: ${delivery.timeSlot}`, { align: 'right' });
      }
      doc.moveDown(2);

      // Informations client
      doc.fontSize(12).text('Livré à:', { underline: true });
      doc.fontSize(10);
      doc.text(shop.name);
      doc.text(shop.address);
      doc.text(`${shop.postalCode} ${shop.city}`);
      if (shop.phone) {
        doc.text(`Tél: ${shop.phone}`);
      }
      doc.moveDown();

      // Informations livreur
      if (driver) {
        doc.fontSize(10).text(`Livreur: ${driver.name}`, { align: 'right' });
      }
      doc.moveDown(2);

      // Détails de la livraison
      doc.fontSize(12).text('Détails de la livraison:', { underline: true });
      doc.moveDown(0.5);
      
      // Tableau des produits
      const tableTop = doc.y;
      const itemHeight = 30;
      
      // En-têtes du tableau
      doc.fontSize(10);
      doc.text('Produit', 50, tableTop);
      doc.text('Qté commandée', 200, tableTop);
      doc.text('Qté livrée', 300, tableTop);
      doc.text('Prix HT', 380, tableTop);
      doc.text('Total TTC', 450, tableTop);
      
      let y = tableTop + 20;
      
      // Lignes des produits
      order.items.forEach(item => {
        doc.text(item.product.name, 50, y);
        doc.text(`${item.quantity} ${item.product.unit}`, 200, y);
        doc.text(`${item.quantity} ${item.product.unit}`, 300, y); // Par défaut, tout est livré
        doc.text(`${item.priceHT.toFixed(2)} €`, 380, y);
        doc.text(`${item.totalTTC.toFixed(2)} €`, 450, y);
        y += itemHeight;
      });
      
      doc.moveDown(2);
      
      // Totaux
      const totalsY = doc.y;
      doc.text('Total HT:', 350, totalsY);
      doc.text(`${order.totalHT.toFixed(2)} €`, 470, totalsY);
      
      doc.text('TVA:', 350, totalsY + 20);
      doc.text(`${order.totalTVA.toFixed(2)} €`, 470, totalsY + 20);
      
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('Total TTC:', 350, totalsY + 40);
      doc.text(`${order.totalTTC.toFixed(2)} €`, 470, totalsY + 40);
      
      doc.fontSize(10).font('Helvetica');
      doc.moveDown(3);
      
      // Notes
      if (delivery.notes) {
        doc.fontSize(10).text('Notes:', { underline: true });
        doc.text(delivery.notes);
        doc.moveDown();
      }
      
      // Signature
      doc.fontSize(10).text('Signature client:', { underline: true });
      doc.moveDown(2);
      doc.line(50, doc.y, 250, doc.y);
      doc.moveDown(0.5);
      doc.fontSize(8).text('Nom et signature', 50, doc.y);
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * GET /api/deliveries
 * Liste des livraisons
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, driverId, status } = req.query;
    
    const where = {};
    
    // Les clients voient seulement leurs livraisons
    if (req.user.role === 'CLIENT' && req.user.shop) {
      // Récupérer d'abord les IDs des commandes du client
      const clientOrders = await prisma.order.findMany({
        where: { shopId: req.user.shop.id },
        select: { id: true },
      });
      const orderIds = clientOrders.map(o => o.id);
      where.orderId = { in: orderIds };
    }
    
    // Les livreurs voient seulement leurs livraisons
    if (req.user.role === 'LIVREUR') {
      where.driverId = req.user.id;
    }

    if (startDate && endDate) {
      where.deliveryDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (driverId) {
      where.driverId = driverId;
    }

    if (status) {
      where.status = status;
    }

    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        order: {
          include: {
            shop: {
              select: {
                name: true,
                address: true,
                city: true,
                postalCode: true,
                phone: true,
              },
            },
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: { deliveryDate: 'asc' },
    });

    res.json({
      success: true,
      deliveries,
    });
  } catch (error) {
    logger.error('Erreur récupération livraisons:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des livraisons',
    });
  }
});

/**
 * GET /api/deliveries/calendar
 * Vue calendrier des livraisons
 */
router.get('/calendar', authenticate, requireAdmin, async (req, res) => {
  try {
    const { start, end } = req.query;
    
    const where = {};
    if (start && end) {
      where.deliveryDate = {
        gte: new Date(start),
        lte: new Date(end),
      };
    }

    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        order: {
          include: {
            shop: {
              select: {
                name: true,
                address: true,
                city: true,
              },
            },
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { deliveryDate: 'asc' },
    });

    // Formater pour react-big-calendar
    const events = deliveries.map(delivery => ({
      id: delivery.id,
      title: `${delivery.order.shop.name} - ${delivery.order.totalTTC.toFixed(2)} €`,
      start: delivery.deliveryDate,
      end: new Date(new Date(delivery.deliveryDate).getTime() + 2 * 60 * 60 * 1000), // +2h par défaut
      resource: delivery,
    }));

    res.json({
      success: true,
      events,
    });
  } catch (error) {
    logger.error('Erreur récupération calendrier livraisons:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du calendrier',
    });
  }
});

/**
 * POST /api/deliveries
 * Planifier une livraison
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('orderId').notEmpty().withMessage('ID commande requis'),
    body('deliveryDate').isISO8601().withMessage('Date de livraison invalide'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { orderId, deliveryDate, timeSlot, driverId, notes } = req.body;

      // Vérifier que la commande existe
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Commande non trouvée',
        });
      }

      // Vérifier qu'une livraison n'existe pas déjà
      const existing = await prisma.delivery.findUnique({
        where: { orderId },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Une livraison existe déjà pour cette commande',
        });
      }

      const delivery = await prisma.delivery.create({
        data: {
          orderId,
          deliveryDate: new Date(deliveryDate),
          timeSlot: timeSlot || null,
          driverId: driverId || null,
          status: 'SCHEDULED',
          notes: notes || null,
        },
        include: {
          order: {
            include: {
              shop: {
                select: {
                  name: true,
                  address: true,
                  city: true,
                },
              },
            },
          },
          driver: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        message: 'Livraison planifiée avec succès',
        delivery,
      });
    } catch (error) {
      logger.error('Erreur planification livraison:', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la planification de la livraison',
      });
    }
  }
);

/**
 * PUT /api/deliveries/:id
 * Modifier une livraison
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { deliveryDate, timeSlot, driverId, status, notes } = req.body;

    const delivery = await prisma.delivery.findUnique({
      where: { id: req.params.id },
    });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Livraison non trouvée',
      });
    }

    // Vérifier les permissions
    if (req.user.role === 'CLIENT' && delivery.order.shopId !== req.user.shop?.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé',
      });
    }

    const updateData = {};
    if (deliveryDate !== undefined) updateData.deliveryDate = new Date(deliveryDate);
    if (timeSlot !== undefined) updateData.timeSlot = timeSlot;
    if (driverId !== undefined) updateData.driverId = driverId;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await prisma.delivery.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        order: {
          include: {
            shop: {
              select: {
                name: true,
                address: true,
                city: true,
              },
            },
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Livraison modifiée avec succès',
      delivery: updated,
    });
  } catch (error) {
    logger.error('Erreur modification livraison:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification de la livraison',
    });
  }
});

/**
 * PUT /api/deliveries/:id/assign
 * Assigner un livreur à une livraison
 */
router.put('/:id/assign', authenticate, requireAdmin, async (req, res) => {
  try {
    const { driverId } = req.body;

    if (!driverId) {
      return res.status(400).json({
        success: false,
        message: 'ID livreur requis',
      });
    }

    // Vérifier que l'utilisateur est un livreur
    const driver = await prisma.user.findUnique({
      where: { id: driverId, role: 'LIVREUR' },
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Livreur non trouvé',
      });
    }

    const delivery = await prisma.delivery.update({
      where: { id: req.params.id },
      data: {
        driverId,
      },
      include: {
        order: {
          include: {
            shop: {
              select: {
                name: true,
                address: true,
                city: true,
              },
            },
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Livreur assigné avec succès',
      delivery,
    });
  } catch (error) {
    logger.error('Erreur assignation livreur:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'assignation du livreur',
    });
  }
});

/**
 * GET /api/deliveries/:id/download-note
 * Télécharger le PDF du bon de livraison
 */
router.get('/:id/download-note', authenticate, async (req, res) => {
  try {
    const delivery = await prisma.delivery.findUnique({
      where: { id: req.params.id },
      include: {
        order: {
          include: {
            shop: true,
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Livraison non trouvée',
      });
    }

    // Vérifier les permissions
    if (req.user.role === 'CLIENT' && delivery.order.shopId !== req.user.shop?.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé',
      });
    }

    // Générer le numéro de bon de livraison s'il n'existe pas
    if (!delivery.deliveryNoteNumber) {
      let deliveryNoteNumber = generateDeliveryNoteNumber();
      let exists = await prisma.delivery.findUnique({ where: { deliveryNoteNumber } });
      while (exists) {
        deliveryNoteNumber = generateDeliveryNoteNumber();
        exists = await prisma.delivery.findUnique({ where: { deliveryNoteNumber } });
      }
      
      await prisma.delivery.update({
        where: { id: delivery.id },
        data: { deliveryNoteNumber },
      });
      delivery.deliveryNoteNumber = deliveryNoteNumber;
    }

    const pdfBuffer = await generateDeliveryNotePDF(
      delivery,
      delivery.order,
      delivery.order.shop,
      delivery.driver
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="bon-livraison-${delivery.deliveryNoteNumber || delivery.id.substring(0, 8)}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    logger.error('Erreur génération PDF bon de livraison:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du PDF',
    });
  }
});

module.exports = router;
