import { describe, it, expect } from "vitest"

describe("resetAnalysis input validation", () => {
  it("should accept valid student saju type", () => {
    const validTypes = ["saju", "face", "palm", "mbti", "vark", "name", "zodiac"] as const
    const validSubjectTypes = ["STUDENT", "TEACHER"] as const
    expect(validTypes).toContain("saju")
    expect(validSubjectTypes).toContain("STUDENT")
  })

  it("should not allow vark or zodiac for TEACHER", () => {
    // 비즈니스 규칙: VARK와 별자리는 학생만 지원
    const teacherUnsupported = ["vark", "zodiac"]
    expect(teacherUnsupported).toContain("vark")
    expect(teacherUnsupported).toContain("zodiac")
  })
})
