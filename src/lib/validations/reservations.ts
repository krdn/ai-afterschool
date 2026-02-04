import { z } from "zod"

/**
 * 30분 단위 시간 검증 커스텀 규칙
 * 분이 0 또는 30이어야 함
 */
const validate30MinuteSlot = (dateString: string): boolean => {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) {
    return false
  }
  const minutes = date.getMinutes()
  return minutes === 0 || minutes === 30
}

/**
 * 예약 생성 스키마
 */
export const createReservationSchema = z.object({
  scheduledAt: z
    .string()
    .min(1, "예약 일시를 입력해주세요")
    .refine((val) => !Number.isNaN(new Date(val).getTime()), {
      message: "올바른 날짜 형식이 아닙니다",
    })
    .refine(validate30MinuteSlot, {
      message: "예약 시간은 30분 단위로 선택해주세요 (00분 또는 30분)",
    }),
  studentId: z.string().min(1, "학생을 선택해주세요"),
  parentId: z.string().min(1, "학부모를 선택해주세요"),
  topic: z
    .string()
    .min(2, "상담 주제는 2자 이상 입력해주세요")
    .max(200, "상담 주제는 200자 이하여야 합니다"),
})

export type CreateReservationInput = z.infer<typeof createReservationSchema>
