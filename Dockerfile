# ─────────────────────────────────────────────────────────────
# ESNSA API — Dockerfile
# ─────────────────────────────────────────────────────────────

FROM node:20-alpine

# Create app directory owned by non-root user
RUN addgroup -S esnsa && adduser -S esnsa -G esnsa

WORKDIR /app

# Install dependencies first (layer cache)
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy backend source
COPY backend/ .

# Copy db scripts (schema + seed generator)
# (already included in backend/db/)

# Create uploads directory
RUN mkdir -p /app/uploads && chown esnsa:esnsa /app/uploads

USER esnsa

EXPOSE 3031

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3031/api/health || exit 1

CMD ["node", "server.js"]
