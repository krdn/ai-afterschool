# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-06)

**Core value:** 학생 정보 통합 관리를 기반으로 AI 성향 분석 및 맞춤형 학습/진로 제안 제공
**Current focus:** v2.1.1 - E2E Test Compliance (Phase 23-28)

## Current Position

Phase: 26 - Counseling & Matching UI Enhancement
Plan: 03 of 4
Status: In progress
Last activity: 2026-02-07 — Plan 26-03 매칭 이력/감사 로그 UI 완료

Progress: [████████░░░░░░░░░░░░] 75%

**v2.1.1 E2E Test Compliance** ○ ACTIVE
- Phase 23: data-testid Infrastructure (✓ complete)
- Phase 24: Missing Routes Creation (✓ complete)
- Phase 25: Student, Analysis & Report UI Enhancement (✓ complete)
- Phase 26: Counseling & Matching UI Enhancement (○ in progress - 26-03 complete)
- Phase 27: RBAC, Auth & Error Handling (○ pending)
- Phase 28: Integration Verification & Test Alignment (○ pending)

## Performance Metrics

**Velocity:**
- Total plans completed: 147 (v1.0-v2.1)
- Average duration: ~4.1 min
- Total execution time: ~10.1 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1-7 (v1.0) | 36 | 254 min | ~7 min |
| 8-10 (v1.1) | 22 | ~102 min | ~5 min |
| 11 (v2.0) | 7 | 26 min | ~4 min |
| 12 (v2.0) | 8 | 20 min | ~2.5 min |
| 13 (v2.0) | 8 | 13 min | ~1.6 min |
| 14 (v2.0) | 9 | 25 min | ~2.8 min |
| 15 (v2.0) | 8 | 35 min | ~4.4 min |
| 16 (v2.1) | 1 | 2 min | ~2 min |
| 17 (v2.1) | 4 | 8 min | ~2 min |
| 18 (v2.1) | 5 | 14 min | ~3 min |
| 19 (v2.1) | 3 | 22 min | ~7 min |
| 20 (v2.1) | 3 | 7 min | ~2.3 min |
| 21 (v2.1) | 7 | 109 min | ~15.6 min |
| 22 (v2.1) | 7 | 27 min | ~4 min |
| 23 (v2.1.1) | 1 | 5 min | ~5 min |
| 24 (v2.1.1) | 4 | ~9 min | ~2.3 min |
| 25 (v2.1.1) | 4 | ~25 min | ~6.3 min |
| 26 (v2.1.1) | 4 | ~29 min | ~7.3 min |

**Recent Trend:**
- v2.0 complete: 40 plans in ~119 min (~3 min/plan average)
- v2.1 complete: 30 plans in ~189 min (~6.3 min/plan average)
- v2.1.1 active: 18 plans in ~75 min (~4.2 min/plan average)
- Velocity: v1.0 (7 min) → v2.0 (~3 min) → v2.1 (~6 min) → v2.1.1 (~4.2 min)

*Updated after Phase 26-04 completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

**v2.1.1 결정:**
- [v2.1.1] E2E 테스트 호환성 우선: 새 기능 추가 없이 기존 구현의 테스트 안정성 확보
- [v2.1.1] data-testid 일괄 적용: 모든 주요 컴포넌트에 테스트 가능한 셀렉터 추가
- [v2.1.1] data-testid 네이밍 컨벤션: kebab-case 사용 (예: student-name, analysis-loading)
- [v2.1.1] data-testid 네이밍 패턴: [component]-[element] 형식 (예: calendar-view, counseling-detail-modal)
- [v2.1.1] 조건부 data-testid 사용: 동적 컨텐츠(MBTI/학습 스타일)에 조건부 testid 적용
- [v2.1.1] 누락 라우트 생성: 테스트에서 참조하는 모든 페이지 구현
- [23-01] 최소 변경 원칙: 기존 UI/스타일 변경 없이 data-testid 속성만 추가
- [25-01] 이미지 alt 속성 패턴: '{사용자명}의 {이미지종류} 사진' 형식으로 접근성 향상
- [25-01] 빈 상태 testid 패턴: data-testid='empty-{context}-result'로 E2E 테스트 지원
- [25-01] Client-side 리다이렉트: Client Component에서 useRouter + toast로 사용자 피드백 제공
- [25-02] 상태 기반 서브탭: URL 해시 없이 useState로 관리하여 URL 복잡도 최소화
- [25-02] 통일된 에러 메시지: '{분석 유형} 분석에 실패했습니다. (원인: {error}) 다시 시도해주세요.'
- [25-02] 재시도 버튼 스타일: Button 컴포넌트 + variant='outline' + RefreshCw/Loader2 아이콘
- [25-02] 서버 액션 데이터 페칭: 클라이언트 컴포넌트에서 useEffect로 서버 액션 호출하여 데이터 조회
- [25-04] Toast ID 패턴: toast.success/error에 id 옵션 추가로 E2E 테스트에서 노출 검증 가능
- [25-03] 현재 스키마 제약사항으로 최신 분석 1개만 표시: 각 분석 모델이 @unique 제약조건으로 인해 학생당 1개 레코드만 존재. 진정한 이력 기능은 별도 이력 테이블이 필요 (향후 개선)
- [25-03] History Dialog 패턴: 목록 → 상세 보기 2단계 모달 구조로 이력 조회
- [25-03] Async Dialog Loading: 모달 열릴 때 데이터 lazy loading
- [23-01] ProviderSelect 컴포넌트 UI only: 기본 제공자 선택 드롭다운 UI만 구현, 실제 동작은 추후 Phase에서 구현
- [23-01] DateRangeSelector UI only: 날짜 범위 선택기 UI만 구현, 실제 필터링은 추후 Phase에서 구현
- [24-01] 감사 로그와 시스템 로그 분리: 사용자별 추적(teacherId, IP, User-Agent)이 필요한 감사 로그와 애플리케이션 전체 이벤트 기록이 목적인 시스템 로그를 별도 모델로 분리
- [24-01] @@map을 사용한 snake_case 테이블명: 데이터베이스 관리 일관성을 위해 audit_logs, system_logs로 지정
- [24-01] Server-side redirect 패턴: Server Component에서 Next.js redirect 함수 사용하여 SEO 친화적이고 클라이언트 사이드 리다이렉트보다 빠름
- [24-03] 탭 기반 Admin 통합: 단일 /admin 페이지에서 6개 탭(LLM 설정, 토큰 사용량, 시스템 상태, 시스템 로그, 데이터베이스, 감사 로그)을 제공하는 통합 UI로 변경
- [24-03] AdminTabsWrapper Client Component 분리: 기존 Tabs 컴포넌트는 value와 onValueChange prop이 필요하여 Server Component에서 사용 불가, AdminTabsWrapper Client Component를 생성하여 탭 상태를 관리
- [24-03] Health API 통합: 시스템 상태 탭에서 DB, Storage, Backup 상태를 표시하기 위해 기존 /api/health 엔드포인트를 호출하여 상태 데이터 가져오기

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
- [26-02] Dashboard page creation: /dashboard 라우트가 존재하지 않아 새로 생성하여 위젯 배치
- [26-02] Alert + Collapsible 위젯 패턴: shadcn/ui Alert와 Radix UI Collapsible 조합으로 요약 + 펼침 목록 UI
- [26-02] date-fns 한국어 로케일: ko locale로 M월 d일 E요일 HH:mm 형식의 한국어 날짜 표시
- [26-02] Conditional widget rendering: 예약이 있는 경우에만 위젯 표시하여 불필요한 UI 제거
- [26-02] Server-side 7일 범위 필터링: startOfDay(now) ~ endOfDay(addDays(7))으로 정확한 날짜 범위 계산
- [26-01] 통합 검색 파라미터: query로 학생 이름, 상담 요약을 Prisma OR 쿼리로 검색
- [26-01] 명시적 검색 패턴: Enter 키 또는 검색 버튼 클릭 시에만 검색 실행 (즉시 검색 아님)
- [26-01] URL 상태 관리: URLSearchParams로 필터 상태 유지하여 북마크/공유 가능
- [26-01] 기존 studentName 파라미터와 호환성 유지
- [26-04] 60점 기준 성공/실패 분류: 배정 궁합 점수 60점 이상/미만으로 성공/실패 카운트
- [26-04] ExtendedDatePreset 타입 호환성: 기존 DatePreset(1M, 3M, 6M, 1Y) 유지하며 TODAY, 7D, 30D, ALL 추가
- [26-04] DateRangeFilter 커스텀 프리셋: presets, labels props로 각 사용처마다 다른 프리셋 조합 지원
- [26-04] PerformanceTrendChart 데이터 위임: onDataRequest prop으로 데이터 페칭 로직을 부모에 위임
- [26-03] change-formatter.ts 유틸리티 분리: 변경 내용 포맷팅 로직을 별도 파일로 분리하여 재사용성 확보 (formatChangesForDiff, formatChangesSummary)
- [26-03] Server/Client Component 분리: 페이지는 Server Component로 데이터 페칭, 탭 상태는 Client Component에서 관리
- [26-03] AuditLog entityType='Student' 필터링: 학생 배정 변경만 추적하도록 Prisma 쿼리에 entityType 조건 추가
- [26-03] 날짜 범위 필터 종료일 처리: endDate에 23:59:59 설정하여 하루 끝까지 포함

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

Last session: 2026-02-07 08:45 KST
Stopped at: Phase 26-03 Complete (매칭 이력/감사 로그 UI)
Resume file: None
Next action: Continue Phase 26-04 or execute next plan

---
*Last updated: 2026-02-07 (Phase 26-03 완료)*
