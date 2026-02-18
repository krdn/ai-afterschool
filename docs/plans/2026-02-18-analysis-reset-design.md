# 분석 결과 초기화 기능 설계

**날짜**: 2026-02-18
**상태**: 승인됨

## 요약

사주/관상/손금/MBTI/학습유형/이름/별자리 분석 결과를 학생·선생님 각 패널에서 개별적으로 초기화할 수 있는 기능을 추가한다.

## 요구사항

- 각 분석 탭 패널 헤더에 "초기화" 버튼 추가
- 현재 분석 결과만 삭제 (이력 테이블 유지)
- 삭제 전 AlertDialog로 확인
- 결과가 없으면 버튼 숨김
- 학생 7종 + 선생님 5종 패널 모두 지원

## 아키텍처

### Server Action

`src/lib/actions/reset-analysis.ts`

```ts
resetAnalysis(
  analysisType: "saju" | "face" | "palm" | "mbti" | "vark" | "name" | "zodiac",
  subjectType: "STUDENT" | "TEACHER",
  subjectId: string
): Promise<ActionResult>
```

### 삭제 대상 테이블

| 분석 타입 | 삭제 테이블 | 대상 |
|-----------|------------|------|
| saju | SajuAnalysis | STUDENT, TEACHER |
| face | FaceAnalysis | STUDENT, TEACHER |
| palm | PalmAnalysis | STUDENT, TEACHER |
| mbti | MbtiAnalysis + MbtiSurveyDraft | STUDENT, TEACHER |
| vark | VarkAnalysis + VarkSurveyDraft | STUDENT only |
| name | NameAnalysis | STUDENT, TEACHER |
| zodiac | ZodiacAnalysis | STUDENT only |

이력 테이블(`SajuAnalysisHistory`, `TeacherSajuAnalysisHistory` 등)은 **유지**.

### UI 변경

각 패널 헤더:
```
[분석명] ⊙ 도움말    [이력]  [새로고침]  [초기화]
```

- 초기화 버튼: `variant="ghost" size="sm"`, `Trash2` 아이콘
- 분석 결과 없으면 버튼 숨김
- 클릭 시 AlertDialog 확인: "결과를 삭제할까요? 이력은 유지됩니다."

## 변경 파일 목록

| 파일 | 변경 |
|------|------|
| `src/lib/actions/reset-analysis.ts` | 신규 생성 |
| `src/components/students/saju-analysis-panel.tsx` | 초기화 버튼 추가 |
| `src/components/students/face-analysis-panel.tsx` | 동일 |
| `src/components/students/palm-analysis-panel.tsx` | 동일 |
| `src/components/students/mbti-analysis-panel.tsx` | 동일 |
| `src/components/students/vark-analysis-panel.tsx` | 동일 |
| `src/components/students/name-analysis-panel.tsx` | 동일 |
| `src/components/students/zodiac-analysis-panel.tsx` | 동일 |
| `src/components/teachers/teacher-saju-panel.tsx` | 동일 |
| `src/components/teachers/teacher-face-panel.tsx` | 동일 |
| `src/components/teachers/teacher-palm-panel.tsx` | 동일 |
| `src/components/teachers/teacher-mbti-panel.tsx` | 동일 |
| `src/components/teachers/teacher-name-panel.tsx` | 동일 |
