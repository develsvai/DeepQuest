#!/bin/bash
# PostgreSQL 콘솔 접속

echo "🐘 Connecting to PostgreSQL..."
echo "   Database: deepquest"
echo "   User: deepquest"
echo ""

docker exec -it deepquest-postgres psql -U deepquest -d deepquest

