"use client"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePreset } from "@/types/statistics"

interface DateRangeFilterProps {
  value: DatePreset
  onChange: (preset: DatePreset) => void
  variant?: 'buttons' | 'dropdown'
  showCustom?: boolean
}

const PRESET_LABELS: Record<DatePreset, string> = {
  '1M': '최근 1개월',
  '3M': '최근 3개월',
  '6M': '최근 6개월',
  '1Y': '최근 1년'
}

/**
 * 기간 필터 컴포넌트
 *
 * 두 가지 UI 스타일 제공:
 * - buttons: 4개 버튼 나란히 배치 (기본값)
 * - dropdown: Select 드롭다운
 */
export function DateRangeFilter({
  value,
  onChange,
  variant = 'buttons',
  showCustom = false
}: DateRangeFilterProps) {
  const presets: DatePreset[] = ['1M', '3M', '6M', '1Y']

  if (variant === 'dropdown') {
    return (
      <Select value={value} onValueChange={(v) => onChange(v as DatePreset)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {presets.map((preset) => (
            <SelectItem key={preset} value={preset}>
              {PRESET_LABELS[preset]}
            </SelectItem>
          ))}
          {showCustom && <SelectItem value="custom">사용자 지정</SelectItem>}
        </SelectContent>
      </Select>
    )
  }

  // 버튼 그룹 스타일
  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((preset) => (
        <Button
          key={preset}
          variant={value === preset ? 'default' : 'secondary'}
          size="sm"
          onClick={() => onChange(preset)}
          className="whitespace-nowrap"
        >
          {PRESET_LABELS[preset]}
        </Button>
      ))}
      {showCustom && (
        <Button
          variant={value === 'custom' as DatePreset ? 'default' : 'secondary'}
          size="sm"
          onClick={() => onChange('custom' as DatePreset)}
        >
          사용자 지정
        </Button>
      )}
    </div>
  )
}
