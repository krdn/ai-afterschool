import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { runSeed } from "../src/lib/db/seed/core"

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set")
}
const pool = new Pool({ connectionString: databaseUrl })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("시드 데이터 로드를 시작합니다...")
  const result = await runSeed(prisma)

  console.log("\n=== 시드 결과 ===")
  for (const [model, counts] of Object.entries(result)) {
    const { created, updated } = counts as { created: number; updated: number }
    console.log(`  ${model}: 생성 ${created}건, 갱신 ${updated}건`)
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
