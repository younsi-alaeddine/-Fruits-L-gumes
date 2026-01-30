#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/fruits-legumes"
APP_NAME="fruits-legumes-api-5001"
TMP_SCALE_INSTANCES="${TMP_SCALE_INSTANCES:-2}"

echo "[deploy] $(date -u +"%Y-%m-%dT%H:%M:%SZ") start"

cd "$APP_DIR"

echo "[deploy] git pull"
git pull --ff-only

echo "[deploy] backend install + prisma migrate"
cd "$APP_DIR/backend"
npm ci
npx prisma generate
npx prisma migrate deploy

echo "[deploy] frontend install + build"
cd "$APP_DIR/frontend"
npm ci
CI=false npm run build

echo "[deploy] pm2 reload"
# Zero-downtime reload requires at least 2 instances. Temporarily scale up if needed.
pm2 scale "$APP_NAME" "$TMP_SCALE_INSTANCES" >/dev/null 2>&1 || true
pm2 reload "$APP_NAME" --update-env || pm2 restart "$APP_NAME"
pm2 save

echo "[deploy] smoke health"
curl -fsS "http://127.0.0.1:5001/api/health" >/dev/null
curl -fsS "http://127.0.0.1:5001/api/health/db" >/dev/null

echo "[deploy] done"

