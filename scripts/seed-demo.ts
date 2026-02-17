/**
 * 데모 시드 데이터 CLI
 *
 * 사용법:
 *   npx tsx scripts/seed-demo.ts                                       # 전체 merge
 *   npx tsx scripts/seed-demo.ts --groups teams,students               # 특정 그룹
 *   npx tsx scripts/seed-demo.ts --reset students,parents --confirm    # 리셋
 */

import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { runSeed } from "../src/lib/db/seed/core"
import {
  ALL_SEED_GROUPS,
  SEED_GROUP_LABELS,
  SEED_GROUP_DEPENDENCIES,
  type SeedGroup,
  type SeedMode,
} from "../src/lib/db/seed/constants"

// CLI 인자 파싱
const args = process.argv.slice(2)

function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`)
  if (idx === -1) return undefined
  return args[idx + 1]
}

const hasFlag = (name: string) => args.includes(`--${name}`)

// 도움말
if (hasFlag("help")) {
  console.log(`
데모 시드 데이터 CLI

사용법:
  npx tsx scripts/seed-demo.ts                                       # 전체 merge
  npx tsx scripts/seed-demo.ts --groups teams,students               # 특정 그룹
  npx tsx scripts/seed-demo.ts --reset students,parents --confirm    # 리셋

옵션:
  --groups <list>   실행할 그룹 (쉼표 구분): teams,teachers,students,parents,llmConfigs,providers
  --reset <list>    리셋할 그룹 (쉼표 구분, --confirm 필수)
  --confirm         리셋 실행 확인
  --help            도움말
`)
  process.exit(0)
}

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
