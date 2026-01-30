/**
 * MBTI 호환도 계산 모듈
 *
 * 선생님과 학생의 MBTI percentages 차이를 기반으로
 * 성향 유사도(0-1)를 계산합니다.
 */

import type { MbtiPercentages } from "./mbti-scoring"

/**
 * MBTI 4차원별 유사도 계산
 *
 * 각 차원(E/I, S/N, T/F, J/P)별 percentages 차이를 계산하고,
 * 차이가 적을수록 높은 유사도를 반환합니다.
 *
 * @param teacherMbti - 선생님 MBTI percentages (nullable)
 * @param studentMbti - 학생 MBTI percentages (nullable)
 * @returns 유사도 (0-1, 분석 미완료 시 0.5)
 */
export function calculateMbtiCompatibility(
  teacherMbti: MbtiPercentages | null | undefined,
  studentMbti: MbtiPercentages | null | undefined
): number {
  // 분석 미완료 시 기본값 반환
  if (!teacherMbti || !studentMbti) {
    return 0.5
  }

  // 4차원별 차이 계산
  const eiDiff = Math.abs(teacherMbti.E - studentMbti.E)
  const snDiff = Math.abs(teacherMbti.S - studentMbti.S)
  const tfDiff = Math.abs(teacherMbti.T - studentMbti.T)
  const jpDiff = Math.abs(teacherMbti.J - studentMbti.J)

  // 평균 차이 (0-100)
  const avgDiff = (eiDiff + snDiff + tfDiff + jpDiff) / 4

  // 차이가 적을수록 높은 유사도 (1 - 차이/100)
  const similarity = 1 - avgDiff / 100

  // 0-1 범위로 정규화
  return Math.max(0, Math.min(1, similarity))
}
