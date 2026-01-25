/**
 * Secure cookie helpers for refresh token and CSRF.
 * httpOnly, secure, SameSite=Strict. Bank-level.
 */

const cookies = {
  refresh: 'refresh_token',
  csrf: 'XSRF-TOKEN',
};

const isSecure = process.env.NODE_ENV === 'production';
const sameSite = 'Strict';
const refreshMaxAge = 7 * 24 * 60 * 60; // 7 days
const csrfMaxAge = 24 * 60 * 60; // 24h

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: isSecure,
    sameSite,
    path: '/api/auth',
    maxAge: refreshMaxAge,
  };
}

function csrfCookieOptions() {
  return {
    httpOnly: false,
    secure: isSecure,
    sameSite,
    path: '/',
    maxAge: csrfMaxAge,
  };
}

function setRefreshCookie(res, token) {
  const opts = refreshCookieOptions();
  res.cookie(cookies.refresh, token, opts);
}

function clearRefreshCookie(res) {
  res.clearCookie(cookies.refresh, {
    path: '/api/auth',
    httpOnly: true,
    secure: isSecure,
    sameSite,
  });
}

function setCsrfCookie(res, token) {
  const opts = csrfCookieOptions();
  res.cookie(cookies.csrf, token, opts);
}

function clearCsrfCookie(res) {
  res.clearCookie(cookies.csrf, {
    path: '/',
    secure: isSecure,
    sameSite,
  });
}

function getRefreshFromRequest(req) {
  return req.cookies && req.cookies[cookies.refresh] ? req.cookies[cookies.refresh] : null;
}

module.exports = {
  cookies,
  setRefreshCookie,
  clearRefreshCookie,
  setCsrfCookie,
  clearCsrfCookie,
  getRefreshFromRequest,
  refreshCookieOptions,
  csrfCookieOptions,
};
