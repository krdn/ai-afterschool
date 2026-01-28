import { NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/session"
import { createUploadSignature } from "@/lib/cloudinary"

const SignRequestSchema = z.object({
  type: z.enum(["profile", "face", "palm"]),
  studentId: z.string().optional(),
  draftId: z.string().optional(),
})

export async function POST(request: Request): Promise<Response> {
  const session = await getSession()

  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = SignRequestSchema.safeParse(payload)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const { type, studentId, draftId } = parsed.data
  const resolvedDraftId = studentId ? undefined : draftId ?? crypto.randomUUID()
  const folder = studentId
    ? `students/${studentId}/${type}`
    : `students/drafts/${resolvedDraftId}/${type}`

  const signature = createUploadSignature({ folder })

  return NextResponse.json({
    ...signature,
    draftId: resolvedDraftId,
  })
}
