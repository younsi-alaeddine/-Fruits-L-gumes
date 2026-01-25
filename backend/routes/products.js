const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { validateFile } = require('../middleware/fileValidation');
const { uploadLimiter } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');
const { logAction } = require('../utils/auditTrail');
const { detectSubCategory, CATEGORIES_CONFIG } = require('../config/categories');

// Configuration Multer pour l'upload de photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/products');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'));
    }
  }
});

/**
 * GET /api/products/search
 * Recherche améliorée par nom, gencod, barcode
 */
router.get('/search', authenticate, async (req, res) => {
  try {
    const { q, gencod, barcode } = req.query;
    
    if (gencod || barcode) {
      // Recherche par code
      const product = await prisma.product.findFirst({
        where: {
          OR: [
            gencod ? { gencod: { contains: gencod, mode: 'insensitive' } } : {},
            barcode ? { barcode: { contains: barcode } } : {}
          ],
          isActive: true,
          isVisibleToClients: true
        },
        include: {
          customCategory: true,
          customSubCategory: true
        }
      });
      
      if (product) {
        return res.json({
          success: true,
          product
        });
      }
    }
    
    // Recherche par nom/libellé
    if (q) {
      const products = await prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { gencod: { contains: q, mode: 'insensitive' } },
            { barcode: { contains: q } }
          ],
          isActive: true,
          isVisibleToClients: true
        },
        include: {
          customCategory: true,
          customSubCategory: true
        },
        take: 50
      });
      
      return res.json({
        success: true,
        products
      });
    }
    
    res.json({
      success: false,
      message: 'Paramètre de recherche manquant'
    });
  } catch (error) {
    logger.error('Erreur recherche produits', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche'
    });
  }
});

/**
 * GET /api/products/search
 * Recherche améliorée par nom, gencod, barcode
 */
router.get('/search', authenticate, async (req, res) => {
  try {
    const { q, gencod, barcode } = req.query;
    
    if (gencod || barcode) {
      // Recherche par code
      const product = await prisma.product.findFirst({
        where: {
          OR: [
            gencod ? { gencod: { contains: gencod, mode: 'insensitive' } } : {},
            barcode ? { barcode: { contains: barcode } } : {}
          ],
          isActive: true,
          isVisibleToClients: true
        },
        include: {
          customCategory: true,
          customSubCategory: true
        }
      });
      
      if (product) {
        return res.json({
          success: true,
          product
        });
      }
    }
    
    // Recherche par nom/libellé
    if (q) {
      const products = await prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { gencod: { contains: q, mode: 'insensitive' } },
            { barcode: { contains: q } }
          ],
          isActive: true,
          isVisibleToClients: true
        },
        include: {
          customCategory: true,
          customSubCategory: true
        },
        take: 50
      });
      
      return res.json({
        success: true,
        products
      });
    }
    
    res.json({
      success: false,
      message: 'Paramètre de recherche manquant'
    });
  } catch (error) {
    logger.error('Erreur recherche produits', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche'
    });
  }
});

/**
 * GET /api/products/categories
 * Liste des catégories et sous-catégories disponibles
 */
router.get('/categories', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      categories: CATEGORIES_CONFIG
    });
  } catch (error) {
    logger.error('Erreur récupération catégories:', { error: error.message });
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * GET /api/products
 * Liste des produits actifs (pour les clients)
 * Liste de tous les produits (pour les admins)
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'ADMIN';
    
    // Construire la clause where
    // Pour les clients : seulement les produits actifs ET visibles pour les clients
    // Pour les admins : tous les produits
    let where = isAdmin ? {} : { 
      isActive: true,
      isVisibleToClients: true 
    };
    
    // Filtres optionnels (admin uniquement)
    if (isAdmin) {
      if (req.query.search) {
        // Recherche insensible à la casse (PostgreSQL avec Prisma)
        where.name = { contains: req.query.search, mode: 'insensitive' };
      }
      if (req.query.category && req.query.category !== 'TOUS') {
        // Détecter si c'est un UUID (nouvelle gestion de catégories) ou un enum (ancienne)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(req.query.category)) {
          where.categoryId = req.query.category;
        } else {
          where.category = req.query.category;
        }
      }
      if (req.query.subCategory && req.query.subCategory !== 'TOUS') {
        // Détecter si c'est un UUID (nouvelle gestion) ou un string (ancienne)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(req.query.subCategory)) {
          where.subCategoryId = req.query.subCategory;
        } else {
          where.subCategory = req.query.subCategory;
        }
      }
      if (req.query.isActive !== undefined) {
        where.isActive = req.query.isActive === 'true';
      }
      if (req.query.isVisibleToClients !== undefined) {
        where.isVisibleToClients = req.query.isVisibleToClients === 'true';
      }
    }
    
    // Ne pas utiliser deletedAt pour l'instant car le client Prisma n'a pas été régénéré
    // Pour activer le soft delete, exécutez: npx prisma generate

    // Tri
    const sortField = req.query.sortField || 'createdAt';
    const sortOrder = req.query.sortOrder || 'desc';
    const orderBy = {};
    
    // Vérifier que le champ de tri est valide
    const validSortFields = ['name', 'priceHT', 'tvaRate', 'category', 'stock', 'createdAt', 'updatedAt'];
    if (validSortFields.includes(sortField)) {
      orderBy[sortField] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Compter le total
    const total = await prisma.product.count({ where });

    const products = await prisma.product.findMany({
      where,
      include: {
        customCategory: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          },
        },
        customSubCategory: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    // Stock agrégé magasins (ShopStock) pour Admin
    let stockByProduct = {};
    if (isAdmin && products.length > 0) {
      const productIds = products.map((p) => p.id);
      const agg = await prisma.shopStock.groupBy({
        by: ['productId'],
        where: { productId: { in: productIds } },
        _sum: { quantity: true },
      });
      agg.forEach((row) => {
        stockByProduct[row.productId] = Number(row._sum.quantity) || 0;
      });
    }

    const tva = (r) => (r != null && !Number.isNaN(r)) ? r : 5.5;
    const ht = (p) => (p != null && !Number.isNaN(p)) ? p : 0;

    const productsWithTTC = products.map((product) => {
      const priceHT = ht(product.priceHT);
      const tvaRate = tva(product.tvaRate);
      return {
        ...product,
        priceTTC: Math.round(priceHT * (1 + tvaRate / 100) * 100) / 100,
        totalShopStock: isAdmin ? (stockByProduct[product.id] ?? 0) : undefined,
      };
    });

    // Format de réponse paginée
    const totalPages = Math.ceil(total / limit);
    const response = {
      success: true,
      products: productsWithTTC,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Erreur récupération produits:', { error: error.message, stack: error.stack });
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/products/:id
 * Détails d'un produit
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    // SECURITY: Validate UUID format to prevent injection attacks
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(req.params.id)) {
      return res.status(400).json({ 
        success: false,
        message: 'ID de produit invalide' 
      });
    }

    const product = await prisma.product.findUnique({
      where: { id: req.params.id }
    });

    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    // Vérifier que le produit est actif et visible pour les clients
    if (req.user.role === 'CLIENT' && (!product.isActive || !product.isVisibleToClients)) {
      return res.status(404).json({ message: 'Produit non disponible' });
    }

    const productWithTTC = {
      ...product,
      priceTTC: Math.round(product.priceHT * (1 + product.tvaRate / 100) * 100) / 100
    };

    res.json({ product: productWithTTC });
  } catch (error) {
    logger.error('Erreur récupération produit:', { error: error.message, stack: error.stack, productId: req.params.id });
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Liste des produits
 *     tags: [Products]
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
 *         description: Liste des produits
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 pagination:
 *                   type: object
 *   post:
 *     summary: Créer un produit (ADMIN uniquement)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - priceHT
 *             properties:
 *               name:
 *                 type: string
 *               priceHT:
 *                 type: number
 *               tvaRate:
 *                 type: number
 *               unit:
 *                 type: string
 *               category:
 *                 type: string
 *               stock:
 *                 type: number
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Produit créé avec succès
 *       400:
 *         description: Erreur de validation
 *       403:
 *         description: Accès refusé - Admin requis
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  uploadLimiter,
  upload.single('photo'),
  validateFile,
  [
    body('name').trim().notEmpty().withMessage('Le nom est requis'),
    body('priceHT').isFloat({ min: 0 }).withMessage('Prix HT invalide'),
    body('tvaRate').isFloat({ min: 0, max: 100 }).withMessage('Taux TVA invalide'),
    body('unit').isIn(['kg', 'caisse', 'piece', 'botte']).withMessage('Unité invalide'),
    body('category').optional().isIn(['FRUITS', 'LEGUMES', 'HERBES', 'FRUITS_SECS']).withMessage('Catégorie invalide'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

          const { name, priceHT, tvaRate, unit, category, categoryId, subCategory, subCategoryId, isActive, stock, stockAlert } = req.body;
          const photoUrl = req.file ? `/uploads/products/${req.file.filename}` : null;
          
          const productData = {
            name,
            priceHT: parseFloat(priceHT),
            tvaRate: parseFloat(tvaRate || 5.5),
            unit: unit || 'kg',
            isActive: isActive !== undefined ? isActive === 'true' : true,
            stock: stock !== undefined ? parseFloat(stock) : 0,
            stockAlert: stockAlert !== undefined ? parseFloat(stockAlert) : 10,
            photoUrl
          };

          // Si on utilise une catégorie personnalisée
          if (categoryId) {
            productData.categoryId = categoryId;
            if (subCategoryId) {
              productData.subCategoryId = subCategoryId;
            }
            // Catégories par défaut vides pour les produits avec catégories personnalisées
            productData.category = 'FRUITS'; // Valeur par défaut pour rétrocompatibilité
          } else {
            // Utiliser les catégories par défaut
            productData.category = category || 'FRUITS';
            const detectedSubCategory = subCategory || detectSubCategory(name, productData.category);
            if (detectedSubCategory) {
              productData.subCategory = detectedSubCategory;
            }
          }

          const product = await prisma.product.create({
            data: productData
          });

      // Logger l'action
      await logAction('CREATE', 'Product', product.id, req.user.id, {
        productName: product.name,
      }, req);

      res.status(201).json({
        success: true,
        message: 'Produit créé avec succès',
        product: {
          ...product,
          priceTTC: Math.round(product.priceHT * (1 + product.tvaRate / 100) * 100) / 100
        }
      });
    } catch (error) {
      logger.error('Erreur création produit:', { error: error.message, stack: error.stack });
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la création du produit',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Modifier un produit (ADMIN uniquement)
 *     tags: [Products]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               priceHT:
 *                 type: number
 *               tvaRate:
 *                 type: number
 *               unit:
 *                 type: string
 *               category:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               isVisibleToClients:
 *                 type: boolean
 *               stock:
 *                 type: number
 *               stockAlert:
 *                 type: number
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Produit modifié avec succès
 *       403:
 *         description: Accès refusé - Admin requis
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  uploadLimiter,
  upload.single('photo'),
  validateFile,
  [
    body('name').optional().trim().notEmpty(),
    body('priceHT').optional().isFloat({ min: 0 }),
    body('tvaRate').optional().isFloat({ min: 0, max: 100 }),
        body('unit').optional().isIn(['kg', 'caisse', 'piece', 'botte']),
        body('category').optional().isIn(['FRUITS', 'LEGUMES', 'HERBES', 'FRUITS_SECS']),
        body('stock').optional().isFloat({ min: 0 }),
        body('stockAlert').optional().isFloat({ min: 0 }),
      ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const product = await prisma.product.findUnique({
        where: { id: req.params.id }
      });

      if (!product) {
        return res.status(404).json({ message: 'Produit non trouvé' });
      }

          const updateData = {};
          if (req.body.name) {
            updateData.name = req.body.name;
            // Re-détecter la sous-catégorie si le nom change
            if (!req.body.subCategory && req.body.category) {
              updateData.subCategory = detectSubCategory(req.body.name, req.body.category);
            }
          }
          if (req.body.priceHT) updateData.priceHT = parseFloat(req.body.priceHT);
          if (req.body.tvaRate) updateData.tvaRate = parseFloat(req.body.tvaRate);
          if (req.body.unit) updateData.unit = req.body.unit;
          if (req.body.category) {
            updateData.category = req.body.category;
            // Re-détecter la sous-catégorie si la catégorie change
            if (!req.body.subCategory) {
              updateData.subCategory = detectSubCategory(req.body.name || product.name, req.body.category);
            }
          }
          // Gestion des catégories personnalisées
          if (req.body.categoryId !== undefined) {
            updateData.categoryId = req.body.categoryId || null;
            updateData.subCategoryId = req.body.subCategoryId || null;
            if (req.body.categoryId) {
              updateData.subCategory = null; // Nettoyer les anciennes catégories par défaut
            }
          }
          if (req.body.subCategoryId !== undefined && req.body.categoryId) {
            updateData.subCategoryId = req.body.subCategoryId || null;
          }
          if (req.body.subCategory !== undefined && !req.body.categoryId) {
            updateData.subCategory = req.body.subCategory;
          }
          if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive === 'true';
          if (req.body.isVisibleToClients !== undefined) updateData.isVisibleToClients = req.body.isVisibleToClients === 'true';
          if (req.body.stock !== undefined) updateData.stock = parseFloat(req.body.stock);
          if (req.body.stockAlert !== undefined) updateData.stockAlert = parseFloat(req.body.stockAlert);

      if (req.file) {
        // Supprimer l'ancienne photo si elle existe
        if (product.photoUrl) {
          const oldPhotoPath = path.join(__dirname, '..', product.photoUrl);
          if (fs.existsSync(oldPhotoPath)) {
            fs.unlinkSync(oldPhotoPath);
          }
        }
        updateData.photoUrl = `/uploads/products/${req.file.filename}`;
      }

      const updatedProduct = await prisma.product.update({
        where: { id: req.params.id },
        data: updateData
      });

      res.json({
        message: 'Produit modifié avec succès',
        product: {
          ...updatedProduct,
          priceTTC: Math.round(updatedProduct.priceHT * (1 + updatedProduct.tvaRate / 100) * 100) / 100
        }
      });
    } catch (error) {
      console.error('Erreur modification produit:', error);
      res.status(500).json({ message: 'Erreur lors de la modification du produit' });
    }
  }
);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Supprimer un produit (soft delete) (ADMIN uniquement)
 *     tags: [Products]
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
 *         description: Produit supprimé avec succès
 *       404:
 *         description: Produit non trouvé
 *       403:
 *         description: Accès refusé - Admin requis
 */
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    // SECURITY: Validate UUID format to prevent injection attacks
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(req.params.id)) {
      return res.status(400).json({ 
        success: false,
        message: 'ID de produit invalide' 
      });
    }

    const { softDelete } = require('../utils/softDelete');
    
    const product = await prisma.product.findUnique({
      where: { id: req.params.id }
    });

    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Produit non trouvé' 
      });
    }

    if (product.deletedAt) {
      return res.status(400).json({ 
        success: false,
        message: 'Produit déjà supprimé' 
      });
    }

    // Soft delete
    await softDelete('product', req.params.id);

    // Logger l'action
    await logAction('DELETE', 'Product', req.params.id, req.user.id, {
      productName: product.name,
    }, req);

    res.json({ 
      success: true,
      message: 'Produit supprimé avec succès' 
    });
  } catch (error) {
    logger.error('Erreur suppression produit:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur' 
    });
  }
});

/**
 * @swagger
 * /api/products/{id}/toggle-visibility:
 *   put:
 *     summary: Basculer la visibilité d'un produit pour les clients (ADMIN uniquement)
 *     tags: [Products]
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
 *         description: Visibilité mise à jour avec succès
 *       404:
 *         description: Produit non trouvé
 *       403:
 *         description: Accès refusé - Admin requis
 */
router.put('/:id/toggle-visibility', authenticate, requireAdmin, async (req, res) => {
  try {
    // SECURITY: Validate UUID format to prevent injection attacks
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(req.params.id)) {
      return res.status(400).json({ 
        success: false,
        message: 'ID de produit invalide' 
      });
    }

    const { id } = req.params;
    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { isVisibleToClients: !product.isVisibleToClients },
    });

    res.json({
      success: true,
      message: `Visibilité du produit "${updatedProduct.name}" mise à jour.`,
      product: updatedProduct,
    });
  } catch (error) {
    logger.error('Erreur lors du changement de visibilité du produit:', { error: error.message, productId: req.params.id });
    res.status(500).json({ success: false, message: 'Erreur serveur lors de la mise à jour de la visibilité.' });
  }
});

module.exports = router;

