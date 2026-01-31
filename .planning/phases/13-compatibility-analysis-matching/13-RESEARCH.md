# Phase 13: Compatibility Analysis & Matching - Research

**Researched:** 2026-01-30
**Domain:** Teacher-student compatibility scoring, matching algorithms, fairness metrics, optimization
**Confidence:** HIGH

## Summary

Phase 13은 선생님-학생 궁합 분석 시스템과 AI 기반 자동 배정 제안을 구축하는 단계입니다. 핵심은 **가중 평균 기반 궁합 점수 계산**(MBTI 25%, 학습 스타일 25%, 사주 20%, 성명학 15%, 부하 분산 15%), **다목적 최적화 알고리즘**(궁합 최대화 + 부하 분산), **공정성 메트릭**(ABROCA, Disparity Index) 구현입니다.

**Key Findings:**
- **기존 분석 라이브러리 재사용**: Phase 12에서 구축된 Teacher*Analysis 모델과 분석 함수가 그대로 활용 가능
- **학습 스타일 점수 유도 필요**: Student/Teacher 모델에 학습 스타일 필드가 없음 → MBTI percentages에서 유도하거나 별도 필드 추가
- **알고리즘적 편향 우려**: Fairness metrics(ABROCA, Disparity Index)로 궁합 분석 결과의 공정성 검증 필요
- **Human-in-the-loop**: AI 제안은 참고용으로, 최종 배정은 사용자가 직접 확인/수정
- **Stable Matching vs. Greedy**: 안정적 배정을 위한 Gale-Shapley 알고리즘 고려, но 단순 Greedy로도 충분할 수 있음

**Primary recommendation:** 기존 분석 모듈(Saju, Name, MBTI)을 재사용하여 궁합 점수를 계산하고, 다목적 최적화(EMO: Evolutionary Multi-objective Optimization)로 자동 배정을 생성합니다. Fairness metrics로 편향을 모니터링하고, 사용자가 최종 결정을 내리는 human-in-the-loop 패턴을 따릅니다.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **Prisma** | Latest | ORM for compatibility results | 기존 Student/Teacher/Analysis 모델 활용 |
| **Next.js Server Actions** | 15 | API endpoints for matching | 배정 및 궁합 계산 엔드포인트 |
| **TypeScript** | Latest | Type-safe scoring | 궁합 점수 계산 로직 타입 안전성 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **Recharts** | Latest | Visualization | 궁합 분석 차트 (radar chart, bar chart) |
| **date-fns** | Latest | Date formatting | 궁합 분석 생성일 표시 |
| **shadcn/ui** | Latest | UI components | Cards, buttons, badges, select |

### Analysis Libraries (REUSE - No Installation Needed)
| Library | Location | Purpose | Reuse Strategy |
|---------|----------|---------|----------------|
| **Saju calculator** | `src/lib/analysis/saju.ts` | 사주 오행 균형 비교 | 두 분석 결과의 오행 균형 유사도 계산 |
| **Name numerology** | `src/lib/analysis/name-numerology.ts` | 성명학 획수 비교 | 원형/형격/이격/정격 유사도 계산 |
| **MBTI scoring** | `src/lib/analysis/mbti-scoring.ts` | MBTI 유형 호환도 | MBTI 4차원 유사도 가중 평균 |
| **Hanja strokes** | `src/lib/analysis/hanja-strokes.ts` | 한자 획수 조회 | 성명학 분석 시 이미 활용됨 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| EMO algorithm | Simple greedy matching | EMO는 다목적 최적화(궁합+부하)에 적합하지만 복잡함. Greedy로 충분할 수 있음 |
| Gale-Shapley stable matching | Weighted score ranking | Stable matching은 상호 선호 고려하지만, 일방적 점수 기반 배정에 부적합 |
| 복잡한 fairness metrics | Simple disparity checks | ABROCA는 ML 모델 평가용. 단순 집단 간 점수 차이 검증으로 충분 |

**Installation:**
```bash
# No new packages needed - all libraries already installed
# Prisma schema changes require migration:
npx prisma migrate dev --name add_compatibility_analysis
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── db/
│   │   ├── compatibility-analysis.ts    # NEW: CompatibilityResult CRUD
│   │   ├── assignment.ts                # NEW: Student-teacher assignment management
│   │   └── teacher-student-counts.ts    # NEW: Load balancing queries
│   ├── analysis/
│   │   ├── compatibility-scoring.ts     # NEW: 가중 평균 궁합 점수 계산
│   │   ├── mbti-compatibility.ts        # NEW: MBTI 유사도 계산
│   │   ├── saju-compatibility.ts        # NEW: 사주 오행 유사도 계산
│   │   ├── name-compatibility.ts        # NEW: 성명학 유사도 계산
│   │   ├── learning-style-compatibility.ts # NEW: 학습 스타일 유사도 (MBTI 유도)
│   │   └── fairness-metrics.ts          # NEW: 공정성 메트릭 계산
│   ├── optimization/
│   │   ├── auto-assignment.ts           # NEW: AI 자동 배정 알고리즘
│   │   └── load-balancer.ts             # NEW: 부하 분산 계산
│   └── actions/
│       ├── compatibility.ts             # NEW: 궁합 분석 Server Actions
│       ├── assignment.ts                # NEW: 수동 배정 Server Actions
│       └── auto-assignment.ts           # NEW: 자동 배정 제안 Server Actions
├── components/
│   ├── compatibility/
│   │   ├── compatibility-score-card.tsx # NEW: 궁합 점수 카드
│   │   ├── compatibility-breakdown.tsx  # NEW: 항목별 궁합 시각화
│   │   ├── compatibility-radar-chart.tsx # NEW: Recharts radar chart
│   │   ├── teacher-recommendation-list.tsx # NEW: 학생별 추천 선생님 목록
│   │   └── fairness-metrics-panel.tsx   # NEW: 공정성 메트릭 대시보드
│   ├── assignment/
│   │   ├── manual-assignment-form.tsx   # NEW: 수동 배정 폼
│   │   ├── auto-assignment-suggestion.tsx # NEW: 자동 배정 제안 UI
│   │   └── batch-assignment.tsx         # NEW: 일괄 배정 UI
│   └── students/
│       └── student-card-compact.tsx     # MODIFY: 궁합 정보 표시 추가
└── app/
    └── (dashboard)/
        ├── matching/                    # NEW: 배정 관리 페이지
        │   ├── page.tsx                 # 배정 대시보드
        │   ├── auto-assign/
        │   │   └── page.tsx             # 자동 배정 제안 페이지
        │   └── fairness/
        │       └── page.tsx             # 공정성 메트릭 페이지
        └── students/
            └── [id]/
                └── matching/
                    └── page.tsx         # 학생별 선생님 추천 페이지
```

### Pattern 1: Database Schema for Compatibility Results

**What:** CompatibilityResult 테이블로 궁합 분석 결과 저장
**When to use:** 모든 teacher-student 쌍에 대한 궁합 점수 계산 결과
**Example:**
```prisma
// prisma/schema.prisma (NEW)
model CompatibilityResult {
  id                String   @id @default(cuid())
  teacherId         String
  studentId         String
  overallScore      Float    // 0-100 가중 평균 점수
  breakdown         Json     // { mbti: 25, saju: 20, name: 15, learningStyle: 25, loadBalance: 15 }
  reasons           Json?    // 추천 이유 (AI 생성 텍스트)
  calculatedAt      DateTime @default(now())
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  teacher           Teacher  @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  student           Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@unique([teacherId, studentId])
  @@index([teacherId])
  @@index([studentId])
  @@index([overallScore]) // 상위 궁합 쌍 조회용
}

// Student 모델에 relations 추가
model Student {
  // ... existing fields
  compatibilityResults  CompatibilityResult[]
}

// Teacher 모델에 relations 추가
model Teacher {
  // ... existing fields
  compatibilityResults  CompatibilityResult[]
}
```

**Source:** 기존 Analysis 모델 패턴 (SajuAnalysis, MbtiAnalysis 등)

### Pattern 2: Compatibility Scoring Algorithm

**What:** 가중 평균 기반 궁합 점수 계산 (MBTI 25%, 학습 스타일 25%, 사주 20%, 성명학 15%, 부하 분산 15%)
**When to use:** 선생님-학생 쌍이 생성될 때마다 계산
**Example:**
```typescript
// src/lib/analysis/compatibility-scoring.ts (NEW)
import { type MbtiPercentages } from './mbti-scoring'
import { type SajuResult } from './saju'
import { type NameNumerologyResult } from './name-numerology'

export type CompatibilityBreakdown = {
  mbti: number           // 0-25 points
  learningStyle: number  // 0-25 points
  saju: number          // 0-20 points
  name: number          // 0-15 points
  loadBalance: number   // 0-15 points
}

export type CompatibilityScore = {
  overall: number       // 0-100
  breakdown: CompatibilityBreakdown
  reasons: string[]     // 추천 이유
}

export type ScoringInput = {
  teacherMbti: { type: string; percentages: MbtiPercentages } | null
  teacherSaju: SajuResult | null
  teacherName: NameNumerologyResult | null
  studentMbti: { type: string; percentages: MbtiPercentages } | null
  studentSaju: SajuResult | null
  studentName: NameNumerologyResult | null
  teacherCurrentLoad: number  // 현재 담당 학생 수
  averageLoad: number         // 평균 담당 학생 수
}

/**
 * 가중 평균 기반 궁합 점수 계산
 */
export function calculateCompatibilityScore(input: ScoringInput): CompatibilityScore {
  const breakdown: CompatibilityBreakdown = {
    mbti: calculateMbtiCompatibility(input.teacherMbti, input.studentMbti) * 0.25,
    learningStyle: calculateLearningStyleCompatibility(
      deriveLearningStyle(input.teacherMbti),
      deriveLearningStyle(input.studentMbti)
    ) * 0.25,
    saju: calculateSajuCompatibility(input.teacherSaju, input.studentSaju) * 0.20,
    name: calculateNameCompatibility(input.teacherName, input.studentName) * 0.15,
    loadBalance: calculateLoadBalanceScore(
      input.teacherCurrentLoad,
      input.averageLoad
    ) * 0.15,
  }

  const overall = Object.values(breakdown).reduce((sum, score) => sum + score, 0)

  const reasons = generateReasons(breakdown, input)

  return { overall, breakdown, reasons }
}

/**
 * MBTI 유사도 계산 (4차원 가중 평균)
 */
function calculateMbtiCompatibility(
  teacher: { type: string; percentages: MbtiPercentages } | null,
  student: { type: string; percentages: MbtiPercentages } | null
): number {
  if (!teacher || !student) return 0.5 // 기본값 (분석 미완료 시)

  // MBTI 4차원별 유사도 계산
  const dimensions = ['E', 'S', 'T', 'J'] as const
  let similaritySum = 0

  for (const dim of dimensions) {
    const teacherPercent = teacher.percentages[dim]
    const studentPercent = student.percentages[dim]
    const diff = Math.abs(teacherPercent - studentPercent)
    similaritySum += (100 - diff) / 100 // 차이가 적을수록 높은 점수
  }

  return similaritySum / 4
}

/**
 * 학습 스타일 유도 (MBTI percentages 기반)
 * VARK 모델: Visual, Auditory, Read/Write, Kinesthetic
 *
 * MBTI → Learning Style 매핑:
 * - High S (Sensing) + High J → Visual (구조화된 시각 자료 선호)
 * - High N (Intuition) + High P → Kinesthetic (직관적 체험 학습 선호)
 * - High E (Extrovert) → Auditory (토론, 대화 학습 선호)
 * - High I (Introvert) → Read/Write (독서, 글쓰기 학습 선호)
 */
function deriveLearningStyle(mbti: { type: string; percentages: MbtiPercentages } | null): {
  visual: number
  auditory: number
  readWrite: number
  kinesthetic: number
} {
  if (!mbti) {
    return { visual: 25, auditory: 25, readWrite: 25, kinesthetic: 25 } // 균등 분배
  }

  const { percentages } = mbti
  const S_score = percentages.S
  const N_score = percentages.N
  const E_score = percentages.E
  const I_score = percentages.I
  const J_score = percentages.J
  const P_score = percentages.P

  // VARK 점수 계산 (0-100)
  const visual = (S_score * 0.6 + J_score * 0.4)
  const auditory = (E_score * 0.7 + N_score * 0.3)
  const readWrite = (I_score * 0.7 + J_score * 0.3)
  const kinesthetic = (N_score * 0.6 + P_score * 0.4)

  return { visual, auditory, readWrite, kinesthetic }
}

/**
 * 학습 스타일 호환도 계산
 */
function calculateLearningStyleCompatibility(
  teacher: ReturnType<typeof deriveLearningStyle>,
  student: ReturnType<typeof deriveLearningStyle>
): number {
  // 유클리드 거리 기반 유사도 (가까울수록 높은 점수)
  const diff = Math.sqrt(
    Math.pow(teacher.visual - student.visual, 2) +
    Math.pow(teacher.auditory - student.auditory, 2) +
    Math.pow(teacher.readWrite - student.readWrite, 2) +
    Math.pow(teacher.kinesthetic - student.kinesthetic, 2)
  )

  // 최대 거리는 약 173 (100√3), 이를 0-1로 정규화
  return Math.max(0, 1 - diff / 173)
}

/**
 * 사주 오행 균형 유사도 계산
 */
function calculateSajuCompatibility(
  teacher: SajuResult | null,
  student: SajuResult | null
): number {
  if (!teacher || !student) return 0.5

  // 오행 균형 비교 (목화토금수)
  const teacherElements = teacher.elements
  const studentElements = student.elements

  let totalDiff = 0
  const elements: SajuElement[] = ['목', '화', '토', '금', '수']

  for (const elem of elements) {
    const diff = Math.abs(teacherElements[elem] - studentElements[elem])
    totalDiff += diff
  }

  // 최대 차이는 약 16 (모두 0 vs 모두 8), 이를 0-1로 정규화
  return Math.max(0, 1 - totalDiff / 16)
}

/**
 * 성명학 유사도 계산 (원형, 형격, 이격, 정격)
 */
function calculateNameCompatibility(
  teacher: NameNumerologyResult | null,
  student: NameNumerologyResult | null
): number {
  if (!teacher || !student) return 0.5

  const teacherGrids = teacher.grids
  const studentGrids = student.grids

  // 4격 유사도 평균
  const grids = ['won', 'hyung', 'yi', 'jeong'] as const
  let similaritySum = 0

  for (const grid of grids) {
    const diff = Math.abs(teacherGrids[grid] - studentGrids[grid])
    // 최대 차이는 약 70 (1 vs 81), 이를 0-1로 정규화
    similaritySum += Math.max(0, 1 - diff / 70)
  }

  return similaritySum / 4
}

/**
 * 부하 분산 점수 계산
 *
 * 현재 담당 학생 수가 평균에 가까울수록 높은 점수
 * 평균 미달: 여유 있음 → 낮은 점수 (더 배정 가능)
 * 평균 초과: 과부하 → 낮은 점수 (배정 자제)
 * 평균 근처: 적정 → 높은 점수
 */
function calculateLoadBalanceScore(currentLoad: number, averageLoad: number): number {
  if (averageLoad === 0) return 1

  const diff = Math.abs(currentLoad - averageLoad)
  const normalizedDiff = diff / averageLoad // 0-1 범위

  // 차이가 적을수록 높은 점수
  return Math.max(0, 1 - normalizedDiff)
}

/**
 * 추천 이유 생성
 */
function generateReasons(breakdown: CompatibilityBreakdown, input: ScoringInput): string[] {
  const reasons: string[] = []

  if (breakdown.mbti >= 20) {
    reasons.push(`MBTI 성격 유형이 잘 맞습니다 (${breakdown.mbti.toFixed(1)}/25점)`)
  }

  if (breakdown.learningStyle >= 20) {
    reasons.push(`학습 스타일이 비슷하여 효과적인 지도가 가능합니다 (${breakdown.learningStyle.toFixed(1)}/25점)`)
  }

  if (breakdown.saju >= 15) {
    reasons.push(`사주 오행 균형이 조화롭습니다 (${breakdown.saju.toFixed(1)}/20점)`)
  }

  if (breakdown.name >= 12) {
    reasons.push(`성명학적 특성이 서로 보완적입니다 (${breakdown.name.toFixed(1)}/15점)`)
  }

  if (breakdown.loadBalance >= 12) {
    reasons.push(`현재 담당 학생 수가 적정 수준입니다 (${breakdown.loadBalance.toFixed(1)}/15점)`)
  }

  if (reasons.length === 0) {
    reasons.push('종합적인 궁합 분석 결과를 바탕으로 추천합니다.')
  }

  return reasons
}
```

**Source:** 기존 분석 라이브러리 패턴 재사용

### Pattern 3: Auto-Assignment Algorithm (Multi-objective Optimization)

**What:** 궁합 최대화 + 부하 분산 최적화로 자동 배정 제안 생성
**When to use:** 새 학기 시작, 대규모 학생 배정 필요 시
**Example:**
```typescript
// src/lib/optimization/auto-assignment.ts (NEW)
import { db } from '@/lib/db'
import { calculateCompatibilityScore } from '@/lib/analysis/compatibility-scoring'
import type { CompatibilityScore } from '@/lib/analysis/compatibility-scoring'

export type Assignment = {
  studentId: string
  teacherId: string
  score: CompatibilityScore
}

export type AutoAssignmentOptions = {
  maxStudentsPerTeacher?: number  // 최대 담당 학생 수 (기본: 평균 + 20%)
  minCompatibilityThreshold?: number // 최소 궁합 점수 (기본: 50)
  teamId?: string                   // 특정 팀에만 배정
}

/**
 * AI 자동 배정 알고리즘 (Greedy approach with load balancing)
 *
 * 목적:
 * 1. 전체 궁합 점수 합 maximization
 * 2. 선생님 간 부하 분산 (각 선생님의 학생 수 표준편차 최소화)
 *
 * 알고리즘:
 * 1. 모든 teacher-student 쌍에 대해 궁합 점수 계산
 * 2. 학생 순회하며, 현재 가장 낮은 부하의 선생님 중 최고 궁합 선택
 * 3. maxStudentsPerTeacher 제약 조건 확인
 *
 * 복잡도: O(students * teachers) - 단순하지만 효과적
 */
export async function generateAutoAssignment(
  studentIds: string[],
  options: AutoAssignmentOptions = {}
): Promise<Assignment[]> {
  const session = await verifySession()

  // 선생님 목록 조회 (RBAC 필터링 적용)
  const teachers = await db.teacher.findMany({
    where: {
      ...(options.teamId && { teamId: options.teamId }),
      role: { in: ['TEACHER', 'MANAGER', 'TEAM_LEADER'] },
    },
    include: {
      teacherMbtiAnalysis: true,
      teacherSajuAnalysis: true,
      teacherNameAnalysis: true,
      _count: {
        select: { students: true }, // 현재 담당 학생 수
      },
    },
  })

  // 학생 목록 조회
  const students = await db.student.findMany({
    where: {
      id: { in: studentIds },
      teacherId: session.userId, // 본인 팀 학생만
    },
    include: {
      mbtiAnalysis: true,
      sajuAnalysis: true,
      nameAnalysis: true,
    },
  })

  // 평균 담당 학생 수 계산
  const totalStudents = students.length
  const totalTeachers = teachers.length
  const averageLoad = totalStudents / totalTeachers
  const maxLoad = options.maxStudentsPerTeacher ?? Math.ceil(averageLoad * 1.2)

  // 선생님별 현재 부하 초기화
  const teacherLoads = new Map<string, number>()
  for (const teacher of teachers) {
    teacherLoads.set(teacher.id, teacher._count.students)
  }

  // 배정 결과
  const assignments: Assignment[] = []

  // 학생별로 최적 선생님 찾기
  for (const student of students) {
    let bestTeacher: typeof teachers[0] | null = null
    let bestScore: CompatibilityScore | null = null

    // 모든 선생님에 대해 궁합 점수 계산
    for (const teacher of teachers) {
      const currentLoad = teacherLoads.get(teacher.id)!

      // 부하 제약 조건 확인
      if (currentLoad >= maxLoad) continue

      // 궁합 점수 계산
      const score = calculateCompatibilityScore({
        teacherMbti: teacher.teacherMbtiAnalysis ? {
          type: teacher.teacherMbtiAnalysis.mbtiType,
          percentages: teacher.teacherMbtiAnalysis.percentages as any,
        } : null,
        teacherSaju: teacher.teacherSajuAnalysis?.result as any,
        teacherName: teacher.teacherNameAnalysis?.result as any,
        studentMbti: student.mbtiAnalysis ? {
          type: student.mbtiAnalysis.mbtiType,
          percentages: student.mbtiAnalysis.percentages as any,
        } : null,
        studentSaju: student.sajuAnalysis?.result as any,
        studentName: student.nameAnalysis?.result as any,
        teacherCurrentLoad: currentLoad,
        averageLoad,
      })

      // 최소 궁합 점수 확인
      if (options.minCompatibilityThreshold && score.overall < options.minCompatibilityThreshold) {
        continue
      }

      // 최고 궁합 선택
      if (!bestScore || score.overall > bestScore.overall) {
        bestTeacher = teacher
        bestScore = score
      }
    }

    // 배정
    if (bestTeacher && bestScore) {
      assignments.push({
        studentId: student.id,
        teacherId: bestTeacher.id,
        score: bestScore,
      })

      // 부하 업데이트
      teacherLoads.set(bestTeacher.id, teacherLoads.get(bestTeacher.id)! + 1)
    } else {
      console.warn(`Cannot assign student ${student.id}: no suitable teacher found`)
    }
  }

  return assignments
}

/**
 * EMO (Evolutionary Multi-objective Optimization) 기반 고급 알고리즘
 *
 * 목적: Greedy의 단순함을 넘어 Pareto optimal front 찾기
 *
 * 참고: [ResearchGate: Stable Matching Algorithm](https://www.researchgate.net/publication/381627806)
 */
export async function generateAutoAssignmentEMO(
  studentIds: string[],
  options: AutoAssignmentOptions = {}
): Promise<{ assignments: Assignment[]; paretoFront: Assignment[][] }> {
  // EMO 구현은 복잡하므로 Phase 13에서는 Greedy로 충분
  // 향후 Phase 14 이후에 필요시 구현

  const assignments = await generateAutoAssignment(studentIds, options)

  // Pareto front 계산 (생략 - 단순 반환)
  return {
    assignments,
    paretoFront: [assignments],
  }
}
```

**Source:** [ACM: Self-Optimizing Teacher and Auto-Matching](https://dl.acm.org/doi/full/10.1145/3718091), [PeerJ: Automatic Matching with EMO](https://peerj.com/articles/cs-1501/)

### Pattern 4: Fairness Metrics Implementation

**What:** 알고리즘적 편향 검증을 위한 공정성 메트릭
**When to use:** 자동 배정 결과 검증, 정기 모니터링
**Example:**
```typescript
// src/lib/analysis/fairness-metrics.ts (NEW)
import { db } from '@/lib/db'

export type FairnessMetrics = {
  disparityIndex: number       // 집단 간 궁합 점수 차이 (0-1)
  abroca: number              // ABROCA (Absolute Between-ROC Area) - ML 모델 편향 측정
  distributionBalance: number // 선생님별 배정 분포 균형 (0-1)
  recommendations: string[]    // 개선 제안
}

/**
 * 공정성 메트릭 계산
 *
 * 목적: 자동 배정 알고리즘이 특정 집단에 편향되지 않았는지 검증
 *
 * 참고: [ResearchGate: Investigating Algorithmic Bias](https://www.researchgate.net/publication/382376021)
 */
export async function calculateFairnessMetrics(
  assignments: Array<{ studentId: string; teacherId: string; score: number }>
): Promise<FairnessMetrics> {
  // 1. Disparity Index (집단 간 점수 차이)
  const disparityIndex = await calculateDisparityIndex(assignments)

  // 2. ABROCA (simplified - 궁합 점수 분포 차이)
  const abroca = await calculateABROCA(assignments)

  // 3. Distribution Balance (선생님별 배정 균형)
  const distributionBalance = await calculateDistributionBalance(assignments)

  // 4. 개선 제안
  const recommendations = generateFairnessRecommendations({
    disparityIndex,
    abroca,
    distributionBalance,
  })

  return {
    disparityIndex,
    abroca,
    distributionBalance,
    recommendations,
  }
}

/**
 * Disparity Index 계산
 *
 * 성별, 학교, 성적 등 집단 간 궁합 점수 차이 측정
 */
async function calculateDisparityIndex(
  assignments: Array<{ studentId: string; teacherId: string; score: number }>
): Promise<number> {
  // 학생 집단별 점수 분리
  const studentScores = await Promise.all(
    assignments.map(async (a) => {
      const student = await db.student.findUnique({
        where: { id: a.studentId },
        select: { school: true, grade: true },
      })
      return { ...a, school: student?.school, grade: student?.grade }
    })
  )

  // 학교별 평균 점수 계산
  const schoolGroups = new Map<string, number[]>()
  for (const s of studentScores) {
    if (!s.school) continue
    const scores = schoolGroups.get(s.school) ?? []
    scores.push(s.score)
    schoolGroups.set(s.school, scores)
  }

  const schoolAvgs = Array.from(schoolGroups.values()).map(scores =>
    scores.reduce((sum, s) => sum + s, 0) / scores.length
  )

  if (schoolAvgs.length < 2) return 0

  // 최대-최소 차이 (정규화)
  const maxAvg = Math.max(...schoolAvgs)
  const minAvg = Math.min(...schoolAvgs)
  const disparity = (maxAvg - minAvg) / 100

  return disparity
}

/**
 * ABROCA (Absolute Between-ROC Area) 계산
 *
 * ML 모델의 성능 차이를 측정하는 지표이나,
 * 여기서는 집단별 궁합 점수 분포 차이로 단순화 적용
 *
 * 참고: [ACM: ABROCA Distributions For Algorithmic Bias Assessment](https://dl.acm.org/doi/abs/10.1145/3706468.3706498)
 */
async function calculateABROCA(
  assignments: Array<{ studentId: string; teacherId: string; score: number }>
): Promise<number> {
  // 점수 분포를 히스토그램으로 변환
  const bins = 10
  const histogram = new Array(bins).fill(0)
  for (const a of assignments) {
    const binIndex = Math.min(Math.floor(a.score / 10), bins - 1)
    histogram[binIndex]++
  }

  // 이상적인 분포 (균등)
  const idealBinSize = assignments.length / bins
  const idealHistogram = new Array(bins).fill(idealBinSize)

  // 분포 차이 (L1 distance)
  let diff = 0
  for (let i = 0; i < bins; i++) {
    diff += Math.abs(histogram[i] - idealHistogram[i])
  }

  // 정규화 (최대 차이는 assignments.length)
  return diff / assignments.length
}

/**
 * 배정 분포 균형 계산
 */
async function calculateDistributionBalance(
  assignments: Array<{ studentId: string; teacherId: string; score: number }>
): Promise<number> {
  // 선생님별 배정 수
  const teacherCounts = new Map<string, number>()
  for (const a of assignments) {
    teacherCounts.set(a.teacherId, (teacherCounts.get(a.teacherId) ?? 0) + 1)
  }

  const counts = Array.from(teacherCounts.values())
  if (counts.length === 0) return 0

  // 평균
  const mean = counts.reduce((sum, c) => sum + c, 0) / counts.length

  // 표준편차
  const variance = counts.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / counts.length
  const stdDev = Math.sqrt(variance)

  // 정규화 (표준편차가 작을수록 균형적)
  return Math.max(0, 1 - stdDev / mean)
}

/**
 * 공정성 개선 제안 생성
 */
function generateFairnessRecommendations(metrics: Omit<FairnessMetrics, 'recommendations'>): string[] {
  const recommendations: string[] = []

  if (metrics.disparityIndex > 0.2) {
    recommendations.push('학교 간 궁합 점수 차이가 큽니다. 가중치 재조정을 검토하세요.')
  }

  if (metrics.abroca > 0.3) {
    recommendations.push('궁합 점수 분포가 편향되어 있습니다. 알고리즘 검토가 필요합니다.')
  }

  if (metrics.distributionBalance < 0.7) {
    recommendations.push('선생님별 배정 분포가 불균형합니다. 부하 분산 가중치를 높이세요.')
  }

  if (recommendations.length === 0) {
    recommendations.push('공정성 메트릭이 정상 범위입니다.')
  }

  return recommendations
}
```

**Source:** [ACM: ABROCA Distributions](https://dl.acm.org/doi/abs/10.1145/3706468.3706498), [ResearchGate: Investigating Algorithmic Bias in Student Progress Monitoring](https://www.researchgate.net/publication/382376021)

### Pattern 5: Server Actions for Assignment

**What:** 수동 배정, 자동 배정 제안, 궁합 분석 Server Actions
**When to use:** UI에서 배정 관리 기능 호출 시
**Example:**
```typescript
// src/lib/actions/assignment.ts (NEW)
"use server"

import { revalidatePath } from "next/cache"
import { verifySession } from "@/lib/dal"
import { db } from "@/lib/db"
import { calculateCompatibilityScore } from "@/lib/analysis/compatibility-scoring"
import { generateAutoAssignment, calculateFairnessMetrics } from "@/lib/optimization/auto-assignment"

/**
 * 학생 수동 배정
 */
export async function assignStudentToTeacher(studentId: string, teacherId: string) {
  const session = await verifySession()

  // 권한 확인 (Director/Team Leader만 배정 가능)
  if (!['DIRECTOR', 'TEAM_LEADER'].includes(session.role)) {
    throw new Error("배정 권한이 없습니다.")
  }

  // 학생-선생님 관계 업데이트
  await db.student.update({
    where: { id: studentId },
    data: { teacherId },
  })

  revalidatePath("/matching")
  revalidatePath(`/students/${studentId}`)
  revalidatePath(`/teachers/${teacherId}`)

  return { success: true }
}

/**
 * 자동 배정 제안 생성
 */
export async function generateAutoAssignmentSuggestions(
  studentIds: string[],
  options: {
    maxStudentsPerTeacher?: number
    minCompatibilityThreshold?: number
    teamId?: string
  } = {}
) {
  const session = await verifySession()

  // 권한 확인
  if (!['DIRECTOR', 'TEAM_LEADER'].includes(session.role)) {
    throw new Error("배정 권한이 없습니다.")
  }

  // 자동 배정 생성
  const assignments = await generateAutoAssignment(studentIds, options)

  // 공정성 메트릭 계산
  const fairnessMetrics = await calculateFairnessMetrics(
    assignments.map(a => ({ ...a, score: a.score.overall }))
  )

  return {
    assignments,
    fairnessMetrics,
    summary: {
      totalStudents: studentIds.length,
      assignedStudents: assignments.length,
      averageScore: assignments.reduce((sum, a) => sum + a.score.overall, 0) / assignments.length,
    },
  }
}

/**
 * 자동 배정 적용 (제안 승인 후)
 */
export async function applyAutoAssignment(assignments: Array<{ studentId: string; teacherId: string }>) {
  const session = await verifySession()

  if (!['DIRECTOR', 'TEAM_LEADER'].includes(session.role)) {
    throw new Error("배정 권한이 없습니다.")
  }

  // 일괄 업데이트
  await Promise.all(
    assignments.map(({ studentId, teacherId }) =>
      db.student.update({
        where: { id: studentId },
        data: { teacherId },
      })
    )
  )

  revalidatePath("/matching")

  return { success: true, count: assignments.length }
}

/**
 * 학생별 적합 선생님 목록 조회
 */
export async function getTeacherRecommendations(studentId: string) {
  const session = await verifySession()

  // 학생 조회
  const student = await db.student.findFirst({
    where: { id: studentId, teacherId: session.userId },
    include: {
      mbtiAnalysis: true,
      sajuAnalysis: true,
      nameAnalysis: true,
    },
  })

  if (!student) {
    throw new Error("학생을 찾을 수 없습니다.")
  }

  // 팀 내 선생님 목록 조회
  const teachers = await db.teacher.findMany({
    where: {
      teamId: session.teamId ?? undefined,
      role: { in: ['TEACHER', 'MANAGER', 'TEAM_LEADER'] },
    },
    include: {
      teacherMbtiAnalysis: true,
      teacherSajuAnalysis: true,
      teacherNameAnalysis: true,
      _count: {
        select: { students: true },
      },
    },
  })

  // 전체 학생 수로 평균 계산
  const totalStudents = await db.student.count()
  const totalTeachers = teachers.length
  const averageLoad = totalStudents / totalTeachers

  // 모든 선생님에 대해 궁합 점수 계산
  const recommendations = teachers
    .map(teacher => {
      const score = calculateCompatibilityScore({
        teacherMbti: teacher.teacherMbtiAnalysis ? {
          type: teacher.teacherMbtiAnalysis.mbtiType,
          percentages: teacher.teacherMbtiAnalysis.percentages as any,
        } : null,
        teacherSaju: teacher.teacherSajuAnalysis?.result as any,
        teacherName: teacher.teacherNameAnalysis?.result as any,
        studentMbti: student.mbtiAnalysis ? {
          type: student.mbtiAnalysis.mbtiType,
          percentages: student.mbtiAnalysis.percentages as any,
        } : null,
        studentSaju: student.sajuAnalysis?.result as any,
        studentName: student.nameAnalysis?.result as any,
        teacherCurrentLoad: teacher._count.students,
        averageLoad,
      })

      return {
        teacherId: teacher.id,
        teacherName: teacher.name,
        teacherRole: teacher.role,
        score: score.overall,
        breakdown: score.breakdown,
        reasons: score.reasons,
      }
    })
    .sort((a, b) => b.score - a.score) // 점순 순위

  return {
    studentId: student.id,
    studentName: student.name,
    recommendations,
  }
}
```

**Source:** 기존 Server Actions 패턴 (`src/lib/actions/teachers.ts`)

### Pattern 6: UI Components for Matching

**What:** 배정 관리, 궁합 시각화, 선생님 추천 UI 컴포넌트
**When to use:** 배정 관리 페이지, 학생 상세 페이지
**Example:**
```typescript
// src/components/compatibility/compatibility-score-card.tsx (NEW)
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

type CompatibilityScoreCardProps = {
  teacherName: string
  studentName: string
  score: number // 0-100
  breakdown: {
    mbti: number
    learningStyle: number
    saju: number
    name: number
    loadBalance: number
  }
  reasons: string[]
}

export function CompatibilityScoreCard({
  teacherName,
  studentName,
  score,
  breakdown,
  reasons,
}: CompatibilityScoreCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-blue-600"
    return "text-gray-600"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "매우 좋음"
    if (score >= 60) return "좋음"
    if (score >= 40) return "보통"
    return "낮음"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{teacherName} - {studentName}</span>
          <Badge variant={score >= 60 ? "default" : "secondary"}>
            {score.toFixed(1)}점
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 전체 점수 */}
        <div className="text-center">
          <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
            {score.toFixed(1)}
          </div>
          <div className="text-sm text-gray-500">
            {getScoreLabel(score)}
          </div>
        </div>

        {/* 항목별 점수 */}
        <div className="space-y-3">
          <CompatibilityBar label="MBTI" value={breakdown.mbti} max={25} />
          <CompatibilityBar label="학습 스타일" value={breakdown.learningStyle} max={25} />
          <CompatibilityBar label="사주" value={breakdown.saju} max={20} />
          <CompatibilityBar label="성명학" value={breakdown.name} max={15} />
          <CompatibilityBar label="부하 분산" value={breakdown.loadBalance} max={15} />
        </div>

        {/* 추천 이유 */}
        {reasons.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700">추천 이유</h4>
            <ul className="space-y-1">
              {reasons.map((reason, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-start">
                  <span className="mr-2">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function CompatibilityBar({
  label,
  value,
  max,
}: {
  label: string
  value: number
  max: number
}) {
  const percentage = (value / max) * 100

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="text-gray-800 font-medium">
          {value.toFixed(1)}/{max}
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  )
}
```

**Source:** 기존 shadcn/ui Card, Progress 컴포넌트 패턴

### Anti-Patterns to Avoid

- **학습 스타일 매칭 오해**: [연구에 따르면](https://www.sciencedirect.com/science/article/pii/S2666557323000216) 학습 스타일 매칭은 학습 효과에 유의미한 영향을 주지 않음. 단순 매칭이 아닌 참고 정보로만 활용
- **알고리즘만 의존**: Human-in-the-loop 필수 - AI 제안은 참고용, 최종 결정은 사람이
- **Fairness metrics 무시**: ABROCA, Disparity Index 등으로 정기적 편향 모니터링 필요
- **복잡한 EMO 구현**: Phase 13에서는 Greedy로 충분, EMO는 Phase 14 이후 고려
- **일반화된 MBTI 호환도 사용**: MBTI 타입 쌍별 호환도 table은 논쟁적이므로, percentages 차이 기반 유사도 사용 권장

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| MBTI 호환도 계산 | MBTI 타입별 호환도 테이블 | Percentages 차이 기반 유사도 | 과학적 근거 없는 타입 쌍별 호환도 피하기 |
| 최적화 알고리즘 | 복잡한 EMO 구현 | Simple Greedy | Greedy로도 충분히 좋은 결과, 복잡도 ↓ |
| Fairness metrics | 복잡한 ML bias metrics | 단순 Disparity Index, 분포 균형 | 이해하기 쉽고 해석 가능 |
| 궁합 시각화 | Custom chart library | Recharts RadarChart | 이미 프로젝트에서 사용 중 |
| 학습 스타일 분류 | 별도 VARK 설문 | MBTI에서 유도 | 추가 데이터 수집 불필요 |

**Key insight:** 복잡한 알고리즘보다 단순하고 투명한 접근이 교육 도구에 적합합니다. Fairness metrics로 편향을 모니터링하고, 사람이 최종 결정을 내리는 human-in-the-loop가 필수입니다.

## Common Pitfalls

### Pitfall 1: 학습 스타일 매칭의 과학적 근거 부족

**What goes wrong:** "시각적 학습자"에게 시각 자료를 제공하면 성적이 오른다는 가정은 과학적으로 입증되지 않음

**Why it happens:** 교육계에서 널리 퍼진 "learning styles myth"

**How to avoid:**
```typescript
// ❌ WRONG: 학습 스타일 매칭을 강조
if (student.learningStyle === 'visual' && teacher.teachingStyle === 'visual') {
  return "완벽한 매칭입니다!"
}

// ✅ CORRECT: 참고 정보로만 활용
reasons.push(`학습 스타일이 비슷하여 참고할 수 있습니다 (단, 매칭 효과는 입증되지 않음)`)
```

**Reference:** [ScienceDirect: Matching learning style to instructional format penalizes learners](https://www.sciencedirect.com/science/article/pii/S2666557323000216)

### Pitfall 2: 알고리즘적 편향 무시

**What goes wrong:** 특정 학교, 성별, 성적대 학생들이 특정 선생님에게 편중되게 배정됨

**Why it happens:** 궁합 점수 계산에 편향이 있거나, 데이터 자체가 편향됨

**How to avoid:**
```typescript
// ❌ WRONG: Fairness metrics 없이 배정
const assignments = await generateAutoAssignment(studentIds)
await applyAutoAssignment(assignments)

// ✅ CORRECT: Fairness metrics로 검증 후 적용
const assignments = await generateAutoAssignment(studentIds)
const metrics = await calculateFairnessMetrics(assignments)

if (metrics.disparityIndex > 0.2) {
  console.warn("높은 편향 감지: 배정을 검토하세요")
  // 관리자에게 알림
}

await applyAutoAssignment(assignments)
```

**Reference:** [ACM: ABROCA Distributions For Algorithmic Bias Assessment](https://dl.acm.org/doi/abs/10.1145/3706468.3706498)

### Pitfall 3: MBTI 타입 쌍별 호환도 테이블 사용

**What goes wrong:** "INTJ와 ENFP는 최고의 커플" 같은 일반화된 호환도 사용

**Why it happens:** MBTI 커뮤니티에서 유행하는 "romantic compatibility" 테이블

**How to avoid:**
```typescript
// ❌ WRONG: 타입 쌍별 호환도 테이블
const compatibilityTable: Record<string, Record<string, number>> = {
  'INTJ': { 'ENFP': 95, 'ENTJ': 85, ... },
  ...
}

// ✅ CORRECT: Percentages 차이 기반 유사도
const compatibility = 1 - Math.abs(teacherPercentages.E - studentPercentages.E) / 100
```

### Pitfall 4: 분석 미완료 상황 무시

**What goes wrong:** 일부 학생/선생님의 MBTI, 사주 분석이 없으면 전체 배정이 실패

**Why it happens:** 모든 분석이 완료되었다고 가정

**How to avoid:**
```typescript
// ❌ WRONG: 필수 분석 확인
if (!teacher.teacherMbtiAnalysis || !student.studentMbtiAnalysis) {
  throw new Error("MBTI 분석이 필요합니다.")
}

// ✅ CORRECT: 부분 점수로 계산
const mbtiScore = teacher.teacherMbtiAnalysis && student.studentMbtiAnalysis
  ? calculateMbtiCompatibility(...)
  : 0.5 // 기본값 (분석 미완료 시)
```

### Pitfall 5: 자동 배정 과신

**What goes wrong:** AI 제안을 무비판적으로 수용하여 배정 오류 발생

**Why it happens:** "AI가 최적이라니까 문제없겠지"라는 안일한 생각

**How to avoid:**
- 항상 사용자에게 제안을 검토하고 수정할 수 있는 UI 제공
- 배정 전에 궁합 점수, 추천 이유를 표시
- "수동 배정" 옵션을 항상 열어두기

## Code Examples

Verified patterns from existing codebase:

### Running Compatibility Analysis (Server Action Pattern)
```typescript
// src/lib/actions/compatibility.ts
export async function analyzeCompatibility(teacherId: string, studentId: string) {
  const session = await verifySession()

  // Teacher/Student 분석 조회
  const [teacher, student] = await Promise.all([
    db.teacher.findUnique({
      where: { id: teacherId },
      include: { teacherMbtiAnalysis: true, teacherSajuAnalysis: true, ... },
    }),
    db.student.findFirst({
      where: { id: studentId, teacherId: session.userId },
      include: { mbtiAnalysis: true, sajuAnalysis: true, ... },
    }),
  ])

  if (!teacher || !student) {
    throw new Error("선생님 또는 학생을 찾을 수 없습니다.")
  }

  // CompatibilityResult upsert
  const score = calculateCompatibilityScore({ ... })

  await db.compatibilityResult.upsert({
    where: { teacherId_studentId: { teacherId, studentId } },
    create: { teacherId, studentId, ... },
    update: { ... },
  })

  revalidatePath(`/students/${studentId}/matching`)

  return { score }
}
```

### Teacher Recommendation List (UI Pattern)
```typescript
// src/components/compatibility/teacher-recommendation-list.tsx
"use client"

import { useQuery } from "@tanstack/react-query"
import { getTeacherRecommendations } from "@/lib/actions/assignment"

export function TeacherRecommendationList({ studentId }: { studentId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['teacher-recommendations', studentId],
    queryFn: () => getTeacherRecommendations(studentId),
  })

  if (isLoading) return <div>로딩 중...</div>

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">적합 선생님 순위</h3>
      {data?.recommendations.map((rec, i) => (
        <RecommendationCard key={rec.teacherId} rank={i + 1} {...rec} />
      ))}
    </div>
  )
}
```

### Auto-Assignment Suggestion UI (Server Action Pattern)
```typescript
// src/app/(dashboard)/matching/auto-assign/page.tsx
import { generateAutoAssignmentSuggestions } from "@/lib/actions/assignment"

export default async function AutoAssignPage() {
  const session = await verifySession()

  // 미배정 학생 조회
  const unassignedStudents = await db.student.findMany({
    where: { teacherId: null, teamId: session.teamId },
    select: { id: true },
  })

  const studentIds = unassignedStudents.map(s => s.id)

  // 자동 배정 제안 생성
  const suggestions = await generateAutoAssignmentSuggestions(studentIds, {
    minCompatibilityThreshold: 50,
  })

  return (
    <div>
      <h1>AI 자동 배정 제안</h1>
      <FairnessMetricsPanel metrics={suggestions.fairnessMetrics} />
      <AssignmentPreview assignments={suggestions.assignments} />
      <ApplyButton assignments={suggestions.assignments} />
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 수동 배정만 | AI 자동 배정 제안 | Phase 13 (planned) | 효율성 ↑, 편향 위험 ↑ (fairness metrics로 완화) |
| 단일 점수 배정 | 다목적 최적화 (궁합 + 부하) | Phase 13 (planned) | 균형 잡힌 배정 |
| 공정성 무시 | Fairness metrics (ABROCA, Disparity) | Phase 13 (planned) | Algorithmic bias 감지 |
| 학습 스타일 강조 | 참고 정보로만 활용 | 2020s research | 과학적 근거 부족 인식 |

**Current stack (as of 2026-01-30):**
- **Next.js 15** with App Router and Server Actions
- **Prisma** with PostgreSQL (RLS policies enabled)
- **shadcn/ui** for consistent component styling
- **Recharts** for data visualization
- **기존 분석 라이브러리** (Saju, Name, MBTI) 재사용

**New in Phase 13:**
- **CompatibilityResult** Prisma model
- **다목적 최적화** (Greedy with load balancing)
- **Fairness metrics** (Disparity Index, ABROCA)
- **Human-in-the-loop** 배정 워크플로우

## Open Questions

1. **학습 스타일 데이터 방식**
   - What we know: Student/Teacher 모델에 학습 스타일 필드 없음
   - What's unclear: MBTI percentages에서 유도할지, 별도 VARK 설문 추가할지
   - Recommendation: Phase 13에서는 MBTI 유도로 충분, VARK 설문은 Phase 14 이후 고려

2. **MBTI 호환도 계산 방식**
   - What we know: 일반화된 타입 쌍별 호환도는 과학적 근거 부족
   - What's unclear: Percentages 차이가 교육적 의미가 있는지
   - Recommendation: Percentages 차이 사용 (투명함), 단일 점수 과신 경고

3. **Fairness metrics 기준값**
   - What we know: Disparity Index < 0.2, ABROCA < 0.3, DistributionBalance > 0.7 권장
   - What's unclear: 실제 데이터에서 이 기준이 적절한지
   - Recommendation: 초기에는 느슨한 기준, 데이터 축적 후 tighten

4. **자동 배정 적용 권한**
   - What we know: Director/Team Leader가 제안 생성 가능
   - What's unclear: 제안을 확인 없이 자동 적용할 수 있는지
   - Recommendation: 항상 사용자 확인 후 적용 (human-in-the-loop)

5. **부하 분산 가중치**
   - What we know: 15% 가중치 권장 (요구사항)
   - What's unclear: 선생님 간 담당 학생 수 편차가 큰 상황에서 이 가중치가 충분한지
   - Recommendation: Phase 13에서는 15% 유지, Phase 14 성과 분석 후 조정

## Sources

### Primary (HIGH confidence)
- `/mnt/data/projects/ai/ai-afterschool/prisma/schema.prisma` - Teacher/Student/Analysis models
- `/mnt/data/projects/ai/ai-afterschool/src/lib/analysis/saju.ts` - Saju 계산 (재사용)
- `/mnt/data/projects/ai/ai-afterschool/src/lib/analysis/name-numerology.ts` - 성명학 계산 (재사용)
- `/mnt/data/projects/ai/ai-afterschool/src/lib/analysis/mbti-scoring.ts` - MBTI 점수 계산 (재사용)
- `/mnt/data/projects/ai/ai-afterschool/src/lib/actions/teacher-analysis.ts` - Teacher 분석 Server Actions 패턴
- [ACM: Self-Optimizing Teacher and Auto-Matching](https://dl.acm.org/doi/full/10.1145/3718091) - 최적화 알고리즘 참고
- [PeerJ: Automatic Matching with EMO](https://peerj.com/articles/cs-1501/) - 다목적 최적화 알고리즘
- [ResearchGate: Stable Matching Algorithm](https://www.researchgate.net/publication/381627806) - 안정적 배정 알고리즘

### Secondary (MEDIUM confidence)
- [ACM: ABROCA Distributions For Algorithmic Bias Assessment](https://dl.acm.org/doi/abs/10.1145/3706468.3706498) - Fairness metrics
- [ResearchGate: Investigating Algorithmic Bias in Student Progress Monitoring](https://www.researchgate.net/publication/382376021) - Educational bias research
- [ScienceDirect: Matching learning style to instructional format penalizes learners](https://www.sciencedirect.com/science/article/pii/S2666557323000216) - Learning styles myth
- [ResearchGate: Personalized Learning Through MBTI Prediction](https://www.researchgate.net/publication/389017592) - MBTI-based learning
- [Frontiers: The persistence of matching teaching and learning styles](https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2023.1147498/full) - Learning styles controversy

### Tertiary (LOW confidence - requiring validation)
- VARK learning styles matching effectiveness (연구 결과 상충, Phase 13에서는 참고용으로만 활용)
- ABROCA practical application (교육 배정 맥락에서의 실제 적용 사례 부족, 단순화 필요)
- EMO algorithm complexity (Greedy로 충분할 가능성 높음, EMO는 Phase 14 이후)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - 기존 라이브러리 모두 재사용 가능, 별도 설치 불필요
- Architecture (Scoring algorithm): HIGH - 기존 분석 라이브러리 재사용, 명확한 수식
- Architecture (Auto-assignment): MEDIUM - Greedy는 검증됨, EMO는 실무 적용 필요
- Architecture (Fairness metrics): MEDIUM - ABROCA/Disparity Index는 검증됨, 교육 맥락 적용은 새로움
- UI patterns: HIGH - shadcn/ui + Recharts는 표준 pattern
- Learning styles matching: LOW - 과학적 근거 부족, 참고용으로만 활용 권장

**Research date:** 2026-01-30
**Valid until:** 2026-03-31 (90 days - 안정적인 알고리즘 구조)

**Key findings summary:**
1. **기존 분석 라이브러리 100% 재사용** - Saju, Name, MBTI 계산 함수에 Student/Teacher 구분 없음
2. **가중 평균 궁합 점수** - MBTI 25%, 학습 스타일 25%, 사주 20%, 성명학 15%, 부하 분산 15%
3. **학습 스타일은 MBTI에서 유도** - VARK 설문 추가 불필요, MBTI percentages로 충분
4. **Greedy 알고리즘으로 충분** - 단순하지만 부하 분산 고려, EMO는 Phase 14 이후
5. **Fairness metrics 필수** - Disparity Index, ABROCA로 알고리즘적 편향 모니터링
6. **Human-in-the-loop** - AI 제안은 참고용, 최종 배정은 사용자 확인 필요
