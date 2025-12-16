const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { generateTokens, verifyToken, generateResetToken, hashResetToken } = require('../utils/jwt');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');
const emailService = require('../utils/emailService');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Inscription d'un nouveau client
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - shopName
 *               - address
 *               - city
 *               - postalCode
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Jean Dupont"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "jean.dupont@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "password123"
 *               phone:
 *                 type: string
 *                 example: "0612345678"
 *               shopName:
 *                 type: string
 *                 example: "Épicerie du Centre"
 *               address:
 *                 type: string
 *                 example: "123 Rue de la République"
 *               city:
 *                 type: string
 *                 example: "Paris"
 *               postalCode:
 *                 type: string
 *                 pattern: '^[0-9]{5}$'
 *                 example: "75001"
 *     responses:
 *       201:
 *         description: Inscription réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Erreur de validation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Le nom est requis'),
    body('email').isEmail().withMessage('Email invalide'),
    body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit faire au moins 6 caractères'),
    body('shopName').trim().notEmpty().withMessage('Le nom du magasin est requis'),
    body('address').trim().notEmpty().withMessage('L\'adresse est requise'),
    body('city').trim().notEmpty().withMessage('La ville est requise'),
    body('postalCode').trim().matches(/^\d{5}$/).withMessage('Code postal invalide (5 chiffres)'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password, phone, shopName, address, city, postalCode } = req.body;

      // Vérifier si l'email existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);

      // Créer l'utilisateur et son magasin
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          phone,
          role: 'CLIENT',
          shop: {
            create: {
              name: shopName,
              address,
              city,
              postalCode,
              phone
            }
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          shop: true
        }
      });

      const { accessToken, refreshToken } = generateTokens(user.id);

      res.status(201).json({
        success: true,
        message: 'Inscription réussie',
        accessToken,
        refreshToken,
        user
      });
    } catch (error) {
      console.error('Erreur inscription:', error);
      res.status(500).json({ message: 'Erreur lors de l\'inscription' });
    }
  }
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Connexion utilisateur
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "admin@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Email ou mot de passe incorrect
 *       429:
 *         description: Trop de tentatives de connexion
 */
router.post(
  '/login',
  authLimiter, // Rate limiting pour protection brute force
  [
    body('email').isEmail().withMessage('Email invalide'),
    body('password').notEmpty().withMessage('Mot de passe requis'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Trouver l'utilisateur
      const user = await prisma.user.findUnique({
        where: { email },
        include: { shop: true }
      });

      if (!user) {
        return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
      }

      // Vérifier le mot de passe
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
      }

      const { accessToken, refreshToken } = generateTokens(user.id);

      logger.info('Connexion réussie', {
        userId: user.id,
        email: user.email,
        ip: req.ip,
      });

      res.json({
        success: true,
        message: 'Connexion réussie',
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          shop: user.shop
        }
      });
    } catch (error) {
      console.error('Erreur connexion:', error);
      res.status(500).json({ message: 'Erreur lors de la connexion' });
    }
  }
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Récupérer les informations de l'utilisateur connecté
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Informations utilisateur récupérées avec succès
 *       401:
 *         description: Non authentifié
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        shop: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            postalCode: true,
            phone: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }

    res.json({ 
      success: true,
      user 
    });
  } catch (error) {
    logger.error('Erreur récupération utilisateur:', { 
      error: error.message,
      stack: error.stack 
    });
    console.error('Erreur détaillée /me:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/auth/profile
 * Modifier le profil de l'utilisateur connecté
 */
router.put(
  '/profile',
  authenticate,
  [
    body('name').optional().trim().notEmpty().withMessage('Le nom est requis'),
    body('email').optional().isEmail().withMessage('Email invalide'),
    body('phone').optional(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, phone } = req.body;
      const updateData = {};

      if (name) updateData.name = name;
      if (email) {
        // Vérifier si l'email n'est pas déjà utilisé
        const existingUser = await prisma.user.findUnique({
          where: { email }
        });
        if (existingUser && existingUser.id !== req.user.id) {
          return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }
        updateData.email = email;
      }
      if (phone !== undefined) updateData.phone = phone;

      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          shop: true
        }
      });

      res.json({
        message: 'Profil mis à jour avec succès',
        user: updatedUser
      });
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
);

/**
 * PUT /api/auth/password
 * Changer le mot de passe de l'utilisateur connecté
 */
router.put(
  '/password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Mot de passe actuel requis'),
    body('newPassword').isLength({ min: 6 }).withMessage('Le nouveau mot de passe doit faire au moins 6 caractères'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { currentPassword, newPassword } = req.body;

      // Récupérer l'utilisateur avec le mot de passe
      const user = await prisma.user.findUnique({
        where: { id: req.user.id }
      });

      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      // Vérifier le mot de passe actuel
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
      }

      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Mettre à jour le mot de passe
      await prisma.user.update({
        where: { id: req.user.id },
        data: { password: hashedPassword }
      });

      res.json({ message: 'Mot de passe modifié avec succès' });
    } catch (error) {
      console.error('Erreur changement mot de passe:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
);

/**
 * PUT /api/auth/shop
 * Modifier les informations du magasin (CLIENT uniquement)
 */
router.put(
  '/shop',
  authenticate,
  [
    body('name').optional().trim().notEmpty(),
    body('address').optional().trim().notEmpty(),
    body('city').optional().trim().notEmpty(),
    body('postalCode').optional().trim().matches(/^\d{5}$/),
    body('phone').optional(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Vérifier que l'utilisateur a un magasin
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { shop: true }
      });

      if (!user.shop) {
        return res.status(404).json({ message: 'Magasin non trouvé' });
      }

      const { name, address, city, postalCode, phone } = req.body;
      const updateData = {};

      if (name) updateData.name = name;
      if (address) updateData.address = address;
      if (city) updateData.city = city;
      if (postalCode) updateData.postalCode = postalCode;
      if (phone !== undefined) updateData.phone = phone;

      const updatedShop = await prisma.shop.update({
        where: { id: user.shop.id },
        data: updateData
      });

      res.json({
        message: 'Informations du magasin mises à jour avec succès',
        shop: updatedShop
      });
    } catch (error) {
      console.error('Erreur mise à jour magasin:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Rafraîchir le access token avec un refresh token
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tokens rafraîchis avec succès
 *       401:
 *         description: Refresh token invalide ou expiré
 */
router.post(
  '/refresh',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token requis'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }

      const { refreshToken } = req.body;

      try {
        const decoded = verifyToken(refreshToken);
        
        if (decoded.type !== 'refresh') {
          return res.status(401).json({ 
            success: false,
            message: 'Type de token invalide' 
          });
        }

        // Vérifier que l'utilisateur existe toujours
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, email: true, name: true, role: true, shop: true }
        });

        if (!user) {
          return res.status(401).json({ 
            success: false,
            message: 'Utilisateur non trouvé' 
          });
        }

        // Générer de nouveaux tokens
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id);

        res.json({
          success: true,
          accessToken,
          refreshToken: newRefreshToken,
        });
      } catch (error) {
        logger.warn('Tentative de refresh avec token invalide', {
          error: error.message,
          ip: req.ip,
        });
        
        return res.status(401).json({ 
          success: false,
          message: 'Refresh token invalide ou expiré' 
        });
      }
    } catch (error) {
      logger.error('Erreur refresh token', { error: error.message });
      res.status(500).json({ 
        success: false,
        message: 'Erreur serveur' 
      });
    }
  }
);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Demander une réinitialisation de mot de passe
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Email de réinitialisation envoyé (si l'email existe)
 *       429:
 *         description: Trop de tentatives
 */
router.post(
  '/forgot-password',
  authLimiter,
  [
    body('email').isEmail().withMessage('Email invalide'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }

      const { email } = req.body;

      const user = await prisma.user.findUnique({
        where: { email }
      });

      // Pour la sécurité, ne pas révéler si l'email existe ou non
      if (!user) {
        // Retourner un succès même si l'email n'existe pas (sécurité)
        return res.json({
          success: true,
          message: 'Si cet email existe, un lien de réinitialisation a été envoyé',
        });
      }

      // Générer un token de réinitialisation
      const resetToken = generateResetToken();
      const hashedToken = hashResetToken(resetToken);
      
      // Date d'expiration (1 heure)
      const resetTokenExpiry = new Date();
      resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1);

      // Stocker le token hashé et la date d'expiration dans la base
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: hashedToken,
          resetTokenExpiry: resetTokenExpiry,
        },
      });

      // Envoyer l'email
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      
      try {
        await emailService.sendPasswordResetEmail(user.email, resetUrl, user.name);
        
        logger.info('Email de réinitialisation envoyé', {
          userId: user.id,
          email: user.email,
        });

        res.json({
          success: true,
          message: 'Si cet email existe, un lien de réinitialisation a été envoyé',
        });
      } catch (emailError) {
        logger.error('Erreur envoi email réinitialisation', {
          error: emailError.message,
          userId: user.id,
        });
        
        // Nettoyer le token en cas d'erreur d'envoi
        await prisma.user.update({
          where: { id: user.id },
          data: {
            resetToken: null,
            resetTokenExpiry: null,
          },
        });
        
        res.status(500).json({
          success: false,
          message: 'Erreur lors de l\'envoi de l\'email',
        });
      }
    } catch (error) {
      logger.error('Erreur forgot password', { error: error.message });
      res.status(500).json({ 
        success: false,
        message: 'Erreur serveur' 
      });
    }
  }
);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Réinitialiser le mot de passe avec un token
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Mot de passe réinitialisé avec succès
 *       400:
 *         description: Token invalide ou expiré
 *       429:
 *         description: Trop de tentatives
 */
router.post(
  '/reset-password',
  authLimiter,
  [
    body('token').notEmpty().withMessage('Token requis'),
    body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit faire au moins 6 caractères'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }

      const { token, password } = req.body;
      const hashedToken = hashResetToken(token);

      // Trouver l'utilisateur avec ce token
      const user = await prisma.user.findFirst({
        where: {
          resetToken: hashedToken,
          resetTokenExpiry: {
            gt: new Date(), // Token non expiré
          },
        },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Token invalide ou expiré',
        });
      }

      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);

      // Mettre à jour le mot de passe et nettoyer le token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        },
      });

      logger.info('Mot de passe réinitialisé', {
        userId: user.id,
        email: user.email,
      });

      res.json({
        success: true,
        message: 'Mot de passe réinitialisé avec succès',
      });
    } catch (error) {
      logger.error('Erreur reset password', { error: error.message });
      res.status(500).json({ 
        success: false,
        message: 'Erreur serveur' 
      });
    }
  }
);

module.exports = router;

