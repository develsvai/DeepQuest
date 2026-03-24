#!/bin/bash
set -e

if [ -z "$1" ]; then
    echo "Usage: ./restore.sh <backup-file>"
    echo ""
    echo "Available backups:"
    ls -lh backups/ 2>/dev/null || echo "  No backups found"
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

echo "📥 Restoring from: ${BACKUP_FILE}"

docker exec -i deepquest-postgres psql -U deepquest deepquest < "${BACKUP_FILE}"

echo "✅ Restore complete!"

