"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { verifySession } from "@/lib/dal"

/**
 * 학생을 선생님에게 수동 배정
 *
 * RBAC: DIRECTOR, TEAM_LEADER만 배정 가능
 *
 * @param studentId - 학생 ID
 * @param teacherId - 선생님 ID
 * @returns 배정 결과
 */
export async function assignStudentToTeacher(
  studentId: string,
  teacherId: string
) {
  const session = await verifySession()

  // RBAC: DIRECTOR, TEAM_LEADER만 배정 가능
  if (session.role !== "DIRECTOR" && session.role !== "TEAM_LEADER") {
    throw new Error("배정 권한이 없습니다.")
  }

  // Student 조회 (본인 팀 데이터만)
  const student = await db.student.findUnique({
    where: { id: studentId },
  })

  if (!student) {
    throw new Error("학생을 찾을 수 없습니다.")
  }

  // Teacher 조회 (본인 팀 데이터만)
  const teacher = await db.teacher.findUnique({
    where: { id: teacherId },
  })

  if (!teacher) {
    throw new Error("선생님을 찾을 수 없습니다.")
  }

  // Student.teacherId 업데이트
  try {
    await db.student.update({
      where: { id: studentId },
      data: { teacherId },
    })
  } catch (error) {
    console.error("Failed to assign student to teacher:", error)
    throw new Error("학생 배정 중 오류가 발생했습니다.")
  }

  // 캐시 무효화
  revalidatePath("/matching")
  revalidatePath(`/students/${studentId}`)
  revalidatePath(`/teachers/${teacherId}`)

  return {
    success: true,
  }
}

/**
 * 학생을 다른 선생님으로 재배정
 *
 * RBAC: DIRECTOR, TEAM_LEADER만 재배정 가능
 *
 * @param studentId - 학생 ID
 * @param newTeacherId - 새 선생님 ID
 * @returns 재배정 결과
 */
export async function reassignStudent(
  studentId: string,
  newTeacherId: string
) {
  const session = await verifySession()

  // RBAC: DIRECTOR, TEAM_LEADER만 재배정 가능
  if (session.role !== "DIRECTOR" && session.role !== "TEAM_LEADER") {
    throw new Error("재배정 권한이 없습니다.")
  }

  // Student 조회
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      teacherId: true,
    },
  })

  if (!student) {
    throw new Error("학생을 찾을 수 없습니다.")
  }

  const previousTeacherId = student.teacherId

  // 새로운 Teacher가 있는지 확인
  const newTeacher = await db.teacher.findUnique({
    where: { id: newTeacherId },
  })

  if (!newTeacher) {
    throw new Error("새 선생님을 찾을 수 없습니다.")
  }

  // Student.teacherId 업데이트
  try {
    await db.student.update({
      where: { id: studentId },
      data: { teacherId: newTeacherId },
    })
  } catch (error) {
    console.error("Failed to reassign student:", error)
    throw new Error("학생 재배정 중 오류가 발생했습니다.")
  }

  // 캐시 무효화
  revalidatePath("/matching")
  revalidatePath(`/students/${studentId}`)
  revalidatePath(`/teachers/${newTeacherId}`)
  if (previousTeacherId && previousTeacherId !== newTeacherId) {
    revalidatePath(`/teachers/${previousTeacherId}`)
  }

  return {
    success: true,
    previousTeacherId,
    newTeacherId,
  }
}
