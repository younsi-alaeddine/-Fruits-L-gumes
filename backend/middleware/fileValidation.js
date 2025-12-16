const { fileTypeFromBuffer } = require('file-type');
const logger = require('../utils/logger');

// Types MIME autorisés pour les images
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

// Extensions autorisées
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

// Taille maximale (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Middleware pour valider les fichiers uploadés
 */
const validateFile = async (req, res, next) => {
  if (!req.file) {
    return next(); // Pas de fichier, continuer
  }

  try {
    const file = req.file;
    
    // Vérifier la taille
    if (file.size > MAX_FILE_SIZE) {
      return res.status(400).json({
        success: false,
        message: `Fichier trop volumineux. Taille maximale: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      });
    }

    // Vérifier l'extension
    const ext = require('path').extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return res.status(400).json({
        success: false,
        message: `Type de fichier non autorisé. Types autorisés: ${ALLOWED_EXTENSIONS.join(', ')}`,
      });
    }

    // Vérifier le type MIME réel (pas seulement l'extension)
    const fileType = await fileTypeFromBuffer(file.buffer);
    
    if (!fileType || !ALLOWED_MIME_TYPES.includes(fileType.mime)) {
      logger.warn('Tentative d\'upload de fichier avec type MIME invalide', {
        filename: file.originalname,
        detectedMime: fileType?.mime,
        declaredMime: file.mimetype,
      });
      
      return res.status(400).json({
        success: false,
        message: 'Type de fichier non autorisé. Le fichier doit être une image valide.',
      });
    }

    // Vérifier les dimensions si c'est une image (optionnel)
    // Pourrait utiliser sharp ou jimp pour vérifier les dimensions

    // Ajouter les informations validées au fichier
    req.file.validated = true;
    req.file.realMimeType = fileType.mime;

    next();
  } catch (error) {
    logger.error('Erreur lors de la validation du fichier', {
      error: error.message,
      filename: req.file?.originalname,
    });
    
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation du fichier',
    });
  }
};

module.exports = {
  validateFile,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE,
};
