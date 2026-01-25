const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * SECURITY: JWT_SECRET must be set in all environments. Fail fast if missing.
 * No fallbacks. Required for fintech / bank-level compliance.
 */
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || String(JWT_SECRET).trim().length < 32) {
  throw new Error(
    'CRITICAL: JWT_SECRET environment variable is required and must be at least 32 characters. ' +
    'Set JWT_SECRET in .env (all environments, including development).'
  );
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const RESET_TOKEN_EXPIRES_IN = '1h';

function generateAccessToken(userId) {
  return jwt.sign(
    { userId, type: 'access' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function generateRefreshToken(userId) {
  return jwt.sign(
    { userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
}

function generateTokens(userId) {
  return {
    accessToken: generateAccessToken(userId),
    refreshToken: generateRefreshToken(userId),
  };
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

const generateToken = generateAccessToken;

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyToken,
  generateResetToken,
  hashResetToken,
  generateToken,
  JWT_EXPIRES_IN,
  RESET_TOKEN_EXPIRES_IN,
};
