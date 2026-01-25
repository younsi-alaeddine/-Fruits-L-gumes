const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { authenticate, requireClient, requireRole } = require('../middleware/auth');
const { calculateOrderItemTotals, calculateOrderTotals } = require('../utils/calculations');
const { aggregateOrdersByDateAndProduct, groupBySupplier, createSupplierOrderFromAggregation } = require('../utils/orderAggregation');
const { validateTransition } = require('../middleware/orderStateMachine');
const PDFDocument = require('pdfkit');
const logger = require('../utils/logger');
const { appInfo } = require('../config/appInfo');

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
      // Phase 2: make document header configurable (deploy-safe)
      doc.fontSize(12).text(appInfo.companyName, { align: 'left' });
      doc.fontSize(10).text(appInfo.companyAddressLine1, { align: 'left' });
      doc.fontSize(10).text(appInfo.companyAddressLine2, { align: 'left' });
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
      const shopId = req.context?.activeShopId;

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

      // ✅ ADMIN est un intermédiaire (broker), pas de vérification de stock
      // Les écarts viendront des fournisseurs lors de la réception
      const stockWarnings = []; // Vide pour un intermédiaire

      // Créer la commande (sans décrémenter de stock)
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

        // ✅ ADMIN est un intermédiaire, pas de décrémentation de stock
        // Le stock sera géré par les fournisseurs

        return newOrder;
      });

      // ✅ Pas d'avertissements de stock pour un intermédiaire

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
          select: { id: true, email: true, name: true },
        });
        const shop = await prisma.shop.findUnique({
          where: { id: shopId },
          select: { id: true, name: true, city: true, address: true, postalCode: true, phone: true }
        });
        
        if (user && user.email && shop) {
          const emailService = require('../utils/emailService');
          await emailService.sendOrderConfirmationEmail(
            user.email,
            user.name,
            { ...order, shop }
          );
        }
      } catch (emailError) {
        // Ne pas faire échouer la commande si l'email échoue
        logger.warn('Erreur envoi email confirmation commande', {
          error: emailError.message,
          orderId: order.id,
        });
      }

      // Message de succès
      const message = 'Commande créée avec succès';

      res.status(201).json({
        success: true,
        message,
        order
      });
    } catch (error) {
      // SECURITY: Use logger instead of console.error to prevent sensitive data exposure
      // RISK: console.error may expose stack traces and sensitive data in production logs
      logger.error('Erreur création commande', { 
        error: error.message,
        userId: req.user?.id,
        shopId: req.context?.activeShopId 
      });
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la création de la commande' 
      });
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
    const shopIds = (req.context?.accessibleShops || []).map(s => s.id);

    if (req.user.role === 'ADMIN') {
      if (req.query.shopId) where.shopId = req.query.shopId;
      if (req.query.status) where.status = req.query.status;
      if (req.query.startDate || req.query.endDate) {
        where.createdAt = {};
        if (req.query.startDate) where.createdAt.gte = new Date(req.query.startDate);
        if (req.query.endDate) {
          const endDate = new Date(req.query.endDate);
          endDate.setHours(23, 59, 59, 999);
          where.createdAt.lte = endDate;
        }
      }
    } else {
      // Non-ADMIN: restrict to accessible shops (IDOR fix)
      if (shopIds.length === 0) {
        return res.status(400).json({ success: false, message: 'Magasin non trouvé' });
      }
      const scope = req.query.scope === 'org' ? 'org' : 'shop';
      if (scope === 'org') {
        where.shopId = { in: shopIds };
      } else {
        const activeShopId = req.context?.activeShopId;
        if (!activeShopId) {
          return res.status(400).json({ success: false, message: 'Magasin non trouvé' });
        }
        where.shopId = activeShopId;
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
    // SECURITY: Use logger instead of console.error to prevent sensitive data exposure
    logger.error('Erreur récupération commandes', { 
      error: error.message,
      userId: req.user?.id,
      role: req.user?.role 
    });
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur' 
    });
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
    // SECURITY: Validate UUID format to prevent injection attacks
    // RISK: Invalid UUID format could cause database errors or expose information
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(req.params.id)) {
      return res.status(400).json({ 
        success: false,
        message: 'ID de commande invalide' 
      });
    }

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

    // Access control: ADMIN all, others only own shops (IDOR fix)
    const canAccess = req.user.role === 'ADMIN' ||
      (req.context?.accessibleShops || []).some(s => s.id === order.shopId);
    if (!canAccess) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    res.json({ 
      success: true,
      order 
    });
  } catch (error) {
    // SECURITY: Use logger instead of console.error to prevent sensitive data exposure
    // RISK: console.error may expose stack traces and sensitive data in production logs
    logger.error('Erreur récupération commande', { 
      error: error.message,
      orderId: req.params.id,
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
    body('status').isIn(['NEW', 'AGGREGATED', 'SUPPLIER_ORDERED', 'PREPARATION', 'LIVRAISON', 'LIVREE', 'ANNULEE']).withMessage('Statut invalide'),
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
          items: {
            include: {
              product: true
            }
          }
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

      // ✅ NOUVEAU : Mettre à jour le stock du magasin quand la commande est livrée
      if (newStatus === 'LIVREE' && oldStatus !== 'LIVREE') {
        try {
          for (const item of updatedOrder.items) {
            // Utiliser quantityDelivered si disponible, sinon quantity
            const quantityToAdd = item.quantityDelivered || item.quantity || 0;
            
            if (quantityToAdd > 0 && item.productId) {
              // Mettre à jour ou créer le stock du magasin
              await prisma.shopStock.upsert({
                where: {
                  shopId_productId: {
                    shopId: order.shopId,
                    productId: item.productId,
                  },
                },
                update: {
                  quantity: {
                    increment: quantityToAdd,
                  },
                },
                create: {
                  shopId: order.shopId,
                  productId: item.productId,
                  quantity: quantityToAdd,
                  threshold: item.product.stockAlert || 10,
                },
              });
              
              logger.info('Stock magasin mis à jour après livraison', {
                shopId: order.shopId,
                productId: item.productId,
                quantityAdded: quantityToAdd,
                orderId: order.id,
              });
            }
          }
        } catch (stockError) {
          logger.error('Erreur mise à jour stock magasin après livraison', {
            error: stockError.message,
            orderId: order.id,
            shopId: order.shopId,
          });
          // Ne pas bloquer la réponse, juste logger l'erreur
        }
      }

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
      logger.error('Erreur modification statut', { error: error.message, orderId: req.params?.id });
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
    // SECURITY: Validate UUID format to prevent injection attacks
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de commande invalide'
      });
    }

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

    const canAccess = req.user.role === 'ADMIN' ||
      (req.context?.accessibleShops || []).some(s => s.id === order.shopId);
    if (!canAccess) {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
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

/**
 * POST /api/orders/export
 * Export d'une commande en Excel/CSV
 * SECURITY: Duplicate route removed - see route below for actual implementation
 */
// REMOVED: Duplicate route definition - keeping the more complete version below
// router.post('/export', authenticate, requireClient, async (req, res) => {
//   // ... removed (duplicate) ...
// });

/**
 * POST /api/orders/export
 * Export d'une commande en Excel
 * SECURITY: Validates product IDs to prevent unauthorized access
 * RISK: Without validation, users could export data for products they shouldn't access
 */
router.post('/export', authenticate, requireClient, async (req, res) => {
  try {
    // SECURITY: Validate input to prevent injection and ensure data integrity
    // RISK: Missing validation could allow invalid data or unauthorized access
    const { items, orderDate, deliveryDate, pricingType } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun produit à exporter'
      });
    }

    // SECURITY: Validate product IDs are UUIDs to prevent injection
    // RISK: Invalid IDs could cause database errors or expose information
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const productIds = items.map(item => item.productId).filter(Boolean);
    
    if (productIds.some(id => !uuidRegex.test(id))) {
      return res.status(400).json({
        success: false,
        message: 'Format d\'ID produit invalide'
      });
    }

    // Récupérer les produits - only visible and active products for clients
    // SECURITY: Filter by isVisibleToClients to prevent access to hidden products
    // RISK: Without this filter, clients could see products they shouldn't access
    const products = await prisma.product.findMany({
      where: { 
        id: { in: productIds },
        isActive: true,
        isVisibleToClients: true
      }
    });
    
    // SECURITY: Verify all requested products were found and are accessible
    // RISK: Missing products could indicate unauthorized access attempt
    if (products.length !== productIds.length) {
      logger.warn('Tentative d\'export de produits non accessibles', {
        userId: req.user.id,
        requestedIds: productIds,
        foundIds: products.map(p => p.id)
      });
      return res.status(403).json({
        success: false,
        message: 'Certains produits ne sont pas accessibles'
      });
    }

    // Créer le fichier Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Commande');

    // En-têtes
    worksheet.columns = [
      { header: 'Libellé produit', key: 'name', width: 30 },
      { header: 'Origine', key: 'origin', width: 15 },
      { header: 'Conditionnement', key: 'packaging', width: 15 },
      { header: 'Présentation', key: 'presentation', width: 15 },
      { header: 'Qté demandée', key: 'quantity', width: 12 },
      { header: 'Qté promo', key: 'quantityPromo', width: 12 },
      { header: 'Qté commandée', key: 'quantityOrdered', width: 12 },
      { header: 'Prix HT', key: 'priceHT', width: 12 },
      { header: 'Total HT', key: 'totalHT', width: 12 }
    ];

    // Données
    items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const priceHT = pricingType === 'T2' && product.priceHT_T2 
          ? product.priceHT_T2 
          : product.priceHT;
        const totalHT = priceHT * (item.quantity || 0);
        
        worksheet.addRow({
          name: product.name,
          origin: product.origin || '-',
          packaging: product.packaging || product.unit || '-',
          presentation: product.presentation || '-',
          quantity: item.quantity || 0,
          quantityPromo: item.quantityPromo || 0,
          quantityOrdered: item.quantityOrdered || item.quantity || 0,
          priceHT: priceHT.toFixed(2),
          totalHT: totalHT.toFixed(2)
        });
      }
    });

    // Style de l'en-tête
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF28A745' }
    };
    worksheet.getRow(1).font = { ...worksheet.getRow(1).font, color: { argb: 'FFFFFFFF' } };

    // Générer le buffer
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=commande-${orderDate || new Date().toISOString().split('T')[0]}.xlsx`);
    res.send(buffer);
  } catch (error) {
    // SECURITY: Log error without exposing sensitive data
    // RISK: Error details could expose system internals
    logger.error('Erreur export commande', { 
      error: error.message,
      userId: req.user?.id 
    });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'export'
    });
  }
});

/**
 * POST /api/orders/aggregate
 * Agrège les commandes NEW par date de livraison
 * ADMIN uniquement
 */
router.post(
  '/aggregate',
  authenticate,
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const { deliveryDate } = req.body;
      
      if (!deliveryDate) {
        return res.status(400).json({
          success: false,
          message: 'Date de livraison requise'
        });
      }
      
      // Récupérer toutes les commandes NEW pour cette date
      const orders = await prisma.order.findMany({
        where: {
          status: 'NEW',
          deliveryDate: new Date(deliveryDate)
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
      
      if (orders.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Aucune commande NEW trouvée pour cette date'
        });
      }
      
      // Agréger
      const aggregated = await aggregateOrdersByDateAndProduct(orders, new Date(deliveryDate));
      
      // Mettre à jour statuts des commandes
      await prisma.order.updateMany({
        where: {
          id: { in: orders.map(o => o.id) }
        },
        data: {
          status: 'AGGREGATED',
          aggregatedAt: new Date()
        }
      });
      
      logger.info('Commandes agrégées', {
        ordersCount: orders.length,
        deliveryDate,
        aggregatedItemsCount: aggregated.length
      });
      
      res.json({
        success: true,
        data: {
          ordersCount: orders.length,
          aggregatedItems: aggregated,
          deliveryDate
        }
      });
    } catch (error) {
      logger.error('Erreur agrégation commandes', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'agrégation',
        error: error.message
      });
    }
  }
);

/**
 * POST /api/orders/aggregated/create-supplier-order
 * Crée une commande fournisseur depuis les commandes agrégées
 * ADMIN uniquement
 */
router.post(
  '/aggregated/create-supplier-order',
  authenticate,
  requireRole('ADMIN'),
  async (req, res) => {
    try {
      const { supplierId, deliveryDate } = req.body;
      
      if (!supplierId || !deliveryDate) {
        return res.status(400).json({
          success: false,
          message: 'supplierId et deliveryDate requis'
        });
      }
      
      // Récupérer commandes AGGREGATED pour cette date
      const orders = await prisma.order.findMany({
        where: {
          status: 'AGGREGATED',
          deliveryDate: new Date(deliveryDate)
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  supplierProducts: {
                    include: { supplier: true }
                  }
                }
              }
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
      
      if (orders.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Aucune commande AGGREGATED trouvée pour cette date'
        });
      }
      
      // Agréger
      const aggregated = await aggregateOrdersByDateAndProduct(orders, new Date(deliveryDate));
      
      // Grouper par fournisseur
      const grouped = await groupBySupplier(aggregated);
      
      if (!grouped[supplierId]) {
        return res.status(404).json({
          success: false,
          message: `Aucune commande agrégée pour ce fournisseur (ID: ${supplierId})`
        });
      }
      
      // Créer commande fournisseur
      const supplierOrder = await createSupplierOrderFromAggregation(
        grouped[supplierId],
        supplierId,
        req.user.id
      );
      
      // Mettre à jour statuts des commandes liées
      const orderIds = grouped[supplierId].items.flatMap(item => 
        item.orders.map(o => o.orderId)
      );
      
      await prisma.order.updateMany({
        where: {
          id: { in: orderIds }
        },
        data: {
          status: 'SUPPLIER_ORDERED',
          supplierOrderId: supplierOrder.id
        }
      });
      
      logger.info('Commande fournisseur créée depuis agrégation', {
        supplierOrderId: supplierOrder.id,
        supplierId,
        ordersCount: orderIds.length
      });
      
      res.json({
        success: true,
        data: supplierOrder
      });
    } catch (error) {
      logger.error('Erreur création commande fournisseur', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création',
        error: error.message
      });
    }
  }
);

module.exports = router;

