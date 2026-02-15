import { describe, it, expect, vi, beforeEach } from "vitest"
import type { Student, Teacher } from "@prisma/client"

// 모킹 설정
vi.mock("@/lib/db", () => ({
  db: {
    student: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock("@/lib/dal", () => ({
  verifySession: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

import { db } from "@/lib/db"
import { verifySession } from "@/lib/dal"
import { revalidatePath } from "next/cache"
import { getStudents, getStudentById, deleteStudent } from "@/lib/actions/student"

const mockDb = vi.mocked(db)
const mockVerifySession = vi.mocked(verifySession)
const mockRevalidatePath = vi.mocked(revalidatePath)

// 테스트 데이터
const DIRECTOR_SESSION = {
  isAuth: true as const,
  userId: "director-1",
  role: "DIRECTOR" as const,
  teamId: null,
}

const TEACHER_SESSION = {
  isAuth: true as const,
  userId: "teacher-1",
  role: "TEACHER" as const,
  teamId: "team-1",
}

type StudentWithRelations = Student & {
  teacher: Pick<Teacher, 'id' | 'name'>
  images: unknown[]
}

const MOCK_STUDENTS: StudentWithRelations[] = [
  {
    id: "student-1",
    name: "홍길동",
    teacherId: "teacher-1",
    createdAt: new Date("2025-01-01"),
    teacher: { id: "teacher-1", name: "김선생" },
    images: [],
  } as StudentWithRelations,
  {
    id: "student-2",
    name: "이순신",
    teacherId: "teacher-1",
    createdAt: new Date("2025-01-02"),
    teacher: { id: "teacher-1", name: "김선생" },
    images: [],
  } as StudentWithRelations,
]

describe("getStudents", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("인증된 사용자가 학생 목록을 조회한다", async () => {
    mockVerifySession.mockResolvedValue(DIRECTOR_SESSION)
    mockDb.student.findMany.mockResolvedValue(MOCK_STUDENTS)

    const result = await getStudents()

    expect(mockVerifySession).toHaveBeenCalled()
    expect(mockDb.student.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { createdAt: "desc" },
      include: { teacher: true, images: true },
    })
    expect(result).toEqual(MOCK_STUDENTS)
  })

  it("TEACHER 역할은 자기 학생만 조회한다", async () => {
    mockVerifySession.mockResolvedValue(TEACHER_SESSION)
    mockDb.student.findMany.mockResolvedValue(MOCK_STUDENTS)

    await getStudents()

    expect(mockDb.student.findMany).toHaveBeenCalledWith({
      where: { teacherId: "teacher-1" },
      orderBy: { createdAt: "desc" },
      include: { teacher: true, images: true },
    })
  })

  it("검색어가 있으면 이름 필터링을 적용한다", async () => {
    mockVerifySession.mockResolvedValue(DIRECTOR_SESSION)
    mockDb.student.findMany.mockResolvedValue([MOCK_STUDENTS[0]])

    await getStudents("홍길동")

    expect(mockDb.student.findMany).toHaveBeenCalledWith({
      where: { name: { contains: "홍길동", mode: "insensitive" } },
      orderBy: { createdAt: "desc" },
      include: { teacher: true, images: true },
    })
  })
})

describe("getStudentById", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("DIRECTOR 역할은 findUnique로 학생을 조회한다", async () => {
    mockVerifySession.mockResolvedValue(DIRECTOR_SESSION)
    mockDb.student.findUnique.mockResolvedValue(MOCK_STUDENTS[0])

    const result = await getStudentById("student-1")

    expect(mockDb.student.findUnique).toHaveBeenCalledWith({
      where: { id: "student-1" },
      include: { parents: true, teacher: true, images: true },
    })
    expect(result).toEqual(MOCK_STUDENTS[0])
  })

  it("TEACHER 역할은 findFirst로 자기 학생만 조회한다", async () => {
    mockVerifySession.mockResolvedValue(TEACHER_SESSION)
    mockDb.student.findFirst.mockResolvedValue(MOCK_STUDENTS[0])

    const result = await getStudentById("student-1")

    expect(mockDb.student.findFirst).toHaveBeenCalledWith({
      where: { id: "student-1", teacherId: "teacher-1" },
      include: { parents: true, teacher: true, images: true },
    })
    expect(result).toEqual(MOCK_STUDENTS[0])
    expect(mockDb.student.findUnique).not.toHaveBeenCalled()
  })

  it("TEACHER 역할은 다른 교사의 학생을 조회할 수 없다", async () => {
    mockVerifySession.mockResolvedValue(TEACHER_SESSION)
    mockDb.student.findFirst.mockResolvedValue(null)

    const result = await getStudentById("student-other")

    expect(mockDb.student.findFirst).toHaveBeenCalledWith({
      where: { id: "student-other", teacherId: "teacher-1" },
      include: { parents: true, teacher: true, images: true },
    })
    expect(result).toBeNull()
  })
})

describe("deleteStudent", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("DIRECTOR 역할은 학생을 정상 삭제한다", async () => {
    mockVerifySession.mockResolvedValue(DIRECTOR_SESSION)
    mockDb.student.delete.mockResolvedValue(MOCK_STUDENTS[0])

    await deleteStudent("student-1")

    expect(mockDb.student.findFirst).not.toHaveBeenCalled()
    expect(mockDb.student.delete).toHaveBeenCalledWith({
      where: { id: "student-1" },
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith("/students")
  })

  it("TEACHER 역할은 자기 학생을 삭제할 수 있다", async () => {
    mockVerifySession.mockResolvedValue(TEACHER_SESSION)
    mockDb.student.findFirst.mockResolvedValue({ id: "student-1" })
    mockDb.student.delete.mockResolvedValue(MOCK_STUDENTS[0])

    await deleteStudent("student-1")

    expect(mockDb.student.findFirst).toHaveBeenCalledWith({
      where: { id: "student-1", teacherId: "teacher-1" },
      select: { id: true },
    })
    expect(mockDb.student.delete).toHaveBeenCalledWith({
      where: { id: "student-1" },
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith("/students")
  })

  it("TEACHER 역할은 다른 교사의 학생을 삭제할 수 없다", async () => {
    mockVerifySession.mockResolvedValue(TEACHER_SESSION)
    mockDb.student.findFirst.mockResolvedValue(null)

    await expect(deleteStudent("student-other")).rejects.toThrow(
      "Forbidden: 해당 학생에 대한 권한이 없습니다"
    )

    expect(mockDb.student.delete).not.toHaveBeenCalled()
    expect(mockRevalidatePath).not.toHaveBeenCalled()
  })
})
