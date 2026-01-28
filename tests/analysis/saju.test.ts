import { describe, it, expect } from "vitest"
import { calculateSaju } from "@/lib/analysis/saju"

describe("saju calculation", () => {
  it("computes pillars with time known in modern date", () => {
    const result = calculateSaju({
      birthDate: new Date("2002-03-21T00:00:00Z"),
      time: { hour: 10, minute: 30 },
      longitude: 127.0,
    })

    expect(result.pillars).toEqual({
      year: { stem: "임", branch: "오" },
      month: { stem: "계", branch: "묘" },
      day: { stem: "병", branch: "술" },
      hour: { stem: "계", branch: "사" },
    })
  })

  it("computes pillars without hour when time unknown", () => {
    const result = calculateSaju({
      birthDate: new Date("1995-10-07T00:00:00Z"),
      time: null,
      longitude: 127.0,
    })

    expect(result.pillars).toEqual({
      year: { stem: "을", branch: "해" },
      month: { stem: "을", branch: "유" },
      day: { stem: "무", branch: "진" },
      hour: null,
    })
  })

  it("applies DST adjustment for 1988 summer dates", () => {
    const result = calculateSaju({
      birthDate: new Date("1988-06-15T00:00:00Z"),
      time: { hour: 9, minute: 30 },
      longitude: 127.0,
    })

    expect(result.pillars).toEqual({
      year: { stem: "무", branch: "진" },
      month: { stem: "무", branch: "오" },
      day: { stem: "기", branch: "해" },
      hour: { stem: "무", branch: "진" },
    })
    expect(result.meta.dstAdjusted).toBe(true)
  })
})
