---
phase: 15-multi-llm-integration-smart-routing
plan: 06
subsystem: api
tags: [llm, usage-tracking, cron, server-actions, prisma, aggregation]

# Dependency graph
requires:
  - phase: 15-02
    provides: LLM router & usage tracking infrastructure (LLMUsage, LLMUsageMonthly models)
provides:
  - 월별 사용량 집계 로직 (usage-aggregation.ts)
  - 사용량 조회 Server Actions (llm-usage.ts)
  - Cron 기반 월별 집계 엔드포인트
affects: [15-07, 15-08, admin-dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns: [cron-authentication, aggregation-upsert, bigint-handling]

key-files:
  created:
    - src/lib/ai/usage-aggregation.ts
    - src/lib/actions/llm-usage.ts
    - src/app/api/cron/aggregate-llm-usage/route.ts
  modified: []

key-decisions:
  - "CRON_SECRET 환경 변수로 Cron 엔드포인트 인증"
  - "BigInt 타입으로 토큰 수 저장 (대규모 사용량 지원)"
  - "집계 전 데이터 삭제 방지 - 삭제 대상 기간 먼저 집계"

patterns-established:
  - "Cron 인증 패턴: Bearer token + CRON_SECRET 환경 변수"
  - "집계 upsert 패턴: year_month_provider_featureType composite key"

# Metrics
duration: 4min
completed: 2026-02-02
---

# Phase 15 Plan 06: Token Usage Tracking Summary

**LLM 사용량 월별 집계 시스템 with Cron endpoint & Server Actions for usage statistics**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-02T03:30:00Z
- **Completed:** 2026-02-02T03:34:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- 월별 사용량 집계 로직 구현 (제공자/기능별 집계, 이전 달 자동 집계)
- 오래된 데이터 정리 기능 (기본 90일 보존, 집계 후 삭제)
- 사용량 조회 Server Actions (일별, 월별, 제공자별, 기능별)
- Vercel Cron 호환 월별 집계 엔드포인트

## Task Commits

Each task was committed atomically:

1. **Task 1: Create usage aggregation service** - `44d8eaa` (feat)
2. **Task 2: Create LLM usage Server Actions** - `78388f0` (feat)
3. **Task 3: Create Cron endpoint for monthly aggregation** - `233dd99` (feat)

## Files Created/Modified

- `src/lib/ai/usage-aggregation.ts` - 월별 집계 로직 (aggregateMonthlyUsage, cleanupOldUsageData)
- `src/lib/actions/llm-usage.ts` - 사용량 조회 Server Actions (getUsageStatsAction, getDailyUsageAction 등)
- `src/app/api/cron/aggregate-llm-usage/route.ts` - Cron 엔드포인트 (GET with Bearer auth)

## Decisions Made

- **CRON_SECRET 환경 변수 인증**: 프로덕션에서 Bearer 토큰으로 Cron 엔드포인트 보호, 개발 환경에서는 인증 생략 가능
- **BigInt 토큰 수 저장**: totalInputTokens, totalOutputTokens에 BigInt 사용하여 대규모 사용량 지원
- **집계 전 데이터 보존**: cleanupOldUsageData에서 삭제 전 해당 기간의 월별 집계가 존재하는지 확인하고 없으면 생성

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

**환경 변수 설정 필요:**
- `CRON_SECRET`: Cron 엔드포인트 인증용 비밀 키 (프로덕션 필수)

**Vercel Cron 설정 (vercel.json):**
```json
{
  "crons": [{
    "path": "/api/cron/aggregate-llm-usage?cleanup=true",
    "schedule": "0 1 1 * *"
  }]
}
```

## Next Phase Readiness

- 사용량 조회 Server Actions 완성으로 대시보드 UI 연결 가능
- 월별 집계 Cron으로 장기 데이터 분석 지원
- 15-07 (Usage Dashboard UI) 진행 가능

---
*Phase: 15-multi-llm-integration-smart-routing*
*Completed: 2026-02-02*
