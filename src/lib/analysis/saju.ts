import { getKoreaDstOffsetMinutes } from "@/lib/analysis/dst-kr"
import { getSolarTerm, getSolarTermIndex } from "@/lib/analysis/solar-terms"

export type SajuElement = "목" | "화" | "토" | "금" | "수"

export type SajuPillar = {
  stem: string
  branch: string
}

export type SajuPillars = {
  year: SajuPillar
  month: SajuPillar
  day: SajuPillar
  hour?: SajuPillar | null
}

export type SajuResult = {
  pillars: SajuPillars
  elements: Record<SajuElement, number>
  tenGods: {
    year: string
    month: string
    hour?: string | null
  }
  meta: {
    solarYear: number
    solarTerm: string
    solarTermIndex: number
    monthIndex: number
    dayIndex: number
    timeKnown: boolean
    kstTimestamp: string
    correctedTimestamp: string
    longitude: number
    solarCorrectionMinutes: number
    dstAdjusted: boolean
  }
}

export type SajuInput = {
  birthDate: Date
  time?: { hour: number; minute?: number } | null
  longitude?: number
}

const KST_OFFSET_MINUTES = 540
const STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"]
const BRANCHES = [
  "자",
  "축",
  "인",
  "묘",
  "진",
  "사",
  "오",
  "미",
  "신",
  "유",
  "술",
  "해",
]
const MONTH_BRANCH_START_INDEX = 2
const YEAR_BASE = 1984
const BASE_DAY_TIMESTAMP = buildKstTimestamp({
  year: 1984,
  monthIndex: 1,
  day: 2,
  hour: 0,
  minute: 0,
})

const STEM_ELEMENT: SajuElement[] = [
  "목",
  "목",
  "화",
  "화",
  "토",
  "토",
  "금",
  "금",
  "수",
  "수",
]

const BRANCH_ELEMENT: Record<string, SajuElement> = {
  자: "수",
  축: "토",
  인: "목",
  묘: "목",
  진: "토",
  사: "화",
  오: "화",
  미: "토",
  신: "금",
  유: "금",
  술: "토",
  해: "수",
}

const ELEMENT_ORDER: SajuElement[] = ["목", "화", "토", "금", "수"]

const MONTH_STEM_START_BY_YEAR_STEM = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0]
const HOUR_STEM_START_BY_DAY_STEM = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8]

function buildKstTimestamp({
  year,
  monthIndex,
  day,
  hour,
  minute,
}: {
  year: number
  monthIndex: number
  day: number
  hour: number
  minute: number
}) {
  const utcTimestamp = Date.UTC(year, monthIndex, day, hour, minute)
  return utcTimestamp - KST_OFFSET_MINUTES * 60 * 1000
}

function getKstParts(kstTimestamp: number) {
  const date = new Date(kstTimestamp + KST_OFFSET_MINUTES * 60 * 1000)
  return {
    year: date.getUTCFullYear(),
    monthIndex: date.getUTCMonth(),
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
  }
}

function normalizeBirthTimestamp(input: SajuInput) {
  const { birthDate, time } = input
  const year = birthDate.getUTCFullYear()
  const monthIndex = birthDate.getUTCMonth()
  const day = birthDate.getUTCDate()
  const hour = time?.hour ?? 0
  const minute = time?.minute ?? 0

  return buildKstTimestamp({ year, monthIndex, day, hour, minute })
}

function getSolarCorrectedTimestamp(kstTimestamp: number, longitude: number) {
  const solarCorrectionMinutes = (longitude - 135) * 4
  return {
    correctedTimestamp:
      kstTimestamp + solarCorrectionMinutes * 60 * 1000,
    solarCorrectionMinutes,
  }
}

function mod(value: number, base: number) {
  return ((value % base) + base) % base
}

function getStemBranch(index: number) {
  const stemIndex = mod(index, 10)
  const branchIndex = mod(index, 12)
  return { stemIndex, branchIndex }
}

function getYearPillar(solarYear: number) {
  const yearOffset = solarYear - YEAR_BASE
  const { stemIndex, branchIndex } = getStemBranch(yearOffset)
  return {
    pillar: {
      stem: STEMS[stemIndex],
      branch: BRANCHES[branchIndex],
    },
    stemIndex,
  }
}

function getMonthPillar(yearStemIndex: number, monthIndex: number) {
  const branchIndex = mod(MONTH_BRANCH_START_INDEX + monthIndex, 12)
  const stemStart = MONTH_STEM_START_BY_YEAR_STEM[yearStemIndex]
  const stemIndex = mod(stemStart + monthIndex, 10)

  return {
    pillar: {
      stem: STEMS[stemIndex],
      branch: BRANCHES[branchIndex],
    },
    stemIndex,
  }
}

function getDayPillar(kstTimestamp: number) {
  const { year, monthIndex, day } = getKstParts(kstTimestamp)
  const dayStart = buildKstTimestamp({
    year,
    monthIndex,
    day,
    hour: 0,
    minute: 0,
  })
  const diffDays = Math.round((dayStart - BASE_DAY_TIMESTAMP) / 86400000)
  const dayIndex = mod(diffDays, 60)
  const { stemIndex, branchIndex } = getStemBranch(dayIndex)

  return {
    pillar: {
      stem: STEMS[stemIndex],
      branch: BRANCHES[branchIndex],
    },
    stemIndex,
    dayIndex,
  }
}

function getHourPillar(dayStemIndex: number, kstTimestamp: number) {
  const { hour } = getKstParts(kstTimestamp)
  const branchIndex = Math.floor(((hour + 1) % 24) / 2)
  const stemStart = HOUR_STEM_START_BY_DAY_STEM[dayStemIndex]
  const stemIndex = mod(stemStart + branchIndex, 10)

  return {
    pillar: {
      stem: STEMS[stemIndex],
      branch: BRANCHES[branchIndex],
    },
    stemIndex,
  }
}

function getElementBalance(pillars: SajuPillars): Record<SajuElement, number> {
  const balance: Record<SajuElement, number> = {
    목: 0,
    화: 0,
    토: 0,
    금: 0,
    수: 0,
  }

  const allPillars = [pillars.year, pillars.month, pillars.day]
  if (pillars.hour) {
    allPillars.push(pillars.hour)
  }

  allPillars.forEach((pillar) => {
    const stemIndex = STEMS.indexOf(pillar.stem)
    if (stemIndex >= 0) {
      balance[STEM_ELEMENT[stemIndex]] += 1
    }
    const branchElement = BRANCH_ELEMENT[pillar.branch]
    if (branchElement) {
      balance[branchElement] += 1
    }
  })

  return balance
}

function getElementRelation(dayElement: SajuElement, otherElement: SajuElement) {
  const dayIndex = ELEMENT_ORDER.indexOf(dayElement)
  const otherIndex = ELEMENT_ORDER.indexOf(otherElement)
  const generates = mod(dayIndex + 1, ELEMENT_ORDER.length) === otherIndex
  const generatedBy = mod(dayIndex - 1, ELEMENT_ORDER.length) === otherIndex
  const controls = mod(dayIndex + 2, ELEMENT_ORDER.length) === otherIndex
  const controlledBy = mod(dayIndex - 2, ELEMENT_ORDER.length) === otherIndex

  return { generates, generatedBy, controls, controlledBy }
}

function getTenGod(dayStemIndex: number, targetStemIndex: number) {
  const dayElement = STEM_ELEMENT[dayStemIndex]
  const targetElement = STEM_ELEMENT[targetStemIndex]
  const sameElement = dayElement === targetElement
  const samePolarity = dayStemIndex % 2 === targetStemIndex % 2
  const relation = getElementRelation(dayElement, targetElement)

  if (sameElement) {
    return samePolarity ? "비견" : "겁재"
  }

  if (relation.generates) {
    return samePolarity ? "식신" : "상관"
  }

  if (relation.generatedBy) {
    return samePolarity ? "정인" : "편인"
  }

  if (relation.controls) {
    return samePolarity ? "정재" : "편재"
  }

  if (relation.controlledBy) {
    return samePolarity ? "정관" : "편관"
  }

  return "비견"
}

export function calculateSaju(input: SajuInput): SajuResult {
  const longitude = input.longitude ?? 127.0
  const rawTimestamp = normalizeBirthTimestamp(input)
  const dstOffsetMinutes = getKoreaDstOffsetMinutes(rawTimestamp)
  const dstAdjustedTimestamp = rawTimestamp + dstOffsetMinutes * 60 * 1000
  const { correctedTimestamp, solarCorrectionMinutes } =
    getSolarCorrectedTimestamp(dstAdjustedTimestamp, longitude)

  const correctedParts = getKstParts(correctedTimestamp)
  const ipchun = getSolarTerm(correctedParts.year, "입춘").at.getTime()
  const solarYear = correctedTimestamp >= ipchun
    ? correctedParts.year
    : correctedParts.year - 1

  const { index: solarTermIndex, term: solarTerm } = getSolarTermIndex(
    solarYear,
    correctedTimestamp
  )
  const monthIndex = Math.floor(solarTermIndex / 2)

  const yearPillar = getYearPillar(solarYear)
  const monthPillar = getMonthPillar(yearPillar.stemIndex, monthIndex)
  const dayPillar = getDayPillar(correctedTimestamp)

  const timeKnown = Boolean(input.time)
  const hourPillar = timeKnown
    ? getHourPillar(dayPillar.stemIndex, correctedTimestamp)
    : null

  const pillars: SajuPillars = {
    year: yearPillar.pillar,
    month: monthPillar.pillar,
    day: dayPillar.pillar,
    hour: hourPillar?.pillar ?? null,
  }

  const elements = getElementBalance(pillars)
  const tenGods = {
    year: getTenGod(dayPillar.stemIndex, yearPillar.stemIndex),
    month: getTenGod(dayPillar.stemIndex, monthPillar.stemIndex),
    hour: hourPillar
      ? getTenGod(dayPillar.stemIndex, hourPillar.stemIndex)
      : null,
  }

  return {
    pillars,
    elements,
    tenGods,
    meta: {
      solarYear,
      solarTerm: solarTerm.name,
      solarTermIndex,
      monthIndex,
      dayIndex: dayPillar.dayIndex,
      timeKnown,
      kstTimestamp: new Date(dstAdjustedTimestamp).toISOString(),
      correctedTimestamp: new Date(correctedTimestamp).toISOString(),
      longitude,
      solarCorrectionMinutes,
      dstAdjusted: dstOffsetMinutes !== 0,
    },
  }
}
