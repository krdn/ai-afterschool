# Phase 18: Reservation Management UI - Context

**Gathered:** 2026-02-04
**Status:** Ready for planning

## Phase Boundary

예약 등록 및 목록 관리 화면 구현. 선생님이 학부모 상담 예약을 생성하고, 예약 목록을 조회하며, 예약 상태를 변경하는 UI를 제공합니다.

</domain>

## Implementation Decisions

### 페이지 구조
- 기존 `/counseling` 페이지에 예약 관리를 통합
- 2개 탭 구성: "상담 기록" | "예약 관리"
- 예약 등록 버튼은 "예약 관리" 탭 내에 배치
- 예약 등록 폼은 페이지 내 전환 (목록 → 폼 → 목록)
- 폼 제출 후 목록으로 자동 복귀

### DatePicker UX
- 달력 중심의 날짜 선택: 전용 캘린더 컴포넌트로 월 단위 탐색
- 날짜 클릭 시 해당 날의 예약 목록 표시
- 시간 선택은 시간 슬롯 그리드로 제공: 30분 단위 슬롯 (9:00, 9:30, 10:00...)
- 시간 슬롯 범위는 선생님별 설정 가능 (기본값: 09:00~18:00)
- 선생님 설정이 없는 경우 기본 운영 시간 적용

### 예약 목록 표현
- 카드형 레이아웃 사용
- 카드 표시 정보: 학생 이름, 학부모 관계, 예약 시간, 상태, 주제 (순서대로)
- 상태는 컬러 배지로 표시: 예약(파랑), 완료(초록), 취소(회색), 노쇼(주황)
- 카드 하단에 상태 변경 버튼 배치

### 빈 상태 및 상호작용
- 빈 상태: 아이콘 + "예약된 상담이 없습니다. 새 예약을 등록해주세요." + CTA 버튼
- 상태 변경 액션: 명시적 버튼 라벨 (완료, 취소, 노쇼)
- 모든 상태 변경 전에 확인 다이얼로그 표시
- 실행 후 토스트 알림으로 결과 피드백

### Claude's Discretion
- DatePicker 라이브러리 선택 (shadcn/ui Calendar + react-day-picker 권장)
- 시간 슬롯 그리드의 정확한 UI 구현
- 카드 간격, 그림자, 둥근 모서리 등 스타일링
- 확인 다이얼로그 문구 구체화
- 토스트 알림 메시지 내용
- 필터링/검색 UI의 정확한 배치와 디자인

</decisions>

## Specific Ideas

- react-day-picker + shadcn/ui Calendar 조합으로 날짜 선택 UX 구현 (45KB gzipped)
- 기존 상담 페이지 UI 패턴 재사용 (CounselingHistoryList 컴포넌트 참고)
- 30분 단위 시간 슬롯: 분이 0 또는 30인지 검증 (Phase 17 Server Actions에서 이미 구현됨)

</specifics>

## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 18-reservation-management-ui*
*Context gathered: 2026-02-04*
