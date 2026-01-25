/**
 * Deny-by-default authorization for /api/*.
 * Only explicitly whitelisted paths may be accessed without a Bearer token.
 * All other /api/* routes require Authorization: Bearer <token>.
 * Uses full path (e.g. /api/health, /api/auth/login).
 */

const PUBLIC_PATHS = new Set([
  '/api',
  '/api/health',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify-email',
  '/api/auth/resend-verification',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/refresh',
  '/api/auth/logout',
]);

function normalizePath(p) {
  if (!p || typeof p !== 'string') return '';
  const path = (p.split('?')[0] || '').trim();
  return path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
}

function denyByDefault(req, res, next) {
  const path = normalizePath(req.originalUrl || req.url || req.path);
  if (!path.startsWith('/api')) {
    return next();
  }
  if (PUBLIC_PATHS.has(path)) {
    return next();
  }
  const auth = req.headers.authorization;
  if (auth && typeof auth === 'string' && auth.startsWith('Bearer ')) {
    return next();
  }
  return res.status(401).json({
    success: false,
    message: 'Non authentifié',
  });
}

module.exports = { denyByDefault, PUBLIC_PATHS };
