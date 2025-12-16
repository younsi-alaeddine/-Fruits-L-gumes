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
        shop: true
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

    req.user = user;
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
        expiredAt: error.expiredAt,
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

module.exports = {
  authenticate,
  requireAdmin,
  requireClient
};

