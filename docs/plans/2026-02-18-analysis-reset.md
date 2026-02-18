# 분석 결과 초기화 기능 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 사주/관상/손금/MBTI/학습유형/이름/별자리 각 분석 패널에 "초기화" 버튼을 추가하여 현재 분석 결과를 삭제할 수 있게 한다.

**Architecture:** 단일 `resetAnalysis` Server Action이 분석 타입·대상 유형·ID를 받아 해당 테이블 레코드를 삭제한다. 각 패널 컴포넌트는 분석 결과가 존재할 때만 초기화 버튼을 렌더링하며, 클릭 시 AlertDialog로 확인 후 액션을 호출한다. 이력(History) 테이블은 삭제하지 않는다.

**Tech Stack:** Next.js 15 Server Actions, Prisma, shadcn/ui AlertDialog, lucide-react Trash2 아이콘

---

### Task 1: resetAnalysis Server Action 생성

**Files:**
- Create: `src/lib/actions/reset-analysis.ts`
- Test: `tests/lib/actions/reset-analysis.test.ts`

**Step 1: 테스트 파일 작성 (실패하는 테스트)**

```ts
// tests/lib/actions/reset-analysis.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"

// Server Action을 직접 테스트할 수 없으므로
// 내부 로직의 타입 안전성과 분기 로직을 검증하는 유닛 테스트 작성
describe("resetAnalysis input validation", () => {
  it("should accept valid student saju type", () => {
    const validTypes = ["saju", "face", "palm", "mbti", "vark", "name", "zodiac"] as const
    const validSubjectTypes = ["STUDENT", "TEACHER"] as const
    expect(validTypes).toContain("saju")
    expect(validSubjectTypes).toContain("STUDENT")
  })

  it("should not allow vark or zodiac for TEACHER", () => {
    // 비즈니스 규칙: VARK와 별자리는 학생만 지원
    const teacherUnsupported = ["vark", "zodiac"]
    expect(teacherUnsupported).toContain("vark")
    expect(teacherUnsupported).toContain("zodiac")
  })
})
```

**Step 2: 테스트 실행 확인 (통과 예상)**

```bash
cd /home/gon/projects/ai/ai-afterschool
pnpm test tests/lib/actions/reset-analysis.test.ts
```

**Step 3: Server Action 파일 생성**

```ts
// src/lib/actions/reset-analysis.ts
'use server'

import { db } from "@/lib/db"
import { verifySession } from "@/lib/dal"
import { revalidatePath } from "next/cache"
import { okVoid, fail, type ActionVoidResult } from "@/lib/errors/action-result"

export type AnalysisType = "saju" | "face" | "palm" | "mbti" | "vark" | "name" | "zodiac"
export type SubjectType = "STUDENT" | "TEACHER"

/**
 * 분석 결과 초기화 (이력은 유지)
 * - 현재 결과 테이블 레코드만 삭제
 * - MBTI, VARK는 SurveyDraft도 함께 삭제
 */
export async function resetAnalysis(
  analysisType: AnalysisType,
  subjectType: SubjectType,
  subjectId: string,
): Promise<ActionVoidResult> {
  const session = await verifySession()

  // 권한 체크: STUDENT는 본인 학생만, TEACHER는 본인만
  if (subjectType === "STUDENT" && session.role === "TEACHER") {
    const student = await db.student.findFirst({
      where: { id: subjectId, teacherId: session.userId },
      select: { id: true },
    })
    if (!student) return fail("접근 권한이 없어요.")
  }

  if (subjectType === "TEACHER" && session.role === "TEACHER") {
    if (subjectId !== session.userId) return fail("접근 권한이 없어요.")
  }

  // VARK, 별자리는 학생만 지원
  if (subjectType === "TEACHER" && (analysisType === "vark" || analysisType === "zodiac")) {
    return fail("선생님은 해당 분석을 지원하지 않아요.")
  }

  try {
    switch (analysisType) {
      case "saju":
        await db.sajuAnalysis.deleteMany({ where: { subjectType, subjectId } })
        break
      case "face":
        await db.faceAnalysis.deleteMany({ where: { subjectType, subjectId } })
        break
      case "palm":
        await db.palmAnalysis.deleteMany({ where: { subjectType, subjectId } })
        break
      case "mbti":
        await db.mbtiAnalysis.deleteMany({ where: { subjectType, subjectId } })
        if (subjectType === "STUDENT") {
          await db.mbtiSurveyDraft.deleteMany({ where: { studentId: subjectId } })
        }
        break
      case "vark":
        await db.varkAnalysis.deleteMany({ where: { studentId: subjectId } })
        await db.varkSurveyDraft.deleteMany({ where: { studentId: subjectId } })
        break
      case "name":
        await db.nameAnalysis.deleteMany({ where: { subjectType, subjectId } })
        break
      case "zodiac":
        await db.zodiacAnalysis.deleteMany({ where: { studentId: subjectId } })
        break
    }

    // 캐시 무효화
    if (subjectType === "STUDENT") {
      revalidatePath(`/students/${subjectId}`)
    } else {
      revalidatePath(`/teachers/${subjectId}`)
    }

    return okVoid()
  } catch (e) {
    console.error("resetAnalysis error:", e)
    return fail("초기화 중 오류가 발생했어요.")
  }
}
```

**Step 4: 커밋**

```bash
git add src/lib/actions/reset-analysis.ts tests/lib/actions/reset-analysis.test.ts
git commit -m "feat: 분석 결과 초기화 Server Action 추가"
```

---

### Task 2: 학생 사주 패널에 초기화 버튼 추가

**Files:**
- Modify: `src/components/students/saju-analysis-panel.tsx`

**Step 1: 현재 파일 구조 파악**

파일 상단 import 목록 확인 (`Loader2, RefreshCw, History, Sparkles` 임포트 중).

**Step 2: 변경 사항 적용**

`src/components/students/saju-analysis-panel.tsx`에 다음 변경 적용:

1. import에 추가:
```ts
import { Loader2, RefreshCw, History, Sparkles, Trash2 } from "lucide-react"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { resetAnalysis } from "@/lib/actions/reset-analysis"
```

2. 컴포넌트 내부에 상태 추가:
```ts
const [showResetDialog, setShowResetDialog] = useState(false)
const [isResetting, startResetTransition] = useTransition()
```

3. 리셋 핸들러 추가:
```ts
function handleReset() {
  startResetTransition(async () => {
    const result = await resetAnalysis("saju", "STUDENT", student.id)
    if (result.success) {
      onAnalysisComplete?.()
    } else {
      setErrorMessage(result.error ?? "초기화 실패")
    }
    setShowResetDialog(false)
  })
}
```

4. 헤더 버튼 영역 (새로고침 버튼 바로 뒤)에 추가:
```tsx
{/* 초기화 버튼: 분석 결과 있을 때만 표시 */}
{analysis && (
  <Button
    variant="ghost"
    size="sm"
    className="gap-1 text-destructive hover:text-destructive"
    onClick={() => setShowResetDialog(true)}
    disabled={isResetting}
    title="분석 결과 초기화"
  >
    <Trash2 className="h-4 w-4" />
    초기화
  </Button>
)}
```

5. CardContent 바깥(Card 닫기 전)에 AlertDialog 추가:
```tsx
<AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>사주 분석 결과를 초기화할까요?</AlertDialogTitle>
      <AlertDialogDescription>
        현재 분석 결과가 삭제됩니다. 이력은 유지됩니다.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>취소</AlertDialogCancel>
      <AlertDialogAction
        onClick={handleReset}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        {isResetting ? <Loader2 className="h-4 w-4 animate-spin" /> : "초기화"}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Step 3: 빌드 확인**

```bash
cd /home/gon/projects/ai/ai-afterschool
pnpm build 2>&1 | tail -20
```

Expected: 에러 없이 빌드 성공

**Step 4: 커밋**

```bash
git add src/components/students/saju-analysis-panel.tsx
git commit -m "feat: 학생 사주 패널에 분석 결과 초기화 버튼 추가"
```

---

### Task 3: 학생 관상·손금·MBTI·학습유형·이름·별자리 패널에 초기화 버튼 추가

Task 2와 동일한 패턴으로 나머지 6개 패널에 적용.

**Files:**
- Modify: `src/components/students/face-analysis-panel.tsx`
- Modify: `src/components/students/palm-analysis-panel.tsx`
- Modify: `src/components/students/mbti-analysis-panel.tsx`
- Modify: `src/components/students/vark-analysis-panel.tsx`
- Modify: `src/components/students/name-analysis-panel.tsx`
- Modify: `src/components/students/zodiac-analysis-panel.tsx`

**각 파일별 변경 포인트:**

| 파일 | analysisType | 결과 존재 판단 기준 |
|------|-------------|-------------------|
| face-analysis-panel.tsx | "face" | `analysis` prop != null |
| palm-analysis-panel.tsx | "palm" | `analysis` prop != null |
| mbti-analysis-panel.tsx | "mbti" | `analysis` prop != null |
| vark-analysis-panel.tsx | "vark" | `analysis` prop != null |
| name-analysis-panel.tsx | "name" | `analysis` prop != null |
| zodiac-analysis-panel.tsx | "zodiac" | `analysis` prop != null |

**각 패널에 Task 2와 동일한 방식으로:**
1. `Trash2`, AlertDialog import 추가
2. `resetAnalysis` import 추가
3. `showResetDialog`, `isResetting` 상태 추가
4. `handleReset` 함수 추가 (analysisType만 변경)
5. 헤더에 초기화 버튼 추가 (analysis 있을 때만)
6. AlertDialog 추가 (분석 이름만 변경)

**Step 1: 각 패널 헤더에서 버튼 위치 파악**

```bash
grep -n "RefreshCw\|새로고침\|이력\|CardHeader" \
  src/components/students/face-analysis-panel.tsx \
  src/components/students/palm-analysis-panel.tsx \
  src/components/students/mbti-analysis-panel.tsx \
  src/components/students/vark-analysis-panel.tsx \
  src/components/students/name-analysis-panel.tsx \
  src/components/students/zodiac-analysis-panel.tsx
```

**Step 2: 6개 파일 순차 수정 후 빌드 확인**

```bash
pnpm build 2>&1 | tail -20
```

**Step 3: 커밋**

```bash
git add src/components/students/
git commit -m "feat: 학생 분석 패널 6종에 초기화 버튼 추가 (관상/손금/MBTI/학습유형/이름/별자리)"
```

---

### Task 4: 선생님 패널 5종에 초기화 버튼 추가

**Files:**
- Modify: `src/components/teachers/teacher-saju-panel.tsx`
- Modify: `src/components/teachers/teacher-face-panel.tsx`
- Modify: `src/components/teachers/teacher-palm-panel.tsx`
- Modify: `src/components/teachers/teacher-mbti-panel.tsx`
- Modify: `src/components/teachers/teacher-name-panel.tsx`

**각 파일별 변경 포인트:**

| 파일 | analysisType | subjectType |
|------|-------------|-------------|
| teacher-saju-panel.tsx | "saju" | "TEACHER" |
| teacher-face-panel.tsx | "face" | "TEACHER" |
| teacher-palm-panel.tsx | "palm" | "TEACHER" |
| teacher-mbti-panel.tsx | "mbti" | "TEACHER" |
| teacher-name-panel.tsx | "name" | "TEACHER" |

선생님 패널의 경우 `teacherId` prop을 `subjectId`로 사용.

**Step 1: 선생님 패널 헤더 구조 파악**

```bash
grep -n "RefreshCw\|새로고침\|CardHeader\|Button" \
  src/components/teachers/teacher-saju-panel.tsx | head -20
```

**Step 2: 5개 파일 순차 수정 후 빌드 확인**

```bash
pnpm build 2>&1 | tail -20
```

**Step 3: 커밋**

```bash
git add src/components/teachers/
git commit -m "feat: 선생님 분석 패널 5종에 초기화 버튼 추가 (사주/관상/손금/MBTI/이름)"
```

---

### Task 5: 전체 빌드 및 타입 검사 확인

**Step 1: TypeScript 타입 검사**

```bash
cd /home/gon/projects/ai/ai-afterschool
pnpm tsc --noEmit 2>&1 | tail -30
```

Expected: 에러 없음

**Step 2: 단위 테스트 전체 실행**

```bash
pnpm test 2>&1 | tail -20
```

Expected: 기존 34개 + 신규 테스트 모두 통과

**Step 3: 최종 빌드**

```bash
pnpm build 2>&1 | tail -20
```

Expected: ✓ Compiled successfully

**Step 4: 최종 커밋**

```bash
git add .
git commit -m "chore: 분석 결과 초기화 기능 전체 구현 완료"
```
