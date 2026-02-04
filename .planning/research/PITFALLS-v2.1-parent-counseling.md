# Pitfalls Research: 학부모 상담 관리 시스템

**Domain:** 학부모 상담 예약/기록 기능 추가 (기존 학원 관리 시스템 확장)
**Researched:** 2026-02-04
**Confidence:** MEDIUM

## Executive Summary

이 연구는 AI AfterSchool v2.1에서 **학부모 상담 예약/기록 기능**을 기존 시스템에 추가할 때 발생할 수 있는 주요 실수를 식별합니다. 기존 `CounselingSession` 모델이 이미 성과 분석용으로 구현되어 있어, **새 모델 추가 시 기존 시스템과의 통합**에서 피트폴이 발생할 가능성이 높습니다.

**핵심 위험:**
1. **모델 혼동** - 기존 CounselingSession과 새 ParentCounselingReservation의 책임 분리 실패
2. **RBAC 적용 누락** - 새 모델에 기존 RBAC 패턴 적용하지 않아 데이터 누설
3. **예약 상태 관리 실패** - 동시 예약, 중복 시간대, 상태 전환 오류
4. **기존 UI 파괴** - 새 기능 추가하다가 기존 상담 기록 기능이 깨짐

---

## Critical Pitfalls

시스템을 깨뜨리거나 데이터 누설을 야기하는 치명적인 실수들입니다.

### Pitfall 1: 기존 CounselingSession 모델 오용

**Description:**
기존 `CounselingSession` 모델에 예약 관련 필드(status, parentPhone, startTime/endTime)를 직접 추가하면, 성과 분석 로직이 깨지고 기존 데이터와의 호환성 문제가 발생합니다.

**Why it happens:**
- 기존 모델 확장이 새 모델 생성보다 빠르게 보임
- 예약과 기록의 라이프사이클 차이를 간과함
- 기존 `CounselingSession`이 성과 분석용으로 사용 중임을 모름

**Warning Signs:**
- 기존 `/analytics` 페이지에서 상담 통계가 이상하게 나옴
- `satisfactionScore`가 null인 레코드가 예상보다 많음 (예약 상태 레코드)
- Prisma 쿼리에서 `status` 필드 체크가 누락된 곳이 있음
- 기존 상담 기록 폼에서 새 필드 관련 에러 발생

**Prevention:**
1. **별도 모델 생성**: `ParentCounselingReservation`을 독립 모델로 생성
2. **관계 연결**: 예약 완료 시 `CounselingSession`과 1:1 연결 (`counselingSessionId` FK)
3. **명확한 책임 분리**:
   - `ParentCounselingReservation`: 예약 상태, 시간대, 학부모 정보
   - `CounselingSession`: 상담 내용, 요약, 만족도 (기존 그대로)
4. **마이그레이션 분리**: 새 모델 추가 마이그레이션은 기존 테이블 변경 없이 진행

**Phase to Address:** Phase 1 (DB 스키마 확장)

---

### Pitfall 2: 새 모델에 RBAC 적용 누락

**Description:**
새로운 `ParentCounselingReservation` 모델에 기존 RBAC 패턴을 적용하지 않아, 다른 팀의 선생님이 다른 팀 학생의 상담 예약을 조회/수정할 수 있게 됩니다.

**Why it happens:**
- 새 모델 생성 시 RBAC 적용을 "나중에" 하려고 함
- 기존 RBAC 패턴이 자동으로 적용될 것으로 착각
- Prisma 쿼리에서 `getRBACPrisma(session)` 대신 `db` 직접 사용
- 테스트에서 다른 팀 사용자로 접근 시도하지 않음

**Warning Signs:**
- API 응답에 다른 팀 학생의 예약이 포함됨
- "왜 다른 반 학생 상담 예약이 보여?"라는 사용자 피드백
- Server Action에서 `verifySession()`은 있으나 RBAC 필터링 없음
- 새 모델 쿼리에 `teamId` 조건이 없음

**Prevention:**
1. **기존 패턴 복사**: `performance.ts`의 RBAC 패턴을 새 액션에 그대로 적용
   ```typescript
   const session = await verifySession()
   const rbacDb = getRBACPrisma(session)

   // TEACHER는 자신의 학생만 접근 가능
   if (session.role === "TEACHER") {
     const student = await rbacDb.student.findFirst({
       where: { id: studentId }
     })
     if (!student) {
       return { error: "해당 학생에 대한 권한이 없습니다." }
     }
   }
   ```
2. **Student 관계 활용**: 예약 조회 시 학생 관계를 통해 팀 필터링 자동 적용
3. **통합 테스트 작성**: 다른 팀 사용자로 예약 조회/수정 시도 테스트
4. **코드 리뷰 체크리스트**: 모든 새 쿼리에 RBAC 적용 여부 확인

**Phase to Address:** Phase 2 (Server Actions 구현)

---

### Pitfall 3: 예약 시간 중복 검증 누락

**Description:**
동일 선생님의 동일 시간대에 여러 예약을 허용하여 더블 부킹이 발생합니다. 이는 학부모 신뢰 저하와 상담 일정 혼란을 야기합니다.

**Why it happens:**
- 예약 생성 시 기존 예약과의 시간 겹침 검증 누락
- 동시에 두 요청이 들어올 때 race condition 미처리
- 시간대 비교 로직의 오류 (문자열 vs DateTime 혼동)
- "사용자가 실수하지 않을 것"이라는 가정

**Warning Signs:**
- 같은 시간대에 두 개 이상의 예약이 존재함
- 선생님 캘린더에 겹치는 일정 표시
- "이미 예약된 시간입니다" 에러 없이 예약 성공
- 사용자가 "이 시간에 다른 상담이 있는데요?"라고 문의

**Prevention:**
1. **예약 생성 전 중복 체크**:
   ```typescript
   const existingReservation = await db.parentCounselingReservation.findFirst({
     where: {
       teacherId,
       reservationDate: targetDate,
       status: { in: ['SCHEDULED'] }, // 취소된 건 제외
       OR: [
         { startTime: { lte: endTime }, endTime: { gte: startTime } }
       ]
     }
   })
   if (existingReservation) {
     return { error: "해당 시간대에 이미 예약이 있습니다." }
   }
   ```
2. **데이터베이스 레벨 제약**: unique constraint 또는 exclusion constraint 고려
3. **트랜잭션 사용**: `prisma.$transaction()`으로 읽기-쓰기 원자성 보장
4. **UI에서 가용 시간대만 표시**: 예약 폼에서 이미 예약된 시간대 비활성화

**Phase to Address:** Phase 2 (Server Actions 구현)

---

### Pitfall 4: 학부모 개인정보 과다 수집/노출

**Description:**
학부모 연락처, 이름 등 개인정보를 필요 이상으로 수집하거나, 권한 없는 사용자에게 노출됩니다. 이는 개인정보보호법 위반 가능성이 있습니다.

**Why it happens:**
- "나중에 필요할 수 있으니" 불필요한 필드 수집
- API 응답에서 학부모 연락처를 필터링 없이 반환
- 학생 상세 페이지에서 모든 사용자에게 학부모 정보 노출
- 로그에 학부모 개인정보가 평문으로 기록됨

**Warning Signs:**
- API 응답에 `parentPhone`이 그대로 노출
- 다른 선생님도 학부모 연락처 조회 가능
- 서버 로그에 전화번호가 기록됨
- "학부모 정보가 어디에 저장되나요?"라는 질문에 답변 불가

**Prevention:**
1. **최소 수집 원칙**: 꼭 필요한 정보만 수집
   - 필수: 학부모 이름 (예약 식별용)
   - 선택: 학부모 관계 (아버지/어머니/기타)
   - 제외: 전화번호 (학생 정보에 이미 있음, 별도 저장 불필요)
2. **응답 필터링**: API 응답에서 민감 정보 제외
   ```typescript
   select: {
     parentName: true,
     parentRelation: true,
     // parentPhone: false (제외)
   }
   ```
3. **역할 기반 노출**: 담당 선생님/팀장만 학부모 정보 조회 가능
4. **로깅 주의**: 개인정보가 로그에 기록되지 않도록 마스킹

**Phase to Address:** Phase 1 (DB 스키마 설계), Phase 2 (Server Actions)

---

## Moderate Pitfalls

UX를 저해하거나 기술 부채를 야기하는 중간 수준의 실수들입니다.

### Pitfall 5: 예약 상태 전환 로직 오류

**Description:**
예약 상태(SCHEDULED -> COMPLETED/CANCELLED/NO_SHOW) 전환 시 잘못된 상태에서 전환을 허용하거나, 완료 처리 시 CounselingSession 생성을 누락합니다.

**Warning Signs:**
- CANCELLED 상태인 예약이 COMPLETED로 변경됨
- 완료된 예약에 대응하는 CounselingSession이 없음
- 상태 변경 후 revalidatePath가 호출되지 않아 UI 갱신 안 됨
- 같은 예약에 대해 여러 개의 CounselingSession이 생성됨

**Prevention:**
1. **상태 머신 정의**:
   ```typescript
   const validTransitions = {
     SCHEDULED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
     COMPLETED: [], // 완료 후 변경 불가
     CANCELLED: [], // 취소 후 변경 불가
     NO_SHOW: ['SCHEDULED'], // 노쇼 후 재예약 가능
   }
   ```
2. **완료 시 원자적 처리**: 예약 완료와 CounselingSession 생성을 트랜잭션으로 묶기
3. **idempotency 보장**: 같은 완료 요청이 여러 번 와도 한 번만 처리

**Phase to Address:** Phase 2 (Server Actions 구현)

---

### Pitfall 6: 기존 상담 페이지 UI 파괴

**Description:**
새 예약 기능을 추가하면서 기존 `/counseling` 페이지의 상담 기록 목록, 필터링, 통계 기능이 깨집니다.

**Warning Signs:**
- 기존 상담 기록이 더 이상 표시되지 않음
- 필터 적용 시 에러 발생
- 통계 카드의 숫자가 이상함
- "어제까지는 잘 됐는데..."라는 사용자 피드백

**Prevention:**
1. **점진적 통합**: 기존 페이지를 수정하기 전에 새 경로(`/counseling/reservations`)에서 개발
2. **탭 UI로 분리**: 기존 기록 목록과 새 예약 목록을 탭으로 분리
   ```tsx
   <Tabs defaultValue="records">
     <TabsList>
       <TabsTrigger value="records">상담 기록</TabsTrigger>
       <TabsTrigger value="reservations">예약 관리</TabsTrigger>
     </TabsList>
     <TabsContent value="records">
       {/* 기존 코드 유지 */}
     </TabsContent>
     <TabsContent value="reservations">
       {/* 새 예약 목록 */}
     </TabsContent>
   </Tabs>
   ```
3. **기존 테스트 유지**: 새 기능 추가 전 기존 기능의 스냅샷/E2E 테스트
4. **Feature flag 고려**: 새 기능을 토글로 on/off 가능하게

**Phase to Address:** Phase 4 (기존 상담 페이지 통합)

---

### Pitfall 7: 날짜/시간 처리 일관성 부족

**Description:**
예약 날짜와 시간을 처리할 때 DateTime, 문자열, 타임존 간 변환이 일관되지 않아 예약이 하루 밀리거나 시간이 틀어집니다.

**Warning Signs:**
- 오후 3시 예약이 오전 3시로 표시됨
- 오늘 날짜 예약이 "내일 예약"으로 분류됨
- 한국 시간 기준 날짜가 UTC로 저장되어 하루 밀림
- "분명 10시에 예약했는데 1시로 나와요"

**Prevention:**
1. **일관된 저장 형식**:
   - `reservationDate`: Date 타입 (자정 기준, UTC)
   - `startTime`/`endTime`: 문자열 ("14:00", "14:30")
2. **타임존 명시적 처리**:
   ```typescript
   // 클라이언트에서 전송 시 KST 명시
   const reservationDate = new Date(
     new Date(dateString).toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
   )
   ```
3. **date-fns 활용**: 기존 프로젝트에서 date-fns 사용 중이므로 일관되게 활용
4. **테스트**: 자정 근처 시간, 한국 공휴일 등 엣지 케이스 테스트

**Phase to Address:** Phase 1 (DB 스키마), Phase 2 (Server Actions)

---

### Pitfall 8: 캐시 무효화 누락

**Description:**
예약 생성/수정/삭제 후 `revalidatePath()`를 호출하지 않아 UI가 갱신되지 않거나, 과도한 캐시 무효화로 성능이 저하됩니다.

**Warning Signs:**
- 예약 생성 후 목록에 바로 표시되지 않음
- 새로고침해야 최신 데이터가 보임
- 예약 하나 변경했는데 전체 사이트가 느려짐
- `revalidatePath('/')` 같은 과도한 무효화

**Prevention:**
1. **기존 패턴 준수**:
   ```typescript
   revalidatePath('/counseling')
   revalidatePath('/counseling/reservations')
   revalidatePath(`/students/${studentId}`)
   // 전체 사이트 무효화 하지 않음
   ```
2. **영향 범위 파악**: 예약 변경이 영향을 미치는 페이지 목록화
3. **revalidateTag 고려**: 더 세밀한 캐시 제어가 필요하면 태그 기반 무효화

**Phase to Address:** Phase 2 (Server Actions 구현)

---

## Minor Pitfalls

빠르게 수정 가능하지만 주의가 필요한 작은 실수들입니다.

### Pitfall 9: 학부모 관계(ParentRelation) enum 확장성 부족

**Description:**
`FATHER`, `MOTHER`, `GUARDIAN`, `OTHER`만 정의하면 향후 "조부모", "삼촌/이모" 등 확장 시 마이그레이션 필요.

**Prevention:**
- `OTHER`를 기본값으로 하고 UI에서 자유 입력 허용
- 또는 enum 대신 문자열 필드로 정의하고 UI에서 선택지 제공

---

### Pitfall 10: 예약 목록 페이지네이션 누락

**Description:**
예약이 많아지면 목록 페이지 로딩이 느려지고, 100개 이상 예약 시 메모리 문제 발생.

**Prevention:**
- 기존 상담 목록처럼 `take: 100` 제한 적용
- 무한 스크롤 또는 페이지네이션 UI 구현
- 상태별 필터로 기본 조회 범위 제한 (예: SCHEDULED만)

---

### Pitfall 11: 예약 폼 필수 필드 누락

**Description:**
예약 폼에서 필수 필드 체크를 누락하면 불완전한 예약이 생성됨.

**Prevention:**
- Zod 스키마로 필수 필드 검증
  ```typescript
  export const reservationSchema = z.object({
    studentId: z.string().min(1, "학생을 선택해주세요"),
    reservationDate: z.string().min(1, "예약일을 입력해주세요"),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "시간 형식이 올바르지 않습니다"),
    counselingType: z.enum(["ACADEMIC", "CAREER", "PSYCHOLOGICAL", "BEHAVIORAL"]),
    parentName: z.string().min(1, "학부모 이름을 입력해주세요"),
  })
  ```

---

## Technical Debt Patterns

지금은 작동하지만 장기적으로 문제가 되는 패턴들입니다.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| 기존 CounselingSession에 예약 필드 추가 | 새 모델 안 만들어도 됨 | 성과 분석 로직 오염, 쿼리 복잡도 증가 | NEVER |
| RBAC 없이 일단 구현 | 개발 빠름 | 데이터 누설 위험, 나중에 전면 수정 | 로컬 개발만 |
| 시간 중복 체크 클라이언트에서만 | 서버 로직 간단 | race condition, 악의적 요청 차단 불가 | NEVER |
| 학부모 전화번호 별도 저장 | 빠른 조회 | 데이터 중복, 동기화 문제, 개인정보 관리 복잡 | 비권장 |
| revalidatePath('/') 사용 | 간단 | 성능 저하, 불필요한 캐시 무효화 | 개발 환경만 |

---

## "Looks Done But Isn't" Checklist

완료된 것처럼 보이지만 실제로는 미완성인 항목들입니다.

- [ ] **새 모델 RBAC**: Server Action에 `getRBACPrisma()` 적용했으나 일부 쿼리 누락
- [ ] **시간 중복 체크**: UI에서 막았으나 서버에서 재검증 없음
- [ ] **상태 전환**: 완료 처리 구현했으나 CounselingSession 연결 누락
- [ ] **캐시 무효화**: 일부 경로만 무효화, 학생 상세 페이지 누락
- [ ] **날짜 처리**: 저장은 되나 타임존 처리 없어 표시가 틀림
- [ ] **기존 페이지 통합**: 탭 추가했으나 기존 필터/통계 동작 안 함

---

## Phase-Specific Warnings

| Phase | Likely Pitfall | Mitigation | Priority |
|-------|---------------|------------|----------|
| Phase 1: DB 스키마 | 기존 모델 오용 (Pitfall 1) | 별도 모델 생성, 관계만 연결 | CRITICAL |
| Phase 1: DB 스키마 | 개인정보 과다 수집 (Pitfall 4) | 최소 필드만 정의 | HIGH |
| Phase 2: Server Actions | RBAC 누락 (Pitfall 2) | 기존 패턴 복사 | CRITICAL |
| Phase 2: Server Actions | 시간 중복 체크 누락 (Pitfall 3) | 트랜잭션 + 중복 쿼리 | CRITICAL |
| Phase 2: Server Actions | 상태 전환 오류 (Pitfall 5) | 상태 머신 정의 | HIGH |
| Phase 2: Server Actions | 날짜 처리 (Pitfall 7) | date-fns 일관 사용 | MEDIUM |
| Phase 4: 페이지 통합 | 기존 UI 파괴 (Pitfall 6) | 점진적 통합, 탭 분리 | HIGH |
| Phase 4: 페이지 통합 | 캐시 무효화 누락 (Pitfall 8) | revalidatePath 체크리스트 | MEDIUM |

---

## Recovery Strategies

피트폴 발생 시 복구 방법입니다.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| 기존 모델 오용 | HIGH (1-2일) | 1) 새 모델 생성 마이그레이션 2) 데이터 이관 스크립트 3) 기존 필드 정리 4) 성과 분석 로직 복원 |
| RBAC 누락으로 데이터 노출 | HIGH (즉시 대응) | 1) 접근 로그 분석 2) 영향 사용자 파악 3) 모든 쿼리에 RBAC 패치 4) 긴급 배포 |
| 더블 부킹 발생 | MEDIUM (2-4시간) | 1) 중복 예약 식별 2) 영향받은 예약 취소/재조정 3) 중복 체크 로직 추가 4) 사용자 알림 |
| 기존 UI 깨짐 | LOW (1-2시간) | 1) 이전 버전으로 롤백 2) 문제 코드 분리 3) 점진적 재통합 |
| 날짜 밀림 | LOW (30분) | 1) 타임존 로직 수정 2) 영향받은 데이터 일괄 수정 |

---

## Integration Gotchas

기존 시스템과 통합 시 주의할 점입니다.

| Integration Point | Common Mistake | Correct Approach |
|-------------------|----------------|------------------|
| **기존 CounselingSession** | 예약 필드 직접 추가 | 별도 모델 + FK 연결 |
| **기존 performance.ts** | 새 액션 별도 파일로 분리 안 함 | 분리하되 패턴은 동일하게 |
| **기존 RBAC 패턴** | 새 모델에 적용 누락 | 모든 쿼리에 getRBACPrisma() |
| **기존 상담 페이지** | 전면 교체 | 탭으로 분리, 기존 유지 |
| **기존 학생 상세 페이지** | 상담 섹션 과도하게 확장 | 요약만 표시, 상세는 링크 |
| **기존 Zod 스키마** | 새 스키마 파일에 패턴 불일치 | counseling.ts 패턴 준수 |

---

## Testing Checklist

각 페이즈에서 반드시 확인해야 할 테스트입니다.

### Phase 1 테스트
- [ ] 새 모델 마이그레이션 성공
- [ ] 기존 CounselingSession 쿼리 영향 없음
- [ ] 인덱스 정상 생성

### Phase 2 테스트
- [ ] 다른 팀 사용자로 예약 조회 시 빈 결과
- [ ] 동일 시간대 중복 예약 거부됨
- [ ] 예약 완료 시 CounselingSession 생성됨
- [ ] 상태 전환 규칙 준수 (CANCELLED -> COMPLETED 불가)

### Phase 4 테스트
- [ ] 기존 상담 기록 목록 정상 표시
- [ ] 기존 필터링 동작
- [ ] 기존 통계 카드 숫자 정확
- [ ] 탭 전환 시 데이터 유지

---

## Sources

### 예약 시스템 설계 피트폴
- [How to Avoid Double-Booking Appointments (Acuity Scheduling)](https://acuityscheduling.com/learn/avoid-double-booking-appointments) - 더블 부킹 방지 전략
- [5 Common Online Booking Mistakes (SITE123)](https://www.site123.com/learn/5-common-online-booking-mistakes-and-how-to-avoid-them) - 온라인 예약 시스템 실수
- [Scheduling Conflicts: Top Causes & Proven Ways (Booking WP Plugin)](https://www.booking-wp-plugin.com/blog/scheduling-conflicts-top-causes-proven-ways-to-prevent-them/) - 일정 충돌 원인과 방지
- [Building a Modern Appointment Booking System (Medium)](https://medium.com/@spearhead0802/building-a-modern-appointment-booking-system-design-architecture-and-lessons-learned-a7849d863d00) - 예약 시스템 아키텍처

### 기존 코드베이스 통합
- [Mistakes engineers make in large established codebases (Sean Goedecke)](https://www.seangoedecke.com/large-established-codebases/) - 기존 코드베이스 작업 실수
- [How to Integrate a New Feature into an Existing Codebase (LinkedIn)](https://www.linkedin.com/advice/0/what-best-practices-integrating-new-feature-0twuf) - 새 기능 통합 베스트 프랙티스
- [Anti-patterns You Should Avoid (freeCodeCamp)](https://www.freecodecamp.org/news/antipatterns-to-avoid-in-code/) - 코드 안티패턴

### RBAC 통합
- [10 RBAC Best Practices You Should Know in 2025 (Oso)](https://www.osohq.com/learn/rbac-best-practices) - RBAC 베스트 프랙티스
- [RBAC Implementation in 5 Steps (Oso)](https://www.osohq.com/learn/rbac-role-based-access-control-implementation) - RBAC 구현 단계

### 날짜/시간 처리
- [Recurring Calendar Events - Database Design (Medium)](https://medium.com/@aureliadotlim/recurring-calendar-events-database-design-dc872fb4f2b5) - 캘린더 이벤트 DB 설계
- [The Complex World of Calendars: Database Design (TomorrowApp)](https://medium.com/tomorrowapp/the-complex-world-of-calendars-database-design-fccb3a71a74b) - 캘린더 DB 복잡성

### Next.js/Prisma 패턴
- [Prisma ORM Production Guide: Next.js Complete Setup 2025 (Digital Applied)](https://www.digitalapplied.com/blog/prisma-orm-production-guide-nextjs) - Prisma 프로덕션 가이드
- [Using Prisma with Next.js: A Simple Guide for 2025 (Toxigon)](https://toxigon.com/prisma-in-next-js) - Prisma + Next.js 가이드

### 개인정보 보호
- [The Educator's Guide to Student Data Privacy (ConnectSafely)](https://connectsafely.org/eduprivacy/) - 학생 데이터 프라이버시
- [13 FERPA Violation Examples (Bright Defense)](https://www.brightdefense.com/resources/13-ferpa-violation-examples-you-need-to-know-and-avoid/) - 개인정보 위반 사례

### 기존 프로젝트 코드
- `/home/gon/projects/ai/ai-afterschool/prisma/schema.prisma` - 기존 Prisma 스키마
- `/home/gon/projects/ai/ai-afterschool/src/lib/actions/performance.ts` - 기존 상담 액션 패턴
- `/home/gon/projects/ai/ai-afterschool/src/lib/db/rbac.ts` - 기존 RBAC 패턴
- `/home/gon/projects/ai/ai-afterschool/src/app/(dashboard)/counseling/page.tsx` - 기존 상담 페이지

---

*Pitfalls research for: AI AfterSchool v2.1 학부모 상담 관리 시스템*
*Focus: 기존 시스템에 학부모 상담 예약/기록 기능 추가 시 발생 가능한 실수*
*Researched: 2026-02-04*
*Confidence: MEDIUM*
