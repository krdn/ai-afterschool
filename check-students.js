const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const students = await prisma.student.findMany({
    include: { images: true },
    take: 10
  })
  
  console.log('Students and their images:')
  for (const s of students) {
    const types = s.images.map(img => img.type).join(', ') || 'none'
    const hasProfile = s.images.some(img => img.type === 'profile')
    console.log(`${s.name}: ${types} | hasProfile: ${hasProfile}`)
  }
}

main().finally(() => prisma.$disconnect())
