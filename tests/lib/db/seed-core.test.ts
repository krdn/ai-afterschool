import { describe, it, expect } from 'vitest'
import {
  ALL_SEED_GROUPS,
  SEED_GROUP_DEPENDENCIES,
  SEED_GROUP_LABELS,
  SEED_GROUP_COUNTS,
  type SeedGroup,
} from '@/lib/db/seed-core'

describe('seed-core 타입 및 상수', () => {
  it('ALL_SEED_GROUPS에 6개 그룹이 정의되어 있다', () => {
    expect(ALL_SEED_GROUPS).toHaveLength(6)
    expect(ALL_SEED_GROUPS).toContain('teams')
    expect(ALL_SEED_GROUPS).toContain('teachers')
    expect(ALL_SEED_GROUPS).toContain('students')
    expect(ALL_SEED_GROUPS).toContain('parents')
    expect(ALL_SEED_GROUPS).toContain('llmConfigs')
    expect(ALL_SEED_GROUPS).toContain('providers')
  })

  it('teams 리셋 시 teachers, students, parents가 의존에 포함된다', () => {
    const deps = SEED_GROUP_DEPENDENCIES.teams
    expect(deps).toContain('teachers')
    expect(deps).toContain('students')
    expect(deps).toContain('parents')
  })

  it('students 리셋 시 parents만 의존에 포함된다', () => {
    const deps = SEED_GROUP_DEPENDENCIES.students
    expect(deps).toEqual(['parents'])
  })

  it('llmConfigs와 providers는 독립 그룹이다', () => {
    expect(SEED_GROUP_DEPENDENCIES.llmConfigs).toEqual([])
    expect(SEED_GROUP_DEPENDENCIES.providers).toEqual([])
  })

  it('모든 그룹에 한글 라벨이 있다', () => {
    for (const group of ALL_SEED_GROUPS) {
      expect(SEED_GROUP_LABELS[group]).toBeTruthy()
    }
  })

  it('모든 그룹에 시드 데이터 건수가 정의되어 있다', () => {
    for (const group of ALL_SEED_GROUPS) {
      expect(SEED_GROUP_COUNTS[group]).toBeGreaterThanOrEqual(0)
    }
  })
})
