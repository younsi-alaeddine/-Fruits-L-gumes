const prisma = require('../config/database');
const logger = require('./logger');

/**
 * Helper pour soft delete - mettre à jour deletedAt au lieu de supprimer
 */
const softDelete = async (model, id) => {
  try {
    const result = await prisma[model].update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    
    logger.info(`Élément supprimé (soft delete)`, { model, id });
    return result;
  } catch (error) {
    logger.error(`Erreur lors du soft delete`, { model, id, error: error.message });
    throw error;
  }
};

/**
 * Helper pour exclure les éléments supprimés dans les requêtes
 */
const excludeDeleted = (where = {}) => {
  return {
    ...where,
    deletedAt: null,
  };
};

/**
 * Restaurer un élément supprimé (soft delete)
 */
const restore = async (model, id) => {
  try {
    const result = await prisma[model].update({
      where: { id },
      data: { deletedAt: null },
    });
    
    logger.info(`Élément restauré`, { model, id });
    return result;
  } catch (error) {
    logger.error(`Erreur lors de la restauration`, { model, id, error: error.message });
    throw error;
  }
};

/**
 * Supprimer définitivement un élément
 */
const hardDelete = async (model, id) => {
  try {
    const result = await prisma[model].delete({
      where: { id },
    });
    
    logger.info(`Élément supprimé définitivement`, { model, id });
    return result;
  } catch (error) {
    logger.error(`Erreur lors de la suppression définitive`, { model, id, error: error.message });
    throw error;
  }
};

module.exports = {
  softDelete,
  excludeDeleted,
  restore,
  hardDelete,
};

