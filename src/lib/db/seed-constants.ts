/**
 * 시드 타입 및 상수 (클라이언트/서버 공용)
 *
 * 서버 전용 의존성(argon2 등)이 없으므로 클라이언트 컴포넌트에서도 안전하게 import 가능합니다.
 */

// ---------------------------------------------------------------------------
// 시드 옵션 타입
// ---------------------------------------------------------------------------

export type SeedGroup = 'teams' | 'teachers' | 'students' | 'parents' | 'llmConfigs' | 'providers'
export type SeedMode = 'merge' | 'reset'

export type SeedOptions = {
  groups?: SeedGroup[]
  modes?: Partial<Record<SeedGroup, SeedMode>>
  /** 리셋 시 삭제에서 제외할 선생님 ID (현재 로그인한 사용자 보호) */
  excludeTeacherId?: string
}

// ---------------------------------------------------------------------------
// 결과 타입
// ---------------------------------------------------------------------------

export type SeedModelResult = { created: number; updated: number }

export type SeedResult = {
  teams: SeedModelResult
  teachers: SeedModelResult
  students: SeedModelResult
  parents: SeedModelResult
  llmConfigs: SeedModelResult
  providers: SeedModelResult
}

// ---------------------------------------------------------------------------
// 상수
// ---------------------------------------------------------------------------

/** 모든 시드 그룹 (기본값) */
export const ALL_SEED_GROUPS: SeedGroup[] = ['teams', 'teachers', 'students', 'parents', 'llmConfigs', 'providers']

/** 그룹별 의존성 (리셋 시 함께 리셋해야 할 하위 그룹) */
export const SEED_GROUP_DEPENDENCIES: Record<SeedGroup, SeedGroup[]> = {
  teams: ['teachers', 'students', 'parents'],
  teachers: ['students', 'parents'],
  students: ['parents'],
  parents: [],
  llmConfigs: [],
  providers: [],
}

/** 그룹별 한글 라벨 */
export const SEED_GROUP_LABELS: Record<SeedGroup, string> = {
  teams: '팀',
  teachers: '선생님',
  students: '학생',
  parents: '학부모',
  llmConfigs: 'LLM 설정',
  providers: 'Provider',
}

/** 그룹별 시드 데이터 건수 */
export const SEED_GROUP_COUNTS: Record<SeedGroup, number> = {
  teams: 2,
  teachers: 8,
  students: 7,
  parents: 14,
  llmConfigs: 6,
  providers: 7,
}
