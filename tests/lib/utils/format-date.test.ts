import { describe, it, expect } from "vitest"
import { formatDate } from "../../../src/lib/utils/format-date"

describe("formatDate", () => {
  it("should return today when no input provided", () => {
    const result = formatDate()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it("should format Date object correctly", () => {
    const date = new Date("2026-01-15T10:30:00")
    expect(formatDate(date)).toBe("2026-01-15")
  })

  it("should format ISO string correctly", () => {
    expect(formatDate("2026-01-15T10:30:00")).toBe("2026-01-15")
  })

  it("should format date string correctly", () => {
    expect(formatDate("2026-01-15")).toBe("2026-01-15")
  })

  it("should throw error for invalid date", () => {
    expect(() => formatDate("invalid")).toThrow("Invalid date input provided")
  })

  it("should return today when null is passed", () => {
    const result = formatDate(null)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
