# syntax=docker/dockerfile:1

# ---------- Frontend build ----------
FROM node:22-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/yanicloud/package.json frontend/yanicloud/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/yanicloud/ ./
RUN npm run build

# ---------- Backend build ----------
FROM node:22-slim AS backend-build
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY backend/ ./
RUN npm run build

# ---------- Backend production deps ----------
FROM node:22-slim AS backend-deps
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

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

COPY --from=backend-deps /app/backend/node_modules ./node_modules
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/package.json ./package.json
COPY --from=frontend-build /app/frontend/dist ./public
COPY LICENSE COPYRIGHT THIRD_PARTY_NOTICES.md ./

ENV HOST=0.0.0.0
ENV PORT=8080
ENV DATA_DIR=/data
ENV PUBLIC_DIR=/app/public
ENV REGISTRATION_ENABLED=false

VOLUME ["/data"]
EXPOSE 8080

CMD ["node", "dist/index.js"]
