# Seed System Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 시드 시스템의 코드 중복 제거, import 경로 정리, 파일 책임 분리를 통해 유지보수성을 개선한다.

**Architecture:** core.ts(414줄)를 오케스트레이터(~120줄) + reset.ts + images.ts로 분리. seed-test.ts를 data-test.ts + runSeed(dataOverride)로 통합. provider-templates.ts/feature-mappings.ts를 core.ts seeder로 흡수. index.ts로 깔끔한 public API 제공.

**Tech Stack:** TypeScript, Prisma, argon2, Cloudinary

**Design Doc:** `docs/plans/2026-02-17-seed-system-refactor-design.md`

---

### Task 1: constants.ts 확장 — SeedDataSet 타입 + 그룹 추가

**Files:**
- Modify: `src/lib/db/seed/constants.ts`
- Test: `tests/lib/db/seed-core.test.ts`

**Step 1: Write the failing test**

`tests/lib/db/seed-core.test.ts` 파일의 기존 테스트를 확장. 파일 상단 import와 테스트를 수정:

```typescript
import { describe, it, expect } from 'vitest'
import {
  ALL_SEED_GROUPS,
  DEFAULT_SEED_GROUPS,
  SEED_GROUP_DEPENDENCIES,
  SEED_GROUP_LABELS,
  SEED_GROUP_COUNTS,
  type SeedGroup,
} from '@/lib/db/seed/constants'

describe('seed constants', () => {
  it('DEFAULT_SEED_GROUPS에 5개 기본 그룹이 정의되어 있다', () => {
    expect(DEFAULT_SEED_GROUPS).toHaveLength(5)
    expect(DEFAULT_SEED_GROUPS).toContain('teams')
    expect(DEFAULT_SEED_GROUPS).toContain('teachers')
    expect(DEFAULT_SEED_GROUPS).toContain('students')
    expect(DEFAULT_SEED_GROUPS).toContain('parents')
    expect(DEFAULT_SEED_GROUPS).toContain('providers')
  })

  it('ALL_SEED_GROUPS에 7개 전체 그룹이 정의되어 있다', () => {
    expect(ALL_SEED_GROUPS).toHaveLength(7)
    expect(ALL_SEED_GROUPS).toContain('providerTemplates')
    expect(ALL_SEED_GROUPS).toContain('featureMappings')
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

  it('providers, providerTemplates, featureMappings는 독립 그룹이다', () => {
    expect(SEED_GROUP_DEPENDENCIES.providers).toEqual([])
    expect(SEED_GROUP_DEPENDENCIES.providerTemplates).toEqual([])
    expect(SEED_GROUP_DEPENDENCIES.featureMappings).toEqual([])
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
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/db/seed-core.test.ts`
Expected: FAIL — `DEFAULT_SEED_GROUPS`, `providerTemplates`, `featureMappings` 미존재

**Step 3: Write minimal implementation**

`src/lib/db/seed/constants.ts` 전체를 다음으로 교체:

```typescript
/**
 * 시드 타입 및 상수 (클라이언트/서버 공용)
 *
 * 서버 전용 의존성(argon2 등)이 없으므로 클라이언트 컴포넌트에서도 안전하게 import 가능합니다.
 */

import type { SeedTeacher, SeedStudent, SeedParent, SeedProvider } from "./data"

// ---------------------------------------------------------------------------
// 시드 그룹/모드 타입
// ---------------------------------------------------------------------------

export type SeedGroup =
  | 'teams' | 'teachers' | 'students' | 'parents' | 'providers'
  | 'providerTemplates' | 'featureMappings'

export type SeedMode = 'merge' | 'reset'

// ---------------------------------------------------------------------------
// 데이터셋 타입 (데이터 오버라이드용)
// ---------------------------------------------------------------------------

export type SeedDataSet = {
  teams: ReadonlyArray<{ name: string }>
  teachers: ReadonlyArray<SeedTeacher>
  students: ReadonlyArray<SeedStudent>
  parents: ReadonlyArray<SeedParent>
  providers: ReadonlyArray<SeedProvider>
}

// ---------------------------------------------------------------------------
// 시드 옵션
// ---------------------------------------------------------------------------

export type SeedOptions = {
  groups?: SeedGroup[]
  modes?: Partial<Record<SeedGroup, SeedMode>>
  /** 리셋 시 삭제에서 제외할 선생님 ID (현재 로그인한 사용자 보호) */
  excludeTeacherId?: string
  /** 테스트 등에서 기본 데이터 대신 사용할 데이터 */
  dataOverride?: Partial<SeedDataSet>
}

// ---------------------------------------------------------------------------
// 결과 타입
// ---------------------------------------------------------------------------

export type SeedModelResult = { created: number; updated: number }

export type SeedResult = Record<SeedGroup, SeedModelResult>

// ---------------------------------------------------------------------------
// 상수
// ---------------------------------------------------------------------------

/** 기본 시드 그룹 (기존 동작 유지) */
export const DEFAULT_SEED_GROUPS: SeedGroup[] = [
  'teams', 'teachers', 'students', 'parents', 'providers',
]

/** 모든 시드 그룹 (부가 시드 포함) */
export const ALL_SEED_GROUPS: SeedGroup[] = [
  ...DEFAULT_SEED_GROUPS, 'providerTemplates', 'featureMappings',
]

/** 그룹별 의존성 (리셋 시 함께 리셋해야 할 하위 그룹) */
export const SEED_GROUP_DEPENDENCIES: Record<SeedGroup, SeedGroup[]> = {
  teams: ['teachers', 'students', 'parents'],
  teachers: ['students', 'parents'],
  students: ['parents'],
  parents: [],
  providers: [],
  providerTemplates: [],
  featureMappings: [],
}

/** 그룹별 한글 라벨 */
export const SEED_GROUP_LABELS: Record<SeedGroup, string> = {
  teams: '팀',
  teachers: '선생님',
  students: '학생',
  parents: '학부모',
  providers: 'Provider',
  providerTemplates: 'Provider 템플릿',
  featureMappings: '기능 매핑',
}

/** 그룹별 시드 데이터 건수 */
export const SEED_GROUP_COUNTS: Record<SeedGroup, number> = {
  teams: 2,
  teachers: 8,
  students: 7,
  parents: 14,
  providers: 7,
  providerTemplates: 0,  // 동적 — getProviderTemplates().length
  featureMappings: 0,    // 동적 — DEFAULT_FEATURE_MAPPINGS에서 계산
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/db/seed-core.test.ts`
Expected: PASS — 7개 테스트 모두 통과

**Step 5: Commit**

```bash
git add src/lib/db/seed/constants.ts tests/lib/db/seed-core.test.ts
git commit -m "refactor: constants.ts에 SeedDataSet 타입 및 providerTemplates/featureMappings 그룹 추가"
```

---

### Task 2: reset.ts 분리 — 리셋 로직 추출

**Files:**
- Create: `src/lib/db/seed/reset.ts`
- Modify: `src/lib/db/seed/core.ts` (리셋 로직 제거, import 추가)

**Step 1: Create reset.ts**

`src/lib/db/seed/reset.ts`:

```typescript
/**
 * 시드 리셋 로직 (FK 역순 삭제)
 */

import type { Prisma } from "@prisma/client"
import type { SeedGroup } from "./constants"

/** FK 역순으로 안전하게 삭제 */
const DELETE_ORDER: SeedGroup[] = [
  'parents', 'students', 'teachers', 'teams', 'providers',
  'featureMappings', 'providerTemplates',
]

export async function executeReset(
  tx: Prisma.TransactionClient,
  groups: SeedGroup[],
  resetGroups: Set<SeedGroup>,
  excludeTeacherId?: string,
): Promise<void> {
  for (const group of DELETE_ORDER) {
    if (!resetGroups.has(group) || !groups.includes(group)) continue

    switch (group) {
      case 'parents':
        await tx.parent.deleteMany()
        break
      case 'students':
        await tx.student.deleteMany()
        break
      case 'teachers': {
        if (excludeTeacherId) {
          const notMe = { NOT: { performedBy: excludeTeacherId } }
          await tx.issueEvent.deleteMany({ where: notMe })
          await tx.issue.deleteMany({ where: { NOT: { createdBy: excludeTeacherId } } })
          await tx.assignmentProposal.deleteMany({ where: { NOT: { proposedBy: excludeTeacherId } } })
          await tx.passwordResetToken.deleteMany({ where: { NOT: { teacherId: excludeTeacherId } } })
          await tx.teacher.deleteMany({ where: { NOT: { id: excludeTeacherId } } })
        } else {
          await tx.issueEvent.deleteMany()
          await tx.issue.deleteMany()
          await tx.assignmentProposal.deleteMany()
          await tx.passwordResetToken.deleteMany()
          await tx.teacher.deleteMany()
        }
        break
      }
      case 'teams':
        await tx.team.deleteMany()
        break
      case 'providers':
        await tx.provider.deleteMany()
        break
      case 'providerTemplates':
        await tx.providerTemplate.deleteMany()
        break
      case 'featureMappings':
        await tx.featureMapping.deleteMany()
        break
    }
  }
}
```

**Step 2: TypeScript 컴파일 확인**

Run: `npx tsc --noEmit src/lib/db/seed/reset.ts 2>&1 | head -20`
Expected: 에러 없음 (또는 import 관련 경고만)

**Step 3: Commit**

```bash
git add src/lib/db/seed/reset.ts
git commit -m "refactor: 시드 리셋 로직을 reset.ts로 분리"
```

---

### Task 3: images.ts 분리 — Cloudinary 이미지 업로드 추출

**Files:**
- Create: `src/lib/db/seed/images.ts`

**Step 1: Create images.ts**

`src/lib/db/seed/images.ts` — core.ts의 `uploadSeedImages` 함수를 그대로 이동:

```typescript
/**
 * 시드 이미지 업로드 (Cloudinary)
 *
 * 트랜잭션 밖에서 실행됩니다 — 외부 API는 DB 롤백 불가능하므로 의도적 분리.
 */

import type { PrismaClient } from "@prisma/client"
import path from "path"
import fs from "fs"
import type { SeedTeacher, SeedStudent } from "./data"
import type { SeedGroup, SeedDataSet } from "./constants"
import {
  SEED_TEACHERS,
  SEED_STUDENTS,
} from "./data"

export async function uploadSeedImages(
  prisma: PrismaClient,
  groups: SeedGroup[],
  dataOverride?: Partial<SeedDataSet>,
): Promise<void> {
  // Cloudinary 설정 확인 — 미설정이면 건너뜀
  let cloudinary: typeof import("cloudinary").v2
  let buildResizedImageUrl: (publicId: string) => string
  try {
    const mod = await import("@/lib/cloudinary")
    if (!mod.isCloudinaryConfigured) {
      console.log("[seed] Cloudinary 미설정 — 이미지 업로드를 건너뜁니다")
      return
    }
    cloudinary = mod.cloudinary
    buildResizedImageUrl = mod.buildResizedImageUrl
  } catch {
    console.log("[seed] Cloudinary 모듈 로드 실패 — 이미지 업로드를 건너뜁니다")
    return
  }

  const projectRoot = process.cwd()
  const teachers = (dataOverride?.teachers ?? SEED_TEACHERS) as SeedTeacher[]
  const students = (dataOverride?.students ?? SEED_STUDENTS) as SeedStudent[]

  // ── 선생님 프로필 이미지 ──
  if (groups.includes("teachers")) {
    for (const teacher of teachers) {
      if (!teacher.imagePath) continue

      const absPath = path.resolve(projectRoot, teacher.imagePath)
      if (!fs.existsSync(absPath)) {
        console.warn(`[seed] 이미지 파일 없음: ${absPath}`)
        continue
      }

      const dbTeacher = await prisma.teacher.findUnique({
        where: { email: teacher.email },
        select: { id: true, profileImage: true },
      })
      if (!dbTeacher || dbTeacher.profileImage) continue

      try {
        const publicId = `afterschool/teachers/${teacher.email.split("@")[0]}`
        const uploadResult = await cloudinary.uploader.upload(absPath, {
          public_id: publicId,
          folder: undefined,
          overwrite: true,
          transformation: [{ width: 512, height: 512, crop: "fill", gravity: "auto" }],
        })

        await prisma.teacher.update({
          where: { id: dbTeacher.id },
          data: {
            profileImage: uploadResult.secure_url,
            profileImagePublicId: uploadResult.public_id,
          },
        })
        console.log(`[seed] 선생님 이미지 업로드: ${teacher.name}`)
      } catch (err) {
        console.error(`[seed] 선생님 이미지 업로드 실패 (${teacher.name}):`, err)
      }
    }
  }

  // ── 학생 프로필 이미지 ──
  if (groups.includes("students")) {
    for (const student of students) {
      if (!student.imagePath) continue

      const absPath = path.resolve(projectRoot, student.imagePath)
      if (!fs.existsSync(absPath)) {
        console.warn(`[seed] 이미지 파일 없음: ${absPath}`)
        continue
      }

      const birthDate = new Date(student.birthDate)
      const dbStudent = await prisma.student.findFirst({
        where: { name: student.name, birthDate },
        select: { id: true },
      })
      if (!dbStudent) continue

      const existingImage = await prisma.studentImage.findUnique({
        where: { studentId_type: { studentId: dbStudent.id, type: "profile" } },
      })
      if (existingImage) continue

      try {
        const safeName = student.name.replace(/\s/g, "_")
        const publicId = `afterschool/students/${safeName}_profile`
        const uploadResult = await cloudinary.uploader.upload(absPath, {
          public_id: publicId,
          folder: undefined,
          overwrite: true,
        })

        const resizedUrl = buildResizedImageUrl(uploadResult.public_id)

        await prisma.studentImage.create({
          data: {
            studentId: dbStudent.id,
            type: "profile",
            originalUrl: uploadResult.secure_url,
            resizedUrl,
            publicId: uploadResult.public_id,
            format: uploadResult.format,
            bytes: uploadResult.bytes,
            width: uploadResult.width,
            height: uploadResult.height,
          },
        })
        console.log(`[seed] 학생 이미지 업로드: ${student.name}`)
      } catch (err) {
        console.error(`[seed] 학생 이미지 업로드 실패 (${student.name}):`, err)
      }
    }
  }
}
```

**Step 2: Commit**

```bash
git add src/lib/db/seed/images.ts
git commit -m "refactor: Cloudinary 이미지 업로드 로직을 images.ts로 분리"
```

---

### Task 4: core.ts 리팩토링 — 오케스트레이터 + seeder 함수

**Files:**
- Modify: `src/lib/db/seed/core.ts` (전체 재작성)

**Step 1: Rewrite core.ts**

`src/lib/db/seed/core.ts` 전체를 다음으로 교체:

```typescript
/**
 * 시드 실행 핵심 로직 (CLI + 서버 액션 공용)
 *
 * 실행 순서: 팀 → 선생님 → 학생 → 학부모 → Provider → ProviderTemplate → FeatureMapping
 * 멱등성: upsert 패턴으로 여러 번 실행해도 안전합니다.
 */

import type { Prisma, PrismaClient } from "@prisma/client"
import argon2 from "argon2"
import {
  SEED_TEAMS,
  SEED_TEACHERS,
  SEED_STUDENTS,
  SEED_PARENTS,
  SEED_PROVIDERS,
} from "./data"
import {
  DEFAULT_SEED_GROUPS,
  SEED_GROUP_DEPENDENCIES,
  type SeedGroup,
  type SeedOptions,
  type SeedResult,
  type SeedModelResult,
  type SeedDataSet,
} from "./constants"
import { executeReset } from "./reset"
import { uploadSeedImages } from "./images"

// ---------------------------------------------------------------------------
// 메인 함수
// ---------------------------------------------------------------------------

export async function runSeed(prisma: PrismaClient, options?: SeedOptions): Promise<SeedResult> {
  const groups = options?.groups ?? DEFAULT_SEED_GROUPS
  const modes = options?.modes ?? {}
  const excludeTeacherId = options?.excludeTeacherId
  const data: SeedDataSet = {
    teams: options?.dataOverride?.teams ?? SEED_TEAMS,
    teachers: options?.dataOverride?.teachers ?? SEED_TEACHERS,
    students: options?.dataOverride?.students ?? SEED_STUDENTS,
    parents: options?.dataOverride?.parents ?? SEED_PARENTS,
    providers: options?.dataOverride?.providers ?? SEED_PROVIDERS,
  }

  // 리셋 그룹 + 의존성 자동 확장
  const resetGroups = new Set(groups.filter((g) => modes[g] === 'reset'))
  for (const group of [...resetGroups]) {
    for (const dep of SEED_GROUP_DEPENDENCIES[group]) {
      resetGroups.add(dep)
    }
  }

  const txResult = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const r = initResult()

    // 0. 리셋
    await executeReset(tx, groups, resetGroups, excludeTeacherId)

    // 1~5. 그룹별 seeder
    if (groups.includes('teams'))       r.teams = await seedTeams(tx, data)
    if (groups.includes('teachers'))    r.teachers = await seedTeachers(tx, data)
    if (groups.includes('students'))    r.students = await seedStudents(tx, data)
    if (groups.includes('parents'))     r.parents = await seedParents(tx, data)
    if (groups.includes('providers'))   r.providers = await seedProviders(tx, data)

    // 6~7. 부가 시드
    if (groups.includes('providerTemplates')) r.providerTemplates = await seedProviderTemplates(tx)
    if (groups.includes('featureMappings'))   r.featureMappings = await seedFeatureMappings(tx)

    return r
  }, { timeout: 30000 })

  // 이미지 업로드 (트랜잭션 밖 — Cloudinary 외부 API)
  await uploadSeedImages(prisma, groups, options?.dataOverride)

  return txResult
}

// ---------------------------------------------------------------------------
// 결과 초기화
// ---------------------------------------------------------------------------

function initResult(): SeedResult {
  const zero = (): SeedModelResult => ({ created: 0, updated: 0 })
  return {
    teams: zero(), teachers: zero(), students: zero(),
    parents: zero(), providers: zero(),
    providerTemplates: zero(), featureMappings: zero(),
  }
}

// ---------------------------------------------------------------------------
// 개별 seeder 함수
// ---------------------------------------------------------------------------

async function seedTeams(
  tx: Prisma.TransactionClient,
  data: SeedDataSet,
): Promise<SeedModelResult> {
  const result: SeedModelResult = { created: 0, updated: 0 }
  for (const team of data.teams) {
    const existing = await tx.team.findUnique({ where: { name: team.name } })
    if (existing) {
      result.updated++
    } else {
      await tx.team.create({ data: { name: team.name } })
      result.created++
    }
  }
  return result
}

async function seedTeachers(
  tx: Prisma.TransactionClient,
  data: SeedDataSet,
): Promise<SeedModelResult> {
  const result: SeedModelResult = { created: 0, updated: 0 }
  const allTeams = await tx.team.findMany()
  const teamMap = new Map(allTeams.map((t) => [t.name, t.id]))

  for (const teacher of data.teachers) {
    const existing = await tx.teacher.findUnique({ where: { email: teacher.email } })
    const teamId = teacher.teamName ? teamMap.get(teacher.teamName) ?? null : null

    if (existing) {
      await tx.teacher.update({
        where: { email: teacher.email },
        data: {
          name: teacher.name,
          phone: teacher.phone,
          role: teacher.role,
          teamId,
          birthDate: teacher.birthDate ? new Date(teacher.birthDate) : null,
          birthTimeHour: teacher.birthTimeHour,
          birthTimeMinute: teacher.birthTimeMinute,
          nameHanja: teacher.nameHanja ?? undefined,
        },
      })
      result.updated++
    } else {
      const hashedPassword = await argon2.hash(teacher.password)
      await tx.teacher.create({
        data: {
          email: teacher.email,
          password: hashedPassword,
          name: teacher.name,
          phone: teacher.phone,
          role: teacher.role,
          teamId,
          birthDate: teacher.birthDate ? new Date(teacher.birthDate) : null,
          birthTimeHour: teacher.birthTimeHour,
          birthTimeMinute: teacher.birthTimeMinute,
          nameHanja: teacher.nameHanja ?? undefined,
        },
      })
      result.created++
    }
  }
  return result
}

async function seedStudents(
  tx: Prisma.TransactionClient,
  data: SeedDataSet,
): Promise<SeedModelResult> {
  const result: SeedModelResult = { created: 0, updated: 0 }
  const allTeachers = await tx.teacher.findMany({ select: { id: true, email: true } })
  const teacherMap = new Map(allTeachers.map((t) => [t.email, t.id]))
  const allTeams = await tx.team.findMany()
  const teamMap = new Map(allTeams.map((t) => [t.name, t.id]))

  for (const student of data.students) {
    const teacherId = teacherMap.get(student.teacherEmail) ?? null
    const teamId = teamMap.get(student.teamName) ?? null
    const birthDate = new Date(student.birthDate)

    const existing = await tx.student.findFirst({
      where: { name: student.name, birthDate },
    })

    if (existing) {
      await tx.student.update({
        where: { id: existing.id },
        data: {
          school: student.school,
          grade: student.grade,
          birthTimeHour: student.birthTimeHour,
          birthTimeMinute: student.birthTimeMinute,
          nameHanja: student.nameHanja ?? undefined,
          phone: student.phone,
          ...(teacherId && { teacherId }),
          ...(teamId && { teamId }),
        },
      })
      result.updated++
    } else {
      if (!teacherId) continue
      await tx.student.create({
        data: {
          name: student.name,
          school: student.school,
          grade: student.grade,
          birthDate,
          birthTimeHour: student.birthTimeHour,
          birthTimeMinute: student.birthTimeMinute,
          nameHanja: student.nameHanja ?? undefined,
          phone: student.phone,
          teacherId,
          teamId,
        },
      })
      result.created++
    }
  }
  return result
}

async function seedParents(
  tx: Prisma.TransactionClient,
  data: SeedDataSet,
): Promise<SeedModelResult> {
  const result: SeedModelResult = { created: 0, updated: 0 }
  const allStudents = await tx.student.findMany({ select: { id: true, name: true } })
  const studentMap = new Map(allStudents.map((s) => [s.name, s.id]))

  for (const parent of data.parents) {
    const studentId = studentMap.get(parent.studentName)
    if (!studentId) continue

    const existing = await tx.parent.findFirst({
      where: { studentId, name: parent.name },
    })

    if (existing) {
      await tx.parent.update({
        where: { id: existing.id },
        data: { name: parent.name, phone: parent.phone, relation: parent.relation },
      })
      result.updated++
    } else {
      await tx.parent.create({
        data: {
          name: parent.name,
          phone: parent.phone,
          relation: parent.relation,
          student: { connect: { id: studentId } },
        },
      })
      result.created++
    }
  }
  return result
}

async function seedProviders(
  tx: Prisma.TransactionClient,
  data: SeedDataSet,
): Promise<SeedModelResult> {
  const result: SeedModelResult = { created: 0, updated: 0 }

  for (const provider of data.providers) {
    const existing = await tx.provider.findFirst({
      where: { providerType: provider.providerType, name: provider.name },
    })

    if (existing) {
      await tx.provider.update({
        where: { id: existing.id },
        data: {
          baseUrl: provider.baseUrl,
          authType: provider.authType,
          capabilities: provider.capabilities,
          costTier: provider.costTier,
          qualityTier: provider.qualityTier,
        },
      })
      result.updated++
    } else {
      await tx.provider.create({
        data: {
          name: provider.name,
          providerType: provider.providerType,
          baseUrl: provider.baseUrl,
          authType: provider.authType,
          capabilities: provider.capabilities,
          costTier: provider.costTier,
          qualityTier: provider.qualityTier,
        },
      })
      result.created++
    }
  }
  return result
}

// ---------------------------------------------------------------------------
// 부가 시드: Provider Templates
// ---------------------------------------------------------------------------

async function seedProviderTemplates(
  tx: Prisma.TransactionClient,
): Promise<SeedModelResult> {
  const result: SeedModelResult = { created: 0, updated: 0 }

  let templates: Array<{
    templateId: string; name: string; providerType: string
    description: string; defaultBaseUrl: string | null
    defaultAuthType: string; defaultCapabilities: string[]
    helpUrl: string | null; isPopular: boolean; sortOrder: number
  }>
  try {
    const mod = await import("@/lib/ai/templates")
    templates = mod.getProviderTemplates()
  } catch {
    console.log("[seed] Provider 템플릿 모듈 로드 실패 — 건너뜁니다")
    return result
  }

  for (const tpl of templates) {
    const existing = await tx.providerTemplate.findUnique({
      where: { templateId: tpl.templateId },
    })

    if (existing) {
      await tx.providerTemplate.update({
        where: { templateId: tpl.templateId },
        data: {
          name: tpl.name,
          providerType: tpl.providerType,
          description: tpl.description,
          defaultBaseUrl: tpl.defaultBaseUrl,
          defaultAuthType: tpl.defaultAuthType,
          defaultCapabilities: tpl.defaultCapabilities,
          helpUrl: tpl.helpUrl,
          isPopular: tpl.isPopular,
          sortOrder: tpl.sortOrder,
        },
      })
      result.updated++
    } else {
      await tx.providerTemplate.create({
        data: {
          templateId: tpl.templateId,
          name: tpl.name,
          providerType: tpl.providerType,
          description: tpl.description,
          defaultBaseUrl: tpl.defaultBaseUrl,
          defaultAuthType: tpl.defaultAuthType,
          defaultCapabilities: tpl.defaultCapabilities,
          helpUrl: tpl.helpUrl,
          isPopular: tpl.isPopular,
          sortOrder: tpl.sortOrder,
        },
      })
      result.created++
    }
  }
  return result
}

// ---------------------------------------------------------------------------
// 부가 시드: Feature Mappings
// ---------------------------------------------------------------------------

async function seedFeatureMappings(
  tx: Prisma.TransactionClient,
): Promise<SeedModelResult> {
  const result: SeedModelResult = { created: 0, updated: 0 }

  let seedFn: (db: Prisma.TransactionClient) => Promise<number>
  try {
    const mod = await import("./feature-mappings")
    // feature-mappings.ts에서 트랜잭션 클라이언트를 받는 함수를 가져옴
    seedFn = mod.seedFeatureMappingsWithTx ?? mod.seedFeatureMappings
  } catch {
    console.log("[seed] Feature Mapping 모듈 로드 실패 — 건너뜁니다")
    return result
  }

  const created = await seedFn(tx as unknown as Prisma.TransactionClient)
  result.created = created
  return result
}
```

**Step 2: TypeScript 빌드 확인**

Run: `npx tsc --noEmit 2>&1 | head -30`
Expected: 에러 없음

**Step 3: Commit**

```bash
git add src/lib/db/seed/core.ts
git commit -m "refactor: core.ts를 오케스트레이터 + 개별 seeder 함수로 분리"
```

---

### Task 5: index.ts 생성 — public API 정리 + re-export 제거

**Files:**
- Create: `src/lib/db/seed/index.ts`

**Step 1: Create index.ts**

```typescript
/**
 * 시드 시스템 public API
 *
 * 서버 코드: import { runSeed } from "@/lib/db/seed"
 * 클라이언트: import { ALL_SEED_GROUPS } from "@/lib/db/seed/constants"
 *
 * 주의: 이 파일은 서버 전용입니다 (argon2 의존성).
 * 클라이언트에서는 constants.ts를 직접 import 하세요.
 */

// 서버 전용
export { runSeed } from "./core"

// 타입/상수 (constants.ts에서 re-export)
export {
  ALL_SEED_GROUPS,
  DEFAULT_SEED_GROUPS,
  SEED_GROUP_DEPENDENCIES,
  SEED_GROUP_LABELS,
  SEED_GROUP_COUNTS,
  type SeedGroup,
  type SeedMode,
  type SeedOptions,
  type SeedModelResult,
  type SeedResult,
  type SeedDataSet,
} from "./constants"
```

**Step 2: Commit**

```bash
git add src/lib/db/seed/index.ts
git commit -m "refactor: index.ts 추가로 시드 시스템 public API 정리"
```

---

### Task 6: 소비자 코드 import 경로 수정

**Files:**
- Modify: `scripts/seed-demo.ts` (깨진 import 수정)
- Modify: `src/app/[locale]/(dashboard)/admin/database/actions.ts`
- Modify: `tests/lib/db/seed-core.test.ts`
- Modify: `prisma/seed.ts`

**Step 1: Fix scripts/seed-demo.ts**

`scripts/seed-demo.ts` line 14-21의 import를 수정:

```typescript
// 변경 전:
import {
  runSeed,
  ALL_SEED_GROUPS,
  SEED_GROUP_LABELS,
  SEED_GROUP_DEPENDENCIES,
  type SeedGroup,
  type SeedMode,
} from "../src/lib/db/seed-core"

// 변경 후:
import {
  runSeed,
  ALL_SEED_GROUPS,
  SEED_GROUP_LABELS,
  SEED_GROUP_DEPENDENCIES,
  type SeedGroup,
  type SeedMode,
} from "../src/lib/db/seed/core"
```

참고: seed-demo.ts는 CLI 스크립트이므로 상대 경로(`../src/lib/db/seed/core`)를 사용해야 합니다. `@/` alias는 tsx 직접 실행 시 사용 불가할 수 있습니다.

**Step 2: Fix actions.ts**

`src/app/[locale]/(dashboard)/admin/database/actions.ts` line 7:

```typescript
// 변경 전:
import { runSeed, type SeedResult, type SeedOptions } from "@/lib/db/seed/core"

// 변경 후:
import { runSeed, type SeedResult, type SeedOptions } from "@/lib/db/seed"
```

**Step 3: Fix seed-core.test.ts**

`tests/lib/db/seed-core.test.ts` line 2-8:

```typescript
// 변경 전:
import {
  ALL_SEED_GROUPS,
  ...
} from '@/lib/db/seed/core'

// 변경 후:
import {
  ALL_SEED_GROUPS,
  DEFAULT_SEED_GROUPS,
  ...
} from '@/lib/db/seed/constants'
```

(이미 Task 1에서 수정됨 — 여기서는 확인만)

**Step 4: Fix prisma/seed.ts**

`prisma/seed.ts` line 5:

```typescript
// 변경 전:
import { runSeed } from "../src/lib/db/seed/core"

// 변경 후 (그대로 유지 — 이미 올바른 경로):
import { runSeed } from "../src/lib/db/seed/core"
```

변경 불필요.

**Step 5: Run tests**

Run: `npx vitest run tests/lib/db/seed-core.test.ts`
Expected: PASS

**Step 6: TypeScript 빌드 확인**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: 에러 없음

**Step 7: Commit**

```bash
git add scripts/seed-demo.ts src/app/[locale]/(dashboard)/admin/database/actions.ts
git commit -m "fix: 시드 시스템 import 경로 수정 (seed-core → seed/core)"
```

---

### Task 7: data-test.ts 생성 + seed-test.ts 통합

**Files:**
- Create: `src/lib/db/seed/data-test.ts`
- Modify: `prisma/seed.ts` (--preset 옵션 지원)
- Delete: `prisma/seed-test.ts`
- Modify: `package.json` (db:seed:test 스크립트 변경)

**Step 1: Create data-test.ts**

`src/lib/db/seed/data-test.ts`:

```typescript
/**
 * 테스트 전용 시드 데이터 (E2E 테스트용)
 *
 * 고정 ID를 사용하여 E2E 테스트에서 예측 가능한 데이터를 보장합니다.
 * data.ts와 동일한 타입 구조를 사용합니다.
 */

import type { SeedTeacher, SeedStudent, SeedParent } from "./data"
import type { SeedDataSet } from "./constants"

const TEST_TEACHERS: SeedTeacher[] = [
  {
    email: "teacher1@test.com",
    name: "김선생",
    password: "test1234",
    phone: "010-1111-1111",
    role: "TEACHER",
    teamName: null,
    birthDate: "1985-03-15",
    birthTimeHour: 14,
    birthTimeMinute: 30,
    nameHanja: null,
    imagePath: null,
  },
  {
    email: "teacher2@test.com",
    name: "이선생",
    password: "test1234",
    phone: "010-2222-2222",
    role: "TEACHER",
    teamName: null,
    birthDate: "1988-07-20",
    birthTimeHour: 9,
    birthTimeMinute: 15,
    nameHanja: null,
    imagePath: null,
  },
  {
    email: "admin@test.com",
    name: "관리자",
    password: "test1234",
    phone: "010-9999-9999",
    role: "DIRECTOR",
    teamName: null,
    birthDate: "1980-01-01",
    birthTimeHour: 12,
    birthTimeMinute: 0,
    nameHanja: null,
    imagePath: null,
  },
]

const TEST_STUDENTS: SeedStudent[] = [
  {
    name: "홍길동",
    school: "테스트고등학교",
    grade: 1,
    birthDate: "2008-05-10",
    birthTimeHour: 8,
    birthTimeMinute: 30,
    nameHanja: null,
    phone: "010-1000-0001",
    teacherEmail: "teacher1@test.com",
    teamName: "",
    imagePath: null,
  },
  {
    name: "김영희",
    school: "테스트고등학교",
    grade: 2,
    birthDate: "2007-08-22",
    birthTimeHour: 15,
    birthTimeMinute: 45,
    nameHanja: null,
    phone: "010-1000-0002",
    teacherEmail: "teacher1@test.com",
    teamName: "",
    imagePath: null,
  },
  {
    name: "박철수",
    school: "테스트고등학교",
    grade: 3,
    birthDate: "2006-12-03",
    birthTimeHour: 11,
    birthTimeMinute: 20,
    nameHanja: null,
    phone: "010-1000-0003",
    teacherEmail: "teacher2@test.com",
    teamName: "",
    imagePath: null,
  },
  {
    name: "이민지",
    school: "테스트중학교",
    grade: 3,
    birthDate: "2009-03-18",
    birthTimeHour: 16,
    birthTimeMinute: 0,
    nameHanja: null,
    phone: "010-1000-0004",
    teacherEmail: "teacher2@test.com",
    teamName: "",
    imagePath: null,
  },
  {
    name: "최준호",
    school: "테스트고등학교",
    grade: 1,
    birthDate: "2008-09-25",
    birthTimeHour: 10,
    birthTimeMinute: 10,
    nameHanja: null,
    phone: "010-1000-0005",
    teacherEmail: "teacher1@test.com",
    teamName: "",
    imagePath: null,
  },
]

const TEST_PARENTS: SeedParent[] = [
  { name: "홍아버지", phone: "010-2000-0001", relation: "FATHER", studentName: "홍길동" },
  { name: "김어머니", phone: "010-2000-0002", relation: "MOTHER", studentName: "김영희" },
]

export const TEST_SEED_DATA: Partial<SeedDataSet> = {
  teams: [],
  teachers: TEST_TEACHERS,
  students: TEST_STUDENTS,
  parents: TEST_PARENTS,
  providers: [],
}
```

**Step 2: Modify prisma/seed.ts to support --preset**

`prisma/seed.ts` 전체를 다음으로 교체:

```typescript
import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { runSeed } from "../src/lib/db/seed/core"
import type { SeedOptions } from "../src/lib/db/seed/constants"

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set")
}
const pool = new Pool({ connectionString: databaseUrl })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// --preset 인자 처리
const preset = process.argv.includes("--preset")
  ? process.argv[process.argv.indexOf("--preset") + 1]
  : undefined

async function main() {
  let options: SeedOptions | undefined

  if (preset === "test") {
    const { TEST_SEED_DATA } = await import("../src/lib/db/seed/data-test")
    // 테스트 프리셋: 전체 리셋 후 테스트 데이터로 시드
    options = {
      groups: ['teams', 'teachers', 'students', 'parents'],
      modes: { teams: 'reset', teachers: 'reset', students: 'reset', parents: 'reset' },
      dataOverride: TEST_SEED_DATA,
    }
    console.log("테스트 시드 데이터 로드를 시작합니다...")
  } else {
    console.log("시드 데이터 로드를 시작합니다...")
  }

  const result = await runSeed(prisma, options)

  console.log("\n=== 시드 결과 ===")
  for (const [model, counts] of Object.entries(result)) {
    const { created, updated } = counts as { created: number; updated: number }
    if (created > 0 || updated > 0) {
      console.log(`  ${model}: 생성 ${created}건, 갱신 ${updated}건`)
    }
  }

  if (preset === "test") {
    console.log("\n🔑 테스트 계정:")
    console.log("   Admin: admin@test.com / test1234")
    console.log("   Teacher 1: teacher1@test.com / test1234")
    console.log("   Teacher 2: teacher2@test.com / test1234")
  }

  console.log("\n시드 완료!")
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
```

**Step 3: Update package.json**

`package.json`의 `db:seed:test` 스크립트 변경:

```json
"db:seed:test": "tsx prisma/seed.ts --preset test"
```

**Step 4: Delete prisma/seed-test.ts**

```bash
git rm prisma/seed-test.ts
```

**Step 5: Run test preset**

실행하지 않음 (DB 필요) — 문법 확인만:
Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: 에러 없음

**Step 6: Commit**

```bash
git add src/lib/db/seed/data-test.ts prisma/seed.ts package.json
git commit -m "refactor: seed-test.ts를 data-test.ts + runSeed(preset)로 통합"
```

---

### Task 8: feature-mappings.ts 리팩토링 — 트랜잭션 클라이언트 지원

**Files:**
- Modify: `src/lib/db/seed/feature-mappings.ts`

**Step 1: Add transaction client support**

`src/lib/db/seed/feature-mappings.ts`의 `seedFeatureMappings` 함수에 Prisma.TransactionClient도 받을 수 있도록 시그니처 확장. 기존 `PrismaClient` 타입도 유지하여 독립 실행 호환성 보존.

파일 상단 import와 함수 시그니처만 수정:

```typescript
import { PrismaClient, Prisma } from '@prisma/client';
```

`seedFeatureMappings` 함수의 파라미터 타입 변경 (line 243):

```typescript
// 변경 전:
export async function seedFeatureMappings(db: PrismaClient): Promise<number> {

// 변경 후:
export async function seedFeatureMappings(db: PrismaClient | Prisma.TransactionClient): Promise<number> {
```

`resetFeatureMappings`도 동일하게 (line 299):

```typescript
export async function resetFeatureMappings(
  db: PrismaClient | Prisma.TransactionClient,
  featureType: string
): Promise<number> {
```

`clearAllFeatureMappings`도 동일하게 (line 343):

```typescript
export async function clearAllFeatureMappings(db: PrismaClient | Prisma.TransactionClient): Promise<number> {
```

**Step 2: Commit**

```bash
git add src/lib/db/seed/feature-mappings.ts
git commit -m "refactor: feature-mappings에 TransactionClient 지원 추가"
```

---

### Task 9: provider-templates.ts 독립 PrismaClient 제거

**Files:**
- Modify: `src/lib/db/seed/provider-templates.ts`

**Step 1: Remove standalone PrismaClient**

provider-templates.ts는 이제 core.ts에서 트랜잭션을 통해 호출되므로, 독립 PrismaClient 인스턴스를 제거하고 export만 유지. CLI 직접 실행 기능은 유지하되 인스턴스는 main() 내부로 이동.

`src/lib/db/seed/provider-templates.ts` 수정:

```typescript
// 변경 전 (line 16):
const prisma = new PrismaClient();

// 삭제 (line 16 제거)
```

`seedProviderTemplates` 함수에 `PrismaClient | TransactionClient` 파라미터 추가:

```typescript
import { PrismaClient, Prisma } from '@prisma/client';
import { getProviderTemplates } from '../../ai/templates';

export async function seedProviderTemplates(
  db: PrismaClient | Prisma.TransactionClient,
): Promise<void> {
  // 기존 로직에서 prisma → db로 변경
  const templates = getProviderTemplates();
  // ...
  for (const template of templates) {
    await db.providerTemplate.upsert({
      where: { templateId: template.templateId },
      // ...
    });
  }
}

// CLI 직접 실행 시
async function main(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    await seedProviderTemplates(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
```

**Step 2: Commit**

```bash
git add src/lib/db/seed/provider-templates.ts
git commit -m "refactor: provider-templates에서 독립 PrismaClient 제거"
```

---

### Task 10: 최종 검증 — 전체 테스트 + 빌드

**Files:** (변경 없음 — 검증만)

**Step 1: 유닛 테스트 실행**

Run: `npx vitest run`
Expected: 전체 PASS

**Step 2: TypeScript 빌드**

Run: `npx tsc --noEmit`
Expected: 에러 없음

**Step 3: Next.js 빌드**

Run: `pnpm build 2>&1 | tail -20`
Expected: 빌드 성공

**Step 4: 삭제된 파일의 참조가 남아있지 않은지 확인**

Run: `grep -r "seed-test" prisma/ scripts/ src/ --include="*.ts" --include="*.tsx"`
Expected: 결과 없음 (seed-test.ts 참조 제거 확인)

Run: `grep -r "seed-core" scripts/ src/ tests/ --include="*.ts"`
Expected: 결과 없음 (seed-core 레거시 경로 제거 확인)

**Step 5: Final commit**

```bash
git add -A
git commit -m "refactor: 시드 시스템 리팩토링 완료 — 파일 분리, import 정리, 테스트 통합"
```
