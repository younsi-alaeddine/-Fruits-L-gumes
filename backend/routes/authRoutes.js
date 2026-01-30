const express = require('express');
const { login, logout, refresh, getCurrentUser, changePassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.get('/me', authenticate, getCurrentUser);
router.put('/password', authenticate, changePassword);

module.exports = router;
