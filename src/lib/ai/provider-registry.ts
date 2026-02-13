/**
 * Provider Registry
 *
 * Universal LLM Hub의 제공자를 동적으로 등록하고 관리하는 레지스트리입니다.
 * Singleton 패턴으로 구현되어 전체 애플리케이션에서 하나의 인스턴스만 사용합니다.
 */

import { PrismaClient } from '@prisma/client';
import type {
  Provider,
  Model,
  Prisma,
} from '@prisma/client';
import {
  getAdapter,
  BaseAdapter,
} from './adapters';
import type {
  ProviderType,
  ProviderInput,
  ProviderWithModels,
  ModelInput,
  ModelConfig,
  ValidationResult,
} from './types';
import { encryptApiKey } from './encryption';

// 캐시 엔트리 타입
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/**
 * ProviderRegistry 클래스
 */
export class ProviderRegistry {
  private static instance: ProviderRegistry | null = null;
  private db: PrismaClient;

  // 캐시: providerId -> ProviderWithModels
  private cache: Map<string, CacheEntry<ProviderWithModels>> = new Map();

  // 캐시 TTL (5분)
  private readonly CACHE_TTL_MS = 5 * 60 * 1000;

  /**
   * Private constructor - use getInstance() instead
   */
  private constructor(db: PrismaClient) {
    this.db = db;
  }

  /**
   * 싱글톤 인스턴스를 반환합니다.
   */
  static getInstance(db?: PrismaClient): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      if (!db) {
        throw new Error('ProviderRegistry requires PrismaClient on first initialization');
      }
      ProviderRegistry.instance = new ProviderRegistry(db);
    }
    return ProviderRegistry.instance;
  }

  /**
   * 인스턴스를 초기화합니다 (테스트용).
   */
  static resetInstance(): void {
    ProviderRegistry.instance = null;
  }

  // ============================================================================
  // Provider CRUD Operations
  // ============================================================================

  /**
   * 새로운 제공자를 등록합니다.
   *
   * @param input - 제공자 입력 데이터
   * @returns 생성된 제공자 설정
   */
  async register(input: ProviderInput): Promise<ProviderWithModels> {
    // API 키 암호화
    const apiKeyEncrypted = input.apiKey
      ? encryptApiKey(input.apiKey)
      : null;

    // Provider 생성
    const provider = await this.db.provider.create({
      data: {
        name: input.name,
        providerType: input.providerType,
        baseUrl: input.baseUrl,
        apiKeyEncrypted,
        authType: input.authType,
        customAuthHeader: input.customAuthHeader,
        capabilities: input.capabilities || [],
        costTier: input.costTier,
        qualityTier: input.qualityTier,
        isEnabled: input.isEnabled ?? false,
      },
      include: { models: true },
    });

    // 기본 모델 자동 생성 (템플릿 기반)
    await this.createDefaultModels(provider.id, input.providerType);

    // 캐시 무효화
    this.invalidateCache(provider.id);

    // 생성된 제공자 반환 (모델 포함)
    return this.get(provider.id) as Promise<ProviderWithModels>;
  }

  /**
   * 제공자 정보를 업데이트합니다.
   *
   * @param id - 제공자 ID
   * @param input - 업데이트할 데이터
   * @returns 업데이트된 제공자 설정
   */
  async update(
    id: string,
    input: Partial<ProviderInput>
  ): Promise<ProviderWithModels> {
    const updateData: Prisma.ProviderUpdateInput = {
      name: input.name,
      providerType: input.providerType,
      baseUrl: input.baseUrl,
      authType: input.authType,
      customAuthHeader: input.customAuthHeader,
      capabilities: input.capabilities,
      costTier: input.costTier,
      qualityTier: input.qualityTier,
      isEnabled: input.isEnabled,
    };

    // API 키가 변경되면 암호화 및 검증 상태 리셋
    if (input.apiKey !== undefined) {
      updateData.apiKeyEncrypted = input.apiKey
        ? encryptApiKey(input.apiKey)
        : null;
      updateData.isValidated = false;
      updateData.validatedAt = null;
    }

    await this.db.provider.update({
      where: { id },
      data: updateData,
    });

    // 캐시 무효화
    this.invalidateCache(id);

    return this.get(id) as Promise<ProviderWithModels>;
  }

  /**
   * 제공자를 삭제합니다.
   *
   * @param id - 제공자 ID
   */
  async remove(id: string): Promise<void> {
    // Prisma의 onDelete: Cascade로 연결된 Models도 자동 삭제됨
    await this.db.provider.delete({
      where: { id },
    });

    // 캐시 무효화
    this.invalidateCache(id);
  }

  /**
   * 특정 제공자를 조회합니다.
   *
   * @param id - 제공자 ID
   * @returns 제공자 설정 (모델 포함) 또는 null
   */
  async get(id: string): Promise<ProviderWithModels | null> {
    // 캐시 확인
    const cached = this.getFromCache(id);
    if (cached) {
      return cached;
    }

    // DB 조회
    const provider = await this.db.provider.findUnique({
      where: { id },
      include: { models: true },
    });

    if (provider) {
      // API 키 존재 여부 추가
      const providerWithKeyStatus = {
        ...provider,
        hasApiKey: !!(provider as unknown as { apiKeyEncrypted?: string }).apiKeyEncrypted,
      };
      // 캐시에 저장
      this.setCache(id, providerWithKeyStatus);
      return providerWithKeyStatus;
    }

    return null;
  }

  /**
   * 모든 제공자 목록을 조회합니다.
   *
   * @param options - 조회 옵션
   * @returns 제공자 목록
   */
  async list(
    options?: { enabledOnly?: boolean }
  ): Promise<ProviderWithModels[]> {
    const where: Prisma.ProviderWhereInput = {};

    if (options?.enabledOnly) {
      where.isEnabled = true;
    }

    const providers = await this.db.provider.findMany({
      where,
      include: { models: true },
      orderBy: { createdAt: 'asc' },
    });

    // API 키 존재 여부를 hasApiKey 필드로 변환
    const providersWithKeyStatus = providers.map((provider) => ({
      ...provider,
      hasApiKey: !!(provider as unknown as { apiKeyEncrypted?: string }).apiKeyEncrypted,
    }));

    // 캐시 업데이트
    providersWithKeyStatus.forEach((provider) => {
      this.setCache(provider.id, provider);
    });

    return providersWithKeyStatus;
  }

  // ============================================================================
  // Validation & Sync
  // ============================================================================

  /**
   * 제공자 연결을 검증합니다.
   *
   * @param id - 제공자 ID
   * @returns 검증 결과
   */
  async validate(id: string): Promise<ValidationResult> {
    const provider = await this.get(id);

    if (!provider) {
      return {
        isValid: false,
        error: '제공자를 찾을 수 없습니다.',
      };
    }

    try {
      const adapter = this.getAdapter(provider);
      const result = await adapter.validate(provider);

      // 검증 결과 DB에 업데이트
      await this.db.provider.update({
        where: { id },
        data: {
          isValidated: result.isValid,
          validatedAt: result.isValid ? new Date() : null,
        },
      });

      // 캐시 무효화
      this.invalidateCache(id);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // 검증 실패 DB에 업데이트
      await this.db.provider.update({
        where: { id },
        data: {
          isValidated: false,
          validatedAt: null,
        },
      });

      // 캐시 무효화
      this.invalidateCache(id);

      return {
        isValid: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 제공자의 모델 목록을 동기화합니다.
   *
   * @param id - 제공자 ID
   * @returns 동기화된 모델 목록
   */
  async syncModels(id: string): Promise<ModelConfig[]> {
    const provider = await this.get(id);

    if (!provider) {
      throw new Error('제공자를 찾을 수 없습니다.');
    }

    const adapter = this.getAdapter(provider);
    const models = await adapter.listModels(provider);

    // 기존 모델 목록
    const existingModels = await this.db.model.findMany({
      where: { providerId: id },
    });

    const existingModelIds = new Set(existingModels.map((m) => m.modelId));

    // 새 모델 추가
    for (const model of models) {
      if (!existingModelIds.has(model.modelId)) {
        await this.db.model.create({
          data: {
            providerId: id,
            modelId: model.modelId,
            displayName: model.displayName,
            contextWindow: model.contextWindow,
            supportsVision: model.supportsVision,
            supportsTools: model.supportsTools,
          },
        });
      }
    }

    // 캐시 무효화
    this.invalidateCache(id);

    // 업데이트된 모델 목록 반환
    const updatedProvider = await this.get(id);
    return updatedProvider?.models || [];
  }

  // ============================================================================
  // Adapter Access
  // ============================================================================

  /**
   * 제공자에 맞는 어댑터를 반환합니다.
   *
   * @param provider - 제공자 설정
   * @returns 어댑터 인스턴스
   */
  getAdapter(provider: Pick<Provider, 'providerType'>): BaseAdapter {
    return getAdapter(provider.providerType as ProviderType);
  }

  /**
   * 제공자 타입에 맞는 어댑터를 반환합니다.
   *
   * @param providerType - 제공자 타입
   * @returns 어댑터 인스턴스
   */
  getAdapterByType(providerType: ProviderType): BaseAdapter {
    return getAdapter(providerType);
  }

  // ============================================================================
  // Model Operations
  // ============================================================================

  /**
   * 모델을 추가합니다.
   *
   * @param input - 모델 입력 데이터
   * @returns 생성된 모델
   */
  async addModel(input: ModelInput): Promise<Model> {
    const model = await this.db.model.create({
      data: {
        providerId: input.providerId,
        modelId: input.modelId,
        displayName: input.displayName,
        contextWindow: input.contextWindow,
        supportsVision: input.supportsVision ?? false,
        supportsTools: input.supportsTools ?? false,
        defaultParams: input.defaultParams
          ? (input.defaultParams as Prisma.InputJsonValue)
          : undefined,
        isDefault: input.isDefault ?? false,
      },
    });

    // 캐시 무효화
    this.invalidateCache(input.providerId);

    return model;
  }

  /**
   * 모델을 업데이트합니다.
   *
   * @param id - 모델 ID
   * @param input - 업데이트할 데이터
   * @returns 업데이트된 모델
   */
  async updateModel(
    id: string,
    input: Partial<Omit<ModelInput, 'providerId'>>
  ): Promise<Model> {
    const model = await this.db.model.findUnique({
      where: { id },
    });

    if (!model) {
      throw new Error('모델을 찾을 수 없습니다.');
    }

    const updated = await this.db.model.update({
      where: { id },
      data: {
        modelId: input.modelId,
        displayName: input.displayName,
        contextWindow: input.contextWindow,
        supportsVision: input.supportsVision,
        supportsTools: input.supportsTools,
        defaultParams: input.defaultParams
          ? (input.defaultParams as Prisma.InputJsonValue)
          : undefined,
        isDefault: input.isDefault,
      },
    });

    // 캐시 무효화
    this.invalidateCache(model.providerId);

    return updated;
  }

  /**
   * 모델을 삭제합니다.
   *
   * @param id - 모델 ID
   */
  async removeModel(id: string): Promise<void> {
    const model = await this.db.model.findUnique({
      where: { id },
    });

    if (model) {
      await this.db.model.delete({
        where: { id },
      });

      // 캐시 무효화
      this.invalidateCache(model.providerId);
    }
  }

  // ============================================================================
  // Cache Management
  // ============================================================================

  /**
   * 특정 제공자 캐시를 무효화합니다.
   *
   * @param id - 제공자 ID (없으면 전체 캐시 무효화)
   */
  invalidateCache(id?: string): void {
    if (id) {
      this.cache.delete(id);
    } else {
      this.cache.clear();
    }
  }

  /**
   * 캐시에서 데이터를 조회합니다.
   *
   * @param id - 제공자 ID
   * @returns 캐시된 데이터 또는 null
   */
  private getFromCache(id: string): ProviderWithModels | null {
    const entry = this.cache.get(id);

    if (!entry) {
      return null;
    }

    // 만료 확인
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(id);
      return null;
    }

    return entry.data;
  }

  /**
   * 캐시에 데이터를 저장합니다.
   *
   * @param id - 제공자 ID
   * @param data - 저장할 데이터
   */
  private setCache(id: string, data: ProviderWithModels): void {
    this.cache.set(id, {
      data,
      expiresAt: Date.now() + this.CACHE_TTL_MS,
    });
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  /**
   * 제공자 타입에 따른 기본 모델을 생성합니다.
   *
   * @param providerId - 제공자 ID
   * @param providerType - 제공자 타입
   */
  private async createDefaultModels(
    providerId: string,
    providerType: ProviderType
  ): Promise<void> {
    const defaultModels: Record<ProviderType, Array<Partial<ModelInput>>> = {
      openai: [
        {
          modelId: 'gpt-4o',
          displayName: 'GPT-4o',
          contextWindow: 128000,
          supportsVision: true,
          supportsTools: true,
          isDefault: true,
        },
        {
          modelId: 'gpt-4o-mini',
          displayName: 'GPT-4o Mini',
          contextWindow: 128000,
          supportsVision: true,
          supportsTools: true,
        },
      ],
      anthropic: [
        {
          modelId: 'claude-sonnet-4-5',
          displayName: 'Claude Sonnet 4.5',
          contextWindow: 200000,
          supportsVision: true,
          supportsTools: true,
          isDefault: true,
        },
        {
          modelId: 'claude-3-5-haiku-latest',
          displayName: 'Claude 3.5 Haiku',
          contextWindow: 200000,
          supportsVision: true,
          supportsTools: true,
        },
      ],
      google: [
        {
          modelId: 'gemini-2.5-flash-preview-05-20',
          displayName: 'Gemini 2.5 Flash',
          contextWindow: 1048576,
          supportsVision: true,
          supportsTools: true,
          isDefault: true,
        },
        {
          modelId: 'gemini-2.0-flash',
          displayName: 'Gemini 2.0 Flash',
          contextWindow: 1048576,
          supportsVision: true,
          supportsTools: true,
        },
      ],
      ollama: [
        {
          modelId: 'llama3.2:3b',
          displayName: 'Llama 3.2 (3B)',
          contextWindow: 8192,
          supportsVision: false,
          supportsTools: false,
          isDefault: true,
        },
      ],
      deepseek: [
        {
          modelId: 'deepseek-chat',
          displayName: 'DeepSeek Chat',
          contextWindow: 64000,
          supportsVision: false,
          supportsTools: true,
          isDefault: true,
        },
        {
          modelId: 'deepseek-reasoner',
          displayName: 'DeepSeek Reasoner',
          contextWindow: 64000,
          supportsVision: false,
          supportsTools: true,
        },
      ],
      mistral: [
        {
          modelId: 'mistral-large-latest',
          displayName: 'Mistral Large',
          contextWindow: 128000,
          supportsVision: false,
          supportsTools: true,
          isDefault: true,
        },
      ],
      cohere: [
        {
          modelId: 'command-r-plus',
          displayName: 'Command R+',
          contextWindow: 128000,
          supportsVision: false,
          supportsTools: true,
          isDefault: true,
        },
      ],
      xai: [
        {
          modelId: 'grok-3',
          displayName: 'Grok 3',
          contextWindow: 131072,
          supportsVision: true,
          supportsTools: true,
          isDefault: true,
        },
      ],
      zhipu: [
        {
          modelId: 'glm-4v-plus',
          displayName: 'GLM-4V Plus',
          contextWindow: 8192,
          supportsVision: true,
          supportsTools: true,
          isDefault: true,
        },
      ],
      moonshot: [
        {
          modelId: 'kimi-k2.5-preview',
          displayName: 'Kimi K2.5',
          contextWindow: 256000,
          supportsVision: false,
          supportsTools: true,
          isDefault: true,
        },
      ],
      openrouter: [
        {
          modelId: 'openai/gpt-4o',
          displayName: 'GPT-4o (via OpenRouter)',
          contextWindow: 128000,
          supportsVision: true,
          supportsTools: true,
          isDefault: true,
        },
        {
          modelId: 'openai/gpt-4o-mini',
          displayName: 'GPT-4o Mini (via OpenRouter)',
          contextWindow: 128000,
          supportsVision: true,
          supportsTools: true,
        },
        {
          modelId: 'anthropic/claude-sonnet-4-5',
          displayName: 'Claude Sonnet 4.5 (via OpenRouter)',
          contextWindow: 200000,
          supportsVision: true,
          supportsTools: true,
        },
        {
          modelId: 'google/gemini-2.5-flash',
          displayName: 'Gemini 2.5 Flash (via OpenRouter)',
          contextWindow: 1000000,
          supportsVision: true,
          supportsTools: true,
        },
      ],
      custom: [],
    };

    const models = defaultModels[providerType] || [];

    for (const model of models) {
      await this.db.model.create({
        data: {
          providerId,
          modelId: model.modelId!,
          displayName: model.displayName!,
          contextWindow: model.contextWindow,
          supportsVision: model.supportsVision ?? false,
          supportsTools: model.supportsTools ?? false,
          isDefault: model.isDefault ?? false,
        },
      });
    }
  }
}

// ============================================================================
// Convenience Exports
// ============================================================================

/**
 * ProviderRegistry 싱글톤 인스턴스를 반환합니다.
 */
export function getProviderRegistry(db?: PrismaClient): ProviderRegistry {
  return ProviderRegistry.getInstance(db);
}
