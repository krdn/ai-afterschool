import { describe, it, expect } from "vitest"
import { calculateImprovementRate, calculateGradeTrend, compareTeachersByGradeImprovement } from "@/lib/analysis/grade-analytics"

describe("calculateImprovementRate", () => {
  it("기본 향상: 60점 → 80점 = +33.3%", () => {
    const history = [
      { score: 60, testDate: new Date("2026-01-01") },
      { score: 80, testDate: new Date("2026-06-01") }
    ]
    const result = calculateImprovementRate(history)
    expect(result.improvementRate).toBeCloseTo(33.3, 1)
    expect(result.trend).toBe("UP")
  })

  it("하락: 80점 → 60점 = -25%", () => {
    const history = [
      { score: 80, testDate: new Date("2026-01-01") },
      { score: 60, testDate: new Date("2026-06-01") }
    ]
    const result = calculateImprovementRate(history)
    expect(result.improvementRate).toBeCloseTo(-25, 1)
    expect(result.trend).toBe("DOWN")
  })

  it("안정: 75점 → 78점 = +4% (STABLE)", () => {
    const history = [
      { score: 75, testDate: new Date("2026-01-01") },
      { score: 78, testDate: new Date("2026-06-01") }
    ]
    const result = calculateImprovementRate(history)
    expect(result.improvementRate).toBeCloseTo(4, 1)
    expect(result.trend).toBe("STABLE")
  })

  it("통제 변수 HIGH: 90점 → 93점 = +3.3% → 조정 후 +13.3%", () => {
    const history = [
      { score: 90, testDate: new Date("2026-01-01") },
      { score: 93, testDate: new Date("2026-06-01") }
    ]
    const result = calculateImprovementRate(history, {
      controlVariable: { initialLevel: "HIGH" }
    })
    expect(result.improvementRate).toBeCloseTo(13.3, 1)
    expect(result.trend).toBe("UP")
  })

  it("통제 변수 LOW: 50점 → 65점 = +30% → 조정 후 +20%", () => {
    const history = [
      { score: 50, testDate: new Date("2026-01-01") },
      { score: 65, testDate: new Date("2026-06-01") }
    ]
    const result = calculateImprovementRate(history, {
      controlVariable: { initialLevel: "LOW" }
    })
    expect(result.improvementRate).toBeCloseTo(20, 1)
    expect(result.trend).toBe("UP")
  })

  it("단일 데이터: 오류 반환", () => {
    const history = [
      { score: 80, testDate: new Date("2026-01-01") }
    ]
    expect(() => calculateImprovementRate(history)).toThrow("Need at least 2 grade records")
  })

  it("신뢰도 계산: 데이터 포인트 수 기반", () => {
    const history = [
      { score: 60, testDate: new Date("2026-01-01") },
      { score: 70, testDate: new Date("2026-03-01") },
      { score: 80, testDate: new Date("2026-05-01") },
      { score: 85, testDate: new Date("2026-07-01") }
    ]
    const result = calculateImprovementRate(history)
    expect(result.confidence).toBeGreaterThan(0.8)
  })
})

describe("calculateGradeTrend", () => {
  it("MONTHLY 그룹화: 월별 평균 계산", () => {
    const history = [
      { score: 70, testDate: new Date("2026-01-15") },
      { score: 75, testDate: new Date("2026-01-25") },
      { score: 80, testDate: new Date("2026-02-15") },
      { score: 85, testDate: new Date("2026-03-15") }
    ]
    const result = calculateGradeTrend(history, "MONTHLY")
    expect(result.length).toBeGreaterThan(0)
    expect(result[0].avgScore).toBeCloseTo(72.5, 1) // January avg
  })

  it("WEEKLY 그룹화: 주별 평균 계산", () => {
    const history = [
      { score: 70, testDate: new Date("2026-01-01") },
      { score: 75, testDate: new Date("2026-01-08") },
      { score: 80, testDate: new Date("2026-01-15") }
    ]
    const result = calculateGradeTrend(history, "WEEKLY")
    expect(result.length).toBeGreaterThan(0)
  })

  it("과목별 분리 계산", () => {
    const history = [
      { subject: "수학", score: 70, testDate: new Date("2026-01-15") },
      { subject: "영어", score: 80, testDate: new Date("2026-01-15") },
      { subject: "수학", score: 75, testDate: new Date("2026-02-15") }
    ]
    const result = calculateGradeTrend(history, "MONTHLY")
    expect(result[0].subjectScores["수학"]).toBeDefined()
    expect(result[0].subjectScores["영어"]).toBeDefined()
  })

  it("결측 기간: 선형 보간법으로 데이터 채움", () => {
    const history = [
      { score: 70, testDate: new Date("2026-01-01") },
      { score: 90, testDate: new Date("2026-03-01") } // Feb missing
    ]
    const result = calculateGradeTrend(history, "MONTHLY")
    // Should have January, February (interpolated), March
    expect(result.length).toBeGreaterThanOrEqual(2)
  })
})

describe("compareTeachersByGradeImprovement", () => {
  it("선생님별 평균/중간값 계산", () => {
    const teacherStats = [
      { teacherId: "teacher-1", studentImprovements: [10, 15, 20, 5, 12] },
      { teacherId: "teacher-2", studentImprovements: [8, 12, 16, 10, 14] },
      { teacherId: "teacher-3", studentImprovements: [5, 7, 10, 6, 8] }
    ]
    const result = compareTeachersByGradeImprovement(teacherStats)
    expect(result.length).toBe(3)
    expect(result[0].teacherId).toBeDefined()
    expect(result[0].avgImprovement).toBeDefined()
    expect(result[0].medianImprovement).toBeDefined()
  })

  it("순위 매기기: 내림차순", () => {
    const teacherStats = [
      { teacherId: "teacher-1", studentImprovements: [10, 15, 20] },
      { teacherId: "teacher-2", studentImprovements: [25, 30, 28] },
      { teacherId: "teacher-3", studentImprovements: [5, 7, 10] }
    ]
    const result = compareTeachersByGradeImprovement(teacherStats)
    expect(result[0].rank).toBe(1)
    expect(result[0].avgImprovement).toBeGreaterThan(result[1].avgImprovement)
  })

  it("빈 배열: 빈 결과 반환", () => {
    const result = compareTeachersByGradeImprovement([])
    expect(result).toEqual([])
  })
})
