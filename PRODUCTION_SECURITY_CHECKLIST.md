# Production Security Checklist

**For DevOps / SRE.** Execute every item before go-live and after any infra or app change that affects security.

---

## 1. Environment

- [ ] `NODE_ENV=production` set in runtime environment (not `development` or empty).
- [ ] `JWT_SECRET` set, ≥ 32 characters, high entropy (e.g. `openssl rand -hex 32`). **No default or fallback.**
- [ ] `DATABASE_URL` set and points to production DB. Restrict DB access by firewall / IAM.
- [ ] `FRONTEND_URL` set to actual frontend origin(s) (e.g. `https://app.example.com`). No trailing slash.
- [ ] SMTP vars (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`) set if email is used. No hardcoded values.
- [ ] No `.env` or env files committed to repo or baked into images. Use secrets manager or orchestration secrets.

---

## 2. Network & TLS

- [ ] Application served over **HTTPS only**. HTTP → HTTPS redirect (app or reverse proxy).
- [ ] TLS 1.2+; strong ciphers. HSTS enabled (app or proxy), e.g. `max-age=31536000; includeSubDomains; preload`.
- [ ] Reverse proxy configured (`trust proxy`). `X-Forwarded-Proto` and `X-Forwarded-For` set correctly.
- [ ] `PROXY_IPS` set in production if using multiple hops, so rate limiting uses correct client IP.

---

## 3. API & Auth

- [ ] **`/api/create-admin`** not exposed in production (routes mounted only when `NODE_ENV !== 'production'`). Use `scripts/create-admin.js` or equivalent for initial admin.
- [ ] **`/api-docs`** not reachable in production (Swagger mounted only in non-production).
- [ ] CORS `origin` restricted to `FRONTEND_URL` (or explicit allowlist). No `*` for credentials.
- [ ] Rate limiting enabled and not bypassed in production (`generalLimiter` applies to `/api/*`, including `/api/auth`).
- [ ] Refresh token stored in **httpOnly, secure, SameSite=Strict** cookie. Not in response body or localStorage.
- [ ] CSRF protection on `/api/auth/refresh` (e.g. `X-CSRF-Token` header vs `XSRF-TOKEN` cookie).

---

## 4. Access Control & Data

- [ ] Deny-by-default in place: only whitelisted paths (`/api/health`, `/api/auth/login`, etc.) allow unauthenticated access. All other `/api/*` require `Authorization: Bearer <token>`.
- [ ] Resource-level checks (e.g. shop/org) enforced on orders, invoices, recurring-orders. No IDOR.
- [ ] Admin creation / privilege escalation only via controlled scripts or jobs, not production API.

---

## 5. Headers & Hardening

- [ ] Security headers enabled (Helmet): CSP, HSTS (prod), X-Content-Type-Options, etc.
- [ ] No stack traces or internal errors in production API responses. Generic message for 5xx.
- [ ] Root `/` and `/api` responses do not expose `/api-docs` or other dev-only endpoints in production.

---

## 6. Uploads & Files

- [ ] Uploaded files validated by type (magic-byte) and extension whitelist. No executables.
- [ ] Filenames sanitized (no `..`, path separators, or override of intended path).
- [ ] Upload directory permissions restrictive. Not executable.

---

## 7. Logging & Monitoring

- [ ] No secrets or PII in logs. No `console.log` of tokens, passwords, or full request bodies in production code.
- [ ] Log level appropriate for production (e.g. `info`). Stack traces only in non-production.
- [ ] Centralized logging and alerting on auth failures, 5xx, rate-limit hits, and security-relevant events.

---

## 8. Dependencies & Build

- [ ] `npm audit` reviewed. Critical/high issues mitigated or accepted with justification.
- [ ] Production install uses `npm ci` or equivalent. No dev-only packages in production runtime.
- [ ] Frontend built with production config. No source maps or dev tools exposed to end users.

---

## 9. Database & Backups

- [ ] Prisma migrations applied (`npm run migrate` or equivalent). Schema matches application.
- [ ] DB user has least privilege. No superuser for app.
- [ ] Backups scheduled, tested, and retained per policy. Restore tested periodically.

---

## 10. Post-Deploy Verification

- [ ] `GET /api/health` returns 200. No sensitive data in response.
- [ ] `GET /api` (no auth) returns 200. `GET /api/orders` without `Authorization` returns 401.
- [ ] Login with valid user returns 200, sets `refresh_token` (httpOnly) and access token in body. Logout clears cookie.
- [ ] `GET /api/create-admin` and `GET /api-docs` return 404 in production.
- [ ] HTTPS redirect verified. No mixed content.

---

**Checklist version:** 1.0  
**Last updated:** 2026-01-25  
**Owner:** Security / DevOps
