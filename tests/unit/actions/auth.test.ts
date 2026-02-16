import { describe, it, expect, vi, beforeEach } from "vitest"
import type { Teacher } from "@prisma/client"

// 모킹 설정
vi.mock("@/lib/db", () => ({
  db: {
    teacher: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock("@/lib/session", () => ({
  createSession: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new RedirectError(url)
  }),
}))

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue("127.0.0.1"),
  }),
}))

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockReturnValue({ success: true }),
}))

vi.mock("argon2", () => ({
  default: {
    verify: vi.fn(),
    hash: vi.fn(),
  },
}))

// redirect는 실제로 에러를 throw하므로 테스트에서 구분하기 위한 커스텀 에러
class RedirectError extends Error {
  url: string
  constructor(url: string) {
    super(`NEXT_REDIRECT: ${url}`)
    this.url = url
  }
}

import { db } from "@/lib/db"
import { createSession } from "@/lib/session"
import { redirect } from "next/navigation"
import argon2 from "argon2"
import { login } from "@/lib/actions/auth"

const mockDb = vi.mocked(db)
const mockCreateSession = vi.mocked(createSession)
const mockArgon2 = vi.mocked(argon2)
const mockRedirect = vi.mocked(redirect)

// FormData 헬퍼
function createFormData(data: Record<string, string>): FormData {
  const formData = new FormData()
  for (const [key, value] of Object.entries(data)) {
    formData.set(key, value)
  }
  return formData
}

const MOCK_TEACHER = {
  id: "teacher-1",
  email: "teacher@test.com",
  password: "hashed-password",
  name: "김선생",
  role: "TEACHER" as const,
  teamId: "team-1",
}

describe("login", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("올바른 자격증명으로 로그인에 성공한다", async () => {
    ;(mockDb.teacher.findUnique as any).mockResolvedValue(MOCK_TEACHER as Teacher)
    mockArgon2.verify.mockResolvedValue(true)
    mockCreateSession.mockResolvedValue(undefined)

    const formData = createFormData({
      email: "teacher@test.com",
      password: "test1234",
    })

    await expect(login({}, formData)).rejects.toThrow("NEXT_REDIRECT: /students")

    expect(mockDb.teacher.findUnique).toHaveBeenCalledWith({
      where: { email: "teacher@test.com" },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        teamId: true,
      },
    })
    expect(mockArgon2.verify).toHaveBeenCalledWith("hashed-password", "test1234")
    expect(mockCreateSession).toHaveBeenCalledWith("teacher-1", "TEACHER", "team-1")
  })

  it("잘못된 비밀번호로 로그인에 실패한다", async () => {
    ;(mockDb.teacher.findUnique as any).mockResolvedValue(MOCK_TEACHER as Teacher)
    mockArgon2.verify.mockResolvedValue(false)

    const formData = createFormData({
      email: "teacher@test.com",
      password: "wrongpassword",
    })

    const result = await login({}, formData)

    expect(result).toEqual({
      errors: {
        _form: ["이메일 또는 비밀번호가 일치하지 않아요. 다시 확인해주세요."],
      },
    })
    expect(mockCreateSession).not.toHaveBeenCalled()
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it("존재하지 않는 이메일로 로그인에 실패한다", async () => {
    ;(mockDb.teacher.findUnique as any).mockResolvedValue(null)

    const formData = createFormData({
      email: "nobody@test.com",
      password: "test1234",
    })

    const result = await login({}, formData)

    expect(result).toEqual({
      errors: {
        _form: ["이메일 또는 비밀번호가 일치하지 않아요. 다시 확인해주세요."],
      },
    })
    expect(mockArgon2.verify).not.toHaveBeenCalled()
    expect(mockCreateSession).not.toHaveBeenCalled()
  })

  it("유효하지 않은 이메일 형식은 검증에 실패한다", async () => {
    const formData = createFormData({
      email: "not-an-email",
      password: "test1234",
    })

    const result = await login({}, formData)

    expect(result.errors?.email).toBeDefined()
    expect(mockDb.teacher.findUnique).not.toHaveBeenCalled()
  })

  it("비밀번호가 8자 미만이면 검증에 실패한다", async () => {
    const formData = createFormData({
      email: "teacher@test.com",
      password: "short",
    })

    const result = await login({}, formData)

    expect(result.errors?.password).toBeDefined()
    expect(mockDb.teacher.findUnique).not.toHaveBeenCalled()
  })
})
