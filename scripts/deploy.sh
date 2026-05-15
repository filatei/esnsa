#!/bin/bash
# Full deploy — backend + frontend
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "════════════════════════════════════════════════"
echo " ESNSA Full Deploy"
echo "════════════════════════════════════════════════"
bash "$SCRIPT_DIR/deploy-backend.sh"
bash "$SCRIPT_DIR/deploy-frontend.sh"
echo "════════════════════════════════════════════════"
echo " Deploy complete ✓"
echo "════════════════════════════════════════════════"
