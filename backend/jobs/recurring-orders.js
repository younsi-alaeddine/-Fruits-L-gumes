const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');
const { calculateOrderItemTotals, calculateOrderTotals } = require('../utils/calculations');
const { notifyNewOrder, notifyAdmins } = require('../utils/notificationService');

// Phase 2: prevent silent failures of the job (ops visibility)
// We throttle alerts to avoid spamming admins on repeated failures.
const lastFailureAlertAtByRecurringOrderId = new Map();

/**
 * Exécuter les commandes récurrentes qui sont prêtes
 */
async function processRecurringOrders() {
  try {
    const now = new Date();
    
    // Trouver les commandes récurrentes actives dont nextRun est passé
    const recurringOrders = await prisma.recurringOrder.findMany({
      where: {
        isActive: true,
        nextRun: {
          lte: now,
        },
      },
      include: {
        shop: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
    
    // Filtrer les produits inactifs après récupération
    recurringOrders.forEach(order => {
      order.items = order.items.filter(item => 
        item.product.isActive && item.product.isVisibleToClients
      );
    });

    logger.info(`Traitement de ${recurringOrders.length} commande(s) récurrente(s)`);

    for (const recurringOrder of recurringOrders) {
      try {
        // Filtrer les produits actifs
        const activeItems = recurringOrder.items.filter(item => item.product);

        if (activeItems.length === 0) {
          logger.warn(`Aucun produit actif pour la commande récurrente ${recurringOrder.id}`);
          continue;
        }

        // Créer les items de commande avec calculs
        const orderItems = activeItems.map(item => {
          const totals = calculateOrderItemTotals(
            item.quantity,
            item.product.priceHT,
            item.product.tvaRate
          );
          return {
            productId: item.product.id,
            quantity: item.quantity,
            priceHT: item.product.priceHT,
            ...totals,
          };
        });

        const orderTotals = calculateOrderTotals(orderItems);

        // Créer la commande
        const order = await prisma.order.create({
          data: {
            shopId: recurringOrder.shopId,
            status: 'NEW',
            recurringOrderId: recurringOrder.id, // Lier à la commande récurrente
            ...orderTotals,
            items: {
              create: orderItems,
            },
          },
          include: {
            items: {
              include: {
                product: true,
              },
            },
            shop: {
              select: {
                id: true,
                name: true,
                city: true,
              },
            },
          },
        });

        // Calculer le prochain nextRun
        let nextRun = new Date(now);
        
        switch (recurringOrder.frequency) {
          case 'DAILY':
            nextRun.setDate(now.getDate() + 1);
            break;
          case 'WEEKLY':
            const daysUntil = ((recurringOrder.dayOfWeek || 0) - now.getDay() + 7) % 7 || 7;
            nextRun.setDate(now.getDate() + daysUntil);
            break;
          case 'MONTHLY':
            nextRun.setMonth(now.getMonth() + 1);
            if (recurringOrder.dayOfMonth) {
              nextRun.setDate(recurringOrder.dayOfMonth);
            }
            break;
        }

        // Mettre à jour la commande récurrente
        await prisma.recurringOrder.update({
          where: { id: recurringOrder.id },
          data: {
            lastRun: now,
            nextRun,
          },
        });

        // Notifier les admins
        try {
          await notifyNewOrder(order);
        } catch (notifError) {
          logger.warn('Erreur notification commande récurrente', { error: notifError.message });
        }

        logger.info(`Commande récurrente ${recurringOrder.id} exécutée - Commande ${order.id} créée`);
      } catch (error) {
        logger.error(`Erreur traitement commande récurrente ${recurringOrder.id}:`, { error: error.message });

        // Phase 2: notify admins on recurring order failures (was silent beyond logs)
        const nowTs = Date.now();
        const lastTs = lastFailureAlertAtByRecurringOrderId.get(recurringOrder.id) || 0;
        const THROTTLE_MS = 60 * 60 * 1000; // 1h
        if (nowTs - lastTs > THROTTLE_MS) {
          lastFailureAlertAtByRecurringOrderId.set(recurringOrder.id, nowTs);
          try {
            await notifyAdmins(
              'SYSTEM_ALERT',
              'Échec commande récurrente',
              `La commande récurrente #${recurringOrder.id.substring(0, 8)} a échoué. Vérifiez les logs.`,
              { recurringOrderId: recurringOrder.id }
            );
          } catch (alertErr) {
            logger.warn('Impossible de notifier les admins (échec commande récurrente)', { error: alertErr.message });
          }
        }
      }
    }
  } catch (error) {
    logger.error('Erreur traitement commandes récurrentes:', { error: error.message });
  }
}

// Exécuter toutes les heures
// DÉSACTIVÉ TEMPORAIREMENT - cause des crashs EADDRINUSE
// cron.schedule('0 * * * *', () => {
//   logger.info('Exécution du job de commandes récurrentes...');
//   processRecurringOrders();
// });

// Exécuter immédiatement au démarrage (en développement)
// DÉSACTIVÉ TEMPORAIREMENT
// if (process.env.NODE_ENV !== 'production') {
//   logger.info('Exécution initiale du job de commandes récurrentes...');
//   processRecurringOrders();
// }

module.exports = { processRecurringOrders };
