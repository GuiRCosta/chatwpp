#!/bin/bash
# ===========================================
# ZFlow - Backup automatizado do PostgreSQL
# ===========================================
# Uso: ./scripts/backup-postgres.sh
# Cron: 0 3 * * * /path/to/zflow/scripts/backup-postgres.sh
# ===========================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups/postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
POSTGRES_USER="${POSTGRES_USER:-zflow}"
POSTGRES_DB="${POSTGRES_DB:-zflow}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="zflow_${DATE}.sql.gz"

CONTAINER=$(docker ps -q -f name=zflow_postgres | head -1)

if [ -z "$CONTAINER" ]; then
  echo "[ERROR] PostgreSQL container not found"
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "[INFO] Starting backup: $BACKUP_FILE"

docker exec "$CONTAINER" pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" \
  | gzip > "$BACKUP_DIR/$BACKUP_FILE"

# Verify backup is not empty
if [ ! -s "$BACKUP_DIR/$BACKUP_FILE" ]; then
  echo "[ERROR] Backup file is empty, removing"
  rm -f "$BACKUP_DIR/$BACKUP_FILE"
  exit 1
fi

# Verify backup is valid gzip
if ! gzip -t "$BACKUP_DIR/$BACKUP_FILE" 2>/dev/null; then
  echo "[ERROR] Backup file is corrupted, removing"
  rm -f "$BACKUP_DIR/$BACKUP_FILE"
  exit 1
fi

FILESIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
echo "[INFO] Backup verified: $BACKUP_FILE ($FILESIZE)"

DELETED=$(find "$BACKUP_DIR" -name "*.sql.gz" -mtime +"$RETENTION_DAYS" -print -delete | wc -l)
if [ "$DELETED" -gt 0 ]; then
  echo "[INFO] Removed $DELETED old backup(s) (older than $RETENTION_DAYS days)"
fi

echo "[INFO] Done. Backups in $BACKUP_DIR:"
ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "(none)"
