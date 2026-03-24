#!/bin/sh
set -e

# PostgreSQL 헬스체크
pg_isready -U "${POSTGRES_USER:-deepquest}" -d "${POSTGRES_DB:-deepquest}" -h localhost -p 5432

# 추가 검증: 실제 쿼리 실행
psql -U "${POSTGRES_USER:-deepquest}" -d "${POSTGRES_DB:-deepquest}" -c "SELECT 1" > /dev/null 2>&1

exit 0

