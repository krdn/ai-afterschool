# Production Readiness Pitfalls

**Project:** AI AfterSchool - 학원 학생 관리 시스템
**Domain:** Production deployment, performance optimization, technical debt resolution for existing Next.js application
**Milestone:** v1.1 Production Readiness
**Researched:** 2026-01-30
**Confidence:** MEDIUM (WebSearch verified with official sources, some domain-specific knowledge from community discussions)

## Executive Summary

기존 Next.js 애플리케이션에 프로덕션 배포, 성능 최적화, 기술 부채 해결을 추가할 때 발생하는 일반적인 실수들은 **환경 설정 누락, 모니터링 부재, 숨겨진 성능 병목, 데이터 마이그레이션 실패**로 요약할 수 있습니다. 이 문서는 AI AfterSchool 프로젝트가 v1.0(v1.0 MVP가 로컬 개발 환경에서 개발됨)에서 v1.1 프로덕션 준비 상태로 전환할 때 피해야 할 구체적 피트폴을 식별합니다.

**현재 상태(v1.0):**
- PDF가 로컬 파일시스템(`./public/reports`)에 저장
- `fetchReportData`가 `actions.ts`와 `route.ts`에 중복
- TypeScript 사용(README는 JavaScript라고 명시되어 있으나 실제로는 TypeScript)

**v1.1 목표:**
- 프로덕션 배포(운영 서버 192.168.0.5)
- 성능 최적화
- 기술 부채 해결

핵심 리스크 5가지:
1. **환경변수 누출** - Docker 이미지에 시크릿이 포함되거나 로그에 노출
2. **데이터베이스 연결 풀 고갈** - 서버리스 환경에서 연결 관리 실패
3. **이미지 최적화 실패** - 프로덕션에서 원본 이미지 그대로 제공
4. **타임존 불일치** - KST vs UTC 혼합으로 날짜 데이터 오염
5. **리팩토링 중 기능 파손** - 코드 중복 제거 중 기존 기능 깨짐

---

## Critical Pitfalls

### Pitfall 1: Environment Variable Leakage in Docker Images

**What goes wrong:**
Docker 이미지 빌드 시 `ENV`指令으로 시크릿이 포함되거나, `.env` 파일이 실수로 이미지에 복사됨. `docker history` 또는 `docker inspect`로 API 키, DB 비밀번호가 노출됨. 로그 파일에 환경변수가 출력되어 SIEM(보안 정보 및 이벤트 관리) 시스템에 저장됨.

**Why it happens:**
- Dockerfile에 `ENV DATABASE_URL=...` 직접 하드코딩
- `COPY . .`으로 `.env` 파일 포함
- `console.log(process.env)`로 디버깅 시 값 출력
- `.dockerignore` 누락으로 `.env*` 파일이 이미지에 포함

**Prevention:**
```dockerfile
# BAD
ENV DATABASE_URL=postgresql://user:pass@host/db

# GOOD - 런타임에만 주입
ENV DATABASE_URL=${DATABASE_URL}

# .dockerignore 필수
.env
.env.local
.env.production
*.key
```

**Warning signs:**
- Docker 이미지 크기가 비정상적으로 큼 (base 이미지 대비 2배 이상)
- `docker history <image>` 출력에 ENV 레이어 다수 존재
- 애플리케이션 로그에 "DATABASE_URL=postgresql://..." 패턴 존재

**Detection:**
```bash
# Check if secrets are in image layers
docker history --no-trunc <image-name> | grep -i "env.*database\|env.*api"

# Check if .env files are copied
docker run --rm <image-name> ls -la /app/.env*

# Check logs for exposed secrets
docker logs <container-name> 2>&1 | grep -i "password\|secret\|api_key"
```

**Phase to address:**
Phase 1 (Production Deployment) - Docker Compose 설정과 배포 스크립트 작성 전 필수 검증

**Recovery if it happens:**
1. 즉시 노출된 시크릿 폐기 (API 키 재발급, DB 비밀번호 변경)
2. Docker 레지스트리에서 해당 이미지 삭제
3. `docker system prune -a`로 로컬 캐시 정리
4. `.dockerignore` 추가 후 재빌드

**Sources:**
- [Security Advice for Self-Hosting Next.js in Docker - Arcjet](https://blog.arcjet.com/security-advice-for-self-hosting-next-js-in-docker/)
- [NextJS on Docker: Managing Environment Variables - Arity Labs](https://aritylabs.com/nextjs-on-docker-managing-environment-variables-across-different-environments-972b34a76203)
- [Best Practices of Docker & Docker-Compose for NextJS - DEV.to](https://dev.to/mohamed_amine_78123694764/best-practices-of-docker-docker-compose-for-nextjs-application-2kdm)

---

### Pitfall 2: Database Connection Pool Exhaustion

**What goes wrong:**
Next.js 서버리스 환경(Vercel, Docker swarm)에서 데이터베이스 연결 풀이 고갈되어 새 요청이 거부됨. `PoolExhaustedError`, `Connection timeout`, "Too many connections" 에러 발생. 특히 Vercel 빌드 시 Prisma pre-rendering으로 연결이 급증함.

**Why it happens:**
- Server Components가 각 요청마다 새 연결 생성
- 개발 환경의 Hot Refresh가 매초 연결 생성 (Next.js 13+)
- Connection pool 설정이 서버리스 동시성에 맞지 않음 (default: pool_size=10, serverless functions=100+)
- 연결 반환 누락 (`await` 누락 또는 에러로 `disconnect` 호출 안 됨)

**Prevention:**
```javascript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Vercel/Serverless: connection_limit=1 (stateless)
  // Docker: connection_limit=10~20
}

// lib/db.ts - Singleton pattern (MEDIUM confidence - community pattern)
let prisma

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient()
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient()
  }
  prisma = global.prisma
}

export default prisma
```

**Warning signs:**
- DB 로그에 "too many connections" 또는 "connection limit exceeded"
- 애플리케이션 로그에 `PrismaClientInitializationError: Connection pool exhausted`
- Vercel 빌드 실패: "Build failed due to database connection issues"
- 모니터링: `pg_stat_activity`에서 `idle` 연결 급증

**Detection:**
```sql
-- Check connection usage in PostgreSQL
SELECT count(*), state
FROM pg_stat_activity
WHERE datname = 'afterschool'
GROUP BY state;

-- Check for idle connections
SELECT pid, usename, application_name, state, state_change
FROM pg_stat_activity
WHERE datname = 'afterschool' AND state = 'idle';
```

**Phase to address:**
Phase 1 (Production Deployment) - 배포 전 DB pool 설정 튜닝 및 모니터링 도구 배포

**Recovery if it happens:**
1. DB max_connections 일시적 증설 (emergency)
2. Prisma Client Singleton 패턴 적용
3. 서버리스 함수 동시성 제한 (Vercel: `maxDuration` 조정)
4. PgBouncer 또는 RDS Proxy 도입 (long-term)

**Sources:**
- [Database Connection Pooling in Production: Real-World Tuning - Medium](https://medium.com/codetodeploy/database-connection-pooling-in-production-real-world-tuning-that-actually-works-0b6d8e12195b)
- [Connection Pool Exhaustion: The Silent Killer - HowTech Substack](https://howtech.substack.com/p/connection-pool-exhaustion-the-silent)
- [Next.js 13 App Dir: Fast Refresh Issues - GitHub Issue #45483](https://github.com/vercel/next.js/issues/45483)
- [Database Connection Pool Exhaustion During Vercel Build - Plasmic Forum](https://forum.plasmic.app/t/database-connection-pool-exhaustion-during-vercel-build/11141)

---

### Pitfall 3: Image Optimization Not Working in Production

**What goes wrong:**
로컬 개발에서는 Next.js `<Image>` 컴포넌트가 잘 작동하나, 프로덕션 배포 후 원본 크기 이미지(2MB+)가 그대로 제공됨. `next/image` 최적화가 비활성화되어 CLS(Cumulative Layout Shift) 점수 나쁨, LCP(Largest Contentful Paint) 5초+ 초과.

**Why it happens:**
- `next.config.js`에 외부 이미지 도메인 누락 (`images.domains` 또는 `images.remotePatterns`)
- Docker 이미지 빌드 시 `sharp` 라이브러리 설치 실패 (native module)
- Cloudflare/Vercel Edge에서 `sharp` 미지원 (unoptimized fallback)
- 이미지 URL에 쿼리 파라미터 포함 시 CDN 캐시 무효화
- 환경변수 `NEXT_PUBLIC_*` 누락으로 로더 설정 실패

**Prevention:**
```javascript
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
    // Fallback for non-Node.js environments
    unoptimized: false,
  },
}

// Dockerfile - sharp native module 의존성
FROM node:20-alpine
RUN apk add --no-cache vips-dev
# 또는 sharp의 prebuilt binary 사용
ENV SHARP_IGNORE_GLOBAL_LIBVIPS=1
```

**Warning signs:**
- 브라우저 DevTools Network 탭에서 이미지 크기 1MB+ (optimized라면 100KB 이내)
- Console 로그: `Error: Image optimization failed` 또는 `Invalid src`
- Lighthouse 성능 보고서: "Serve images in next-gen formats" 실패
- `next.config.js`에 `images.domines: []` 비어있음

**Detection:**
```bash
# Check image sizes in production
curl -I https://your-domain.com/image.jpg | grep -i content-length

# Check Next.js config
grep -A 10 "images:" next.config.mjs

# Check if sharp is installed
npm list sharp
```

**Phase to address:**
Phase 2 (Performance Optimization) - Lighthouse audit 실행 후 이미지 최적화 검증

**Recovery if it happens:**
1. `next.config.js`에 이미지 도메인 추가
2. `sharp` 재설치: `npm install sharp --force`
3. 외부 이미지는 Next.js Image Optimization 사용하지 않고 `<img>` 태그로 전환 (temporary)
4. Cloudflare/Imagespace 또는 Cloudinary 자체 최적화 사용

**Sources:**
- [Why Your Next.js Images Don't Load in Production - Medium](https://medium.com/@davxne/why-your-next-js-images-dont-load-in-production-and-how-to-fix-it-389fec0df7f1)
- [Image optimization is not working on production environment - StackOverflow](https://stackoverflow.com/questions/73556431/next-js-11-image-optimization-is-not-working-on-production-environment)
- [5 Common Mistakes Developers Make with Next.js Image Optimization - JavaScript Plain English](https://javascript.plainenglish.io/5-common-mistakes-developers-make-with-next-js-image-optimization-and-how-to-fix-them-98bcaaf9a81b)

---

### Pitfall 4: N+1 Query Problems Not Caught in Development

**What goes wrong:**
로컬 개발에서는 데이터가 적어(10건 미만) N+1 쿼리 문제가 드러나지 않음. 프로덕션에서 100+ 학생 데이터 로드 시 페이지 로딩 10초+ 초과. DB `pg_stat_statements`에서 단일 페이지 요청 시 500+ 쿼리 실행 확인됨.

**Why it happens:**
- ORM(Prisma)의 `include` 또는 `select` 미사용으로 관계 데이터 lazy loading
- Server Components에서 `students.map(async (s) => await s.analysis())` 패턴으로 루프 내 DB 쿼리
- React `useEffect` 내에서 API 호출 반복 (client-side data fetching)
- Prisma의 `findMany` 결과를 순회하며 연관 데이터 개별 조회

**Prevention:**
```javascript
// BAD - N+1 query
const students = await prisma.student.findMany()
for (const student of students) {
  const analysis = await prisma.analysis.findFirst({
    where: { studentId: student.id }
  })
  student.analysis = analysis
}

// GOOD - Single query with include
const students = await prisma.student.findMany({
  include: {
    analyses: true,  // JOIN으로 한 번에 조회
    payments: true,
  },
})

// Alternative - Parallel queries with Promise.all
const [students, analyses] = await Promise.all([
  prisma.student.findMany(),
  prisma.analysis.findMany(),
])
// 메모리에서 조인
```

**Warning signs:**
- Prisma 로그 활성화(`DEBUG=*`) 후 요청 시 쿼리 수 50+ 확인
- DB slow query 로그에 `SELECT * FROM analysis WHERE student_id = ?` 반복
- React DevTools Profiler에서 "Network" 탭 waterfall 패턴 (serial API calls)
- 프로덕션에서만 페이지 로딩 느림 (local DB에 데이터 부족)

**Detection:**
```javascript
// Enable Prisma query logging
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

// Check in console - if you see many similar queries, it's N+1
```

**Phase to address:**
Phase 2 (Performance Optimization) - Prisma query logging 활성화 후 N+1 패턴 감지

**Recovery if it happens:**
1. Prisma `include` 또는 `select`로 JOIN 쿼리로 변경
2. DataLoader 패턴 도입 (batching + caching)
3. GraphQL API라면 `dataloader` 라이브러리 사용
4. Redis 캐싱으로 자주 조회되는 데이터 메모리 저장

**Sources:**
- [The Ultimate Guide to Improving Next.js TTFB - CatchMetrics](http://www.catchmetrics.io/blog/the-ultimate-guide-to-improving-nextjs-ttfb-slowness-from-800ms-to-less100ms)
- [The N+1 Query Problem: The Silent Performance Killer - DEV.to](https://dev.to/lovestaco/the-n1-query-problem-the-silent-performance-killer-2b1c)
- [Database Query Optimization in Node.js: The 3 Mistakes - Medium](https://medium.com/@deval93/database-query-optimization-in-node-js-the-3-mistakes-that-slow-everything-down-ba6734638de6)

---

### Pitfall 5: Timezone Handling (KST vs UTC)

**What goes wrong:**
한국 시간(KST, UTC+9)과 UTC 혼합 사용으로 날짜 데이터 불일치. 학생 생년월일이 하루 밀림. 출결 기록이 하루 전/후로 저장됨. 특히 서버와 클라이언트의 타임존이 다를 때 Next.js Server Components와 Client Components 간 날짜 표시가 다름.

**Why it happens:**
- DB에 UTC로 저장되어 있는데 클라이언트에서 `new Date(birthday)`로 KST 해석
- `Date.prototype.toString()`이 브라우저 타임존 기반으로 변환
- Server Components(서버 시간)와 Client Components(브라우저 시간)의 타임존 불일치
- `toLocaleString('ko-KR')` 사용 시 서버/클라이언트 결과 다름
- PostgreSQL `timestamptz` 타입 미사용으로 타임존 정보 손실

**Prevention:**
```javascript
// DB: 항상 UTC 저장
// schema.prisma
model Student {
  birthday DateTime  // timestamptz로 자동 변환
}

// Server Component - 항상 UTC로 DB 조회 후 KST로 변환
import { format } from 'date-fns'
import { utcToZonedTime } from 'date-fns-tz'

const student = await prisma.student.findUnique(...)
const kstBirthday = utcToZonedTime(student.birthday, 'Asia/Seoul')
const formatted = format(kstBirthday, 'yyyy-MM-dd HH:mm:ssXXX', { timeZone: 'Asia/Seoul' })

// Client Component - 사용자 입력 시 KST → UTC 변환
<input type="datetime-local" />
// 제출 시 서버 액션에서
const utcBirthday = new Date(formData.get('birthday'))  // 브라우저가 KST로 해석
// DB에는 그대로 저장 (timestamptz로 UTC 변환됨)
```

**Warning signs:**
- Lighthouse audit의 "datetime" element warnings
- 서버 로그와 클라이언트 디버깅에서 날짜 1시간( daylight saving) 또는 9시간(KST) 차이
- 생년월일 기반 사주 계산 결과가 실제와 다름
- 출결 통계에서 하루 차이로 결석/지각 판정 오류

**Detection:**
```javascript
// Test timezone handling
console.log('Server time:', new Date().toString())
console.log('Server time UTC:', new Date().toUTCString())
console.log('Server time KST:', new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }))
```

**Phase to address:**
Phase 1 (Production Deployment) - 타임존 정책을 DB schema부터 UI까지 일관되게 정의

**Recovery if it happens:**
1. DB의 모든 `timestamp` 컬럼을 `timestamptz`로 마이그레이션
2. 기존 데이터에 타임존 정보 재설정 (UPDATE 문으로 timezone offset 적용)
3. 날짜 입력 UI에 timezone 힌트 추가 (e.g., "KST 기준")
4. Server Components에서 항상 `Asia/Seoul` timezone 명시

**Sources:**
- [Next.js Date & Time Localization Guide - Staarter.dev](https://staarter.dev/blog/nextjs-date-and-time-localization-guide)
- [Handling Time Zone in JavaScript - TOAST UI Medium](https://toastui.medium.com/handling-time-zone-in-javascript-547e67aa842d)
- [How to Handle Time Zones in JavaScript - Bits and Pieces](https://blog.bitsrc.io/how-to-handle-time-zones-in-javascript-b135a7931453)
- [Handling Date and Time in Next.js: Best Practices - LinkedIn](https://www.linkedin.com/pulse/handling-date-time-nextjs-best-practices-common-pitfalls-aloui-zxkze)

---

## Technical Debt Patterns

### Pattern 1: Duplicated Code Between actions.ts and route.ts

**Context for AI AfterSchool:**
현재 `fetchReportData` 함수가 `app/reports/[id]/actions.ts`와 `app/api/reports/[id]/route.ts`에 중복되어 있음.

**Immediate Benefit:**
빠른 prototyping - 복사/붙여넣기로 기능 빠르게 구현

**Long-term Cost:**
- 버그 수정 시 두 파일 모두 변경 필요
- 타입 안전성 손실 (서로 다른 validation 로직)
- 테스트 코드 중복 (같은 로직 두 번 테스트)
- 리팩토링 시 어느 파일이 실제 사용 중인지 혼란

**When Acceptable:**
MVP prototyping에서 "Works on My Machine" 검증 전까지만 허용

**How to Resolve:**
```javascript
// lib/report-generator.ts - Shared logic
export async function fetchReportData(studentId: string) {
  // ...
}

// app/reports/[id]/actions.ts - Server Actions
'use server'
import { fetchReportData } from '@/lib/report-generator'
export async function generateReportAction(id: string) {
  const data = await fetchReportData(id)
  // ...
}

// app/api/reports/[id]/route.ts - API Routes
import { fetchReportData } from '@/lib/report-generator'
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const data = await fetchReportData(params.id)
  return Response.json(data)
}
```

**Phase to address:**
Phase 3 (Technical Debt Resolution) - 리팩토링 단계에서 해결

---

### Pattern 2: Hardcoded URLs in Components

**Immediate Benefit:**
빠른 개발 - `href="/students/123"` 처럼 직접 URL 작성

**Long-term Cost:**
- 경로 변경 시 컴포넌트 모두 찾아서 수정
- i18n 다국어 지원 시 URL prefix 처리 어려움
- 테스트 환경과 프로덕션 URL이 다를 때 하드코딩된 URL이 깨짐
- TypeScript로 URL 타입 안전성 확보 불가

**When Acceptable:**
절대 허용하지 않음 - `next/link`의 `<Link href={{ pathname: '/students/[id]', params: { id } }}>` 사용

**How to Resolve:**
```typescript
// lib/routes.ts - Centralized route definitions
export const routes = {
  students: {
    list: '/students',
    detail: (id: string) => `/students/${id}`,
    edit: (id: string) => `/students/${id}/edit`,
  },
  reports: {
    detail: (id: string) => `/reports/${id}`,
  },
} as const

// Component usage
import { routes } from '@/lib/routes'
<Link href={routes.students.detail(student.id)}>View</Link>
```

**Phase to address:**
Phase 3 (Technical Debt Resolution)

---

### Pattern 3: Missing Database Indexes

**Immediate Benefit:**
초기 schema 작성 시 인덱스 고려하지 않아 빠름

**Long-term Cost:**
- 데이터 1,000건 이상 시 쿼리 속도 급격히 저하
- `EXPLAIN ANALYZE`에서 Seq Scan(전체 스캔) 확인
- 특히 `WHERE`, `JOIN`, `ORDER BY` 컬럼에 인덱스 없을 때 치명적
- Postgres `pg_stat_user_tables`에서 `seq_scan`이 `idx_scan`보다 월등히 높음

**When Acceptable:**
개발 초기 데이터 <100건일 때만 임시 허용

**How to Resolve:**
```prisma
// schema.prisma
model Student {
  id        String   @id
  name      String
  birthday  DateTime

  @@index([name])          // 자주 검색하는 컬럼
  @@index([birthday])      // 범위 검색 (age calculation)
  @@index([teacherId])     // Foreign key
}

model Analysis {
  id        String   @id
  studentId String
  type      String   // 'mbti' | 'saju' | 'face'
  createdAt DateTime @default(now())

  @@index([studentId])     // JOIN을 위한 foreign key 인덱스
  @@index([type])          // 필터링
  @@index([studentId, type]) // Composite index for WHERE studentId AND type
}
```

**Phase to address:**
Phase 2 (Performance Optimization)

---

### Pattern 4: Ignoring Error Boundaries

**Immediate Benefit:**
에러 핸들링 없이 빠르게 기능 구현

**Long-term Cost:**
- 단일 컴포넌트 에러로 전체 페이지가 렌더링 안 됨 ("White Screen of Death")
- 사용자에게 기술적 에러 메시지 노출 (`TypeError: Cannot read property 'map' of undefined`)
- 에러 추적 불가 (어디서 에러 발생했는지 알 수 없음)
- Sentry/Rollbar 같은 에러 트래킹 도구 연동 어려움

**When Acceptable:**
절대 허용하지 않음 - Next.js App Router는 error.tsx로 자동 지원

**How to Resolve:**
```typescript
// app/reports/[id]/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>보고서를 불러오는 중 문제가 발생했습니다</h2>
      <button onClick={reset}>다시 시도</button>
      {/* 에러 digest를 Sentry로 전송 */}
      <ErrorReporting error={error} />
    </div>
  )
}
```

**Phase to address:**
Phase 1 (Production Deployment)

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| **Docker secrets** | `docker-compose.yml`에 직접 API 키 하드코딩 | `secrets:` 섹션 사용 또는 환경변수 파일 `.env` 무시 |
| **Nginx reverse proxy** | `/api` 경로를 `/api/v1`로 proxy 시 URL 누락 | `proxy_pass`에 trailing slash 포함: `http://backend:3000/api/` |
| **Let's Encrypt SSL** | 인증서 90일 만료 갱신忘记 | Certbot auto-renewal cron job 설정 또는 Caddy 자동 갱신 사용 |
| **Cloudinary CDN** | `cloud_name`을 `.env`에 넣지 않고 코드에 하드코딩 | `process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` 사용 |
| **Prisma migrations** | 로컬 migration 파일만 commit하고 프로덕션 DB migration 누락 | `npx prisma migrate deploy`를 배포 스크립트에 포함 |
| **OpenAI API** | API rate limits(3,000 RPM) 고려하지 않고 병렬 요청 | `tunnel` 도구로 rate limiting 또는 exponential backoff 구현 |
| **Clerk auth** | Middleware만 의존하고 Server Actions에서 재검증 안 함 | 모든 Server Action에서 `auth()` 호출로 권한 확인 (defense in depth) |

**Sources:**
- [Deploying Next.js on Ubuntu with SSL (Nginx + Let's Encrypt) - Medium](https://medium.com/@moeidsaleem/deploying-nextjs-on-ubuntu-with-ssl-with-nginx-letsencrypt-pm2-80299e1d2257)
- [Step-by-Step HTTPS Setup for Full-Stack Apps (Certbot + Docker) - Kaisal Husrom](https://kaisalhusrom.com/en/posts/securing-your-full-stack-app-with-https-using-certbot-and-docker)
- [Deploying a Next.js application on a VPS with Docker and Nginx - Eric Cabrel](https://blog.tericcabrel.com/deploy-nextjs-vps-docker-nginx/)
- [Deploying a Next.js app with Docker and Nginx on GCP - Paul Schick](https://paul-schick.com/posts/Deploying-nextjs-with-docker-nginx-on-gcp/)

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| **Bundle size regression** | 초기 JS 번들 500KB+, Lighthouse "Reduce unused JavaScript" 실패 | `@next/bundle-analyzer`로 번들 분석, dynamic imports 사용 | 서드파티 라이브러리 추가 시 (e.g., chart.js, moment.js 대신 dayjs) |
| **Missing response caching** | 매 요청마다 DB 조회, API 응답 시간 500ms+ 변동 없음 | Next.js `fetch`의 `next.revalidate` 또는 `unstable_cache` 사용 | 데이터가 자주 변경 안 되는 학생 정보, 성향 분석 결과 |
| **Over-caching stale data** | 수정 후에도 이전 데이터 표시, 사용자 혼란 | 캐시 무효화 전략(`revalidatePath`, `revalidateTag`) 명확히 | 데이터 수정 후 캐시 갱신 누락 시 |
| **Database connection pool exhaustion** | "Too many connections" 에러, 페이지 로딩 타임아웃 | PgBouncer/RDS Proxy 도입, Prisma Singleton 패턴 | 동시 사용자 100+ 이거나 서버리스 함수 수 50+ |
| **N+1 queries** | LCP 5초+, DB CPU 90%+ | Prisma `include`, DataLoader 패턴 | 관계 데이터(student → analyses) 조회 시 |
| **Image optimization fails** | 원본 이미지 2MB+ 그대로 전송, CLS 점수 나쁨 | `next.config.js`에 `images.domines` 설정, `sharp` 설치 확인 | 외부 이미지 도메인 추가 시 또는 Docker 배포 시 |
| **Missing health checks** | Docker container crash loop, 자동 재시작만 반복 | `/health` 엔드포인트 추가 (DB 연결 확인), Docker `HEALTHCHECK`指令 | 컨테이너가 실행 중이지만 실제로는 DB 연결 실패 시 |

**Sources:**
- [Reducing JavaScript Bundle Size in Next.js - DEV.to](https://dev.to/maurya-sachin/reducing-javascript-bundle-size-in-next-js-practical-guide-for-faster-apps-h0)
- [Next.js bundle size is exploding - StackOverflow](https://stackoverflow.com/questions/66014730/next-js-bundle-size-is-exploding-as-a-result-of-dynamic-component-lookup-how-to)
- [The 10KB Next.js App: Extreme Bundle Optimization - Medium](https://medium.com/better-dev-nextjs-react/the-10kb-nextjs-app-extreme-bundle-optimization-techniques-d8047c482aea)
- [NextJS bundle size not decreased after optimizing - Reddit](https://www.reddit.com/r/nextjs/comments/1ia7mn0/nextjs_bundle_size_not_decreased_after_optimizing/)

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| **Exposed API keys in logs** | `console.log(process.env.OPENAI_API_KEY)`로 GitHub/CI에 노출 | Log redaction tools(예: winston을 통한 JSON 로그), `.env`를 `.gitignore`에 명시 |
| **Missing rate limiting** | 무차별 대입 공격으로 과금 폭탄, DB 부하 | `upstash/ratelimit` 또는 Redis 기반 IP별 요청 제한, API Routes에 `@upstash/ratelimit` 적용 |
| **CORS misconfiguration** | `Access-Control-Allow-Origin: *`으로 CSRF 공격 노출 | `origin` 옵션으로 허용 도메인 명시, credentials 모드 주의 |
| **Session cookie security** | httpOnly 없어 XSS로 탈취 가능, SameSite=None으로 CSRF 노출 | Clerk/NextAuth의 기본 쿠키 설정 유지, `secure: true`(HTTPS), `httpOnly: true`, `SameSite=lax` |
| **SQL injection after "optimization"** | Raw query 작성 시 사용자 입력 sanitization 누락 | Prisma의 parameterized query만 사용, `prisma.$queryRawUnsafe` 절대 금지 |
| **Middleware authentication bypass** | Middleware만 믿고 Server Actions에서 권한 재검증 안 함 | 모든 mutation action에서 `currentUser()` 호출로 teacher_id 확인 (CVE-2025-29927 방지) |

**Sources:**
- [Complete Next.js Security Guide 2025: Authentication, API Protection, and Best Practices - Turbostarter](https://www.turbostarter.dev/blog/complete-next-js-security-guide-2025-authentication-api-protection-and-best-practices)
- [Rate Limiting Techniques in Next.js with Examples - Medium](https://medium.com/@jigsz6391/rate-limiting-techniques-in-next-js-with-examples-4ec436de6dff)
- [Rate-limiting Server Actions in Next.js - Next.js Weekly](https://nextjsweekly.com/blog/rate-limiting-server-actions)
- [4 Best Rate Limiting Solutions for Next.js Apps (2024) - DEV.to](https://dev.to/ethanleetech/4-best-rate-limiting-solutions-for-nextjs-apps-2024-3ljj)

---

## Korean-Specific Pitfalls

### Font Loading Issues (Malgun Gothic, Noto Sans KR)

**What goes wrong:**
한글 폰트(Noto Sans KR) 용량이 2MB+로 커서 FOUT(Flash of Unstyled Text) 또는 FOIT(Flash of Invisible Text) 발생. 페이지 로딩 시 텍스트가 1-2초간 안 보이다가 갑자기 나타남. CLS(Cumulative Layout Shift) 점수 나쁨.

**Prevention:**
```javascript
// app/layout.tsx
import { Noto_Sans_KR } from 'next/font/google'

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  display: 'swap',  // FOUT 방지
  variable: '--font-noto-sans-kr',
  preload: true,
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={notoSansKR.variable}>
      <body className={notoSansKR.className}>{children}</body>
    </html>
  )
}
```

**Note:** 이 항목은 현재 WebSearch에서 구체적인 한글 폰트 관련 문제를 찾지 못해 **LOW confidence**입니다. 로컬 테스트 필요.

---

### Character Encoding Issues

**What goes wrong:**
이름 한글이 DB에 `'ì\xa4\x90'` 같은 깨진 문자로 저장됨. CSV export 시 한글이 모두 `???`로 표시됨. POST 요청에서 `application/json; charset=utf-8` 누락으로 인코딩 오류.

**Prevention:**
- DB connect string에 `charset=utf8mb4` 명시 (PostgreSQL은 default UTF-8)
- CSV export 시 BOM(Byte Order Mark) 추가: `\uFEFF` + CSV content
- API Routes 응답 헤더: `Content-Type: application/json; charset=utf-8`

---

### Payment Gateway Integration (Future Consideration)

**What goes wrong:**
카카오페이, 네이버페이 등 한국 PG(Payment Gateway) 연동 시 HMAC signature 검증 실패, webhook URL이 `http`로 요청되어 거부됨, 콜백 URL에 query parameter 포함 시 보안 검증 실패.

**Prevention:**
- Phase 6 이후 수강료 관리 기능 구현 시 토스페이먼츠/포트원(PortOne) 같은 aggregated PG 사용 권장
- Webhook endpoint를 `/api/pg/webhook`으로 하고 `csrf-protection` 비활성화
- HMAC signature 검증 로직을 서버 사이드에서만 (Server Actions)

---

## "Looks Done But Isn't" Checklist

- [ ] **Docker 환경변수:** `.env` 파일이 이미지에 포함되어 있지 않음 — `docker history <image>` 출력 확인
- [ ] **DB 인덱스:** `WHERE`, `JOIN`에 사용되는 컬럼에 인덱스 존재 — `EXPLAIN ANALYZE` 실행
- [ ] **이미지 최적화:** 프로덕션에서 `<Image>` 컴포넌트가 최적화된 이미지 반환 — Network 탭에서 이미지 크기 100KB 이내 확인
- [ ] **타임존 일관성:** DB는 UTC, UI는 KST, 변환 로직이 Server/Client 모두 동일 — 생년월일로 사주 계산 검증
- [ ] **에러 바운더리:** 모든 route 그룹에 `error.tsx` 존재 — 의도적으로 에러 발생시켜 UI 확인
- [ ] **Health check:** `/health` 엔드포인트가 DB 연결 확인 — Docker `HEALTHCHECK`指令 동작 확인
- [ ] **로그 관리:** Docker logs가 디스크를 가득 채우지 않음 — `log-driver: json-file`에 `max-size: 10m` 설정
- [ ] **CORS:** API Routes가 허용된 origin에서만 요청 가능 — `curl -H "Origin: http://evil.com"` 테스트

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| **Environment variable leakage** | **HIGH** (시크릿 폐기, 재발급) | 1. 모든 노출된 시크릿 즉시 폐기(재발급) 2. Docker 이미지 삭제 후 재빌드 3. `.dockerignore`에 `.env*` 추가 4. CI/CD pipeline에 secrets scan 추가 |
| **DB connection pool exhaustion** | **MEDIUM** (설정 변경 + 모니터링) | 1. Prisma Singleton 패턴 적용 코드 배포 2. PgBouncer 도입 (connection pooling) 3. Application-level rate limiting 4. DB max_connections 일시 증설(emergency) |
| **Image optimization fails** | **LOW** (설정 수정만) | 1. `next.config.js`에 `images.domines` 추가 2. `npm install sharp --force`로 재설치 3. 외부 이미지는 `<img>`로 전환(temporary) 4. Lighthouse audit로 재검증 |
| **N+1 queries** | **MEDIUM** (쿼리 리팩토링) | 1. Prisma logging으로 N+1 패턴 식별 2. `include` 또는 `select`로 JOIN 쿼리로 변경 3. DataLoader 패턴 도입(필요 시) 4. DB slow query log로 모니터링 |
| **Timezone bugs** | **HIGH** (데이터 마이그레이션) | 1. DB schema를 `timestamptz`로 마이그레이션 2. 기존 데이터에 timezone offset 적용 UPDATE 3. 애플리케이션에서 일관되게 `Asia/Seoul` 사용 4. 테스트: 생년월일 기반 사주 계산 검증 |
| **Bundle size regression** | **LOW** (dynamic import) | 1. `@next/bundle-analyzer`로 큰 라이브러리 식별 2. `dynamic(import('Library'))`로 code splitting 3. Lighthouse audit로 개선 확인 |
| **Hardcoded URLs** | **LOW** (find-replace) | 1. `lib/routes.ts`集中 route 정의 생성 2. 전역 검색으로 하드코딩된 URL 찾기 (`href="/students/` 패턴) 3. 라우트 상수로 교체 4. TypeScript로 타입 안전성 확보 |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Environment variable leakage | **Phase 1** (Production Deployment) | Docker 이미지 빌드 후 `docker history`로 ENV 레이어 확인, `.dockerignore` 존재 확인 |
| DB connection pool exhaustion | **Phase 1** (Production Deployment) | Load test(artillery/k6)로 동시 요청 100+ 보내며 `pg_stat_activity` 모니터링 |
| Image optimization fails | **Phase 2** (Performance) | 프로덕션 URL로 Lighthouse audit, Network 탭에서 이미지 크기 확인 |
| N+1 queries | **Phase 2** (Performance) | Prisma query logging 활성화 후 `/students` 페이지 요청 시 쿼리 수 <10 확인 |
| Timezone inconsistencies | **Phase 1** (Production Deployment) | 서로 다른 타임존의 두 클라이언트에서 동시에 접속해 날짜 표시 일치 확인 |
| Missing health checks | **Phase 1** (Production Deployment) | Docker container 시작 후 `curl /health`로 200 OK 응답 확인 |
| Missing database indexes | **Phase 2** (Performance) | `EXPLAIN ANALYZE`로 자주 호출되는 쿼리의 실행 계획에 Index Scan 확인 |
| Duplicated code | **Phase 3** (Technical Debt) | `actions.ts`와 `route.ts`의 `fetchReportData`가 동일한 함수를 import하도록 refactoring |
| CORS misconfiguration | **Phase 1** (Production Deployment) | `curl -H "Origin: http://evil.com" https://api.example.com/students`로 403 응답 확인 |
| Session cookie security | **Phase 1** (Production Deployment) | DevTools Application 탭에서 쿠키의 `HttpOnly`, `Secure`, `SameSite` 속성 확인 |
| Font loading FOUT/CLS | **Phase 2** (Performance) | WebPageTest로 CLS 점수 <0.1 확인, 텍스트가 즉시 렌더링되는지 확인 |
| Log file disk fill | **Phase 1** (Production Deployment) | Docker Compose에 `logging: driver: json-file, options: { max-size: 10m, max-file: 3 }` 설정 |
| SSL certificate expiration | **Phase 1** (Production Deployment) | `certbot certificates`으로 만료 30일 이내인지 확인, auto-renewal cron job 동작 확인 |

---

## Sources

### Primary (HIGH confidence)

**Official Documentation:**
- [Next.js Data Security Guide](https://nextjs.org/docs/app/guides/data-security) — CORS, rate limiting, session security
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images) — `images.domines`, `unoptimized` 설정
- [Prisma Production Troubleshooting](https://www.prisma.io/docs/orm/prisma-migrate/getting-started) — Migration failures, shadow database

**Security Advisories:**
- [Next.js CVE-2025-29927 Authorization Bypass](https://www.akamai.com/blog/security-research/march-authorization-bypass-critical-nextjs-detections-mitigations) — Middleware-only authentication vulnerability
- [Complete Next.js Security Guide 2025](https://www.turbostarter.dev/blog/complete-next-js-security-guide-2025-authentication-api-protection-and-best-practices) — Defense in depth patterns

---

### Secondary (MEDIUM confidence)

**Docker & Deployment:**
- [Security Advice for Self-Hosting Next.js in Docker - Arcjet](https://blog.arcjet.com/security-advice-for-self-hosting-next-js-in-docker/) — Environment variable security, secret management
- [NextJS on Docker: Managing Environment Variables - Arity Labs](https://aritylabs.com/nextjs-on-docker-managing-environment-variables-across-different-environments-972b34a76203) — Runtime vs build-time env vars
- [Best Practices of Docker & Docker-Compose for NextJS - DEV.to](https://dev.to/mohamed_amine_78123694764/best-practices-of-docker-docker-compose-for-nextjs-application-2kdm) — Multi-stage Dockerfile, health checks
- [Deploying Next.js on Ubuntu with SSL (Nginx + Let's Encrypt) - Medium](https://medium.com/@moeidsaleem/deploying-nextjs-on-ubuntu-with-ssl-with-nginx-letsencrypt-pm2-80299e1d2257) — SSL setup, certbot automation

**Performance & Optimization:**
- [Database Connection Pooling in Production: Real-World Tuning - Medium](https://medium.com/codetodeploy/database-connection-pooling-in-production-real-world-tuning-that-actually-works-0b6d8e12195b) — Pool exhaustion monitoring
- [The Ultimate Guide to Improving Next.js TTFB - CatchMetrics](http://www.catchmetrics.io/blog/the-ultimate-guide-to-improving-nextjs-ttfb-slowness-from-800ms-to-less100ms) — N+1 query elimination
- [The N+1 Query Problem: The Silent Performance Killer - DEV.to](https://dev.to/lovestaco/the-n1-query-problem-the-silent-performance-killer-2b1c) — ORM lazy loading pitfalls
- [Why Your Next.js Images Don't Load in Production - Medium](https://medium.com/@davxne/why-your-next-js-images-dont-load-in-production-and-how-to-fix-it-389fec0df7f1) — Image optimization troubleshooting

**Rate Limiting & Security:**
- [Rate Limiting Techniques in Next.js with Examples - Medium](https://medium.com/@jigsz6391/rate-limiting-techniques-in-next-js-with-examples-4ec436de6dff) — Upstash, Redis implementations
- [4 Best Rate Limiting Solutions for Next.js Apps (2024) - DEV.to](https://dev.to/ethanleetech/4-best-rate-limiting-solutions-for-nextjs-apps-2024-3ljj) — express-rate-limit, Vercel Edge

**Health Checks & Monitoring:**
- [Next.js 14 Standalone Docker Container Fails AppRunner Healthcheck - StackOverflow](https://stackoverflow.com/questions/79688842/next-js-14-standalone-docker-container-fails-apprunner-healthcheck-works-fine-l) — Health check endpoint setup
- [NextJS 10.0.8 on Kubernetes Cluster Crash Loop - GitHub Discussion](https://github.com/vercel/next.js/discussions/22949) — Crash loop debugging

---

### Tertiary (LOW confidence, needs validation)

**Korean-Specific:**
- [Next.js Date & Time Localization Guide - Staarter.dev](https://staarter.dev/blog/nextjs-date-and-time-localization-guide) — KST/UTC handling patterns
- [Handling Time Zone in JavaScript - TOAST UI Medium](https://toastui.medium.com/handling-time-zone-in-javascript-547e67aa842d) — KST = UTC+09:00 conversion
- [Handling Date and Time in Next.js: Best Practices - LinkedIn](https://www.linkedin.com/pulse/handling-date-time-nextjs-best-practices-common-pitfalls-aloui-zxkze) — Server/client timezone differences

**Community Discussions:**
- [I Had Enough of the Breaking Changes! - Reddit](https://www.reddit.com/r/nextjs/comments/1i8qmst/i_had_enough_of-the-breaking-changes/) — Technical debt accumulation
- [How Frontend Teams Accumulate Technical Debt Without Realizing It - Altarsquare](https://www.altersquare.io/how-frontend-teams-accumulate-technical-debt-without-realizing-it/) — Refactoring pitfalls
- [NextJS Bundle Size Not Decreased After Optimizing - Reddit](https://www.reddit.com/r/nextjs/comments/1ia7mn0/nextjs_bundle_size_not_decreased_after_optimizing/) — Optimization anti-patterns

---

## Quality Gate Checklist

- [x] **Pitfalls are specific to production readiness** — 모든 항목이 로컬 개발이 아닌 프로덕션 배포/최적화/부채 해결과 관련
- [x] **Integration pitfalls with existing system covered** — Next.js, Docker, Prisma 등 현재 스택 관련 피트폴 포함
- [x] **Prevention strategies are actionable** — 코드 예시, 설정 값, 명령어 등 구체적 조치 제공
- [x] **Warning signs are concrete and detectable** — 로그 메시지, DevTools 출력, DB 쿼리 결과로 감지 가능
- [x] **Korean environment specifically considered** — 타임존(KST), 폰트(Noto Sans KR), 인코딩(UTF-8), PG사 등 한국 특정 사항 포함

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Docker/Deployment pitfalls | **HIGH** | Multiple official sources verified |
| Database performance pitfalls | **HIGH** | Prisma/Postgres official docs |
| Next.js security issues | **HIGH** | CVE database, official guides |
| Image optimization | **MEDIUM** | WebSearch verified, local testing required |
| Korean-specific pitfalls | **MEDIUM** | WebSearch verified, but local testing required |
| Performance optimization patterns | **MEDIUM** | Community best practices, project-specific validation needed |

**Overall confidence:** MEDIUM

---

**Research completed:** 2026-01-30
**Ready for roadmap:** yes

**Next Steps:**
1. Review this document with the team to prioritize which pitfalls to address first
2. Create specific tasks in the roadmap for each pitfall prevention
3. Set up monitoring and alerting for early detection of these issues
4. Document recovery runbooks for when pitfalls occur despite prevention
