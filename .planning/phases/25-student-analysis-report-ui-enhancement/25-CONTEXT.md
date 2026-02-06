# Phase 25: Student, Analysis & Report UI Enhancement - Context

**Gathered:** 2026-02-07
**Status:** Ready for planning

## Phase Boundary

학생/분석/리포트 페이지의 UI 개선 - 접근성(alt 속성), 검색 가능성(텍스트 매칭), 탭 구조(서브탭 분리), 에러 처리(AI 분석 실패), 이미지 최적화(lazy loading)을 포함합니다. 새로운 기능 추가 없이 기존 구현의 테스트 호환성과 사용자 경험을 개선합니다.

## Implementation Decisions

### 이미지 프리뷰 및 최적화
- **프리뷰 크기**: 고정 썸네일 크기 (업로드 즉시 200x200 또는 유사한 크기로 표시)
- **alt 속성**: 학생 이름 포함 (예: "{학생명}의 프로필 사진" 또는 "{학생명} 학생 사진")
- **lazy loading**: 학생 목록 페이지에만 적용 (상세 페이지 등은 즉시 로드)
- **Next.js Image 컴포넌트**: Claude discretion (기존 img 태그 유지 또는 Next/Image 마이그레이션)

### 탭 구조 및 내비게이션
- **서브탭 구조**: 기존 분석 탭 내부에 3개의 서브탭(사주, 관상, MBTI) 추가 (탭 안에 서브탭 패턴)
- **URL 처리**: Claude discretion (URL 해시 사용 여부)
- **기본 서브탭**: Claude discretion (분석 탭 진입 시 기본 표시 서브탭)

### 검색 및 필터 정합성
- **검색 결과 표시**: 필터링 방식 (검색어와 일치하는 학생 카드만 표시, 빈 결과 시 안내 메시지)
- **빈 결과 메시지**: Claude discretion (단순 메시지 또는 제안 포함)
- **검색 입력 동작**: Claude discretion (실시간 검색 또는 명시적 검색)

### 에러 상태 및 재시도
- **AI 분석 실패 메시지**: 상세 메시지 (예: "분석에 실패했습니다. (原因: 네트워크 오류) 다시 시도해주세요.")
- **재시도 버튼 스타일**: Claude discretion (텍스트, 아이콘, 또는 조합)
- **재시도 동작**: 딜레이 후 재시도 (버튼 클릭 후 1-2초 딜레이, 연속 클릭 방지)

### Claude's Discretion
- Next.js Image 컴포넌트 사용 여부 (기존 img 태그 유지 또는 마이그레이션)
- 서브탭 URL 처리 방식 (해시 사용 여부)
- 기본 서브탭 선택 (사주/관상/MBTI 중 하나)
- 빈 검색 결과 메시지 스타일
- 검색 입력 동작 (실시간 또는 명시적)
- 재시도 버튼 스타일 (텍스트, 아이콘, 또는 조합)

## Specific Ideas

No specific requirements — open to standard approaches following established patterns from Phase 23 (data-testid infrastructure).

## Deferred Ideas

None — discussion stayed within phase scope.

---

*Phase: 25-student-analysis-report-ui-enhancement*
*Context gathered: 2026-02-07*
