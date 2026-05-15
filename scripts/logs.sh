#!/bin/bash
# View live container logs
cd /opt/esnsa
case "${1:-api}" in
  api)  docker compose logs -f api ;;
  db)   docker compose logs -f db ;;
  all)  docker compose logs -f ;;
  *)    echo "Usage: logs.sh [api|db|all]"; exit 1 ;;
esac
