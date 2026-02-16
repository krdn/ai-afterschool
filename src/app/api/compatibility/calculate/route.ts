import { NextResponse } from "next/server"
import { z } from "zod"
import { verifySession } from "@/lib/dal"
import { analyzeCompatibility } from "@/lib/actions/matching/compatibility"

/**
 * Request body schema for compatibility calculation
 */
const CalculateCompatibilitySchema = z.object({
  teacherId: z.string().min(1, "teacherId is required"),
  studentId: z.string().min(1, "studentId is required"),
})

/**
 * POST /api/compatibility/calculate
 *
 * 선생님-학생 궁합 점수 계산 API
 *
 * Request body:
 * {
 *   "teacherId": "string",
 *   "studentId": "string"
 * }
 *
 * Response (200 OK):
 * {
 *   "success": true,
 *   "score": {
 *     "overall": 85,
 *     "breakdown": { ... },
 *     "reasons": [...]
 *   }
 * }
 */
export async function POST(request: Request) {
  // 인증 확인
  const session = await verifySession()

  // Request body 파싱
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    )
  }

  // Request body 검증
  const parsed = CalculateCompatibilitySchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Missing or invalid teacherId or studentId" },
      { status: 400 }
    )
  }

  const { teacherId, studentId } = parsed.data

  // 궁합 분석 실행
  try {
    const result = await analyzeCompatibility(teacherId, studentId)
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to calculate compatibility"

    // 404 Not Found: Teacher or Student not found
    if (
      errorMessage.includes("선생님을 찾을 수 없어요") ||
      errorMessage.includes("학생을 찾을 수 없어요")
    ) {
      return NextResponse.json({ error: errorMessage }, { status: 404 })
    }

    // 500 Internal Server Error: Other errors
    console.error("Compatibility calculation error:", error)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
