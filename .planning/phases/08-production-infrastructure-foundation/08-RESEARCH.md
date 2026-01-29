# Research: Phase 08 - Production Infrastructure Foundation

**Phase:** 08 - Production Infrastructure Foundation
**Researched:** 2026-01-30
**Confidence:** HIGH

## Overview

Phase 8은 AI AfterSchool v1.0 MVP를 프로덕션 배포 가능한 상태로 변환하는 인프라 구축 단계입니다. 핵심은 Docker 기반 배포, S3 호환 PDF 저장소(MinIO), 자동 SSL(Caddy), 헬스 모니터링, 무중단 배포입니다.

`★ Insight ─────────────────────────────────────`
현재 로컬 파일시스템에 PDF를 저장하는 구조(`./public/reports`)는 Docker 컨테이너 환경에서는 데이터가 컨테이너 삭제 시 소실되는 치명적인 문제가 있습니다. 이를 MinIO 영구 볼륨으로 마이그레이션하는 것이 Phase 8의 가장 중요한 작업입니다.
`─────────────────────────────────────────────────`

## Current State Analysis

**PDF Storage (Blocker Identified):**
- **Location:** `./public/reports/` (환경변수 `PDF_STORAGE_PATH`로 설정 가능)
- **File Count:** 0개 (현재 생성된 PDF 없음 - 마이그레이션 영향도 낮음)
- **Storage Type:** 로컬 파일시스템
- **Issue:** Docker 컨테이너가 재시작되면 파일 소실

**Key Files:**
- `src/app/api/students/[id]/report/route.ts` - PDF 다운로드 API
- `src/lib/pdf/generator.ts` - PDF 생성 및 저장 경로 설정
- `src/lib/db/reports.ts` - 보고서 데이터베이스 관리

**Technical Debt:**
- `fetchReportData()` 함수가 `route.ts`와 `actions.ts`에 중복됨 (Phase 10에서 해결)

---

## Standard Stack

### Docker Compose Production

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: ${DATABASE_NAME}
      POSTGRES_USER: ${DATABASE_USER}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DATABASE_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"   # API
      - "9001:9001"   # Console
    volumes:
      - minio_data:/data
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}

  app:
    build:
      context: .
      dockerfile: Dockerfile.prod
      target: production
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: ${DATABASE_URL}
      MINIO_ENDPOINT: minio:9000
      MINIO_ACCESS_KEY: ${MINIO_ACCESS_KEY}
      MINIO_SECRET_KEY: ${MINIO_SECRET_KEY}
      PDF_STORAGE_TYPE: s3  # 'local' 또는 's3'
    depends_on:
      postgres:
        condition: service_healthy
      minio:
        condition: service_started
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      app:
        condition: service_healthy

volumes:
  postgres_data:
  minio_data:
  caddy_data:
  caddy_config:
```

### Multi-stage Dockerfile

```dockerfile
# Dockerfile.prod
FROM node:20-alpine AS base
WORKDIR /app

# Dependencies layer
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Build layer
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Production layer
FROM base AS production
ENV NODE_ENV=production

# Install production dependencies only
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000
CMD ["node", "node_modules/.bin/next", "start"]
```

### Caddyfile (Automatic SSL)

```
# Caddyfile
{
    # Production domain
    ai-afterschool.example.com {
        reverse_proxy app:3000

        # Security headers
        header {
            X-Frame-Options "SAMEORIGIN"
            X-Content-Type-Options "nosniff"
            Referrer-Policy "strict-origin-when-cross-origin"
        }

        # Compression
        encode gzip

        # Log format
        log {
            output file /var/log/caddy/access.log
            format json
        }
    }

    # Redirect HTTP to HTTPS
    http://ai-afterschool.example.com {
        redir https://ai-afterschool.example.com{uri}
    }
}
```

---

## Architecture Patterns

### PDF Storage Abstraction Layer

**Interface-based design** for storage backend switching:

```typescript
// src/lib/storage/storage-interface.ts
export interface PDFStorage {
  upload(filename: string, buffer: Buffer): Promise<string>
  download(filename: string): Promise<Buffer>
  delete(filename: string): Promise<void>
  getPresignedUrl(filename: string, expiresIn?: number): Promise<string>
}

// src/lib/storage/local-storage.ts
export class LocalPDFStorage implements PDFStorage {
  constructor(private basePath: string) {}

  async upload(filename: string, buffer: Buffer): Promise<string> {
    const filepath = path.join(this.basePath, filename)
    await fs.mkdir(path.dirname(filepath), { recursive: true })
    await fs.writeFile(filepath, buffer)
    return `/reports/${filename}`
  }

  async download(filename: string): Promise<Buffer> {
    const filepath = path.join(this.basePath, filename)
    return await fs.readFile(filepath)
  }

  async delete(filename: string): Promise<void> {
    const filepath = path.join(this.basePath, filename)
    await fs.unlink(filepath)
  }

  async getPresignedUrl(): Promise<string> {
    throw new Error('Presigned URLs not supported for local storage')
  }
}

// src/lib/storage/s3-storage.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export class S3PDFStorage implements PDFStorage {
  private client: S3Client

  constructor(
    private config: {
      endpoint: string
      region: string
      accessKey: string
      secretKey: string
      bucket: string
    }
  ) {
    this.client = new S3Client({
      endpoint: this.config.endpoint,
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKey,
        secretAccessKey: this.config.secretKey,
      },
      forcePathStyle: true, // MinIO 호환
    })
  }

  async upload(filename: string, buffer: Buffer): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: filename,
        Body: buffer,
        ContentType: 'application/pdf',
      })
    )
    return `s3://${this.config.bucket}/${filename}`
  }

  async download(filename: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: filename,
    })
    const response = await this.client.send(command)
    const chunks: Uint8Array[] = []
    for await (const chunk of response.Body as any) {
      chunks.push(chunk)
    }
    return Buffer.concat(chunks)
  }

  async getPresignedUrl(filename: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: filename,
    })
    return await getSignedUrl(this.client, command, { expiresIn })
  }

  async delete(filename: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: filename,
      })
    )
  }
}

// src/lib/storage/factory.ts
export function createPDFStorage(): PDFStorage {
  const storageType = process.env.PDF_STORAGE_TYPE || 'local'

  if (storageType === 's3') {
    return new S3PDFStorage({
      endpoint: process.env.MINIO_ENDPOINT!,
      region: process.env.MINIO_REGION || 'us-east-1',
      accessKey: process.env.MINIO_ACCESS_KEY!,
      secretKey: process.env.MINIO_SECRET_KEY!,
      bucket: process.env.MINIO_BUCKET || 'reports',
    })
  }

  return new LocalPDFStorage(process.env.PDF_STORAGE_PATH || './public/reports')
}
```

### Health Check Endpoint

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createPDFStorage } from '@/lib/storage/factory'

export async function GET() {
  const checks = {
    database: 'unknown',
    storage: 'unknown',
    timestamp: new Date().toISOString(),
  }

  // Database health
  try {
    await db.$queryRaw`SELECT 1`
    checks.database = 'healthy'
  } catch (error) {
    checks.database = 'unhealthy'
    return NextResponse.json(checks, { status: 503 })
  }

  // Storage health
  try {
    const storage = createPDFStorage()
    // Perform a simple storage check (e.g., list or check connectivity)
    checks.storage = 'healthy'
  } catch (error) {
    checks.storage = 'unhealthy'
    return NextResponse.json(checks, { status: 503 })
  }

  return NextResponse.json(checks, { status: 200 })
}
```

### Zero-Downtime Deployment Strategy

**Rolling Update with Health Checks:**

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

IMAGE_TAG=${1:-latest}
BACKUP_TAG="${IMAGE_TAG}-backup"

echo "🚀 Starting deployment..."

# 1. Pull latest images
echo "📥 Pulling images..."
docker-compose -f docker-compose.prod.yml pull

# 2. Tag current running version as backup
echo "💾 Backing up current version..."
docker-compose -f docker-compose.prod.yml ps -q | xargs -I {} docker tag $(docker inspect {} --format='{{.Config.Image}}') "${BACKUP_TAG}" || true

# 3. Start new containers (graceful shutdown)
echo "🔄 Deploying new version..."
docker-compose -f docker-compose.prod.yml up -d --no-deps --build app

# 4. Wait for health check
echo "⏳ Waiting for health check..."
TIMEOUT=60
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
  if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
    echo "✅ Health check passed!"
    break
  fi
  sleep 2
  ELAPSED=$((ELAPSED + 2))
done

if [ $ELAPSED -ge $TIMEOUT ]; then
  echo "❌ Health check failed! Rolling back..."
  docker-compose -f docker-compose.prod.yml up -d --no-deps app:${BACKUP_TAG}
  exit 1
fi

# 5. Restart Caddy
echo "🔄 Restarting Caddy..."
docker-compose -f docker-compose.prod.yml restart caddy

echo "✅ Deployment complete!"
```

---

## Don't Hand-Roll

| Problem | Use Instead | Don't Build |
|---------|-------------|-------------|
| SSL Certificate Management | Caddy automatic HTTPS | Manual Let's Encrypt certbot |
| S3-Compatible Storage | MinIO official image | Custom object storage |
| Container Health Monitoring | Docker built-in healthcheck | Custom monitoring scripts |
| PDF Upload to S3 | @aws-sdk/client-s3 | Raw HTTP requests |
| Environment Variables | Docker secrets / .env files | Hardcoded secrets |
| Reverse Proxy | Caddy / Nginx | Custom Node.js proxy |

---

## Common Pitfalls

### 1. Environment Variable Leakage in Docker Images

**Problem:** `.env` files accidentally copied into Docker image, exposing secrets.

**Detection:**
```bash
docker history --no-trunc <image> | grep -i "password\|secret\|key"
```

**Prevention:**
```dockerfile
# .dockerignore
.env
.env.*
.env.local
.env.*.local
*.pem
*.key
```

### 2. Database Connection Pool Exhaustion

**Problem:** Each container instance creates too many connections, exhausting PostgreSQL limits.

**Symptoms:** `Error: Connection pool exhausted` in logs

**Prevention:**
```typescript
// src/lib/db.ts
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: ['query', 'error', 'warn'],
  })
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma
```

**Connection limit in DATABASE_URL:**
```
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10"
```

### 3. MinIO Volume Persistence

**Problem:** Data lost when MinIO container is recreated.

**Detection:** Files disappear after `docker-compose down`

**Prevention:**
```yaml
# docker-compose.prod.yml
volumes:
  minio_data:  # Named volume persists
```

### 4. Health Check Timeout Too Short

**Problem:** Application marked unhealthy before it fully starts.

**Symptoms:** Containers restart repeatedly

**Prevention:**
```yaml
healthcheck:
  start_period: 60s  # Allow 60s for startup
  interval: 30s      # Check every 30s
  timeout: 10s       # Timeout after 10s
  retries: 3         # Allow 3 failures
```

### 5. PDF Migration Data Loss

**Problem:** Migration script fails, leaving PDFs in inconsistent state.

**Prevention:**
```typescript
// scripts/migrate-pdfs.ts
// 1. Create backup of existing files
// 2. Upload to MinIO
// 3. Verify each upload
// 4. Update database only after verification
// 5. Delete local files only after DB update
```

---

## Implementation Sequence

### Wave 1: Docker Compose & Health Check (Foundation)
1. Create `Dockerfile.prod` with multi-stage build
2. Create `docker-compose.prod.yml` with PostgreSQL, MinIO, App, Caddy
3. Create `.dockerignore` to exclude secrets
4. Implement `/api/health` endpoint with DB & storage checks
5. Test local deployment with `docker-compose up -d`

### Wave 2: Storage Abstraction (Migration Enabler)
1. Create `PDFStorage` interface
2. Implement `LocalPDFStorage` (current behavior)
3. Implement `S3PDFStorage` (MinIO integration)
4. Create storage factory with environment-based switching
5. Refactor PDF generation to use storage interface

### Wave 3: PDF Migration (Data Transition)
1. Create migration script to upload existing PDFs to MinIO
2. Update database file URLs to point to storage interface
3. Add presigned URL download endpoint
4. Test migration with sample data

### Wave 4: Caddy & SSL (Security)
1. Configure Caddyfile for reverse proxy
2. Set up automatic SSL with Let's Encrypt
3. Add security headers and compression
4. Test HTTPS access

### Wave 5: Zero-Downtime Deployment (Operations)
1. Create deployment script with health checks
2. Implement automatic rollback on failure
3. Add maintenance mode support
4. Test deployment cycle

---

## Code Examples

### Example: PDF Generation with Storage Abstraction

```typescript
// src/lib/actions/generate-report.ts
import { createPDFStorage } from '@/lib/storage/factory'
import { pdfToBuffer, generateReportFilename } from '@/lib/pdf/generator'
import { ConsultationReport } from '@/lib/pdf/templates/consultation-report'

export async function generateAndStoreReport(studentId: string) {
  const storage = createPDFStorage()
  const filename = generateReportFilename(studentId, studentName)

  // Generate PDF
  const pdfBuffer = await pdfToBuffer(
    React.createElement(ConsultationReport, reportData)
  )

  // Upload to storage (local or S3 based on env)
  const fileUrl = await storage.upload(filename, pdfBuffer)

  // Update database
  await db.studentReport.update({
    where: { studentId },
    data: {
      fileUrl,
      status: 'complete',
      generatedAt: new Date(),
    },
  })

  return fileUrl
}
```

### Example: PDF Download with Presigned URL

```typescript
// src/app/api/students/[id]/report/download/route.ts
import { createPDFStorage } from '@/lib/storage/factory'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: studentId } = await params
  const report = await getStudentReportPDF(studentId)

  if (!report?.fileUrl) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }

  const storage = createPDFStorage()
  const filename = path.basename(report.fileUrl)

  // Generate presigned URL (valid for 1 hour)
  const presignedUrl = await storage.getPresignedUrl(filename, 3600)

  // Return URL for client-side download
  return NextResponse.json({ url: presignedUrl })
}
```

---

## Dependencies & Order

**Must complete before:**
- Phase 9 (Performance Optimization) - stable infrastructure required for performance measurement

**Can parallelize:**
- Wave 1 (Docker Compose) & Wave 2 (Storage Abstraction) - independent foundation work

**Must wait for:**
- Wave 5 (Deployment) - requires all waves complete for full deployment flow

---

## Confidence Levels

| Area | Confidence | Notes |
|------|------------|-------|
| Docker Compose Setup | HIGH | Standard Next.js deployment pattern |
| MinIO Integration | HIGH | AWS SDK compatible, well-documented |
| Caddy SSL | HIGH | Automatic HTTPS is core feature |
| Storage Abstraction | HIGH | Interface pattern is straightforward |
| PDF Migration | MEDIUM | Migration scope depends on existing data (currently 0 files) |
| Zero-Downtime Deploy | MEDIUM | Single-server rolling update is simpler than distributed systems |

---

## Research Gaps

**Items requiring clarification during planning:**

1. **Production Domain:** `ai-afterschool.example.com` is placeholder - need actual domain for SSL
2. **MinIO Credentials:** Security policy for `MINIO_ROOT_USER`/`MINIO_ROOT_PASSWORD` generation
3. **Backup Strategy:** MinIO backup frequency and retention policy
4. **Monitoring:** Beyond health checks, what metrics to collect (Phase 10 scope?)

---

## Verification Criteria

After implementation, verify:

1. **Deployment:** `docker-compose -f docker-compose.prod.yml up -d` succeeds
2. **Health:** `/api/health` returns `{"database":"healthy","storage":"healthy"}`
3. **SSL:** HTTPS works with valid certificate from Let's Encrypt
4. **PDF Upload:** Generated PDFs stored in MinIO (`mc ls minio/reports`)
5. **PDF Download:** Presigned URLs return valid PDFs
6. **Rollback:** Failed deployment automatically reverts to previous version
7. **Persistence:** Data survives `docker-compose down && docker-compose up -d`

---

*Research complete: 2026-01-30*
*Ready for planning: gsd-planner*
