const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * GET /api/admin/audit-logs
 * Récupérer les logs d'audit avec filtres et pagination
 */
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      action,
      entity,
      entityId,
      userId,
      startDate,
      endDate,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Construire les filtres
    const where = {};

    if (action) {
      where.action = action;
    }

    if (entity) {
      where.entity = entity;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Recherche dans les changes (JSON)
    if (search) {
      where.OR = [
        { entity: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
        { entityId: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Trier
    const orderBy = {};
    orderBy[sortBy] = sortOrder === 'asc' ? 'asc' : 'desc';

    // Récupérer les logs avec les informations utilisateur
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Parser les changes JSON
    const logsWithParsedChanges = logs.map((log) => {
      let parsedChanges = null;
      if (log.changes) {
        try {
          parsedChanges = JSON.parse(log.changes);
        } catch (e) {
          // Si le parsing échoue, garder la valeur originale
          parsedChanges = log.changes;
        }
      }
      return {
        ...log,
        changes: parsedChanges,
      };
    });

    res.json({
      success: true,
      logs: logsWithParsedChanges,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error('Erreur récupération logs audit:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des logs',
    });
  }
});

/**
 * GET /api/admin/audit-logs/entity/:entity/:entityId
 * Récupérer tous les logs pour une entité spécifique
 * DOIT être avant /:id pour éviter les conflits
 */
router.get('/entity/:entity/:entityId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { entity, entityId } = req.params;
    const { limit = 100 } = req.query;

    const logs = await prisma.auditLog.findMany({
      where: {
        entity,
        entityId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: parseInt(limit),
    });

    const logsWithParsedChanges = logs.map((log) => {
      let parsedChanges = null;
      if (log.changes) {
        try {
          parsedChanges = JSON.parse(log.changes);
        } catch (e) {
          parsedChanges = log.changes;
        }
      }
      return {
        ...log,
        changes: parsedChanges,
      };
    });

    res.json({
      success: true,
      logs: logsWithParsedChanges,
    });
  } catch (error) {
    // SECURITY: Use logger only, remove console.error and stack traces in production
    logger.error('Erreur récupération logs entité', { 
      error: error.message,
      entity: req.params.entity,
      entityId: req.params.entityId,
      userId: req.user?.id 
    });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des logs'
    });
  }
});

/**
 * GET /api/admin/audit-logs/stats
 * Statistiques sur les logs d'audit
 * DOIT être avant /:id pour éviter les conflits
 */
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Stats par action
    const statsByAction = await prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: {
        id: true,
      },
    });

    // Stats par entity
    const statsByEntity = await prisma.auditLog.groupBy({
      by: ['entity'],
      where,
      _count: {
        id: true,
      },
    });

    // Stats par utilisateur
    const statsByUser = await prisma.auditLog.groupBy({
      by: ['userId'],
      where,
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    // Récupérer les infos utilisateurs pour les stats
    const userIds = statsByUser
      .filter((stat) => stat.userId)
      .map((stat) => stat.userId);
    
    let users = [];
    if (userIds.length > 0) {
      users = await prisma.user.findMany({
        where: {
          id: {
            in: userIds,
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });
    }

    const statsByUserWithInfo = statsByUser.map((stat) => {
      const user = users.find((u) => u.id === stat.userId);
      return {
        ...stat,
        user: user || null,
      };
    });

    // Activité par jour (7 derniers jours)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Récupérer les logs et grouper manuellement par date (Prisma groupBy ne peut pas grouper par DateTime)
    const dailyLogs = await prisma.auditLog.findMany({
      where: {
        ...where,
        createdAt: {
          ...where.createdAt,
          gte: sevenDaysAgo,
        },
      },
      select: {
        createdAt: true,
      },
    });

    // Grouper par date
    const dailyMap = {};
    dailyLogs.forEach((log) => {
      const date = new Date(log.createdAt).toISOString().split('T')[0];
      dailyMap[date] = (dailyMap[date] || 0) + 1;
    });

    const formattedDailyActivity = Object.entries(dailyMap).map(([date, count]) => ({
      date,
      count,
    })).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      success: true,
      stats: {
        byAction: statsByAction,
        byEntity: statsByEntity,
        byUser: statsByUserWithInfo,
        dailyActivity: formattedDailyActivity,
        total: await prisma.auditLog.count({ where }),
      },
    });
  } catch (error) {
    logger.error('Erreur récupération stats audit:', { 
      error: error.message,
      stack: error.stack 
    });
    console.error('Erreur détaillée stats audit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/admin/audit-logs/:id
 * Récupérer un log d'audit spécifique avec tous les détails
 */
router.get('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    // SECURITY: Validate UUID format to prevent injection attacks
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(req.params.id)) {
      return res.status(400).json({ 
        success: false,
        message: 'ID de log invalide' 
      });
    }

    const log = await prisma.auditLog.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            shop: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Log non trouvé',
      });
    }

    // Parser les changes
    let parsedChanges = null;
    if (log.changes) {
      try {
        parsedChanges = JSON.parse(log.changes);
      } catch (e) {
        parsedChanges = log.changes;
      }
    }
    const logWithParsedChanges = {
      ...log,
      changes: parsedChanges,
    };

    res.json({
      success: true,
      log: logWithParsedChanges,
    });
  } catch (error) {
    logger.error('Erreur récupération log audit:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du log',
    });
  }
});

module.exports = router;
