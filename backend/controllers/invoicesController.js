// Invoices controller (mode dégradé sans DB)

const getAll = async (req, res) => {
  try {
    const clientId = req.clientId;
    if (!clientId) {
      return res.status(403).json({ message: 'Client ID manquant' });
    }
    return res.status(501).json({
      message: 'Récupération des factures nécessite une base de données configurée',
      error: 'DATABASE_NOT_CONFIGURED',
      data: [],
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors du chargement des factures' });
  }
};

const getById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ message: 'ID de facture invalide' });
    }
    return res.status(501).json({
      message: 'Récupération de facture nécessite une base de données configurée',
      error: 'DATABASE_NOT_CONFIGURED',
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors du chargement de la facture' });
  }
};

const download = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ message: 'ID de facture invalide' });
    }
    return res.status(501).json({
      message: 'Téléchargement de facture nécessite une base de données configurée',
      error: 'DATABASE_NOT_CONFIGURED',
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors du téléchargement' });
  }
};

module.exports = {
  getAll,
  getById,
  download,
};

