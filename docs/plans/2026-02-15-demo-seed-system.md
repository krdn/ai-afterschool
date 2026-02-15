# 데모 시드 데이터 시스템 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 운영 환경에서 모델별로 데이터를 선택적 리셋/추가할 수 있는 시드 시스템 구현

**Architecture:** 기존 `seed-core.ts`에 `SeedOptions` 파라미터를 추가하여 그룹 선택 + merge/reset 모드 지원. 웹 UI(DatabaseTab AlertDialog 확장)와 CLI(scripts/seed-demo.ts) 양쪽에서 동일한 코어 로직 호출.

**Tech Stack:** Next.js 15, Prisma, PostgreSQL, argon2, vitest, shadcn/ui

**Design Doc:** `docs/plans/2026-02-15-demo-seed-system-design.md`

---

### Task 1: seed-core.ts 타입 및 옵션 확장

**Files:**
- Modify: `src/lib/db/seed-core.ts`

**Step 1: SeedOptions 타입 추가**

`seed-core.ts` 파일 상단, `SeedModelResult` 타입 위에 추가:

```typescript
// ---------------------------------------------------------------------------
// 시드 옵션 타입
// ---------------------------------------------------------------------------

export type SeedGroup = 'teams' | 'teachers' | 'students' | 'parents' | 'llmConfigs' | 'providers'
export type SeedMode = 'merge' | 'reset'

export type SeedOptions = {
  groups?: SeedGroup[]
  modes?: Partial<Record<SeedGroup, SeedMode>>
}

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
  teams: 3,
  teachers: 10,
  students: 8,
  parents: 9,
  llmConfigs: 6,
  providers: 7,
}
```

**Step 2: runSeed 시그니처 변경**

`runSeed` 함수 시그니처를 변경:

```typescript
export async function runSeed(
  prisma: PrismaClient,
  options?: SeedOptions
): Promise<SeedResult> {
  const groups = options?.groups ?? ALL_SEED_GROUPS
  const modes = options?.modes ?? {}

  // 옵션에서 리셋 모드인 그룹 확인
  const resetGroups = new Set(
    groups.filter((g) => modes[g] === 'reset')
  )

  // 의존성 자동 확장: 리셋 그룹의 하위 의존도 리셋에 포함
  for (const group of [...resetGroups]) {
    for (const dep of SEED_GROUP_DEPENDENCIES[group]) {
      resetGroups.add(dep)
    }
  }
```

**Step 3: 리셋 로직 추가 (트랜잭션 내)**

`runSeed` 함수 내부, 시드 실행 전에 리셋 처리. 전체를 `prisma.$transaction`으로 감싸기:

```typescript
  const result: SeedResult = {
    teams: { created: 0, updated: 0 },
    teachers: { created: 0, updated: 0 },
    students: { created: 0, updated: 0 },
    parents: { created: 0, updated: 0 },
    llmConfigs: { created: 0, updated: 0 },
    providers: { created: 0, updated: 0 },
  }

  // 트랜잭션으로 감싸서 중간 실패 시 롤백
  await prisma.$transaction(async (tx) => {
    // ── 리셋 단계 (FK 의존 역순으로 삭제) ──
    const deleteOrder: SeedGroup[] = ['parents', 'students', 'teachers', 'teams', 'llmConfigs', 'providers']
    for (const group of deleteOrder) {
      if (!resetGroups.has(group) || !groups.includes(group)) continue
      switch (group) {
        case 'parents':
          await tx.parent.deleteMany()
          break
        case 'students':
          await tx.student.deleteMany()
          break
        case 'teachers':
          // cascade로 관련 분석 데이터도 삭제됨
          await tx.teacher.deleteMany()
          break
        case 'teams':
          await tx.team.deleteMany()
          break
        case 'llmConfigs':
          await tx.lLMConfig.deleteMany()
          break
        case 'providers':
          await tx.provider.deleteMany()
          break
      }
    }

    // ── 시드 추가 단계 (기존 로직, tx 사용) ──
    // 각 그룹별로 groups에 포함된 것만 실행
    // (기존 코드를 그룹 필터로 감싸기)

    if (groups.includes('teams')) {
      // 기존 팀 시드 로직 (prisma → tx로 교체)
    }
    if (groups.includes('teachers')) {
      // 기존 선생님 시드 로직
    }
    // ... 나머지 그룹도 동일
  })

  return result
```

**핵심**: 기존 `prisma` 호출을 모두 `tx`로 교체. 각 그룹을 `if (groups.includes(...))` 로 감싸기.

**Step 4: 커밋**

```bash
git add src/lib/db/seed-core.ts
git commit -m "feat: seed-core에 SeedOptions 지원 추가 (그룹 선택, merge/reset 모드)"
```

---

### Task 2: seed-core.ts 유닛 테스트

**Files:**
- Create: `tests/lib/db/seed-core.test.ts`

**Step 1: 테스트 파일 작성**

```typescript
import { describe, it, expect } from 'vitest'
import {
  ALL_SEED_GROUPS,
  SEED_GROUP_DEPENDENCIES,
  SEED_GROUP_LABELS,
  SEED_GROUP_COUNTS,
  type SeedGroup,
  type SeedOptions,
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

  it('모든 그룹에 시드 데이터 건수가 있다', () => {
    for (const group of ALL_SEED_GROUPS) {
      expect(SEED_GROUP_COUNTS[group]).toBeGreaterThan(0)
    }
  })
})
```

**Step 2: 테스트 실행**

Run: `npx vitest run tests/lib/db/seed-core.test.ts`
Expected: 6 tests PASS

**Step 3: 커밋**

```bash
git add tests/lib/db/seed-core.test.ts
git commit -m "test: seed-core 타입 및 상수 유닛 테스트 추가"
```

---

### Task 3: Server Action 확장 (비밀번호 검증)

**Files:**
- Modify: `src/app/(dashboard)/admin/database/actions.ts`

**Step 1: 비밀번호 검증 로직 추가**

기존 `runSeedAction` 을 수정하고 새로운 `runDemoSeedAction` 추가:

```typescript
import argon2 from "argon2"
import type { SeedOptions, SeedResult } from "@/lib/db/seed-core"
import { runSeed } from "@/lib/db/seed-core"

// 기존 runSeedAction은 그대로 유지 (하위 호환)

export async function runDemoSeedAction(
  options: SeedOptions,
  password: string
): Promise<ActionResult<SeedResult>> {
  try {
    const session = await requireDirector()

    // 비밀번호 검증
    const teacher = await db.teacher.findUnique({
      where: { id: session.userId },
      select: { password: true },
    })

    if (!teacher) {
      return { success: false, error: "사용자를 찾을 수 없습니다" }
    }

    const passwordValid = await argon2.verify(teacher.password, password)
    if (!passwordValid) {
      return { success: false, error: "비밀번호가 올바르지 않습니다" }
    }

    // 시드 실행
    const result = await runSeed(db, options)

    // 감사 로그
    await logAuditAction({
      action: "DEMO_SEED_DATABASE",
      entityType: "SYSTEM",
      changes: {
        groups: options.groups,
        modes: options.modes,
        result,
      } as unknown as Record<string, unknown>,
    })

    await logSystemAction({
      level: "INFO",
      message: "데모 시드 데이터 실행 완료",
      context: {
        groups: options.groups,
        modes: options.modes,
        result,
      } as unknown as Record<string, unknown>,
    })

    revalidatePath("/admin")
    revalidatePath("/dashboard")
    return { success: true, data: result }
  } catch (error) {
    console.error("Failed to run demo seed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "데모 시드 실행 중 오류가 발생했어요",
    }
  }
}
```

**Step 2: 커밋**

```bash
git add src/app/(dashboard)/admin/database/actions.ts
git commit -m "feat: 데모 시드 Server Action 추가 (비밀번호 검증, SeedOptions 지원)"
```

---

### Task 4: DatabaseTab UI 확장

**Files:**
- Modify: `src/components/admin/tabs/database-tab.tsx`

**Step 1: 상태 관리 및 import 추가**

기존 import에 추가:

```typescript
import { runDemoSeedAction } from '@/app/(dashboard)/admin/database/actions'
import {
  ALL_SEED_GROUPS,
  SEED_GROUP_DEPENDENCIES,
  SEED_GROUP_LABELS,
  SEED_GROUP_COUNTS,
  type SeedGroup,
  type SeedMode,
} from '@/lib/db/seed-core'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { AlertTriangle, Eye, EyeOff } from 'lucide-react'
```

상태 추가:

```typescript
const [selectedGroups, setSelectedGroups] = useState<Set<SeedGroup>>(new Set(ALL_SEED_GROUPS))
const [modes, setModes] = useState<Record<SeedGroup, SeedMode>>(
  Object.fromEntries(ALL_SEED_GROUPS.map((g) => [g, 'merge'])) as Record<SeedGroup, SeedMode>
)
const [password, setPassword] = useState('')
const [showPassword, setShowPassword] = useState(false)
```

**Step 2: 그룹 체크박스 토글 함수 (의존성 처리)**

```typescript
function toggleGroup(group: SeedGroup, checked: boolean) {
  setSelectedGroups((prev) => {
    const next = new Set(prev)
    if (checked) {
      next.add(group)
    } else {
      next.delete(group)
    }
    return next
  })
}

function toggleMode(group: SeedGroup, mode: SeedMode) {
  setModes((prev) => {
    const next = { ...prev, [group]: mode }
    // 리셋 선택 시 하위 의존 그룹도 자동 리셋
    if (mode === 'reset') {
      for (const dep of SEED_GROUP_DEPENDENCIES[group]) {
        next[dep] = 'reset'
      }
    }
    return next
  })
}

const hasReset = [...selectedGroups].some((g) => modes[g] === 'reset')
// 리셋에 의해 자동 강제된 그룹 계산
const forcedResetGroups = new Set<SeedGroup>()
for (const group of selectedGroups) {
  if (modes[group] === 'reset') {
    for (const dep of SEED_GROUP_DEPENDENCIES[group]) {
      forcedResetGroups.add(dep)
    }
  }
}
```

**Step 3: handleDemoSeed 함수**

```typescript
function handleDemoSeed() {
  if (!password) {
    toast.error('비밀번호를 입력해주세요')
    return
  }
  startTransition(async () => {
    const groups = [...selectedGroups]
    const modeMap = Object.fromEntries(
      groups.map((g) => [g, modes[g]])
    ) as Partial<Record<SeedGroup, SeedMode>>

    const result = await runDemoSeedAction({ groups, modes: modeMap }, password)
    setSeedDialogOpen(false)
    setPassword('')

    if (result.success) {
      const data = result.data
      const total = Object.values(data).reduce(
        (acc, v) => ({ created: acc.created + v.created, updated: acc.updated + v.updated }),
        { created: 0, updated: 0 }
      )
      toast.success(
        `시드 완료: ${total.created}건 생성, ${total.updated}건 갱신`,
        {
          description: Object.entries(data)
            .filter(([, v]) => v.created > 0 || v.updated > 0)
            .map(([k, v]) => `${k}: +${v.created} / ~${v.updated}`)
            .join(', '),
          duration: 8000,
        }
      )
    } else {
      toast.error(result.error)
    }
  })
}
```

**Step 4: AlertDialog 내용 교체**

기존 AlertDialog 내용을 교체:

```tsx
<AlertDialog open={seedDialogOpen} onOpenChange={(open) => {
  setSeedDialogOpen(open)
  if (!open) setPassword('')
}}>
  <AlertDialogContent className="max-w-lg">
    <AlertDialogHeader>
      <AlertDialogTitle>데모 데이터 관리</AlertDialogTitle>
      <AlertDialogDescription>
        시드 데이터를 선택적으로 로드합니다. 각 그룹별로 추가/갱신 또는 리셋 후 추가를 선택하세요.
      </AlertDialogDescription>
    </AlertDialogHeader>

    {/* 그룹 선택 + 모드 */}
    <div className="space-y-3 max-h-64 overflow-y-auto">
      {ALL_SEED_GROUPS.map((group) => (
        <div key={group} className="flex items-center gap-3 p-2 rounded border">
          <Checkbox
            id={`group-${group}`}
            checked={selectedGroups.has(group)}
            onCheckedChange={(checked) => toggleGroup(group, !!checked)}
          />
          <Label htmlFor={`group-${group}`} className="flex-1 text-sm">
            {SEED_GROUP_LABELS[group]} ({SEED_GROUP_COUNTS[group]}건)
          </Label>
          {selectedGroups.has(group) && (
            <RadioGroup
              value={modes[group]}
              onValueChange={(v) => toggleMode(group, v as SeedMode)}
              className="flex gap-2"
            >
              <div className="flex items-center gap-1">
                <RadioGroupItem value="merge" id={`${group}-merge`}
                  disabled={forcedResetGroups.has(group)}
                />
                <Label htmlFor={`${group}-merge`} className="text-xs">추가/갱신</Label>
              </div>
              <div className="flex items-center gap-1">
                <RadioGroupItem value="reset" id={`${group}-reset`} />
                <Label htmlFor={`${group}-reset`} className="text-xs text-red-600">리셋</Label>
              </div>
            </RadioGroup>
          )}
        </div>
      ))}
    </div>

    {/* 리셋 경고 */}
    {hasReset && (
      <div className="bg-red-50 border border-red-200 rounded p-3 flex gap-2">
        <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-red-700">
          리셋 선택된 그룹의 <strong>모든 기존 데이터가 삭제</strong>됩니다.
          관련 분석 결과, 상담 기록 등도 함께 삭제됩니다.
        </p>
      </div>
    )}

    {/* 비밀번호 입력 */}
    <div className="space-y-2">
      <Label htmlFor="admin-password">관리자 비밀번호</Label>
      <div className="relative">
        <Input
          id="admin-password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호를 입력하세요"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && password && selectedGroups.size > 0) {
              handleDemoSeed()
            }
          }}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>

    <AlertDialogFooter>
      <AlertDialogCancel>취소</AlertDialogCancel>
      <AlertDialogAction
        onClick={handleDemoSeed}
        disabled={isPending || selectedGroups.size === 0 || !password}
        className={hasReset ? 'bg-red-600 hover:bg-red-700' : ''}
      >
        {isPending ? '실행 중...' : hasReset ? '리셋 포함 실행' : '시드 실행'}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Step 5: 버튼 텍스트 변경**

기존 "시드 데이터 로드" 버튼 텍스트를 "데모 데이터 관리"로 변경. 설명도 업데이트:

```tsx
<h3>데모 데이터 관리</h3>
<p>데모/개발용 시드 데이터를 선택적으로 로드하거나 리셋합니다.</p>
<Button>데모 데이터 관리</Button>
```

**Step 6: 커밋**

```bash
git add src/components/admin/tabs/database-tab.tsx
git commit -m "feat: 데모 데이터 관리 UI 추가 (그룹 선택, merge/reset, 비밀번호 확인)"
```

---

### Task 5: CLI 스크립트

**Files:**
- Create: `scripts/seed-demo.ts`
- Modify: `package.json`

**Step 1: CLI 스크립트 작성**

```typescript
/**
 * 데모 시드 데이터 CLI
 *
 * 사용법:
 *   npx tsx scripts/seed-demo.ts                          # 전체 merge
 *   npx tsx scripts/seed-demo.ts --groups teams,students   # 특정 그룹
 *   npx tsx scripts/seed-demo.ts --reset students,parents --confirm  # 리셋
 */

import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import {
  runSeed,
  ALL_SEED_GROUPS,
  SEED_GROUP_LABELS,
  SEED_GROUP_DEPENDENCIES,
  type SeedGroup,
  type SeedMode,
} from "../src/lib/db/seed-core"

// CLI 인자 파싱
const args = process.argv.slice(2)

function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`)
  if (idx === -1) return undefined
  return args[idx + 1]
}

const hasFlag = (name: string) => args.includes(`--${name}`)

// 그룹 파싱
const groupsArg = getArg("groups")
const groups: SeedGroup[] = groupsArg
  ? (groupsArg.split(",") as SeedGroup[]).filter((g) => ALL_SEED_GROUPS.includes(g))
  : [...ALL_SEED_GROUPS]

// 리셋 그룹 파싱
const resetArg = getArg("reset")
const resetGroups = new Set<SeedGroup>(
  resetArg
    ? (resetArg.split(",") as SeedGroup[]).filter((g) => ALL_SEED_GROUPS.includes(g))
    : []
)

// 리셋 의존성 확장
for (const group of [...resetGroups]) {
  for (const dep of SEED_GROUP_DEPENDENCIES[group]) {
    resetGroups.add(dep)
  }
}

// 리셋 시 --confirm 필수
if (resetGroups.size > 0 && !hasFlag("confirm")) {
  console.error("\n⚠️  리셋 모드에는 --confirm 플래그가 필요합니다.")
  console.error("   삭제 대상:", [...resetGroups].map((g) => SEED_GROUP_LABELS[g]).join(", "))
  console.error(`\n   npx tsx scripts/seed-demo.ts --reset ${[...resetGroups].join(",")} --confirm\n`)
  process.exit(1)
}

// 모드 맵 구성
const modes: Partial<Record<SeedGroup, SeedMode>> = {}
for (const group of groups) {
  modes[group] = resetGroups.has(group) ? "reset" : "merge"
}

// 실행 정보 출력
console.log("\n=== 데모 시드 데이터 ===")
console.log("대상 그룹:")
for (const group of groups) {
  const mode = modes[group] === "reset" ? "🔴 리셋" : "🟢 추가/갱신"
  console.log(`  ${SEED_GROUP_LABELS[group]}: ${mode}`)
}
console.log("")

// DB 연결 및 실행
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set")
}

const pool = new Pool({ connectionString: databaseUrl })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const result = await runSeed(prisma, { groups, modes })

  console.log("=== 결과 ===")
  for (const [model, counts] of Object.entries(result)) {
    const { created, updated } = counts as { created: number; updated: number }
    if (created > 0 || updated > 0) {
      console.log(`  ${model}: 생성 ${created}건, 갱신 ${updated}건`)
    }
  }
  console.log("\n완료!")
}

main()
  .catch((error) => {
    console.error("시드 실행 실패:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
```

**Step 2: package.json에 스크립트 추가**

`package.json`의 `scripts` 섹션에 추가:

```json
"seed:demo": "tsx scripts/seed-demo.ts"
```

**Step 3: 커밋**

```bash
git add scripts/seed-demo.ts package.json
git commit -m "feat: 데모 시드 CLI 스크립트 추가 (--groups, --reset, --confirm)"
```

---

### Task 6: 통합 테스트 및 최종 검증

**Step 1: 기존 테스트 확인**

Run: `npx vitest run`
Expected: 모든 기존 테스트 통과 (34+개)

**Step 2: 새 테스트 실행**

Run: `npx vitest run tests/lib/db/seed-core.test.ts`
Expected: PASS

**Step 3: TypeScript 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

**Step 4: CLI 도움말 확인 (dry run)**

Run: `npx tsx scripts/seed-demo.ts --reset students --confirm` (로컬 DB가 없으면 연결 에러로 예상)
Expected: DB 연결 전까지 인자 파싱 정상 동작 확인

**Step 5: 최종 커밋**

모든 테스트 통과 확인 후:

```bash
git add -A
git commit -m "feat: 데모 시드 데이터 시스템 완성 (선택적 리셋/추가, 웹UI+CLI)"
```
