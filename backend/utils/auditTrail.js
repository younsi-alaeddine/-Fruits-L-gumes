const prisma = require('../config/database');
const logger = require('./logger');

/**
 * Créer une entrée d'audit trail
 */
const createAuditLog = async (data) => {
  try {
    // Logger dans Winston
    logger.info('Audit Trail', {
      action: data.action,
      entity: data.entity,
      entityId: data.entityId,
      userId: data.userId,
      changes: data.changes,
      ip: data.ip,
      userAgent: data.userAgent,
      timestamp: new Date().toISOString(),
    });

    // Sauvegarder dans la base de données
    try {
      await prisma.auditLog.create({
        data: {
          action: data.action, // CREATE, UPDATE, DELETE, etc.
          entity: data.entity, // Product, Order, User, etc.
          entityId: data.entityId,
          userId: data.userId || null,
          changes: data.changes ? JSON.stringify(data.changes) : null,
          ip: data.ip || null,
          userAgent: data.userAgent || null,
        },
      });
    } catch (dbError) {
      // Si la table n'existe pas encore (migration non effectuée), continuer avec juste les logs
      logger.warn('Table AuditLog non disponible, utilisation des logs uniquement', {
        error: dbError.message,
      });
    }
  } catch (error) {
    logger.error('Erreur création audit log', {
      error: error.message,
      data,
    });
  }
};

/**
 * Middleware pour logger automatiquement les modifications
 */
const auditMiddleware = (entity) => {
  return async (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(data) {
      // Logger après une modification réussie
      if (req.method !== 'GET' && res.statusCode < 400) {
        createAuditLog({
          action: getActionFromMethod(req.method),
          entity: entity,
          entityId: req.params.id || data.id,
          userId: req.user?.id,
          changes: req.body,
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

/**
 * Convertir la méthode HTTP en action d'audit
 */
const getActionFromMethod = (method) => {
  const methodMap = {
    POST: 'CREATE',
    PUT: 'UPDATE',
    PATCH: 'UPDATE',
    DELETE: 'DELETE',
  };
  return methodMap[method] || 'UNKNOWN';
};

/**
 * Logger une action spécifique
 */
const logAction = async (action, entity, entityId, userId, changes = null, req = null) => {
  await createAuditLog({
    action,
    entity,
    entityId,
    userId,
    changes,
    ip: req?.ip,
    userAgent: req?.get('user-agent'),
  });
};

/**
 * Logger un accès/consultation (READ/VIEW)
 */
const logAccess = async (entity, entityId, userId, details = null, req = null) => {
  await createAuditLog({
    action: 'VIEW',
    entity,
    entityId,
    userId,
    changes: details,
    ip: req?.ip,
    userAgent: req?.get('user-agent'),
  });
};

/**
 * Middleware pour logger automatiquement les accès GET sur certaines routes
 */
const logAccessMiddleware = (entity, getEntityId = (req) => req.params.id) => {
  return async (req, res, next) => {
    // Logger après une requête GET réussie
    if (req.method === 'GET' && req.user) {
      try {
        const entityId = getEntityId(req);
        if (entityId) {
          await logAccess(entity, entityId, req.user.id, {
            route: req.path,
            query: req.query,
          }, req);
        }
      } catch (error) {
        // Ne pas bloquer la requête si l'audit échoue
        logger.warn('Erreur logging accès', { error: error.message });
      }
    }
    next();
  };
};

module.exports = {
  createAuditLog,
  auditMiddleware,
  logAction,
  logAccess,
  logAccessMiddleware,
};

