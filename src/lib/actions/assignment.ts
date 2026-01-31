"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { verifySession } from "@/lib/dal"
import { calculateCompatibilityScore } from "@/lib/analysis/compatibility-scoring"
import type { MbtiPercentages } from "@/lib/analysis/mbti-scoring"
import type { SajuResult } from "@/lib/analysis/saju"
import type { NameNumerologyResult } from "@/lib/analysis/name-numerology"

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

/**
 * 다수 학생 일괄 배정
 *
 * RBAC: DIRECTOR, TEAM_LEADER만 배정 가능
 *
 * @param studentIds - 학생 ID 배열
 * @param teacherId - 배정할 선생님 ID
 * @returns 배정 결과 (성공 여부, 배정된 학생 수)
 */
export async function assignStudentBatch(
  studentIds: string[],
  teacherId: string
) {
  const session = await verifySession()

  // RBAC: DIRECTOR, TEAM_LEADER만 배정 가능
  if (session.role !== "DIRECTOR" && session.role !== "TEAM_LEADER") {
    throw new Error("배정 권한이 없습니다.")
  }

  if (studentIds.length === 0) {
    throw new Error("배정할 학생을 선택해주세요.")
  }

  // Teacher 조회 (본인 팀 데이터만)
  const teacher = await db.teacher.findUnique({
    where: { id: teacherId },
  })

  if (!teacher) {
    throw new Error("선생님을 찾을 수 없습니다.")
  }

  // Promise.all로 일괄 업데이트
  try {
    await Promise.all(
      studentIds.map((studentId) =>
        db.student.update({
          where: { id: studentId },
          data: { teacherId },
        })
      )
    )
  } catch (error) {
    console.error("Failed to assign students batch:", error)
    throw new Error("학생 일괄 배정 중 오류가 발생했습니다.")
  }

  // 캐시 무효화
  revalidatePath("/matching")
  revalidatePath("/students")
  revalidatePath(`/teachers/${teacherId}`)

  return {
    success: true,
    count: studentIds.length,
  }
}

/**
 * 학생별 선생님 추천 목록 조회
 *
 * 학생별로 팀 내 모든 선생님의 궁합 점수를 계산하고 순위별로 반환합니다.
 * RBAC: 본인 팀 데이터만 접근 가능 (verifySession의 RLS 필터링 활용)
 *
 * @param studentId - 학생 ID
 * @returns 추천 선생님 목록 (score.overall 내림차순 정렬)
 */
export async function getTeacherRecommendations(studentId: string) {
  await verifySession() // RLS 적용을 위해 세션 확인

  // Student 조회 (관련 분석 포함)
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      name: true,
      mbtiAnalysis: {
        select: {
          percentages: true,
        },
      },
      sajuAnalysis: {
        select: {
          result: true,
        },
      },
      nameAnalysis: {
        select: {
          result: true,
        },
      },
    },
  })

  if (!student) {
    throw new Error("학생을 찾을 수 없어요.")
  }

  // 팀 내 Teacher 목록 조회 (role이 TEACHER, MANAGER, TEAM_LEADER인 경우)
  const teachers = await db.teacher.findMany({
    where: {
      role: {
        in: ["TEACHER", "MANAGER", "TEAM_LEADER"],
      },
    },
    select: {
      id: true,
      name: true,
      role: true,
      teacherMbtiAnalysis: {
        select: {
          percentages: true,
        },
      },
      teacherSajuAnalysis: {
        select: {
          result: true,
        },
      },
      teacherNameAnalysis: {
        select: {
          result: true,
        },
      },
      _count: {
        select: {
          students: true,
        },
      },
    },
  })

  if (teachers.length === 0) {
    return {
      studentId: student.id,
      studentName: student.name,
      recommendations: [],
    }
  }

  // 전체 Student/Teacher 수로 averageLoad 계산
  const totalStudentCount = await db.student.count()
  const totalTeacherCount = teachers.length
  const averageLoad = totalTeacherCount > 0 ? totalStudentCount / totalTeacherCount : 15

  // 각 Teacher에 대해 궁합 점수 계산
  const recommendations = teachers.map((teacher) => {
    const score = calculateCompatibilityScore(
      {
        mbti: (teacher.teacherMbtiAnalysis?.percentages as unknown as MbtiPercentages | null) ?? null,
        saju: (teacher.teacherSajuAnalysis?.result as unknown as SajuResult | null) ?? null,
        name: (teacher.teacherNameAnalysis?.result as unknown as NameNumerologyResult | null) ?? null,
        currentLoad: teacher._count.students,
      },
      {
        mbti: (student.mbtiAnalysis?.percentages as unknown as MbtiPercentages | null) ?? null,
        saju: (student.sajuAnalysis?.result as unknown as SajuResult | null) ?? null,
        name: (student.nameAnalysis?.result as unknown as NameNumerologyResult | null) ?? null,
      },
      averageLoad
    )

    return {
      teacherId: teacher.id,
      teacherName: teacher.name,
      teacherRole: teacher.role,
      score,
      breakdown: score.breakdown,
      reasons: score.reasons,
    }
  })

  // score.overall 내림차순 정렬
  recommendations.sort((a, b) => b.score.overall - a.score.overall)

  return {
    studentId: student.id,
    studentName: student.name,
    recommendations,
  }
}
