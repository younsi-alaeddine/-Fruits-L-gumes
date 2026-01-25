# Security Audit Report — Distribution Fruits & Légumes

**Date:** 2026-01-25  
**Auditor:** Senior Application Security  
**Scope:** Frontend (React), Backend (Express, Prisma), API, configuration, dependencies  

---

## Executive Summary

A full security audit was performed on the fruits-legumes application. **Critical and high-severity issues** (hardcoded secrets, IDOR, sensitive data exposure, weak password policy) were identified and **fixed**. The codebase is now hardened for production use, with remaining recommendations documented below.

**Summary of fixes:**
- **Critical:** Removed hardcoded SMTP credentials; create-admin no longer returns passwords; stricter secret handling.
- **High:** IDOR fixes on orders, invoices, recurring-orders; rate limiting on refresh; JWT error handling; Swagger disabled in production; secure CORS for `/uploads`.
- **Medium:** Password policy (min 8 chars); auth profile debug logging removed; HSTS in production; error handler stack logging restricted; file-type validation on avatar upload.
- **Low:** Exports base route gated by Admin; sanitize MongoDB logging via logger; frontend login console logging removed.

---

## 1. Vulnerabilities Found and Fixed

### 1.1 CRITICAL — Hardcoded SMTP Credentials (Secrets Exposure)

| Item | Details |
|------|---------|
| **Severity** | Critical |
| **OWASP** | A02:2021 – Cryptographic Failures / A07:2021 – Identification and Authentication Failures |
| **Impact** | Plaintext SMTP credentials in source (emailService, test-email, test-forgot-password). Repo compromise = full email account takeover. |
| **Exploit** | Attacker with codebase or log access obtains `contact@fatah-commander.cloud` / `Younsi@admin1`. |

**Fix:**
- Removed all hardcoded SMTP values from `utils/emailService.js`, `scripts/test-email.js`, `scripts/test-forgot-password.js`.
- Email sending uses **only** `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` from environment.
- Test scripts exit with a clear error if `.env` SMTP vars are missing.

**Files changed:** `backend/utils/emailService.js`, `backend/scripts/test-email.js`, `backend/scripts/test-forgot-password.js`

---

### 1.2 CRITICAL — Create-Admin Returns Password in Response

| Item | Details |
|------|---------|
| **Severity** | Critical |
| **OWASP** | A01:2021 – Broken Access Control, A09:2021 – Security Logging and Monitoring Failures |
| **Impact** | Response included `password: 'admin123'`. Anyone with access to create-admin (dev or key) could log it. |
| **Exploit** | Call `GET/POST /api/create-admin` and capture credentials from JSON. |

**Fix:**
- Create-admin responses **no longer return the password**.
- Messages now state “use the configured password” / “change it immediately after login”.
- POST handler no longer redirects with `?key=...` (avoids key in URL/Referer).

**Files changed:** `backend/server.js`

---

### 1.3 HIGH — IDOR on Orders, Invoices, Recurring-Orders

| Item | Details |
|------|---------|
| **Severity** | High |
| **OWASP** | A01:2021 – Broken Access Control |
| **Impact** | Non-ADMIN roles (e.g. MANAGER, PREPARATEUR) could access **any** order, invoice, or run **any** recurring order by ID. List endpoints also lacked proper scoping for non-ADMIN. |
| **Exploit** | Authenticate as MANAGER, call `GET /api/orders/:id`, `GET /api/invoices/:id`, `POST /api/recurring-orders/:id/run` with other tenants’ IDs. |

**Fix:**
- **Orders:** `GET /`, `GET /:id`, `GET /:id/download-confirmation` now enforce access:
  - **ADMIN:** full access.
  - **Others:** only resources whose `shopId` is in `req.context.accessibleShops`.
- **Orders list:** Non-ADMIN always filtered by `accessibleShops` (scope `shop` or `org`).
- **Invoices:** Same model for `GET /`, `GET /:id`, `GET /:id/download`; list uses orders from accessible shops only.
- **Recurring-orders:** `POST /:id/run` requires `recurringOrder.shopId` in `accessibleShops` for non-ADMIN.

**Files changed:** `backend/routes/orders.js`, `backend/routes/invoices.js`, `backend/routes/recurring-orders.js`

---

### 1.4 HIGH — Missing Rate Limiting on Token Refresh

| Item | Details |
|------|---------|
| **Severity** | High |
| **OWASP** | A07:2021 – Identification and Authentication Failures |
| **Impact** | `POST /api/auth/refresh` was not rate-limited. Enables brute-force or abuse of refresh tokens. |
| **Exploit** | Automated requests to `/auth/refresh` with stolen or guessed refresh tokens. |

**Fix:**
- `authLimiter` applied to `POST /api/auth/refresh`.

**Files changed:** `backend/routes/auth.js`

---

### 1.5 HIGH — JWT TokenExpiredError Exposes `expiredAt`

| Item | Details |
|------|---------|
| **Severity** | High (information disclosure) |
| **OWASP** | A04:2021 – Insecure Design |
| **Impact** | 401 responses included `expiredAt`. Leaks token expiry logic and exact timestamps. |
| **Exploit** | Inspect 401 response to infer JWT expiry and tune attacks. |

**Fix:**
- Auth middleware and global error handler **no longer** return `expiredAt`. Only `message: 'Token expiré'` is sent.

**Files changed:** `backend/middleware/auth.js`, `backend/middleware/errorHandler.js`

---

### 1.6 HIGH — Swagger API Docs Exposed in Production

| Item | Details |
|------|---------|
| **Severity** | High |
| **OWASP** | A01:2021 – Broken Access Control, A05:2021 – Security Misconfiguration |
| **Impact** | `/api-docs` available in production. Reveals routes, parameters, and structure. |
| **Exploit** | Enumerate endpoints and design targeted attacks. |

**Fix:**
- Swagger UI **mounted only when `NODE_ENV !== 'production'`**. Production has no `/api-docs`.

**Files changed:** `backend/server.js`

---

### 1.7 HIGH — Insecure CORS on `/uploads`

| Item | Details |
|------|---------|
| **Severity** | High |
| **OWASP** | A05:2021 – Security Misconfiguration |
| **Impact** | `/uploads` used `Access-Control-Allow-Origin: *` while app CORS is origin-specific. Inconsistent and permissive. |
| **Exploit** | Any site can embed/access uploads; potential bypass of intended origin checks. |

**Fix:**
- `/uploads` now uses the same origin as app CORS (`FRONTEND_URL` or `http://localhost:3000`). No wildcard.

**Files changed:** `backend/server.js`

---

### 1.8 MEDIUM — PII and Debug Logging (Profile, Errors)

| Item | Details |
|------|---------|
| **Severity** | Medium |
| **OWASP** | A09:2021 – Security Logging and Monitoring Failures |
| **Impact** | PUT `/api/auth/profile` body and parsing details logged. Error handler always logged full `stack`. Logs could expose PII or internal paths. |
| **Exploit** | Access to logs (e.g. central logging) to recover profile data or stack traces. |

**Fix:**
- Removed all debug logging of request body for `PUT /auth/profile` (server and auth route).
- Error handler logs **stack only in non-production**. Production logs exclude stack.

**Files changed:** `backend/server.js`, `backend/routes/auth.js`, `backend/middleware/errorHandler.js`

---

### 1.9 MEDIUM — Weak Password Policy

| Item | Details |
|------|---------|
| **Severity** | Medium |
| **OWASP** | A07:2021 – Identification and Authentication Failures |
| **Impact** | Minimum length 6. Below common guidance (e.g. OWASP 8+). |
| **Exploit** | Easier brute-force and credential stuffing. |

**Fix:**
- Min length **8** for register, change-password, reset-password. Validation messages updated.

**Files changed:** `backend/routes/auth.js`

---

### 1.10 MEDIUM — Avatar Upload Without Magic-Byte Validation

| Item | Details |
|------|---------|
| **Severity** | Medium |
| **OWASP** | A04:2021 – Insecure Design, A03:2021 – Injection |
| **Impact** | Validation relied on extension + `Content-Type`. Malicious files could be disguised as images. |
| **Exploit** | Upload executable or polyglot with image extension / mimetype. |

**Fix:**
- Avatar route uses `validateFile` middleware (`file-type` magic-byte check) in addition to multer.

**Files changed:** `backend/routes/avatar.js`

---

### 1.11 MEDIUM — HSTS Not Enforced in Production

| Item | Details |
|------|---------|
| **Severity** | Medium |
| **OWASP** | A02:2021 – Cryptographic Failures, A05:2021 – Security Misconfiguration |
| **Impact** | Missing HSTS allows downgrade or mixed content over HTTP. |
| **Exploit** | MITM or redirect to HTTP. |

**Fix:**
- Helmet configured with **HSTS** in production: `maxAge: 31536000`, `includeSubDomains`, `preload`.

**Files changed:** `backend/server.js`

---

### 1.12 LOW — Exports Base Route Without Admin Check

| Item | Details |
|------|---------|
| **Severity** | Low |
| **OWASP** | A01:2021 – Broken Access Control |
| **Impact** | `GET /api/exports` (list of export types) required only `authenticate`. Inconsistent with other export endpoints. |
| **Exploit** | Non-admin learns available export types. |

**Fix:**
- `GET /api/exports` now uses `requireAdmin` as well.

**Files changed:** `backend/routes/exports.js`

---

### 1.13 LOW — MongoDB Sanitize Logging via `console.warn`

| Item | Details |
|------|---------|
| **Severity** | Low |
| **OWASP** | A09:2021 – Security Logging and Monitoring Failures |
| **Impact** | Injection attempts logged with `console.warn`. Bypasses structured logging and potential log aggregation. |
| **Exploit** | Minor; improves consistency and operational visibility. |

**Fix:**
- `sanitize` middleware uses `logger.warn` instead of `console.warn`.

**Files changed:** `backend/middleware/sanitize.js`

---

### 1.14 LOW — Frontend Login Console Logging

| Item | Details |
|------|---------|
| **Severity** | Low |
| **OWASP** | A09:2021 – Security Logging and Monitoring Failures |
| **Impact** | Email and API response logged in browser console. Risk in shared machines or screencasts. |
| **Exploit** | Shoulder surfing or dev tools inspection. |

**Fix:**
- Removed `console.log` / `console.error` from login flow in `AuthContext`.

**Files changed:** `frontend/src/contexts/AuthContext.jsx`

---

### 1.15 Missing Logout API

| Item | Details |
|------|---------|
| **Severity** | Low |
| **OWASP** | A07:2021 – Identification and Authentication Failures |
| **Impact** | Frontend called `POST /api/auth/logout` but no route existed. 404 on logout. |
| **Exploit** | N/A. |

**Fix:**
- Added `POST /api/auth/logout` returning `{ success: true, message: 'Déconnexion effectuée' }`. Client continues to clear tokens locally.

**Files changed:** `backend/routes/auth.js`

---

## 2. Security Best Practices Applied

- **OWASP Top 10 (2021):** Addressed A01 (Access Control), A02 (Cryptographic Failures), A04 (Insecure Design), A05 (Misconfiguration), A07 (Auth Failures), A09 (Logging).
- **Secrets:** No hardcoded credentials; use `.env` and fail clearly when missing in production.
- **Authentication:** JWT + refresh, rate limiting on login/forgot-password/refresh, email verification, admin approval for clients.
- **Authorization:** Role-based middlewares (`requireAdmin`, `requireClient`, `requireRole`, etc.) and **resource-level** checks (shop/organization) for orders, invoices, recurring-orders.
- **Input validation:** `express-validator` on auth and key routes; UUID checks on IDs; XSS sanitization; MongoDB sanitize (defense in depth); file-type validation for uploads.
- **Headers:** Helmet (CSP, HSTS in prod, etc.), CORS restricted to `FRONTEND_URL`, no wildcard on `/uploads`.
- **Error handling:** No stack or internal details in production responses; limited stack in production logs.
- **Password policy:** Minimum 8 characters; bcrypt for hashing.

---

## 3. Dependencies (npm audit)

**Backend**
- `npm audit fix` applied (e.g. lodash, qs).
- **Remaining (require breaking updates):** nodemailer, tar/node-pre-gyp/bcrypt. Documented; consider `npm audit fix --force` and regression testing.

**Frontend**
- `npm audit fix` applied where possible.
- **Remaining (often tied to react-scripts):** jsPDF, nth-check, postcss, webpack-dev-server, etc. Upgrading may require moving to another build setup (e.g. Vite) or waiting for react-scripts updates.

**Recommendation:** Schedule dependency upgrades and test thoroughly; mitigate residual risks with build/deploy isolation and WAF/IDS where applicable.

---

## 4. Recommendations Not Implemented (Optional Hardening)

1. **JWT secret in development**  
   `utils/jwt.js` still uses a dev default when `JWT_SECRET` is unset. Production correctly fails. Consider removing the fallback and always requiring `JWT_SECRET` for all environments.

2. **Refresh token storage**  
   Refresh tokens are stored in `localStorage`. XSS can steal them. Consider **httpOnly, secure, SameSite cookies** for refresh tokens, with CSRF protection.

3. **CSRF**  
   API uses Bearer tokens; no cookie-based session auth. CSRF risk is lower but not zero if cookies are introduced. If you add cookie-based auth, implement CSRF tokens.

4. **Stricter CSP**  
   `styleSrc` includes `'unsafe-inline'`. Tightening (e.g. nonces or hashes) would reduce XSS surface but may require frontend changes.

5. **Rate limiting**  
   General API rate limit is bypassed for `/api/auth` in development. Ensure production does **not** skip auth routes for the general limiter.

6. **Create-admin in production**  
   Route remains available with `ADMIN_CREATION_KEY`. Prefer **disabling** it in production and using `scripts/create-admin.js` or equivalent out-of-band admin creation.

---

## 5. Checklist for Production Deployment

- [ ] Set `NODE_ENV=production`
- [ ] Configure `JWT_SECRET`, `DATABASE_URL`, `FRONTEND_URL` (and SMTP vars if emails used) in environment only
- [ ] Ensure no `.env` or secrets in repo or images
- [ ] Use HTTPS and a reverse proxy (e.g. Nginx); enable HSTS at proxy if not only in app
- [ ] Verify CORS `origin` matches actual frontend origin(s)
- [ ] Confirm `/api-docs` is not reachable (Swagger disabled in production)
- [ ] Run `npm run migrate` for Prisma
- [ ] Create initial admin via secure script or one-off job, not `/api/create-admin`
- [ ] Rotate any previously exposed SMTP or admin credentials
- [ ] Confirm rate limiting and auth limits behave correctly in production

---

## 6. Files Modified (Summary)

| Path | Changes |
|------|---------|
| `backend/server.js` | Remove profile debug logging; create-admin fixes; Swagger conditional; /uploads CORS; HSTS |
| `backend/routes/auth.js` | Profile logging removed; refresh rate limit; logout route; password min 8; TokenExpiredError |
| `backend/routes/orders.js` | IDOR fixes for list, get, download-confirmation |
| `backend/routes/invoices.js` | IDOR fixes for list, get, download |
| `backend/routes/recurring-orders.js` | IDOR fix for run |
| `backend/routes/avatar.js` | validateFile (magic-byte) for avatar upload |
| `backend/routes/exports.js` | requireAdmin on GET / |
| `backend/middleware/auth.js` | No expiredAt in 401 |
| `backend/middleware/errorHandler.js` | No expiredAt; stack only in non-prod logs |
| `backend/middleware/sanitize.js` | Logger instead of console.warn |
| `backend/utils/emailService.js` | No hardcoded SMTP; env-only |
| `backend/scripts/test-email.js` | Env-only SMTP; exit if missing |
| `backend/scripts/test-forgot-password.js` | Env-only SMTP; exit if missing |
| `frontend/src/contexts/AuthContext.jsx` | Removed login console logging |

---

**End of report.** For questions or re-audit, contact your security team.
