"use server"

import { revalidatePath } from "next/cache"
import { verifySession, logAuditAction, logSystemAction } from "@/lib/dal"
import { db } from "@/lib/db"
import { runSeed, type SeedResult } from "@/lib/db/seed-core"

// ---------------------------------------------------------------------------
// 결과 타입
// ---------------------------------------------------------------------------

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

// ---------------------------------------------------------------------------
// 권한 검증
// ---------------------------------------------------------------------------

async function requireDirector() {
  const session = await verifySession()
  if (!session || session.role !== "DIRECTOR") {
    throw new Error("권한이 없습니다")
  }
  return session
}

// ---------------------------------------------------------------------------
// 시드 데이터 로드
// ---------------------------------------------------------------------------

export async function runSeedAction(): Promise<ActionResult<SeedResult>> {
  try {
    await requireDirector()

    const result = await runSeed(db)

    await logAuditAction({
      action: "SEED_DATABASE",
      entityType: "SYSTEM",
      changes: result as unknown as Record<string, unknown>,
    })

    await logSystemAction({
      level: "INFO",
      message: "시드 데이터 로드 완료",
      context: result as unknown as Record<string, unknown>,
    })

    revalidatePath("/admin")
    return { success: true, data: result }
  } catch (error) {
    console.error("Failed to run seed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "시드 데이터 로드 중 오류가 발생했어요",
    }
  }
}
