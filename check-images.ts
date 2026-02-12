import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function main() {
  const student = await prisma.student.findUnique({
    where: { id: 'cmlhnuhif000lkqwu73ya0o8s' },
    include: { images: true }
  })
  console.log('Student:', student?.name)
  console.log('Images count:', student?.images?.length)
  console.log('Images:', JSON.stringify(student?.images, null, 2))
}

main().finally(() => prisma.$disconnect())
