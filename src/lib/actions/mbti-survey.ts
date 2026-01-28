"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { verifySession } from "@/lib/dal"
import { calculateProgress, scoreMbti } from "@/lib/analysis/mbti-scoring"
import {
  deleteMbtiDraft,
  getMbtiAnalysis as getMbtiAnalysisDb,
  getMbtiDraft as getMbtiDraftDb,
  upsertMbtiAnalysis,
  upsertMbtiDraft,
} from "@/lib/db/mbti-analysis"
import questions from "@/data/mbti/questions.json"
import descriptions from "@/data/mbti/descriptions.json"

/**
 * 학생 접근 권한 확인
 */
async function ensureStudentAccess(studentId: string, teacherId: string) {
  const student = await db.student.findFirst({
    where: {
      id: studentId,
      teacherId,
    },
    select: { id: true },
  })

  if (!student) {
    throw new Error("학생을 찾을 수 없어요.")
  }
}

/**
 * MBTI 설문 임시 저장 조회
 */
export async function getMbtiDraft(studentId: string) {
  const session = await verifySession()
  await ensureStudentAccess(studentId, session.userId)

  const draft = await getMbtiDraftDb(studentId)
  return draft
}

/**
 * MBTI 설문 임시 저장
 */
export async function saveMbtiDraft(
  studentId: string,
  responses: Record<string, number>
) {
  const session = await verifySession()
  await ensureStudentAccess(studentId, session.userId)

  // 진행도 계산
  const progress = calculateProgress(responses, 60)

  // Draft 저장
  await upsertMbtiDraft(studentId, responses, progress.answeredCount)

  return {
    success: true,
    progress: progress.answeredCount,
  }
}

/**
 * MBTI 설문 최종 제출
 */
export async function submitMbtiSurvey(
  studentId: string,
  responses: Record<string, number>
) {
  const session = await verifySession()
  await ensureStudentAccess(studentId, session.userId)

  // 60문항 모두 응답했는지 검증
  const progress = calculateProgress(responses, 60)
  if (progress.answeredCount < 60) {
    throw new Error("모든 문항에 응답해주세요.")
  }

  // MBTI 점수 계산
  const result = scoreMbti(responses, questions)

  // 유형 설명 로드
  const typeDescription = descriptions[result.mbtiType as keyof typeof descriptions]

  if (!typeDescription) {
    throw new Error(`MBTI 유형 설명을 찾을 수 없습니다: ${result.mbtiType}`)
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

  // 분석 결과 저장
  await upsertMbtiAnalysis(studentId, {
    responses,
    scores: result.scores,
    mbtiType: result.mbtiType,
    percentages: result.percentages,
    interpretation,
  })

  // Draft 삭제
  try {
    await deleteMbtiDraft(studentId)
  } catch {
    // Draft가 없으면 무시
  }

  // 캐시 무효화
  revalidatePath(`/students/${studentId}`)

  return {
    success: true,
    result: {
      mbtiType: result.mbtiType,
      percentages: result.percentages,
      interpretation,
    },
  }
}

/**
 * MBTI 분석 결과 조회
 */
export async function getMbtiAnalysis(studentId: string) {
  const session = await verifySession()
  await ensureStudentAccess(studentId, session.userId)

  const analysis = await getMbtiAnalysisDb(studentId)
  return analysis
}
