const scopeByShop = (req, res, next) => {
  try {
    const clientId = (req.user && (req.user.clientId || req.user.id)) || null;
    if (!clientId) {
      return res.status(403).json({ message: 'Client ID manquant' });
    }
    req.clientId = clientId;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Erreur de scoping' });
  }
};

const validateShopAccess = async (req, res, next) => {
  const shopId = req.params.storeId || req.body.storeId;
  const clientId = req.clientId;
  if (!shopId) {
    return next();
  }
  try {
    // Ici on pourrait vérifier que le shop appartient bien au client
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Erreur de validation du magasin' });
  }
};

module.exports = {
  scopeByShop,
  validateShopAccess,
};
