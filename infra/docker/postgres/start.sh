#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "🐘 Starting PostgreSQL container..."

# .env 파일 확인
if [ ! -f .env ]; then
  if [ -f env.template ]; then
    cp env.template .env
    echo "⚠️  Created .env from env.template. Please update with your actual values!"
  else
    echo "❌ .env file not found and env.template doesn't exist"
    exit 1
  fi
fi

# 이미지가 없으면 빌드
if ! docker images | grep -q "deepquest-postgres:latest"; then
  echo "📦 PostgreSQL image not found. Building..."
  ./compose-build.sh
fi

# 기존 컨테이너가 있으면 중지 및 삭제
if docker ps -a | grep -q "deepquest-postgres"; then
  echo "🛑 Stopping existing container..."
  docker stop deepquest-postgres 2>/dev/null || true
  docker rm deepquest-postgres 2>/dev/null || true
fi

# 네트워크 확인 및 생성
NETWORK_NAME="docker_deepquest-network"
if ! docker network ls | grep -q "$NETWORK_NAME"; then
  echo "🌐 Creating network $NETWORK_NAME..."
  docker network create "$NETWORK_NAME" 2>/dev/null || true
fi

# 컨테이너 시작
echo "🚀 Starting PostgreSQL container..."
docker run -d \
  --name deepquest-postgres \
  --network "$NETWORK_NAME" \
  -p 5432:5432 \
  --env-file .env \
  --restart unless-stopped \
  deepquest-postgres:latest

# PostgreSQL이 준비될 때까지 대기
echo "⏳ Waiting for PostgreSQL to be ready..."
RETRY_COUNT=0
MAX_RETRIES=30

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if docker exec deepquest-postgres pg_isready -U deepquest > /dev/null 2>&1; then
    echo "✅ PostgreSQL is ready!"
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "   Waiting... ($RETRY_COUNT/$MAX_RETRIES)"
  sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "❌ PostgreSQL failed to start within timeout"
  exit 1
fi

# Prisma 마이그레이션 실행
echo ""
echo "🔄 Running Prisma migrations..."

# .env 파일에서 비밀번호 읽기
source .env
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-smt32f734o}
POSTGRES_USER=${POSTGRES_USER:-deepquest}
POSTGRES_DB=${POSTGRES_DB:-deepquest}

cd /Users/hongyongjae/Desktop/deep-quest/web

DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}" \
DIRECT_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}" \
npx prisma migrate deploy

echo ""
echo "✅ PostgreSQL started and migrations completed!"
echo ""
echo "📝 Connection info:"
echo "   Host: localhost"
echo "   Port: 5432"
echo "   Database: deepquest"
echo "   User: deepquest"
echo ""
echo "💡 To connect:"
echo "   cd infra/docker/postgres && ./psql.sh"
