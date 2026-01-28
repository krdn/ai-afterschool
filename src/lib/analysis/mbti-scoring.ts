/**
 * MBTI 점수 계산 엔진
 * 60문항 응답을 기반으로 MBTI 유형과 차원별 백분율을 계산합니다.
 */

export type Question = {
  id: number
  dimension: string
  pole: string
  text: string
  description: string
}

export type MbtiScores = {
  e: number
  i: number
  s: number
  n: number
  t: number
  f: number
  j: number
  p: number
}

export type MbtiPercentages = {
  E: number
  I: number
  S: number
  N: number
  T: number
  F: number
  J: number
  P: number
}

export type MbtiResult = {
  scores: MbtiScores
  mbtiType: string
  percentages: MbtiPercentages
}

/**
 * 응답 진행도 계산
 * @param responses - 응답 객체 { "1": 3, "2": 5, ... }
 * @param totalQuestions - 전체 문항 수
 * @returns 응답 완료 수, 전체 문항 수, 진행률(%)
 */
export function calculateProgress(
  responses: Record<string, number>,
  totalQuestions: number
) {
  const answeredCount = Object.keys(responses).length
  const percentage = Math.round((answeredCount / totalQuestions) * 100)

  return {
    answeredCount,
    totalQuestions,
    percentage,
  }
}

/**
 * MBTI 점수 계산 및 유형 결정
 * @param responses - 응답 객체 { "1": 3, "2": 5, ... }
 * @param questions - 문항 배열 (dimension, pole 정보 포함)
 * @returns MBTI 유형, 차원별 점수, 차원별 백분율
 */
export function scoreMbti(
  responses: Record<string, number>,
  questions: Question[]
): MbtiResult {
  // 각 pole별 점수 초기화
  const scores: MbtiScores = {
    e: 0,
    i: 0,
    s: 0,
    n: 0,
    t: 0,
    f: 0,
    j: 0,
    p: 0,
  }

  // 각 문항의 응답을 해당 pole 점수에 누적
  for (const question of questions) {
    const response = responses[question.id.toString()]
    if (response !== undefined) {
      const pole = question.pole.toLowerCase() as keyof MbtiScores
      scores[pole] += response
    }
  }

  // 각 차원별로 백분율 계산 및 유형 결정
  const percentages: MbtiPercentages = {
    E: 0,
    I: 0,
    S: 0,
    N: 0,
    T: 0,
    F: 0,
    J: 0,
    P: 0,
  }

  let mbtiType = ""

  // E vs I
  const totalEI = scores.e + scores.i
  if (totalEI > 0) {
    percentages.E = Math.round((scores.e / totalEI) * 100)
    percentages.I = 100 - percentages.E
    mbtiType += scores.e >= scores.i ? "E" : "I"
  }

  // S vs N
  const totalSN = scores.s + scores.n
  if (totalSN > 0) {
    percentages.S = Math.round((scores.s / totalSN) * 100)
    percentages.N = 100 - percentages.S
    mbtiType += scores.s >= scores.n ? "S" : "N"
  }

  // T vs F
  const totalTF = scores.t + scores.f
  if (totalTF > 0) {
    percentages.T = Math.round((scores.t / totalTF) * 100)
    percentages.F = 100 - percentages.T
    mbtiType += scores.t >= scores.f ? "T" : "F"
  }

  // J vs P
  const totalJP = scores.j + scores.p
  if (totalJP > 0) {
    percentages.J = Math.round((scores.j / totalJP) * 100)
    percentages.P = 100 - percentages.J
    mbtiType += scores.j >= scores.p ? "J" : "P"
  }

  return {
    scores,
    mbtiType,
    percentages,
  }
}
