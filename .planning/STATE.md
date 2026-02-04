# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-04)

**Core value:** 학생 정보 통합 관리를 기반으로 AI 성향 분석 및 맞춤형 학습/진로 제안 제공
**Current focus:** v2.1 - Parent Counseling Management (Phase 16-22)

## Current Position

Phase: 22 - AI Integration
Plan: 07 of 07
Status: Complete
Last activity: 2026-02-05 — Phase 22 완료 (v2.1 마일스톤 완료!)

Progress: [████████████████████████] 100% (7/7 phases complete)

**v2.1 학부모 상담 관리 시스템** ✅ COMPLETE
- Phase 16: Parent & Reservation Database Schema (✅ complete)
- Phase 17: Reservation Server Actions (✅ complete)
  - Plan 17-01: 예약 생성 Server Actions (✅)
  - Plan 17-02: 예약 목록 조회 및 검색 (✅)
  - Plan 17-03: 예약 수정/삭제 (✅)
  - Plan 17-04: 예약 상태 변경 (✅)
- Phase 18: Reservation Management UI (✅ complete)
  - Plan 18-01: Badge variants 추가 (✅)
  - Plan 18-02: DatePicker 컴포넌트 생성 (✅)
  - Plan 18-03: 예약 등록 폼 (✅)
  - Plan 18-04: 예약 카드와 목록 (✅)
  - Plan 18-05: 탭 기반 페이지 통합 (✅)
- Phase 19: Calendar View (✅ complete)
  - Plan 19-01: 캘린더 유틸리티 및 월간 뷰 (✅)
  - Plan 19-02: 주간 캘린더 뷰 (✅)
  - Plan 19-03: 페이지 통합 및 뷰 전환 (✅)
- Phase 20: Student Page Integration (✅ complete)
  - Plan 20-01: shadcn/ui Alert & Dialog 설치 (✅)
  - Plan 20-02: 상담 섹션 컴포넌트 구현 (✅)
  - Plan 20-03: 테스트 및 검증 (✅)
- Phase 21: Statistics & Dashboard (✅ complete)
  - Plan 21-01: 상담 통계 Server Actions (✅)
  - Plan 21-02: 후속 조치 Server Actions (✅)
  - Plan 21-03: 차트 컴포넌트 (✅)
  - Plan 21-04: 후속 조치 목록 (✅)
  - Plan 21-05: 필터 및 테이블 컴포넌트 (✅)
  - Plan 21-06: 페이지 통합 (✅)
  - Plan 21-07: 테스트 및 검증 (✅)
- Phase 22: AI Integration (✅ complete)
  - Plan 22-01: Schema 확장 및 프롬프트 빌더 (✅)
  - Plan 22-02: shadcn/ui 컴포넌트 설치 (✅)
  - Plan 22-03: AI Server Actions (✅)
  - Plan 22-04: AI 지원 패널 컴포넌트 (✅)
  - Plan 22-05: AI 지원 패널 통합 (✅)
  - Plan 22-06: AI 요약 저장 처리 (✅)
  - Plan 22-07: 통합 테스트 및 검증 (✅)

## Performance Metrics

**Velocity:**
- Total plans completed: 128 (v1.0-v2.1)
- Average duration: ~4.1 min
- Total execution time: ~8.7 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1-7 (v1.0) | 36 | 254 min | ~7 min |
| 8-10 (v1.1) | 22 | ~102 min | ~5 min |
| 11 (v2.0) | 7 | 26 min | ~4 min |
| 12 (v2.0) | 8 | 20 min | ~2.5 min |
| 13 (v2.0) | 8 | 13 min | ~1.6 min |
| 14 (v2.0) | 8 | 25 min | ~3.1 min |
| 15 (v2.0) | 8 | 35 min | ~4.4 min |
| 16 (v2.1) | 1 | 2 min | ~2 min |
| 17 (v2.1) | 4 | 8 min | ~2 min |
| 18 (v2.1) | 5 | 14 min | ~3 min |
| 19 (v2.1) | 3 | 22 min | ~7 min |
| 20 (v2.1) | 3 | 7 min | ~2.3 min |
| 21 (v2.1) | 7 | 109 min | ~15.6 min |
| 22 (v2.1) | 7 | 27 min | ~4 min |

**Recent Trend:**
- v2.0 complete: 40 plans in ~119 min (~3 min/plan average)
- v2.1 complete: 30 plans in ~189 min (~6.3 min/plan average)
- Velocity: v1.0 (7 min) → v2.0 (~3 min) → v2.1 (~6 min, includes comprehensive E2E testing)

*Updated after Phase 22 completion (v2.1 milestone complete)*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

**v2.1 결정:**
- [v2.1] 선생님 중심 운영: 학부모 계정 없이 선생님이 모든 상담 관리
- [v2.1] 내부 기록 전용: 외부 알림 없이 시스템에만 기록
- [v2.1] ParentCounselingReservation 별도 모델: 기존 CounselingSession과 분리하여 예약 전용 책임 부여
- [v2.1] react-day-picker + shadcn/ui Calendar: 날짜 선택 UX 개선 (45KB gzipped)
- [16-01] Student FK 간접 격리: Parent/Reservation은 Student를 참조하여 기존 RBAC Extension 재사용
- [16-01] 주 연락처 이중 저장: Student.primaryParentId FK + Parent.isPrimary 플래그로 빠른 조회와 관리 모두 지원
- [16-01] ON DELETE CASCADE: Parent/Reservation FK에 Cascade 적용 (Phase 14 결정사항과 일관성)
- [17-01] 30분 단위 시간 슬롯 검증: Zod 커스텀 규칙으로 분이 0 또는 30인지 확인
- [17-01] 트랜잭션 기반 중복 검증: 같은 선생님의 같은 시간대 예약을 CANCELLED 상태 제외하고 확인
- [17-01] Prisma 타입 사용: ESLint 오류 방지를 위해 any 대신 Prisma.ParentCounselingReservationWhereInput 사용
- [17-03] Hard delete for SCHEDULED reservations: Prisma cascade로 연관 데이터 자동 정리
- [17-03] 상태 기반 수정/삭제 제어: SCHEDULED 상태만 수정/삭제 가능 (COMPLETED/CANCELLED/NO_SHOW 불가)
- [17-03] 부분 수정 지원: 모든 필드 선택적 (scheduledAt, studentId, parentId, topic)
- [17-04] COMPLETED 전환 시 CounselingSession 자동 생성: 트랜잭션으로 원자성 보장
- [17-04] 상태 전환 제어: SCHEDULED 상태에서만 COMPLETED/CANCELLED/NO_SHOW로 전환 가능
- [17-04] CounselingSession 기본값: duration 30분, type ACADEMIC (필요시 변경 가능)
- [18-01] Badge 상태 variants: scheduled(blue), completed(green), cancelled(gray), noShow(orange) + dark mode 지원
- [18-02] react-day-picker v9 DatePicker: 한국어 로케일, Tailwind 스타일링, 단일 날짜 선택 모드
- [18-03] getStudentsAction 추가: StudentWithParents 타입으로 학부모 정보 포함 반환
- [18-03] 예약된 슬롯 필터링: CANCELLED/NO_SHOW 상태 제외하여 실제 예약만 비활성화
- [18-03] 학생/학부모 의존성: selectedStudentId 변경 시 selectedParentId 초기화
- [18-04] AlertDialog 확인 패턴: 모든 상태 변경 전 사용자 확인 다이얼로그 표시
- [18-04] 상태 변경 버튼 색상: 완료(초록), 취소(회색), 노쇼(주황)
- [18-04] 검색 디바운스: 300ms 딜레이로 불필요한 필터링 연산 방지
- [18-05] Server Component + Client Component Tabs 패턴: 페이지는 Server Component로 유지, 탭 상태는 Client Component에서 관리
- [18-05] FormView 상태 기반 전환: URL 변경 없이 useState로 목록/폼 뷰 전환 (SPA 경험)
- [18-05] 외부 dateFilter prop: ReservationList가 부모로부터 날짜 필터를 받아서 캘린더 클릭 기반 필터링 구현
- [19-01] Custom DayButton with useDayPicker: 접근성 유지를 위해 useDayPicker hook의 components.DayButton 래핑
- [19-01] Modifier와 Custom Component 분리: modifiers는 배경색, Custom DayButton은 dot indicators만 담당
- [19-01] 날짜 높이 h-14: dot indicators 공간 확보를 위해 DayButton 높이 증가
- [19-02] 주간 캘린더 직접 구현: react-day-picker 대신 8열 그리드(시간 + 요일)로 시간 슬롯 표시
- [19-02] isSameDay 패턴: 타임존 오프셋 문제 방지를 위해 isSameDay + 시간/분 비교 사용
- [19-03] 캘린더 탭 자동 전환: 날짜 선택 시 예약 관리 탭으로 자동 이동하여 필터링된 목록 표시
- [19-03] TabType 타입 안전성: history | reservations | calendar 유니온 타입으로 탭 네비게이션 타입 안전성 확보
- [20-01] shadcn/ui Alert 컴포넌트: Alert, AlertTitle, AlertDescription를 다음 예약 표시용으로 설치
- [20-01] shadcn/ui Dialog 컴포넌트: Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle를 상세 모달용으로 설치
- [20-02] CounselingSection Server Component: 상담 섹션 래퍼로 다음 예약 Alert과 이력 목록 컴포지션
- [20-02] CounselingSessionModal Client Component: 상세 모달로 모든 세션 정보 표시 (유형, 시간, 교사, 내용, 후속 조치, 만족도)
- [20-02] onClick prop 패턴: CounselingSessionCard에 선택적 onClick prop 추가로 재사용성 확보
- [20-02] Selective include 쿼리: upcomingReservation 쿼리에서 select로 필요한 필드만 전송하여 데이터 전송 최소화
- [20-02] TypeScript null safety: satisfactionScore에 nullish coalescing (??) 연산자 사용으로 null 참조 오류 방지
- [20-03] Manual browser verification: UI/UX 검증을 위해 브라우저에서 직접 테스트 후 체크포인트 통과
- [20-03] Screenshot documentation: 스크린샷을 planning docs에 저장하여 향후 회귀 테스트 기준 확보
- [21-01] Prisma groupBy 대신 findMany + Map 집계: groupBy는 include를 지원하지 않아 teacher.name 등 관련 데이터를 가져올 수 없음, 유연한 데이터 변환 가능
- [21-01] 빈 월 데이터 초기화: getMonthlyTrendAction에서 요청한 months만큼 빈 월 구조를 미리 생성하여 차트 연속성 확보
- [21-01] Server-side percentage 계산: getCounselingTypeDistributionAction에서 비율을 서버에서 계산하여 일관된 반올림 규칙 적용
- [21-01] Prisma.CounselingSessionWhereInput 타입: ESLint no-explicit-any 규칙 준수, 타입 안전성 확보
- [21-05] DateRangeFilter 두 가지 variant: 버튼 그룹과 드롭다운 모두 지원하여 UI 유연성 확보 (variant prop)
- [21-05] 선생님별 총 상담 횟수 집계: TeacherMonthlyStats를 선생님 ID로 그룹핑하여 전체 기간 합계 계산 (클라이언트 집계)
- [21-05] CsvExportButton 제네릭 타입: `<T = Record<string, unknown>>`로 any 대신 타입 안전성 확보
- [21-05] Blob API + BOM: react-csv 없이 CSV 생성, `\uFEFF` BOM으로 한글 깨짐 방지
- [21-04] 지연 표시 스타일: overdue 상태 시 bg-red-50 border-red-200 + AlertCircle 아이콘으로 긴급성 시각화
- [21-04] 완료 처리 흐름: Checkbox → AlertDialog 확인 → onComplete 콜백으로 실수 방지
- [21-04] 정렬 우선순위: status === 'overdue' 우선, 그 다음 followUpDate ASC로 긴급한 항목 최상단 노출
- [21-04] shadcn/ui Checkbox 설치: 완료 체크 UI 구현에 필요한 컴포넌트 추가
- [21-06] 간단한 wrapper 레이아웃: (dashboard) 레이아웃을 상속하므로 추가 레이아웃 불필요
- [21-06] Server Component로 초기 데이터 fetch: SSR로 빠른 초기 렌더링, SEO 최적화
- [21-06] getDateRangeFromPreset 유틸리티 분리: "use server" 파일에서 동기 함수 export 불가, 별도 파일로 분리
- [21-07] ESLint 외부 스크립트 제외: .agent, scripts, prisma.config.ts를 globalIgnores에 추가하여 빌드 안정성 확보
- [21-07] Playwright 자동 검증: E2E 테스트로 8개 주요 기능 체계적 검증
- [22-01] 기존 PersonalitySummary 관계 활용: Student.personalitySummary String 필드 대신 기존 관계의 coreTraits 필드 사용 (명명 충돌 방지)
- [22-01] 상담 요약 출력 형식 Markdown: 핵심 내용, 합의 사항, 관찰 사항, 후속 조치 섹션으로 구조화
- [22-01] 성향 요약 출력 형식 단순 텍스트: 1-2문장으로 직접 사용 가능
- [22-01] 이전 상담 이력 5개 제한: 프롬프트 토큰 효율성
- [22-02] radix-ui 통합 패키지 활용: Sheet/Collapsible 설치 시 추가 의존성 불필요
- [22-04] muted/50 배경색으로 성향 요약 카드 시각적 구분
- [22-04] 궁합 점수 해석 임계값: 80+ 매우 좋음, 70+ 좋음, 60+ 보통, 60 미만 노력 필요
- [22-04] 60 미만 점수시 상담 팁 Alert 자동 표시
- [22-04] Collapsible 세부 항목 펼치기 패턴: ChevronDown 회전 애니메이션

**v2.0 결정 (영향 있음):**
- [11-02] Prisma Client Extensions over deprecated Middleware - $allOperations pattern for automatic teamId filtering
- [11-02] PostgreSQL RLS with quoted identifiers for case sensitivity - "teamId" vs teamid to prevent folding
- [11-02] Defense in Depth: App-layer (Prisma Extensions) + DB-layer (RLS) for tenant isolation
- [11-03] verifySession as RLS entry point - All DB queries must go through verifySession which calls setRLSSessionContext
- [14-01] ON DELETE CASCADE for counseling/satisfaction models - Automatic cleanup when student/teacher deleted
- [15-01] Vercel AI SDK unified interface: ai, @ai-sdk/anthropic, @ai-sdk/openai, @ai-sdk/google, ollama-ai-provider-v2 for multi-provider support
- [15-04] 기존 Claude 직접 호출을 모두 통합 라우터로 마이그레이션

### Pending Todos

None yet.

### Blockers/Concerns

**From v2.1 Research:**
- Shadow database sync issue: 반복 발생 중 (7회). `npx prisma db push` 워크어라운드 계속 사용.
- Schema constraint issue: Current schema has teacherId as non-nullable String, which conflicts with "unassigned student" concept.

**From Phase 12-05 execution:**
- Teacher profile edit form needed: Existing teachers have null `birthDate`, `birthTimeHour`, `birthTimeMinute`, `nameHanja` fields.

**From v2.1 Research - Key Pitfalls to Avoid:**
1. 기존 CounselingSession 모델 오용 - 예약 필드를 기존 모델에 추가하면 성과 분석 로직 오염
2. 새 모델에 RBAC 적용 누락 - 다른 팀 학생 정보 노출 위험
3. 예약 시간 중복 검증 누락 - 더블 부킹 발생
4. 기존 상담 페이지 UI 파괴 - 점진적 통합 필요
5. 날짜/시간 처리 일관성 부족 - 타임존 명시적 처리

## Session Continuity

Last session: 2026-02-05 02:15 KST
Stopped at: v2.1 마일스톤 완료! Phase 22 (AI Integration) 검증 통과
Resume file: None

---
*Last updated: 2026-02-05 (v2.1 마일스톤 완료)*
