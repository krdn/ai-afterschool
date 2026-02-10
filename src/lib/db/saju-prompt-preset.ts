import { db } from "@/lib/db"

export type SajuPromptPresetData = {
  id: string
  promptKey: string
  name: string
  shortDescription: string
  target: string
  levels: string
  purpose: string
  recommendedTiming: string
  tags: string[]
  promptTemplate: string
  isBuiltIn: boolean
  isActive: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export type CreatePresetInput = {
  promptKey: string
  name: string
  shortDescription: string
  target: string
  levels?: string
  purpose: string
  recommendedTiming: string
  tags?: string[]
  promptTemplate: string
  isBuiltIn?: boolean
  sortOrder?: number
}

export type UpdatePresetInput = Partial<Omit<CreatePresetInput, "promptKey">> & {
  isActive?: boolean
}

/** 활성 프롬프트 프리셋 전체 목록 조회 */
export async function getActivePresets(): Promise<SajuPromptPresetData[]> {
  const rows = await db.sajuPromptPreset.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  })
  return rows.map(normalizeRow)
}

/** 전체 프리셋 목록 (관리자용, 비활성 포함) */
export async function getAllPresets(): Promise<SajuPromptPresetData[]> {
  const rows = await db.sajuPromptPreset.findMany({
    orderBy: { sortOrder: "asc" },
  })
  return rows.map(normalizeRow)
}

/** 단일 프리셋 조회 */
export async function getPresetByKey(promptKey: string): Promise<SajuPromptPresetData | null> {
  const row = await db.sajuPromptPreset.findUnique({
    where: { promptKey },
  })
  return row ? normalizeRow(row) : null
}

/** 프리셋 생성 */
export async function createPreset(input: CreatePresetInput): Promise<SajuPromptPresetData> {
  const row = await db.sajuPromptPreset.create({
    data: {
      promptKey: input.promptKey,
      name: input.name,
      shortDescription: input.shortDescription,
      target: input.target,
      levels: input.levels ?? "★★★☆☆",
      purpose: input.purpose,
      recommendedTiming: input.recommendedTiming,
      tags: input.tags ?? [],
      promptTemplate: input.promptTemplate,
      isBuiltIn: input.isBuiltIn ?? false,
      sortOrder: input.sortOrder ?? 0,
    },
  })
  return normalizeRow(row)
}

/** 프리셋 수정 */
export async function updatePreset(
  id: string,
  input: UpdatePresetInput,
): Promise<SajuPromptPresetData> {
  const data: Record<string, unknown> = {}
  if (input.name !== undefined) data.name = input.name
  if (input.shortDescription !== undefined) data.shortDescription = input.shortDescription
  if (input.target !== undefined) data.target = input.target
  if (input.levels !== undefined) data.levels = input.levels
  if (input.purpose !== undefined) data.purpose = input.purpose
  if (input.recommendedTiming !== undefined) data.recommendedTiming = input.recommendedTiming
  if (input.tags !== undefined) data.tags = input.tags
  if (input.promptTemplate !== undefined) data.promptTemplate = input.promptTemplate
  if (input.isActive !== undefined) data.isActive = input.isActive
  if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder

  const row = await db.sajuPromptPreset.update({
    where: { id },
    data,
  })
  return normalizeRow(row)
}

/** 프리셋 삭제 (내장 프롬프트는 비활성 처리만 가능) */
export async function deletePreset(id: string): Promise<void> {
  const preset = await db.sajuPromptPreset.findUnique({ where: { id } })
  if (!preset) return
  if (preset.isBuiltIn) {
    await db.sajuPromptPreset.update({
      where: { id },
      data: { isActive: false },
    })
  } else {
    await db.sajuPromptPreset.delete({ where: { id } })
  }
}

/** 코드 기본 프롬프트를 DB에 upsert (없으면 생성, 있으면 스킵) */
export async function seedBuiltInPresets(
  definitions: Array<{
    promptKey: string
    name: string
    shortDescription: string
    target: string
    levels: string
    purpose: string
    recommendedTiming: string
    tags: string[]
    promptTemplate: string
    sortOrder: number
  }>,
): Promise<number> {
  let created = 0
  for (const def of definitions) {
    const existing = await db.sajuPromptPreset.findUnique({
      where: { promptKey: def.promptKey },
    })
    if (!existing) {
      await db.sajuPromptPreset.create({
        data: {
          promptKey: def.promptKey,
          name: def.name,
          shortDescription: def.shortDescription,
          target: def.target,
          levels: def.levels,
          purpose: def.purpose,
          recommendedTiming: def.recommendedTiming,
          tags: def.tags,
          promptTemplate: def.promptTemplate,
          isBuiltIn: true,
          isActive: true,
          sortOrder: def.sortOrder,
        },
      })
      created++
    }
  }
  return created
}

// JSON tags → string[] 변환
function normalizeRow(row: {
  id: string
  promptKey: string
  name: string
  shortDescription: string
  target: string
  levels: string
  purpose: string
  recommendedTiming: string
  tags: unknown
  promptTemplate: string
  isBuiltIn: boolean
  isActive: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}): SajuPromptPresetData {
  return {
    ...row,
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
  }
}
