import { describe, it, expect } from "vitest"
import { scoreVark, determineVarkType, calculateProgress } from "@/lib/analysis/vark-scoring"
import type { VarkQuestion } from "@/lib/analysis/vark-scoring"

// 7문항씩 4유형 (28문항) 테스트용 문항
const mockQuestions: VarkQuestion[] = Array.from({ length: 28 }, (_, i) => ({
  id: i + 1,
  type: ["V", "A", "R", "K"][Math.floor(i / 7)],
  text: `문항 ${i + 1}`,
  description: "",
}))

describe("VARK scoring", () => {
  it("calculates scores from responses", () => {
    // 모든 문항에 3점 응답 → 각 유형 21점씩 (균등)
    const responses: Record<string, number> = {}
    for (let i = 1; i <= 28; i++) {
      responses[i.toString()] = 3
    }

    const result = scoreVark(responses, mockQuestions)
    expect(result.scores).toEqual({ v: 21, a: 21, r: 21, k: 21 })
    expect(result.percentages.V).toBe(25)
    expect(result.percentages.A).toBe(25)
    expect(result.percentages.R).toBe(25)
    expect(result.percentages.K).toBe(25)
  })

  it("identifies dominant type when one is clearly higher", () => {
    // V=5, 나머지=1 → V가 명확히 우세
    const responses: Record<string, number> = {}
    for (let i = 1; i <= 7; i++) responses[i.toString()] = 5  // V
    for (let i = 8; i <= 28; i++) responses[i.toString()] = 1  // A,R,K

    const result = scoreVark(responses, mockQuestions)
    expect(result.scores.v).toBe(35)
    expect(result.scores.a).toBe(7)
    expect(result.varkType).toBe("V")
  })

  it("identifies multiple dominant types", () => {
    // V=5, K=5, A=1, R=1 → VK 복합 유형
    const responses: Record<string, number> = {}
    for (let i = 1; i <= 7; i++) responses[i.toString()] = 5  // V
    for (let i = 8; i <= 14; i++) responses[i.toString()] = 1  // A
    for (let i = 15; i <= 21; i++) responses[i.toString()] = 1 // R
    for (let i = 22; i <= 28; i++) responses[i.toString()] = 5 // K

    const result = scoreVark(responses, mockQuestions)
    expect(result.varkType).toBe("VK")
  })

  it("returns VARK when all scores are similar", () => {
    const responses: Record<string, number> = {}
    for (let i = 1; i <= 28; i++) responses[i.toString()] = 3

    const result = scoreVark(responses, mockQuestions)
    expect(result.varkType).toBe("VARK")
  })

  it("ensures percentages sum to 100", () => {
    // 비대칭 점수로 반올림 오차 발생 가능
    const responses: Record<string, number> = {}
    for (let i = 1; i <= 7; i++) responses[i.toString()] = 4  // V
    for (let i = 8; i <= 14; i++) responses[i.toString()] = 3  // A
    for (let i = 15; i <= 21; i++) responses[i.toString()] = 2 // R
    for (let i = 22; i <= 28; i++) responses[i.toString()] = 1 // K

    const result = scoreVark(responses, mockQuestions)
    const sum = result.percentages.V + result.percentages.A +
                result.percentages.R + result.percentages.K
    expect(sum).toBe(100)
  })

  it("handles empty responses gracefully", () => {
    const result = scoreVark({}, mockQuestions)
    expect(result.scores).toEqual({ v: 0, a: 0, r: 0, k: 0 })
    expect(result.varkType).toBe("VARK")
  })
})

describe("determineVarkType", () => {
  it("returns single dominant type", () => {
    expect(determineVarkType({ V: 40, A: 20, R: 20, K: 20 })).toBe("V")
  })

  it("returns multiple dominant types sorted by score", () => {
    expect(determineVarkType({ V: 35, A: 15, R: 15, K: 35 })).toContain("V")
    expect(determineVarkType({ V: 35, A: 15, R: 15, K: 35 })).toContain("K")
  })

  it("returns VARK when all are near equal", () => {
    expect(determineVarkType({ V: 25, A: 25, R: 25, K: 25 })).toBe("VARK")
    expect(determineVarkType({ V: 26, A: 24, R: 26, K: 24 })).toBe("VARK")
  })

  it("returns VARK when all are above threshold", () => {
    expect(determineVarkType({ V: 28, A: 28, R: 28, K: 16 })).not.toBe("VARK")
    expect(determineVarkType({ V: 28, A: 28, R: 28, K: 16 })).toBe("VAR")
  })
})

describe("calculateProgress", () => {
  it("calculates progress correctly", () => {
    const result = calculateProgress({ "1": 3, "2": 4 }, 28)
    expect(result.answeredCount).toBe(2)
    expect(result.totalQuestions).toBe(28)
    expect(result.percentage).toBe(7)
  })

  it("returns 100% when all answered", () => {
    const responses: Record<string, number> = {}
    for (let i = 1; i <= 28; i++) responses[i.toString()] = 3
    const result = calculateProgress(responses, 28)
    expect(result.percentage).toBe(100)
  })

  it("returns 0% for empty responses", () => {
    const result = calculateProgress({}, 28)
    expect(result.percentage).toBe(0)
  })
})
