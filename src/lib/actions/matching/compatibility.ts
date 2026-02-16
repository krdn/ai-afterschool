"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { verifySession } from "@/lib/dal"
import { calculateCompatibilityScore } from "@/lib/analysis/compatibility-scoring"
import { upsertCompatibilityResult } from "@/lib/db/matching/compatibility-result"
import type { MbtiPercentages } from "@/lib/analysis/mbti-scoring"
import type { SajuResult } from "@/lib/analysis/saju"
import type { NameNumerologyResult } from "@/lib/analysis/name-numerology"

/**
 * 선생님-학생 궁합 분석 실행
 *
 * Teacher와 Student의 분석 데이터를 조회하여 궁합 점수를 계산하고 DB에 저장합니다.
 * RBAC: 본인 팀 데이터만 접근 가능 (verifySession의 RLS 필터링 활용)
 *
 * @param teacherId - 선생님 ID
 * @param studentId - 학생 ID
 * @returns 궁합 점수 결과
 */
export async function analyzeCompatibility(
  teacherId: string,
  studentId: string
) {
  await verifySession() // RLS 적용을 위해 세션 확인

  // Teacher 조회
  const teacher = await db.teacher.findUnique({
    where: { id: teacherId },
    select: {
      id: true,
      _count: {
        select: {
          students: true,
        },
      },
    },
  })

  if (!teacher) {
    throw new Error("선생님을 찾을 수 없어요.")
  }

  // Teacher 분석 데이터 조회 (통합 테이블에서)
  const [teacherMbti, teacherSaju, teacherName] = await Promise.all([
    db.mbtiAnalysis.findUnique({
      where: { subjectType_subjectId: { subjectType: 'TEACHER', subjectId: teacherId } },
      select: { percentages: true },
    }),
    db.sajuAnalysis.findUnique({
      where: { subjectType_subjectId: { subjectType: 'TEACHER', subjectId: teacherId } },
      select: { result: true },
    }),
    db.nameAnalysis.findUnique({
      where: { subjectType_subjectId: { subjectType: 'TEACHER', subjectId: teacherId } },
      select: { result: true },
    }),
  ])

  // Student 분석 데이터 조회 (통합 테이블에서)
  const [studentMbti, studentSaju, studentName] = await Promise.all([
    db.mbtiAnalysis.findUnique({
      where: { subjectType_subjectId: { subjectType: 'STUDENT', subjectId: studentId } },
      select: { percentages: true },
    }),
    db.sajuAnalysis.findUnique({
      where: { subjectType_subjectId: { subjectType: 'STUDENT', subjectId: studentId } },
      select: { result: true },
    }),
    db.nameAnalysis.findUnique({
      where: { subjectType_subjectId: { subjectType: 'STUDENT', subjectId: studentId } },
      select: { result: true },
    }),
  ])

  // 궁합 점수 계산
  const score = calculateCompatibilityScore(
    {
      mbti: (teacherMbti?.percentages as unknown as MbtiPercentages | null) ?? null,
      saju: (teacherSaju?.result as unknown as SajuResult | null) ?? null,
      name: (teacherName?.result as unknown as NameNumerologyResult | null) ?? null,
      currentLoad: teacher._count.students,
    },
    {
      mbti: (studentMbti?.percentages as unknown as MbtiPercentages | null) ?? null,
      saju: (studentSaju?.result as unknown as SajuResult | null) ?? null,
      name: (studentName?.result as unknown as NameNumerologyResult | null) ?? null,
    }
  )

  // DB 저장
  await upsertCompatibilityResult(teacherId, studentId, score)

  // 캐시 무효화
  revalidatePath(`/students/${studentId}`)
  revalidatePath(`/teachers/${teacherId}`)

  return {
    success: true,
    score,
  }
}

/**
 * 다수 학생에 대해 궁합 분석 일괄 실행
 */
export async function batchAnalyzeCompatibility(studentIds: string[]) {
  await verifySession()

  const teachers = await db.teacher.findMany({
    select: {
      id: true,
    },
  })

  if (teachers.length === 0) {
    throw new Error("팀에 선생님이 없어요.")
  }

  const results = await Promise.all(
    studentIds.map(async (studentId) => {
      const compatibilityResults = await Promise.all(
        teachers.map((teacher) =>
          analyzeCompatibility(teacher.id, studentId).catch((error) => {
            console.error(
              `궁합 분석 실패 (Teacher: ${teacher.id}, Student: ${studentId}):`,
              error
            )
            return null
          })
        )
      )

      return {
        studentId,
        results: compatibilityResults.filter((r) => r !== null),
      }
    })
  )

  return {
    success: true,
    results,
  }
}
