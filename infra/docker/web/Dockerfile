# Multi-stage build for Deep Quest Web Server
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy package files
COPY web/package.json web/.npmrc ./

# Install dependencies (no lockfile, will be generated)
RUN pnpm install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# 환경 모드: development 또는 production (기본값: development)
ARG ENVIRONMENT=development
ENV ENVIRONMENT=${ENVIRONMENT}

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY web/ .

# 빌드용 .env 설정 (NEXT_PUBLIC_* 변수는 빌드 시점에 번들됨)
# compose-build.sh가 infra/docker/web/.env 를 web/.env 로 복사해 둠. 없으면 Jenkins 등이 주입한 web/.env 사용
RUN if [ -f .env ]; then cp .env .env.local; else touch .env.local; fi

# Generate Prisma Client (DIRECT_URL needed for prisma.config.ts, but not used at generate time)
RUN DIRECT_URL="postgresql://dummy:dummy@localhost:5432/dummy" pnpm db:generate

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# 환경 모드: development 또는 production (기본값: development)
ARG ENVIRONMENT=development
ENV ENVIRONMENT=${ENVIRONMENT}

# Next.js standalone 빌드는 항상 production 모드로 빌드됨
# ENVIRONMENT는 런타임 환경 구분용 (앱 내부에서 사용)
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files if they exist
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]

