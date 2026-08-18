# Stage 1: Build the React client
FROM oven/bun:1.3-alpine AS builder

WORKDIR /app

COPY client ./client
WORKDIR /app/client
RUN bun install && bun run build

# Stage 2: Production — Elysia backend
FROM oven/bun:1.3-alpine

# curl for the healthcheck, tzdata for correct local timestamps
RUN apk add --no-cache curl tzdata

ENV TZ=Asia/Kuala_Lumpur
WORKDIR /app

# Backend deps first (layer-cached separately from source)
COPY backend/package.json ./backend/
RUN cd backend && bun install --production

# Backend source, uploads dir, and the built client
COPY backend ./backend
COPY public ./public
COPY --from=builder /app/dist ./dist

WORKDIR /app/backend
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/v1/healthcheck || exit 1

CMD ["bun", "index.js"]
