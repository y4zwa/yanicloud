# syntax=docker/dockerfile:1

# ---------- Frontend build ----------
FROM node:22-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/yanicloud/package.json frontend/yanicloud/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/yanicloud/ ./
RUN npm run build-only

# ---------- Backend build ----------
FROM node:22-slim AS backend-build
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY backend/ ./
RUN npm run build && npm prune --omit=dev

# ---------- Runtime ----------
FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-core \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    ffmpeg \
    fonts-dejavu \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

COPY --from=backend-build /app/backend/node_modules ./node_modules
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/package.json ./package.json
COPY --from=frontend-build /app/frontend/dist ./public

ENV HOST=0.0.0.0
ENV PORT=8080
ENV DATA_DIR=/data
ENV PUBLIC_DIR=/app/public

VOLUME ["/data"]
EXPOSE 8080

CMD ["node", "dist/index.js"]
