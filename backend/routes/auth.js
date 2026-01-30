const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { generateTokens, verifyToken, generateResetToken, hashResetToken } = require('../utils/jwt');
const { sendEmailVerificationEmail } = require('../utils/emailService');
const crypto = require('crypto');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');
const emailService = require('../utils/emailService');
const {
  setRefreshCookie,
  clearRefreshCookie,
  setCsrfCookie,
  clearCsrfCookie,
  getRefreshFromRequest,
} = require('../utils/cookieHelpers');

const getAccessibleShopsForUser = async (userId, role) => {
  if (role === 'ADMIN') {
    return prisma.shop.findMany({
      select: { id: true, name: true, city: true, organizationId: true }
    });
  }

  const memberships = await prisma.membership.findMany({
    where: { userId, status: 'ACTIVE' },
    select: {
      organizationId: true,
      shopMemberships: {
        where: { status: 'ACTIVE' },
        select: { shopId: true }
      }
    }
  });

  const organizationIds = memberships.map(m => m.organizationId);
  const shopIds = memberships.flatMap(m => m.shopMemberships.map(sm => sm.shopId));
  if (shopIds.length === 0) return [];

  return prisma.shop.findMany({
    where: { id: { in: shopIds }, organizationId: { in: organizationIds } },
    select: { id: true, name: true, city: true, organizationId: true }
  });
};

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
    body('password').isLength({ min: 8 }).withMessage('Le mot de passe doit faire au moins 8 caractères'),
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

      const { 
        name, 
        email, 
        password, 
        phone, 
        shopName, 
        address, 
        city, 
        postalCode,
        siret,
        tvaNumber,
        contactPerson,
        contactEmail,
        contactPhone
      } = req.body;

      // Vérifier si l'email existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);

      // Générer un token de vérification email
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');
      const emailVerificationExpiry = new Date();
      emailVerificationExpiry.setHours(emailVerificationExpiry.getHours() + 24); // Valide 24h

      // Créer l'utilisateur et son magasin (email non vérifié)
      const created = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            phone,
            role: 'CLIENT',
            emailVerified: false,
            emailVerificationToken,
            emailVerificationExpiry,
            isApproved: false, // Nécessite l'approbation de l'admin
          },
          select: { id: true, name: true, email: true, role: true, emailVerified: true, isApproved: true }
        });

        const organization = await tx.organization.create({
          data: { name: `Organisation ${name}` },
          select: { id: true, name: true }
        });

        const shop = await tx.shop.create({
          data: {
            name: shopName,
            address,
            city,
            postalCode,
            phone,
            siret,
            tvaNumber,
            contactPerson,
            contactEmail,
            contactPhone,
            organizationId: organization.id,
            userId: user.id
          },
          select: { id: true, name: true, city: true, organizationId: true }
        });

        const membership = await tx.membership.create({
          data: { organizationId: organization.id, userId: user.id },
          select: { id: true }
        });

        await tx.shopMembership.create({
          data: { membershipId: membership.id, shopId: shop.id }
        });

        return { user, shop, organization };
      });

      // Envoyer l'email de confirmation
      const baseUrl = process.env.FRONTEND_URL || process.env.BASE_URL || 'http://localhost:3000';
      const verificationUrl = `${baseUrl}/verify-email?token=${emailVerificationToken}`;
      
      try {
        await sendEmailVerificationEmail(email, verificationUrl, name);
      } catch (emailError) {
        logger.error('Erreur envoi email de confirmation', { error: emailError.message });
        // On continue même si l'email n'a pas pu être envoyé
      }

      // NE PAS générer de tokens - l'utilisateur doit d'abord vérifier son email et être approuvé par l'admin
      res.status(201).json({
        success: true,
        message: 'Inscription réussie ! Un email de confirmation a été envoyé à votre adresse. Veuillez vérifier votre boîte mail pour activer votre compte. Votre compte sera activé après approbation par un administrateur.',
        requiresEmailVerification: true,
        requiresAdminApproval: true,
        user: {
          id: created.user.id,
          name: created.user.name,
          email: created.user.email,
          emailVerified: created.user.emailVerified,
          isApproved: created.user.isApproved
        }
      });
    } catch (error) {
      // SECURITY: Use logger instead of console.error to prevent sensitive data exposure
      // RISK: console.error may expose stack traces, passwords, or other sensitive data
      logger.error('Erreur inscription', { 
        error: error.message,
        email: req.body.email ? 'provided' : 'missing' // Don't log actual email
      });
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de l\'inscription' 
      });
    }
  }
);

/**
 * @swagger
 * /api/auth/verify-email:
 *   get:
 *     summary: Vérifier l'adresse email
 *     tags: [Authentication]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email vérifié avec succès
 *       400:
 *         description: Token invalide ou expiré
 */
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token de vérification manquant'
      });
    }

    // Trouver l'utilisateur avec ce token
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpiry: {
          gt: new Date() // Token non expiré
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }

    // Vérifier l'email
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationExpiry: null
      }
    });

    logger.info('Email vérifié avec succès', { userId: user.id, email: user.email });

    res.json({
      success: true,
      message: 'Votre adresse email a été vérifiée avec succès ! Vous pouvez maintenant vous connecter.'
    });
  } catch (error) {
    logger.error('Erreur vérification email', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification de l\'email'
    });
  }
});

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: Renvoyer l'email de vérification
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
 *         description: Email de vérification renvoyé
 *       404:
 *         description: Utilisateur non trouvé
 */
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email requis'
      });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Aucun compte trouvé avec cet email'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà vérifié'
      });
    }

    // Générer un nouveau token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpiry = new Date();
    emailVerificationExpiry.setHours(emailVerificationExpiry.getHours() + 24);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken,
        emailVerificationExpiry
      }
    });

    // Envoyer l'email
    const baseUrl = process.env.FRONTEND_URL || process.env.BASE_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/verify-email?token=${emailVerificationToken}`;
    
    try {
      await sendEmailVerificationEmail(email, verificationUrl, user.name);
      return res.json({
        success: true,
        message: 'Un nouvel email de vérification a été envoyé'
      });
    } catch (emailError) {
      logger.error('Erreur envoi email de vérification', { error: emailError.message });
      return res.status(500).json({
        success: false,
        message: emailError.message || 'Erreur lors de l\'envoi de l\'email'
      });
    }
  } catch (error) {
    logger.error('Erreur renvoi email de vérification', { error: error.message });
    return res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors du renvoi de l\'email de vérification'
    });
  }
});

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
 *                 example: "contact.carreprimeur@gmail.com"
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
        select: {
          id: true,
          name: true,
          email: true,
          password: true,
          role: true,
          emailVerified: true,
          isApproved: true
        }
      });

      if (!user) {
        return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
      }

      // Vérifier le mot de passe
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
      }

      // Vérifier que l'email est vérifié (sauf pour les admins)
      if (user.role === 'CLIENT' && !user.emailVerified) {
        return res.status(403).json({
          success: false,
          message: 'Votre adresse email n\'a pas été vérifiée. Veuillez vérifier votre boîte mail et cliquer sur le lien de confirmation.',
          requiresEmailVerification: true,
          email: user.email
        });
      }

      // Vérifier que l'utilisateur est approuvé par l'admin (sauf pour les admins)
      if (user.role === 'CLIENT' && !user.isApproved) {
        return res.status(403).json({
          success: false,
          message: 'Votre compte est en attente d\'approbation par un administrateur. Vous recevrez un email une fois votre compte approuvé.',
          requiresAdminApproval: true,
          email: user.email
        });
      }

      const { accessToken, refreshToken } = generateTokens({
        id: user.id,
        role: user.role,
        email: user.email,
      });

      // Logger la connexion dans l'audit trail
      try {
        const { logAction } = require('../utils/auditTrail');
        await logAction('LOGIN', 'User', user.id, user.id, {
          email: user.email,
          role: user.role,
        }, req);
      } catch (auditError) {
        // Ne pas bloquer la connexion si l'audit échoue
        logger.warn('Erreur logging connexion', { error: auditError.message });
      }

      logger.info('Connexion réussie', {
        userId: user.id,
        email: user.email,
        ip: req.ip,
      });

      const shops = await getAccessibleShopsForUser(user.id, user.role);
      const activeShop = shops[0] || null;

      // Production security: refresh token must be httpOnly cookie (not in response body).
      // Also set CSRF token cookie to protect /refresh.
      setRefreshCookie(res, refreshToken);
      const csrfToken = crypto.randomBytes(32).toString('hex');
      setCsrfCookie(res, csrfToken);

      res.json({
        success: true,
        message: 'Connexion réussie',
        accessToken,
        csrfToken,
        ...(process.env.NODE_ENV !== 'production' ? { refreshToken } : {}),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          shop: activeShop,
          shops
        }
      });
    } catch (error) {
      // SECURITY: Use logger instead of console.error to prevent sensitive data exposure
      // RISK: console.error may expose stack traces or authentication details
      logger.error('Erreur connexion', { 
        error: error.message,
        email: req.body.email ? 'provided' : 'missing' // Don't log actual email
      });
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la connexion' 
      });
    }
  }
);

/** POST /api/auth/logout - Clear refresh+CSRF cookies; client clears access token. */
router.post('/logout', (req, res) => {
  clearRefreshCookie(res);
  clearCsrfCookie(res);
  res.json({ success: true, message: 'Déconnexion effectuée' });
});

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
        emailVerified: true,
        avatarUrl: true,
      }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }

    const shops = await getAccessibleShopsForUser(user.id, user.role);
    const activeShopId = req.context?.activeShopId || null;
    const activeShop =
      activeShopId ? await prisma.shop.findUnique({
        where: { id: activeShopId },
        select: { id: true, name: true, address: true, city: true, postalCode: true, phone: true, organizationId: true }
      }) : null;

    res.json({
      success: true,
      user: {
        ...user,
        shop: activeShop,
        shops
      }
    });
  } catch (error) {
    // SECURITY: Use logger only, remove console.error and stack traces in production
    // RISK: Stack traces and detailed errors expose system internals
    logger.error('Erreur récupération utilisateur', { 
      error: error.message,
      userId: req.user?.id
    });
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur'
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
      // Vérifier que req.body est un objet (pas une string)
      if (typeof req.body === 'string') {
        logger.warn('PUT /profile - Body reçu comme string, tentative de parsing', {
          body: req.body,
          contentType: req.headers['content-type'],
        });
        try {
          // Essayer de parser si c'est une string JSON
          const parsed = JSON.parse(req.body);
          // Si le parsing réussit mais que c'est toujours une string (ID utilisateur), c'est un problème
          if (typeof parsed === 'string') {
            logger.warn('PUT /profile - Body parsé mais toujours une string');
            return res.status(400).json({
              success: false,
              message: 'Format de données invalide. Les données doivent être un objet JSON avec name et phone.',
            });
          }
          req.body = parsed;
        } catch (parseError) {
          logger.error('PUT /profile - Erreur parsing JSON', {
            error: parseError.message,
            body: req.body,
          });
          return res.status(400).json({
            success: false,
            message: 'Format de données invalide. Le body doit être un objet JSON.',
          });
        }
      }

      // Vérifier que req.body est maintenant un objet avec les bonnes propriétés
      if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
        return res.status(400).json({
          success: false,
          message: 'Format de données invalide. Les données doivent être un objet JSON.',
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          message: 'Erreur de validation',
          errors: errors.array() 
        });
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
          avatarUrl: true,
          shops: {
            select: {
              id: true,
              name: true,
              city: true
            },
            take: 1
          }
        }
      });

      res.json({
        success: true,
        message: 'Profil mis à jour avec succès',
        user: updatedUser
      });
    } catch (error) {
      // SECURITY: Use logger instead of console.error to prevent sensitive data exposure
      // RISK: console.error may expose stack traces or user data
      logger.error('Erreur mise à jour profil', { 
        error: error.message,
        userId: req.user?.id 
      });
      res.status(500).json({ 
        success: false,
        message: 'Erreur serveur' 
      });
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
    body('newPassword').isLength({ min: 8 }).withMessage('Le nouveau mot de passe doit faire au moins 8 caractères'),
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

      res.json({
        success: true,
        message: 'Mot de passe modifié avec succès'
      });
    } catch (error) {
      logger.error('Erreur changement mot de passe', {
        error: error.message,
        userId: req.user?.id
      });
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }
);

/** Alias pour le frontend qui appelle /change-password */
const changePasswordHandler = [
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Mot de passe actuel requis'),
    body('newPassword').isLength({ min: 8 }).withMessage('Le nouveau mot de passe doit faire au moins 8 caractères'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { currentPassword, newPassword } = req.body;
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: req.user.id },
        data: { password: hashedPassword },
      });
      res.json({ success: true, message: 'Mot de passe modifié avec succès' });
    } catch (error) {
      logger.error('Erreur changement mot de passe', { error: error.message, userId: req.user?.id });
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  },
];
router.put('/change-password', ...changePasswordHandler);

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

      const shopId = req.context?.activeShopId;
      const isAccessible = (req.context?.accessibleShops || []).some(s => s.id === shopId);
      if (!shopId || !isAccessible) {
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
        where: { id: shopId },
        data: updateData
      });

      res.json({
        success: true,
        message: 'Informations du magasin mises à jour avec succès',
        shop: updatedShop
      });
    } catch (error) {
      // SECURITY: Use logger instead of console.error to prevent sensitive data exposure
      // RISK: console.error may expose stack traces or shop data
      logger.error('Erreur mise à jour magasin', { 
        error: error.message,
        userId: req.user?.id,
        shopId: req.context?.activeShopId
      });
      res.status(500).json({ 
        success: false,
        message: 'Erreur serveur' 
      });
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
router.post('/refresh', authLimiter, async (req, res) => {
  try {
    const refreshToken = getRefreshFromRequest(req);
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token manquant (cookie)',
      });
    }

    const csrfHeader = req.headers['x-csrf-token'];
    const csrfCookie = req.cookies && req.cookies['XSRF-TOKEN'];
    if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
      logger.warn('CSRF mismatch on /refresh', { ip: req.ip });
      return res.status(403).json({
        success: false,
        message: 'Token CSRF invalide',
      });
    }

    const decoded = verifyToken(refreshToken);
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Type de token invalide',
      });
    }

    const userId = decoded.id || decoded.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true },
    });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      id: user.id,
      role: user.role,
      email: user.email,
    });
    const newCsrf = crypto.randomBytes(32).toString('hex');
    setRefreshCookie(res, newRefreshToken);
    setCsrfCookie(res, newCsrf);

    res.json({
      success: true,
      accessToken,
      csrfToken: newCsrf,
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      logger.warn('Refresh token invalide ou expiré', { error: error.message, ip: req.ip });
      return res.status(401).json({
        success: false,
        message: 'Refresh token invalide ou expiré',
      });
    }
    logger.error('Erreur refresh token', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
});

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
    body('password').isLength({ min: 8 }).withMessage('Le mot de passe doit faire au moins 8 caractères'),
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

