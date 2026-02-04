# Project Research Summary

**Project:** AI AfterSchool v2.1 - 학부모 상담 관리 시스템
**Domain:** 학원 관리 시스템 (CRM) - 상담 예약/기록 확장
**Researched:** 2026-02-04
**Confidence:** HIGH

## Executive Summary

AI AfterSchool v2.1 학부모 상담 관리 시스템은 **기존 구현의 90% 이상을 재사용**하여 빠르게 구축할 수 있습니다. Phase 14에서 이미 `CounselingSession` 모델과 상담 기록/조회/통계 기능이 완성되어 있어, 핵심 작업은 **학부모 상담 예약 기능 추가**와 **기존 UI/UX 개선**입니다. 새로 추가할 기술은 **react-day-picker + shadcn/ui Calendar/DatePicker** 컴포넌트뿐이며, 번들 크기 영향은 약 53KB로 미미합니다.

권장 접근 방식은 기존 `CounselingSession` 모델을 수정하지 않고 **별도의 `ParentCounselingReservation` 모델을 추가**하여 예약과 기록의 책임을 명확히 분리하는 것입니다. 이렇게 하면 기존 성과 분석 로직에 영향 없이 예약 상태 관리(SCHEDULED -> COMPLETED/CANCELLED)를 깔끔하게 구현할 수 있습니다. 운영 방식이 "선생님 중심, 내부 기록 전용"으로 명확하므로 학부모 직접 접속, 외부 알림, 화상 상담 등 복잡한 기능은 제외합니다.

핵심 위험은 **RBAC 적용 누락**(다른 팀 학생 정보 노출)과 **예약 시간 중복 검증 누락**(더블 부킹)입니다. 두 위험 모두 기존 `performance.ts`의 패턴을 그대로 복사하고, 서버 측 중복 체크 로직을 반드시 포함하면 방지할 수 있습니다. 전체 개발 기간은 **7-9일**로 예상됩니다.

## Key Findings

### Recommended Stack

기존 스택만으로 대부분 구현 가능하며, 유일한 추가 사항은 날짜 선택 UX 개선용 컴포넌트입니다.

**Core technologies:**
- **react-day-picker v9.13.0:** shadcn/ui Calendar 기반 라이브러리 — 한국어 로케일 지원, date-fns v4 호환, 45KB gzipped
- **@radix-ui/react-popover v1.1.6:** DatePicker 드롭다운 컨테이너 — 기존 @radix-ui 컴포넌트와 일관성
- **기존 스택 활용:** React Hook Form + Zod (폼 검증), Recharts (통계 차트), TanStack Table (목록 정렬/필터)

**설치 방법:**
```bash
npx shadcn@latest add calendar popover
```

**Not Recommended:** FullCalendar (200KB+, 과잉), moment.js (deprecated, date-fns 사용 중), 외부 알림 API (요구사항 제외)

### Expected Features

**Must have (table stakes):**
- **상담 예약 등록:** 미래 날짜/시간 예약, 학부모 이름/관계 기록
- **예약 상태 관리:** SCHEDULED -> COMPLETED/CANCELLED/NO_SHOW 워크플로우
- **학생별 상담 이력:** 학생 상세 페이지에서 전체 상담 내역 조회
- **선생님별/학생별 통계:** 월간 상담 횟수, 유형별 분포

**Should have (differentiators):**
- **후속 조치 대시보드:** 오늘/이번 주 후속 조치 목록, 지연 알림
- **상담 템플릿:** 유형별 템플릿으로 기록 작업 효율화
- **학생 분석 데이터 연동:** 상담 시 성향 분석 자동 표시 (AI AfterSchool 차별화)

**Defer (v2+):**
- AI 상담 요약 제안: LLM 기반 요약문 초안 생성
- 캘린더 뷰 고급 기능: 월간/주간 뷰 전환, 드래그앤드롭

**Anti-features (명시적 제외):**
- 학부모 직접 접속/예약: 선생님 중심 내부 시스템
- 외부 알림 (SMS/카카오톡): 내부 기록 전용
- 외부 캘린더 동기화: 단순성 유지
- 화상 상담 연동: 대면 상담 중심 운영

### Architecture Approach

기존 아키텍처를 최대한 재사용하며, 새 모델 `ParentCounselingReservation`을 추가하여 예약 전용 책임을 부여합니다. 예약 완료 시 기존 `CounselingSession`과 1:1 연결하여 상담 기록으로 전환합니다.

**Major components:**
1. **ParentCounselingReservation 모델:** 예약 상태, 시간대, 학부모 정보 관리 (새로 추가)
2. **parent-counseling.ts actions:** 예약 CRUD, 상태 전환, 완료 처리 (기존 패턴 재사용)
3. **ReservationForm/List/Card 컴포넌트:** 예약 관련 UI (기존 UI 컴포넌트 활용)
4. **기존 컴포넌트 확장:** /counseling 페이지 탭 추가, 학생 상세 페이지 상담 섹션

**Data flow:**
```
예약 등록 -> ParentCounselingReservation (SCHEDULED)
    -> 완료 처리 -> 상태 COMPLETED + CounselingSession 생성
    -> 취소 처리 -> 상태 CANCELLED + 사유 기록
```

### Critical Pitfalls

1. **기존 CounselingSession 모델 오용** — 예약 필드를 기존 모델에 추가하면 성과 분석 로직 오염. 반드시 별도 모델 생성.

2. **새 모델에 RBAC 적용 누락** — 다른 팀 학생 정보 노출 위험. 모든 쿼리에 `getRBACPrisma(session)` 필수 적용.

3. **예약 시간 중복 검증 누락** — 더블 부킹 발생. 서버 측에서 트랜잭션 + 중복 체크 쿼리 필수.

4. **기존 상담 페이지 UI 파괴** — 점진적 통합 필요. 탭 UI로 기존 기능과 새 기능 분리.

5. **날짜/시간 처리 일관성 부족** — 타임존 명시적 처리. date-fns 일관 사용.

## Implications for Roadmap

연구 결과를 바탕으로 7개 페이즈를 제안합니다. 기존 기능과의 호환성을 최우선으로 고려한 순서입니다.

### Phase 1: DB 스키마 확장
**Rationale:** 모든 기능의 기반이 되는 데이터 모델 먼저 정의
**Delivers:** `ParentCounselingReservation` 모델, `ReservationStatus`/`ParentRelation` enum, Prisma 마이그레이션
**Addresses:** 예약 데이터 저장 구조
**Avoids:** Pitfall 1 (기존 모델 오용), Pitfall 4 (개인정보 과다 수집)
**Estimated:** 1일

### Phase 2: Server Actions 구현
**Rationale:** UI 개발 전에 비즈니스 로직 완성 필요
**Delivers:** 예약 CRUD, 상태 전환, 완료 처리 액션, Zod 스키마
**Uses:** 기존 RBAC/DAL 패턴 (performance.ts 참조)
**Implements:** 예약 -> 완료 -> 기록 워크플로우
**Avoids:** Pitfall 2 (RBAC 누락), Pitfall 3 (시간 중복), Pitfall 5 (상태 전환 오류)
**Estimated:** 2일

### Phase 3: 예약 관리 UI
**Rationale:** 핵심 기능인 예약 등록/목록 화면 우선 구현
**Delivers:** ReservationForm, ReservationCard, ReservationList, /counseling/reservations 페이지
**Uses:** shadcn/ui Calendar, react-day-picker
**Addresses:** 상담 예약 등록, 예약 목록 조회
**Estimated:** 2일

### Phase 4: 기존 상담 페이지 통합
**Rationale:** 새 기능을 기존 UI에 안전하게 통합
**Delivers:** /counseling 메인 페이지 탭 UI, 예약 완료 -> 상담 기록 전환 UX
**Avoids:** Pitfall 6 (기존 UI 파괴)
**Estimated:** 1일

### Phase 5: 학생/선생님 페이지 확장
**Rationale:** 상담 이력을 관련 페이지에서 쉽게 조회
**Delivers:** 학생 상세 페이지 상담 섹션, 다가오는 예약 표시, 퀵 액션 버튼
**Addresses:** 학생별 상담 이력 조회
**Estimated:** 1일

### Phase 6: 통계 및 대시보드
**Rationale:** 관리자가 상담 현황을 파악할 수 있는 인사이트 제공
**Delivers:** 상담 통계 카드, /counseling/stats 페이지, 차트 (Recharts 재사용)
**Addresses:** 선생님별/학생별 상담 통계, 후속 조치 대시보드
**Estimated:** 1일

### Phase 7: 테스트 및 마무리
**Rationale:** 안정적인 배포를 위한 통합 테스트
**Delivers:** E2E 테스트 시나리오, RBAC 권한 검증, 엣지 케이스 처리
**Estimated:** 1일

### Phase Ordering Rationale

- **Phase 1 -> 2:** DB 모델이 있어야 Server Actions 구현 가능
- **Phase 2 -> 3:** 비즈니스 로직이 있어야 UI에서 호출 가능
- **Phase 3 -> 4:** 새 기능이 동작해야 기존 페이지와 통합 가능
- **Phase 4 -> 5/6:** 메인 페이지 통합 후 확장 페이지 작업
- **기존 기능 보호:** 각 Phase에서 기존 기능 테스트 포함

### Research Flags

**추가 연구 불필요 (표준 패턴):**
- **Phase 1:** Prisma 마이그레이션 — 기존 스키마 패턴 명확
- **Phase 2:** Server Actions — 기존 performance.ts 패턴 그대로 재사용
- **Phase 3:** 예약 UI — shadcn/ui 공식 문서 충분
- **Phase 4-6:** 기존 컴포넌트/패턴 활용

**주의 필요 (구현 중 검증):**
- **Phase 2:** 시간 중복 검증 쿼리 — 실제 데이터로 테스트 필요
- **Phase 4:** 기존 페이지 통합 — 회귀 테스트 필수

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | npm registry 직접 확인, shadcn/ui 공식 문서 참조, 기존 프로젝트 코드 분석 |
| Features | HIGH | 학원 관리 시스템 다수 조사, 운영 방식 명확, 기존 구현 분석 완료 |
| Architecture | HIGH | 기존 코드베이스 직접 분석, RBAC/DAL 패턴 검증됨 |
| Pitfalls | MEDIUM | 일반 예약 시스템 피트폴 + 기존 코드 통합 경험 기반 |

**Overall confidence:** HIGH

### Gaps to Address

- **스키마 변경 범위:** ParentCounselingReservation 모델 필드 확정은 Phase 1에서 요구사항 상세화 필요
- **캘린더 뷰 범위:** v2.1에서 월간/주간 뷰까지 구현할지는 Phase 3에서 결정
- **AI 요약 기능:** differentiator로 분류했으나 v2.1 스코프에서 제외 가능

## Sources

### Primary (HIGH confidence)
- 프로젝트 소스 코드 직접 분석:
  - `/home/gon/projects/ai/ai-afterschool/prisma/schema.prisma`
  - `/home/gon/projects/ai/ai-afterschool/src/lib/actions/performance.ts`
  - `/home/gon/projects/ai/ai-afterschool/src/components/counseling/`
  - `/home/gon/projects/ai/ai-afterschool/src/lib/db/rbac.ts`
- [shadcn/ui Calendar Documentation](https://ui.shadcn.com/docs/components/calendar)
- [react-day-picker npm](https://www.npmjs.com/package/react-day-picker)
- [React DayPicker v9 Docs](https://daypicker.dev)

### Secondary (MEDIUM confidence)
- 학원 관리 시스템 참조: 학원조아, 공선학관, 위키런, 어나더클래스
- 예약 시스템 참조: PTCfast, ParentSquare, SimplyBook.me
- [RBAC Best Practices (Oso)](https://www.osohq.com/learn/rbac-best-practices)
- [Building a Modern Appointment Booking System (Medium)](https://medium.com/@spearhead0802/building-a-modern-appointment-booking-system-design-architecture-and-lessons-learned-a7849d863d00)

### Tertiary (LOW confidence)
- 피트폴 관련 일반 가이드: Acuity Scheduling, SITE123, Booking WP Plugin

---
*Research completed: 2026-02-04*
*Ready for roadmap: yes*
