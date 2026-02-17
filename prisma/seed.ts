import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { runSeed } from "../src/lib/db/seed/core"
import type { SeedOptions } from "../src/lib/db/seed/constants"
import { DEFAULT_SEED_GROUPS } from "../src/lib/db/seed/constants"

// --preset 옵션 파싱
const preset = process.argv.includes("--preset")
  ? process.argv[process.argv.indexOf("--preset") + 1]
  : undefined

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set")
}
const pool = new Pool({ connectionString: databaseUrl })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  let options: SeedOptions = {}

  if (preset === "test") {
    const { TEST_SEED_DATA } = await import("../src/lib/db/seed/data-test")
    options = {
      groups: DEFAULT_SEED_GROUPS,
      modes: Object.fromEntries(DEFAULT_SEED_GROUPS.map(g => [g, 'reset' as const])),
      dataOverride: TEST_SEED_DATA,
    }
    console.log("🧪 테스트 프리셋으로 시드 데이터를 로드합니다...")
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
