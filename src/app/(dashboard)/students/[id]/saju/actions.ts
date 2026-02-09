"use server"

import { runSajuAnalysis } from "@/lib/actions/calculation-analysis"
import { getAnalysisHistory } from "@/lib/actions/analysis"
import { getSajuHistoryList } from "@/lib/db/student-analysis"
import { getActivePresets } from "@/lib/db/saju-prompt-preset"
import { getPromptOptions, type AnalysisPromptMeta } from "@/lib/ai/saju-prompts"

export async function runSajuAnalysisAction(
  studentId: string,
  provider?: string,
  promptId?: string,
  additionalRequest?: string
) {
  return runSajuAnalysis(studentId, provider, promptId, additionalRequest)
}

export async function getSajuAnalysisHistoryAction(studentId: string) {
  return getSajuHistoryList(studentId)
}

/** 코드 기본 프롬프트 + DB 커스텀 프리셋을 병합한 옵션 목록 */
export async function getMergedPromptOptionsAction(): Promise<AnalysisPromptMeta[]> {
  const codeOptions = getPromptOptions()
  const dbPresets = await getActivePresets()

  // DB 프리셋 키 Set
  const dbKeys = new Set(dbPresets.map((p) => p.promptKey))

  // 코드 기본값 중 DB에 오버라이드가 없는 것만 유지
  const merged: AnalysisPromptMeta[] = codeOptions.map((opt) => {
    const override = dbPresets.find((p) => p.promptKey === opt.id)
    if (override) {
      return {
        id: override.promptKey as AnalysisPromptMeta["id"],
        name: override.name,
        shortDescription: override.shortDescription,
        target: override.target,
        levels: override.levels,
        purpose: override.purpose,
        recommendedTiming: override.recommendedTiming,
        tags: override.tags,
      }
    }
    return opt
  })

  // DB에만 있는 커스텀 프리셋 추가
  for (const preset of dbPresets) {
    if (!codeOptions.some((o) => o.id === preset.promptKey)) {
      merged.push({
        id: preset.promptKey as AnalysisPromptMeta["id"],
        name: preset.name,
        shortDescription: preset.shortDescription,
        target: preset.target,
        levels: preset.levels,
        purpose: preset.purpose,
        recommendedTiming: preset.recommendedTiming,
        tags: preset.tags,
      })
    }
  }

  return merged
}

export { getAnalysisHistory }
