import { HANJA_STROKES_DATA } from "./hanja-strokes-data"

export type HanjaSelection = {
  syllable: string
  hanja: string | null
}

export type HanjaCandidate = {
  hanja: string
  meaning: string
  strokes: number
}

// 자동 생성 데이터(547자) + 수동 보완 (자동 생성에 누락된 한자)
const HANJA_STROKES: Record<string, number> = {
  ...HANJA_STROKES_DATA,
  // 기존 수동 등록 중 자동 생성에 없는 한자 보완
  今: 4,
  宮: 10,
  弓: 3,
  味: 8,
}

const HANJA_CANDIDATES: Record<string, { hanja: string; meaning: string }[]> = {
  김: [
    { hanja: "金", meaning: "쇠, 귀함" },
    { hanja: "今", meaning: "지금" },
  ],
  홍: [
    { hanja: "洪", meaning: "큰 물" },
    { hanja: "弘", meaning: "넓게" },
  ],
  길: [
    { hanja: "吉", meaning: "길함" },
    { hanja: "桔", meaning: "귤" },
  ],
  동: [
    { hanja: "東", meaning: "동녘" },
    { hanja: "同", meaning: "같다" },
  ],
  남: [
    { hanja: "南", meaning: "남쪽" },
    { hanja: "男", meaning: "사내" },
  ],
  궁: [
    { hanja: "宮", meaning: "궁궐" },
    { hanja: "弓", meaning: "활" },
  ],
  민: [
    { hanja: "敏", meaning: "민첩" },
    { hanja: "珉", meaning: "옥" },
  ],
  수: [
    { hanja: "秀", meaning: "빼어남" },
    { hanja: "洙", meaning: "물 이름" },
  ],
  성: [
    { hanja: "成", meaning: "이룰" },
    { hanja: "聖", meaning: "성인" },
  ],
  현: [
    { hanja: "炫", meaning: "빛날" },
    { hanja: "玹", meaning: "옥돌" },
  ],
  미: [
    { hanja: "美", meaning: "아름다움" },
    { hanja: "味", meaning: "맛" },
  ],
  진: [
    { hanja: "眞", meaning: "참" },
    { hanja: "珍", meaning: "보배" },
  ],
  영: [
    { hanja: "英", meaning: "꽃, 뛰어남" },
    { hanja: "榮", meaning: "영화" },
  ],
  승: [
    { hanja: "承", meaning: "이을" },
    { hanja: "昇", meaning: "오를" },
  ],
}

function splitSyllables(name: string) {
  return Array.from(name.trim())
}

// CJK Unified Ideographs 범위 (U+4E00–U+9FFF)
const CJK_START = 0x4e00
const CJK_END = 0x9fff
// CJK 한자의 평균 획수 (근사치, 폴백용)
const CJK_FALLBACK_STROKES = 10

export type StrokeResult = {
  strokes: number
  estimated: boolean
}

export function getStrokeCount(hanja: string): number | null {
  // 1. 등록된 획수 반환
  if (HANJA_STROKES[hanja] !== undefined) {
    return HANJA_STROKES[hanja]
  }

  // 2. CJK 한자 범위인 경우 평균 획수로 추정
  const code = hanja.charCodeAt(0)
  if (code >= CJK_START && code <= CJK_END) {
    return CJK_FALLBACK_STROKES
  }

  // 3. 한자가 아닌 경우
  return null
}

export function getStrokeInfo(hanja: string): StrokeResult | null {
  if (HANJA_STROKES[hanja] !== undefined) {
    return { strokes: HANJA_STROKES[hanja], estimated: false }
  }

  const code = hanja.charCodeAt(0)
  if (code >= CJK_START && code <= CJK_END) {
    return { strokes: CJK_FALLBACK_STROKES, estimated: true }
  }

  return null
}

export function getHanjaCandidates(syllable: string): HanjaCandidate[] {
  const candidates = HANJA_CANDIDATES[syllable] ?? []

  return candidates
    .map((candidate) => {
      const strokes = getStrokeCount(candidate.hanja)
      if (!strokes) return null
      return {
        hanja: candidate.hanja,
        meaning: candidate.meaning,
        strokes,
      }
    })
    .filter((candidate): candidate is HanjaCandidate => Boolean(candidate))
}

export function normalizeHanjaSelections(
  name: string,
  selections?: HanjaSelection[] | null
): HanjaSelection[] {
  const syllables = splitSyllables(name)

  return syllables.map((syllable, index) => {
    const match = selections?.[index]
    if (match && match.syllable === syllable) {
      return { syllable, hanja: match.hanja ?? null }
    }
    return { syllable, hanja: null }
  })
}

export function coerceHanjaSelections(value: unknown): HanjaSelection[] | null {
  // Handle JSON object (not array)
  let arrayValue = value
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    // If it's a JSON object, try to extract array or convert to array
    const obj = value as Record<string, unknown>
    // Check if it has an array property that looks like hanja selections
    if ("selections" in obj && Array.isArray(obj.selections)) {
      arrayValue = obj.selections
    } else {
      // Try to convert object to array of values
      const values = Object.values(obj)
      if (values.length > 0 && typeof values[0] === "object") {
        arrayValue = values
      } else {
        return null
      }
    }
  }

  if (!Array.isArray(arrayValue)) return null
  const selections = arrayValue
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null
      const record = entry as { syllable?: unknown; hanja?: unknown }
      if (typeof record.syllable !== "string") return null
      const hanja =
        typeof record.hanja === "string" || record.hanja === null
          ? record.hanja
          : null
      return { syllable: record.syllable, hanja }
    })
    .filter((entry): entry is HanjaSelection => Boolean(entry))

  return selections.length ? selections : null
}

export function selectionsToHanjaName(selections: HanjaSelection[] | null) {
  if (!selections || selections.length === 0) return null
  if (selections.some((selection) => !selection.hanja)) return null
  return selections.map((selection) => selection.hanja).join("")
}
