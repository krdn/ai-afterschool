// Type definitions for team composition analysis
export interface TeamComposition {
  teamId: string
  teacherCount: number

  // MBTI distribution
  mbtiDistribution: MBTIDistribution

  // Learning style distribution (VARK)
  learningStyleDistribution: LearningStyleDistribution

  // Saju five elements (오행)
  sajuElementsDistribution: SajuElementsDistribution

  // Expertise coverage
  expertiseCoverage: ExpertiseCoverage

  // Role distribution
  roleDistribution: RoleDistribution
}

export interface MBTIDistribution {
  // 16 types count
  typeCounts: Record<string, number>
  // Most common types
  mostCommon: string[]
  // Rarest types
  rarest: string[]
  // Axis ratios
  axisRatios: {
    E: number // Extraversion
    I: number // Introversion
    S: number // Sensing
    N: number // Intuition
    T: number // Thinking
    F: number // Feeling
    J: number // Judging
    P: number // Perceiving
  }
}

export interface LearningStyleDistribution {
  visual: number // percentage
  auditory: number
  reading: number
  kinesthetic: number
  dominant: string
}

export interface SajuElementsDistribution {
  wood: number // 목 (木)
  fire: number // 화 (火)
  earth: number // 토 (土)
  metal: number // 금 (金)
  water: number // 수 (水)
  dominant: string
  deficient: string[]
}

export interface ExpertiseCoverage {
  // Subject distribution
  subjects: Record<string, number> // { "수학": 5, "영어": 3, ... }

  // Grade level distribution
  grades: Record<string, number> // { "중1": 2, "중2": 3, ... }

  // Experience level distribution
  experienceLevels: {
    junior: number // < 1 year
    mid: number // 1-3 years
    senior: number // 3+ years
  }

  // Weak subjects (low coverage)
  weakSubjects: string[]

  // Weak grades (low coverage)
  weakGrades: string[]
}

export interface RoleDistribution {
  TEAM_LEADER: number
  MANAGER: number
  TEACHER: number
}

export interface DiversityScore {
  overall: number // 0-100
  mbtiDiversity: number
  learningStyleDiversity: number
  sajuElementsDiversity: number
  subjectDiversity: number
  gradeDiversity: number
}

export interface Recommendation {
  id: string
  type: "diversity" | "coverage" | "balance"
  priority: "high" | "medium" | "low"
  title: string
  description: string
  evidence: string
  actionItems: string[]
}

export interface TeamCompositionAnalysis {
  composition: TeamComposition
  diversityScore: DiversityScore
  recommendations: Recommendation[]
  analyzedAt: Date
}
