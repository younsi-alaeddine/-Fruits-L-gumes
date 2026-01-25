/**
 * Enforce HTTPS in production. Redirect HTTP -> HTTPS.
 * Requires trust proxy when behind reverse proxy (X-Forwarded-Proto).
 */

function httpsRedirect(req, res, next) {
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }
  if (req.secure) {
    return next();
  }
  const host = req.get('host') || req.hostname || 'localhost';
  const url = req.originalUrl || req.url || '/';
  return res.redirect(301, `https://${host}${url}`);
}

module.exports = { httpsRedirect };
