'use server'

import { db } from "@/lib/db"
import { getFaceAnalysisByStudentId } from "@/lib/db/face-analysis"
import { getPalmAnalysisByStudentId } from "@/lib/db/palm-analysis"
import { getMbtiAnalysis } from "@/lib/db/mbti-analysis"
import { getEnabledProviders } from "@/lib/ai/config"
import { getActivePresetsByType } from "@/lib/db/analysis-prompt-preset"
import type { ProviderName } from "@/lib/ai/providers/types"

export type PromptOption = {
  id: string
  name: string
  shortDescription: string
  target: string
  levels: string
  purpose: string
  recommendedTiming: string
  tags: string[]
}

export type StudentAnalysisData = {
  student: {
    id: string
    name: string
    birthDate: Date | string
    birthTimeHour: number | null
    birthTimeMinute: number | null
    sajuAnalysis: {
      result: unknown
      interpretation: string | null
      calculatedAt: Date | string
    } | null
    images: Array<{
      type: string
      originalUrl: string
      resizedUrl: string
    }> | null
  } | null
  faceAnalysis: {
    id: string
    status: string
    result: unknown
    imageUrl: string
    errorMessage: string | null
  } | null
  palmAnalysis: {
    id: string
    status: string
    result: unknown
    imageUrl: string
    hand: string
    errorMessage: string | null
  } | null
  mbtiAnalysis: {
    mbtiType: string
    percentages: Record<string, number>
    calculatedAt: Date
  } | null
  enabledProviders: ProviderName[]
  lastUsedProvider: string | null
  lastUsedModel: string | null
  facePromptOptions: PromptOption[]
  palmPromptOptions: PromptOption[]
  mbtiPromptOptions: PromptOption[]
}

export async function getStudentAnalysisData(studentId: string): Promise<StudentAnalysisData> {
  try {
    // Fetch student data, enabled providers, and prompt options in parallel
    const [student, enabledProviders, facePresets, palmPresets, mbtiPresets] = await Promise.all([
      db.student.findUnique({
        where: { id: studentId },
        include: {
          sajuAnalysis: true,
          images: true
        }
      }),
      getEnabledProviders().catch(() => [] as ProviderName[]),
      getActivePresetsByType("face").catch(() => []),
      getActivePresetsByType("palm").catch(() => []),
      getActivePresetsByType("mbti").catch(() => []),
    ])

    const toPromptOptions = (presets: Awaited<ReturnType<typeof getActivePresetsByType>>): PromptOption[] =>
      presets.map(p => ({
        id: p.promptKey,
        name: p.name,
        shortDescription: p.shortDescription,
        target: p.target,
        levels: p.levels,
        purpose: p.purpose,
        recommendedTiming: p.recommendedTiming,
        tags: p.tags,
      }))

    if (!student) {
      return {
        student: null,
        faceAnalysis: null,
        palmAnalysis: null,
        mbtiAnalysis: null,
        enabledProviders,
        lastUsedProvider: null,
        lastUsedModel: null,
        facePromptOptions: toPromptOptions(facePresets),
        palmPromptOptions: toPromptOptions(palmPresets),
        mbtiPromptOptions: toPromptOptions(mbtiPresets),
      }
    }

    // Fetch face, palm, mbti analysis, and latest saju history in parallel
    const [faceAnalysis, palmAnalysis, mbtiAnalysis, sajuHistory] = await Promise.all([
      getFaceAnalysisByStudentId(studentId),
      getPalmAnalysisByStudentId(studentId),
      getMbtiAnalysis(studentId),
      db.sajuAnalysisHistory.findFirst({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
        select: { usedProvider: true, usedModel: true }
      })
    ])

    return {
      student: {
        id: student.id,
        name: student.name,
        birthDate: student.birthDate,
        birthTimeHour: student.birthTimeHour,
        birthTimeMinute: student.birthTimeMinute,
        sajuAnalysis: student.sajuAnalysis,
        images: student.images
      },
      faceAnalysis,
      palmAnalysis,
      mbtiAnalysis: mbtiAnalysis ? {
        mbtiType: mbtiAnalysis.mbtiType,
        percentages: mbtiAnalysis.percentages as Record<string, number>,
        calculatedAt: mbtiAnalysis.calculatedAt
      } : null,
      enabledProviders,
      lastUsedProvider: sajuHistory?.usedProvider ?? null,
      lastUsedModel: sajuHistory?.usedModel ?? null,
      facePromptOptions: toPromptOptions(facePresets),
      palmPromptOptions: toPromptOptions(palmPresets),
      mbtiPromptOptions: toPromptOptions(mbtiPresets),
    }
  } catch (error) {
    console.error("Failed to load analysis data:", error)
    return {
      student: null,
      faceAnalysis: null,
      palmAnalysis: null,
      mbtiAnalysis: null,
      enabledProviders: [],
      lastUsedProvider: null,
      lastUsedModel: null,
      facePromptOptions: [],
      palmPromptOptions: [],
      mbtiPromptOptions: [],
    }
  }
}
