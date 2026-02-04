# Phase 22: AI Integration - Research

**Researched:** 2026-02-05
**Domain:** AI-powered counseling assistance, side panel UI patterns, prompt engineering for summaries
**Confidence:** HIGH

## Summary

이 Phase는 상담 화면에서 AI 기반 지원 기능을 제공합니다. 기존 성향 분석 정보 표시, 선생님-학생 궁합 점수 참조, AI 기반 상담 내용 요약문 생성을 포함합니다. 핵심은 **새로운 분석 기능 추가가 아닌, 기존 데이터를 상담 화면에서 효과적으로 활용**하는 것입니다.

핵심 발견사항:
- Phase 15에서 구축한 통합 LLM 라우터(`src/lib/ai/router.ts`)를 활용하여 비용 최적화된 요약 생성 가능
- Phase 6에서 구축한 성향 분석 데이터 통합 조회 함수(`getUnifiedPersonalityData`)를 재사용하여 성향 요약 생성
- Phase 13에서 구축한 궁합 점수 조회 함수(`getCompatibilityResult`)를 활용하여 궁합 정보 표시
- Radix UI Dialog를 기반으로 한 shadcn/ui Sheet 컴포넌트가 사이드 패널 구현의 표준 방법
- React Hook Form + Zod가 폼 검증의 표준이며, 현재 프로젝트에 이미 적용됨
- AI 요약 버튼 UX는 투명성, 재생성 옵션, 수정 가능성을 제공해야 함

**Primary recommendation:** 기존 라우터와 데이터 함수를 활용하여 상담 폼에 Sheet 기반 사이드 패널을 추가하고, 성향 요약과 궁합 점수를 표시하며, 수동 트리거 AI 요약 버튼을 제공합니다.

## Standard Stack

이 도메인의 확립된 라이브러리/도구:

### Core (이미 프로젝트에 설치됨)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ai` | ^6.0.64 | Vercel AI SDK (generateText) | Phase 15에서 구축한 통합 LLM 라우터의 핵심 |
| `@ai-sdk/anthropic` | ^3.0.33 | Claude provider | 고품질 요약 생성에 최적화 |
| `@ai-sdk/openai` | ^3.0.23 | OpenAI provider | 폴백 옵션 |
| `@ai-sdk/google` | ^3.0.18 | Gemini provider | 비용 효율적 옵션 |
| `ollama-ai-provider-v2` | ^3.0.3 | 로컬 LLM | 무료 옵션 |
| `react-hook-form` | ^7.71.1 | 폼 상태 관리 | 성능 최적화, 비제어 컴포넌트 |
| `zod` | ^4.3.6 | 스키마 검증 | 타입 안전성, React Hook Form 통합 |

### Supporting (설치 필요)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@radix-ui/react-dialog` | ^1.1.8 | Sheet 컴포넌트 기반 | shadcn/ui Sheet 컴포넌트의 기반 |
| `lucide-react` | ^0.563.0 | 아이콘 (이미 설치됨) | AI 버튼, 패널 토글 아이콘 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Sheet (Dialog 기반) | Vaul (Drawer) | Vaul은 모바일 최적화, Sheet는 데스크탑+모바일 겸용 |
| generateText (동기) | streamText (스트리밍) | 스트리밍은 UX 개선이지만 상담 요약은 짧아서 불필요 |
| 수동 트리거 요약 | 자동 요약 | 자동 요약은 비용 증가, 수동은 선생님 제어권 보장 |

**Installation:**
```bash
# 이미 설치된 패키지 확인
npm list @radix-ui/react-dialog

# 필요시 shadcn/ui CLI로 Sheet 컴포넌트 추가
npx shadcn@latest add sheet
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   └── ai/
│       ├── router.ts                    # [기존] 통합 LLM 라우터
│       ├── counseling-prompts.ts        # [신규] 상담 요약 프롬프트
│       └── integration-prompts.ts       # [기존] 성향 통합 프롬프트
├── app/
│   └── (dashboard)/
│       └── counseling/
│           └── [id]/
│               └── page.tsx             # [수정] 상담 생성/수정 페이지
├── components/
│   ├── ui/
│   │   └── sheet.tsx                    # [신규] shadcn/ui Sheet 컴포넌트
│   └── counseling/
│       ├── CounselingSessionForm.tsx    # [수정] 상담 폼
│       ├── AISupportPanel.tsx           # [신규] AI 지원 사이드 패널
│       ├── PersonalitySummaryCard.tsx   # [신규] 성향 요약 카드
│       ├── CompatibilityScoreCard.tsx   # [신규] 궁합 점수 카드
│       └── AISummaryGenerator.tsx       # [신규] AI 요약 생성 컴포넌트
└── lib/
    ├── db/
    │   ├── personality-summary.ts       # [기존] 성향 통합 조회
    │   └── compatibility-result.ts      # [기존] 궁합 결과 조회
    └── actions/
        └── counseling-ai.ts             # [신규] AI 지원 Server Actions
```

### Pattern 1: Side Panel with Sheet Component
**What:** Radix UI Dialog 기반 Sheet 컴포넌트로 사이드 패널 구현
**When to use:** 상담 폼 옆에 컨텍스트 정보를 표시할 때
**Example:**
```typescript
// Source: shadcn/ui Sheet documentation
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function AISupportPanel({ studentId, teacherId, isOpen, onOpenChange }) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>AI 상담 지원</SheetTitle>
          <SheetDescription>
            학생의 성향 분석과 궁합 점수를 참고하세요
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <PersonalitySummaryCard studentId={studentId} teacherId={teacherId} />
          <CompatibilityScoreCard studentId={studentId} teacherId={teacherId} />
          <AISummaryGenerator sessionId={sessionId} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

### Pattern 2: AI Summary Generation with Prompt Context
**What:** 상담 내용 + 성향 정보 + 이전 이력을 종합한 AI 요약 생성
**When to use:** 선생님이 "AI 요약" 버튼을 클릭할 때
**Example:**
```typescript
// Source: Phase 15 LLM Router + Phase 6 Integration Prompts
import { generateWithProvider } from "@/lib/ai/router"
import { getUnifiedPersonalityData } from "@/lib/db/personality-summary"
import { db } from "@/lib/db"

export async function generateCounselingSummary(
  sessionId: string,
  teacherId: string
): Promise<string> {
  // 상담 세션 조회
  const session = await db.counselingSession.findUnique({
    where: { id: sessionId },
    include: {
      student: true,
    },
  })

  if (!session) throw new Error("Session not found")

  // 학생 성향 정보 조회
  const personality = await getUnifiedPersonalityData(
    session.studentId,
    teacherId
  )

  // 이전 상담 이력 조회 (최근 3개)
  const previousSessions = await db.counselingSession.findMany({
    where: {
      studentId: session.studentId,
      id: { not: sessionId },
    },
    orderBy: { sessionDate: "desc" },
    take: 3,
    select: {
      summary: true,
      sessionDate: true,
      type: true,
    },
  })

  // 프롬프트 생성
  const prompt = buildCounselingSummaryPrompt({
    currentSummary: session.summary,
    sessionDate: session.sessionDate,
    sessionType: session.type,
    personality,
    previousSessions,
    studentName: session.student.name,
  })

  // LLM 라우터로 요약 생성
  const result = await generateWithProvider({
    prompt,
    featureType: "counseling_suggest",
    teacherId,
    maxOutputTokens: 500,
    temperature: 0.3, // 낮은 온도로 일관된 요약
  })

  return result.text
}
```

### Pattern 3: Pre-generated Personality Summary
**What:** 학생 분석 완료 시 성향 요약 문장을 미리 생성하여 DB 저장
**When to use:** PersonalitySummary 생성/업데이트 시점
**Example:**
```typescript
// Source: Phase 6 Personality Integration + NEW
import { generateWithProvider } from "@/lib/ai/router"
import { getUnifiedPersonalityData } from "@/lib/db/personality-summary"

export async function generatePersonalitySummary(
  studentId: string,
  teacherId: string
): Promise<string> {
  const personality = await getUnifiedPersonalityData(studentId, teacherId)

  if (!personality) throw new Error("No personality data")

  const prompt = `
다음 학생의 성향 분석 결과를 1-2문장으로 요약하세요.
선생님이 상담 시 빠르게 참고할 수 있도록 핵심만 간결하게 작성하세요.

## 분석 결과
- MBTI: ${personality.mbti.result?.mbtiType || '미분석'}
- 사주: ${personality.saju.interpretation ? '완료' : '미분석'}
- 성명학: ${personality.name.interpretation ? '완료' : '미분석'}
- 관상: ${personality.face.result ? '완료' : '미분석'}
- 손금: ${personality.palm.result ? '완료' : '미분석'}

## 상세 해석
${personality.saju.interpretation || ''}
${personality.name.interpretation || ''}

1-2문장으로 요약:
`.trim()

  const result = await generateWithProvider({
    prompt,
    featureType: "learning_analysis",
    teacherId,
    maxOutputTokens: 150,
    temperature: 0.3,
  })

  return result.text
}

// PersonalitySummary 업데이트 시점에 실행
export async function updatePersonalitySummaryWithAI(
  studentId: string,
  teacherId: string
) {
  const summaryText = await generatePersonalitySummary(studentId, teacherId)

  // Student 모델에 personalitySummary 필드 추가 필요
  await db.student.update({
    where: { id: studentId },
    data: {
      // personalitySummary 필드를 Student 모델에 추가해야 함
      // 또는 PersonalitySummary 테이블에 shortSummary 필드 추가
    },
  })
}
```

### Pattern 4: Compatibility Score Display with Interpretation
**What:** 숫자 점수와 해석 텍스트를 함께 표시, 세부 항목 펼치기 가능
**When to use:** AI 지원 패널에서 궁합 점수 표시 시
**Example:**
```typescript
// Source: Phase 13 Compatibility + NEW
import { getCompatibilityResult } from "@/lib/db/compatibility-result"

export async function CompatibilityScoreCard({ studentId, teacherId }) {
  const compatibility = await getCompatibilityResult(teacherId, studentId)

  if (!compatibility) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>궁합 점수</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            궁합 점수가 아직 계산되지 않았습니다.
          </p>
          <Button onClick={handleCalculate} variant="outline" size="sm">
            지금 계산하기
          </Button>
        </CardContent>
      </Card>
    )
  }

  const { overallScore, breakdown, reasons } = compatibility
  const interpretation = getScoreInterpretation(overallScore)
  const tipMessage = getTeachingTip(overallScore, breakdown)

  return (
    <Card>
      <CardHeader>
        <CardTitle>궁합 점수</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold">{overallScore}점</div>
          <Badge variant={overallScore >= 70 ? "default" : "secondary"}>
            {interpretation}
          </Badge>
        </div>

        <Collapsible className="mt-4">
          <CollapsibleTrigger className="text-sm text-muted-foreground">
            세부 항목 보기
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span>MBTI 궁합</span>
              <span>{breakdown.mbti}점</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>사주 궁합</span>
              <span>{breakdown.saju}점</span>
            </div>
            {/* 기타 세부 항목 */}
          </CollapsibleContent>
        </Collapsible>

        {tipMessage && (
          <Alert className="mt-4">
            <AlertTitle>상담 팁</AlertTitle>
            <AlertDescription>{tipMessage}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

function getScoreInterpretation(score: number): string {
  if (score >= 80) return "매우 좋은 궁합"
  if (score >= 70) return "좋은 궁합"
  if (score >= 60) return "보통 궁합"
  return "노력이 필요한 궁합"
}

function getTeachingTip(score: number, breakdown: any): string | null {
  if (score < 60) {
    return "이 학생과는 천천히 진행하며, 자주 피드백을 확인하세요."
  }
  if (breakdown.mbti < 50) {
    return "성격 차이가 있을 수 있으니 공감적 소통을 강조하세요."
  }
  return null
}
```

### Pattern 5: AI Summary Button with Transparency
**What:** 명확한 트리거, 재생성 옵션, 수정 가능성을 제공하는 AI 요약 버튼
**When to use:** 상담 폼에서 AI 요약 생성 시
**Example:**
```typescript
// Source: AI UX Best Practices 2026
export function AISummaryGenerator({ sessionId, currentSummary, onSummaryGenerated }) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedSummary, setGeneratedSummary] = useState<string | null>(null)
  const [showRegenerate, setShowRegenerate] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const result = await generateCounselingSummaryAction(sessionId)
      if (result.success) {
        setGeneratedSummary(result.data)
        setShowRegenerate(true)
        toast.success("AI 요약이 생성되었습니다")
      }
    } catch (error) {
      toast.error("요약 생성에 실패했습니다")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleApply = () => {
    onSummaryGenerated(generatedSummary)
    toast.success("요약이 적용되었습니다. 수정하실 수 있습니다.")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          AI 요약
        </CardTitle>
        <CardDescription>
          상담 내용과 학생 성향을 고려한 요약을 생성합니다
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!generatedSummary ? (
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? "생성 중..." : "AI 요약 생성"}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="p-4 border rounded-md bg-muted/50">
              <p className="text-sm whitespace-pre-wrap">{generatedSummary}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleApply} className="flex-1">
                요약 적용
              </Button>
              <Button
                onClick={handleGenerate}
                variant="outline"
                disabled={isGenerating}
              >
                다시 생성
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              💡 적용 후에도 직접 수정할 수 있습니다
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

### Anti-Patterns to Avoid
- **자동 요약 생성:** 선생님이 원하지 않는데 비용 발생, 수동 트리거로 제어권 보장
- **성향 요약 실시간 생성:** 상담 화면에서 매번 생성하면 느림, 미리 생성하여 DB 저장
- **Sheet 외부에서 데이터 fetch:** Sheet 내부 컴포넌트에서 Server Actions로 데이터 조회
- **궁합 점수 없을 때 에러:** 계산되지 않은 경우 "지금 계산하기" 버튼 제공
- **AI 요약 후 수정 불가:** 요약은 초안일 뿐, 선생님이 최종 수정할 수 있어야 함

## Don't Hand-Roll

직접 구현하지 말고 기존 솔루션을 사용해야 하는 문제들:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| LLM 프롬프트 구조화 | 직접 문자열 템플릿 | 프롬프트 빌더 함수 (Phase 6 패턴) | 유지보수성, 테스트 용이성 |
| 성향 데이터 통합 조회 | 직접 Prisma include | getUnifiedPersonalityData (Phase 6) | 이미 검증된 함수, 일관성 |
| 궁합 점수 조회 | 직접 Prisma findUnique | getCompatibilityResult (Phase 13) | 이미 검증된 함수 |
| 사이드 패널 구현 | CSS transform 직접 구현 | shadcn/ui Sheet (Radix Dialog) | 접근성, 포커스 관리, 모바일 최적화 |
| LLM 호출 | 직접 Anthropic SDK | generateWithProvider (Phase 15) | 폴백, 비용 추적, 통합 라우팅 |
| 폼 검증 | 직접 useState 검증 | React Hook Form + Zod | 성능, 타입 안전성, 접근성 |

**Key insight:** Phase 6, 13, 15에서 구축한 인프라를 최대한 재사용합니다. 새로운 분석 기능을 추가하는 것이 아니라, 기존 데이터를 상담 화면에 효과적으로 표시하는 것이 핵심입니다.

## Common Pitfalls

### Pitfall 1: 모바일 반응형 미고려
**What goes wrong:** Sheet가 작은 화면에서 전체 화면을 가려 폼을 사용할 수 없음
**Why it happens:** 고정된 width 설정, 화면 크기 체크 없음
**How to avoid:**
- 모바일에서는 Sheet를 bottom으로 변경하거나 Accordion으로 폼 상단에 표시
- `className="w-full sm:w-[540px]"`로 반응형 width 설정
- CONTEXT.md "Claude's Discretion"에 명시: 모바일 최적화 방식 결정
**Warning signs:** 모바일 테스트 시 폼과 패널이 동시에 보이지 않음

### Pitfall 2: 성향 요약을 매번 LLM으로 생성
**What goes wrong:** 상담 화면 로드가 느려지고, LLM 비용이 불필요하게 증가
**Why it happens:** 성향 요약이 자주 변하지 않는다는 것을 간과함
**How to avoid:**
- 학생 분석 완료 시점(PersonalitySummary 생성/업데이트)에 요약 생성
- DB에 저장 (Student.personalitySummary 또는 PersonalitySummary.shortSummary)
- 상담 화면에서는 저장된 요약만 표시
**Warning signs:** 상담 화면 로드 시 LLM 호출이 발생함

### Pitfall 3: 궁합 점수가 없을 때 에러 처리 부족
**What goes wrong:** 궁합 점수가 계산되지 않은 학생에게 에러 발생
**Why it happens:** getCompatibilityResult가 null을 반환할 수 있음을 간과
**How to avoid:**
- null 체크 후 "아직 계산되지 않았습니다" 메시지 표시
- "지금 계산하기" 버튼 제공 (Server Action으로 계산 트리거)
- 상담 화면 진입 시 필요한 데이터가 있으면 자동 계산 (CONTEXT.md 결정사항)
**Warning signs:** 신규 학생이나 궁합 미계산 학생에서 에러 발생

### Pitfall 4: AI 요약을 자동으로 summary 필드에 저장
**What goes wrong:** 선생님이 확인하지 않은 AI 요약이 저장되어 품질 문제 발생
**Why it happens:** 자동화를 과도하게 적용함
**How to avoid:**
- AI 요약은 별도 필드(aiSummary)에 저장 (CONTEXT.md 결정사항)
- "요약 적용" 버튼으로 선생님이 명시적으로 승인
- 적용 후에도 텍스트 필드에서 직접 수정 가능
**Warning signs:** 선생님이 AI 요약을 확인하지 않고 저장됨

### Pitfall 5: Server Actions에서 동기 유틸리티 함수 export
**What goes wrong:** Next.js가 "use server" 파일의 모든 export를 Server Action으로 간주하여 타입 오류 발생
**Why it happens:** Phase 21에서도 동일한 문제 발생 (getDateRangeFromPreset)
**How to avoid:**
- "use server" 파일에서는 async 함수만 export
- 동기 유틸리티 함수는 별도 파일로 분리 (`src/lib/utils/` 디렉토리)
- 프롬프트 빌더 함수는 `src/lib/ai/counseling-prompts.ts`로 분리
**Warning signs:** 빌드 시 "Server Actions must be async functions" 오류

### Pitfall 6: 상담 이력 조회 시 권한 검증 누락
**What goes wrong:** 다른 선생님의 상담 이력이 노출됨
**Why it happens:** teacherId 필터를 누락하고 studentId만으로 조회
**How to avoid:**
- 모든 상담 이력 조회 시 `where: { studentId, teacherId }` 필터 적용
- Phase 11에서 구축한 RLS + Prisma Extensions가 자동 필터링하지만, 명시적 체크 추가
**Warning signs:** 보안 테스트 시 권한 없는 데이터 접근 가능

## Code Examples

검증된 패턴의 공식 소스:

### Counseling Summary Prompt Builder
```typescript
// Source: Phase 6 Integration Prompts + NEW
// File: src/lib/ai/counseling-prompts.ts

interface CounselingSummaryPromptParams {
  currentSummary: string
  sessionDate: Date
  sessionType: string
  personality: UnifiedPersonalityData | null
  previousSessions: Array<{
    summary: string
    sessionDate: Date
    type: string
  }>
  studentName: string
}

export function buildCounselingSummaryPrompt(
  params: CounselingSummaryPromptParams
): string {
  const {
    currentSummary,
    sessionDate,
    sessionType,
    personality,
    previousSessions,
    studentName
  } = params

  // 성향 정보 포맷팅
  let personalitySection = ""
  if (personality) {
    const analyses = []
    if (personality.mbti.result) {
      analyses.push(`MBTI: ${personality.mbti.result.mbtiType}`)
    }
    if (personality.saju.interpretation) {
      analyses.push(`사주: ${personality.saju.interpretation.slice(0, 100)}...`)
    }
    if (analyses.length > 0) {
      personalitySection = `\n## 학생 성향\n${analyses.join('\n')}`
    }
  }

  // 이전 상담 이력 포맷팅
  let historySection = ""
  if (previousSessions.length > 0) {
    const historyLines = previousSessions.map(s =>
      `- ${s.sessionDate.toLocaleDateString()} (${s.type}): ${s.summary.slice(0, 80)}...`
    )
    historySection = `\n## 이전 상담 이력\n${historyLines.join('\n')}`
  }

  return `
너는 한국 학원의 상담 기록 전문가야.

학생: ${studentName}
상담 일자: ${sessionDate.toLocaleDateString()}
상담 유형: ${sessionType}

## 오늘 상담 내용
${currentSummary}
${personalitySection}
${historySection}

위 정보를 바탕으로 다음 요구사항에 맞는 상담 요약을 작성해주세요:

1. **핵심 내용 요약** (3-5문장)
   - 오늘 상담의 주요 내용
   - 학생의 현재 상태 (학습, 심리적 측면)

2. **주요 합의 사항** (있는 경우)
   - 학생과 함께 정한 목표나 계획

3. **선생님 관찰 사항** (2-3문장)
   - 학생의 태도, 반응, 특이사항
   - 성향 분석과 연관된 행동 패턴 (있는 경우)

4. **후속 조치 제안** (필요 시)
   - 다음 상담에서 다룰 내용
   - 추가로 확인이 필요한 사항

**중요:**
- 간결하고 객관적으로 작성
- 학생의 긍정적인 면을 강조
- 전문적이고 존중하는 톤 유지
- 불필요한 추측 배제

**출력 형식 (Markdown):**
### 핵심 내용
[내용]

### 합의 사항
[내용]

### 관찰 사항
[내용]

### 후속 조치
[내용]
`.trim()
}
```

### Sheet Side Panel with Data Fetching
```typescript
// Source: shadcn/ui Sheet + NEW
// File: src/components/counseling/AISupportPanel.tsx

"use client"

import { useEffect, useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { getStudentAISupportDataAction } from "@/lib/actions/counseling-ai"

interface AISupportPanelProps {
  studentId: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function AISupportPanel({
  studentId,
  isOpen,
  onOpenChange
}: AISupportPanelProps) {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && !data) {
      setIsLoading(true)
      getStudentAISupportDataAction(studentId)
        .then(result => {
          if (result.success) {
            setData(result.data)
          }
        })
        .finally(() => setIsLoading(false))
    }
  }, [isOpen, studentId, data])

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[540px] overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>AI 상담 지원</SheetTitle>
          <SheetDescription>
            학생의 성향 분석과 궁합 점수를 참고하세요
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        ) : (
          <div className="space-y-4 mt-6">
            {data?.personalitySummary && (
              <PersonalitySummaryCard
                summary={data.personalitySummary}
              />
            )}

            {data?.compatibility && (
              <CompatibilityScoreCard
                score={data.compatibility}
              />
            )}

            {!data?.personalitySummary && (
              <div className="text-center text-muted-foreground">
                <p>아직 성향 분석이 완료되지 않았습니다</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => router.push(`/students/${studentId}`)}
                >
                  분석 시작하기
                </Button>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
```

### Server Action for AI Support Data
```typescript
// Source: Phase 11 Server Actions Pattern + NEW
// File: src/lib/actions/counseling-ai.ts

"use server"

import { z } from "zod"
import { verifySession } from "@/lib/auth/session"
import { getUnifiedPersonalityData } from "@/lib/db/personality-summary"
import { getCompatibilityResult } from "@/lib/db/compatibility-result"
import { db } from "@/lib/db"

const studentIdSchema = z.string().cuid()

export async function getStudentAISupportDataAction(studentId: string) {
  try {
    const validatedStudentId = studentIdSchema.parse(studentId)
    const session = await verifySession()

    if (!session) {
      return { success: false, error: "Unauthorized" }
    }

    // 권한 확인: 해당 학생의 담당 선생님인지 체크
    const student = await db.student.findFirst({
      where: {
        id: validatedStudentId,
        teacherId: session.userId,
      },
      select: {
        id: true,
        name: true,
        personalitySummary: true, // 미리 생성된 성향 요약
      },
    })

    if (!student) {
      return { success: false, error: "Student not found" }
    }

    // 궁합 점수 조회
    const compatibility = await getCompatibilityResult(
      session.userId,
      validatedStudentId
    )

    // 궁합 점수가 없으면 자동 계산 (CONTEXT.md 결정사항)
    if (!compatibility) {
      // Phase 13 calculateAndStoreCompatibility 함수 호출
      // 여기서는 생략, 실제 구현 시 추가
    }

    return {
      success: true,
      data: {
        studentName: student.name,
        personalitySummary: student.personalitySummary,
        compatibility: compatibility ? {
          overallScore: compatibility.overallScore,
          breakdown: compatibility.breakdown,
          reasons: compatibility.reasons,
        } : null,
      },
    }
  } catch (error) {
    console.error("Get AI support data error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

export async function generateCounselingSummaryAction(sessionId: string) {
  try {
    const session = await verifySession()
    if (!session) {
      return { success: false, error: "Unauthorized" }
    }

    // 상담 세션 조회 (권한 확인 포함)
    const counselingSession = await db.counselingSession.findFirst({
      where: {
        id: sessionId,
        teacherId: session.userId,
      },
      include: {
        student: true,
      },
    })

    if (!counselingSession) {
      return { success: false, error: "Session not found" }
    }

    // AI 요약 생성 (위 Pattern 2 참고)
    const summary = await generateCounselingSummary(sessionId, session.userId)

    return { success: true, data: summary }
  } catch (error) {
    console.error("Generate summary error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Drawer 라이브러리 (react-drawer) | Radix UI Dialog + Sheet | 2024-2025 | 접근성 개선, 모바일 최적화 |
| 직접 LLM API 호출 | Vercel AI SDK | 2024 | 통합 인터페이스, 비용 추적 |
| 프롬프트 문자열 하드코딩 | 프롬프트 빌더 함수 | 2025 | 유지보수성, 테스트 가능성 |
| 자동 AI 요약 | 수동 트리거 AI 요약 | 2025-2026 | 비용 절감, 선생님 제어권 |
| shadcn/ui 개별 패키지 | 통합 radix-ui 패키지 | 2026-02 | 의존성 단순화 |

**Deprecated/outdated:**
- `react-drawer`: Radix UI Dialog 기반 Sheet로 대체
- 프롬프트 문자열 직접 작성: 빌더 함수 패턴 사용
- 자동 AI 요약: 수동 트리거로 변경 (비용 + 품질 제어)

## Open Questions

완전히 해결하지 못한 사항:

1. **성향 요약 저장 위치**
   - What we know: 미리 생성한 요약 문장을 DB에 저장해야 함
   - What's unclear: Student.personalitySummary (새 필드) vs PersonalitySummary.shortSummary (기존 테이블)
   - Recommendation: Student.personalitySummary TEXT 필드 추가 (간단, 조인 불필요)

2. **모바일 사이드 패널 처리**
   - What we know: 작은 화면에서 Sheet가 전체를 가림
   - What's unclear: bottom Sheet vs Accordion vs Tab 중 어느 것이 최선?
   - Recommendation: CONTEXT.md "Claude's Discretion"에 명시됨, Planner가 결정

3. **궁합 점수 자동 계산 시점**
   - What we know: 상담 화면 진입 시 필요한 데이터가 있으면 자동 계산 (CONTEXT.md)
   - What's unclear: "필요한 데이터"의 기준? (분석 중 하나라도 있으면? 모두 있어야?)
   - Recommendation: Phase 13 calculateCompatibilityScore 함수의 로직 확인 필요

4. **AI 요약 재생성 횟수 제한**
   - What we know: 재생성 버튼 제공 (CONTEXT.md)
   - What's unclear: 무제한 재생성 허용? 비용 제어를 위한 제한?
   - Recommendation: 초기에는 제한 없음, Phase 15 사용량 모니터링 후 조정

## Sources

### Primary (HIGH confidence)
- Phase 15 RESEARCH.md - Multi-LLM Integration, generateWithProvider 사용법
- Phase 6 integration-prompts.ts - 프롬프트 빌더 패턴
- Phase 13 compatibility-result.ts - 궁합 점수 조회 함수
- [shadcn/ui Sheet](https://www.shadcn.io/ui/sheet) - Sheet 컴포넌트 공식 문서
- [React Hook Form](https://react-hook-form.com/) - 폼 검증 공식 문서
- [AI SDK Documentation](https://ai-sdk.dev/cookbook/next/stream-text) - Vercel AI SDK 스트리밍

### Secondary (MEDIUM confidence)
- [⚡ Next.js 15 and the Future of Web Development in 2026](https://medium.com/@ektakumari8872/next-js-15-and-the-future-of-web-development-in-2026-streaming-server-actions-and-beyond-d0a8f090ce40) - Server Actions 패턴
- [AI UX Patterns | Summary](https://www.shapeof.ai/patterns/summary) - AI 요약 UX 베스트 프랙티스
- [February 2026 - Unified Radix UI Package](https://ui.shadcn.com/docs/changelog/2026-02-radix-ui) - Radix UI 통합 패키지 업데이트
- [React Hook Form with Zod: Complete Guide for 2026](https://dev.to/marufrahmanlive/react-hook-form-with-zod-complete-guide-for-2026-1em1) - Zod 검증 패턴

### Tertiary (LOW confidence)
- WebSearch: "React side panel counseling form UI pattern 2026" - 일반적인 UI 라이브러리 정보
- WebSearch: "AI summary generation button UX best practices 2026" - UX 가이드라인

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - 이미 프로젝트에 설치된 패키지, Phase 15에서 검증됨
- Architecture: HIGH - Phase 6, 13, 15의 기존 패턴 재사용
- Pitfalls: HIGH - Phase 21에서 동일한 문제 발생 확인 (Server Actions)
- Prompts: MEDIUM - 프롬프트 구조는 검증 필요
- Mobile UX: MEDIUM - CONTEXT.md에서 Claude's Discretion으로 명시

**Research date:** 2026-02-05
**Valid until:** 2026-03-05 (30 days - UI 라이브러리는 안정적)
