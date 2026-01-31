/**
 * 공정성 메트릭 모듈
 *
 * 알고리즘적 편향을 검증하기 위한 공정성 메트릭을 계산합니다.
 * - Disparity Index: 집단 간 궁합 점수 차이 (학교별)
 * - ABROCA: 궁합 점수 분포 편향 (histogram 기반)
 * - Distribution Balance: 선생님별 배정 균형
 */

import { db } from "@/lib/db"

/**
 * 배정 항목 타입
 */
export type Assignment = {
  studentId: string
  teacherId: string
  score: number
}

/**
 * 공정성 메트릭 결과 타입
 */
export type FairnessMetrics = {
  disparityIndex: number
  abroca: number
  distributionBalance: number
  recommendations: string[]
}

/**
 * 공정성 메트릭 계산
 *
 * @param assignments - 배정 목록 (studentId, teacherId, score)
 * @returns 공정성 메트릭 결과
 */
export async function calculateFairnessMetrics(
  assignments: Assignment[]
): Promise<FairnessMetrics> {
  const [disparityIndex, abroca, distributionBalance] = await Promise.all([
    calculateDisparityIndex(assignments),
    calculateABROCA(assignments),
    calculateDistributionBalance(assignments),
  ])

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
 * Disparity Index 계산 (집단 간 궁합 점수 차이)
 *
 * 학교별 평균 궁합 점수의 최대-최소 차이를 계산합니다.
 * 값이 0에 가까울수록 공정 (학교 간 차이가 없음)
 * 값이 1에 가까울수록 불공정 (학교 간 차이가 큼)
 *
 * @param assignments - 배정 목록
 * @returns Disparity Index (0-1 범위)
 */
async function calculateDisparityIndex(assignments: Assignment[]): Promise<number> {
  if (assignments.length === 0) {
    return 0
  }

  // 학생 ID 목록 추출
  const studentIds = Array.from(new Set(assignments.map((a) => a.studentId)))

  // 학생 정보 조회 (학교, 학년)
  const students = await db.student.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, school: true, grade: true },
  })

  // 학생 ID → 학교 매핑
  const studentSchoolMap = new Map<string, string | null>(
    students.map((s) => [s.id, s.school])
  )

  // 학교별 점수 그룹화
  const schoolGroups = new Map<string, number[]>()

  for (const assignment of assignments) {
    const school = studentSchoolMap.get(assignment.studentId)
    if (!school) continue

    const scores = schoolGroups.get(school as string) ?? []
    scores.push(assignment.score)
    schoolGroups.set(school as string, scores)
  }

  // 학교별 평균 점수 계산
  const schoolAverages: number[] = []
  for (const [, scores] of Array.from(schoolGroups.entries())) {
    if (scores.length > 0) {
      const average = scores.reduce((sum, s) => sum + s, 0) / scores.length
      schoolAverages.push(average)
    }
  }

  if (schoolAverages.length < 2) {
    return 0
  }

  // 최대-최소 차이 (정규화: /100)
  const maxScore = Math.max(...schoolAverages)
  const minScore = Math.min(...schoolAverages)
  const disparityIndex = (maxScore - minScore) / 100

  return Math.min(1, Math.max(0, disparityIndex))
}

/**
 * ABROCA 계산 (Accuracy-Based ROC AUC)
 *
 * 궁합 점수 분포의 편향을 계산합니다.
 * 히스토그램을 사용하여 실제 분포와 균등 분포의 차이를 측정합니다.
 * 값이 0에 가까울수록 공정 (분포가 균등)
 * 값이 1에 가까울수록 불공정 (분포가 편향됨)
 *
 * @param assignments - 배정 목록
 * @returns ABROCA (0-1 범위)
 */
function calculateABROCA(assignments: Assignment[]): number {
  if (assignments.length === 0) {
    return 0
  }

  const scores = assignments.map((a) => a.score)
  const bins = 10 // 0-10, 10-20, ..., 90-100
  const binSize = 100 / bins

  // 히스토그램 생성
  const histogram = new Array(bins).fill(0)
  for (const score of scores) {
    const binIndex = Math.min(Math.floor(score / binSize), bins - 1)
    histogram[binIndex]++
  }

  // 이상적인 분포 (균등 분포)
  const idealCount = scores.length / bins

  // L1 distance 계산 (Manhattan distance)
  let l1Distance = 0
  for (const count of histogram) {
    l1Distance += Math.abs(count - idealCount)
  }

  // 정규화 (최대 L1 distance는 2 * N)
  const maxL1Distance = 2 * scores.length
  const abroca = l1Distance / maxL1Distance

  return Math.min(1, Math.max(0, abroca))
}

/**
 * Distribution Balance 계산 (선생님별 배정 균형)
 *
 * 선생님별 배정된 학생 수의 균형을 계산합니다.
 * 표준편차를 사용하여 배정 분포의 균형을 측정합니다.
 * 값이 1에 가까울수록 공정 (모든 선생님에게 균등하게 배정)
 * 값이 0에 가까울수록 불공정 (특정 선생님에게 몰림)
 *
 * @param assignments - 배정 목록
 * @returns Distribution Balance (0-1 범위)
 */
function calculateDistributionBalance(assignments: Assignment[]): number {
  if (assignments.length === 0) {
    return 1
  }

  // 선생님별 배정 수 계산
  const teacherCounts = new Map<string, number>()
  for (const assignment of assignments) {
    teacherCounts.set(
      assignment.teacherId,
      (teacherCounts.get(assignment.teacherId) || 0) + 1
    )
  }

  const counts = Array.from(teacherCounts.values())

  if (counts.length === 0) {
    return 1
  }

  // 평균 계산
  const mean = counts.reduce((sum, c) => sum + c, 0) / counts.length

  if (mean === 0) {
    return 1
  }

  // 표준편차 계산
  const variance =
    counts.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / counts.length
  const stdDev = Math.sqrt(variance)

  // 정규화 (1 - stdDev / mean)
  // stdDev가 0이면 완벽한 균형 (1)
  // stdDev가 mean과 같으면 불균형 (0)
  const distributionBalance = 1 - stdDev / mean

  return Math.min(1, Math.max(0, distributionBalance))
}

/**
 * 공정성 개선 제안 생성
 *
 * @param metrics - 공정성 메트릭 값
 * @returns 개선 제안 목록
 */
function generateFairnessRecommendations(
  metrics: Pick<FairnessMetrics, "disparityIndex" | "abroca" | "distributionBalance">
): string[] {
  const recommendations: string[] = []

  // Disparity Index 체크
  if (metrics.disparityIndex > 0.2) {
    recommendations.push(
      "학교 간 궁합 점수 차이가 큽니다. 가중치 재조정을 검토하세요."
    )
  }

  // ABROCA 체크
  if (metrics.abroca > 0.3) {
    recommendations.push(
      "궁합 점수 분포가 편향되어 있습니다. 알고리즘 검토가 필요합니다."
    )
  }

  // Distribution Balance 체크
  if (metrics.distributionBalance < 0.7) {
    recommendations.push(
      "선생님별 배정 분포가 불균형합니다. 부하 분산 가중치를 높이세요."
    )
  }

  // 추천 없음
  if (recommendations.length === 0) {
    recommendations.push("공정성 메트릭이 정상 범위입니다.")
  }

  return recommendations
}
