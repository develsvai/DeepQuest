#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "🛑 Stopping Deep Quest Full Stack..."

docker-compose -f docker/docker-compose.yml down

# 남아있는 컨테이너 확인 및 삭제 (ai, web만)
echo "Removing containers..."
docker rm -f deepquest-ai 2>/dev/null || true
docker rm -f deepquest-web 2>/dev/null || true

# 관련 이미지 삭제 (ai, web만)
echo "Removing images..."
docker rmi deepquest-ai:dev deepquest-ai:prod 2>/dev/null || true
docker rmi deepquest-web:dev deepquest-web:prod 2>/dev/null || true

echo "✅ All services stopped, containers and images removed."
echo ""
echo "To remove volumes as well:"
echo "   docker-compose -f docker/docker-compose.yml down -v"

