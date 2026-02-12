'use server'

import { db } from "@/lib/db"
import { getTeacherFaceAnalysis } from "@/lib/db/teacher-face-analysis"
import { getTeacherPalmAnalysis } from "@/lib/db/teacher-palm-analysis"
import { getTeacherMbtiAnalysis } from "@/lib/db/teacher-mbti-analysis"
import { getTeacherNameAnalysis } from "@/lib/db/teacher-name-analysis"
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

export type TeacherAnalysisData = {
  teacher: {
    id: string
    name: string
    nameHanja: unknown
    birthDate: Date | string | null
    birthTimeHour: number | null
    birthTimeMinute: number | null
    sajuAnalysis: {
      result: unknown
      interpretation: string | null
      calculatedAt: Date | string
    } | null
    profileImage: string | null
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
  nameAnalysis: {
    result: unknown
    interpretation: string | null
    calculatedAt: Date | string
  } | null
  enabledProviders: ProviderName[]
  lastUsedProvider: string | null
  lastUsedModel: string | null
  facePromptOptions: PromptOption[]
  palmPromptOptions: PromptOption[]
  mbtiPromptOptions: PromptOption[]
  namePromptOptions: PromptOption[]
}

export async function getTeacherAnalysisData(teacherId: string): Promise<TeacherAnalysisData> {
  try {
    const [teacher, enabledProviders, facePresets, palmPresets, mbtiPresets, namePresets] = await Promise.all([
      db.teacher.findUnique({
        where: { id: teacherId },
        include: {
          teacherSajuAnalysis: true,
        }
      }),
      getEnabledProviders().catch(() => [] as ProviderName[]),
      getActivePresetsByType("face").catch(() => []),
      getActivePresetsByType("palm").catch(() => []),
      getActivePresetsByType("mbti").catch(() => []),
      getActivePresetsByType("name").catch(() => []),
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

    if (!teacher) {
      return {
        teacher: null,
        faceAnalysis: null,
        palmAnalysis: null,
        mbtiAnalysis: null,
        nameAnalysis: null,
        enabledProviders,
        lastUsedProvider: null,
        lastUsedModel: null,
        facePromptOptions: toPromptOptions(facePresets),
        palmPromptOptions: toPromptOptions(palmPresets),
        mbtiPromptOptions: toPromptOptions(mbtiPresets),
        namePromptOptions: toPromptOptions(namePresets),
      }
    }

    const [faceAnalysis, palmAnalysis, mbtiAnalysis, nameAnalysis] = await Promise.all([
      getTeacherFaceAnalysis(teacherId),
      getTeacherPalmAnalysis(teacherId),
      getTeacherMbtiAnalysis(teacherId),
      getTeacherNameAnalysis(teacherId),
    ])

    // 사주 분석에서 사용된 provider와 model 정보 추출
    const sajuAnalysis = teacher.teacherSajuAnalysis as typeof teacher.teacherSajuAnalysis & { usedProvider?: string | null; usedModel?: string | null } | null
    const lastUsedProvider = sajuAnalysis?.usedProvider ?? null
    const lastUsedModel = sajuAnalysis?.usedModel ?? null

    return {
      teacher: {
        id: teacher.id,
        name: teacher.name,
        nameHanja: teacher.nameHanja,
        birthDate: teacher.birthDate,
        birthTimeHour: teacher.birthTimeHour,
        birthTimeMinute: teacher.birthTimeMinute,
        sajuAnalysis: teacher.teacherSajuAnalysis,
        profileImage: teacher.profileImage,
      },
      faceAnalysis: faceAnalysis ? {
        id: faceAnalysis.id,
        status: faceAnalysis.status,
        result: faceAnalysis.result,
        imageUrl: faceAnalysis.imageUrl,
        errorMessage: faceAnalysis.errorMessage,
      } : null,
      palmAnalysis: palmAnalysis ? {
        id: palmAnalysis.id,
        status: palmAnalysis.status,
        result: palmAnalysis.result,
        imageUrl: palmAnalysis.imageUrl,
        hand: palmAnalysis.hand,
        errorMessage: palmAnalysis.errorMessage,
      } : null,
      mbtiAnalysis: mbtiAnalysis ? {
        mbtiType: mbtiAnalysis.mbtiType,
        percentages: mbtiAnalysis.percentages as Record<string, number>,
        calculatedAt: mbtiAnalysis.calculatedAt,
      } : null,
      nameAnalysis: nameAnalysis ? {
        result: nameAnalysis.result,
        interpretation: nameAnalysis.interpretation,
        calculatedAt: nameAnalysis.calculatedAt,
      } : null,
      enabledProviders,
      lastUsedProvider,
      lastUsedModel,
      facePromptOptions: toPromptOptions(facePresets),
      palmPromptOptions: toPromptOptions(palmPresets),
      mbtiPromptOptions: toPromptOptions(mbtiPresets),
      namePromptOptions: toPromptOptions(namePresets),
    }
  } catch (error) {
    console.error("Failed to load teacher analysis data:", error)
    return {
      teacher: null,
      faceAnalysis: null,
      palmAnalysis: null,
      mbtiAnalysis: null,
      nameAnalysis: null,
      enabledProviders: [],
      lastUsedProvider: null,
      lastUsedModel: null,
      facePromptOptions: [],
      palmPromptOptions: [],
      mbtiPromptOptions: [],
      namePromptOptions: [],
    }
  }
}
