"use server"

import { verifySession } from "@/lib/dal"
import { getRBACPrisma } from "@/lib/db/rbac"
import { calculateImprovementRate, calculateGradeTrend } from "@/lib/analysis/grade-analytics"
import type { GradeHistory } from "@prisma/client"

/**
 * 학생 성적 향상 조회 Server Action
 *
 * RBAC: TEACHER - 자신이 담당하는 학생만 조회 가능
 *       TEAM_LEADER, MANAGER, DIRECTOR - 모든 학생 조회 가능
 */
export async function getStudentImprovementAction(studentId: string) {
  const session = await verifySession()
  if (!session) {
    return { error: "인증이 필요합니다." }
  }

  const rbacDb = getRBACPrisma(session)

  // RBAC: TEACHER는 자신의 학생만 조회 가능
  if (session.role === "TEACHER") {
    const student = await rbacDb.student.findFirst({
      where: { id: studentId },
      select: { id: true },
    })
    if (!student) {
      return { error: "해당 학생에 대한 권한이 없습니다." }
    }
  }

  try {
    const gradeHistory = await rbacDb.gradeHistory.findMany({
      where: { studentId },
      orderBy: { testDate: "asc" },
    })

    if (gradeHistory.length < 2) {
      return { error: "성적 데이터가 부족합니다. 최소 2개의 성적 기록이 필요합니다." }
    }

    const result = calculateImprovementRate(
      gradeHistory.map((g) => ({
        score: g.score,
        testDate: g.testDate,
      }))
    )

    return { success: true, data: result }
  } catch (error) {
    console.error("Error calculating student improvement:", error)
    return { error: "성적 향상률 계산에 실패했습니다." }
  }
}

/**
 * 선생님 성적 분석 Server Action
 *
 * RBAC: TEACHER - 자신의 성적 분석만 조회 가능
 *       TEAM_LEADER - 자신의 팀 내 선생님 분석 조회 가능
 *       MANAGER, DIRECTOR - 모든 선생님 조회 가능
 */
export async function getTeacherGradeAnalyticsAction(teacherId: string) {
  const session = await verifySession()
  if (!session) {
    return { error: "인증이 필요합니다." }
  }

  const rbacDb = getRBACPrisma(session)

  // RBAC: TEACHER는 자신의 데이터만 조회
  if (session.role === "TEACHER") {
    if (session.userId !== teacherId) {
      return { error: "자신의 성적 분석만 조회할 수 있습니다." }
    }
  }

  try {
    const teacherStudents = await rbacDb.student.findMany({
      where: { teacherId },
      select: { id: true },
    })

    const improvements: number[] = []

    for (const student of teacherStudents) {
      const gradeHistory = await rbacDb.gradeHistory.findMany({
        where: { studentId: student.id },
        orderBy: { testDate: "asc" },
      })

      if (gradeHistory.length >= 2) {
        const result = calculateImprovementRate(
          gradeHistory.map((g) => ({
            score: g.score,
            testDate: g.testDate,
          }))
        )
        improvements.push(result.improvementRate)
      }
    }

    if (improvements.length === 0) {
      return {
        success: true,
        data: {
          avgImprovement: 0,
          medianImprovement: 0,
          studentCount: teacherStudents.length,
          improvementCount: 0,
        },
      }
    }

    const sorted = [...improvements].sort((a, b) => a - b)
    const avgImprovement = improvements.reduce((sum, val) => sum + val, 0) / improvements.length
    const medianImprovement =
      sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)]

    return {
      success: true,
      data: {
        avgImprovement: Math.round(avgImprovement * 10) / 10,
        medianImprovement: Math.round(medianImprovement * 10) / 10,
        studentCount: teacherStudents.length,
        improvementCount: improvements.length,
      },
    }
  } catch (error) {
    console.error("Error calculating teacher grade analytics:", error)
    return { error: "성적 분석에 실패했습니다." }
  }
}

/**
 * 성적 추이 데이터 조회 Server Action
 *
 * RBAC: TEACHER - 자신이 담당하는 학생만 조회 가능
 *       TEAM_LEADER, MANAGER, DIRECTOR - 모든 학생 조회 가능
 */
export async function getGradeTrendDataAction(
  studentId: string,
  granularity: "MONTHLY" | "WEEKLY" = "MONTHLY"
) {
  const session = await verifySession()
  if (!session) {
    return { error: "인증이 필요합니다." }
  }

  const rbacDb = getRBACPrisma(session)

  // RBAC: TEACHER는 자신의 학생만 조회 가능
  if (session.role === "TEACHER") {
    const student = await rbacDb.student.findFirst({
      where: { id: studentId },
      select: { id: true },
    })
    if (!student) {
      return { error: "해당 학생에 대한 권한이 없습니다." }
    }
  }

  try {
    const gradeHistory = await rbacDb.gradeHistory.findMany({
      where: { studentId },
      orderBy: { testDate: "asc" },
    })

    if (gradeHistory.length === 0) {
      return { error: "성적 데이터가 없습니다." }
    }

    const trendData = calculateGradeTrend(
      gradeHistory.map((g) => ({
        subject: g.subject,
        score: g.score,
        testDate: g.testDate,
      })),
      granularity
    )

    return { success: true, data: trendData }
  } catch (error) {
    console.error("Error calculating grade trend:", error)
    return { error: "성적 추이 계산에 실패했습니다." }
  }
}
