const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');

/**
 * Configuration Helmet pour la sécurité des headers HTTP
 */
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "http://localhost:5000"],
      connectSrc: ["'self'", "http://localhost:5000"],
    },
  },
  crossOriginEmbedderPolicy: false, // Désactivé pour permettre les uploads
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

/**
 * Sanitization MongoDB (protection injection NoSQL)
 */
const sanitizeMongo = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`[Sanitize] Tentative d'injection NoSQL détectée: ${key}`);
  },
});

/**
 * Sanitization XSS pour les données utilisateur
 */
const sanitizeXSS = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    });
  }
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = xss(req.query[key]);
      }
    });
  }
  next();
};

module.exports = {
  helmetConfig,
  sanitizeMongo,
  sanitizeXSS,
};

