const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET;
const isProd = process.env.NODE_ENV === 'production';
const secretLen = JWT_SECRET ? String(JWT_SECRET).trim().length : 0;
if (isProd && secretLen < 32) {
  throw new Error('CRITICAL: JWT_SECRET is required in production and must be at least 32 characters.');
}
const EFFECTIVE_JWT_SECRET = JWT_SECRET || 'dev-insecure-jwt-secret-change-me';

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token manquant' });
    }
    const decoded = jwt.verify(token, EFFECTIVE_JWT_SECRET);

    // Backward compatible: accept both {id} and {userId}
    const id = decoded.id || decoded.userId;
    if (!id) {
      return res.status(401).json({ message: 'Token invalide ou expiré' });
    }

    req.user = { ...decoded, id };

    // If role missing (old tokens), fetch minimal role from DB (one lightweight query)
    if (!req.user.role) {
      const u = await prisma.user.findUnique({
        where: { id },
        select: { role: true },
      });
      req.user.role = u?.role;
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Non authentifié' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Permissions insuffisantes' });
    }
    next();
  };
};

const requireClient = requireRole(['CLIENT', 'client']);
const requireAdmin = requireRole(['ADMIN']);
const requireManager = requireRole(['MANAGER']);

module.exports = {
  authenticate,
  requireRole,
  requireClient,
  requireAdmin,
  requireManager,
};
