# Security Audit — Validation Matrix

**Date:** 2026-01-25  
**Phase:** Principal AppSec Validation + Mandatory Hardening  

---

## Phase 1 — Validation Matrix

| # | Finding | Status | File(s) | Action |
|---|---------|--------|---------|--------|
| 1.1 | Hardcoded SMTP | OK | emailService, test-email, test-forgot-password | None |
| 1.2 | Create-admin password in response | OK | server.js | None |
| 1.3 | IDOR orders/invoices/recurring | OK | orders, invoices, recurring-orders | Fixed invoices GET /:id |
| 1.4 | Rate limit on /refresh | OK | auth.js | None |
| 1.5 | JWT expiredAt | OK | auth, errorHandler | None |
| 1.6 | Swagger in prod | OK | server.js | None |
| 1.7 | CORS * on /uploads | OK | server.js | None |
| 1.8 | PII/debug logging | OK | server, auth, errorHandler | None |
| 1.9 | Weak password | OK | auth.js | Min 8 |
| 1.10 | Avatar magic-byte | OK | avatar.js | None |
| 1.11 | HSTS | OK | server.js | None |
| 1.12 | Exports Admin | OK | exports.js | None |
| 1.13 | Sanitize console | OK | sanitize.js | None |
| 1.14 | Frontend console | OK | AuthContext | None |
| 1.15 | Logout API | OK | auth.js | None |
| — | Orders console.error | FIXED | orders.js | logger |
| — | generalLimiter skip | FIXED | rateLimiter.js | /auth, prod never skip |

---

## Phase 2 — Hardening Implemented

- **JWT:** No fallbacks; fail fast if JWT_SECRET missing or < 32 chars (`utils/jwt.js`).
- **Refresh tokens:** httpOnly, secure, SameSite=Strict cookies (`cookieHelpers`, auth routes).
- **CSRF:** XSRF-TOKEN cookie + X-CSRF-Token header on /refresh; validated server-side.
- **Deny-by-default:** Whitelist public paths; all other /api/* require Bearer (`denyByDefault.js`).
- **Rate limit:** generalLimiter applies in prod including /api/auth; skip path /auth.
- **Create-admin:** Disabled in production; routes only when NODE_ENV !== 'production'.
- **HTTPS:** Redirect HTTP to HTTPS in production (`httpsRedirect.js`).
- **Errors:** No stack/internals in prod responses (`errorHandler.js`).
- **Uploads:** Magic-byte validation; path traversal sanitization; allowed ext whitelist (`avatar.js`).

---

## Phase 3 — Hygiene

- **console:** Replaced with logger in backend runtime (orders). Scripts keep console.
- **Secrets:** Env only; no hardcoded credentials in runtime.
- **Comments:** Added where security logic is non-obvious.
- **Test scripts:** Retained for dev; exclude from production deploy per checklist.

---

## Assumptions

- NODE_ENV=production in prod. Trust proxy + X-Forwarded-* set.
- JWT_SECRET, DATABASE_URL, FRONTEND_URL from env. HTTPS at proxy.

## Residual Risk

- Access token in localStorage (XSS). Mitigate via CSP, sanitization.
- CSP style-src 'unsafe-inline' kept for current frontend; tighten with nonces later.
- npm audit items (nodemailer, bcrypt/tar, frontend) — schedule upgrades.

---

## Files Touched (Additional)

- `utils/jwt.js`, `utils/cookieHelpers.js` (new)
- `middleware/denyByDefault.js`, `middleware/httpsRedirect.js` (new)
- `middleware/rateLimiter.js`, `routes/auth.js`, `routes/avatar.js`, `routes/orders.js`, `routes/invoices.js`
- `server.js`, `frontend/src/config/api.js`, `frontend/src/api/auth.js`
