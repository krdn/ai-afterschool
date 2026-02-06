import { startOfDay, endOfDay, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns"
import type { DatePreset, DateRange } from "@/types/statistics"

/**
 * 확장된 날짜 범위 프리셋
 */
export type ExtendedDatePreset = DatePreset | 'TODAY' | '7D' | '30D' | 'ALL'

/**
 * 날짜 프리셋을 날짜 범위로 변환하는 유틸리티 함수
 */
export function getDateRangeFromPreset(preset: ExtendedDatePreset): DateRange {
  const now = new Date()

  switch (preset) {
    case 'TODAY':
      // 오늘 (00:00:00 ~ 23:59:59)
      return { start: startOfDay(now), end: endOfDay(now) }

    case '7D':
      // 최근 7일
      return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) }

    case '30D':
      // 최근 30일
      return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) }

    case 'ALL':
      // 전체 데이터 (2020년 1월 1일부터)
      return { start: new Date(2020, 0, 1), end: endOfDay(now) }

    case '1M':
    case '3M':
    case '6M':
    case '1Y':
      // 기존 프리셋 (월 단위)
      const monthsMap: Record<DatePreset, number> = {
        '1M': 1,
        '3M': 3,
        '6M': 6,
        '1Y': 12
      }
      const months = monthsMap[preset as DatePreset]
      const startDate = startOfMonth(subMonths(now, months - 1))
      const endDate = endOfMonth(now)
      return { start: startDate, end: endDate }

    default:
      // 기본값: 최근 3개월
      return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) }
  }
}

/**
 * 프리셋 라벨 매핑
 */
export const PRESET_LABELS: Record<ExtendedDatePreset, string> = {
  'TODAY': '오늘',
  '7D': '최근 7일',
  '30D': '최근 30일',
  '3M': '최근 3개월',
  '6M': '최근 6개월',
  '1M': '최근 1개월',
  '1Y': '최근 1년',
  'ALL': '전체'
}

/**
 * 기본 프리셋 목록
 */
export const DEFAULT_PRESETS: ExtendedDatePreset[] = ['TODAY', '7D', '30D', '3M', 'ALL']
