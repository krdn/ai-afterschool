import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { existsSync } from 'fs'

/**
 * Health check response shape
 */
interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  checks: {
    database: HealthCheckItem
    storage: HealthCheckItem
  }
  uptime: number
  version?: string
}

interface HealthCheckItem {
  status: 'healthy' | 'unhealthy' | 'unknown'
  message?: string
  responseTime?: number  // milliseconds
}

/**
 * GET /api/health
 *
 * Health check endpoint for:
 * - Docker container health checks
 * - Load balancer health checks
 * - Deployment readiness probes
 * - Monitoring and alerting
 *
 * Returns 200 if all checks pass, 503 if any check fails
 */
export async function GET() {
  const startTime = Date.now()
  const results: HealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: { status: 'unknown' },
      storage: { status: 'unknown' },
    },
    uptime: process.uptime(),
  }

  // Optional: Add version from package.json
  try {
    const packagePath = process.cwd() + '/package.json'
    const pkg = await import(packagePath)
    results.version = pkg.version
  } catch {
    // Version is optional
  }

  // 1. Database health check
  try {
    const dbStart = Date.now()
    await db.$queryRaw`SELECT 1`
    const dbTime = Date.now() - dbStart

    results.checks.database = {
      status: 'healthy',
      message: 'Database connection successful',
      responseTime: dbTime,
    }

    // Warn if slow response
    if (dbTime > 1000) {
      results.checks.database.message += ` (slow: ${dbTime}ms)`
      results.status = 'degraded'
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Database connection failed'
    results.checks.database = {
      status: 'unhealthy',
      message: errorMessage,
    }
    results.status = 'unhealthy'
  }

  // 2. Storage health check
  try {
    const storageStart = Date.now()
    const storageType = process.env.PDF_STORAGE_TYPE || 'local'

    if (storageType === 's3') {
      // For S3/MinIO, check if configuration exists
      const minioEndpoint = process.env.MINIO_ENDPOINT
      const minioAccessKey = process.env.MINIO_ACCESS_KEY
      const minioSecretKey = process.env.MINIO_SECRET_KEY

      if (minioEndpoint && minioAccessKey && minioSecretKey) {
        const storageTime = Date.now() - storageStart
        results.checks.storage = {
          status: 'healthy',
          message: `S3 storage configured (${minioEndpoint})`,
          responseTime: storageTime,
        }

        if (storageTime > 1000) {
          results.checks.storage.message += ` (slow: ${storageTime}ms)`
          if (results.status !== 'unhealthy') {
            results.status = 'degraded'
          }
        }
      } else {
        results.checks.storage = {
          status: 'unhealthy',
          message: 'S3 storage incomplete configuration',
        }
        results.status = 'unhealthy'
      }
    } else {
      // For local storage, check if directory exists
      const storagePath = process.env.PDF_STORAGE_PATH || './public/reports'
      const pathExists = existsSync(storagePath)

      if (pathExists) {
        const storageTime = Date.now() - storageStart
        results.checks.storage = {
          status: 'healthy',
          message: `Local storage accessible (${storagePath})`,
          responseTime: storageTime,
        }

        if (storageTime > 1000) {
          results.checks.storage.message += ` (slow: ${storageTime}ms)`
          if (results.status !== 'unhealthy') {
            results.status = 'degraded'
          }
        }
      } else {
        results.checks.storage = {
          status: 'unhealthy',
          message: `Storage directory not found: ${storagePath}`,
        }
        results.status = 'unhealthy'
      }
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Storage check failed'
    results.checks.storage = {
      status: 'unhealthy',
      message: errorMessage,
    }
    results.status = 'unhealthy'
  }

  // 3. Calculate total response time
  const totalTime = Date.now() - startTime

  // 4. Return appropriate status code
  const statusCode = results.status === 'healthy' ? 200 : 503

  return NextResponse.json(results, {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Response-Time': `${totalTime}`,
    },
  })
}

/**
 * HEAD /api/health
 *
 * Lightweight health check for load balancers that only need status code
 */
export async function HEAD() {
  try {
    // Quick database check only
    await db.$queryRaw`SELECT 1`
    return new NextResponse(null, { status: 200 })
  } catch {
    return new NextResponse(null, { status: 503 })
  }
}
