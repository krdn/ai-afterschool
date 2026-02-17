# 시드 시스템 리팩토링 설계

**작성일**: 2026-02-17
**상태**: 승인됨

## 목적

시드 시스템의 코드 중복 제거, import 경로 정리, 파일 책임 분리를 통해 유지보수성을 개선한다.

## 현재 문제점

1. **import 경로 불일치**: `scripts/seed-demo.ts`가 존재하지 않는 `seed-core` 경로 참조
2. **core.ts 비대**: 414줄에 리셋/upsert/이미지 업로드 로직이 혼재
3. **seed-test.ts 독립**: 272줄 하드코딩, 스키마 변경 시 이중 수정 필요
4. **부가 시드 미통합**: provider-templates, feature-mappings가 runSeed()와 분리
5. **re-export 체인 복잡**: core.ts에서 constants.ts 전체를 re-export

## 접근법: 점진적 분리 (접근법 A)

5개 그룹 규모에서 seeders/ 디렉토리까지 분리하는 것은 과도하다.
core.ts 내에서 함수 단위로 분리하고, 리셋과 이미지 업로드만 별도 파일로 뺀다.

## 파일 구조 변경

### 변경 후

```
src/lib/db/seed/
├── constants.ts       ← 타입/상수 (그룹 확장)
├── data.ts            ← 운영 시드 데이터
├── data-test.ts       ← [신규] 테스트 전용 데이터 (고정 ID)
├── core.ts            ← runSeed() 오케스트레이터 + 그룹별 seeder 함수
├── reset.ts           ← [신규] 리셋 로직
├── images.ts          ← [신규] Cloudinary 이미지 업로드
└── index.ts           ← [신규] public API re-export

prisma/
└── seed.ts            ← --preset 옵션 지원 (test/demo)

scripts/
└── seed-demo.ts       ← import 경로 수정
```

### 삭제 대상

| 파일 | 이유 |
|------|------|
| `prisma/seed-test.ts` | data-test.ts + runSeed(preset) 로 대체 |
| `src/lib/db/seed/provider-templates.ts` | core.ts seeder로 통합 |
| `src/lib/db/seed/feature-mappings.ts` | core.ts seeder로 통합 |

## 핵심 설계

### 1. constants.ts 확장

```typescript
export type SeedGroup =
  | 'teams' | 'teachers' | 'students' | 'parents' | 'providers'
  | 'providerTemplates' | 'featureMappings'

export const DEFAULT_SEED_GROUPS: SeedGroup[] = [
  'teams', 'teachers', 'students', 'parents', 'providers'
]

export const ALL_SEED_GROUPS: SeedGroup[] = [
  ...DEFAULT_SEED_GROUPS, 'providerTemplates', 'featureMappings'
]

export type SeedOptions = {
  groups?: SeedGroup[]
  modes?: Partial<Record<SeedGroup, SeedMode>>
  excludeTeacherId?: string
  dataOverride?: Partial<SeedDataSet>
}
```

### 2. core.ts 오케스트레이터

runSeed()가 그룹별 seeder 함수를 호출하는 구조.
각 seeder는 같은 파일 내 함수로 정의 (~50줄씩).

### 3. seed-test.ts 통합

하드코딩 데이터를 data-test.ts로 추출 (data.ts와 동일 타입).
prisma/seed.ts에서 --preset test 옵션으로 테스트 데이터 주입.

### 4. index.ts public API

```typescript
// 서버용
export { runSeed } from './core'
// 클라이언트 안전
export { ALL_SEED_GROUPS, SEED_GROUP_LABELS, ... } from './constants'
```

## 하위 호환

| 명령어 | 동작 변경 |
|--------|-----------|
| `pnpm prisma db seed` | 없음 |
| `pnpm db:seed:test` | seed-test.ts → seed.ts --preset test |
| `pnpm seed:demo` | import 경로만 변경 |
| 웹 UI 시드 | 없음 |
