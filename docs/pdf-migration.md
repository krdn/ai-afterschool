# PDF Migration Guide

## Overview

Migrate PDF files from local filesystem to MinIO/S3 storage.

## Prerequisites

1. **MinIO running:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d minio
   ```

2. **Environment configured:**
   ```bash
   # .env
   PDF_STORAGE_TYPE=s3
   MINIO_ENDPOINT=minio:9000
   MINIO_ACCESS_KEY=minioadmin
   MINIO_SECRET_KEY=minioadmin
   MINIO_BUCKET=reports
   ```

3. **Database accessible:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d postgres
   ```

## Migration Steps

### 1. Dry Run (Preview)

See what would be migrated without making changes:

```bash
npm run migrate:pdfs
```

Output shows:
- Total PDF files found
- Files that would be uploaded
- Database records that would be updated

### 2. Execute Migration

Run actual migration with backup:

```bash
npm run migrate:pdfs:execute
```

This will:
1. Scan `./public/reports/` for PDF files
2. Create backup at `./backups/pdf-migration/`
3. Upload each PDF to MinIO
4. Verify each upload
5. Update database file URLs
6. Report results

### 3. Verify Migration

Check that files are in MinIO:

```bash
# Using MinIO Console
# Visit http://localhost:9001
# Login: minioadmin / minioadmin
# Check bucket "reports"

# Using mc CLI
mc ls local/reports
```

Check database:

```bash
# Run query to check fileUrl format
docker-compose exec postgres psql -U user -d db \
  -c "SELECT id, file_url FROM report_pdfs WHERE status = 'complete';"
```

### 4. Test Application

1. Start app with S3 storage:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d app
   ```

2. Try downloading a report through the UI

3. Check logs for errors:
   ```bash
   docker-compose logs app
   ```

### 5. Cleanup (After Verification)

Once satisfied with migration:

```bash
# Remove local PDF files
rm -rf ./public/reports/*.pdf

# Remove backup
rm -rf ./backups/pdf-migration
```

## Rollback

If migration fails or you need to revert:

```bash
npm run migrate:pdfs:rollback
```

This will:
1. Restore files from backup to `./public/reports/`
2. Update database back to local file URLs
3. Keep backup for safety

## Troubleshooting

**Issue:** "MinIO connection failed"
- **Solution:** Check MinIO is running: `docker-compose ps minio`
- **Solution:** Verify credentials in `.env`

**Issue:** "Database connection failed"
- **Solution:** Ensure PostgreSQL is running
- **Solution:** Check DATABASE_URL in `.env`

**Issue:** "Size mismatch after upload"
- **Solution:** Network issue during upload - retry migration
- **Solution:** Check MinIO disk space: `docker exec minio df -h /data`

**Issue:** "No PDF files found"
- **Solution:** Check path: `ls -la ./public/reports/`
- **Solution:** Verify PDF_STORAGE_PATH in `.env`

## Safety Features

1. **Backup before migration** - All files copied to `./backups/pdf-migration/`
2. **Verification after upload** - Each file checked for size match
3. **Database atomic updates** - DB updated only after successful upload
4. **Rollback support** - One-command restore to previous state
5. **Dry run mode** - Preview changes without executing

## Data Loss Prevention

- Local files NOT deleted automatically
- Backup preserved until manually removed
- Database updated only after successful verification
- Rollback restores both files and database state
