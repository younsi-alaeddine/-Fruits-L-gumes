const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');

/**
 * Configuration de la sanitization MongoDB
 */
const sanitizeMongo = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Tentative d'injection MongoDB détectée: ${key}`);
  },
});

/**
 * Fonction pour sanitizer les données contre XSS
 */
const sanitizeXSS = (obj) => {
  if (typeof obj === 'string') {
    return xss(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeXSS(item));
  }
  
  if (obj && typeof obj === 'object') {
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

