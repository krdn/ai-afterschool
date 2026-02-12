import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const result = await prisma.sajuAnalysis.findFirst({
    where: { studentId: 'cmlhnuhif000lkqwu73ya0o8s' },
    select: { interpretation: true }
  });

  console.log('=== INTERPRETATION START ===');
  console.log(result?.interpretation || 'NULL');
  console.log('=== INTERPRETATION END ===');

  await prisma.$disconnect();
  await pool.end();
}

main();
