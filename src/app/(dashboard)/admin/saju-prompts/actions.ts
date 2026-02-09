"use server"

import { verifySession } from "@/lib/dal"
import {
  getAllPresets,
  createPreset,
  updatePreset,
  deletePreset,
  type CreatePresetInput,
  type UpdatePresetInput,
} from "@/lib/db/saju-prompt-preset"

async function requireAdmin() {
  const session = await verifySession()
  if (!session || (session.role !== "DIRECTOR" && session.role !== "TEAM_LEADER")) {
    throw new Error("권한이 없습니다.")
  }
  return session
}

export async function getPresetsAction() {
  await requireAdmin()
  return getAllPresets()
}

export async function createPresetAction(input: CreatePresetInput) {
  await requireAdmin()
  return createPreset(input)
}

export async function updatePresetAction(id: string, input: UpdatePresetInput) {
  await requireAdmin()
  return updatePreset(id, input)
}

export async function deletePresetAction(id: string) {
  await requireAdmin()
  await deletePreset(id)
}
