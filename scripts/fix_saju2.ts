import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const result = await prisma.sajuAnalysis.findFirst({
    where: { studentId: 'cmlhnuhif000lkqwu73ya0o8s' },
    select: { interpretation: true, id: true }
  });

  if (!result?.interpretation) return;

  // 마지막 문장 제거
  let cleaned = result.interpretation;
  const idx = cleaned.indexOf('이 해석은 전통 사주명리학을 기반으로');
  if (idx > 0) {
    cleaned = cleaned.substring(0, idx).trim();
  }

  console.log('=== FINAL START ===');
  console.log(cleaned);
  console.log('=== FINAL END ===');

  await prisma.sajuAnalysis.update({
    where: { id: result.id },
    data: { interpretation: cleaned }
  });

  console.log('✅ 최종 업데이트 완료!');

  await prisma.$disconnect();
  await pool.end();
}

main();
