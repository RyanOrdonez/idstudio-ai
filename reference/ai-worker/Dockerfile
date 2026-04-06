# syntax=docker/dockerfile:1

# ─── Stage 1: Install dependencies ───────────────────────────────────────────
FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package manifests for dependency installation
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/ai-worker/package.json ./apps/ai-worker/
COPY packages/ ./packages/

# Install all dependencies (including dev, needed for build)
RUN pnpm install --frozen-lockfile


# ─── Stage 2: Build ──────────────────────────────────────────────────────────
FROM deps AS builder

WORKDIR /app

# Copy full source
COPY . .

# Build the ai-worker package
RUN pnpm --filter ai-worker build


# ─── Stage 3: Production runner ──────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache libc6-compat

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 workeruser

# Copy workspace manifest files
COPY --from=builder /app/package.json          ./package.json
COPY --from=builder /app/pnpm-lock.yaml        ./pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml   ./pnpm-workspace.yaml

# Copy shared packages
COPY --from=builder /app/packages/             ./packages/

# Copy the built ai-worker app
COPY --from=builder /app/apps/ai-worker/package.json ./apps/ai-worker/package.json
COPY --from=builder /app/apps/ai-worker/dist/        ./apps/ai-worker/dist/

# Install production-only dependencies
RUN pnpm install --frozen-lockfile --prod

USER workeruser

# The worker signals liveness by touching /tmp/worker-alive (checked by ECS health check)
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "require('fs').statSync('/tmp/worker-alive')" || exit 1

CMD ["node", "apps/ai-worker/dist/index.js"]
