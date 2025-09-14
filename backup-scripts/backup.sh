#!/bin/bash

# Tennis Court Database Backup Script
# This script creates a full backup of the database

set -e

# Configuration
DB_HOST=${POSTGRES_HOST:-postgres}
DB_PORT=${POSTGRES_PORT:-5432}
DB_NAME=${POSTGRES_DB:-tennis_court_db}
DB_USER=${POSTGRES_USER:-tennis_user}
DB_PASSWORD=${POSTGRES_PASSWORD:-tennis_password}

# Backup directory
BACKUP_DIR="/backups"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/tennis_court_backup_${DATE}.sql"
BACKUP_FILE_COMPRESSED="${BACKUP_FILE}.gz"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Starting database backup at $(date)"
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "Backup file: $BACKUP_FILE"

# Set password for pg_dump
export PGPASSWORD="$DB_PASSWORD"

# Create backup
echo "Creating backup..."
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --verbose \
    --no-password \
    --format=plain \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    --create \
    > "$BACKUP_FILE"

# Compress backup
echo "Compressing backup..."
gzip "$BACKUP_FILE"

# Check if backup was successful
if [ -f "$BACKUP_FILE_COMPRESSED" ]; then
    echo "Backup completed successfully!"
    echo "Backup file: $BACKUP_FILE_COMPRESSED"
    echo "File size: $(du -h "$BACKUP_FILE_COMPRESSED" | cut -f1)"
    
    # Keep only last 30 days of backups
    echo "Cleaning old backups (keeping last 30 days)..."
    find "$BACKUP_DIR" -name "tennis_court_backup_*.sql.gz" -mtime +30 -delete
    
    echo "Backup process completed at $(date)"
else
    echo "ERROR: Backup failed!"
    exit 1
fi
