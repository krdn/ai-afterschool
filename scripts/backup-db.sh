#!/bin/bash
set -euo pipefail

# =============================================================================
# PostgreSQL Database Backup Script
# =============================================================================
# This script creates compressed backups of the PostgreSQL database using
# pg_dump with gzip compression. It implements a retention policy to
# automatically delete old backups.
#
# Usage:
#   ./scripts/backup-db.sh
#
# Environment Variables:
#   BACKUP_DIR     - Directory to store backup files (default: ./backups)
#   DB_NAME        - Database name to backup (default: ai_afterschool)
#   DB_USER        - Database user for pg_dump (default: postgres)
#   DB_HOST        - Database host (default: localhost)
#   DB_PORT        - Database port (default: 5432)
#   RETENTION_DAYS - Number of days to keep backups (default: 30)
#
# Exit Codes:
#   0 - Success
#   1 - Backup failed
#   2 - Verification failed
# =============================================================================

# Environment variables with defaults
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB_NAME="${DB_NAME:-ai_afterschool}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# Container name (adjust if using custom container name)
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-ai-afterschool-postgres}"

# Generate timestamp for backup filename
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}-${DATE}.sql.gz"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

# Error handling
trap 'log "ERROR: Script failed at line $LINENO"' ERR

log "Starting database backup: $DB_NAME"
log "Backup file: $BACKUP_FILE"
log "Retention period: $RETENTION_DAYS days"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"
log "Backup directory: $BACKUP_DIR"

# Run pg_dump with compression
log "Running pg_dump..."
if docker exec "$POSTGRES_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "Backup completed successfully: $BACKUP_FILE ($BACKUP_SIZE)"
else
    log "ERROR: Backup failed"
    exit 1
fi

# Verify backup file was created and is not empty
if [ ! -s "$BACKUP_FILE" ]; then
    log "ERROR: Backup file is empty or does not exist"
    exit 1
fi

# Verify gzip integrity
if ! gzip -t "$BACKUP_FILE" 2>/dev/null; then
    log "ERROR: Backup file integrity check failed"
    rm -f "$BACKUP_FILE"
    exit 1
fi
log "Backup file integrity verified"

# Clean up old backups based on retention policy
log "Cleaning up backups older than $RETENTION_DAYS days..."
DELETED_COUNT=$(find "$BACKUP_DIR" -name "${DB_NAME}-*.sql.gz" -mtime +"$RETENTION_DAYS" -print -delete | wc -l)
if [ "$DELETED_COUNT" -gt 0 ]; then
    log "Deleted $DELETED_COUNT old backup(s)"
else
    log "No old backups to delete"
fi

# List current backups
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/${DB_NAME}-*.sql.gz 2>/dev/null | wc -l)
log "Total backups in storage: $BACKUP_COUNT"

# Verify database connectivity after backup
log "Verifying database connectivity..."
if docker exec "$POSTGRES_CONTAINER" psql -U "$DB_USER" -d postgres -c "SELECT 1" > /dev/null 2>&1; then
    log "Database connectivity verified"
else
    log "ERROR: Database connectivity check failed"
    exit 2
fi

log "Backup process completed successfully"
exit 0
