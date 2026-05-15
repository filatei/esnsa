#!/bin/bash
# Deploy backend — pull latest code, rebuild API container
set -e

APP=/opt/esnsa

echo "── Pulling latest code ──────────────────────────"
cd "$APP"
git pull origin master

echo "── Rebuilding API container ─────────────────────"
docker compose up -d --build api

echo "── Waiting for health check ─────────────────────"
sleep 5
curl -sf http://localhost:3031/api/health && echo " API healthy ✓" || (echo " API unhealthy ✗"; exit 1)
