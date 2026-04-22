#!/bin/bash
set -e

cd "$(dirname "$0")/.."
INFRA_ROOT="$(pwd)"

echo "🚀 Starting Deep Quest Full Stack..."
echo ""

# 환경 모드 설정: shell 환경변수 우선, 없으면 기본값 development
ENVIRONMENT=${ENVIRONMENT:-development}
echo "🔧 Environment: $ENVIRONMENT"

# Check environment files
echo "Checking environment files..."

# Compose 레벨 .env 파일 선택 (ENVIRONMENT에 따라)
if [ "$ENVIRONMENT" = "production" ] && [ -f docker/.env.prod ]; then
    cp docker/.env.prod docker/.env
    echo "   Using docker/.env.prod for Compose"
elif [ "$ENVIRONMENT" = "development" ] && [ -f docker/.env.dev ]; then
    cp docker/.env.dev docker/.env
    echo "   Using docker/.env.dev for Compose"
elif [ ! -f docker/.env ]; then
    if [ -f docker/env.template ]; then
        cp docker/env.template docker/.env
        echo "   Created docker/.env from env.template (compose-level variables)"
    fi
fi

# Check if images exist
echo "Checking Docker images..."

# 환경에 따라 이미지 태그 결정
if [ "$ENVIRONMENT" = "production" ]; then
    IMAGE_TAG="prod"
else
    IMAGE_TAG="dev"
fi

if ! docker images | grep -q "deepquest-ai:${IMAGE_TAG}"; then
    echo "❌ AI Server image (${IMAGE_TAG}) not found. Building..."
    (cd docker/ai && ENVIRONMENT=${ENVIRONMENT} ./compose-build.sh) || {
        echo "❌ Failed to build AI Server image. Exiting..."
        exit 1
    }
fi

if ! docker images | grep -q "deepquest-web:${IMAGE_TAG}"; then
    echo "❌ Web Server image (${IMAGE_TAG}) not found. Building..."
    (cd docker/web && ENVIRONMENT=${ENVIRONMENT} ./compose-build.sh) || {
        echo "❌ Failed to build Web Server image. Exiting..."
        exit 1
    }
fi

echo "✅ All images ready"
echo ""

# AI 서버 .env 파일 선택
if [ "$ENVIRONMENT" = "production" ] && [ -f docker/ai/.env.prod ]; then
    cp docker/ai/.env.prod docker/ai/.env
    echo "   Using docker/ai/.env.prod for AI Server"
elif [ "$ENVIRONMENT" = "development" ] && [ -f docker/ai/.env.dev ]; then
    cp docker/ai/.env.dev docker/ai/.env
    echo "   Using docker/ai/.env.dev for AI Server"
elif [ ! -f docker/ai/.env ]; then
    echo "⚠️  AI Server .env not found"
    if [ -f docker/ai/env.template ]; then
        cp docker/ai/env.template docker/ai/.env
        echo "   Created docker/ai/.env from template"
    fi
    echo "   ❗ Please update docker/ai/.env with your Gemini API key!"
fi

# Web 서버 .env 파일 선택
if [ "$ENVIRONMENT" = "production" ] && [ -f docker/web/.env.prod ]; then
    cp docker/web/.env.prod docker/web/.env
    echo "   Using docker/web/.env.prod for Web Server"
elif [ "$ENVIRONMENT" = "development" ] && [ -f docker/web/.env.dev ]; then
    cp docker/web/.env.dev docker/web/.env
    echo "   Using docker/web/.env.dev for Web Server"
elif [ ! -f docker/web/.env ]; then
    echo "⚠️  Web Server .env not found"
    if [ -f docker/web/env.template ]; then
        cp docker/web/env.template docker/web/.env
        echo "   Created docker/web/.env from template"
    fi
    echo "   ❗ Please update docker/web/.env with your configuration!"
fi

echo ""
echo "Starting all services (ENVIRONMENT=$ENVIRONMENT)..."

ENVIRONMENT=${ENVIRONMENT} docker-compose -f docker/docker-compose.yml up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 20

echo ""
echo "Service status:"
docker-compose -f docker/docker-compose.yml ps

echo ""
echo "✅ Deep Quest is running!"
echo ""
echo "Access URLs:"
echo "   Web App:    http://localhost:3000"
echo "   AI Server:  http://localhost:8123/docs"
echo ""
echo "View logs:"
echo "   docker-compose -f docker/docker-compose.yml logs -f"
echo ""
echo "🛑 Stop services:"
echo "   docker-compose -f docker/docker-compose.yml down"

