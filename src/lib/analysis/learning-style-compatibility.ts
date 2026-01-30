/**
 * 학습 스타일 호환도 계산 모듈
 *
 * MBTI percentages에서 VARK 학습 스타일을 유도하고
 * 선생님-학생 간 학습 스타일 유사도를 계산합니다.
 */

import type { MbtiPercentages } from "./mbti-scoring"

/**
 * VARK 학습 스타일 점수
 */
export type LearningStyleScores = {
  visual: number      // 시각적 학습 (S + J)
  auditory: number    // 청각적 학습 (E)
  readWrite: number   // 읽기/쓰기 학습 (I)
  kinesthetic: number // 운동 감각 학습 (N + P)
}

/**
 * MBTI percentages에서 VARK 학습 스타일 유도
 *
 * MBTI 성향을 기반으로 VARK 학습 스타일 점수를 계산합니다:
 * - Visual: High S + High J (구조화된 시각적 정보 선호)
 * - Kinesthetic: High N + High P (경험 중심 학습 선호)
 * - Auditory: High E (대화 중심 학습 선호)
 * - Read/Write: High I (독서/서술 중심 학습 선호)
 *
 * @param mbti - MBTI percentages (nullable)
 * @returns VARK 학습 스타일 점수 (0-100, 미분석 시 null)
 */
export function deriveLearningStyle(
  mbti: MbtiPercentages | null | undefined
): LearningStyleScores | null {
  if (!mbti) {
    return null
  }

  return {
    visual: (mbti.S * 0.6 + mbti.J * 0.4),        // S + J 가중 평균
    auditory: mbti.E,                             // E 비율
    readWrite: mbti.I,                            // I 비율
    kinesthetic: (mbti.N * 0.6 + mbti.P * 0.4),  // N + P 가중 평균
  }
}

/**
 * 학습 스타일 유사도 계산 (유클리드 거리 기반)
 *
 * 두 학습 스타일 벡터 간의 코사인 유사도를 계산합니다.
 *
 * @param teacherMbti - 선생님 MBTI percentages (nullable)
 * @param studentMbti - 학생 MBTI percentages (nullable)
 * @returns 유사도 (0-1, 분석 미완료 시 0.5)
 */
export function calculateLearningStyleCompatibility(
  teacherMbti: MbtiPercentages | null | undefined,
  studentMbti: MbtiPercentages | null | undefined
): number {
  // 분석 미완료 시 기본값 반환
  if (!teacherMbti || !studentMbti) {
    return 0.5
  }

  const teacherStyle = deriveLearningStyle(teacherMbti)
  const studentStyle = deriveLearningStyle(studentMbti)

  if (!teacherStyle || !studentStyle) {
    return 0.5
  }

  // 코사인 유사도 계산
  const dotProduct =
    teacherStyle.visual * studentStyle.visual +
    teacherStyle.auditory * studentStyle.auditory +
    teacherStyle.readWrite * studentStyle.readWrite +
    teacherStyle.kinesthetic * studentStyle.kinesthetic

  const teacherMagnitude = Math.sqrt(
    teacherStyle.visual ** 2 +
    teacherStyle.auditory ** 2 +
    teacherStyle.readWrite ** 2 +
    teacherStyle.kinesthetic ** 2
  )

  const studentMagnitude = Math.sqrt(
    studentStyle.visual ** 2 +
    studentStyle.auditory ** 2 +
    studentStyle.readWrite ** 2 +
    studentStyle.kinesthetic ** 2
  )

  if (teacherMagnitude === 0 || studentMagnitude === 0) {
    return 0.5
  }

  const similarity = dotProduct / (teacherMagnitude * studentMagnitude)

  // 0-1 범위로 정규화
  return Math.max(0, Math.min(1, similarity))
}
