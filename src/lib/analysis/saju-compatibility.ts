/**
 * 사주 호환도 계산 모듈
 *
 * 선생님과 학생의 사주 오행(목화토금수) 균형 차이를 기반으로
 * 오행 유사도(0-1)를 계산합니다.
 */

import type { SajuResult } from "./saju"
import type { SajuElement } from "./saju"

/**
 * 오행 유사도 계산 (정규화된 유클리드 거리 기반)
 *
 * 두 오행 분포 간의 코사인 유사도를 계산합니다.
 *
 * @param teacherSaju - 선생님 사주 결과 (nullable)
 * @param studentSaju - 학생 사주 결과 (nullable)
 * @returns 유사도 (0-1, 분석 미완료 시 0.5)
 */
export function calculateSajuCompatibility(
  teacherSaju: SajuResult | null | undefined,
  studentSaju: SajuResult | null | undefined
): number {
  // 분석 미완료 시 0점 반환 (데이터 없는 선생님 불이익 방지)
  if (!teacherSaju || !studentSaju) {
    return 0
  }

  const teacherElements = teacherSaju.elements
  const studentElements = studentSaju.elements

  // 오행 순서
  const elementOrder: SajuElement[] = ["목", "화", "토", "금", "수"]

  // 두 벡터 구성
  const teacherVector = elementOrder.map((e) => teacherElements[e] ?? 0)
  const studentVector = elementOrder.map((e) => studentElements[e] ?? 0)

  // 코사인 유사도 계산
  const dotProduct = teacherVector.reduce(
    (sum, val, i) => sum + val * studentVector[i],
    0
  )

  const teacherMagnitude = Math.sqrt(
    teacherVector.reduce((sum, val) => sum + val ** 2, 0)
  )

  const studentMagnitude = Math.sqrt(
    studentVector.reduce((sum, val) => sum + val ** 2, 0)
  )

  if (teacherMagnitude === 0 || studentMagnitude === 0) {
    return 0
  }

  const similarity = dotProduct / (teacherMagnitude * studentMagnitude)

  // 0-1 범위로 정규화
  return Math.max(0, Math.min(1, similarity))
}
