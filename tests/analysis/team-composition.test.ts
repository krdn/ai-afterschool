import { describe, it, expect } from "vitest"
import { calculateDiversityScore, getTeamRecommendations } from "@/lib/analysis/team-composition"
import type { TeamComposition, DiversityScore } from "@/lib/analysis/team-composition-types"

describe("team-composition", () => {
  describe("calculateDiversityScore", () => {
    it("should calculate MBTI diversity using Shannon index", () => {
      const composition: TeamComposition = {
        teamId: "team-1",
        teacherCount: 10,
        mbtiDistribution: {
          typeCounts: {
            "INTJ": 2,
            "ENTP": 2,
            "ISFP": 2,
            "ESTJ": 2,
            "INFP": 2,
          },
          mostCommon: ["INTJ", "ENTP", "ISFP"],
          rarest: ["ESTJ", "INFP", "INTJ"],
          axisRatios: {
            E: 40,
            I: 60,
            S: 20,
            N: 80,
            T: 60,
            F: 40,
            J: 50,
            P: 50,
          },
        },
        learningStyleDistribution: {
          visual: 30,
          auditory: 25,
          reading: 20,
          kinesthetic: 25,
          dominant: "Visual",
        },
        sajuElementsDistribution: {
          wood: 20,
          fire: 20,
          earth: 20,
          metal: 20,
          water: 20,
          dominant: "목",
          deficient: [],
        },
        expertiseCoverage: {
          subjects: { "수학": 3, "영어": 2, "국어": 2, "과학": 2, "사회": 1 },
          grades: { "중1": 2, "중2": 2, "중3": 2, "고1": 1, "고2": 1, "고3": 2 },
          experienceLevels: { junior: 3, mid: 4, senior: 3 },
          weakSubjects: [],
          weakGrades: [],
        },
        roleDistribution: {
          TEAM_LEADER: 1,
          MANAGER: 1,
          TEACHER: 8,
        },
      }

      const result = calculateDiversityScore(composition)

      expect(result).toBeDefined()
      expect(result.overall).toBeGreaterThanOrEqual(0)
      expect(result.overall).toBeLessThanOrEqual(100)
      expect(result.mbtiDiversity).toBeGreaterThan(0)
      expect(result.learningStyleDiversity).toBeGreaterThan(0)
      expect(result.sajuElementsDiversity).toBeGreaterThan(0)
      expect(result.subjectDiversity).toBeGreaterThan(0)
      expect(result.gradeDiversity).toBeGreaterThan(0)
    })

    it("should handle empty team", () => {
      const composition: TeamComposition = {
        teamId: "team-empty",
        teacherCount: 0,
        mbtiDistribution: {
          typeCounts: {},
          mostCommon: [],
          rarest: [],
          axisRatios: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 },
        },
        learningStyleDistribution: {
          visual: 0,
          auditory: 0,
          reading: 0,
          kinesthetic: 0,
          dominant: "-",
        },
        sajuElementsDistribution: {
          wood: 0,
          fire: 0,
          earth: 0,
          metal: 0,
          water: 0,
          dominant: "-",
          deficient: [],
        },
        expertiseCoverage: {
          subjects: { "수학": 0, "영어": 0, "국어": 0, "과학": 0, "사회": 0 },
          grades: { "중1": 0, "중2": 0, "중3": 0, "고1": 0, "고2": 0, "고3": 0 },
          experienceLevels: { junior: 0, mid: 0, senior: 0 },
          weakSubjects: [],
          weakGrades: [],
        },
        roleDistribution: {
          TEAM_LEADER: 0,
          MANAGER: 0,
          TEACHER: 0,
        },
      }

      const result = calculateDiversityScore(composition)

      expect(result).toBeDefined()
      expect(result.overall).toBe(0)
    })

    it("should return high diversity for balanced distribution", () => {
      const composition: TeamComposition = {
        teamId: "team-balanced",
        teacherCount: 10,
        mbtiDistribution: {
          typeCounts: {
            "INTJ": 1,
            "ENTP": 1,
            "ISFP": 1,
            "ESTJ": 1,
            "INFP": 1,
            "ENFJ": 1,
            "ISTP": 1,
            "ESFJ": 1,
            "ENTJ": 1,
            "ISFJ": 1,
          },
          mostCommon: ["INTJ", "ENTP", "ISFP"],
          rarest: ["ESTJ", "INFP", "INTJ"],
          axisRatios: {
            E: 50,
            I: 50,
            S: 50,
            N: 50,
            T: 50,
            F: 50,
            J: 50,
            P: 50,
          },
        },
        learningStyleDistribution: {
          visual: 25,
          auditory: 25,
          reading: 25,
          kinesthetic: 25,
          dominant: "Visual",
        },
        sajuElementsDistribution: {
          wood: 20,
          fire: 20,
          earth: 20,
          metal: 20,
          water: 20,
          dominant: "목",
          deficient: [],
        },
        expertiseCoverage: {
          subjects: { "수학": 2, "영어": 2, "국어": 2, "과학": 2, "사회": 2 },
          grades: { "중1": 2, "중2": 2, "중3": 2, "고1": 1, "고2": 1, "고3": 2 },
          experienceLevels: { junior: 3, mid: 4, senior: 3 },
          weakSubjects: [],
          weakGrades: [],
        },
        roleDistribution: {
          TEAM_LEADER: 1,
          MANAGER: 1,
          TEACHER: 8,
        },
      }

      const result = calculateDiversityScore(composition)

      expect(result.overall).toBeGreaterThan(70)
    })
  })

  describe("getTeamRecommendations", () => {
    it("should generate recommendations for low visual learning style diversity", () => {
      const composition: TeamComposition = {
        teamId: "team-visual-heavy",
        teacherCount: 10,
        mbtiDistribution: {
          typeCounts: { "INTJ": 10 },
          mostCommon: ["INTJ"],
          rarest: [],
          axisRatios: { E: 0, I: 100, S: 0, N: 100, T: 100, F: 0, J: 100, P: 0 },
        },
        learningStyleDistribution: {
          visual: 70,
          auditory: 10,
          reading: 10,
          kinesthetic: 10,
          dominant: "Visual",
        },
        sajuElementsDistribution: {
          wood: 20,
          fire: 20,
          earth: 20,
          metal: 20,
          water: 20,
          dominant: "목",
          deficient: [],
        },
        expertiseCoverage: {
          subjects: { "수학": 5, "영어": 2, "국어": 2, "과학": 1, "사회": 0 },
          grades: { "중1": 2, "중2": 3, "중3": 2, "고1": 1, "고2": 1, "고3": 1 },
          experienceLevels: { junior: 3, mid: 4, senior: 3 },
          weakSubjects: ["사회", "과학"],
          weakGrades: ["고3"],
        },
        roleDistribution: {
          TEAM_LEADER: 1,
          MANAGER: 1,
          TEACHER: 8,
        },
      }

      const diversityScore: DiversityScore = {
        overall: 45,
        mbtiDiversity: 10,
        learningStyleDiversity: 40,
        sajuElementsDiversity: 80,
        subjectDiversity: 50,
        gradeDiversity: 60,
      }

      const recommendations = getTeamRecommendations(composition, diversityScore)

      expect(recommendations.length).toBeGreaterThan(0)
      expect(recommendations.some(r => r.type === "diversity")).toBe(true)
      expect(recommendations.some(r => r.priority === "high")).toBe(true)
    })

    it("should generate recommendation for weak subject coverage", () => {
      const composition: TeamComposition = {
        teamId: "team-weak-subject",
        teacherCount: 10,
        mbtiDistribution: {
          typeCounts: { "INTJ": 5, "ENTP": 5 },
          mostCommon: ["INTJ", "ENTP"],
          rarest: [],
          axisRatios: { E: 50, I: 50, S: 0, N: 100, T: 100, F: 0, J: 100, P: 0 },
        },
        learningStyleDistribution: {
          visual: 25,
          auditory: 25,
          reading: 25,
          kinesthetic: 25,
          dominant: "Visual",
        },
        sajuElementsDistribution: {
          wood: 20,
          fire: 20,
          earth: 20,
          metal: 20,
          water: 20,
          dominant: "목",
          deficient: [],
        },
        expertiseCoverage: {
          subjects: { "수학": 8, "영어": 2, "국어": 0, "과학": 0, "사회": 0 },
          grades: { "중1": 3, "중2": 3, "중3": 3, "고1": 1, "고2": 0, "고3": 0 },
          experienceLevels: { junior: 3, mid: 4, senior: 3 },
          weakSubjects: ["국어", "과학", "사회"],
          weakGrades: ["고2", "고3"],
        },
        roleDistribution: {
          TEAM_LEADER: 1,
          MANAGER: 1,
          TEACHER: 8,
        },
      }

      const diversityScore: DiversityScore = {
        overall: 40,
        mbtiDiversity: 60,
        learningStyleDiversity: 80,
        sajuElementsDiversity: 100,
        subjectDiversity: 20,
        gradeDiversity: 50,
      }

      const recommendations = getTeamRecommendations(composition, diversityScore)

      expect(recommendations.length).toBeGreaterThan(0)
      expect(recommendations.some(r => r.type === "coverage")).toBe(true)
      expect(recommendations.some(r => r.title.includes("전문성"))).toBe(true)
    })

    it("should generate positive recommendation for high diversity team", () => {
      const composition: TeamComposition = {
        teamId: "team-excellent",
        teacherCount: 10,
        mbtiDistribution: {
          typeCounts: {
            "INTJ": 1,
            "ENTP": 1,
            "ISFP": 1,
            "ESTJ": 1,
            "INFP": 1,
            "ENFJ": 1,
            "ISTP": 1,
            "ESFJ": 1,
            "ENTJ": 1,
            "ISFJ": 1,
          },
          mostCommon: ["INTJ", "ENTP", "ISFP"],
          rarest: ["ESTJ", "INFP", "INTJ"],
          axisRatios: {
            E: 50,
            I: 50,
            S: 50,
            N: 50,
            T: 50,
            F: 50,
            J: 50,
            P: 50,
          },
        },
        learningStyleDistribution: {
          visual: 25,
          auditory: 25,
          reading: 25,
          kinesthetic: 25,
          dominant: "Visual",
        },
        sajuElementsDistribution: {
          wood: 20,
          fire: 20,
          earth: 20,
          metal: 20,
          water: 20,
          dominant: "목",
          deficient: [],
        },
        expertiseCoverage: {
          subjects: { "수학": 2, "영어": 2, "국어": 2, "과학": 2, "사회": 2 },
          grades: { "중1": 2, "중2": 2, "중3": 2, "고1": 1, "고2": 1, "고3": 2 },
          experienceLevels: { junior: 3, mid: 4, senior: 3 },
          weakSubjects: [],
          weakGrades: [],
        },
        roleDistribution: {
          TEAM_LEADER: 1,
          MANAGER: 1,
          TEACHER: 8,
        },
      }

      const diversityScore: DiversityScore = {
        overall: 85,
        mbtiDiversity: 95,
        learningStyleDiversity: 90,
        sajuElementsDiversity: 100,
        subjectDiversity: 85,
        gradeDiversity: 75,
      }

      const recommendations = getTeamRecommendations(composition, diversityScore)

      expect(recommendations.length).toBeGreaterThan(0)
      expect(recommendations.some(r => r.type === "balance" && r.title.includes("우수"))).toBe(true)
      expect(recommendations.some(r => r.priority === "low")).toBe(true)
    })

    it("should sort recommendations by priority", () => {
      const composition: TeamComposition = {
        teamId: "team-priority",
        teacherCount: 10,
        mbtiDistribution: {
          typeCounts: { "INTJ": 10 },
          mostCommon: ["INTJ"],
          rarest: [],
          axisRatios: { E: 0, I: 100, S: 0, N: 100, T: 100, F: 0, J: 100, P: 0 },
        },
        learningStyleDistribution: {
          visual: 70,
          auditory: 10,
          reading: 10,
          kinesthetic: 10,
          dominant: "Visual",
        },
        sajuElementsDistribution: {
          wood: 40,
          fire: 30,
          earth: 20,
          metal: 10,
          water: 0,
          dominant: "목",
          deficient: ["수"],
        },
        expertiseCoverage: {
          subjects: { "수학": 8, "영어": 2, "국어": 0, "과학": 0, "사회": 0 },
          grades: { "중1": 3, "중2": 3, "중3": 3, "고1": 1, "고2": 0, "고3": 0 },
          experienceLevels: { junior: 3, mid: 4, senior: 3 },
          weakSubjects: ["국어", "과학", "사회"],
          weakGrades: ["고2", "고3"],
        },
        roleDistribution: {
          TEAM_LEADER: 1,
          MANAGER: 1,
          TEACHER: 8,
        },
      }

      const diversityScore: DiversityScore = {
        overall: 30,
        mbtiDiversity: 10,
        learningStyleDiversity: 35,
        sajuElementsDiversity: 60,
        subjectDiversity: 20,
        gradeDiversity: 50,
      }

      const recommendations = getTeamRecommendations(composition, diversityScore)

      expect(recommendations.length).toBeGreaterThan(1)
      const priorities = recommendations.map(r => r.priority)
      const priorityOrder = ["high", "medium", "low"]

      for (let i = 0; i < priorities.length - 1; i++) {
        const current = priorityOrder.indexOf(priorities[i])
        const next = priorityOrder.indexOf(priorities[i + 1])
        expect(current).toBeLessThanOrEqual(next)
      }
    })
  })
})
