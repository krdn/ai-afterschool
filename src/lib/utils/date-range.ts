import { startOfMonth, endOfMonth, subMonths } from "date-fns"
import type { DatePreset, DateRange } from "@/types/statistics"

/**
 * 날짜 프리셋을 날짜 범위로 변환하는 유틸리티 함수
 */
export function getDateRangeFromPreset(preset: DatePreset): DateRange {
  const now = new Date()
  const monthsMap: Record<DatePreset, number> = {
    '1M': 1,
    '3M': 3,
    '6M': 6,
    '1Y': 12
  }

  const months = monthsMap[preset]
  const startDate = startOfMonth(subMonths(now, months - 1))
  const endDate = endOfMonth(now)

  return { start: startDate, end: endDate }
}
