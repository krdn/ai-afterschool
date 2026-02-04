# Features Research: 학부모 상담 관리 시스템

## Executive Summary

AI AfterSchool 시스템에 학부모 상담 예약/기록 기능을 추가합니다. **기존 CounselingSession 모델이 이미 구현**되어 있으며 상담 기록의 핵심 기능(유형 분류, 요약, 후속 조치, 만족도)이 완성된 상태입니다. 이번 마일스톤에서는 **학부모 상담 특화 기능**(예약 관리, 학부모 정보, 상담 이력 통합 조회)을 추가하여 기존 기능을 확장합니다. 선생님 중심 내부 시스템이므로 학부모 직접 접속 및 외부 알림 기능은 제외합니다.

---

## Current State Analysis (기존 구현 현황)

### 이미 구현된 기능

| 기능 | 상태 | 위치 |
|------|------|------|
| 상담 기록 생성 | **완료** | `/counseling/new`, `CounselingSessionForm` |
| 상담 목록 조회 | **완료** | `/counseling` |
| 상담 유형 분류 | **완료** | ACADEMIC, CAREER, PSYCHOLOGICAL, BEHAVIORAL |
| 후속 조치 관리 | **완료** | `followUpRequired`, `followUpDate` |
| 만족도 기록 | **완료** | `satisfactionScore` (1-5) |
| 필터링 (학생/선생님/유형/기간) | **완료** | `/counseling?` searchParams |
| RBAC 기반 접근 제어 | **완료** | DIRECTOR, TEAM_LEADER, MANAGER, TEACHER |
| 통계 대시보드 | **완료** | 월간 횟수, 평균 시간, 후속 조치 건수 |

### 기존 데이터 모델 (CounselingSession)

```prisma
model CounselingSession {
  id                String          @id @default(cuid())
  studentId         String
  teacherId         String
  sessionDate       DateTime        // 상담일
  duration          Int             // 상담 시간 (분)
  type              CounselingType  // ACADEMIC, CAREER, PSYCHOLOGICAL, BEHAVIORAL
  summary           String          // 상담 내용 요약
  followUpRequired  Boolean         @default(false)
  followUpDate      DateTime?       // 후속 조치 예정일
  satisfactionScore Int?            // 만족도 점수 (1-5)
}
```

---

## Table Stakes (Must Have)

### 1. 학부모 상담 예약 관리

기존 시스템은 "상담 기록"만 지원하며, "예약"(미래 상담 일정) 기능이 없습니다.

#### 1.1 상담 예약 등록

- **Feature**: 미래 날짜/시간에 상담 예약 등록 — **MEDIUM**
- **Description**: 학부모 상담을 미리 예약하고 일정 관리
- **Dependencies**: 기존 `CounselingSession` 확장 또는 새 `ParentConsultation` 모델 필요
- **Expected behavior**:
  - 예약 일시 선택 (날짜 + 시간)
  - 예상 소요 시간 설정
  - 상담 목적/주제 미리 기록
  - 학부모 이름/연락처 기록

#### 1.2 상담 예약 상태 관리

- **Feature**: 예약 -> 완료 -> 기록 워크플로우 — **MEDIUM**
- **Description**: 예약 상태를 추적하고 완료 시 기록으로 전환
- **Expected behavior**:
  - 상태: SCHEDULED(예약됨), COMPLETED(완료), CANCELLED(취소), NO_SHOW(불참)
  - 예약된 상담을 완료 처리하면 자동으로 기록 입력 화면으로 이동
  - 취소/불참 사유 기록

#### 1.3 캘린더/리스트 뷰

- **Feature**: 상담 예약 캘린더 뷰 — **MEDIUM**
- **Description**: 월간/주간 캘린더 형태로 예약 현황 시각화
- **Expected behavior**:
  - 월간/주간/일간 뷰 전환
  - 날짜 클릭 시 해당 일 상담 목록
  - 빈 슬롯에서 빠른 예약 생성

### 2. 학부모 정보 관리

현재 시스템에는 학부모 정보 모델이 없습니다.

#### 2.1 학부모 정보 저장

- **Feature**: 학생별 학부모 연락처 관리 — **LOW**
- **Description**: 학생과 연결된 학부모/보호자 정보 저장
- **Expected behavior**:
  - 학부모 이름, 관계 (부/모/보호자), 연락처
  - 학생당 복수 학부모 지원 (이혼 가정 등)
  - 주 연락처 지정

#### 2.2 학부모 상담 이력 통합 조회

- **Feature**: 학부모 단위 상담 이력 조회 — **LOW**
- **Description**: 동일 학부모의 모든 상담 이력을 통합 조회
- **Expected behavior**:
  - 학부모 검색
  - 해당 학부모와의 전체 상담 이력
  - 형제/자매 있는 경우 모든 학생 상담 포함

### 3. 학생별 상담 이력 조회

#### 3.1 학생 상세 페이지 내 상담 이력

- **Feature**: 학생 상세 페이지에 상담 탭 추가 — **LOW**
- **Description**: 학생 상세 페이지에서 해당 학생의 상담 이력 조회
- **Dependencies**: 기존 `/students/[id]/page.tsx` 확장
- **Expected behavior**:
  - 최근 상담 요약 카드
  - 전체 상담 이력 목록
  - 다음 예약된 상담 표시
  - 빠른 상담 기록 버튼

### 4. 상담 유형 확장

#### 4.1 학부모 상담 전용 유형

- **Feature**: 학부모 상담 유형 추가 — **LOW**
- **Description**: 기존 4가지 유형에 학부모 상담 특화 유형 추가
- **Dependencies**: `CounselingType` enum 확장
- **Expected behavior**:
  - PARENT_REGULAR: 정기 학부모 상담
  - PARENT_ISSUE: 이슈 관련 학부모 상담
  - PARENT_ADMISSION: 신입생 학부모 상담
  - PARENT_GRADE: 성적 관련 학부모 상담

### 5. 상담 통계 확장

#### 5.1 선생님별/학생별 상담 통계

- **Feature**: 선생님별 상담 통계 — **LOW**
- **Description**: 선생님별 상담 횟수, 평균 시간 등 통계
- **Dependencies**: 기존 `/counseling` 통계 확장
- **Expected behavior**:
  - 선생님별 월간 상담 횟수
  - 학생별 누적 상담 횟수
  - 상담 유형별 분포

---

## Differentiators (Should Have)

### 1. AI 상담 요약 제안

- **Feature**: AI 기반 상담 내용 요약 제안 — **HIGH**
- **Value**: 선생님이 상담 키워드만 입력하면 AI가 요약문 초안 생성
- **Dependencies**: 기존 LLM 인프라 활용 (OpenAI/Anthropic)
- **Expected behavior**:
  - 키워드/핵심 내용 입력
  - AI가 정형화된 요약문 생성
  - 선생님이 수정 후 저장

### 2. 상담 템플릿

- **Feature**: 상담 유형별 템플릿 — **MEDIUM**
- **Value**: 반복적인 상담 기록 작업을 효율화
- **Expected behavior**:
  - 신입생 상담 템플릿 (적응도, 학습 태도, 요청사항)
  - 정기 상담 템플릿 (성적 변화, 수업 태도, 개선점)
  - 진로 상담 템플릿 (목표 대학, 전략, 준비사항)
  - 사용자 정의 템플릿 저장

### 3. 학생 분석 데이터 연동

- **Feature**: 상담 시 학생 분석 데이터 자동 표시 — **MEDIUM**
- **Value**: AI AfterSchool의 차별화 포인트 - 성향 분석과 상담 연계
- **Dependencies**: 기존 PersonalitySummary, 궁합 분석 연동
- **Expected behavior**:
  - 상담 기록 시 학생의 핵심 성향 표시
  - 학습 전략 제안 자동 포함
  - 선생님-학생 궁합 점수 참고

### 4. 후속 조치 리마인더

- **Feature**: 후속 조치 대시보드 — **MEDIUM**
- **Value**: 놓치기 쉬운 후속 조치를 체계적으로 관리
- **Expected behavior**:
  - 오늘/이번 주 후속 조치 목록
  - 지연된 후속 조치 알림 (대시보드 상)
  - 후속 조치 완료 체크

### 5. 상담 시간대 분석

- **Feature**: 상담 패턴 분석 — **LOW**
- **Value**: 상담 업무 최적화를 위한 인사이트
- **Expected behavior**:
  - 요일별/시간대별 상담 분포
  - 바쁜 시간대 파악
  - 상담 소요 시간 추세

---

## Anti-Features (Explicitly Excluded)

운영 방식에 따라 아래 기능은 **의도적으로 제외**합니다.

### 1. 학부모 직접 접속/예약

- **Feature**: 학부모가 직접 시스템에 로그인하여 예약
- **Reason**: 선생님 중심 내부 운영 시스템으로, 학부모 계정 관리 복잡성 회피
- **Alternative**: 선생님이 학부모와 통화/메시지 후 직접 예약 등록

### 2. 외부 알림 (SMS/카카오톡/이메일)

- **Feature**: 예약 확인/리마인더 자동 발송
- **Reason**: 내부 기록 전용 시스템으로, 외부 연동 비용/복잡성 회피
- **Alternative**: 필요 시 선생님이 직접 연락

### 3. 실시간 캘린더 동기화

- **Feature**: Google Calendar, Outlook 등 외부 캘린더 연동
- **Reason**: 내부 전용 시스템으로 단순성 유지
- **Alternative**: 내부 캘린더 뷰 제공

### 4. 화상 상담 기능

- **Feature**: Zoom, Google Meet 연동 화상 상담
- **Reason**: 대면 상담 중심의 입시 학원 운영 특성
- **Alternative**: 필요 시 별도 화상회의 도구 사용

### 5. 다국어 지원

- **Feature**: 영어/중국어 등 다국어 인터페이스
- **Reason**: 한국 입시 학원 전용 시스템
- **Alternative**: 한국어 단일 언어로 유지

### 6. 상담료 결제/정산

- **Feature**: 상담 비용 청구 및 결제
- **Reason**: 일반적으로 학원 수강료에 포함, 별도 정산 불필요
- **Alternative**: 필요 시 기존 수납 시스템 활용

---

## Dependencies on Existing Features

### 필수 의존성

| 기능 | 의존하는 기존 기능 | 영향도 |
|------|-------------------|--------|
| 학부모 상담 예약 | `Student` 모델 | LOW - 학생 ID 참조 |
| 학부모 정보 관리 | `Student` 모델 | MEDIUM - 새 관계 추가 |
| 상담 이력 조회 | `CounselingSession` 모델 | LOW - 기존 모델 활용 |
| RBAC 적용 | 기존 권한 시스템 | LOW - 기존 패턴 재사용 |
| 학생 분석 연동 | `PersonalitySummary`, 분석 모델 | LOW - 조회만 |

### 데이터 모델 확장 제안

```prisma
// 새로운 모델: 학부모 정보
model Parent {
  id          String   @id @default(cuid())
  name        String
  phone       String?
  email       String?
  relationship String  // "FATHER", "MOTHER", "GUARDIAN", "OTHER"
  isPrimary   Boolean  @default(false)  // 주 연락처 여부
  studentId   String
  student     Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  consultations ParentConsultation[]

  @@index([studentId])
}

// 새로운 모델: 학부모 상담 예약
model ParentConsultation {
  id              String   @id @default(cuid())
  studentId       String
  teacherId       String
  parentId        String?  // nullable for legacy data

  // 예약 정보
  scheduledAt     DateTime // 예약 일시
  estimatedDuration Int    @default(30) // 예상 소요 시간 (분)
  topic           String?  // 상담 주제

  // 상태 관리
  status          ConsultationStatus @default(SCHEDULED)
  cancelledReason String?

  // 완료 후 기록 연결
  counselingSessionId String? @unique

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  student         Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  teacher         Teacher  @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  parent          Parent?  @relation(fields: [parentId], references: [id])
  counselingSession CounselingSession? @relation(fields: [counselingSessionId], references: [id])

  @@index([teacherId, scheduledAt])
  @@index([studentId, scheduledAt])
  @@index([status])
}

enum ConsultationStatus {
  SCHEDULED   // 예약됨
  COMPLETED   // 완료
  CANCELLED   // 취소
  NO_SHOW     // 불참
}

// CounselingType enum 확장
enum CounselingType {
  ACADEMIC
  CAREER
  PSYCHOLOGICAL
  BEHAVIORAL
  // 학부모 상담 전용 유형 추가
  PARENT_REGULAR
  PARENT_ISSUE
  PARENT_ADMISSION
  PARENT_GRADE
}
```

---

## Implementation Priority

### Phase 1: Core Reservation (필수)

1. 학부모 정보 모델 추가 (Parent)
2. 상담 예약 모델 추가 (ParentConsultation)
3. 예약 CRUD API
4. 예약 목록/상세 페이지

### Phase 2: Enhanced Views (기능 확장)

1. 캘린더 뷰 구현
2. 학생 상세 페이지 내 상담 탭
3. 예약 -> 완료 -> 기록 워크플로우
4. 상담 유형 확장

### Phase 3: Insights (차별화)

1. 학생 분석 데이터 연동
2. 후속 조치 대시보드
3. 상담 통계 확장
4. (Optional) AI 상담 요약 제안

---

## Sources

### 학원 관리 시스템 참조

- [학원조아 CRM](https://hakwonjoa.com/crm.php) - 상담 기록 관리, 선생님 권한 설정
- [공선학관](https://gshk.io/) - 원생 상담일지, 출결 현황판
- [위키런](https://www.wikirun.kr/) - 학생별/날짜별 상담 필터링
- [어나더클래스](https://www.anotherclass.co.kr/) - 상담 시 학생 정보 자동 표시
- [랠리즈](https://www.rallyz.co.kr/) - 학부모 소통 기능
- [미래교육협동조합](https://www.miraecooper.com/) - 학원 상담 실무 요령

### 예약 시스템 참조

- [PTCfast](https://www.ptcfast.com/) - Parent-Teacher Conference 예약
- [ParentSquare](https://www.parentsquare.com/classroom-communications/parent-teacher-conference-scheduler/) - 학교용 상담 예약
- [SimplyBook.me](https://simplybook.me/ko/appointment-scheduling-software-for-educational-services/) - 교육 서비스 예약
- [되는시간](https://whattime.co.kr/) - 한국형 일정 조율 서비스

### 일반 CRM 참조

- [NetSuite CRM Requirements](https://www.netsuite.com/portal/resource/articles/crm/crm-requirements.shtml) - CRM 기능 요구사항
- [Insycle Education CRM](https://blog.insycle.com/education-crm-data-management) - 교육 CRM 데이터 관리

---

*Researched: 2026-02-04*
*Confidence: HIGH*

**Rationale for HIGH confidence:**
- 기존 구현 코드 직접 분석 완료
- 학원 관리 시스템 다수 조사 및 공통 패턴 확인
- 운영 방식(선생님 중심, 내부 기록) 명확하여 제외 기능 결정 용이
- 기존 데이터 모델과의 호환성 검증 완료
