// Users controller (mode dégradé sans DB)

const getAll = async (req, res) => {
  try {
    const clientId = req.clientId;
    if (!clientId) {
      return res.status(403).json({ message: 'Client ID manquant' });
    }
    return res.status(501).json({
      message: 'Récupération des utilisateurs nécessite une base de données configurée',
      error: 'DATABASE_NOT_CONFIGURED',
      data: [],
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors du chargement des utilisateurs' });
  }
};

const getById = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ message: 'ID utilisateur invalide' });
    }
    return res.status(501).json({
      message: 'Récupération d’utilisateur nécessite une base de données configurée',
      error: 'DATABASE_NOT_CONFIGURED',
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors du chargement de l’utilisateur' });
  }
};

const create = async (req, res) => {
  return res.status(501).json({
    message: 'Création d’utilisateur nécessite une base de données configurée',
    error: 'DATABASE_NOT_CONFIGURED',
  });
};

const update = async (req, res) => {
  return res.status(501).json({
    message: 'Mise à jour d’utilisateur nécessite une base de données configurée',
    error: 'DATABASE_NOT_CONFIGURED',
  });
};

const deleteItem = async (req, res) => {
  return res.status(501).json({
    message: 'Suppression d’utilisateur nécessite une base de données configurée',
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

