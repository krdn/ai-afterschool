/**
 * VARK 학습유형 점수 계산 엔진
 * 28문항 응답을 기반으로 VARK 유형과 백분율을 계산합니다.
 *
 * MBTI와의 핵심 차이:
 * - MBTI: 2극 대립 (E vs I) → 합계 100%
 * - VARK: 4극 독립 측정 → 각 유형의 절대 점수 비교
 * - 우세 유형이 복수일 수 있음 ("VK", "VAR" 등)
 */

export type VarkQuestion = {
  id: number
  type: string  // "V", "A", "R", "K"
  text: string
  description: string
}

export type VarkScores = {
  v: number
  a: number
  r: number
  k: number
}

export type VarkPercentages = {
  V: number
  A: number
  R: number
  K: number
}

export type VarkResult = {
  scores: VarkScores
  varkType: string       // 우세 유형: "V", "VK", "VARK" 등
  percentages: VarkPercentages
}

/**
 * 응답 진행도 계산
 */
export function calculateProgress(
  responses: Record<string, number>,
  totalQuestions: number
) {
  const answeredCount = Object.keys(responses).length
  const percentage = Math.round((answeredCount / totalQuestions) * 100)
  return { answeredCount, totalQuestions, percentage }
}

/**
 * VARK 점수 계산 및 우세 유형 결정
 *
 * 각 유형당 7문항, 리커트 5점(1~5)
 * 최소 7점, 최대 35점
 * 우세 유형: 전체 평균(25%) 대비 높은 유형 선택
 */
export function scoreVark(
  responses: Record<string, number>,
  questions: VarkQuestion[]
): VarkResult {
  const scores: VarkScores = { v: 0, a: 0, r: 0, k: 0 }

  // 각 문항의 응답을 해당 유형 점수에 누적
  for (const question of questions) {
    const response = responses[question.id.toString()]
    if (response !== undefined) {
      const type = question.type.toLowerCase() as keyof VarkScores
      scores[type] += response
    }
  }

  // 총점 기준 백분율 계산
  const total = scores.v + scores.a + scores.r + scores.k
  const percentages: VarkPercentages = {
    V: total > 0 ? Math.round((scores.v / total) * 100) : 25,
    A: total > 0 ? Math.round((scores.a / total) * 100) : 25,
    R: total > 0 ? Math.round((scores.r / total) * 100) : 25,
    K: total > 0 ? Math.round((scores.k / total) * 100) : 25,
  }

  // 반올림 오차 보정 (합이 100이 되도록)
  const pSum = percentages.V + percentages.A + percentages.R + percentages.K
  if (pSum !== 100 && total > 0) {
    const maxKey = (Object.keys(percentages) as (keyof VarkPercentages)[])
      .reduce((a, b) => percentages[a] >= percentages[b] ? a : b)
    percentages[maxKey] += (100 - pSum)
  }

  // 우세 유형 결정: 평균(25%) 이상인 유형들
  const varkType = determineVarkType(percentages)

  return { scores, varkType, percentages }
}

/**
 * 우세 유형 결정
 * 평균(25%) 대비 유의미하게 높은(3%p 이상) 유형을 우세로 판단
 * 모두 비슷하면 "VARK" (다중감각형)
 */
export function determineVarkType(percentages: VarkPercentages): string {
  const threshold = 25 // 균등 배분 기준
  const margin = 3     // 유의미한 차이 마진

  const types: Array<{ key: string; value: number }> = [
    { key: "V", value: percentages.V },
    { key: "A", value: percentages.A },
    { key: "R", value: percentages.R },
    { key: "K", value: percentages.K },
  ]

  // 평균+마진보다 높은 유형 필터링
  const dominant = types.filter(t => t.value >= threshold + margin)

  if (dominant.length === 0 || dominant.length === 4) {
    // 모두 비슷하면 다중감각형
    return "VARK"
  }

  // 점수 높은 순으로 정렬 후 유형 코드 결합
  return dominant
    .sort((a, b) => b.value - a.value)
    .map(t => t.key)
    .join("")
}
