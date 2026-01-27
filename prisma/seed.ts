import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import argon2 from "argon2"
import { Pool } from "pg"

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set")
}
const pool = new Pool({ connectionString: databaseUrl })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const existingTeacher = await prisma.teacher.findUnique({
    where: { email: "test@afterschool.com" },
  })

  if (!existingTeacher) {
    const hashedPassword = await argon2.hash("test1234")

    await prisma.teacher.create({
      data: {
        name: "테스트 선생님",
        email: "test@afterschool.com",
        password: hashedPassword,
      },
    })

    console.log("Test teacher created: test@afterschool.com / test1234")
  } else {
    console.log("Test teacher already exists")
  }
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
