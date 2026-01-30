/**
 * 선생님-학생 궁합 점수 계산 모듈
 *
 * MBTI, 학습 스타일, 사주, 성명학, 부하 분산을 종합하여
 * 가중 평균 기반 궁합 점수(0-100)를 계산합니다.
 */

import type { MbtiPercentages } from "./mbti-scoring"
import type { SajuResult } from "./saju"
import type { NameNumerologyResult } from "./name-numerology"
import { calculateMbtiCompatibility } from "./mbti-compatibility"
import { calculateLearningStyleCompatibility } from "./learning-style-compatibility"
import { calculateSajuCompatibility } from "./saju-compatibility"
import { calculateNameCompatibility } from "./name-compatibility"

/**
 * 궁합 항목별 점수 분해
 */
export type CompatibilityBreakdown = {
  mbti: number          // MBTI 유사도 × 0.25 (0-25)
  learningStyle: number // 학습 스타일 유사도 × 0.25 (0-25)
  saju: number          // 사주 오행 유사도 × 0.20 (0-20)
  name: number          // 성명학 유사도 × 0.15 (0-15)
  loadBalance: number   // 부하 분산 점수 × 0.15 (0-15)
}

/**
 * 궁합 점수 결과
 */
export type CompatibilityScore = {
  overall: number                     // 전체 점수 (0-100)
  breakdown: CompatibilityBreakdown   // 항목별 점수
  reasons: string[]                   // 추천 이유
}

/**
 * 선생님 분석 데이터 입력
 */
export type TeacherAnalysisData = {
  mbti?: MbtiPercentages | null
  saju?: SajuResult | null
  name?: NameNumerologyResult | null
  currentLoad?: number // 현재 담당 학생 수
}

/**
 * 학생 분석 데이터 입력
 */
export type StudentAnalysisData = {
  mbti?: MbtiPercentages | null
  saju?: SajuResult | null
  name?: NameNumerologyResult | null
}

/**
 * 부하 분산 점수 계산
 *
 * 선생님의 현재 담당 학생 수에 따라 부하 분산 점수를 계산합니다.
 * - 0-10명: 15점 만점 (여유 있음)
 * - 11-20명: 10점 (적당)
 * - 21-30명: 5점 (부하 있음)
 * - 31명 이상: 0점 (과부하)
 */
function calculateLoadBalanceScore(
  teacherCurrentLoad: number | undefined,
  averageLoad: number = 15
): number {
  const currentLoad = teacherCurrentLoad ?? 0

  if (currentLoad <= 10) return 15
  if (currentLoad <= 20) return 10
  if (currentLoad <= 30) return 5
  return 0
}

/**
 * 궁합 점수 계산
 *
 * 5개 항목의 가중 평균으로 전체 궁합 점수를 계산합니다:
 * - MBTI 유사도 × 0.25
 * - 학습 스타일 유사도 × 0.25
 * - 사주 오행 유사도 × 0.20
 * - 성명학 유사도 × 0.15
 * - 부하 분산 점수 × 0.15
 *
 * @param teacher - 선생님 분석 데이터
 * @param student - 학생 분석 데이터
 * @param averageLoad - 평균 담당 학생 수 (기본값: 15)
 * @returns 궁합 점수 (0-100)
 */
export function calculateCompatibilityScore(
  teacher: TeacherAnalysisData,
  student: StudentAnalysisData,
  averageLoad: number = 15
): CompatibilityScore {
  // 각 항목별 호환도 계산 (0-1 범위)
  const mbtiCompat = calculateMbtiCompatibility(teacher.mbti, student.mbti)
  const learningStyleCompat = calculateLearningStyleCompatibility(
    teacher.mbti,
    student.mbti
  )
  const sajuCompat = calculateSajuCompatibility(teacher.saju, student.saju)
  const nameCompat = calculateNameCompatibility(teacher.name, student.name)

  // 가중치 적용 (0-100 기준)
  const breakdown: CompatibilityBreakdown = {
    mbti: mbtiCompat * 25,          // 0-25
    learningStyle: learningStyleCompat * 25, // 0-25
    saju: sajuCompat * 20,          // 0-20
    name: nameCompat * 15,          // 0-15
    loadBalance: calculateLoadBalanceScore(teacher.currentLoad, averageLoad), // 0-15
  }

  // 전체 점수 합산
  const overall =
    breakdown.mbti +
    breakdown.learningStyle +
    breakdown.saju +
    breakdown.name +
    breakdown.loadBalance

  return {
    overall,
    breakdown,
    reasons: generateReasons(breakdown, mbtiCompat, learningStyleCompat, sajuCompat, nameCompat),
  }
}

/**
 * 추천 이유 생성
 */
function generateReasons(
  breakdown: CompatibilityBreakdown,
  mbtiCompat: number,
  learningStyleCompat: number,
  sajuCompat: number,
  nameCompat: number
): string[] {
  const reasons: string[] = []

  // MBTI 궁합
  if (mbtiCompat >= 0.8) {
    reasons.push("MBTI 성향이 매우 유사하여 소통 방식이 잘 맞을 것으로 예상됩니다.")
  } else if (mbtiCompat >= 0.6) {
    reasons.push("MBTI 성향이 비슷하여 기본적인 소통에 어려움이 없을 것입니다.")
  } else if (mbtiCompat >= 0.4) {
    reasons.push("MBTI 성향 차이가 있지만 서로 보완적인 관계가 될 수 있습니다.")
  } else {
    reasons.push("MBTI 성향 차이가 크나 상호 보완을 통해 시너지를 낼 수 있습니다.")
  }

  // 학습 스타일 궁합
  if (learningStyleCompat >= 0.8) {
    reasons.push("학습 스타일이 잘 맞아 효과적인 학습 지도가 가능할 것입니다.")
  } else if (learningStyleCompat >= 0.5) {
    reasons.push("학습 스타일이 대체로 일치하여 학습 효율이 좋을 것입니다.")
  }

  // 사주 궁합
  if (sajuCompat >= 0.7) {
    reasons.push("사주 오행 균형이 잘 맞아 장기적인 관계 형성에 유리합니다.")
  } else if (sajuCompat >= 0.5) {
    reasons.push("사주 기운이 서로 어우러져 조화로운 관계가 될 것입니다.")
  }

  // 성명학 궁합
  if (nameCompat >= 0.7) {
    reasons.push("성명학적 특성이 잘 맞아 긍정적인 관계가 예상됩니다.")
  }

  // 부하 분산
  if (breakdown.loadBalance >= 15) {
    reasons.push("현재 담당 학생 수가 적어 충분한 관심과 지도가 가능합니다.")
  } else if (breakdown.loadBalance >= 10) {
    reasons.push("적절한 담당 학생 수로 균형잡힌 지도가 가능할 것입니다.")
  } else if (breakdown.loadBalance >= 5) {
    reasons.push("담당 학생 수가 다소 많으나 효율적인 관리가 가능합니다.")
  }

  // 전체 점수 기반 메시지
  if (breakdown.mbti + breakdown.learningStyle >= 40) {
    reasons.push("성향과 학습 스타일 측면에서 높은 호환성을 보입니다.")
  }

  if (reasons.length === 0) {
    reasons.push("다양한 분석 데이터를 종합하여 선생님-학생 궁합을 산출했습니다.")
  }

  return reasons
}
