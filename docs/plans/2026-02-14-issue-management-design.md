# 이슈 관리 페이지 설계

**날짜**: 2026-02-14
**상태**: 승인됨

## 요약

이슈 보고 기능의 미구현 부분(목록 페이지, 상세 페이지, 담당자 할당)을 구현합니다. 백엔드 Server Action은 이미 완성되어 있으며, 프론트엔드 UI만 구축합니다.

## 결정 사항

- **페이지 위치**: 독립 라우트 `/issues` (목록) + `/issues/[id]` (상세)
- **UI 형식**: 테이블 형식 목록
- **담당자 할당**: 상세 페이지에서만
- **구현 방식**: Server Component 중심 (기존 프로젝트 패턴 유지)

## 아키텍처

### 파일 구조

```
src/app/(dashboard)/issues/
├── page.tsx                       # 이슈 목록 (Server Component)
└── [id]/
    └── page.tsx                   # 이슈 상세 (Server Component)

src/components/issues/
├── (기존) issue-report-button.tsx
├── (기존) issue-report-modal.tsx
├── (기존) issue-form.tsx
├── (기존) screenshot-capture.tsx
├── (기존) screenshot-preview.tsx
├── (기존) index.ts
├── (신규) issue-table.tsx         # 목록 테이블 (Client)
├── (신규) issue-filters.tsx       # 상태/카테고리 필터 (Client)
├── (신규) issue-status-badge.tsx  # 상태 뱃지
├── (신규) issue-detail.tsx        # 상세 정보 표시 (Client)
├── (신규) issue-timeline.tsx      # IssueEvent 타임라인
└── (신규) issue-assign-select.tsx # 담당자 할당 드롭다운

src/lib/actions/issues.ts
├── (기존) createIssue
├── (기존) getIssues
├── (기존) getIssueById
├── (기존) updateIssueStatus
└── (신규) assignIssue             # 담당자 할당
```

### 네비게이션

`layout.tsx`에 DIRECTOR 전용 "이슈" 링크를 추가합니다.

### 데이터 흐름

```
[목록] URL ?status=OPEN&category=BUG&page=1
  → Server Component → getIssues() → IssueTable 전달
  → 필터 변경 시 URL 업데이트 → 페이지 리렌더링

[상세] /issues/[id]
  → Server Component → getIssueById() → IssueDetail + IssueTimeline
  → 상태 변경/담당자 할당 → Server Action → router.refresh()
```

## 컴포넌트 설계

### 이슈 목록 테이블

| # | 컬럼 | 설명 |
|---|------|------|
| 1 | 상태 | Badge (OPEN=파랑, IN_PROGRESS=노랑, IN_REVIEW=보라, CLOSED=회색) |
| 2 | 제목 | 클릭 시 상세 이동, GitHub #번호 표시 |
| 3 | 카테고리 | Badge (BUG=빨강, FEATURE=초록 등) |
| 4 | 우선순위 | URGENT=빨강, HIGH=주황, MEDIUM=노랑, LOW=회색 |
| 5 | 생성자 | 이름 |
| 6 | 담당자 | 이름 또는 "미할당" |
| 7 | 생성일 | 상대 시간 |

### 필터 바

상태 드롭다운 + 카테고리 드롭다운 + "이슈 보고" 버튼(기존 모달 재사용)

### 이슈 상세 페이지 (2단 레이아웃)

- **좌측 (2/3)**: 제목, 설명, 스크린샷, 타임라인
- **우측 사이드바 (1/3)**: 상태 변경, 담당자 할당, 메타 정보, GitHub 링크

### 새 Server Action

```typescript
export async function assignIssue(
  issueId: string,
  assignedTo: string | null
): Promise<{ success: boolean; error?: string }>
```

## 에이전트 팀 구성

- **개발자**: 코드 구현 담당
- **테스터**: 개발 완료 시 테스트 수행
- **기획자**: UI/UX 설계 의사결정 시 소통
