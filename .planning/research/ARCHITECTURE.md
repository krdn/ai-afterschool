# Architecture Patterns

**Domain:** 학원 학생 관리 시스템 with AI 성향 분석
**Researched:** 2026-01-27 (Updated: 2026-01-30 for Production Deployment)
**Overall confidence:** HIGH (verified with multiple 2026 sources, official documentation)

## Executive Summary

학원 학생 관리 시스템은 **3-tier 아키텍처**를 기반으로 구성하되, Next.js App Router의 Server Components와 Server Actions를 활용한 모던 풀스택 패턴을 채택합니다. 핵심은 **학생 정보 관리를 중심으로 데이터가 흐르고**, AI 분석 기능들이 모듈식으로 연결되는 구조입니다.

프로덕션 배포를 위해 **Docker Compose 기반의 멀티컨테이너 아키텍처**를 사용합니다. Nginx/Caddy 리버스 프록시를 통해 SSL 종료, 정적 파일 제공, 보안 헤더 관리를 처리하고, MinIO 또는 S3 호환 스토리지를 통해 PDF 파일을 저장합니다. PostgreSQL은 Prisma의 커넥션 풀링과 함께 운영되며, Sentry를 통한 모니터링과 헬스 체크 엔드포인트로 안정성을 확보합니다.

**핵심 아키텍처 원칙:**
1. **Student Data as Source of Truth** - 모든 분석과 제안은 학생 정보 기반
2. **Modular AI Services** - 각 분석 기능(MBTI, 사주, 관상 등)은 독립적 모듈
3. **Server-Side Heavy** - 민감한 데이터와 AI 처리는 서버에서
4. **Feature-Based Organization** - 도메인별로 코드 구조화
5. **Production-Ready Infrastructure** - 컨테이너화, 모니터링, 헬스 체크 포함

## Recommended Production Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        EXTERNAL LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Browser    │  │  Monitoring  │  │    Health    │          │
│  │              │  │   (Sentry)   │  │   Checks     │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼─────────────────┼─────────────────┼────────────────────┘
          │                 │                 │
          ↓                 ↓                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                    REVERSE PROXY LAYER                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Nginx / Caddy (SSL Termination, Static Assets, Proxy)  │   │
│  └──────────────────────┬──────────────────────────────────┘   │
└─────────────────────────┼────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ↓               ↓               ↓
┌─────────────────┐ ┌─────────────┐ ┌──────────────┐
│  Next.js App    │ │ PostgreSQL  │ │   MinIO S3   │
│  (App Router)   │ │  (Primary)  │ │  (PDF Store) │
│                 │ └─────────────┘ └──────────────┘
│  - Server Cmp   │       ↑               ↑
│  - Server Acts  │       │               │
│  - Route Hdlrs  │       │               │
└─────────────────┘       │               │
                          │               │
              ┌───────────┴───────────────┴──────────┐
              │         Persistent Volumes            │
              │  (db-data, pdfs, uploads)             │
              └────────────────────────────────────────┘

External Services: Cloudinary (images), Claude API (AI), Resend (email)
```

### Component Boundaries with Production Additions

| Component | Responsibility | Communicates With | Production Notes |
|-----------|----------------|-------------------|------------------|
| **Reverse Proxy (NEW)** | SSL termination, static serving, security headers | Next.js App, External clients | Nginx (stable) or Caddy (auto-HTTPS) |
| **Next.js App** | Application logic, Server Components, Server Actions | PostgreSQL, MinIO, External APIs | Standalone mode, connection pooling |
| **PostgreSQL** | Structured data storage, ACID transactions | Next.js App via Prisma | Connection pooling, health checks |
| **MinIO/S3 (NEW)** | PDF file storage, persistent data | Next.js App | S3-compatible, presigned URLs |
| **Monitoring (NEW)** | Error tracking, performance monitoring | All components | Sentry for errors/APM |
| **Health Check (NEW)** | Container health monitoring | All services | `/api/health` endpoint |

### Integration with Existing Architecture

**현재 아키텍처 (개발용):**
- Next.js 15 App Router + Server Actions
- Prisma ORM + PostgreSQL
- Cloudinary (이미지 저장소)
- Claude API (AI 분석)
- 로컬 파일 시스템 (PDF 저장)

**프로덕션 추가/변경:**
1. **리버스 프록시 추가**: Nginx/Caddy로 SSL 종료, 정적 파일 제공
2. **PDF 스토리지 이관**: 로컬 → MinIO/S3 호환 스토리지
3. **커넥션 풀링**: Prisma 연결 풀 설정 (connection_limit=10)
4. **모니터링 통합**: Sentry 오류 추적 및 성능 모니터링
5. **헬스 체크**: `/api/health` 엔드포인트 + Docker healthcheck
6. **로깅**: 구조화된 로깅 (pino/winston)

## Recommended Project Structure for Production

```
src/
├── app/
│   ├── api/
│   │   ├── health/
│   │   │   └── route.ts          # NEW: Health check endpoint
│   │   └── ...
│   └── ...
├── lib/
│   ├── storage/
│   │   ├── s3.ts                 # NEW: S3/MinIO client
│   │   └── pdf-storage.ts        # NEW: PDF storage abstraction
│   ├── monitoring/
│   │   ├── sentry.ts             # NEW: Sentry initialization
│   │   └── logger.ts             # NEW: Structured logging
│   ├── db/
│   │   ├── connection.ts         # NEW: Connection pool config
│   │   └── ...                   # Existing DAL
│   └── ...
├── middleware.ts                 # MODIFY: Add monitoring, security headers
└── instrumentation.ts            # NEW: OpenTelemetry setup (optional)

docker/
├── nginx/
│   └── nginx.conf                # NEW: Reverse proxy config
├── app/
│   ├── Dockerfile                # NEW: Multi-stage build
│   └── .dockerignore
└── docker-compose.yml            # NEW: Multi-container orchestration
```

### Structure Rationale

- **docker/**: 모든 배포 관련 설정을 앱 코드와 분리
- **lib/storage/**: 스토리지 백엔드 추상화 (local, S3, MinIO)
- **lib/monitoring/**: 중앙화된 오류 추적 및 로깅
- **api/health/**: 컨테이너 오케스트레이션용 헬스 체크
- **instrumentation.ts**: Next.js 16+ 초기화 훅 지원

## Component Dependencies

### Component 의존성 계층 (기존)

```
Level 1 (Foundation):
  - Authentication System
  - Student Management
  - File Upload Service

Level 2 (Analysis - Independent):
  - MBTI Analysis
  - Saju Calculator
  - Name Study Calculator
  - Face Analysis Service
  - Palm Analysis Service

Level 3 (Synthesis):
  - AI Strategy Advisor
  - Report Generator
```

### Production Infrastructure Dependencies

```
Infrastructure Layer 1 (Foundation Services):
  - PostgreSQL (with volume mount)
  - MinIO (with volume mount)
  - Redis (optional - for caching/queues)

Infrastructure Layer 2 (Application Services):
  - Next.js App (depends on Layer 1)
  - Background Worker (optional - depends on Layer 1)

Infrastructure Layer 3 (Networking):
  - Nginx/Caddy (depends on Layer 2)
```

**Build Order:**
1. Foundation services 먼저 시작 (postgres, minio)
2. Health check 통과 후 app 시작
3. App 준비 완료 후 reverse proxy 시작

## Data Flow

### 1. Student Registration Flow (기존)

```
선생님 입력
  ↓
[Server Action] createStudent()
  ↓
Validate → Store in DB → Upload Photo (optional)
  ↓
Return Student ID
  ↓
Redirect to Student Detail Page
```

### 2. PDF Generation Flow (Production - NEW)

```
선생님이 보고서 요청
  ↓
[Server Action] generateReport(studentId)
  ↓
Query:
  - Student Info
  - All Analysis Results
  - AI Strategy Recommendations
  ↓
[@react-pdf/renderer creates PDF]
  ↓
[PDF Buffer]
  ↓
[S3PDFStorage.upload()] → MinIO/S3
  ↓
[ReportPDF record updated with S3 key]
  ↓
User downloads via /api/pdfs/{key}
  ↓
[S3PDFStorage.download()] → Stream to client
```

### 3. Health Check Flow (Production - NEW)

```
[Docker Healthcheck]
  ↓
[GET /api/health]
  ↓
[Check DB Connection] → Prisma query
  ↓
[Check Storage] → S3 HeadBucket
  ↓
[Return JSON status] → 200 (healthy) or 503 (degraded)
  ↓
[Docker restarts container if unhealthy]
```

### 4. Request Flow (Production - NEW)

```
[User Browser]
  ↓
[Nginx/Caddy] → SSL Termination → Static Asset Check
  ↓
[Next.js App]
  ↓
[Server Component] → [Server Action] → [Prisma ORM] → [PostgreSQL]
  ↓              ↓                ↓                 ↓
[Response] ← [Data Transform] ← [Query Result] ← [Database]
```

## Production Architectural Patterns

### Pattern 1: Reverse Proxy Termination (NEW)

**What:** Nginx/Caddy를 Next.js 앞에 두어 SSL, 압축, 정적 파일 제공 처리

**When to use:**
- 프로덕션 배포 (HTTPS 필요)
- 정적 파일 (PDF, 이미지) 효율적 제공
- 단일 서버에서 여러 서비스 운영
- 보안 헤더 및 CORS 관리

**Trade-offs:**
- Pros: Next.js 부하 분산, 성능 향상, 성숙된 SSL 처리
- Cons: 추가 관리 계층, 디버깅 복잡성 증가

**Example (Nginx):**
```nginx
# docker/nginx/nginx.conf
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # Static files and uploads
    location /static/ {
        alias /app/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Next.js app
    location / {
        proxy_pass http://nextjs:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://nextjs:3000/api/health;
        access_log off;
    }
}
```

**Example (Caddy - Auto-HTTPS):**
```caddy
# docker/Caddyfile
your-domain.com {
    reverse_proxy nextjs:3000

    # Static files
    handle /static/* {
        root * /app/public
        file_server
    }

    # Health check
    handle /health {
        reverse_proxy nextjs:3000/api/health
    }

    # Logging
    log {
        output file /var/log/caddy/access.log
    }
}
```

### Pattern 2: Docker Compose Multi-Container Architecture (NEW)

**What:** 모든 서비스 (app, db, proxy, storage)를 docker-compose.yml에 정의

**When to use:**
- 단일 서버 배포 (타겟: 192.168.0.5)
- 개발-프로덕션 파리티
- 간단한 스케일링 요구사항

**Trade-offs:**
- Pros: 재현 가능한 배포, 쉬운 로컬 개발, 간단한 스케일링
- Cons: 멀티 서버 배포 불가, 제한된 오케스트레이션 기능

**Example:**
```yaml
# docker/docker-compose.yml
version: '3.8'

services:
  # PostgreSQL with persistent volume
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # MinIO for S3-compatible storage
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${S3_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${S3_SECRET_KEY}
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3
    restart: unless-stopped

  # Next.js app
  app:
    build:
      context: ./app
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      S3_ENDPOINT: http://minio:9000
      S3_ACCESS_KEY: ${S3_ACCESS_KEY}
      S3_SECRET_KEY: ${S3_SECRET_KEY}
      S3_BUCKET: ${S3_BUCKET}
      SENTRY_DSN: ${SENTRY_DSN}
      NEXT_PUBLIC_APP_URL: https://your-domain.com
    depends_on:
      postgres:
        condition: service_healthy
      minio:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    restart: unless-stopped

  # Nginx reverse proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - nginx_cache:/var/cache/nginx
    depends_on:
      app:
        condition: service_healthy
    restart: unless-stopped

volumes:
  postgres_data:
  minio_data:
  nginx_cache:
```

### Pattern 3: Storage Abstraction Layer (NEW)

**What:** 로컬 파일시스템, S3, MinIO를 지원하는 스토리지 추상화

**When to use:**
- 로컬 → 클라우드 스토리지 이관 필요
- 백업/복구 기능 필요
- 다양한 배포 환경 (dev vs prod)

**Trade-offs:**
- Pros: 유연성, 쉬운 이관, 테스트 가능
- Cons: 추가 추상화 계층, 약간의 오버헤드

**Example:**
```typescript
// src/lib/storage/pdf-storage.ts
export interface PDFStorage {
  upload(studentId: string, pdfBuffer: Buffer): Promise<string>;
  download(fileUrl: string): Promise<Buffer>;
  delete(fileUrl: string): Promise<void>;
  getUrl(fileUrl: string): string;
}

export class S3PDFStorage implements PDFStorage {
  private client: S3Client;
  private bucket: string;

  constructor(endpoint: string, accessKey: string, secretKey: string, bucket: string) {
    this.client = new S3Client({
      endpoint,
      region: 'us-east-1',
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      forcePathStyle: true, // Required for MinIO
    });
    this.bucket = bucket;
  }

  async upload(studentId: string, pdfBuffer: Buffer): Promise<string> {
    const key = `reports/${studentId}/${Date.now()}.pdf`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: pdfBuffer,
        ContentType: 'application/pdf',
      })
    );

    return key;
  }

  async download(fileUrl: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: fileUrl,
    });

    const response = await this.client.send(command);
    const chunks = [];

    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }

  async delete(fileUrl: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: fileUrl,
      })
    );
  }

  getUrl(fileUrl: string): string {
    return `/api/pdfs/${fileUrl}`;
  }
}

// Factory for environment-specific storage
export function createPDFStorage(): PDFStorage {
  if (process.env.S3_ENDPOINT) {
    return new S3PDFStorage(
      process.env.S3_ENDPOINT,
      process.env.S3_ACCESS_KEY!,
      process.env.S3_SECRET_KEY!,
      process.env.S3_BUCKET!
    );
  }

  // Fallback to local storage (dev only)
  return new LocalPDFStorage('./public/pdfs');
}
```

### Pattern 4: Connection Pooling with Prisma (NEW)

**What:** Prisma로 효율적인 DB 연결 관리

**When to use:**
- 프로덕션 배포 (PostgreSQL 사용)
- 서버리스 또는 컨테이너 환경
- 동시 요청 처리

**Trade-offs:**
- Pros: 연결 고갈 방지, 성능 향상
- Cons: 워크로드별 튜닝 필요, 복잡성 증가

**Example:**
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")

  // Connection pool configuration
  // For Docker/VM: 10-20 connections per instance
  // For serverless: 1-5 connections (use Prisma Accelerate)
  connection_limit = 10
  pool_timeout = 20 // seconds
}
```

**Environment variable:**
```bash
# .env.production
DATABASE_URL="postgresql://user:pass@postgres:5432/db?connection_limit=10&pool_timeout=20&connect_timeout=10"
```

### Pattern 5: Health Check Architecture (NEW)

**What:** 앱, DB, 외부 서비스 헬스 상태 체크 경량 엔드포인트

**When to use:**
- Docker healthcheck 통합
- 로드 밸런서 헬스 체크
- 모니터링 대시보드

**Trade-offs:**
- Pros: 자동 컨테이너 복구, 모니터링 통합
- Cons: 추가 엔드포인트 관리, false positive 가능

**Example:**
```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'edge';

export async function GET() {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: 'unknown',
      storage: 'unknown',
    },
  };

  // Database health check
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.checks.database = 'healthy';
  } catch (error) {
    checks.checks.database = 'unhealthy';
    checks.status = 'degraded';
  }

  // Storage health check (S3/MinIO)
  if (process.env.S3_ENDPOINT) {
    try {
      const client = new S3Client({ /* config */ });
      await client.send(new HeadBucketCommand({ Bucket: process.env.S3_BUCKET }));
      checks.checks.storage = 'healthy';
    } catch (error) {
      checks.checks.storage = 'unhealthy';
      checks.status = 'degraded';
    }
  }

  const statusCode = checks.status === 'healthy' ? 200 : 503;

  return NextResponse.json(checks, { status: statusCode });
}
```

### Pattern 6: Monitoring with Sentry (NEW)

**What:** Sentry 통합 오류 추적 및 성능 모니터링

**When to use:**
- 프로덕션 배포
- 오류 추적 및 성능 모니터링 필요
- 이슈 알림 필요

**Trade-offs:**
- Pros: 자동 오류 캡처, 성능 인사이트, 릴리스 추적
- Cons: 규모에 따른 비용, 프라이버시 고려사항

**Example:**
```typescript
// src/lib/monitoring/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Filter sensitive data
  beforeSend(event, hint) {
    // Remove personal information
    if (event.request?.headers) {
      delete event.request.headers['cookie'];
      delete event.request.headers['authorization'];
    }
    return event;
  },

  // Integrations
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Session replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

```typescript
// src/instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('@/lib/monitoring/sentry');
  }
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Storing PDFs in Database (NEW)

**What people do:** PDF 바이너리를 PostgreSQL bytea 컬럼에 저장

**Why it's wrong:**
- DB 크기 팽창 (PDF는 수 MB씩)
- 백업/복구 느림
- 캐시 성능 저하
- 다운로드 시 연결 낭비

**Do this instead:**
- S3 호환 객체 스토리지 사용 (MinIO, AWS S3)
- DB에는 S3 키/경로만 저장
- ReportPDF.fileUrl 필드를 S3 키 참조로 사용

### Anti-Pattern 2: Hardcoding Storage Paths (NEW)

**What people do:** 코드에 `/var/www/pdfs/` 같은 절대 경로 하드코딩

**Why it's wrong:**
- 다른 환경에서 동작 안 함 (dev vs prod)
- 스토리지 이관 어려움
- 파일시스템과 강하게 결합

**Do this instead:**
- 환경 변수로 스토리지 설정
- 인터페이스 뒤에 스토리지 연산 추상화
- 로컬 및 S3 스토리지 모두 지원

### Anti-Pattern 3: No Connection Pooling (NEW)

**What people do:** 프로덕션에서 기본 Prisma 연결 설정 사용

**Why it's wrong:**
- 쿼리마다 새 연결 생성
- PostgreSQL 연결 한계 초과
- "too many connections" 에러

**Do this instead:**
- DATABASE_URL에 connection_limit 설정
- 서버리스용 Prisma Accelerate 사용
- 연결 사용량 모니터링

### Anti-Pattern 4: Blocking Health Checks (NEW)

**What people do:** 헬스 체크에서 느린 쿼리 또는 외부 API 호출

**Why it's wrong:**
- False positive 발생 (헬스 체크 타임아웃)
- 불필요한 컨테이너 재시작
- 정상 운영 중 다운타임

**Do this instead:**
- 헬스 체크 경량 유지 (< 1초)
- 필수 의존성만 체크 (DB, 스토리지)
- 모든 체크에 타임아웃 설정

### Anti-Pattern 5: Logging Everything to stdout (NEW)

**What people do:** 모든 애플리케이션 출력을 console.log

**Why it's wrong:**
- 필터 및 검색 어려움
- 로그 레벨 없음 (info, warn, error)
- 성능 영향

**Do this instead:**
- 구조화된 로깅 사용 (pino, winston)
- 파일 또는 로그 집계 서비스에 로그
- 적절한 로그 레벨 사용

## Scalability Considerations (Updated)

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **0-1k users** | 단일 Docker Compose 스택, Redis 없음, 연결 풀 10, 단일 app 인스턴스 |
| **1k-10k users** | Redis 캐싱 추가, 연결 풀 20으로 증가, 로드 밸런서 뒤에 app 인스턴스 2개, 정적 파일용 CDN |
| **10k-100k users** | 별도 DB 서버, PgBouncer 연결 풀링, 전용 Redis 인스턴스, app 수평 확장, 별도 스토리지 서비스 |

### Scaling Priorities (Updated)

1. **First bottleneck**: PDF 생성으로 요청 차단
   - Solution: 백그라운드 작업 큐 (BullMQ) + Redis + 별도 worker 컨테이너
   - Monitor: 보고서 생성 큐 길이

2. **Second bottleneck**: DB 쿼리 성능
   - Solution: 자주 조회하는 필드에 인덱스 추가, 쿼리 캐싱 활성화, Prisma 쿼리 최적화 사용
   - Monitor: 느린 쿼리 로그, 연결 풀 사용량

3. **Third bottleneck**: AI API rate limits
   - Solution: 요청 큐잉, 지수 백오프로 재시도 로직, AI 응답 캐싱
   - Monitor: Claude API 에러율, 응답 시간

## Migration Strategy (NEW)

### PDF Storage Migration (Local → S3)

**Phase 1: S3 지원 추가 (이관 없음)**
1. `PDFStorage` 인터페이스 생성
2. `S3PDFStorage` 및 `LocalPDFStorage` 구현
3. 환경 변수로 스토리지 선택
4. `STORAGE_TYPE=local`으로 배포

**Phase 2: 기존 PDF 이관**
1. 로컬 PDF 읽기 마이그레이션 스크립트 생성
2. 메타데이터와 함께 S3에 업로드
3. S3 키로 `ReportPDF.fileUrl` 업데이트
4. 업로드 검증 및 레코드 업데이트

**Phase 3: S3-only 전환**
1. 프로덕션에서 `STORAGE_TYPE=s3` 변경
2. 에러 모니터링
3. 로컬 스토리지 코드 제거

### Database Connection Pooling Migration

**Current:** 명시적 연결 설정 없음
**Target:** `connection_limit=10`, `pool_timeout=20`

**Steps:**
1. 프로덕션 env에서 DATABASE_URL 업데이트
2. 스테이징에서 로드 테스트로 테스트
3. 연결 사용량 모니터링
4. 메트릭 기반 제한 조정

## Monitoring Architecture (NEW)

### Application Performance Monitoring (APM)

| Component | Tool | Purpose |
|-----------|------|---------|
| **Error Tracking** | Sentry | 오류 집계 및 스택 추적 |
| **Performance Monitoring** | Sentry Performance | 페이지 로드 시간, API 지연 시간 추적 |
| **Uptime Monitoring** | UptimeRobot / external | 헬스 체크 엔드포인트 폴링 |
| **Database Monitoring** | Prisma query logs + pg_stat_statements | 느린 쿼리 식별 |
| **Log Aggregation** | Loki / ELK / Cloud-native | 중앙화된 로그 검색 |

### Health Check Architecture

**헬스 체크 레벨:**

1. **Liveness**: 앱이 실행 중인가?
   - Endpoint: `GET /api/health`
   - Check: HTTP 응답
   - Failure: 컨테이너 재시작

2. **Readiness**: 요청을 처리할 수 있는가?
   - Endpoint: `GET /api/health/ready`
   - Check: DB 연결, S3 연결
   - Failure: 로드 밸런서 순환에서 제거

3. **Deep Health**: 모든 의존성이 건강한가?
   - Endpoint: `GET /api/health/deep`
   - Check: DB, S3, 외부 API (Claude, Resend)
   - Failure: 알림 but 재시작 없음

### Alerting Strategy

| Alert Type | Condition | Action |
|------------|-----------|--------|
| **App Down** | 헬스 체크 3회 실패 | PagerDuty/Slack + 자동 재시작 |
| **High Error Rate** | 5분 동안 에러 > 5% | Slack 알림 |
| **Slow Queries** | 쿼리 > 5초 | 최적화용 JIRA 티켓 |
| **Storage Full** | 디스크 > 80% | 이메일 + 스토리지 확장 |
| **API Quota** | Claude API rate limit | 알림 + 생성 일시 중지 |

## Technology Stack Integration Points (Updated)

### Production Infrastructure Additions

**NEW - Reverse Proxy:**
- Nginx (안정적, 성숙) 또는 Caddy (자동 HTTPS, 쉬운 설정)
- SSL 종료, 정적 파일 제공, 보안 헤더 관리

**NEW - Storage:**
- MinIO (셀프 호스팅) 또는 AWS S3 (클라우드)
- PDF 파일용 S3 호환 객체 스토리지
- Presigned URLs로 직접 클라이언트 업로드/다운로드

**NEW - Monitoring:**
- Sentry (오류 추적 및 성능 모니터링)
- 구조화된 로깅 (pino/winston)
- 헬스 체크 엔드포인트

**NEW - Connection Pooling:**
- Prisma 연결 풀 설정
- Docker 환경에 맞는 연결 제한 (connection_limit=10)

### Existing Stack (Unchanged)

**Next.js App Router:**
- Server Components (default)
- Client Components ('use client' directive)
- Server Actions for mutations

**Database:**
- PostgreSQL 16+ with Prisma ORM
- Connection pooling for production

**External Services:**
- Cloudinary (이미지 저장소)
- Claude API (AI 분석)
- Resend (이메일)

## Sources

### Primary (HIGH confidence)

**Official Documentation:**
- [Next.js Production Checklist](https://nextjs.org/docs/app/guides/production-checklist) — Official production optimization guide (Updated Dec 2025)
- [Prisma Connection Pooling Documentation](https://www.prisma.io/docs/postgres/database/connection-pooling) — Connection pool configuration
- [Next.js Deploying Documentation](https://nextjs.org/docs/app/getting-started/deploying) — Deployment strategies

**Deployment Guides:**
- [Production NextJS 15: The Complete Self-Hosting Guide](https://ketan-chavan.medium.com/production-nextjs-15-the-complete-self-hosting-guide-f1ff03f782e7) — Comprehensive production setup
- [Dockerizing a Next.js Application in 2025](https://medium.com/front-end-world/dockerizing-a-next-js-application-in-2025-bacdca4810fe) — Modern Docker practices
- [Building a File Storage With Next.js, PostgreSQL, and Minio S3](https://blog.alexefimenko.com/posts/file-storage-nextjs-postgres-s3) — S3 integration patterns

**Security Best Practices:**
- [Next.js Data Security Guide](https://nextjs.org/docs/app/guides/data-security) — Security patterns (Updated Dec 2025)
- [Complete Next.js Security Guide 2025](https://www.turbostarter.dev/blog/complete-nextjs-security-guide-2025-authentication-api-protection-and-best-practices) — Server Actions security

### Secondary (MEDIUM confidence)

**Performance Optimization:**
- [8 Reasons Your Next.js App is Slow — And How to Fix Them](https://blog.logrocket.com/fix-nextjs-app-slow-performance/) — Performance troubleshooting
- [The Ultimate Guide to Improving Next.js TTFB Slowness](http://www.catchmetrics.io/blog/the-ultimate-guide-to-improving-nextjs-ttfb-slowness-from-800ms-to-less100ms) — Database latency optimization

**Docker & Infrastructure:**
- [How to Run PostgreSQL in Docker with Persistent Data](https://oneuptime.com/blog/post/2026-01-16-docker-postgresql-persistent/view) — PostgreSQL volume management (Jan 2026)
- [Docker Compose Health Checks: An Easy-to-follow Guide](https://last9.io/blog/docker-compose-health-checks) — Health check configuration (Mar 2025)
- [NextJs App Deployment with Docker: Complete Guide for 2025](https://codeparrot.ai/blogs/deploy-nextjs-app-with-docker-complete-guide-for-2025) — Production deployment guide (Mar 2025)

**Monitoring:**
- [Error and Performance Monitoring for Next.js](https://sentry.io/for/nextjs/) — Sentry integration
- [Monitoring, Profiling, and Diagnosing Performance in Next.js 15](https://medium.com/@sureshdotariya/monitoring-profiling-and-diagnosing-performance-in-next-js-15-web-apps-2025-edition-bed33a88a719) — APM setup

### Tertiary (LOW confidence, needs validation)

**Community Patterns:**
- [Production build with docker compose and postgres](https://www.reddit.com/r/nextjs/comments/1iuzvur/production_build_with_docker_compose_and_postgres/) — Reddit discussion (unverified practices)
- [How to set up an endpoint for Health check on Next.js?](https://stackoverflow.com/questions/57956476/how-to-set-up-an-endpoint-for-health-check-on-next-js) — Stack Overflow guidance

---

**Note:** This architecture is designed for the 50-200 student scale specified in PROJECT.md, with production deployment capabilities for the home server environment (192.168.0.5). For larger scales (1000+), significant changes to caching, queuing, and database architecture would be necessary.

*Architecture research for: 학원 학생 관리 시스템 with AI 성향 분석 (Production Deployment Architecture)*
*Researched: 2026-01-27 / Updated: 2026-01-30*
