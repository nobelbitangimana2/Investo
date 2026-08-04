# ── Stage 1: build ────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# OpenSSL is needed by Prisma's schema engine at generate time
RUN apk add --no-cache openssl

COPY package*.json .npmrc ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# ── Stage 2: production image ─────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# OpenSSL is needed by Prisma's schema engine at migrate/runtime
RUN apk add --no-cache openssl

# Install production deps (prisma is in dependencies, engines install too)
COPY package*.json .npmrc ./
RUN npm ci --omit=dev

# Copy compiled app
COPY --from=builder /app/dist ./dist

# Copy generated Prisma client (query engine binary built for linux-musl)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy prisma schema (needed by migrate deploy)
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
