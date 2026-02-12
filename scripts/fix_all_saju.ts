import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  // 모든 사주 분석 데이터 가져오기
  const analyses = await prisma.sajuAnalysis.findMany({
    select: { id: true, studentId: true, interpretation: true }
  });

  console.log(`총 ${analyses.length}개의 사주 분석 데이터 확인`);

  let fixedCount = 0;

  for (const analysis of analyses) {
    if (!analysis.interpretation) continue;

    let cleaned = analysis.interpretation;
    let needsUpdate = false;

    // ```markdown 제거
    if (cleaned.startsWith('```markdown')) {
      cleaned = cleaned.replace(/^```markdown\n/, '');
      needsUpdate = true;
    }

    // 마지막 ``` 제거
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.replace(/\n```\s*$/, '');
      needsUpdate = true;
    }

    // 마지막 문장 제거
    const idx = cleaned.indexOf('이 해석은 전통 사주명리학을 기반으로');
    if (idx > 0) {
      cleaned = cleaned.substring(0, idx).trim();
      needsUpdate = true;
    }

    if (needsUpdate) {
      await prisma.sajuAnalysis.update({
        where: { id: analysis.id },
        data: { interpretation: cleaned }
      });
      console.log(`✅ ${analysis.studentId} 수정 완료`);
      fixedCount++;
    }
  }

  console.log(`\n총 ${fixedCount}개 수정 완료`);

  await prisma.$disconnect();
  await pool.end();
}

main();
