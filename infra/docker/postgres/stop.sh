#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "🛑 Stopping PostgreSQL container..."

# 컨테이너 중지
if docker ps | grep -q "deepquest-postgres"; then
  echo "   Stopping container..."
  docker stop deepquest-postgres
else
  echo "   Container is not running"
fi

# 컨테이너 삭제
if docker ps -a | grep -q "deepquest-postgres"; then
  echo "   Removing container..."
  docker rm deepquest-postgres
else
  echo "   Container does not exist"
fi

# 이미지 삭제
if docker images | grep -q "deepquest-postgres:latest"; then
  echo "   Removing image..."
  docker rmi deepquest-postgres:latest
else
  echo "   Image does not exist"
fi

echo ""
echo "✅ PostgreSQL stopped, container and image removed."
