// Orders controller (mode dégradé sans DB)

const getAll = async (req, res) => {
  try {
    const clientId = req.clientId;
    if (!clientId) {
      return res.status(403).json({ message: 'Client ID manquant' });
    }
    // Mode sans base: retourner une liste vide
    return res.json({ data: [], total: 0, items: [] });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors du chargement des commandes' });
  }
};

const getById = async (req, res) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    if (!orderId || Number.isNaN(orderId)) {
      return res.status(400).json({ message: 'ID de commande invalide' });
    }
    return res.status(501).json({
      message: 'Récupération de commande nécessite une base de données configurée',
      error: 'DATABASE_NOT_CONFIGURED',
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors du chargement de la commande' });
  }
};

const create = async (req, res) => {
  return res.status(501).json({
    message: 'Création de commande nécessite une base de données configurée',
    error: 'DATABASE_NOT_CONFIGURED',
  });
};

const update = async (req, res) => {
  return res.status(501).json({
    message: 'Mise à jour de commande nécessite une base de données configurée',
    error: 'DATABASE_NOT_CONFIGURED',
  });
};

const cancel = async (req, res) => {
  return res.status(501).json({
    message: 'Annulation de commande nécessite une base de données configurée',
    error: 'DATABASE_NOT_CONFIGURED',
  });
};

const downloadConfirmation = async (req, res) => {
  return res.status(501).json({
    message: 'Téléchargement de confirmation nécessite une base de données configurée',
    error: 'DATABASE_NOT_CONFIGURED',
  });
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  cancel,
  downloadConfirmation,
};

