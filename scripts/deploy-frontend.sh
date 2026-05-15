#!/bin/bash
# Build React frontend and deploy to Apache web root
set -e

APP=/opt/esnsa
WEB=/var/www/esnsa/dist

echo "── Installing dependencies ──────────────────────"
cd "$APP/frontend"
npm install --prefer-offline

echo "── Building frontend ────────────────────────────"
VITE_API_BASE=https://esnsa.torama.money/api npm run build

echo "── Deploying to web root ────────────────────────"
rm -rf "$WEB"/*
cp -r dist/* "$WEB/"
echo " Frontend deployed ✓ ($(ls $WEB | wc -l) items in $WEB)"
