const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { authenticate, requireClient } = require('../middleware/auth');
const { calculateOrderItemTotals, calculateOrderTotals } = require('../utils/calculations');
const PDFDocument = require('pdfkit');
const logger = require('../utils/logger');

/**
 * Générer un numéro de bon de commande unique
 */
const generateOrderNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CMD-${year}${month}-${random}`;
};

/**
 * Générer le PDF du bon de commande
 */
const generateOrderConfirmationPDF = async (order, shop) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // En-tête
      doc.fontSize(20).text('BON DE COMMANDE', { align: 'center' });
      doc.moveDown();
      
      // Informations entreprise
      doc.fontSize(12).text('Distribution Fruits & Légumes', { align: 'left' });
      doc.fontSize(10).text('123 Rue des Fruits', { align: 'left' });
      doc.fontSize(10).text('75000 Paris, France', { align: 'left' });
      doc.moveDown();

      // Numéro de commande et date
      doc.fontSize(10);
      doc.text(`Numéro: ${order.orderNumber || order.id.substring(0, 8)}`, { align: 'right' });
      doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('fr-FR')}`, { align: 'right' });
      doc.moveDown(2);

      // Informations client
      doc.fontSize(12).text('Commande pour:', { underline: true });
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
      
      doc.fontSize(10).font('Helvetica');
      doc.moveDown(2);
      
      // Statut
      doc.fontSize(10).text(`Statut: ${order.status}`, { underline: true });
      doc.moveDown();
      
      // Conditions
      doc.fontSize(10).text('Conditions:', { underline: true });
      doc.text('Cette commande sera préparée et livrée selon les modalités convenues.');
      doc.text('Vous serez informé de l\'avancement de votre commande.');
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Liste des commandes
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Nombre d'éléments par page
 *     responses:
 *       200:
 *         description: Liste des commandes
 *   post:
 *     summary: Créer une commande (CLIENT uniquement)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: number
 *     responses:
 *       201:
 *         description: Commande créée avec succès
 *       400:
 *         description: Erreur de validation ou stock insuffisant
 *       403:
 *         description: Accès refusé - Client requis
 */
router.post(
  '/',
  authenticate,
  requireClient,
  [
    body('items').isArray({ min: 1 }).withMessage('Au moins un produit est requis'),
    body('items.*.productId').notEmpty().withMessage('ID produit requis'),
    body('items.*.quantity').isFloat({ min: 0.01 }).withMessage('Quantité invalide'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { items } = req.body;
      const shopId = req.user.shop?.id;

      if (!shopId) {
        return res.status(400).json({ message: 'Magasin non trouvé pour cet utilisateur' });
      }

      // Récupérer les produits et vérifier qu'ils sont actifs et visibles pour les clients
      const productIds = items.map(item => item.productId);
      const products = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          isActive: true,
          isVisibleToClients: true
        }
      });

      if (products.length !== productIds.length) {
        return res.status(400).json({ message: 'Un ou plusieurs produits ne sont pas disponibles' });
      }

      // Créer les items de commande avec calculs
      const orderItems = items.map(item => {
        const product = products.find(p => p.id === item.productId);
        const totals = calculateOrderItemTotals(
          parseFloat(item.quantity),
          product.priceHT,
          product.tvaRate
        );

        return {
          productId: product.id,
          quantity: parseFloat(item.quantity),
          priceHT: product.priceHT,
          ...totals
        };
      });

      // Calculer les totaux de la commande
      const orderTotals = calculateOrderTotals(orderItems);

      // Vérifier le stock disponible pour chaque produit (sans bloquer la commande)
      // Permettre les commandes même si le stock est insuffisant ou nul
      const stockWarnings = [];
      for (const item of orderItems) {
        const product = products.find(p => p.id === item.productId);
        
        // Vérifier si le stock est insuffisant ou nul
        if (product.stock < item.quantity) {
          if (product.stock === 0) {
            stockWarnings.push({
              productId: product.id,
              productName: product.name,
              requested: item.quantity,
              available: 0,
              needsPreparation: true
            });
          } else if (product.stock < item.quantity) {
            stockWarnings.push({
              productId: product.id,
              productName: product.name,
              requested: item.quantity,
              available: product.stock,
              needsPreparation: true
            });
          }
        }
      }

      // Créer la commande et mettre à jour le stock dans une transaction
      const order = await prisma.$transaction(async (tx) => {
        // Créer la commande
        const newOrder = await tx.order.create({
          data: {
            shopId,
            status: 'NEW',
            ...orderTotals,
            items: {
              create: orderItems
            }
          },
          include: {
            items: {
              include: {
                product: true
              }
            },
            shop: {
              select: {
                id: true,
                name: true,
                city: true
              }
            }
          }
        });

        // Mettre à jour le stock pour chaque produit
        // Ne décrémenter que le stock disponible (ne pas aller en négatif)
        for (const item of orderItems) {
          const product = products.find(p => p.id === item.productId);
          const availableStock = Math.max(0, product.stock);
          const stockToDecrement = Math.min(item.quantity, availableStock);
          
          if (stockToDecrement > 0) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  decrement: stockToDecrement
                }
              }
            });
          }
        }

        return newOrder;
      });

      // Ajouter les avertissements de stock à la réponse
      if (stockWarnings.length > 0) {
        order.stockWarnings = stockWarnings;
      }

      // Créer une notification pour les admins
      try {
        const notificationService = require('../utils/notificationService');
        await notificationService.notifyNewOrder(order);
      } catch (notifError) {
        logger.warn('Erreur création notification nouvelle commande', {
          error: notifError.message,
          orderId: order.id,
        });
      }

      // Envoyer email de confirmation au client
      try {
        const user = await prisma.user.findUnique({
          where: { id: req.user.id },
          include: { shop: true },
        });
        
        if (user && user.email) {
          const emailService = require('../utils/emailService');
          await emailService.sendOrderConfirmationEmail(
            user.email,
            user.name,
            order
          );
        }
      } catch (emailError) {
        // Ne pas faire échouer la commande si l'email échoue
        logger.warn('Erreur envoi email confirmation commande', {
          error: emailError.message,
          orderId: order.id,
        });
      }

      // Message de succès avec avertissement si nécessaire
      let message = 'Commande créée avec succès';
      if (stockWarnings.length > 0) {
        const productsNeedingPrep = stockWarnings.map(w => w.productName).join(', ');
        message += `. Note: ${stockWarnings.length} produit(s) nécessitent une préparation (${productsNeedingPrep})`;
      }

      res.status(201).json({
        success: true,
        message,
        order,
        stockWarnings: stockWarnings.length > 0 ? stockWarnings : undefined
      });
    } catch (error) {
      console.error('Erreur création commande:', error);
      res.status(500).json({ message: 'Erreur lors de la création de la commande' });
    }
  }
);

/**
 * GET /api/orders
 * Liste des commandes de l'utilisateur connecté
 */
router.get('/', authenticate, async (req, res) => {
  try {
    let where = {};

    // Les clients voient uniquement leurs commandes
    if (req.user.role === 'CLIENT') {
      if (!req.user.shop?.id) {
        return res.status(400).json({ 
          success: false,
          message: 'Magasin non trouvé' 
        });
      }
      where.shopId = req.user.shop.id;
    }

    // Filtres optionnels pour les admins
    if (req.user.role === 'ADMIN') {
      if (req.query.shopId) where.shopId = req.query.shopId;
      if (req.query.status) where.status = req.query.status;
      if (req.query.startDate || req.query.endDate) {
        where.createdAt = {};
        if (req.query.startDate) {
          where.createdAt.gte = new Date(req.query.startDate);
        }
        if (req.query.endDate) {
          const endDate = new Date(req.query.endDate);
          endDate.setHours(23, 59, 59, 999);
          where.createdAt.lte = endDate;
        }
      }
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const total = await prisma.order.count({ where });

    const orders = await prisma.order.findMany({
      where,
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            city: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                unit: true
              }
            }
          }
        },
        recurringOrder: {
          select: {
            id: true,
            name: true,
            frequency: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Format de réponse paginée
    const totalPages = Math.ceil(total / limit);
    res.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Erreur récupération commandes:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Détails d'une commande
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Détails de la commande récupérés avec succès
 *       404:
 *         description: Commande non trouvée
 *       403:
 *         description: Accès refusé
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            postalCode: true,
            phone: true
          }
        },
        items: {
          include: {
            product: true
          }
        },
        recurringOrder: {
          select: {
            id: true,
            name: true,
            frequency: true
          }
        },
        payments: true
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    // Vérifier que le client ne peut voir que ses propres commandes
    if (req.user.role === 'CLIENT' && order.shopId !== req.user.shop?.id) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Erreur récupération commande:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     summary: Modifier le statut d'une commande (ADMIN uniquement)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [NEW, PREPARATION, LIVRAISON, LIVREE, ANNULEE]
 *     responses:
 *       200:
 *         description: Statut modifié avec succès
 *       400:
 *         description: Erreur de validation
 *       403:
 *         description: Accès refusé - Admin requis
 */
router.put(
  '/:id/status',
  authenticate,
  require('../middleware/auth').requireAdmin,
  [
    body('status').isIn(['NEW', 'PREPARATION', 'LIVRAISON', 'LIVREE', 'ANNULEE']).withMessage('Statut invalide'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const order = await prisma.order.findUnique({
        where: { id: req.params.id },
        include: {
          shop: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!order) {
        return res.status(404).json({ 
          success: false,
          message: 'Commande non trouvée' 
        });
      }

      const oldStatus = order.status;
      const newStatus = req.body.status;

      const updatedOrder = await prisma.order.update({
        where: { id: req.params.id },
        data: { status: newStatus },
        include: {
          shop: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          items: {
            include: {
              product: true
            }
          }
        }
      });

      // Créer une notification si le statut a changé
      if (oldStatus !== newStatus) {
        try {
          const notificationService = require('../utils/notificationService');
          await notificationService.notifyOrderStatusChanged(
            updatedOrder,
            oldStatus,
            newStatus,
            req.user.id
          );
        } catch (notifError) {
          logger.warn('Erreur création notification changement statut', {
            error: notifError.message,
            orderId: order.id,
          });
        }
      }

      // Envoyer email de notification si le statut a changé
      if (oldStatus !== newStatus && order.shop?.user?.email) {
        try {
          const emailService = require('../utils/emailService');
          await emailService.sendOrderStatusChangeEmail(
            order.shop.user.email,
            order.shop.user.name,
            updatedOrder,
            oldStatus,
            newStatus
          );
        } catch (emailError) {
          const logger = require('../utils/logger');
          logger.warn('Erreur envoi email changement statut', {
            error: emailError.message,
            orderId: order.id,
          });
        }
      }

      // Logger l'action
      const { logAction } = require('../utils/auditTrail');
      await logAction('UPDATE', 'Order', order.id, req.user.id, {
        field: 'status',
        oldValue: oldStatus,
        newValue: newStatus,
      }, req);

      res.json({
        success: true,
        message: 'Statut de la commande modifié',
        order: updatedOrder
      });
    } catch (error) {
      console.error('Erreur modification statut:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
);

/**
 * GET /api/orders/:id/download-confirmation
 * Télécharger le PDF du bon de commande
 */
router.get('/:id/download-confirmation', authenticate, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
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

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée',
      });
    }

    // Vérifier les permissions
    if (req.user.role === 'CLIENT' && order.shopId !== req.user.shop?.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé',
      });
    }

    // Générer le numéro de commande s'il n'existe pas
    if (!order.orderNumber) {
      let orderNumber = generateOrderNumber();
      let exists = await prisma.order.findUnique({ where: { orderNumber } });
      while (exists) {
        orderNumber = generateOrderNumber();
        exists = await prisma.order.findUnique({ where: { orderNumber } });
      }
      
      await prisma.order.update({
        where: { id: order.id },
        data: { orderNumber },
      });
      order.orderNumber = orderNumber;
    }

    const pdfBuffer = await generateOrderConfirmationPDF(order, order.shop);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="bon-commande-${order.orderNumber || order.id.substring(0, 8)}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    logger.error('Erreur génération PDF bon de commande:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du PDF',
    });
  }
});

module.exports = router;

