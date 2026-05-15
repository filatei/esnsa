#!/bin/bash
# Deploy backend — force-sync code, install deps, rebuild API, run migrations
set -e

APP=/opt/esnsa

echo "── Syncing latest code ──────────────────────────"
cd "$APP"
git fetch origin master
git reset --hard origin/master
git clean -fd

echo "── Installing backend dependencies ─────────────"
cd "$APP/backend"
npm install --omit=dev --prefer-offline

echo "── Rebuilding API container ─────────────────────"
cd "$APP"
docker compose up -d --build api

echo "── Waiting for health check ─────────────────────"
sleep 6
curl -sf http://localhost:3031/api/health && echo " API healthy ✓" || (echo " API unhealthy ✗"; exit 1)

echo "── Running DB migrations ────────────────────────"
docker compose exec -T db psql -U esnsa_user -d esnsa_db \
  < "$APP/backend/db/migrations/001_webauthn.sql" \
  && echo " Migrations applied ✓"
