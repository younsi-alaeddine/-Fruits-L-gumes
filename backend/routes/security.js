const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * GET /api/admin/security/stats
 * Statistiques de sécurité (audit logs)
 */
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [totalLogs, todayLogs, last7DaysLogs, activeUsers] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.auditLog.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { action: true, entity: true, createdAt: true },
      }),
      prisma.user.count({ where: { isActive: { not: false } } }),
    ]);

    const byAction = {};
    const byEntity = {};
    const byDay = {};

    for (const log of last7DaysLogs) {
      byAction[log.action] = (byAction[log.action] || 0) + 1;
      byEntity[log.entity] = (byEntity[log.entity] || 0) + 1;
      const key = new Date(log.createdAt).toISOString().slice(0, 10);
      byDay[key] = (byDay[key] || 0) + 1;
    }

    res.json({
      success: true,
      stats: {
        totalLogs,
        todayLogs,
        activeUsers,
        byAction,
        byEntity,
        byDay,
      },
    });
  } catch (error) {
    logger.error('Erreur stats sécurité:', { error: error.message });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;

