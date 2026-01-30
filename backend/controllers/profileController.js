// Profile controller (mode dégradé sans DB)

const get = async (req, res) => {
  try {
    const clientId = req.user?.id || req.user?.userId || null;
    if (!clientId) {
      return res.status(403).json({ message: 'Utilisateur non authentifié' });
    }
    // Retourner un profil minimal basé sur le token
    return res.json({
      id: clientId,
      email: req.user.email,
      name: req.user.name || 'Utilisateur',
      role: req.user.role,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la récupération du profil' });
  }
};

const update = async (req, res) => {
  return res.status(501).json({
    message: 'Mise à jour du profil nécessite une base de données configurée',
    error: 'DATABASE_NOT_CONFIGURED',
  });
};

const uploadAvatar = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Fichier manquant' });
  }
  return res.status(501).json({
    message: 'Upload d’avatar nécessite une base de données / stockage configuré',
    error: 'FILE_STORAGE_NOT_CONFIGURED',
  });
};

module.exports = {
  get,
  update,
  uploadAvatar,
};

