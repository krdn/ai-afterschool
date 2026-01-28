import { z } from "zod"

const phoneRegex = /^010-\d{4}-\d{4}$/

export const CreateStudentSchema = z.object({
  name: z.string().min(2, "이름은 2자 이상이어야 해요"),
  birthDate: z.string().refine((val) => {
    const date = new Date(val)
    return !Number.isNaN(date.getTime())
  }, "올바른 생년월일을 입력해주세요"),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || phoneRegex.test(val),
      "010-0000-0000 형식으로 입력해주세요"
    ),
  school: z.string().min(2, "학교명을 입력해주세요"),
  grade: z.coerce
    .number()
    .int()
    .min(1, "학년은 1 이상이어야 해요")
    .max(12, "학년은 12 이하여야 해요"),
  targetUniversity: z.string().optional(),
  targetMajor: z.string().optional(),
  bloodType: z.enum(["A", "B", "AB", "O"]).optional().nullable(),
})

export const HanjaSelectionSchema = z.object({
  syllable: z.string(),
  hanja: z.string().nullable(),
})

export const NameHanjaSchema = z.array(HanjaSelectionSchema)

export const UpdateStudentSchema = CreateStudentSchema.partial()

export type CreateStudentInput = z.infer<typeof CreateStudentSchema>
export type UpdateStudentInput = z.infer<typeof UpdateStudentSchema>
export type NameHanjaInput = z.infer<typeof NameHanjaSchema>
