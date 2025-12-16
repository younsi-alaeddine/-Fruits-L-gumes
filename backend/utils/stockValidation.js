const prisma = require('../config/database');
const logger = require('./logger');

/**
 * Valider que le stock est suffisant et non négatif
 */
const validateStock = async (productId, requestedQuantity) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, stock: true, unit: true, deletedAt: true },
    });

    if (!product) {
      return {
        valid: false,
        error: 'Produit non trouvé',
      };
    }

    if (product.deletedAt) {
      return {
        valid: false,
        error: 'Produit supprimé',
      };
    }

    // Vérifier que le stock n'est pas négatif
    if (product.stock < 0) {
      logger.warn('Stock négatif détecté', {
        productId,
        productName: product.name,
        stock: product.stock,
      });
      return {
        valid: false,
        error: 'Stock invalide (négatif)',
      };
    }

    // Vérifier que le stock est suffisant
    if (product.stock < requestedQuantity) {
      return {
        valid: false,
        error: `Stock insuffisant pour ${product.name}. Stock disponible: ${product.stock} ${product.unit}`,
        availableStock: product.stock,
      };
    }

    return {
      valid: true,
      product,
    };
  } catch (error) {
    logger.error('Erreur validation stock', {
      productId,
      error: error.message,
    });
    return {
      valid: false,
      error: 'Erreur lors de la validation du stock',
    };
  }
};

/**
 * Vérifier que le stock ne deviendra pas négatif après une opération
 */
const validateStockOperation = async (productId, quantityChange) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, stock: true, unit: true },
    });

    if (!product) {
      return {
        valid: false,
        error: 'Produit non trouvé',
      };
    }

    const newStock = product.stock + quantityChange;

    if (newStock < 0) {
      return {
        valid: false,
        error: `Opération impossible. Stock actuel: ${product.stock} ${product.unit}, tentative: ${quantityChange > 0 ? '+' : ''}${quantityChange}`,
        currentStock: product.stock,
        requestedChange: quantityChange,
      };
    }

    return {
      valid: true,
      currentStock: product.stock,
      newStock,
    };
  } catch (error) {
    logger.error('Erreur validation opération stock', {
      productId,
      error: error.message,
    });
    return {
      valid: false,
      error: 'Erreur lors de la validation',
    };
  }
};

module.exports = {
  validateStock,
  validateStockOperation,
};

