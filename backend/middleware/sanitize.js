const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');
const logger = require('../utils/logger');

/**
 * Configuration de la sanitization MongoDB (defense in depth; app uses Prisma/Postgres)
 */
const sanitizeMongo = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ key }) => {
    logger.warn('Tentative d\'injection MongoDB détectée', { key });
  },
});

/**
 * Fonction pour sanitizer les données contre XSS
 */
const sanitizeXSS = (obj) => {
  // Ne pas sanitizer si c'est null ou undefined
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return xss(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeXSS(item));
  }
  
  if (obj && typeof obj === 'object') {
    // Vérifier que ce n'est pas un objet spécial (Date, Buffer, etc.)
    if (obj.constructor && obj.constructor.name !== 'Object' && obj.constructor.name !== 'Array') {
      return obj; // Ne pas sanitizer les objets spéciaux
    }
    
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeXSS(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
};

/**
 * Middleware pour sanitizer les données de requête
 */
const sanitizeRequest = (req, res, next) => {
  // Sanitizer le body
  if (req.body) {
    req.body = sanitizeXSS(req.body);
  }
  
  // Sanitizer les query params
  if (req.query) {
    req.query = sanitizeXSS(req.query);
  }
  
  // Sanitizer les params
  if (req.params) {
    req.params = sanitizeXSS(req.params);
  }
  
  next();
};

module.exports = {
  sanitizeMongo,
  sanitizeXSS,
  sanitizeRequest,
};

