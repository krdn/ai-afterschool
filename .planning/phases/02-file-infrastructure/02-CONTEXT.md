# Phase 2: File Infrastructure - Context

**Gathered:** 2026-01-28
**Status:** Ready for planning

<domain>
## Phase Boundary

학생 프로필 사진과 관상/손금 분석용 이미지를 업로드, 저장, 조회하고 학생 상세 화면에서 확인할 수 있게 한다. 업로드 이미지는 리사이징된 버전을 제공한다.

</domain>

<decisions>
## Implementation Decisions

### Upload entry points
- 학생 상세 페이지와 학생 수정 폼 모두에서 업로드 가능
- 신규 학생 등록 시점에도 업로드 허용
- 드래그앤드롭 + 파일 선택 버튼 제공
- 파일 선택 후 별도 업로드 버튼으로 확정

### Image slots & replacement
- 프로필/관상/손금 각 타입당 1장만 유지
- 새 업로드는 기존 이미지를 즉시 교체
- 모든 타입 업로드는 선택 사항 (필수 없음)
- 이미지 삭제 가능 (삭제 후 빈 상태)

### Display layout
- 학생 상세 상단 요약 영역에 사진 노출
- 타입 전환은 탭 UI 사용
- 빈 상태는 플레이스홀더 + 업로드 CTA
- 작은 썸네일 기본, 클릭 시 확대 보기

### Resize & crop behavior
- 정사각 크롭
- 프로필/관상/손금 모두 동일 규칙 적용
- 원본 + 리사이즈 버전 모두 보관
- 허용 포맷: JPG/PNG/HEIC

### Claude's Discretion
없음

</decisions>

<specifics>
## Specific Ideas

- 탭 기반으로 프로필/관상/손금 이미지를 전환 표시
- 상단 요약 영역에 작은 썸네일 배치 후 클릭 확대

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-file-infrastructure*
*Context gathered: 2026-01-28*
