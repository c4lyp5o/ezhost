# Stage 1: Build the React client
FROM oven/bun:1.3-alpine AS builder

WORKDIR /app

# The footer reads the app version from the root package.json at build time.
COPY package.json ./
COPY frontend ./frontend
WORKDIR /app/frontend
RUN bun install && bun run build

# Stage 2: Production — Elysia backend
FROM oven/bun:1.3-alpine

# curl for the healthcheck, tzdata for correct local timestamps
RUN apk add --no-cache curl tzdata

ENV TZ=Asia/Kuala_Lumpur
# All persistent state outside public/ lives in /app/data (mount a volume).
ENV EZHOST_DB=/app/data/ezhost.sqlite
WORKDIR /app

# Backend deps first (layer-cached separately from source)
COPY backend/package.json ./backend/
RUN cd backend && bun install --production

# Backend source, uploads dir, and the built client
COPY backend ./backend
COPY public ./public
COPY --from=builder /app/dist ./dist

# Run unprivileged: the bun user (uid 1000, from the base image) only needs
# write access to uploads and the DB directory.
RUN mkdir -p /app/data && chown -R bun:bun /app/public /app/data
USER bun

WORKDIR /app/backend
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/v1/healthcheck || exit 1

CMD ["bun", "index.js"]
