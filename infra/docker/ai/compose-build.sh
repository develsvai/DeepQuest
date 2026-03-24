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

# 선택한 .env 파일을 ai/.env로 복사 (런타임용, docker-compose.yml에서 사용)
if [ -f "$DOCKER_ENV" ]; then
  cp "$DOCKER_ENV" "$SCRIPT_DIR/.env"
  echo "📄 Using .env from $DOCKER_ENV for runtime (ENVIRONMENT=$ENVIRONMENT)"
elif [ -f "$SCRIPT_DIR/.env" ]; then
  echo "📄 Using existing infra/docker/ai/.env (fallback)"
fi

echo "🤖 Building AI Server Docker Image (ENVIRONMENT=$ENVIRONMENT)..."

# 빌드 (환경에 따라 ENVIRONMENT 빌드 인자 전달)
# 프로덕션 모드에서는 --no-cache 사용, 개발 모드에서는 캐시 활용
BUILD_ARGS="--build-arg ENVIRONMENT=${ENVIRONMENT}"
if [ "$ENVIRONMENT" = "production" ]; then
  BUILD_ARGS="--no-cache ${BUILD_ARGS}"
fi

docker build \
  ${BUILD_ARGS} \
  -f infra/docker/ai/Dockerfile \
  -t deepquest-ai:${IMAGE_TAG} \
  .

echo "✅ Build complete!"
docker images | grep deepquest-ai

echo ""
echo "📝 Usage:"
echo "   ENVIRONMENT=production ./compose-build.sh  # 프로덕션 빌드"
echo "   ENVIRONMENT=development ./compose-build.sh # 개발 빌드 (기본값)"
