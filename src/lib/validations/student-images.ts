import { z } from "zod"

export const StudentImageSchema = z.object({
  type: z.enum(["profile", "face", "palm"]),
  originalUrl: z.string().url(),
  publicId: z.string().min(1),
  format: z.string().optional(),
  bytes: z.coerce.number().int().positive().optional(),
  width: z.coerce.number().int().positive().optional(),
  height: z.coerce.number().int().positive().optional(),
})

export type StudentImageInput = z.infer<typeof StudentImageSchema>
