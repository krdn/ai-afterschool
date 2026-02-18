import { describe, it, expect, vi, beforeEach } from "vitest"

// db mock
vi.mock("@/lib/db", () => ({
  db: {
    mbtiAnalysis: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    sajuAnalysis: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    nameAnalysis: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

import { db } from "@/lib/db"
import { fetchSubjectAnalyses, fetchBatchAnalyses, fetchPairAnalyses } from "@/lib/db/matching/fetch-analysis"

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma 타입이 vi.mocked와 호환되지 않음
const mockedDb = db as any

describe("fetchSubjectAnalyses", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("분석 데이터가 있으면 파싱된 결과를 반환한다", async () => {
    const mbtiData = { E: 60, I: 40, S: 55, N: 45, T: 70, F: 30, J: 65, P: 35 }
    const sajuData = {
      fourPillars: { year: {}, month: {}, day: {}, hour: {} },
      fiveElements: { wood: 1, fire: 1, earth: 1, metal: 1, water: 1 },
    }
    const nameData = {
      numerology: {
        split: { surname: "김", givenName: "철수", surnameLength: 1, givenNameLength: 2 },
        strokes: { perSyllable: [8, 10, 3], surname: 8, givenName: 13, total: 21 },
        grids: { won: 10, hyung: 18, yi: 13, jeong: 21 },
        interpretations: { won: "", hyung: "", yi: "", jeong: "" },
      },
    }

    mockedDb.mbtiAnalysis.findUnique.mockResolvedValue({ percentages: mbtiData } as any)
    mockedDb.sajuAnalysis.findUnique.mockResolvedValue({ result: sajuData } as any)
    mockedDb.nameAnalysis.findUnique.mockResolvedValue({ result: nameData } as any)

    const result = await fetchSubjectAnalyses("student-1", "STUDENT")

    expect(result.mbti).toEqual(mbtiData)
    expect(result.saju).toEqual(sajuData)
    expect(result.name).not.toBeNull()
    expect(result.name?.grids.won).toBe(10)
  })

  it("분석 데이터가 없으면 null을 반환한다", async () => {
    mockedDb.mbtiAnalysis.findUnique.mockResolvedValue(null)
    mockedDb.sajuAnalysis.findUnique.mockResolvedValue(null)
    mockedDb.nameAnalysis.findUnique.mockResolvedValue(null)

    const result = await fetchSubjectAnalyses("student-1", "STUDENT")

    expect(result.mbti).toBeNull()
    expect(result.saju).toBeNull()
    expect(result.name).toBeNull()
  })

  it("올바른 subjectType과 subjectId로 DB를 조회한다", async () => {
    mockedDb.mbtiAnalysis.findUnique.mockResolvedValue(null)
    mockedDb.sajuAnalysis.findUnique.mockResolvedValue(null)
    mockedDb.nameAnalysis.findUnique.mockResolvedValue(null)

    await fetchSubjectAnalyses("teacher-1", "TEACHER")

    expect(mockedDb.mbtiAnalysis.findUnique).toHaveBeenCalledWith({
      where: { subjectType_subjectId: { subjectType: "TEACHER", subjectId: "teacher-1" } },
      select: { percentages: true },
    })
  })
})

describe("fetchBatchAnalyses", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("여러 대상의 분석 데이터를 Map으로 반환한다", async () => {
    const mbtiData = { E: 60, I: 40, S: 55, N: 45, T: 70, F: 30, J: 65, P: 35 }

    mockedDb.mbtiAnalysis.findMany.mockResolvedValue([
      { subjectId: "t1", percentages: mbtiData } as any,
    ])
    mockedDb.sajuAnalysis.findMany.mockResolvedValue([])
    mockedDb.nameAnalysis.findMany.mockResolvedValue([])

    const result = await fetchBatchAnalyses(["t1", "t2"], "TEACHER")

    expect(result.get("t1")?.mbti).toEqual(mbtiData)
    expect(result.get("t1")?.saju).toBeNull()
    expect(result.get("t2")?.mbti).toBeNull()
    expect(result.get("t2")?.saju).toBeNull()
  })

  it("빈 ID 배열이면 빈 Map을 반환한다", async () => {
    const result = await fetchBatchAnalyses([], "TEACHER")
    expect(result.size).toBe(0)
    // DB 호출이 없어야 함
    expect(mockedDb.mbtiAnalysis.findMany).not.toHaveBeenCalled()
  })
})

describe("fetchPairAnalyses", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("선생님과 학생의 분석 데이터를 한 번에 조회한다", async () => {
    const mbtiData = { E: 60, I: 40, S: 55, N: 45, T: 70, F: 30, J: 65, P: 35 }

    // teacher용 mock
    mockedDb.mbtiAnalysis.findUnique
      .mockResolvedValueOnce({ percentages: mbtiData } as any) // teacher mbti
      .mockResolvedValueOnce(null) // student mbti
    mockedDb.sajuAnalysis.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
    mockedDb.nameAnalysis.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)

    const result = await fetchPairAnalyses("teacher-1", "student-1")

    expect(result.teacher.mbti).toEqual(mbtiData)
    expect(result.student.mbti).toBeNull()
  })
})
