#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/deepquest_${TIMESTAMP}.sql"

mkdir -p "${BACKUP_DIR}"

echo "💾 Creating backup: ${BACKUP_FILE}"

docker exec deepquest-postgres pg_dump -U deepquest deepquest > "${BACKUP_FILE}"

echo "✅ Backup complete!"
ls -lh "${BACKUP_FILE}"

