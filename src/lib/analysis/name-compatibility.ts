/**
 * 성명학 호환도 계산 모듈
 *
 * 선생님과 학생의 성명학 4격(원형, 형격, 이격, 정격) 유사도를
 * 기반으로 성명학적 호환성(0-1)을 계산합니다.
 */

import type { NameNumerologyResult } from "./name-numerology"

/**
 * 성명학 유사도 계산 (4격 평균 유사도)
 *
 * 두 사람의 4격(원형, 형격, 이격, 정격)이 얼마나 유사한지
 * 정규화된 차이를 기반으로 계산합니다.
 *
 * @param teacherName - 선생님 성명학 결과 (nullable)
 * @param studentName - 학생 성명학 결과 (nullable)
 * @returns 유사도 (0-1, 분석 미완료 시 0.5)
 */
export function calculateNameCompatibility(
  teacherName: NameNumerologyResult | null | undefined,
  studentName: NameNumerologyResult | null | undefined
): number {
  // 분석 미완료 시 0점 반환 (데이터 없는 선생님 불이익 방지)
  if (!teacherName || !studentName) {
    return 0
  }

  const teacherGrids = teacherName.grids
  const studentGrids = studentName.grids

  // grids 데이터가 없는 경우 0점 반환
  if (!teacherGrids || !studentGrids) {
    return 0
  }

  // 4격별 차이 계산 (최대 차이는 81 - 1 = 80)
  const wonDiff = Math.abs(teacherGrids.won - studentGrids.won)
  const hyungDiff = Math.abs(teacherGrids.hyung - studentGrids.hyung)
  const yiDiff = Math.abs(teacherGrids.yi - studentGrids.yi)
  const jeongDiff = Math.abs(teacherGrids.jeong - studentGrids.jeong)

  // 각 차이를 정규화 (0-80 → 0-1)
  const normalizedDiff =
    (wonDiff + hyungDiff + yiDiff + jeongDiff) / (80 * 4)

  // 차이가 적을수록 높은 유사도
  const similarity = 1 - normalizedDiff

  // 0-1 범위로 정규화
  return Math.max(0, Math.min(1, similarity))
}
