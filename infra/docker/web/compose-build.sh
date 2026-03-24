#!/bin/bash
set -e
# compose 빌드용
# 모노레포 루트(deep-quest)를 빌드 컨텍스트로 사용 (infra는 서브모듈)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$REPO_ROOT"

# 환경 모드 설정 (기본값: development)
ENVIRONMENT=${ENVIRONMENT:-development}

# 환경에 따라 .env 파일 선택
if [ "$ENVIRONMENT" = "production" ]; then
  DOCKER_ENV="$SCRIPT_DIR/.env.prod"
  IMAGE_TAG="prod"
else
  DOCKER_ENV="$SCRIPT_DIR/.env.dev"
  IMAGE_TAG="dev"
fi

# 빌드용: COPY web/ . 에 .env가 포함되도록, 선택한 .env 파일을 web/.env 로 복사
if [ -f "$DOCKER_ENV" ]; then
  cp "$DOCKER_ENV" web/.env
  echo "📄 Using .env from $DOCKER_ENV for build (ENVIRONMENT=$ENVIRONMENT)"
elif [ -f "$SCRIPT_DIR/.env" ]; then
  cp "$SCRIPT_DIR/.env" web/.env
  echo "📄 Using .env from infra/docker/web/.env for build (fallback)"
else
  echo "⚠️  No .env file found, using defaults"
fi

# 런타임용: docker-compose.yml에서 사용할 .env 파일도 복사
if [ -f "$DOCKER_ENV" ]; then
  cp "$DOCKER_ENV" "$SCRIPT_DIR/.env"
  echo "📄 Using .env from $DOCKER_ENV for runtime (docker-compose.yml)"
elif [ -f "$SCRIPT_DIR/.env" ]; then
  echo "📄 Using existing infra/docker/web/.env for runtime (fallback)"
fi

echo "🌐 Building Web Server Docker Image (ENVIRONMENT=$ENVIRONMENT)..."

# 빌드 (환경에 따라 ENVIRONMENT 빌드 인자 전달)
docker build \
  --build-arg ENVIRONMENT=${ENVIRONMENT} \
  -f infra/docker/web/Dockerfile \
  -t deepquest-web:${IMAGE_TAG} \
  .

echo "✅ Build complete!"
docker images | grep deepquest-web

echo ""
echo "📝 Next steps:"
echo "   ENVIRONMENT=production ./compose-build.sh  # 프로덕션 빌드"
echo "   ENVIRONMENT=development ./compose-build.sh # 개발 빌드 (기본값)"
echo "   cd infra/docker && ./start-all.sh"
