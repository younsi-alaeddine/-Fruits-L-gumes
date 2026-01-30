// Products controller (mode dégradé sans DB)

const getAll = async (req, res) => {
  try {
    // Retourner une liste vide mais structure correcte
    return res.json({ data: [] });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors du chargement des produits' });
  }
};

const getById = async (req, res) => {
  try {
    return res.status(501).json({
      message: 'Détail produit nécessite une base de données configurée',
      error: 'DATABASE_NOT_CONFIGURED',
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors du chargement du produit' });
  }
};

const getByStore = async (req, res) => {
  try {
    const storeId = parseInt(req.params.storeId, 10);
    if (!storeId || Number.isNaN(storeId)) {
      return res.status(400).json({ message: 'ID de magasin invalide' });
    }
    return res.status(501).json({
      message: 'Récupération des produits par magasin nécessite une base de données configurée',
      error: 'DATABASE_NOT_CONFIGURED',
      data: [],
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors du chargement des produits' });
  }
};

const create = async (req, res) => {
  return res.status(501).json({ message: 'Création produit nécessite une base de données configurée' });
};

const update = async (req, res) => {
  return res.status(501).json({ message: 'Mise à jour produit nécessite une base de données configurée' });
};

const deleteItem = async (req, res) => {
  return res.status(501).json({ message: 'Suppression produit nécessite une base de données configurée' });
};

module.exports = {
  getAll,
  getById,
  getByStore,
  create,
  update,
  deleteItem,
};

