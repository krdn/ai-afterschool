"use server"

import { runSajuAnalysis, simplifyInterpretation } from "@/lib/actions/student/calculation-analysis"
import { getAnalysisHistory } from "@/lib/actions/student/analysis"
import { getSajuHistoryList } from "@/lib/db/student/analysis"
import { getActivePresets, getPresetByKey, seedBuiltInPresets } from "@/lib/db/analysis/saju-prompt-preset"
import {
  getBuiltInSeedData,
  getPromptPreviewText,
  type AnalysisPromptMeta,
  type AnalysisPromptId,
} from "@/lib/ai/saju-prompts"

export async function runSajuAnalysisAction(
  studentId: string,
  provider?: string,
  promptId?: string,
  additionalRequest?: string,
  forceRefresh?: boolean
) {
  return runSajuAnalysis(studentId, provider, promptId, additionalRequest, forceRefresh)
}

export async function getSajuAnalysisHistoryAction(studentId: string) {
  return getSajuHistoryList(studentId)
}

/** DB 기반 프롬프트 옵션 목록 (누락 시 자동 seed) */
export async function getMergedPromptOptionsAction(): Promise<AnalysisPromptMeta[]> {
  // DB에 기본 프롬프트가 없으면 자동 seed
  await seedBuiltInPresets(getBuiltInSeedData())

  const dbPresets = await getActivePresets()

  return dbPresets.map((p) => ({
    id: p.promptKey as AnalysisPromptMeta["id"],
    name: p.name,
    shortDescription: p.shortDescription,
    target: p.target,
    levels: p.levels,
    purpose: p.purpose,
    recommendedTiming: p.recommendedTiming,
    tags: p.tags,
  }))
}

/** DB에 저장된 프롬프트 원문 반환 (플레이스홀더 치환 없이) */
export async function getPromptPreviewAction(promptKey: string): Promise<string> {
  const preset = await getPresetByKey(promptKey)
  if (preset?.promptTemplate) {
    return preset.promptTemplate
  }
  // fallback: 코드 기본값 (샘플 데이터 적용)
  return getPromptPreviewText(promptKey as AnalysisPromptId)
}

export async function simplifyInterpretationAction(
  interpretation: string,
  provider: string
) {
  return simplifyInterpretation(interpretation, provider)
}

export { getAnalysisHistory }
