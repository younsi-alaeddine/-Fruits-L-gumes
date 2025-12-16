/**
 * Middleware pour la pagination côté serveur
 */
const paginate = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Valider les paramètres
  if (page < 1) {
    return res.status(400).json({
      success: false,
      message: 'Le numéro de page doit être supérieur à 0',
    });
  }

  if (limit < 1 || limit > 100) {
    return res.status(400).json({
      success: false,
      message: 'La limite doit être entre 1 et 100',
    });
  }

  // Ajouter les paramètres de pagination à la requête
  req.pagination = {
    page,
    limit,
    skip,
  };

  next();
};

/**
 * Formater la réponse paginée
 */
const formatPaginatedResponse = (data, total, pagination) => {
  const totalPages = Math.ceil(total / pagination.limit);
  
  return {
    success: true,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages,
      hasNextPage: pagination.page < totalPages,
      hasPrevPage: pagination.page > 1,
    },
  };
};

module.exports = {
  paginate,
  formatPaginatedResponse,
};

