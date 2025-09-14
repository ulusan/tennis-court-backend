#!/bin/bash

# Tennis Court Database Restore Script
# This script restores the database from a backup file

set -e

# Configuration
DB_HOST=${POSTGRES_HOST:-postgres}
DB_PORT=${POSTGRES_PORT:-5432}
DB_NAME=${POSTGRES_DB:-tennis_court_db}
DB_USER=${POSTGRES_USER:-tennis_user}
DB_PASSWORD=${POSTGRES_PASSWORD:-tennis_password}

# Backup directory
BACKUP_DIR="/backups"

# Check if backup file is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup_file>"
    echo "Available backups:"
    ls -la "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file '$BACKUP_FILE' not found!"
    exit 1
fi

echo "Starting database restore at $(date)"
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "Backup file: $BACKUP_FILE"

# Set password for psql
export PGPASSWORD="$DB_PASSWORD"

# Check if file is compressed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "Decompressing and restoring backup..."
    gunzip -c "$BACKUP_FILE" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres
else
    echo "Restoring backup..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres < "$BACKUP_FILE"
fi

echo "Database restore completed at $(date)"
echo "Please verify the data integrity manually."
