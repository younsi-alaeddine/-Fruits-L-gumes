const { OrderStatus } = require('@prisma/client');

/**
 * Valide une transition de statut de commande
 * @param {String} currentStatus - Statut actuel
 * @param {String} newStatus - Nouveau statut
 * @param {String} userRole - Rôle de l'utilisateur
 * @returns {Object} { valid: boolean, message?: string }
 */
function validateOrderStatusTransition(currentStatus, newStatus, userRole) {
  // Transitions autorisées
  const transitions = {
    [OrderStatus.NEW]: {
      allowed: [OrderStatus.AGGREGATED, OrderStatus.ANNULEE],
      roles: ['ADMIN']
    },
    [OrderStatus.AGGREGATED]: {
      allowed: [OrderStatus.SUPPLIER_ORDERED, OrderStatus.ANNULEE],
      roles: ['ADMIN']
    },
    [OrderStatus.SUPPLIER_ORDERED]: {
      allowed: [OrderStatus.PREPARATION, OrderStatus.ANNULEE],
      roles: ['ADMIN'] // Automatique après réception fournisseur
    },
    [OrderStatus.PREPARATION]: {
      allowed: [OrderStatus.LIVRAISON, OrderStatus.ANNULEE],
      roles: ['ADMIN', 'PREPARATEUR']
    },
    [OrderStatus.LIVRAISON]: {
      allowed: [OrderStatus.LIVREE, OrderStatus.ANNULEE],
      roles: ['ADMIN', 'LIVREUR']
    },
    [OrderStatus.LIVREE]: {
      allowed: [], // Statut final, pas de transition
      roles: []
    },
    [OrderStatus.ANNULEE]: {
      allowed: [], // Statut final, pas de transition
      roles: []
    }
  };
  
  const transition = transitions[currentStatus];
  
  if (!transition) {
    return {
      valid: false,
      message: `Statut actuel invalide: ${currentStatus}`
    };
  }
  
  if (!transition.allowed.includes(newStatus)) {
    return {
      valid: false,
      message: `Transition non autorisée: ${currentStatus} → ${newStatus}`
    };
  }
  
  if (!transition.roles.includes(userRole)) {
    return {
      valid: false,
      message: `Rôle ${userRole} non autorisé pour cette transition`
    };
  }
  
  return { valid: true };
}

/**
 * Middleware pour valider les transitions de statut
 */
function validateTransition(req, res, next) {
  const { status } = req.body;
  const currentStatus = req.order?.status;
  const userRole = req.user?.role;
  
  if (!currentStatus || !status) {
    return res.status(400).json({
      success: false,
      message: 'Statut actuel et nouveau statut requis'
    });
  }
  
  const validation = validateOrderStatusTransition(currentStatus, status, userRole);
  
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: validation.message
    });
  }
  
  next();
}

module.exports = {
  validateOrderStatusTransition,
  validateTransition
};
