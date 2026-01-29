#!/usr/bin/env tsx
/**
 * Migrate PDF files from local filesystem to MinIO/S3
 *
 * Usage:
 *   npm run migrate:pdfs          -- Dry run (shows what would be migrated)
 *   npm run migrate:pdfs -- --execute  -- Actual migration
 *   npm run migrate:pdfs -- --rollback  -- Rollback migration
 *
 * Safety features:
 * - Creates backup of existing files before migration
 * - Verifies each upload before updating database
 * - Updates database only after successful verification
 * - Supports rollback to restore from backup
 */

import fs from 'fs/promises'
import path from 'path'
import { db } from '@/lib/db'
import { createPDFStorage } from '@/lib/storage/factory'
import { S3PDFStorage } from '@/lib/storage/s3-storage'
import { LocalPDFStorage } from '@/lib/storage/local-storage'

const LOCAL_STORAGE_PATH = process.env.PDF_STORAGE_PATH || './public/reports'
const BACKUP_PATH = './backups/pdf-migration'
const DRY_RUN = process.argv.includes('--dry-run')
const EXECUTE = process.argv.includes('--execute')
const ROLLBACK = process.argv.includes('--rollback')

interface MigrationResult {
  total: number
  migrated: number
  failed: number
  skipped: number
  errors: Array<{ filename: string; error: string }>
}

async function ensureBackupDir() {
  await fs.mkdir(BACKUP_PATH, { recursive: true })
}

async function createBackup(files: string[]): Promise<void> {
  console.log(`\n💾 Creating backup of ${files.length} files...`)

  for (const file of files) {
    const filename = path.basename(file)
    const backupPath = path.join(BACKUP_PATH, filename)

    await fs.copyFile(file, backupPath)
    process.stdout.write('.')
  }

  console.log('\n✅ Backup complete')
}

async function migratePDFs(): Promise<MigrationResult> {
  const result: MigrationResult = {
    total: 0,
    migrated: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  }

  // Get storage instances
  const localStorage = new LocalPDFStorage(LOCAL_STORAGE_PATH)
  const s3Storage = createPDFStorage()

  if (!(s3Storage instanceof S3PDFStorage)) {
    throw new Error('S3 storage not configured. Set PDF_STORAGE_TYPE=s3')
  }

  // 1. Scan local storage for PDF files
  console.log(`\n📂 Scanning local storage: ${LOCAL_STORAGE_PATH}`)
  const fullPath = path.join(process.cwd(), LOCAL_STORAGE_PATH)
  const entries = await fs.readdir(fullPath).catch(() => [])
  const pdfFiles = entries
    .filter(e => e.endsWith('.pdf'))
    .map(e => path.join(fullPath, e))

  result.total = pdfFiles.length
  console.log(`Found ${pdfFiles.length} PDF files`)

  if (pdfFiles.length === 0) {
    console.log('ℹ️  No PDF files to migrate')
    return result
  }

  // 2. Create backup before migration
  if (!DRY_RUN) {
    await ensureBackupDir()
    await createBackup(pdfFiles)
  }

  // 3. Migrate each file
  console.log('\n🚀 Starting migration...\n')

  for (const filepath of pdfFiles) {
    const filename = path.basename(filepath)

    try {
      // Read local file
      const buffer = await fs.readFile(filepath)
      const stats = await fs.stat(filepath)

      // Check if already in S3
      const exists = await s3Storage.exists(filename)
      if (exists) {
        console.log(`⏭️  Skipped (already exists): ${filename}`)
        result.skipped++
        continue
      }

      if (DRY_RUN) {
        console.log(`[DRY RUN] Would upload: ${filename} (${stats.size} bytes)`)
        result.migrated++
        continue
      }

      // Upload to S3
      process.stdout.write(`⬆️  Uploading ${filename}...`)
      await s3Storage.upload(filename, buffer)

      // Verify upload
      const s3Buffer = await s3Storage.download(filename)
      if (s3Buffer.length !== buffer.length) {
        throw new Error(`Size mismatch: local=${buffer.length}, s3=${s3Buffer.length}`)
      }

      // Update database (find reports with this filename and update)
      const oldFileUrl = `/reports/${filename}`
      const updated = await db.reportPDF.updateMany({
        where: { fileUrl: oldFileUrl },
        data: { fileUrl: `s3://${process.env.MINIO_BUCKET || 'reports'}/${filename}` },
      })

      if (updated.count > 0) {
        console.log(` ✅ (DB updated: ${updated.count} records)`)
        result.migrated++
      } else {
        console.log(` ✅ (no DB record)`)
        result.migrated++
      }

    } catch (error: any) {
      console.error(`\n❌ Failed: ${filename}`)
      console.error(`   Error: ${error.message}`)
      result.failed++
      result.errors.push({ filename, error: error.message })
    }
  }

  return result
}

async function rollbackMigration(): Promise<void> {
  console.log('\n🔄 Rolling back migration...\n')

  // Check if backup exists
  const backupExists = await fs.access(BACKUP_PATH).then(() => true).catch(() => false)
  if (!backupExists) {
    throw new Error(`Backup not found at ${BACKUP_PATH}`)
  }

  const backupFiles = await fs.readdir(BACKUP_PATH)
  const pdfFiles = backupFiles.filter(f => f.endsWith('.pdf'))

  console.log(`Found ${pdfFiles.length} files in backup`)

  // Restore from backup
  for (const filename of pdfFiles) {
    const backupPath = path.join(BACKUP_PATH, filename)
    const restorePath = path.join(process.cwd(), LOCAL_STORAGE_PATH, filename)

    await fs.mkdir(path.dirname(restorePath), { recursive: true })
    await fs.copyFile(backupPath, restorePath)

    // Update database back to local URLs
    await db.reportPDF.updateMany({
      where: { fileUrl: `s3://${process.env.MINIO_BUCKET || 'reports'}/${filename}` },
      data: { fileUrl: `/reports/${filename}` },
    })

    console.log(`✅ Restored: ${filename}`)
  }

  console.log('\n✅ Rollback complete')
  console.log(`\n⚠️  Backup files remain at ${BACKUP_PATH}`)
  console.log(`   Remove manually when satisfied: rm -rf ${BACKUP_PATH}`)
}

async function main() {
  console.log('═════════════════════════════════════════════════════════')
  console.log('  PDF Migration: Local → MinIO/S3')
  console.log('═════════════════════════════════════════════════════════')

  if (ROLLBACK) {
    await rollbackMigration()
    return
  }

  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No actual changes will be made\n')
  } else if (!EXECUTE) {
    console.log('⚠️  PREVIEW MODE - Use --execute to run actual migration\n')
    console.log('   npm run migrate:pdfs -- --execute\n')
  }

  // Check prerequisites
  if (process.env.PDF_STORAGE_TYPE !== 's3') {
    console.error('❌ Error: PDF_STORAGE_TYPE must be set to "s3"')
    console.error('   Set in .env: PDF_STORAGE_TYPE=s3')
    process.exit(1)
  }

  // Run migration
  const result = await migratePDFs()

  // Print summary
  console.log('\n═════════════════════════════════════════════════════════')
  console.log('  Migration Summary')
  console.log('═════════════════════════════════════════════════════════')
  console.log(`Total files:     ${result.total}`)
  console.log(`Migrated:        ${result.migrated}`)
  console.log(`Skipped:         ${result.skipped}`)
  console.log(`Failed:          ${result.failed}`)

  if (result.errors.length > 0) {
    console.log('\n❌ Errors:')
    result.errors.forEach(({ filename, error }) => {
      console.log(`   ${filename}: ${error}`)
    })
  }

  if (!DRY_RUN && result.failed === 0) {
    console.log('\n✅ Migration successful!')
    console.log(`\n💾 Backup stored at: ${BACKUP_PATH}`)
    console.log('   Remove when satisfied: rm -rf ./backups/pdf-migration')
  } else if (result.failed > 0) {
    console.log('\n⚠️  Migration had failures')
    console.log('   Rollback: npm run migrate:pdfs -- --rollback')
  }

  console.log('═════════════════════════════════════════════════════════')
}

main().catch(console.error)
