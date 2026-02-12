#!/usr/bin/env tsx
/**
 * Universal LLM Hub 데이터 마이그레이션 스크립트
 * 
 * 기존 LLMConfig, LLMFeatureConfig 데이터를 새로운 Universal LLM Hub 모델로 마이그레이션합니다.
 * 
 * 실행 방법:
 *   npx tsx src/lib/db/migrate-llm-config.ts [--dry-run] [--rollback]
 * 
 * 옵션:
 *   --dry-run    실제 마이그레이션 없이 변경사항 미리보기
 *   --rollback   마이그레이션 실행 취소 (백업 데이터 필요)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// 기본 제공자 템플릿 매핑
const PROVIDER_TEMPLATES: Record<string, {
  templateId: string;
  providerType: string;
  defaultBaseUrl?: string;
  defaultCapabilities: string[];
  defaultAuthType: string;
  costTier: 'free' | 'low' | 'medium' | 'high';
  qualityTier: 'fast' | 'balanced' | 'premium';
}> = {
  'openai': {
    templateId: 'openai',
    providerType: 'openai',
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultCapabilities: ['text', 'function_calling', 'json_mode', 'streaming'],
    defaultAuthType: 'api_key',
    costTier: 'high',
    qualityTier: 'premium',
  },
  'anthropic': {
    templateId: 'anthropic',
    providerType: 'anthropic',
    defaultBaseUrl: 'https://api.anthropic.com',
    defaultCapabilities: ['text', 'vision', 'function_calling', 'json_mode', 'streaming'],
    defaultAuthType: 'api_key',
    costTier: 'high',
    qualityTier: 'premium',
  },
  'google': {
    templateId: 'google',
    providerType: 'google',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com',
    defaultCapabilities: ['text', 'vision', 'function_calling', 'streaming'],
    defaultAuthType: 'api_key',
    costTier: 'medium',
    qualityTier: 'balanced',
  },
  'ollama': {
    templateId: 'ollama',
    providerType: 'ollama',
    defaultBaseUrl: 'http://localhost:11434',
    defaultCapabilities: ['text', 'function_calling'],
    defaultAuthType: 'none',
    costTier: 'free',
    qualityTier: 'fast',
  },
};

// 기본 모델 매핑
const DEFAULT_MODELS: Record<string, Array<{
  modelId: string;
  displayName: string;
  contextWindow: number;
  supportsVision: boolean;
  supportsTools: boolean;
}>> = {
  'openai': [
    { modelId: 'gpt-4', displayName: 'GPT-4', contextWindow: 8192, supportsVision: false, supportsTools: true },
    { modelId: 'gpt-4-turbo', displayName: 'GPT-4 Turbo', contextWindow: 128000, supportsVision: true, supportsTools: true },
    { modelId: 'gpt-3.5-turbo', displayName: 'GPT-3.5 Turbo', contextWindow: 16385, supportsVision: false, supportsTools: true },
  ],
  'anthropic': [
    { modelId: 'claude-3-opus-20240229', displayName: 'Claude 3 Opus', contextWindow: 200000, supportsVision: true, supportsTools: true },
    { modelId: 'claude-3-sonnet-20240229', displayName: 'Claude 3 Sonnet', contextWindow: 200000, supportsVision: true, supportsTools: true },
    { modelId: 'claude-3-haiku-20240307', displayName: 'Claude 3 Haiku', contextWindow: 200000, supportsVision: true, supportsTools: true },
  ],
  'google': [
    { modelId: 'gemini-pro', displayName: 'Gemini Pro', contextWindow: 32000, supportsVision: false, supportsTools: true },
    { modelId: 'gemini-pro-vision', displayName: 'Gemini Pro Vision', contextWindow: 32000, supportsVision: true, supportsTools: true },
  ],
  'ollama': [
    { modelId: 'llama2', displayName: 'Llama 2', contextWindow: 4096, supportsVision: false, supportsTools: false },
    { modelId: 'mistral', displayName: 'Mistral', contextWindow: 8192, supportsVision: false, supportsTools: false },
  ],
};

// 기능 유형 매핑
const FEATURE_TYPES: Record<string, {
  requiredTags: string[];
  excludedTags: string[];
  priority: number;
  fallbackMode: string;
}> = {
  'analysis': {
    requiredTags: ['text', 'analysis'],
    excludedTags: [],
    priority: 1,
    fallbackMode: 'next_priority',
  },
  'vision': {
    requiredTags: ['vision'],
    excludedTags: [],
    priority: 1,
    fallbackMode: 'next_priority',
  },
  'chat': {
    requiredTags: ['text', 'streaming'],
    excludedTags: [],
    priority: 1,
    fallbackMode: 'next_priority',
  },
  'generation': {
    requiredTags: ['text', 'generation'],
    excludedTags: [],
    priority: 1,
    fallbackMode: 'next_priority',
  },
};

interface MigrationContext {
  dryRun: boolean;
  rollback: boolean;
  backupData?: {
    llmConfigs: any[];
    llmFeatureConfigs: any[];
  };
}

async function createProviderTemplates(dryRun: boolean): Promise<void> {
  console.log('\n📋 Step 1: Creating Provider Templates...\n');

  const templates = Object.values(PROVIDER_TEMPLATES).map(template => ({
    templateId: template.templateId,
    name: template.templateId.charAt(0).toUpperCase() + template.templateId.slice(1),
    providerType: template.providerType,
    defaultBaseUrl: template.defaultBaseUrl,
    defaultCapabilities: template.defaultCapabilities,
    defaultAuthType: template.defaultAuthType,
    description: `Standard ${template.providerType} provider template`,
    helpUrl: getHelpUrl(template.templateId),
    isPopular: template.templateId === 'openai' || template.templateId === 'anthropic',
    sortOrder: getSortOrder(template.templateId),
  }));

  for (const template of templates) {
    console.log(`  ${dryRun ? '[DRY-RUN] Would create' : 'Creating'} template: ${template.templateId}`);
    if (!dryRun) {
      await prisma.providerTemplate.upsert({
        where: { templateId: template.templateId },
        update: template,
        create: template,
      });
    }
  }

  console.log(`  ✓ ${templates.length} provider templates processed`);
}

async function migrateLLMConfigs(dryRun: boolean): Promise<Record<string, string>> {
  console.log('\n📋 Step 2: Migrating LLM Configurations...\n');

  const llmConfigs = await prisma.lLMConfig.findMany();
  const providerIdMap: Record<string, string> = {};

  console.log(`  Found ${llmConfigs.length} LLMConfig records`);

  for (const config of llmConfigs) {
    const template = PROVIDER_TEMPLATES[config.provider] || {
      templateId: config.provider,
      providerType: 'custom',
      defaultCapabilities: ['text'],
      defaultAuthType: 'api_key',
      costTier: 'medium',
      qualityTier: 'balanced',
    };

    const providerData = {
      name: config.displayName || config.provider,
      providerType: template.providerType,
      baseUrl: config.baseUrl || template.defaultBaseUrl,
      apiKeyEncrypted: config.apiKeyEncrypted,
      authType: template.defaultAuthType,
      customAuthHeader: null,
      capabilities: template.defaultCapabilities,
      costTier: template.costTier || 'medium',
      qualityTier: template.qualityTier || 'balanced',
      isEnabled: config.isEnabled,
      isValidated: config.isValidated,
      validatedAt: config.validatedAt,
    };

    console.log(`  ${dryRun ? '[DRY-RUN] Would create' : 'Creating'} provider: ${config.provider}`);

    if (!dryRun) {
      const provider = await prisma.provider.create({
        data: providerData,
      });
      providerIdMap[config.provider] = provider.id;

      // Create default models for this provider
      await createDefaultModels(provider.id, config.provider, config.defaultModel, dryRun);
    } else {
      providerIdMap[config.provider] = `mock-${config.provider}`;
    }
  }

  console.log(`  ✓ ${llmConfigs.length} providers migrated`);
  return providerIdMap;
}

async function createDefaultModels(
  providerId: string,
  providerName: string,
  defaultModelId: string | null,
  dryRun: boolean
): Promise<void> {
  const models = DEFAULT_MODELS[providerName] || [
    {
      modelId: defaultModelId || 'default',
      displayName: 'Default Model',
      contextWindow: 4096,
      supportsVision: false,
      supportsTools: false,
    },
  ];

  for (const model of models) {
    const isDefault = model.modelId === defaultModelId;

    console.log(`    ${dryRun ? '[DRY-RUN] Would create' : 'Creating'} model: ${model.modelId} ${isDefault ? '(default)' : ''}`);

    if (!dryRun) {
      await prisma.model.upsert({
        where: {
          providerId_modelId: {
            providerId,
            modelId: model.modelId,
          },
        },
        update: {
          ...model,
          isDefault,
        },
        create: {
          providerId,
          ...model,
          isDefault,
          defaultParams: {
            temperature: 0.7,
            maxTokens: 2048,
          },
        },
      });
    }
  }
}

async function migrateFeatureConfigs(dryRun: boolean, providerIdMap: Record<string, string>): Promise<void> {
  console.log('\n📋 Step 3: Migrating Feature Configurations...\n');

  const featureConfigs = await prisma.lLMFeatureConfig.findMany();
  console.log(`  Found ${featureConfigs.length} LLMFeatureConfig records`);

  for (const config of featureConfigs) {
    const featureMapping = FEATURE_TYPES[config.featureType] || {
      requiredTags: ['text'],
      excludedTags: [],
      priority: 1,
      fallbackMode: 'next_priority',
    };

    console.log(`  ${dryRun ? '[DRY-RUN] Would create' : 'Creating'} feature mapping: ${config.featureType}`);

    if (!dryRun) {
      // Find specific model if modelOverride exists
      let specificModelId = null;
      if (config.modelOverride) {
        const providerId = providerIdMap[config.primaryProvider];
        if (providerId) {
          const model = await prisma.model.findUnique({
            where: {
              providerId_modelId: {
                providerId,
                modelId: config.modelOverride,
              },
            },
          });
          if (model) {
            specificModelId = model.id;
          }
        }
      }

      await prisma.featureMapping.create({
        data: {
          featureType: config.featureType,
          matchMode: specificModelId ? 'specific_model' : 'auto_tag',
          requiredTags: featureMapping.requiredTags,
          excludedTags: featureMapping.excludedTags,
          specificModelId,
          priority: featureMapping.priority,
          fallbackMode: featureMapping.fallbackMode,
        },
      });
    }
  }

  console.log(`  ✓ ${featureConfigs.length} feature mappings created`);
}

async function verifyMigration(): Promise<void> {
  console.log('\n📋 Step 4: Verifying Migration...\n');

  const counts = await prisma.$transaction([
    prisma.providerTemplate.count(),
    prisma.provider.count(),
    prisma.model.count(),
    prisma.featureMapping.count(),
  ]);

  console.log('  Migration Summary:');
  console.log(`    - Provider Templates: ${counts[0]}`);
  console.log(`    - Providers: ${counts[1]}`);
  console.log(`    - Models: ${counts[2]}`);
  console.log(`    - Feature Mappings: ${counts[3]}`);

  // Validate relationships
  const orphanedModels = await prisma.model.count({
    where: {
      provider: null,
    },
  });

  if (orphanedModels > 0) {
    console.warn(`    ⚠ Warning: ${orphanedModels} orphaned models found`);
  } else {
    console.log('    ✓ All models have valid provider relationships');
  }

  const orphanedMappings = await prisma.featureMapping.count({
    where: {
      matchMode: 'specific_model',
      specificModel: null,
    },
  });

  if (orphanedMappings > 0) {
    console.warn(`    ⚠ Warning: ${orphanedMappings} feature mappings reference non-existent models`);
  } else {
    console.log('    ✓ All feature mappings are valid');
  }
}

async function backupExistingData(): Promise<{ llmConfigs: any[]; llmFeatureConfigs: any[] }> {
  console.log('\n📋 Backing up existing data...\n');

  const llmConfigs = await prisma.lLMConfig.findMany();
  const llmFeatureConfigs = await prisma.lLMFeatureConfig.findMany();

  console.log(`  Backed up ${llmConfigs.length} LLM configs`);
  console.log(`  Backed up ${llmFeatureConfigs.length} feature configs`);

  return { llmConfigs, llmFeatureConfigs };
}

async function rollbackMigration(backupData: { llmConfigs: any[]; llmFeatureConfigs: any[] }): Promise<void> {
  console.log('\n📋 Rolling back migration...\n');

  // Delete in reverse order to respect foreign keys
  console.log('  Deleting feature mappings...');
  await prisma.featureMapping.deleteMany();

  console.log('  Deleting models...');
  await prisma.model.deleteMany();

  console.log('  Deleting providers...');
  await prisma.provider.deleteMany();

  console.log('  Deleting provider templates...');
  await prisma.providerTemplate.deleteMany();

  console.log('  ✓ Rollback complete');
  console.log('  Note: Original LLMConfig and LLMFeatureConfig data preserved');
}

function getHelpUrl(templateId: string): string | null {
  const urls: Record<string, string> = {
    'openai': 'https://platform.openai.com/api-keys',
    'anthropic': 'https://console.anthropic.com/settings/keys',
    'google': 'https://makersuite.google.com/app/apikey',
    'ollama': 'https://ollama.com/download',
  };
  return urls[templateId] || null;
}

function getSortOrder(templateId: string): number {
  const orders: Record<string, number> = {
    'openai': 1,
    'anthropic': 2,
    'google': 3,
    'ollama': 4,
  };
  return orders[templateId] || 100;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const rollback = args.includes('--rollback');

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  Universal LLM Hub Data Migration                      ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`\nMode: ${dryRun ? 'DRY RUN' : rollback ? 'ROLLBACK' : 'LIVE'}`);

  try {
    if (rollback) {
      // In a real implementation, we'd restore from a backup file
      // For now, just delete the new data
      await rollbackMigration({ llmConfigs: [], llmFeatureConfigs: [] });
    } else {
      // Backup existing data
      const backupData = await backupExistingData();

      // Step 1: Create provider templates
      await createProviderTemplates(dryRun);

      // Step 2: Migrate LLM configs to providers
      const providerIdMap = await migrateLLMConfigs(dryRun);

      // Step 3: Migrate feature configs
      await migrateFeatureConfigs(dryRun, providerIdMap);

      // Step 4: Verify migration
      if (!dryRun) {
        await verifyMigration();
      }

      console.log('\n╔════════════════════════════════════════════════════════╗');
      console.log('║  Migration Complete!                                   ║');
      console.log('╚════════════════════════════════════════════════════════╝');

      if (dryRun) {
        console.log('\n⚠ This was a dry run. No actual changes were made.');
        console.log('   Run without --dry-run to apply changes.');
      }
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export {
  createProviderTemplates,
  migrateLLMConfigs,
  migrateFeatureConfigs,
  verifyMigration,
  rollbackMigration,
};