# Phase 25: Research - Student, Analysis & Report UI Enhancement

**Researched:** 2026-02-07
**Status:** Complete

## Overview

Phase 25는 학생/분석/리포트 페이지의 UI 개선을 목표로 합니다. E2E 테스트 호환성과 접근성을 확보하는 데 중점을 둡니다.

## Key Findings

### 1. 이미지 alt 속성 (STU-02, UTL-01, UTL-02)

**현황 분석:**
- `student-image-uploader.tsx`: `alt={${label} 미리보기}` 로 일관되지 않음
- `face-analysis-panel.tsx`: `alt="얼굴 사진"` 하드코딩됨
- `student-table.tsx`: 학생 목록 이미지에 loading="lazy" 미적용

**권장 사항:**
1. **alt 속성 정합성**: 학생 이름 포함 형식 통일
   - 프리뷰: `{studentName}의 프로필 사진`
   - 관상: `{studentName}의 얼굴 사진`
   - 손금: `{studentName}의 손 사진`

2. **lazy loading**: 목록 페이지에만 적용
   - `student-table.tsx`의 이미지 컬럼에 `loading="lazy"` 추가
   - 상세 페이지는 `priority={true}` 유지

3. **Next/Image vs img 태그**:
   - 현재 `CldImage` (Cloudinary 전용) 사용 중
   - 일반 img 태그로 변경 불필요 - Cloudinary 최적화 활용
   - `CldImage`는 이미 `width`, `height`, `sizes` 속성 지원

### 2. 검색 정합성 (STU-03)

**현황 분석:**
- `student-table.tsx`: `globalFilterFn: 'includesString'` 사용
- 빈 결과 시 "검색 결과가 없어요." 메시지 있음
- 테스트에서 텍스트 매칭으로 검증 가능

**권장 사항:**
1. 빈 결과 메시지에 data-testid 추가
2. 검색 결과 없음을 명확히 표시 (현재 구조 양호)
3. 추가 작업 최소화 - 기존 검색 기능이 테스트 친화적임

### 3. 학생 삭제 리다이렉트 (STU-04)

**현황 분석:**
- `student-detail-actions.tsx` 삭제 로직 확인 필요
- 삭제 후 `/students`로 리다이렉트되어야 함

**권장 사항:**
1. `router.push('/students')` 확인
2. 삭제 성공 시 toast 알림 후 리다이렉트

### 4. 분석 탭 서브탭 분리 (ANL-02)

**현황 분석:**
- 현재 `analysis-tab.tsx`는 통합 탭
- 사주/관상/MBTI가 별도 파일로 분리되어 있음
- 각각의 패널 컴포넌트가 존재

**권장 사항:**
1. **서브탭 구조**: Tabs 컴포넌트 중첩
   ```
   AnalysisTab
   └── Tabs (value={subTab})
       ├── TabList: [사주, 관상, MBTI]
       └── TabPanels
           ├── 사주: SajuAnalysisPanel
           ├── 관상: FaceAnalysisPanel
           ├── 손금: PalmAnalysisPanel
           └── MBTI: MbtiAnalysisPanel
   ```

2. **URL 해시 미사용**: 상태 기반 서브탭 (URL 복잡도 최소화)

3. **기본 서브탭**: 사주 (첫 번째 탭)

### 5. AI 분석 에러 처리 (ANL-03)

**현황 분석:**
- `face-analysis-panel.tsx`: 에러 상태와 재시도 버튼 이미 구현됨
- `saju-analysis-panel.tsx`: `errorMessage` 상태와 표시 로직 있음
- 다만, 에러 메시지가 일관되지 않음

**권장 사항:**
1. **에러 메시지 통일**:
   - 사주: "사주 분석에 실패했습니다. (원인: {error}) 다시 시도해주세요."
   - 관상/손금: "이미지 분석에 실패했습니다. (원인: {error}) 다시 시도해주세요."
   - MBTI: "MBTI 분석에 실패했습니다. (원인: {error}) 다시 시도해주세요."

2. **재시도 버튼 스타일**:
   - 텍스트 + 아이콘 조합 (`<RefreshCw className="w-4 h-4" />` + "다시 시도")

3. **연속 클릭 방지**: `disabled` 상태와 로딩 표시

### 6. 분석 이력 조회 (ANL-04)

**현황 분석:**
- Prisma 스키마에 이력 모델 없음
- 현재 최신 분석만 표시

**권장 사항:**
1. **데이터베이스**: 이력 저장 필요
   - 기존 분석 모델에 `calculatedAt` 필드 활용 가능
   - 또는 별도 이력 테이블

2. **UI 구성**:
   - 이력 목록 (날짜, 결과 요약)
   - 상세 보기 모달 (Dialog)

3. **범위 제한**: 최근 5개 표시 (성능 고려)

### 7. PDF 다운로드 (RPT-02)

**현황 분석:**
- `report-tab.tsx`: 다운로드 버튼과 fetch 로직 구현됨
- `onClick` 핸들러와 `isDownloading` 상태 있음
- Blob URL 생성 및 다운로드 로직 완료

**권장 사항:**
1. 기존 구현 확인 - 이미 정상 동작
2. data-testid 추가 필요 시
3. 테스트에서 버튼 클릭 검증 가능

## Implementation Considerations

### Claude's Discretion 항목

1. **Next.js Image 컴포넌트**: 기존 `CldImage` 유지
   - Cloudinary 최적화 활용
   - 별도 마이그레이션 불필요

2. **서브탭 URL 처리**: 상태 기반 (URL 해시 없음)
   - 단순한 구현
   - 복잡도 최소화

3. **기본 서브탭**: 사주 (첫 번째)

4. **빈 검색 결과 메시지**: 단순 메시지 유지

5. **검색 입력 동작**: 실시간 검색 (기존 방식 유지)

6. **재시도 버튼**: 텍스트 + 아이콘 조합

## Dependencies

- Phase 24 (Missing Routes Creation) 완료 필요
- 기존 분석 패널 컴포넌트 재사용

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| 서브탭 구조 복잡도 | Low | Medium | shadcn/ui Tabs 중첩 패턴 사용 |
| 분석 이력 DB 스키마 | Medium | High | 기존 모델 활용 또는 간단한 이력 필드 추가 |
| 에러 메시지 일관성 | Low | Low | 공통 유틸리티 함수 작성 |

## Success Criteria Verification

1. ✅ alt 속성 일관성: 학생 이름 포함 형식
2. ✅ 검색 결과 텍스트 매칭: data-testid 추가
3. ✅ 삭제 후 리다이렉트: router.push 확인
4. ✅ 서브탭 분리: Tabs 중첩 구조
5. ✅ 에러 메시지 및 재시도: 통일된 메시지와 버튼
6. ✅ 분석 이력: 모달 기반 상세 보기
7. ✅ PDF 다운로드: 기존 구현 확인
8. ✅ lazy loading: 목록 페이지에만 적용
9. ✅ Next/Image 정합성: CldImage 활용

---

*Research complete: 2026-02-07*
*Next: Planning phase*
