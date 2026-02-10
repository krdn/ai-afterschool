"use server"

import { verifySession } from "@/lib/dal"
import { redirect } from "next/navigation"
import {
  getAllPresetsByType,
  createPreset,
  updatePreset,
  deletePreset,
  type AnalysisType,
  type AnalysisPromptPresetData,
  type CreatePresetInput,
  type UpdatePresetInput,
} from "@/lib/db/analysis-prompt-preset"

// ---------------------------------------------------------------------------
// 권한 검증
// ---------------------------------------------------------------------------

async function requireAdmin() {
  const session = await verifySession()
  if (!session) {
    redirect("/login")
  }
  if (session.role !== "DIRECTOR") {
    redirect("/access-denied")
  }
  return session
}

// ---------------------------------------------------------------------------
// Server Actions
// ---------------------------------------------------------------------------

/** 특정 분석 유형의 전체 프리셋 조회 (관리자용) */
export async function getPresetsByTypeAction(
  analysisType: AnalysisType,
): Promise<AnalysisPromptPresetData[]> {
  await requireAdmin()
  return getAllPresetsByType(analysisType)
}

/** 프리셋 생성 */
export async function createPresetAction(
  input: CreatePresetInput,
): Promise<AnalysisPromptPresetData> {
  await requireAdmin()
  return createPreset(input)
}

/** 프리셋 수정 */
export async function updatePresetAction(
  id: string,
  input: UpdatePresetInput,
): Promise<AnalysisPromptPresetData> {
  await requireAdmin()
  return updatePreset(id, input)
}

/** 프리셋 삭제 */
export async function deletePresetAction(id: string): Promise<void> {
  await requireAdmin()
  return deletePreset(id)
}
