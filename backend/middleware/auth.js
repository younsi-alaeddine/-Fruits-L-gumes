const { verifyToken } = require('../utils/jwt');
const prisma = require('../config/database');
const logger = require('../utils/logger');

/**
 * Middleware d'authentification JWT
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: 'Token manquant' 
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Vérifier le token
    const decoded = verifyToken(token);
    
    // Vérifier que c'est un access token
    if (decoded.type && decoded.type !== 'access') {
      return res.status(401).json({ 
        success: false,
        message: 'Type de token invalide' 
      });
    }

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
      }
    });

    if (!user) {
      logger.warn('Tentative d\'authentification avec token invalide', {
        userId: decoded.userId,
        ip: req.ip,
      });
      return res.status(401).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }

    // Vérifier que l'email est vérifié (sauf pour les admins)
    if (user.role === 'CLIENT' && !user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Votre adresse email n\'a pas été vérifiée. Veuillez vérifier votre boîte mail et cliquer sur le lien de confirmation.',
        requiresEmailVerification: true
      });
    }

    // Construire le contexte multi-tenant / multi-magasin
    // - ADMIN: accès global
    // - Autres rôles: accès via memberships / shop_memberships
    let memberships = [];
    let accessibleShops = [];
    let organizationIds = [];

    if (user.role !== 'ADMIN') {
      memberships = await prisma.membership.findMany({
        where: {
          userId: user.id,
          status: 'ACTIVE'
        },
        select: {
          id: true,
          organizationId: true,
          shopMemberships: {
            where: { status: 'ACTIVE' },
            select: { shopId: true }
          }
        }
      });
      organizationIds = memberships.map(m => m.organizationId);

      const shopIds = memberships.flatMap(m => m.shopMemberships.map(sm => sm.shopId));
      if (shopIds.length > 0) {
        accessibleShops = await prisma.shop.findMany({
          where: { id: { in: shopIds }, organizationId: { in: organizationIds } },
          select: { id: true, name: true, city: true, organizationId: true }
        });
      }
    } else {
      // Admin: peut voir tous les shops (supervision)
      accessibleShops = await prisma.shop.findMany({
        select: { id: true, name: true, city: true, organizationId: true }
      });
      organizationIds = Array.from(new Set(accessibleShops.map(s => s.organizationId).filter(Boolean)));
    }

    const requestedShopId = req.headers['x-shop-id'] ? String(req.headers['x-shop-id']) : null;
    const activeShopId =
      requestedShopId && accessibleShops.some(s => s.id === requestedShopId)
        ? requestedShopId
        : (accessibleShops[0]?.id || null);

    const activeOrganizationId =
      activeShopId ? (accessibleShops.find(s => s.id === activeShopId)?.organizationId || null) :
      (organizationIds[0] || null);

    req.user = user;
    req.context = {
      memberships,
      organizationIds,
      accessibleShops,
      activeShopId,
      activeOrganizationId
    };
    next();
  } catch (error) {
    logger.warn('Erreur d\'authentification', {
      error: error.message,
      ip: req.ip,
    });
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré',
      });
    }
    
    return res.status(401).json({ 
      success: false,
      message: 'Token invalide' 
    });
  }
};

/**
 * Middleware d'autorisation ADMIN uniquement
 */
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Accès refusé - Admin requis' });
  }
  next();
};

/**
 * Middleware d'autorisation CLIENT uniquement
 */
const requireClient = (req, res, next) => {
  if (req.user?.role !== 'CLIENT') {
    return res.status(403).json({ message: 'Accès refusé - Client requis' });
  }
  next();
};

/**
 * Middleware d'autorisation - Vérifie si l'utilisateur a un des rôles autorisés
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user?.role) {
      return res.status(403).json({ message: 'Accès refusé - Authentification requise' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Accès refusé - Rôle requis: ${allowedRoles.join(' ou ')}` 
      });
    }
    next();
  };
};

/**
 * Middleware pour rôles de préparation (PREPARATEUR, MANAGER, ADMIN)
 */
const requirePreparation = requireRole('PREPARATEUR', 'MANAGER', 'ADMIN');

/**
 * Middleware pour rôles de livraison (LIVREUR, MANAGER, ADMIN)
 */
const requireDelivery = requireRole('LIVREUR', 'MANAGER', 'ADMIN');

/**
 * Middleware pour rôles commerciaux (COMMERCIAL, MANAGER, ADMIN)
 */
const requireCommercial = requireRole('COMMERCIAL', 'MANAGER', 'ADMIN');

/**
 * Middleware pour rôles de gestion de stock (STOCK_MANAGER, MANAGER, ADMIN)
 */
const requireStock = requireRole('STOCK_MANAGER', 'MANAGER', 'ADMIN');

/**
 * Middleware pour rôles financiers (FINANCE, MANAGER, ADMIN)
 */
const requireFinance = requireRole('FINANCE', 'MANAGER', 'ADMIN');

/**
 * Middleware pour rôles de management (MANAGER, ADMIN)
 */
const requireManager = requireRole('MANAGER', 'ADMIN');

module.exports = {
  authenticate,
  requireAdmin,
  requireClient,
  requireRole,
  requirePreparation,
  requireDelivery,
  requireCommercial,
  requireStock,
  requireFinance,
  requireManager
};

