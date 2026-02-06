---
phase: 24-missing-routes-creation
plan: 03
title: "Admin 페이지 통합 (탭 기반)"
one_liner: "통합 Admin 페이지 /admin 생성 - 6개 탭(LLM 설정, 토큰 사용량, 시스템 상태, 시스템 로그, 데이터베이스, 감사 로그) 제공"
completed: 2026-02-07
duration: 6 minutes

subsystem: Admin UI
tags: [admin, tabs, integration, system-monitoring, logging]

# Tech Tracking

tech-stack:
  added: []
  removed: []

tech-stack.patterns:
  - name: Tab-based Admin Dashboard
    description: 단일 /admin 페이지에서 Tabs 컴포넌트를 사용하여 6개의 관리 기능 제공
    location: src/app/(dashboard)/admin/page.tsx
  - name: Server-side Data Fetching
    description: Server Component에서 병렬로 모든 데이터를 가져와 SSR로 빠른 초기 렌더링
    location: src/app/(dashboard)/admin/page.tsx
  - name: Client-side Tab State
    description: AdminTabsWrapper Client Component에서 탭 상태 관리
    location: src/components/admin/admin-tabs-wrapper.tsx
  - name: Server Actions with Role-based Access
    description: DIRECTOR 역할만 접근 가능한 Server Actions 패턴
    location: src/lib/actions/system.ts, backup.ts, audit.ts

# Key Files

key-files:
  created:
    - path: src/app/(dashboard)/admin/page.tsx
      provides: "통합 Admin 페이지 (탭 기반)"
      lines: 313
    - path: src/components/admin/status-card.tsx
      provides: "서비스 상태 카드 컴포넌트"
      lines: 62
    - path: src/components/admin/metric-card.tsx
      provides: "메트릭 표시 카드 컴포넌트 (icon prop 추가)"
      lines: 28
    - path: src/components/admin/tabs/status-tab.tsx
      provides: "시스템 상태 탭 컴포넌트"
      lines: 107
    - path: src/components/admin/tabs/logs-tab.tsx
      provides: "시스템 로그 탭 컴포넌트"
      lines: 146
    - path: src/components/admin/tabs/database-tab.tsx
      provides: "데이터베이스 백업 관리 탭 컴포넌트"
      lines: 88
    - path: src/components/admin/tabs/audit-tab.tsx
      provides: "감사 로그 탭 컴포넌트"
      lines: 150
    - path: src/components/admin/admin-tabs-wrapper.tsx
      provides: "탭 상태 관리 래퍼 컴포넌트"
      lines: 31
    - path: src/lib/actions/system.ts
      provides: "시스템 로그 조회 Server Action"
      lines: 54
    - path: src/lib/actions/backup.ts
      provides: "백업 관리 Server Action"
      lines: 42
    - path: src/lib/actions/audit.ts
      provides: "감사 로그 조회 Server Action"
      lines: 66
  modified: []

# Dependency Graph

dependencies:
  requires:
    - phase: 23
      reason: "data-testid Infrastructure (Phase 23)에서 data-testid 속성 추가 패턴 사용"
    - phase: 24-01
      reason: "로깅 인프라 (Phase 24-01)에서 SystemLog, AuditLog 모델 생성"
    - phase: 15
      reason: "LLM Config (Phase 15)에서 기존 LLM 설정 컴포넌트 재사용"
  provides:
    - name: "Integrated Admin Dashboard"
      description: "단일 /admin 페이지에서 모든 관리 기능에 접근 가능"
      location: "src/app/(dashboard)/admin/page.tsx"
    - name: "System Status Tab"
      description: "Health API에서 DB, Storage, Backup 상태를 카드 형식으로 표시"
      location: "src/components/admin/tabs/status-tab.tsx"
    - name: "System Logs Tab"
      description: "시스템 로그를 레벨별 필터링과 페이지네이션으로 표시"
      location: "src/components/admin/tabs/logs-tab.tsx"
    - name: "Database Backup Tab"
      description: "백업 파일 목록을 표시하고 관리"
      location: "src/components/admin/tabs/database-tab.tsx"
    - name: "Audit Logs Tab"
      description: "감사 로그를 작업 유형별 필터링과 페이지네이션으로 표시"
      location: "src/components/admin/tabs/audit-tab.tsx"
  affects:
    - phase: 27
      reason: "RBAC 검증에서 DIRECTOR 역할의 /admin 접근 권한 테스트 필요"

# Decisions Made

decisions:
  - title: "탭 기반 Admin 통합"
    context: "기존 /admin/llm-settings, /admin/llm-usage 페이지가 분리되어 있어서 관리가 불편함"
    decision: "단일 /admin 페이지에서 6개 탭(LLM 설정, 토큰 사용량, 시스템 상태, 시스템 로그, 데이터베이스, 감사 로그)을 제공하는 통합 UI로 변경"
    rationale: "운영자가 하나의 페이지에서 모든 관리 기능에 접근할 수 있어 사용성 향상"
    alternatives:
      - option: "별도 페이지 유지"
        tradeoff: "기존 구조 유지 but 관리 기능이 분산되어 접근 불편"
  - title: "AdminTabsWrapper Client Component 분리"
    context: "기존 Tabs 컴포넌트는 value와 onValueChange prop이 필요하여 Server Component에서 사용 불가"
    decision: "AdminTabsWrapper Client Component를 생성하여 탭 상태를 관리"
    rationale: "Server Component의 SSR 이점을 유지하면서 탭 상태 관리 가능"
  - title: "Health API 통합"
    context: "시스템 상태 탭에서 DB, Storage, Backup 상태를 표시해야 함"
    decision: "기존 /api/health 엔드포인트를 호출하여 상태 데이터 가져오기"
    rationale: "Health 체크 로직 재사용으로 중복 방지"

# Task Commits

task_commits:
  - task: "Admin 기본 컴포넌트 및 Server Actions 생성"
    commit: a0e3695
    files:
      - src/components/admin/status-card.tsx
      - src/components/admin/metric-card.tsx
      - src/lib/actions/system.ts
      - src/lib/actions/backup.ts
      - src/lib/actions/audit.ts
  - task: "Admin 탭 컴포넌트 생성"
    commit: bbabbbf
    files:
      - src/components/admin/admin-tabs-wrapper.tsx
      - src/components/admin/tabs/status-tab.tsx
      - src/components/admin/tabs/logs-tab.tsx
      - src/components/admin/tabs/database-tab.tsx
      - src/components/admin/tabs/audit-tab.tsx
  - task: "통합 Admin 페이지 생성"
    commit: e87929f
    files:
      - src/app/(dashboard)/admin/page.tsx

# Deviations from Plan

deviations: []

# Verification Results

verification:
  - "/admin 페이지 접근 시 6개의 탭이 표시됨"
  - "각 탭 클릭 시 해당 내용이 올바르게 표시됨"
  - "시스템 상태 탭에서 DB, Storage, Backup 상태가 표시됨"
  - "시스템 로그 탭에서 필터링이 동작함"
  - "데이터베이스 탭에서 백업 목록이 표시됨"
  - "감사 로그 탭에서 필터링이 동작함"
  - "DIRECTOR가 아닌 사용자 접근 시 리다이렉트됨"
  - "MetricCard 컴포넌트에 icon prop이 추가됨"

# Next Phase Readiness

next_phase_readiness:
  ready_for:
    - phase: 25
      status: "ready"
      notes: "Student, Analysis & Report UI Enhancement 진행 가능"
    - phase: 26
      status: "ready"
      notes: "Counseling & Matching UI Enhancement 진행 가능"
    - phase: 27
      status: "ready"
      notes: "RBAC 검증 시 /admin 페이지 접근 권한 테스트 필요"
  blockers: []
  concerns: []

# Metrics

metrics:
  duration: "6 minutes"
  files_created: 11
  files_modified: 0
  lines_added: ~1140
  commits: 3

# Self-Check

self_check: "PASSED"

## 파일 존재 확인

- src/app/(dashboard)/admin/page.tsx: FOUND
- src/components/admin/status-card.tsx: FOUND
- src/components/admin/metric-card.tsx: FOUND
- src/components/admin/tabs/status-tab.tsx: FOUND
- src/components/admin/tabs/logs-tab.tsx: FOUND
- src/components/admin/tabs/database-tab.tsx: FOUND
- src/components/admin/tabs/audit-tab.tsx: FOUND
- src/components/admin/admin-tabs-wrapper.tsx: FOUND
- src/lib/actions/system.ts: FOUND
- src/lib/actions/backup.ts: FOUND
- src/lib/actions/audit.ts: FOUND

## 커밋 확인

- a0e3695: FOUND
- bbabbbf: FOUND
- e87929f: FOUND

## 파일 존재 확인

- src/app/(dashboard)/admin/page.tsx: FOUND
- src/components/admin/status-card.tsx: FOUND
- src/components/admin/metric-card.tsx: FOUND
- src/components/admin/tabs/status-tab.tsx: FOUND
- src/components/admin/tabs/logs-tab.tsx: FOUND
- src/components/admin/tabs/database-tab.tsx: FOUND
- src/components/admin/tabs/audit-tab.tsx: FOUND
- src/components/admin/admin-tabs-wrapper.tsx: FOUND
- src/lib/actions/system.ts: FOUND
- src/lib/actions/backup.ts: FOUND
- src/lib/actions/audit.ts: FOUND

## 커밋 확인

- a0e3695: FOUND
- bbabbbf: FOUND
- e87929f: FOUND
