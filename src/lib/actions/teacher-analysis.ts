"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { verifySession } from "@/lib/dal"
import { calculateSaju, generateSajuInterpretation } from "@/lib/analysis/saju"
import {
  calculateNameNumerology,
  generateNameInterpretation,
} from "@/lib/analysis/name-numerology"
import { scoreMbti } from "@/lib/analysis/mbti-scoring"
import { upsertTeacherSajuAnalysis } from "@/lib/db/teacher-saju-analysis"
import { upsertTeacherNameAnalysis } from "@/lib/db/teacher-name-analysis"
import { upsertTeacherMbtiAnalysis } from "@/lib/db/teacher-mbti-analysis"
import questions from "@/data/mbti/questions.json"
import descriptions from "@/data/mbti/descriptions.json"

/**
 * 선생님 사주 분석 실행
 *
 * Teacher.birthDate와 birthTime으로 사주를 계산하고 DB에 저장합니다.
 * 기존 calculateSaju 순수 함수를 재사용합니다.
 */
export async function runTeacherSajuAnalysis(teacherId: string) {
  const session = await verifySession()
  if (!session) throw new Error("Unauthorized")

  // Teacher 조회
  const teacher = await db.teacher.findUnique({
    where: { id: teacherId },
    select: {
      id: true,
      birthDate: true,
      birthTimeHour: true,
      birthTimeMinute: true,
    },
  })

  if (!teacher) {
    throw new Error("Teacher not found")
  }

  if (!teacher.birthDate) {
    throw new Error("생일 정보가 없어 사주 분석을 실행할 수 없어요.")
  }

  // 시간 정보 구성 (nullable 처리)
  const time =
    teacher.birthTimeHour === null
      ? null
      : {
          hour: teacher.birthTimeHour,
          minute: teacher.birthTimeMinute ?? 0,
        }

  // 사주 계산 (기존 라이브러리 재사용)
  const sajuResult = calculateSaju({
    birthDate: teacher.birthDate,
    time,
    longitude: 127.0, // 대한민국 표준 경도
  })

  const interpretation = generateSajuInterpretation(sajuResult)

  // DB 저장
  const inputSnapshot = {
    birthDate: teacher.birthDate.toISOString(),
    timeKnown: Boolean(time),
    time,
    longitude: 127.0,
  }

  await upsertTeacherSajuAnalysis(teacherId, {
    inputSnapshot,
    result: sajuResult,
    interpretation,
    status: "complete",
    version: 1,
    calculatedAt: new Date(),
  })

  revalidatePath(`/teachers/${teacherId}`)

  return { success: true, result: sajuResult, interpretation }
}

/**
 * 선생님 성명학 분석 실행
 *
 * Teacher.name과 nameHanja로 성명학을 계산하고 DB에 저장합니다.
 * 기존 calculateNameNumerology 순수 함수를 재사용합니다.
 */
export async function runTeacherNameAnalysis(teacherId: string) {
  const session = await verifySession()
  if (!session) throw new Error("Unauthorized")

  const teacher = await db.teacher.findUnique({
    where: { id: teacherId },
    select: {
      id: true,
      name: true,
      nameHanja: true,
    },
  })

  if (!teacher) {
    throw new Error("Teacher not found")
  }

  if (!teacher.nameHanja) {
    throw new Error("한자 정보가 없어 성명학 분석을 실행할 수 없어요.")
  }

  // 성명학 계산 (기존 라이브러리 재사용)
  const nameResult = calculateNameNumerology({
    name: teacher.name,
    hanjaName: teacher.nameHanja,
  })

  if (nameResult.status !== "ok") {
    throw new Error(nameResult.message)
  }

  const interpretation = generateNameInterpretation(nameResult.result)

  // DB 저장
  const inputSnapshot = {
    name: teacher.name,
    nameHanja: teacher.nameHanja,
  }

  await upsertTeacherNameAnalysis(teacherId, {
    inputSnapshot,
    result: nameResult.result,
    interpretation,
    status: "complete",
    version: 1,
    calculatedAt: new Date(),
  })

  revalidatePath(`/teachers/${teacherId}`)

  return { success: true, result: nameResult.result, interpretation }
}

/**
 * 선생님 MBTI 분석 실행
 *
 * MBTI 설문 응답으로 점수를 계산하고 DB에 저장합니다.
 * 기존 scoreMbti 순수 함수를 재사용합니다.
 *
 * @param teacherId - 선생님 ID
 * @param responses - 설문 응답 ({"1": 3, "2": 5, ...})
 */
export async function runTeacherMbtiAnalysis(
  teacherId: string,
  responses: Record<string, number>
) {
  const session = await verifySession()
  if (!session) throw new Error("Unauthorized")

  // 60문항 모두 응답했는지 검증
  const answeredCount = Object.keys(responses).length
  if (answeredCount < 60) {
    throw new Error("모든 문항에 응답해주세요.")
  }

  // MBTI 점수 계산 (기존 라이브러리 재사용)
  const mbtiResult = scoreMbti(responses, questions)

  // 유형 설명 로드
  const typeDescription = descriptions[mbtiResult.mbtiType as keyof typeof descriptions]

  if (!typeDescription) {
    throw new Error(`MBTI 유형 설명을 찾을 수 없어요: ${mbtiResult.mbtiType}`)
  }

  // 해석 텍스트 생성
  const interpretation = `## ${typeDescription.name}

${typeDescription.summary}

### 주요 강점
${typeDescription.strengths.map((s) => `- ${s}`).join("\n")}

### 주의할 점
${typeDescription.weaknesses.map((w) => `- ${w}`).join("\n")}

### 학습 스타일
${typeDescription.learningStyle}

### 추천 직업
${typeDescription.careers.join(", ")}

### 대표 인물
${typeDescription.famousPeople.join(", ")}
`

  // DB 저장
  await upsertTeacherMbtiAnalysis(teacherId, {
    responses,
    scores: mbtiResult.scores,
    mbtiType: mbtiResult.mbtiType,
    percentages: mbtiResult.percentages,
    interpretation,
    version: 1,
    calculatedAt: new Date(),
  })

  revalidatePath(`/teachers/${teacherId}`)

  return {
    success: true,
    result: {
      mbtiType: mbtiResult.mbtiType,
      percentages: mbtiResult.percentages,
      interpretation,
    },
  }
}
