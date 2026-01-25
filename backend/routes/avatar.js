const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { validateFile } = require('../middleware/fileValidation');
const logger = require('../utils/logger');

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/avatars');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const raw = path.basename(String(file.originalname || '').replace(/\.\./g, ''));
    const ext = (path.extname(raw) || '.jpg').toLowerCase();
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const safe = allowed.includes(ext) ? ext : '.jpg';
    cb(null, `avatar-${req.user.id}-${Date.now()}${safe}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /jpeg|jpg|png|gif|webp/i.test(path.extname(file.originalname)) && /^image\//.test(file.mimetype);
    if (ok) cb(null, true);
    else cb(new Error('Seules les images (JPEG, PNG, GIF, WebP) sont autorisées'));
  },
});

const uploadChain = [
  authenticate,
  (req, res, next) => {
    avatarUpload.single('avatar')(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ success: false, message: 'Image trop volumineuse (max 2 Mo)' });
        }
        return res.status(400).json({ success: false, message: err.message || 'Erreur upload' });
      }
      next();
    });
  },
  validateFile,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Aucune image envoyée' });
      }
      const photoUrl = `/uploads/avatars/${req.file.filename}`;
      const current = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { avatarUrl: true },
      });
      if (current?.avatarUrl) {
        const oldPath = path.join(__dirname, '..', current.avatarUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      const updated = await prisma.user.update({
        where: { id: req.user.id },
        data: { avatarUrl: photoUrl },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          emailVerified: true,
          avatarUrl: true,
        },
      });
      res.json({ success: true, user: updated, message: 'Photo de profil mise à jour' });
    } catch (error) {
      logger.error('Erreur mise à jour avatar', { error: error.message, userId: req.user?.id });
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  },
];

router.post('/', ...uploadChain);
router.put('/', ...uploadChain);

module.exports = router;
