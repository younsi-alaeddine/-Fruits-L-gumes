const prisma = require('../config/database');
const logger = require('./logger');

/**
 * Créer une notification pour un utilisateur
 */
const createNotification = async (userId, type, title, message, data = null) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data ? JSON.stringify(data) : null,
      },
    });

    // Émettre un événement pour WebSocket si nécessaire
    // TODO: Implémenter WebSocket broadcast
    
    return notification;
  } catch (error) {
    logger.error('Erreur création notification:', {
      error: error.message,
      userId,
      type,
    });
    throw error;
  }
};

/**
 * Créer une notification pour tous les admins
 */
const notifyAdmins = async (type, title, message, data = null) => {
  try {
    const admins = await prisma.user.findMany({
      where: {
        role: 'ADMIN',
      },
      select: {
        id: true,
      },
    });

    const notifications = await Promise.all(
      admins.map(admin =>
        createNotification(admin.id, type, title, message, data)
      )
    );

    return notifications;
  } catch (error) {
    logger.error('Erreur notification admins:', {
      error: error.message,
      type,
    });
    throw error;
  }
};

/**
 * Créer une notification pour un rôle spécifique
 */
const notifyRole = async (role, type, title, message, data = null) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role,
      },
      select: {
        id: true,
      },
    });

    const notifications = await Promise.all(
      users.map(user =>
        createNotification(user.id, type, title, message, data)
      )
    );

    return notifications;
  } catch (error) {
    logger.error('Erreur notification rôle:', {
      error: error.message,
      role,
      type,
    });
    throw error;
  }
};

/**
 * Notifications spécifiques pour différents événements
 */
const notifyNewOrder = async (order) => {
  return notifyAdmins(
    'ORDER_NEW',
    'Nouvelle commande',
    `Nouvelle commande de ${order.shop?.name || 'Client'} - ${order.totalTTC.toFixed(2)} €`,
    { orderId: order.id }
  );
};

const notifyOrderStatusChanged = async (order, oldStatus, newStatus, userId) => {
  const statusLabels = {
    NEW: 'Nouvelle',
    PREPARATION: 'En préparation',
    LIVRAISON: 'En livraison',
    LIVREE: 'Livrée',
    ANNULEE: 'Annulée',
  };

  // Notifier le client
  if (order.shop?.userId) {
    await createNotification(
      order.shop.userId,
      'ORDER_STATUS_CHANGED',
      'Mise à jour de votre commande',
      `Votre commande #${order.id.substring(0, 8)} est maintenant ${statusLabels[newStatus] || newStatus}`,
      { orderId: order.id, oldStatus, newStatus }
    );
  }

  // Notifier les préparateurs si la commande passe en préparation
  if (newStatus === 'PREPARATION') {
    await notifyRole(
      'PREPARATEUR',
      'ORDER_STATUS_CHANGED',
      'Commande à préparer',
      `Commande #${order.id.substring(0, 8)} à préparer`,
      { orderId: order.id }
    );
  }

  // Notifier les livreurs si la commande passe en livraison
  if (newStatus === 'LIVRAISON') {
    await notifyRole(
      'LIVREUR',
      'ORDER_READY',
      'Commande prête à livrer',
      `Commande #${order.id.substring(0, 8)} prête à livrer`,
      { orderId: order.id }
    );
  }
};

const notifyStockLow = async (product) => {
  await notifyRole(
    'STOCK_MANAGER',
    'STOCK_LOW',
    'Stock faible',
    `Le produit ${product.name} a un stock faible (${product.stock} ${product.unit})`,
    { productId: product.id, stock: product.stock }
  );
};

const notifyStockOut = async (product) => {
  await notifyRole(
    'STOCK_MANAGER',
    'STOCK_OUT',
    'Stock épuisé',
    `Le produit ${product.name} est en rupture de stock`,
    { productId: product.id }
  );
};

const notifyPaymentReceived = async (payment, order) => {
  // Notifier le client
  if (order.shop?.userId) {
    await createNotification(
      order.shop.userId,
      'PAYMENT_RECEIVED',
      'Paiement reçu',
      `Votre paiement de ${payment.amount.toFixed(2)} € pour la commande #${order.id.substring(0, 8)} a été enregistré`,
      { paymentId: payment.id, orderId: order.id }
    );
  }

  // Notifier les finances
  await notifyRole(
    'FINANCE',
    'PAYMENT_RECEIVED',
    'Nouveau paiement',
    `Paiement de ${payment.amount.toFixed(2)} € reçu pour la commande #${order.id.substring(0, 8)}`,
    { paymentId: payment.id, orderId: order.id }
  );
};

module.exports = {
  createNotification,
  notifyAdmins,
  notifyRole,
  notifyNewOrder,
  notifyOrderStatusChanged,
  notifyStockLow,
  notifyStockOut,
  notifyPaymentReceived,
};
