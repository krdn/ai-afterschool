"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { verifySession } from "@/lib/dal"
import { calculateCompatibilityScore } from "@/lib/analysis/compatibility-scoring"
import { upsertCompatibilityResult } from "@/lib/db/compatibility-result"
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

  // Teacher 조회 (관련 분석 포함)
  const teacher = await db.teacher.findUnique({
    where: { id: teacherId },
    select: {
      id: true,
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

  if (!teacher) {
    throw new Error("선생님을 찾을 수 없어요.")
  }

  // Student 조회 (관련 분석 포함)
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
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

  // 궁합 점수 계산
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
 *
 * 팀 내 모든 Teacher와 각 Student 쌍에 대해 궁합 분석을 실행합니다.
 * 병렬 처리로 성능을 최적화합니다.
 *
 * @param studentIds - 학생 ID 배열
 * @returns 각 학생별 궁합 분석 결과
 */
export async function batchAnalyzeCompatibility(studentIds: string[]) {
  await verifySession() // RLS 적용을 위해 세션 확인

  // 팀 내 모든 선생님 조회
  const teachers = await db.teacher.findMany({
    select: {
      id: true,
    },
  })

  if (teachers.length === 0) {
    throw new Error("팀에 선생님이 없어요.")
  }

  // 각 학생에 대해 모든 선생님과의 궁합 분석 실행
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
