import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  // 현재 데이터 가져오기
  const result = await prisma.sajuAnalysis.findFirst({
    where: { studentId: 'cmlhnuhif000lkqwu73ya0o8s' },
    select: { interpretation: true, id: true }
  });

  if (!result?.interpretation) {
    console.log('No interpretation found');
    return;
  }

  // ```markdown 제거
  let cleaned = result.interpretation;
  cleaned = cleaned.replace(/^```markdown\n/, '');
  cleaned = cleaned.replace(/\n```\s*$/, '');
  cleaned = cleaned.replace(/\n```\n이 해석은 전통 사주명리학을 기반으로 한 것입니다. 과학적 근거가 부족하며, 학생의 개성을 존중하고 긍정적인 톤을 유지하는 것이 중요합니다.$/, '');

  console.log('=== CLEANED START ===');
  console.log(cleaned);
  console.log('=== CLEANED END ===');

  // 업데이트
  await prisma.sajuAnalysis.update({
    where: { id: result.id },
    data: { interpretation: cleaned }
  });

  console.log('✅ 업데이트 완료!');

  await prisma.$disconnect();
  await pool.end();
}

main();
