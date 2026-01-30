// Stores controller (mode dégradé sans DB)

const getAll = async (req, res) => {
  try {
    const clientId = req.clientId;
    if (!clientId) {
      return res.status(403).json({ message: 'Client ID manquant' });
    }
    // Mode sans base: retourner une liste vide mais ne pas casser l’UI
    return res.json({ data: [] });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors du chargement des magasins' });
  }
};

const getById = async (req, res) => {
  try {
    const storeId = parseInt(req.params.id, 10);
    if (!storeId || Number.isNaN(storeId)) {
      return res.status(400).json({ message: 'ID de magasin invalide' });
    }
    // Mode sans base: pas de détail disponible
    return res.status(501).json({
      message: 'Récupération du magasin nécessite une base de données configurée',
      error: 'DATABASE_NOT_CONFIGURED',
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors du chargement du magasin' });
  }
};

const create = async (req, res) => {
  return res.status(501).json({
    message: 'Création de magasin nécessite une base de données configurée',
    error: 'DATABASE_NOT_CONFIGURED',
  });
};

const update = async (req, res) => {
  return res.status(501).json({
    message: 'Mise à jour de magasin nécessite une base de données configurée',
    error: 'DATABASE_NOT_CONFIGURED',
  });
};

const deleteItem = async (req, res) => {
  return res.status(501).json({
    message: 'Suppression de magasin nécessite une base de données configurée',
    error: 'DATABASE_NOT_CONFIGURED',
  });
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  deleteItem,
};

