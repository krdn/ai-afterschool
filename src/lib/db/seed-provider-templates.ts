/**
 * Provider Template DB Seeding
 *
 * 템플릿 데이터를 ProviderTemplate DB 테이블에 삽입합니다.
 * 중복 방지를 위해 upsert를 사용합니다.
 *
 * 실행: npx tsx src/lib/db/seed-provider-templates.ts
 */

import { PrismaClient } from '@prisma/client';
import {
  getProviderTemplates,
  ProviderTemplate,
} from '../ai/templates';

const prisma = new PrismaClient();

/**
 * 템플릿을 DB에 시딩합니다.
 */
async function seedProviderTemplates(): Promise<void> {
  console.log('🌱 Provider Template 시딩 시작...\n');

  const templates = getProviderTemplates();
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const template of templates) {
    try {
      // 템플릿을 DB에 upsert
      const result = await prisma.providerTemplate.upsert({
        where: { templateId: template.templateId },
        update: {
          name: template.name,
          providerType: template.providerType,
          description: template.description,
          logoUrl: template.logoUrl,
          defaultBaseUrl: template.defaultBaseUrl,
          defaultAuthType: template.defaultAuthType,
          customAuthHeaderName: template.customAuthHeaderName,
          defaultCapabilities: template.defaultCapabilities,
          defaultCostTier: template.defaultCostTier,
          defaultQualityTier: template.defaultQualityTier,
          defaultModels: template.defaultModels,
          apiKeyInstructions: template.apiKeyInstructions,
          apiKeyUrl: template.apiKeyUrl,
          helpUrl: template.helpUrl,
          isPopular: template.isPopular,
          sortOrder: template.sortOrder,
        },
        create: {
          templateId: template.templateId,
          name: template.name,
          providerType: template.providerType,
          description: template.description,
          logoUrl: template.logoUrl,
          defaultBaseUrl: template.defaultBaseUrl,
          defaultAuthType: template.defaultAuthType,
          customAuthHeaderName: template.customAuthHeaderName,
          defaultCapabilities: template.defaultCapabilities,
          defaultCostTier: template.defaultCostTier,
          defaultQualityTier: template.defaultQualityTier,
          defaultModels: template.defaultModels,
          apiKeyInstructions: template.apiKeyInstructions,
          apiKeyUrl: template.apiKeyUrl,
          helpUrl: template.helpUrl,
          isPopular: template.isPopular,
          sortOrder: template.sortOrder,
        },
      });

      // 생성/업데이트 구분을 위해 최초 생성 시간 확인
      const isNew = result.createdAt.getTime() === result.updatedAt.getTime();
      if (isNew) {
        created++;
        console.log(`  ✅ 생성: ${template.name} (${template.templateId})`);
      } else {
        updated++;
        console.log(`  🔄 업데이트: ${template.name} (${template.templateId})`);
      }
    } catch (error) {
      skipped++;
      console.error(`  ❌ 실패: ${template.name} (${template.templateId})`);
      console.error(`     오류: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log('\n📊 시딩 결과:');
  console.log(`   생성: ${created}`);
  console.log(`   업데이트: ${updated}`);
  console.log(`   실패: ${skipped}`);
  console.log(`   총 템플릿: ${templates.length}`);
}

/**
 * 메인 실행 함수
 */
async function main(): Promise<void> {
  try {
    await seedProviderTemplates();
    console.log('\n✨ Provider Template 시딩 완료!');
  } catch (error) {
    console.error('\n💥 시딩 중 오류 발생:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 직접 실행 시
if (require.main === module) {
  main();
}

export { seedProviderTemplates };
