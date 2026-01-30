/**
 * AI 자동 배정 알고리즘 (Greedy with Load Balancing)
 *
 * 선생님-학생 궁합 최대화와 부하 분산 최적화를 목표로
 * 탐욕(Greedy) 알고리즘을 사용하여 O(students × teachers) 복잡도로
 * 최적의 배정을 찾습니다.
 */

import { db } from "@/lib/db"
import { verifySession } from "@/lib/dal"
import { calculateCompatibilityScore } from "@/lib/analysis/compatibility-scoring"
import type { CompatibilityScore } from "@/lib/analysis/compatibility-scoring"
import type { MbtiPercentages } from "@/lib/analysis/mbti-scoring"
import type { SajuResult } from "@/lib/analysis/saju"
import type { NameNumerologyResult } from "@/lib/analysis/name-numerology"

/**
 * 단일 배정 결과
 */
export type Assignment = {
  studentId: string
  teacherId: string
  score: CompatibilityScore
}

/**
 * 자동 배정 옵션
 */
export type AutoAssignmentOptions = {
  maxStudentsPerTeacher?: number // 최대 담당 학생 수 (기본: 평균 + 20%)
  minCompatibilityThreshold?: number // 최소 궁합 점수 (기본: 없음)
  teamId?: string // 특정 팀에만 배정
}

/**
 * 선생님 분석 데이터 포맷
 */
type TeacherAnalysisData = {
  id: string
  name: string
  email: string
  role: string
  teacherMbtiAnalysis: {
    percentages: unknown // Prisma JsonValue
  } | null
  teacherSajuAnalysis: {
    result: unknown // Prisma JsonValue
  } | null
  teacherNameAnalysis: {
    result: unknown // Prisma JsonValue
  } | null
  _count: {
    students: number
  }
}

/**
 * 학생 분석 데이터 포맷
 */
type StudentAnalysisData = {
  id: string
  name: string
  mbtiAnalysis: {
    percentages: unknown // Prisma JsonValue
  } | null
  sajuAnalysis: {
    result: unknown // Prisma JsonValue
  } | null
  nameAnalysis: {
    result: unknown // Prisma JsonValue
  } | null
}

/**
 * AI 자동 배정 알고리즘 (Greedy approach with load balancing)
 *
 * 목적:
 * 1. 전체 궁합 점수 합 maximization
 * 2. 선생님 간 부하 분산 (각 선생님의 학생 수 표준편차 최소화)
 *
 * 알고리즘:
 * 1. 모든 teacher-student 쌍에 대해 궁합 점수 계산
 * 2. 학생 순회하며, 현재 가장 낮은 부하의 선생님 중 최고 궁합 선택
 * 3. maxStudentsPerTeacher 제약 조건 확인
 *
 * 복잡도: O(students × teachers) - 단순하지만 효과적
 *
 * @param studentIds - 배정할 학생 ID 목록
 * @param options - 배정 옵션
 * @returns 배정 결과 배열
 */
export async function generateAutoAssignment(
  studentIds: string[],
  options: AutoAssignmentOptions = {}
): Promise<Assignment[]> {
  // 인증 및 RBAC 확인
  const session = await verifySession()

  // 선생님 목록 조회 (TEACHER, MANAGER, TEAM_LEADER만)
  const teachers = await db.teacher.findMany({
    where: {
      ...(options.teamId && { teamId: options.teamId }),
      role: {
        in: ["TEACHER", "MANAGER", "TEAM_LEADER"],
      },
    },
    include: {
      teacherMbtiAnalysis: true,
      teacherSajuAnalysis: true,
      teacherNameAnalysis: true,
      _count: {
        select: { students: true }, // 현재 담당 학생 수
      },
    },
  })

  if (teachers.length === 0) {
    throw new Error("배정 가능한 선생님이 없습니다.")
  }

  // 학생 목록 조회
  const students = await db.student.findMany({
    where: {
      id: { in: studentIds },
    },
    include: {
      mbtiAnalysis: true,
      sajuAnalysis: true,
      nameAnalysis: true,
    },
  })

  if (students.length === 0) {
    return []
  }

  // 평균 담당 학생 수 계산
  const totalStudents = students.length
  const totalTeachers = teachers.length
  const averageLoad = totalStudents / totalTeachers
  const maxLoad =
    options.maxStudentsPerTeacher ?? Math.ceil(averageLoad * 1.2)

  // 선생님별 현재 부하 초기화
  const teacherLoads = new Map<string, number>()
  for (const teacher of teachers) {
    teacherLoads.set(teacher.id, teacher._count.students)
  }

  // 배정 결과
  const assignments: Assignment[] = []

  // 학생별로 최적 선생님 찾기 (Greedy)
  for (const student of students) {
    let bestTeacher: TeacherAnalysisData | null = null
    let bestScore: CompatibilityScore | null = null

    // 모든 선생님에 대해 궁합 점수 계산
    for (const teacher of teachers) {
      const currentLoad = teacherLoads.get(teacher.id)!

      // 부하 제약 조건 확인
      if (currentLoad >= maxLoad) {
        continue // 이미 최대 인원인 선생님은 건너뜀
      }

      // 궁합 점수 계산
      const score = calculateCompatibilityScore(
        {
          mbti:
            (teacher.teacherMbtiAnalysis?.percentages as MbtiPercentages | null) ??
            null,
          saju: (teacher.teacherSajuAnalysis?.result as SajuResult | null) ?? null,
          name:
            (teacher.teacherNameAnalysis?.result as NameNumerologyResult | null) ??
            null,
          currentLoad,
        },
        {
          mbti: (student.mbtiAnalysis?.percentages as MbtiPercentages | null) ?? null,
          saju: (student.sajuAnalysis?.result as SajuResult | null) ?? null,
          name: (student.nameAnalysis?.result as NameNumerologyResult | null) ?? null,
        },
        averageLoad
      )

      // 최소 궁합 점수 확인
      if (
        options.minCompatibilityThreshold &&
        score.overall < options.minCompatibilityThreshold
      ) {
        continue
      }

      // 최고 궁합 선택 (Greedy)
      if (!bestScore || score.overall > bestScore.overall) {
        bestTeacher = teacher
        bestScore = score
      }
    }

    // 배정
    if (bestTeacher) {
      assignments.push({
        studentId: student.id,
        teacherId: bestTeacher.id,
        score: bestScore!,
      })

      // 부하 업데이트
      teacherLoads.set(bestTeacher.id, teacherLoads.get(bestTeacher.id)! + 1)
    } else {
      console.warn(`Cannot assign student ${student.id}: no suitable teacher found`)
    }
  }

  return assignments
}

/**
 * 부하 분산 통계 계산
 *
 * @param teacherLoads - 선생님별 학생 수 Map
 * @returns 부하 분산 통계
 */
export function calculateLoadStats(teacherLoads: Map<string, number>) {
  const loads = Array.from(teacherLoads.values())

  if (loads.length === 0) {
    return {
      mean: 0,
      variance: 0,
      stdDev: 0,
      min: 0,
      max: 0,
      range: 0,
    }
  }

  const mean = loads.reduce((sum, load) => sum + load, 0) / loads.length
  const variance =
    loads.reduce((sum, load) => sum + Math.pow(load - mean, 2), 0) / loads.length
  const stdDev = Math.sqrt(variance)
  const min = Math.min(...loads)
  const max = Math.max(...loads)

  return {
    mean,
    variance,
    stdDev,
    min,
    max,
    range: max - min,
  }
}

/**
 * 배정 결과 요약 생성
 *
 * @param assignments - 배정 결과 배열
 * @returns 요약 정보
 */
export function summarizeAssignments(assignments: Assignment[]) {
  if (assignments.length === 0) {
    return {
      totalStudents: 0,
      assignedStudents: 0,
      averageScore: 0,
      minScore: 0,
      maxScore: 0,
      teacherCounts: {} as Record<string, number>,
    }
  }

  const scores = assignments.map((a) => a.score.overall)
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length

  // 선생님별 배정 수
  const teacherCounts: Record<string, number> = {}
  for (const assignment of assignments) {
    teacherCounts[assignment.teacherId] =
      (teacherCounts[assignment.teacherId] || 0) + 1
  }

  return {
    totalStudents: assignments.length,
    assignedStudents: assignments.length,
    averageScore,
    minScore: Math.min(...scores),
    maxScore: Math.max(...scores),
    teacherCounts,
  }
}
