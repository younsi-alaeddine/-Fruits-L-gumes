const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * GET /api/settings
 * Récupérer toutes les settings ou par catégorie
 */
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { category } = req.query;
    
    const where = category ? { category } : {};

    const settings = await prisma.setting.findMany({
      where,
      orderBy: { category: 'asc' },
    });

    // Grouper par catégorie
    const grouped = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    }, {});

    res.json({
      success: true,
      settings: category ? settings : grouped,
    });
  } catch (error) {
    logger.error('Erreur récupération settings:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des paramètres',
    });
  }
});

/**
 * GET /api/settings/:key
 * Récupérer une setting spécifique
 */
router.get('/:key', authenticate, requireAdmin, async (req, res) => {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: req.params.key },
    });

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Paramètre non trouvé',
      });
    }

    // Convertir la valeur selon le type
    let value = setting.value;
    if (setting.type === 'number') {
      value = parseFloat(setting.value);
    } else if (setting.type === 'boolean') {
      value = setting.value === 'true';
    } else if (setting.type === 'json') {
      value = JSON.parse(setting.value);
    }

    res.json({
      success: true,
      setting: {
        ...setting,
        value,
      },
    });
  } catch (error) {
    logger.error('Erreur récupération setting:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du paramètre',
    });
  }
});

/**
 * PUT /api/settings
 * Mettre à jour plusieurs settings
 */
router.put('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { settings } = req.body; // Array of {key, value} objects

    if (!Array.isArray(settings)) {
      return res.status(400).json({
        success: false,
        message: 'Les paramètres doivent être un tableau',
      });
    }

    const updated = await Promise.all(
      settings.map(async ({ key, value }) => {
        const setting = await prisma.setting.findUnique({
          where: { key },
        });

        if (!setting) {
          throw new Error(`Setting ${key} not found`);
        }

        // Convertir la valeur en string selon le type
        let stringValue = value;
        if (setting.type === 'boolean') {
          stringValue = value ? 'true' : 'false';
        } else if (setting.type === 'json') {
          stringValue = JSON.stringify(value);
        } else if (setting.type === 'number') {
          stringValue = value.toString();
        }

        return prisma.setting.update({
          where: { key },
          data: {
            value: stringValue,
            updatedBy: req.user.id,
          },
        });
      })
    );

    res.json({
      success: true,
      message: 'Paramètres mis à jour avec succès',
      settings: updated,
    });
  } catch (error) {
    logger.error('Erreur mise à jour settings:', { error: error.message });
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la mise à jour des paramètres',
    });
  }
});

/**
 * PUT /api/settings/:key
 * Mettre à jour une setting spécifique
 */
router.put('/:key', authenticate, requireAdmin, async (req, res) => {
  try {
    const { value } = req.body;

    const setting = await prisma.setting.findUnique({
      where: { key: req.params.key },
    });

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Paramètre non trouvé',
      });
    }

    // Convertir la valeur en string selon le type
    let stringValue = value;
    if (setting.type === 'boolean') {
      stringValue = value ? 'true' : 'false';
    } else if (setting.type === 'json') {
      stringValue = JSON.stringify(value);
    } else if (setting.type === 'number') {
      stringValue = value.toString();
    }

    const updated = await prisma.setting.update({
      where: { key: req.params.key },
      data: {
        value: stringValue,
        updatedBy: req.user.id,
      },
    });

    // Convertir la valeur pour la réponse
    let convertedValue = updated.value;
    if (updated.type === 'number') {
      convertedValue = parseFloat(updated.value);
    } else if (updated.type === 'boolean') {
      convertedValue = updated.value === 'true';
    } else if (updated.type === 'json') {
      convertedValue = JSON.parse(updated.value);
    }

    res.json({
      success: true,
      message: 'Paramètre mis à jour avec succès',
      setting: {
        ...updated,
        value: convertedValue,
      },
    });
  } catch (error) {
    logger.error('Erreur mise à jour setting:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du paramètre',
    });
  }
});

module.exports = router;
