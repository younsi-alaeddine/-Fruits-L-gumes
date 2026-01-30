// Finances controller (mode dégradé sans DB)

const getSummary = async (req, res) => {
  try {
    const clientId = req.clientId;
    if (!clientId) {
      return res.status(403).json({ message: 'Client ID manquant' });
    }
    // Retourner un résumé financier vide mais structuré
    return res.json({
      data: {
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        pendingPayments: 0,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors du chargement du résumé financier' });
  }
};

const getTransactions = async (req, res) => {
  try {
    const clientId = req.clientId;
    if (!clientId) {
      return res.status(403).json({ message: 'Client ID manquant' });
    }
    // Retourner une liste vide de transactions
    return res.json({
      data: {
        items: [],
        total: 0,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors du chargement des transactions' });
  }
};

module.exports = {
  getSummary,
  getTransactions,
};

