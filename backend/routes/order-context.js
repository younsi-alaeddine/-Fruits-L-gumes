const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * GET /api/order-context/deadline
 * Récupère l'heure limite de commande pour aujourd'hui
 */
router.get('/deadline', authenticate, async (req, res) => {
  try {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = dimanche, 6 = samedi
    
    // Chercher une deadline spécifique pour ce jour, sinon la deadline générale (dayOfWeek = null)
    const deadline = await prisma.orderDeadline.findFirst({
      where: {
        isActive: true,
        OR: [
          { dayOfWeek: dayOfWeek },
          { dayOfWeek: null } // Deadline générale
        ]
      },
      orderBy: [
        { dayOfWeek: 'desc' } // Priorité aux deadlines spécifiques
      ]
    });

    if (!deadline) {
      return res.json({
        success: true,
        deadline: null,
        message: 'Aucune heure limite configurée'
      });
    }

    // Construire la date/heure limite pour aujourd'hui
    const deadlineDate = new Date(today);
    deadlineDate.setHours(deadline.deadlineHour, deadline.deadlineMinute, 0, 0);
    
    const isPast = deadlineDate < today;
    const timeRemaining = isPast ? 0 : deadlineDate.getTime() - today.getTime();

    res.json({
      success: true,
      deadline: {
        hour: deadline.deadlineHour,
        minute: deadline.deadlineMinute,
        deadlineDate: deadlineDate.toISOString(),
        isPast,
        timeRemaining, // en millisecondes
        timeRemainingFormatted: formatTimeRemaining(timeRemaining)
      }
    });
  } catch (error) {
    logger.error('Erreur récupération deadline', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'heure limite'
    });
  }
});

/**
 * GET /api/order-context/messages
 * Récupère les messages internes actifs
 */
router.get('/messages', authenticate, async (req, res) => {
  try {
    const now = new Date();
    const messages = await prisma.internalMessage.findMany({
      where: {
        isActive: true,
        OR: [
          { validFrom: null, validTo: null },
          { validFrom: { lte: now }, validTo: null },
          { validFrom: null, validTo: { gte: now } },
          { validFrom: { lte: now }, validTo: { gte: now } }
        ]
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 10
    });

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    logger.error('Erreur récupération messages', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des messages'
    });
  }
});

/**
 * GET /api/order-context/weather
 * Récupère les conditions météo (mock pour l'instant, à intégrer avec une API météo)
 */
router.get('/weather', authenticate, async (req, res) => {
  try {
    // TODO: Intégrer une vraie API météo (OpenWeatherMap, etc.)
    // Pour l'instant, retourner des données mockées
    const weather = {
      temperature: 15,
      condition: 'Ensoleillé',
      icon: '☀️',
      description: 'Temps clair'
    };

    res.json({
      success: true,
      weather
    });
  } catch (error) {
    logger.error('Erreur récupération météo', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la météo'
    });
  }
});

/**
 * GET /api/order-context/all
 * Récupère toutes les informations contextuelles en une seule requête
 */
router.get('/all', authenticate, async (req, res) => {
  try {
    const [deadlineResult, messagesResult, weatherResult] = await Promise.all([
      prisma.orderDeadline.findFirst({
        where: {
          isActive: true,
          OR: [
            { dayOfWeek: new Date().getDay() },
            { dayOfWeek: null }
          ]
        },
        orderBy: [{ dayOfWeek: 'desc' }]
      }),
      prisma.internalMessage.findMany({
        where: {
          isActive: true,
          OR: [
            { validFrom: null, validTo: null },
            { validFrom: { lte: new Date() }, validTo: null },
            { validFrom: null, validTo: { gte: new Date() } },
            { validFrom: { lte: new Date() }, validTo: { gte: new Date() } }
          ]
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        take: 10
      }),
      Promise.resolve({ temperature: 15, condition: 'Ensoleillé', icon: '☀️' })
    ]);

    const today = new Date();
    let deadline = null;
    if (deadlineResult) {
      const deadlineDate = new Date(today);
      deadlineDate.setHours(deadlineResult.deadlineHour, deadlineResult.deadlineMinute, 0, 0);
      const isPast = deadlineDate < today;
      const timeRemaining = isPast ? 0 : deadlineDate.getTime() - today.getTime();
      
      deadline = {
        hour: deadlineResult.deadlineHour,
        minute: deadlineResult.deadlineMinute,
        deadlineDate: deadlineDate.toISOString(),
        isPast,
        timeRemaining,
        timeRemainingFormatted: formatTimeRemaining(timeRemaining)
      };
    }

    res.json({
      success: true,
      context: {
        currentDateTime: new Date().toISOString(),
        deadline,
        messages: messagesResult,
        weather: weatherResult
      }
    });
  } catch (error) {
    logger.error('Erreur récupération contexte', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du contexte'
    });
  }
});

function formatTimeRemaining(ms) {
  if (ms <= 0) return 'Dépassé';
  
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes}min`;
}

module.exports = router;
