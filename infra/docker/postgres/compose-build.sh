#!/bin/bash
set -e

echo "🐘 Building PostgreSQL Docker Image..."

# 현재 디렉토리 확인
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 빌드
docker build -t deepquest-postgres:latest .

echo "✅ Build complete!"
docker images | grep deepquest-postgres
