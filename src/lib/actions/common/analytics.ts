"use server"

import { verifySession } from "@/lib/dal"

interface TeacherGradeComparison {
  teacherId: string
  teacherName: string
  studentImprovements: number[]
}
import { getRBACPrisma } from "@/lib/db/common/rbac"
import { db } from "@/lib/db"
import { calculateImprovementRate, calculateGradeTrend } from "@/lib/analysis/grade-analytics"

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

export interface CounselingStats {
  totalSessions: number
  averageDuration: number
  typeDistribution: Record<string, number>
  satisfactionAverage: number
}

export async function getCounselingStats(
  teamId?: string
): Promise<{ data: CounselingStats } | { error: string }> {
  const session = await verifySession()
  if (!session) {
    return { error: "인증이 필요합니다." }
  }

  const rbacDb = getRBACPrisma(session)

  // RBAC: DIRECTOR can query all teams, others only their own team
  const whereClause: { teacher?: { teamId: string } } = {}
  if (session.role === "DIRECTOR" && teamId) {
    whereClause.teacher = { teamId }
  } else if (session.role !== "DIRECTOR" && session.teamId) {
    whereClause.teacher = { teamId: session.teamId }
  }

  try {
    const counselingSessions = await rbacDb.counselingSession.findMany({
      where: whereClause,
      select: {
        duration: true,
        type: true,
        satisfactionScore: true,
      },
    })

    if (counselingSessions.length === 0) {
      return {
        data: {
          totalSessions: 0,
          averageDuration: 0,
          typeDistribution: {},
          satisfactionAverage: 0,
        },
      }
    }

    const totalSessions = counselingSessions.length
    const averageDuration =
      counselingSessions.reduce((sum, s) => sum + s.duration, 0) / totalSessions

    const typeDistribution: Record<string, number> = {}
    counselingSessions.forEach((session) => {
      const type = session.type as string
      typeDistribution[type] = (typeDistribution[type] || 0) + 1
    })

    const satisfactionScores = counselingSessions
      .map((s) => s.satisfactionScore)
      .filter((score): score is number => score !== null)
    const satisfactionAverage =
      satisfactionScores.length > 0
        ? satisfactionScores.reduce((sum, score) => sum + score, 0) /
          satisfactionScores.length
        : 0

    return {
      data: {
        totalSessions,
        averageDuration: Math.round(averageDuration),
        typeDistribution,
        satisfactionAverage: Math.round(satisfactionAverage * 10) / 10,
      },
    }
  } catch (error) {
    console.error("Error fetching counseling stats:", error)
    return { error: "상담 통계 조회에 실패했습니다." }
  }
}

export async function compareTeachersByGradeImprovement(
  teamId?: string
): Promise<{ data: TeacherGradeComparison[] } | { error: string }> {
  const session = await verifySession()
  if (!session) {
    return { error: "인증이 필요합니다." }
  }

  const rbacDb = getRBACPrisma(session)

  // RBAC: DIRECTOR can query all teams, others only their own team
  const roleFilter = ["TEACHER", "MANAGER", "TEAM_LEADER"] as const

  try {
    const teachers = await rbacDb.teacher.findMany({
      where: {
        role: { in: [...roleFilter] },
        ...(session.role === "DIRECTOR" && teamId ? { teamId } : {}),
        ...(session.role !== "DIRECTOR" && session.teamId ? { teamId: session.teamId } : {}),
      },
      select: {
        id: true,
        name: true,
      },
    })

    const teacherStats = await Promise.all(
      teachers.map(async (teacher) => {
        const students = await db.student.findMany({
          where: { teacherId: teacher.id },
        })

        const improvements: number[] = []

        for (const student of students) {
          const studentGrades = await db.gradeHistory.findMany({
            where: { studentId: student.id },
            orderBy: { testDate: "desc" },
            select: {
              score: true,
              testDate: true,
              normalizedScore: true,
            },
          })

          const gradeHistory = studentGrades
          if (gradeHistory.length >= 2) {
            const sorted = [...gradeHistory].sort((a, b) =>
              a.testDate.getTime() - b.testDate.getTime()
            )
            const baseline = sorted[0].normalizedScore
            const current = sorted[sorted.length - 1].normalizedScore
            const improvement = ((current - baseline) / baseline) * 100
            improvements.push(improvement)
          }
        }

        return {
          teacherId: teacher.id,
          teacherName: teacher.name,
          studentImprovements: improvements,
        }
      })
    )

    return { data: teacherStats }
  } catch (error) {
    console.error("Error comparing teachers:", error)
    return { error: "선생님 비교에 실패했습니다." }
  }
}
