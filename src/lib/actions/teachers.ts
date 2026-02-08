"use server"

import { redirect } from "next/navigation"
import argon2 from "argon2"
import { verifySession } from "@/lib/dal"
import { db } from "@/lib/db"
import { TeacherSchema, UpdateTeacherSchema } from "@/lib/validations/teachers"

const DEFAULT_PASSWORD = "afterschool2026!"

export type TeacherFormState = {
  errors?: {
    name?: string[]
    email?: string[]
    role?: string[]
    teamId?: string[]
    phone?: string[]
    birthDate?: string[]
    nameHanja?: string[]
    birthTimeHour?: string[]
    birthTimeMinute?: string[]
    _form?: string[]
  }
  message?: string
}

export async function createTeacher(
  prevState: TeacherFormState,
  formData: FormData
): Promise<TeacherFormState> {
  const session = await verifySession()

  // 권한 검증: 원장만 선생님 생성 가능
  if (session.role !== 'DIRECTOR') {
    return {
      errors: {
        _form: ["선생님을 생성할 권한이 없어요"],
      },
    }
  }

  const rawBirthTimeHour = formData.get("birthTimeHour")
  const rawBirthTimeMinute = formData.get("birthTimeMinute")

  const validatedFields = TeacherSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    teamId: formData.get("teamId") || null,
    phone: formData.get("phone"),
    birthDate: formData.get("birthDate"),
    nameHanja: formData.get("nameHanja") || undefined,
    birthTimeHour: rawBirthTimeHour !== null && rawBirthTimeHour !== "" ? Number(rawBirthTimeHour) : null,
    birthTimeMinute: rawBirthTimeMinute !== null && rawBirthTimeMinute !== "" ? Number(rawBirthTimeMinute) : null,
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { name, email, role, teamId, phone, birthDate, nameHanja, birthTimeHour, birthTimeMinute } = validatedFields.data

  // 이메일 중복 검증
  const existingTeacher = await db.teacher.findUnique({
    where: { email },
  })

  if (existingTeacher) {
    return {
      errors: {
        email: ["이미 사용 중인 이메일이에요"],
      },
    }
  }

  // 팀 존재 검증 (teamId가 있는 경우)
  if (teamId) {
    const team = await db.team.findUnique({
      where: { id: teamId },
    })

    if (!team) {
      return {
        errors: {
          teamId: ["존재하지 않는 팀이에요"],
        },
      }
    }
  }

  const hashedPassword = await argon2.hash(DEFAULT_PASSWORD)

  try {
    await db.teacher.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        teamId,
        phone,
        birthDate: new Date(birthDate),
        nameHanja: nameHanja || null,
        birthTimeHour: birthTimeHour ?? null,
        birthTimeMinute: birthTimeMinute ?? null,
      },
    })
  } catch (error) {
    console.error("Failed to create teacher:", error)
    return {
      errors: {
        _form: ["선생님 생성 중 오류가 발생했어요"],
      },
    }
  }

  redirect("/teachers")
}

export async function updateTeacher(
  id: string,
  prevState: TeacherFormState,
  formData: FormData
): Promise<TeacherFormState> {
  const session = await verifySession()

  // 권한 검증: 원장 또는 본인만 수정 가능
  const teacher = await db.teacher.findUnique({
    where: { id },
    select: { id: true, role: true, teamId: true, email: true },
  })

  if (!teacher) {
    return {
      errors: {
        _form: ["선생님을 찾을 수 없어요"],
      },
    }
  }

  if (session.role !== 'DIRECTOR' && session.userId !== id) {
    return {
      errors: {
        _form: ["선생님을 수정할 권한이 없어요"],
      },
    }
  }

  const rawBirthTimeHour = formData.get("birthTimeHour")
  const rawBirthTimeMinute = formData.get("birthTimeMinute")

  const validatedFields = UpdateTeacherSchema.safeParse({
    name: formData.get("name") || undefined,
    email: formData.get("email") || undefined,
    password: formData.get("password") || undefined,
    role: formData.get("role") || undefined,
    teamId: formData.get("teamId") || null,
    phone: formData.get("phone") || undefined,
    birthDate: formData.get("birthDate") || undefined,
    nameHanja: formData.get("nameHanja") || undefined,
    birthTimeHour: rawBirthTimeHour !== null && rawBirthTimeHour !== "" ? Number(rawBirthTimeHour) : undefined,
    birthTimeMinute: rawBirthTimeMinute !== null && rawBirthTimeMinute !== "" ? Number(rawBirthTimeMinute) : undefined,
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { birthDate, nameHanja, birthTimeHour, birthTimeMinute, ...restData } = validatedFields.data

  // 이메일 중복 검증 (이메일 변경 시)
  if (restData.email && restData.email !== teacher.email) {
    const existingTeacher = await db.teacher.findUnique({
      where: { email: restData.email },
    })

    if (existingTeacher) {
      return {
        errors: {
          email: ["이미 사용 중인 이메일이에요"],
        },
      }
    }
  }

  // 비밀번호 해싱
  if (restData.password) {
    restData.password = await argon2.hash(restData.password)
  }

  const updateData: Record<string, unknown> = { ...restData }
  if (birthDate !== undefined) updateData.birthDate = new Date(birthDate)
  if (nameHanja !== undefined) updateData.nameHanja = nameHanja || null
  if (birthTimeHour !== undefined) updateData.birthTimeHour = birthTimeHour
  if (birthTimeMinute !== undefined) updateData.birthTimeMinute = birthTimeMinute

  try {
    await db.teacher.update({
      where: { id },
      data: updateData,
    })
  } catch (error) {
    console.error("Failed to update teacher:", error)
    return {
      errors: {
        _form: ["선생님 수정 중 오류가 발생했어요"],
      },
    }
  }

  redirect(`/teachers/${id}`)
}

export async function deleteTeacher(id: string): Promise<{ success?: boolean; error?: string }> {
  const session = await verifySession()

  // 권한 검증: 원장만 삭제 가능
  if (session.role !== 'DIRECTOR') {
    return { error: '선생님을 삭제할 권한이 없어요' }
  }

  // 본인 삭제 방지
  if (session.userId === id) {
    return { error: '본인 계정은 삭제할 수 없어요' }
  }

  // 담당 학생 존재 여부 확인
  const studentCount = await db.student.count({
    where: { teacherId: id },
  })

  if (studentCount > 0) {
    return { error: `담당 학생이 ${studentCount}명 있어요. 먼저 다른 선생님에게 재배정해주세요.` }
  }

  try {
    await db.teacher.delete({
      where: { id },
    })
    return { success: true }
  } catch (error) {
    console.error("Failed to delete teacher:", error)
    return { error: '선생님 삭제 중 오류가 발생했어요' }
  }
}

export async function getTeacherStudentCount(teacherId: string): Promise<number> {
  const session = await verifySession()

  if (session.role !== 'DIRECTOR') {
    return 0
  }

  return db.student.count({
    where: { teacherId },
  })
}

export async function getTeachers() {
  const session = await verifySession()

  // 원장: 모든 선생님 조회
  // 팀장: 자신의 팀 선생님만 조회
  // 매니저/선생님: 자신의 정보만 조회
  const teachers = await db.teacher.findMany({
    where: session.role === 'DIRECTOR'
      ? undefined
      : { teamId: session.teamId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      teamId: true,
      team: {
        select: {
          id: true,
          name: true,
        },
      },
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return teachers
}

export async function getTeacherById(id: string) {
  const session = await verifySession()

  const teacher = await db.teacher.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      teamId: true,
      team: {
        select: {
          id: true,
          name: true,
        },
      },
      phone: true,
      birthDate: true,
      nameHanja: true,
      birthTimeHour: true,
      birthTimeMinute: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!teacher) {
    return null
  }

  // 권한 검증: 원장 또는 동일 팀만 조회 가능
  if (session.role !== 'DIRECTOR' && session.teamId !== teacher.teamId) {
    return null
  }

  return teacher
}
