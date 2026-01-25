const rateLimit = require('express-rate-limit');

// Rate limiter général pour toutes les routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 5000, // Très permissif en développement
  message: {
    success: false,
    message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Mounted at /api/ so path is e.g. /auth/login. Production: never skip (bank-level).
    if (process.env.NODE_ENV === 'production') return false;
    return req.path.startsWith('/auth');
  },
});

// Rate limiter strict pour l'authentification (protection brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 20, // Plus permissif en développement
  message: {
    success: false,
    message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
    retryAfter: 15 * 60, // secondes
  },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Trop de tentatives de connexion. Veuillez réessayer dans quelques minutes.',
      retryAfter: Math.ceil(15 * 60), // secondes
    });
  },
});

// Rate limiter pour les commandes
const orderLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'production' ? 10 : 200, // Très permissif en développement pour les GET
  message: 'Trop de requêtes. Veuillez patienter un moment.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // En développement, ne pas limiter les requêtes GET (lecture de commandes)
    return process.env.NODE_ENV !== 'production' && req.method === 'GET';
  },
});

// Rate limiter pour l'upload de fichiers
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'production' ? 5 : 50, // Plus permissif en développement
  message: 'Trop de fichiers uploadés. Veuillez patienter un moment.',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  authLimiter,
  orderLimiter,
  uploadLimiter,
};
