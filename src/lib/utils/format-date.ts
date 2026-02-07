import { format, isValid } from "date-fns"

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷팅
 * @param date - 포맷할 날짜 (생략 시 현재 시간)
 * @returns YYYY-MM-DD 형식의 문자열
 * @throws {Error} 유효하지 않은 날짜 입력 시
 */
export function formatDate(date?: Date | string | null): string {
  // 입력이 없으면 현재 날짜
  const targetDate = date ? new Date(date) : new Date()

  // 유효성 검사
  if (!isValid(targetDate)) {
    throw new Error("Invalid date input provided")
  }

  // 포맷팅
  return format(targetDate, "yyyy-MM-dd")
}
