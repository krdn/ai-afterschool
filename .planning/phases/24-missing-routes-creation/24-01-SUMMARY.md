---
phase: 24-missing-routes-creation
plan: 01
title: "Phase 24 Plan 01: Logging Infrastructure and /teachers/me Redirect"
summary: "AuditLog와 SystemLog Prisma 모델 추가 및 로그 기록 함수, /teachers/me 리다이렉트 페이지 구현"
subsystem: "Logging & Authentication"
tags: ["prisma", "logging", "audit-log", "system-log", "redirect", "authentication"]
tech-stack:
  added: []
  patterns: ["Server-side redirect pattern", "Session-based logging"]
key-files:
  created:
    - src/app/(dashboard)/teachers/me/page.tsx
  modified:
    - prisma/schema.prisma
    - src/lib/dal.ts
---

# Phase 24 Plan 01: Logging Infrastructure and /teachers/me Redirect Summary

## Overview

로깅 인프라를 구축하고 본인 프로필 빠른 접근 라우트를 구현했습니다. Prisma 스키마에 감사 로그와 시스템 로그 모델을 추가하고, 이를 활용하는 유틸리티 함수를 생성했습니다. 또한 `/teachers/me` 라우트를 통해 현재 로그인한 선생님이 자신의 프로필 페이지로 빠르게 접근할 수 있게 되었습니다.

## What Was Built

### 1. Prisma Schema Models

**AuditLog Model** (`prisma/schema.prisma`):
- 설정 변경 이력 추적을 위한 감사 로그 모델
- teacherId, action, entityType, entityId, changes, ipAddress, userAgent 필드
- Teacher 모델과 Cascade 관계
- 성능 최적화를 위한 인덱스 (teacherId, entityType+entityId, createdAt DESC)

**SystemLog Model** (`prisma/schema.prisma`):
- 애플리케이션 로그 기록을 위한 시스템 로그 모델
- level (ERROR, WARN, INFO, DEBUG), message, context 필드
- 성능 최적화를 위한 인덱스 (level, timestamp DESC)

### 2. Logging Utility Functions

**logAuditAction** (`src/lib/dal.ts`):
```typescript
export async function logAuditAction(params: {
  action: string
  entityType: string
  entityId?: string
  changes?: Record<string, unknown>
})
```
- 감사 로그 기록 함수
- IP 주소와 User-Agent 자동 수집
- 세션 검증 후 teacherId 자동 할당

**logSystemAction** (`src/lib/dal.ts`):
```typescript
export async function logSystemAction(params: {
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG'
  message: string
  context?: Record<string, unknown>
})
```
- 시스템 로그 기록 함수
- ERROR, WARN, INFO, DEBUG 레벨 지원

### 3. /teachers/me Redirect Page

**TeacherMePage** (`src/app/(dashboard)/teachers/me/page.tsx`):
```typescript
export default async function TeacherMePage() {
  const session = await verifySession()
  redirect(`/teachers/${session.userId}`)
}
```
- `/teachers/me` 접근 시 `/teachers/{현재사용자ID}`로 자동 리다이렉트
- verifySession으로 인증된 사용자만 접근 가능
- 별도 UI 없이 즉시 리다이렉트

## Deviations from Plan

None - plan executed exactly as written.

## Authentication Gates

None encountered during execution.

## Key Technical Decisions

1. **감사 로그와 시스템 로그 분리**: 감사 로그는 사용자별 추적(teacherId, IP, User-Agent)이 필요하고, 시스템 로그는 애플리케이션 전체 이벤트 기록이 목적이므로 별도 모델로 분리

2. **@@map을 사용한 snake_case 테이블명**: 데이터베이스 관리 일관성을 위해 `audit_logs`, `system_logs`로 지정

3. **인덱스 전략**:
   - AuditLog: teacherId로 빠른 사용자별 조회, entityType+entityId로 엔티티 기반 조회, createdAt DESC로 최신순 정렬
   - SystemLog: level으로 레벨별 필터링, timestamp DESC로 최신 로그 우선 조회

4. **IP 주소 수집 순서**: x-forwarded-for → x-real-ip → null 순서로 프록시 환경 고려

5. **Server-side redirect 패턴**: Server Component에서 Next.js redirect 함수 사용하여 SEO 친화적이고 클라이언트 사이드 리다이렉트보다 빠름

## Next Phase Readiness

- [x] AuditLog/SystemLog 테이블 생성 완료
- [x] 로그 기록 함수 사용 가능
- [x] /teachers/me 라우트 생성 완료
- [ ] 실제 기능에서 로그 기록이 활용되도록 후속 Phase에서 통합 필요

## Task Commits

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Prisma 스키마에 로그 모델 추가 | b3119ea | prisma/schema.prisma |
| 2 | 로그 기록 함수 생성 | 300032e | src/lib/dal.ts |
| 3 | /teachers/me 리다이렉트 페이지 생성 | c811f7c | src/app/(dashboard)/teachers/me/page.tsx |

## Dependency Graph

**Requires:**
- Phase 11-02: Prisma Client Extensions (RBAC 기반)
- Phase 22: Counseling system (관련 데이터 구조)

**Provides:**
- 감사 로그 기록 인프라
- 시스템 로그 기록 인프라
- /teachers/me 리다이렉트 라우트

**Affects:**
- Phase 24 이후: 주요 설정 변경 시 감사 로그 기록 활용 가능
- Phase 27: RBAC 감사 추적 기능 구현 가능

## Metrics

- **Duration**: 225s (~3 min)
- **Completed**: 2026-02-06
- **Tasks**: 3/3 complete

## Self-Check: PASSED

- [x] `prisma/schema.prisma` - AuditLog, SystemLog models exist
- [x] `src/lib/dal.ts` - logAuditAction, logSystemAction functions exist
- [x] `src/app/(dashboard)/teachers/me/page.tsx` - redirect page exists
- [x] `npx prisma db push` - migration successful
- [x] `npm run build` - build successful, /teachers/me route included
- [x] Commits b3119ea, 300032e, c811f7c exist
