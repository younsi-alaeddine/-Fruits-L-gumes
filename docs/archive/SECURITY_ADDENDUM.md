# Security Audit — Final Addendum

**Date:** 2026-01-25  
**Auditor:** Principal Application Security Engineer (AppSec / DevSecOps)  
**Reference:** Security Audit Report + Validation Matrix  

---

## 1. What Was Additionally Fixed

### 1.1 Phase 1 Corrections (Validation)

- **Invoices GET /:id IDOR:** The report fix applied to `GET /:id/download` and list; `GET /:id` still used a CLIENT-only check. Now uses `canAccess` (ADMIN or shop in `accessibleShops`) for consistency.
- **Orders status handler:** Replaced `console.error` with `logger.error` in the `PUT /:id/status` catch block.
- **generalLimiter skip:** Skip used `req.path.startsWith('/api/auth')` but `generalLimiter` is mounted at `/api/`, so path is e.g. `/auth/login`. Updated to `/auth`. Production never skips.

### 1.2 Phase 2 — Mandatory Hardening

- **JWT_SECRET:** All fallbacks removed. App throws at startup if `JWT_SECRET` is missing or < 32 characters. Applies to all environments (dev included).
- **Refresh tokens → cookies:** Refresh token stored only in httpOnly, secure, SameSite=Strict cookie. No longer in response body or localStorage. Login and refresh set the cookie; logout clears it.
- **CSRF:** Double-submit cookie: `XSRF-TOKEN` cookie (SameSite=Strict, not httpOnly) and `X-CSRF-Token` header required on `POST /api/auth/refresh`. Validated server-side.
- **Deny-by-default:** New `denyByDefault` middleware. Explicit whitelist for public paths (`/api`, `/api/health`, `/api/auth/login`, etc.). All other `/api/*` require `Authorization: Bearer` or return 401.
- **Rate limiting:** In production, `generalLimiter` always applies (no skip). Skip limited to non-production and path `/auth`.
- **Create-admin:** `GET` and `POST /api/create-admin` are **not mounted** when `NODE_ENV === 'production'`. Use `scripts/create-admin.js` (or equivalent) for initial admin.
- **HTTPS:** New `httpsRedirect` middleware. In production, redirects HTTP to HTTPS (301) when `req.secure` is false (behind proxy).
- **Error responses:** Stack and `error` object only when `NODE_ENV !== 'production'`. Production returns generic messages.
- **Root responses:** `GET /` and `GET /api` hide `docs` / `api-docs` in production.
- **Avatar upload:** Path traversal sanitization (basename, strip `..`), allowed-extension whitelist. Continues to use `validateFile` (magic-byte).

### 1.3 Phase 3 — Code Hygiene

- **Logger:** Remaining `console.error` in orders status handler replaced with `logger.error`.
- **Secrets:** Confirmed no hardcoded secrets in runtime code. All from env.
- **Comments:** Security-related comments added in `jwt`, `cookieHelpers`, `denyByDefault`, `httpsRedirect`, avatar.

---

## 2. Assumptions

- **Environment:** `NODE_ENV=production` in production. `JWT_SECRET` (≥ 32 chars), `DATABASE_URL`, `FRONTEND_URL` (and SMTP if used) set via env.
- **Proxy:** Reverse proxy sets `X-Forwarded-Proto` and `X-Forwarded-For`. `trust proxy` configured. HTTPS terminated at proxy.
- **CORS:** `FRONTEND_URL` matches actual frontend origin(s). No wildcard for credentialed requests.
- **Deploy:** Test/dev scripts (e.g. `test-email`, `test-forgot-password`, `test-all-routes`) are not deployed or not callable in production. Excluded per Production Security Checklist.

---

## 3. Residual Risk

| Risk | Severity | Mitigation |
|------|----------|------------|
| Access token in localStorage | Medium | XSS can steal it. CSP, input sanitization, dependency hygiene. Consider memory-only or httpOnly cookie in future. |
| CSP `style-src 'unsafe-inline'` | Low | Required by current frontend. Tightening needs nonces/hashes and build changes. |
| Dependencies (npm audit) | Medium | nodemailer, bcrypt/tar, frontend build chain. Schedule upgrades and regression tests. |
| Test scripts in repo | Low | Retained for dev/ops. Excluded from production deploy via checklist. |

---

## 4. Backward Compatibility

- **Login:** Response no longer includes `refreshToken`; includes `csrfToken`. Frontend stores `accessToken` and `csrfToken`; uses cookies for refresh.
- **Refresh:** Expects refresh token in cookie and `X-CSRF-Token` header. Body `refreshToken` no longer used.
- **Logout:** Clears refresh and CSRF cookies. Frontend clears `token`, `user`, `csrfToken` from localStorage.
- **Create-admin:** Unavailable in production. Use `scripts/create-admin.js` instead.
- **JWT_SECRET:** Required in all environments. No default. Startup fails if missing or too short.

Existing clients that send `refreshToken` in body only (no cookies) will receive 401 on refresh until they adopt cookie + CSRF.

---

## 5. References

- OWASP Top 10 (2021)
- Security Audit Report (`SECURITY_AUDIT_REPORT.md`)
- Validation Matrix (`SECURITY_VALIDATION_MATRIX.md`)
- Production Security Checklist (`PRODUCTION_SECURITY_CHECKLIST.md`)

---

**Addendum version:** 1.0  
**Last updated:** 2026-01-25
