// Stocks controller (mode dégradé sans DB)

const getAll = async (req, res) => {
  try {
    const clientId = req.clientId;
    if (!clientId) {
      return res.status(403).json({ message: 'Client ID manquant' });
    }
    // Retourner une liste vide
    return res.json({ data: [] });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors du chargement des stocks' });
  }
};

const getById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ message: 'ID invalide' });
    }
    return res.status(501).json({
      message: 'Détail stock nécessite une base de données configurée',
      error: 'DATABASE_NOT_CONFIGURED',
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors du chargement du stock' });
  }
};

const create = async (req, res) => {
  return res.status(501).json({
    message: 'Création de stock nécessite une base de données configurée',
    error: 'DATABASE_NOT_CONFIGURED',
  });
};

const update = async (req, res) => {
  return res.status(501).json({
    message: 'Mise à jour de stock nécessite une base de données configurée',
    error: 'DATABASE_NOT_CONFIGURED',
  });
};

const getByStore = async (req, res) => {
  try {
    const storeId = parseInt(req.params.storeId, 10);
    if (!storeId || Number.isNaN(storeId)) {
      return res.status(400).json({ message: 'ID de magasin invalide' });
    }
    return res.status(501).json({
      message: 'Récupération des stocks par magasin nécessite une base de données configurée',
      error: 'DATABASE_NOT_CONFIGURED',
      data: [],
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

const deleteItem = async (req, res) => {
  return res.status(501).json({
    message: 'Suppression de stock nécessite une base de données configurée',
    error: 'DATABASE_NOT_CONFIGURED',
  });
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  getByStore,
  deleteItem,
};

