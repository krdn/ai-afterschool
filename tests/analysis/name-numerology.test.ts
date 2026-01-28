import { describe, it, expect } from "vitest"
import { calculateNameNumerology } from "@/lib/analysis/name-numerology"

describe("name numerology", () => {
  it("computes grids for a 2-char name", () => {
    const outcome = calculateNameNumerology({
      name: "김철",
      hanjaName: "金哲",
    })

    expect(outcome.status).toBe("ok")

    if (outcome.status !== "ok") return

    expect(outcome.result.split).toEqual({
      surname: "김",
      givenName: "철",
      surnameLength: 1,
      givenNameLength: 1,
    })
    expect(outcome.result.grids).toEqual({
      won: 18,
      hyung: 18,
      yi: 10,
      jeong: 18,
    })
    expect(outcome.result.interpretations.won.length).toBeGreaterThan(0)
  })

  it("computes grids for a 3-char name", () => {
    const outcome = calculateNameNumerology({
      name: "홍길동",
      hanjaName: "洪吉東",
    })

    expect(outcome.status).toBe("ok")

    if (outcome.status !== "ok") return

    expect(outcome.result.split).toEqual({
      surname: "홍",
      givenName: "길동",
      surnameLength: 1,
      givenNameLength: 2,
    })
    expect(outcome.result.grids).toEqual({
      won: 18,
      hyung: 16,
      yi: 14,
      jeong: 24,
    })
  })

  it("supports double surname with 4-char name", () => {
    const outcome = calculateNameNumerology({
      name: "남궁민수",
      hanjaName: "南宮敏秀",
    })

    expect(outcome.status).toBe("ok")

    if (outcome.status !== "ok") return

    expect(outcome.result.split).toEqual({
      surname: "남궁",
      givenName: "민수",
      surnameLength: 2,
      givenNameLength: 2,
    })
    expect(outcome.result.grids).toEqual({
      won: 16,
      hyung: 30,
      yi: 18,
      jeong: 37,
    })
  })

  it("returns missing hanja status when selection is empty", () => {
    const outcome = calculateNameNumerology({
      name: "홍길동",
      hanjaName: null,
    })

    expect(outcome.status).toBe("missing-hanja")
  })
})
