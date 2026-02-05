import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set")
}
const pool = new Pool({ connectionString: databaseUrl })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    const user = await prisma.teacher.findUnique({
        where: { email: "test@afterschool.com" },
    })
    console.log("User:", user)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
