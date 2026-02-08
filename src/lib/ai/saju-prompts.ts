/**
 * 사주 분석 전문 프롬프트 정의
 *
 * 학생 상황별 맞춤 해석을 위한 5종 프롬프트 + 기본 프롬프트
 */

import { SAJU_INTERPRETATION_PROMPT } from "./prompts"
import type { SajuResult } from "@/lib/analysis/saju"

// ---------------------------------------------------------------------------
// 타입 정의
// ---------------------------------------------------------------------------

export type AnalysisPromptId =
  | "default"
  | "learning-dna"
  | "exam-slump"
  | "career-navi"
  | "mental-energy"
  | "parent-support"

export type AnalysisPromptMeta = {
  id: AnalysisPromptId
  name: string
  shortDescription: string
  target: string
  levels: string
  purpose: string
  recommendedTiming: string
  tags: string[]
}

export type AnalysisPromptDefinition = {
  meta: AnalysisPromptMeta
  buildPrompt: (sajuResult: SajuResult) => string
}

// ---------------------------------------------------------------------------
// 사주 데이터 포맷 헬퍼
// ---------------------------------------------------------------------------

function formatSajuData(r: SajuResult): string {
  const hourPillar = r.pillars.hour
    ? `${r.pillars.hour.stem}${r.pillars.hour.branch}`
    : "미상"

  return `
**사주 구조 (四柱):**
- 연주(年柱): ${r.pillars.year.stem}${r.pillars.year.branch}
- 월주(月柱): ${r.pillars.month.stem}${r.pillars.month.branch}
- 일주(日柱): ${r.pillars.day.stem}${r.pillars.day.branch}
- 시주(時柱): ${hourPillar}

**오행 분포 (五行):**
- 목(木): ${r.elements['목'] ?? 0}
- 화(火): ${r.elements['화'] ?? 0}
- 토(土): ${r.elements['토'] ?? 0}
- 금(金): ${r.elements['금'] ?? 0}
- 수(水): ${r.elements['수'] ?? 0}

**십성 관계 (十星):**
- 연주 십성: ${r.tenGods.year}
- 월주 십성: ${r.tenGods.month}
${r.tenGods.hour ? `- 시주 십성: ${r.tenGods.hour}` : ''}`.trim()
}

// ---------------------------------------------------------------------------
// 프롬프트 정의
// ---------------------------------------------------------------------------

const PROMPT_DEFINITIONS: Record<AnalysisPromptId, AnalysisPromptDefinition> = {
  default: {
    meta: {
      id: "default",
      name: "기본 해석",
      shortDescription: "종합적인 사주 해석",
      target: "전체 학생",
      levels: "기본",
      purpose: "사주의 전반적인 특성과 잠재력을 종합적으로 해석합니다.",
      recommendedTiming: "첫 상담, 일반 상담",
      tags: ["종합", "기본"],
    },
    buildPrompt: (sajuResult) => SAJU_INTERPRETATION_PROMPT(sajuResult),
  },

  "learning-dna": {
    meta: {
      id: "learning-dna",
      name: "학습 DNA 분석",
      shortDescription: "학습 스타일과 집중력 패턴 분석",
      target: "학습 고민이 있는 학생",
      levels: "심화",
      purpose: "사주에 나타난 학습 성향, 집중 시간대, 효과적인 학습 전략을 분석합니다.",
      recommendedTiming: "학기 초, 학습 부진 상담",
      tags: ["학습", "집중력", "공부법"],
    },
    buildPrompt: (sajuResult) => `
너는 한국 전통 사주명리학과 교육심리학을 결합한 학습 코칭 전문가야.
아래 사주 데이터를 분석하여 학생의 학습 DNA를 파악해줘.

${formatSajuData(sajuResult)}

다음 항목을 포함하여 분석해주세요:

1. **학습 성향 분석**
   - 일간(日干)의 오행으로 본 기본 학습 스타일 (시각형/청각형/체험형)
   - 집중력 패턴: 오행 균형에서 보이는 지구력 vs 순발력 성향

2. **최적 학습 시간대**
   - 시주와 일주 관계에서 읽는 두뇌 활성화 시간
   - 오행 에너지 흐름으로 본 효율적인 시간 배분

3. **과목별 적성**
   - 강한 오행에 대응하는 학문 영역 (목=언어/창작, 화=예체능/발표, 토=사회/역사, 금=수학/과학, 수=외국어/탐구)
   - 부족한 오행을 보완하는 학습 전략

4. **학습 환경 조언**
   - 사주 특성에 맞는 학습 공간, 분위기
   - 함께 공부하면 좋은 유형 vs 혼자 집중이 나은 유형

5. **동기부여 전략**
   - 십성 관계에서 읽는 동기 유형 (외적 보상형/내적 만족형/경쟁형/협력형)
   - 슬럼프 극복에 효과적인 접근법

**중요:**
- 과학적 근거가 없는 전통 해석임을 명시
- 긍정적이고 격려하는 톤 유지
- 구체적인 학습 팁을 포함
- 마크다운 형식으로 작성
`.trim(),
  },

  "exam-slump": {
    meta: {
      id: "exam-slump",
      name: "시험 불안 극복",
      shortDescription: "시험 스트레스와 불안 대응 전략",
      target: "시험 불안이 있는 학생",
      levels: "심화",
      purpose: "사주에서 읽는 스트레스 반응 패턴과 불안 극복 전략을 제시합니다.",
      recommendedTiming: "시험 기간, 입시 준비기",
      tags: ["시험", "불안", "스트레스", "멘탈"],
    },
    buildPrompt: (sajuResult) => `
너는 한국 전통 사주명리학과 스포츠 심리학을 결합한 멘탈 코칭 전문가야.
아래 사주 데이터를 분석하여 시험 불안 극복 전략을 제시해줘.

${formatSajuData(sajuResult)}

다음 항목을 포함하여 분석해주세요:

1. **스트레스 반응 유형**
   - 일간의 오행으로 본 압박 상황에서의 반응 패턴
   - 과잉/부족 오행이 만드는 불안 메커니즘

2. **시험 전 컨디션 관리**
   - 사주 에너지 흐름으로 본 최적의 준비 루틴
   - 오행 균형을 위한 식습관/수면/운동 조언

3. **시험 당일 전략**
   - 시주 특성으로 본 시험 시간대별 집중력 관리
   - 긴장 완화에 효과적인 호흡법/마인드셋

4. **실패 회복력**
   - 십성 관계로 본 좌절 대응 스타일
   - 실수를 성장으로 바꾸는 리프레이밍 전략

5. **격려 메시지**
   - 학생의 사주 강점을 살린 맞춤형 응원

**중요:**
- 과학적 근거가 없는 전통 해석임을 명시
- 공감과 격려 중심의 따뜻한 톤
- 실천 가능한 구체적 팁 제시
- 마크다운 형식으로 작성
`.trim(),
  },

  "career-navi": {
    meta: {
      id: "career-navi",
      name: "진로 내비게이션",
      shortDescription: "적성과 진로 방향 심층 분석",
      target: "진로 고민이 있는 학생",
      levels: "심화",
      purpose: "사주에 나타난 직업 적성, 재능, 리더십 유형을 심층 분석합니다.",
      recommendedTiming: "진로 상담, 학과 선택 시기",
      tags: ["진로", "적성", "직업", "재능"],
    },
    buildPrompt: (sajuResult) => `
너는 한국 전통 사주명리학과 진로상담학을 결합한 진로 코칭 전문가야.
아래 사주 데이터를 분석하여 학생의 진로 방향을 제시해줘.

${formatSajuData(sajuResult)}

다음 항목을 포함하여 분석해주세요:

1. **핵심 재능 분석**
   - 일주의 특성으로 본 타고난 재능 3가지
   - 오행 분포에서 읽는 잠재력 영역

2. **직업 적성 매칭**
   - 강한 오행에 대응하는 직업군
     - 목(木): 교육, 미디어, 패션, 환경, 문학
     - 화(火): 예술, 엔터테인먼트, 마케팅, 외식
     - 토(土): 부동산, 건축, 농업, 중개, 컨설팅
     - 금(金): IT, 금융, 법률, 의료, 기계
     - 수(水): 무역, 물류, 연구, 심리, 외교
   - 십성 관계로 본 업무 스타일 (개인 vs 팀, 창의 vs 분석)

3. **리더십 유형**
   - 사주에서 읽는 리더십 성향 (비전형/관리형/서번트형/변혁형)
   - 조직 내 최적 포지션

4. **추천 학과 방향**
   - 사주 적성과 매칭되는 대학 계열/학과 3-5개
   - 학과 선택 시 고려할 점

5. **성장 로드맵**
   - 단기(1년)/중기(3년) 관점에서의 역량 개발 방향
   - 보완해야 할 영역과 구체적 방법

**중요:**
- 과학적 근거가 없는 전통 해석임을 명시
- 가능성을 열어두는 톤 (단정 X)
- 구체적인 직업명과 학과명 포함
- 마크다운 형식으로 작성
`.trim(),
  },

  "mental-energy": {
    meta: {
      id: "mental-energy",
      name: "멘탈 에너지 진단",
      shortDescription: "정서 상태와 에너지 관리 방안",
      target: "정서적 어려움이 있는 학생",
      levels: "심화",
      purpose: "사주 오행 균형에서 읽는 정서 패턴과 에너지 관리 전략을 제시합니다.",
      recommendedTiming: "정서 상담, 관계 갈등 시",
      tags: ["멘탈", "정서", "에너지", "관계"],
    },
    buildPrompt: (sajuResult) => `
너는 한국 전통 사주명리학과 긍정심리학을 결합한 정서 코칭 전문가야.
아래 사주 데이터를 분석하여 학생의 멘탈 에너지 상태를 진단해줘.

${formatSajuData(sajuResult)}

다음 항목을 포함하여 분석해주세요:

1. **정서 에너지 프로필**
   - 오행 균형으로 본 기본 감정 성향
   - 목=분노/의욕, 화=기쁨/흥분, 토=걱정/안정, 금=슬픔/결단, 수=두려움/지혜
   - 에너지 과잉/부족 영역 진단

2. **감정 조절 패턴**
   - 일간 특성으로 본 감정 표현 방식
   - 스트레스 상황에서의 자동 반응 패턴
   - 건강한 감정 표현을 위한 맞춤 전략

3. **대인관계 에너지**
   - 십성 관계로 본 관계 맺기 스타일
   - 에너지를 충전하는 관계 유형 vs 소모하는 관계 유형
   - 갈등 상황 대처법

4. **에너지 충전 방법**
   - 부족한 오행을 보완하는 일상 활동
   - 계절별/시간대별 에너지 관리 팁
   - 취미/운동 추천

5. **마음 단단히 하기**
   - 사주 강점을 활용한 자존감 높이기
   - 회복탄력성을 키우는 일상 루틴
   - 따뜻한 격려 메시지

**중요:**
- 과학적 근거가 없는 전통 해석임을 명시
- 공감과 따뜻함이 느껴지는 톤
- 전문 상담이 필요한 경우 안내 문구 포함
- 마크다운 형식으로 작성
`.trim(),
  },

  "parent-support": {
    meta: {
      id: "parent-support",
      name: "학부모 상담 가이드",
      shortDescription: "학부모에게 전달할 양육 가이드",
      target: "학부모 상담이 필요한 경우",
      levels: "심화",
      purpose: "학부모가 이해하기 쉬운 언어로 자녀의 성향과 양육 방향을 안내합니다.",
      recommendedTiming: "학부모 상담, 가정통신",
      tags: ["학부모", "양육", "소통", "가정"],
    },
    buildPrompt: (sajuResult) => `
너는 한국 전통 사주명리학과 아동발달학을 결합한 양육 코칭 전문가야.
아래 사주 데이터를 분석하여 학부모에게 전달할 양육 가이드를 작성해줘.

${formatSajuData(sajuResult)}

다음 항목을 포함하여 분석해주세요:

1. **아이의 기본 성향**
   - 일주 특성으로 본 기질 유형 (활동형/사색형/사교형/관찰형)
   - 부모가 알아야 할 핵심 성격 특성 3가지
   - 오해받기 쉬운 행동과 그 이면의 의미

2. **양육 스타일 가이드**
   - 이 아이에게 효과적인 칭찬 방법
   - 훈육 시 주의할 점 (오행 특성별)
   - 자율성 vs 구조화의 적정 비율

3. **학습 지원 방법**
   - 가정에서의 학습 환경 조성 팁
   - 부모가 도울 수 있는 것 vs 맡겨야 할 것
   - 학원/과외 선택 시 고려사항

4. **부모-자녀 소통법**
   - 사주 특성에 맞는 대화 스타일
   - 사춘기 대비 관계 전략
   - 갈등 상황 해결을 위한 접근법

5. **가정 환경 조언**
   - 아이의 오행을 살리는 생활 환경
   - 형제자매/또래 관계 지도 방향

**중요:**
- 과학적 근거가 없는 전통 해석임을 명시
- 학부모 눈높이에 맞는 쉬운 표현 사용
- 비난이 아닌 이해 중심의 톤
- 마크다운 형식으로 작성
`.trim(),
  },
}

// ---------------------------------------------------------------------------
// 헬퍼 함수
// ---------------------------------------------------------------------------

/** 프롬프트 옵션 목록 (UI 드롭다운용) */
export function getPromptOptions(): AnalysisPromptMeta[] {
  return Object.values(PROMPT_DEFINITIONS).map((d) => d.meta)
}

/** ID로 프롬프트 정의 조회 */
export function getPromptDefinition(id: AnalysisPromptId): AnalysisPromptDefinition {
  return PROMPT_DEFINITIONS[id] ?? PROMPT_DEFINITIONS.default
}

/** 프롬프트 미리보기 텍스트 (샘플 사주 데이터 적용) */
export function getPromptPreviewText(id: AnalysisPromptId): string {
  const sampleSaju: SajuResult = {
    pillars: {
      year: { stem: "갑", branch: "자" },
      month: { stem: "병", branch: "인" },
      day: { stem: "무", branch: "오" },
      hour: { stem: "경", branch: "신" },
    },
    elements: { "목": 2, "화": 3, "토": 1, "금": 1, "수": 1 },
    tenGods: { year: "편재", month: "편인", hour: "식신" },
    meta: {
      solarYear: 2008,
      solarTerm: "소한",
      solarTermIndex: 0,
      monthIndex: 0,
      dayIndex: 0,
      timeKnown: true,
      kstTimestamp: "2008-01-10T06:30:00+09:00",
    },
  }
  return getPromptDefinition(id).buildPrompt(sampleSaju)
}
