import { describe, it, expect } from "vitest"
import { getZodiacSign } from "@/lib/analysis/zodiac"

describe("zodiac sign determination", () => {
  // 경계값 테스트: 각 별자리의 시작일과 종료일
  const cases: Array<{ date: string; expected: string }> = [
    // 염소자리: 12/22 ~ 1/19
    { date: "2000-01-01", expected: "capricorn" },
    { date: "2000-01-19", expected: "capricorn" },
    { date: "2000-12-22", expected: "capricorn" },
    { date: "2000-12-31", expected: "capricorn" },

    // 물병자리: 1/20 ~ 2/18
    { date: "2000-01-20", expected: "aquarius" },
    { date: "2000-02-18", expected: "aquarius" },

    // 물고기자리: 2/19 ~ 3/20
    { date: "2000-02-19", expected: "pisces" },
    { date: "2000-03-20", expected: "pisces" },

    // 양자리: 3/21 ~ 4/19
    { date: "2000-03-21", expected: "aries" },
    { date: "2000-04-19", expected: "aries" },

    // 황소자리: 4/20 ~ 5/20
    { date: "2000-04-20", expected: "taurus" },
    { date: "2000-05-20", expected: "taurus" },

    // 쌍둥이자리: 5/21 ~ 6/21
    { date: "2000-05-21", expected: "gemini" },
    { date: "2000-06-21", expected: "gemini" },

    // 게자리: 6/22 ~ 7/22
    { date: "2000-06-22", expected: "cancer" },
    { date: "2000-07-22", expected: "cancer" },

    // 사자자리: 7/23 ~ 8/22
    { date: "2000-07-23", expected: "leo" },
    { date: "2000-08-22", expected: "leo" },

    // 처녀자리: 8/23 ~ 9/22
    { date: "2000-08-23", expected: "virgo" },
    { date: "2000-09-22", expected: "virgo" },

    // 천칭자리: 9/23 ~ 10/22
    { date: "2000-09-23", expected: "libra" },
    { date: "2000-10-22", expected: "libra" },

    // 전갈자리: 10/23 ~ 11/21
    { date: "2000-10-23", expected: "scorpio" },
    { date: "2000-11-21", expected: "scorpio" },

    // 궁수자리: 11/22 ~ 12/21
    { date: "2000-11-22", expected: "sagittarius" },
    { date: "2000-12-21", expected: "sagittarius" },
  ]

  it.each(cases)("$date → $expected", ({ date, expected }) => {
    const result = getZodiacSign(new Date(date))
    expect(result.key).toBe(expected)
  })

  it("returns valid zodiac sign with all required properties", () => {
    const sign = getZodiacSign(new Date("2000-06-15"))
    expect(sign.key).toBe("gemini")
    expect(sign.name).toBe("쌍둥이자리")
    expect(sign.element).toBe("air")
    expect(sign.symbol).toBeTruthy()
    expect(sign.traits.length).toBeGreaterThan(0)
    expect(sign.strengths.length).toBeGreaterThan(0)
    expect(sign.weaknesses.length).toBeGreaterThan(0)
    expect(sign.learningStyle).toBeTruthy()
  })
})
