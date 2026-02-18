// 궁합 결과
export {
  upsertCompatibilityResult,
  getCompatibilityResult,
  getAllCompatibilityResultsForStudent,
  getAllCompatibilityResultsForTeacher,
  getAllCompatibilityResultsForTeam,
  deleteCompatibilityResult,
} from "./compatibility-result"

// 배정 제안
export {
  createAssignmentProposal,
  getAssignmentProposal,
  listAssignmentProposals,
  applyAssignmentProposal,
  rejectAssignmentProposal,
} from "./assignment"

// 분석 데이터 조회 (신규)
export {
  fetchSubjectAnalyses,
  fetchBatchAnalyses,
  fetchPairAnalyses,
} from "./fetch-analysis"

// 타입
export type {
  SubjectAnalyses,
  PairAnalyses,
  TeacherWithAnalyses,
} from "./types"

// 타입 가드
export {
  parseMbtiPercentages,
  parseSajuResult,
  parseNameNumerology,
} from "./type-guards"
