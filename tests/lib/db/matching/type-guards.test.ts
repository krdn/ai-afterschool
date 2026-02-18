import { describe, it, expect } from "vitest"
import { parseMbtiPercentages, parseSajuResult, parseNameNumerology } from "@/lib/db/matching/type-guards"

describe("parseMbtiPercentages", () => {
  it("유효한 MBTI 퍼센티지를 반환한다", () => {
    const valid = { E: 60, I: 40, S: 55, N: 45, T: 70, F: 30, J: 65, P: 35 }
    expect(parseMbtiPercentages(valid)).toEqual(valid)
  })

  it("null 입력이면 null을 반환한다", () => {
    expect(parseMbtiPercentages(null)).toBeNull()
    expect(parseMbtiPercentages(undefined)).toBeNull()
  })

  it("유효하지 않은 구조면 null을 반환한다", () => {
    expect(parseMbtiPercentages({ E: 60 })).toBeNull()
    expect(parseMbtiPercentages("string")).toBeNull()
    expect(parseMbtiPercentages(42)).toBeNull()
  })
})

describe("parseSajuResult", () => {
  it("유효한 사주 결과를 반환한다", () => {
    const valid = {
      fourPillars: { year: {}, month: {}, day: {}, hour: {} },
      fiveElements: { wood: 1, fire: 1, earth: 1, metal: 1, water: 1 },
    }
    expect(parseSajuResult(valid)).toEqual(valid)
  })

  it("null 입력이면 null을 반환한다", () => {
    expect(parseSajuResult(null)).toBeNull()
  })

  it("필수 필드가 없으면 null을 반환한다", () => {
    expect(parseSajuResult({ fourPillars: {} })).toBeNull()
    expect(parseSajuResult({})).toBeNull()
  })
})

describe("parseNameNumerology", () => {
  it("유효한 이름 분석 결과를 추출한다", () => {
    const dbResult = {
      hasHanja: true,
      numerology: {
        split: { surname: "김", givenName: "철수", surnameLength: 1, givenNameLength: 2 },
        strokes: { perSyllable: [8, 10, 3], surname: 8, givenName: 13, total: 21 },
        grids: { won: 10, hyung: 18, yi: 13, jeong: 21 },
        interpretations: { won: "", hyung: "", yi: "", jeong: "" },
      },
    }
    const result = parseNameNumerology(dbResult)
    expect(result).not.toBeNull()
    expect(result?.grids.won).toBe(10)
  })

  it("null 입력이면 null을 반환한다", () => {
    expect(parseNameNumerology(null)).toBeNull()
    expect(parseNameNumerology(undefined)).toBeNull()
  })

  it("numerology 필드가 없으면 null을 반환한다", () => {
    expect(parseNameNumerology({ hasHanja: false })).toBeNull()
    expect(parseNameNumerology({})).toBeNull()
  })
})
