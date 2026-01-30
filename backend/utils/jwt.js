const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * SECURITY (production):
 * - JWT_SECRET is REQUIRED
 * - Must be high-entropy (>= 32 chars recommended)
 *
 * Non-production:
 * - Allow local development even if a weak placeholder is used,
 *   but encourage setting a proper secret.
 */
const JWT_SECRET = process.env.JWT_SECRET;
const isProd = process.env.NODE_ENV === 'production';
const secretLen = JWT_SECRET ? String(JWT_SECRET).trim().length : 0;
if (isProd && secretLen < 32) {
  throw new Error(
    'CRITICAL: JWT_SECRET is required in production and must be at least 32 characters.'
  );
}
if (!isProd && secretLen === 0) {
  // Dev fallback only (never acceptable for production).
  // eslint-disable-next-line no-console
  console.warn('WARN: JWT_SECRET is not set. Using an insecure development fallback.');
}
const EFFECTIVE_JWT_SECRET = JWT_SECRET || 'dev-insecure-jwt-secret-change-me';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const RESET_TOKEN_EXPIRES_IN = '1h';

function normalizeUserArg(userOrId) {
  if (typeof userOrId === 'string') {
    return { id: userOrId };
  }
  if (userOrId && typeof userOrId === 'object') {
    return {
      id: userOrId.id || userOrId.userId,
      role: userOrId.role,
      email: userOrId.email,
    };
  }
  return { id: undefined };
}

function generateAccessToken(userOrId) {
  const u = normalizeUserArg(userOrId);
  // Backward/forward compatible payload: keep `userId` and `id`
  const payload = {
    id: u.id,
    userId: u.id,
    role: u.role,
    email: u.email,
    type: 'access',
  };
  return jwt.sign(payload, EFFECTIVE_JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function generateRefreshToken(userOrId) {
  const u = normalizeUserArg(userOrId);
  const payload = {
    id: u.id,
    userId: u.id,
    type: 'refresh',
  };
  return jwt.sign(payload, EFFECTIVE_JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
}

function generateTokens(userOrId) {
  return {
    accessToken: generateAccessToken(userOrId),
    refreshToken: generateRefreshToken(userOrId),
  };
}

function verifyToken(token) {
  return jwt.verify(token, EFFECTIVE_JWT_SECRET);
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
