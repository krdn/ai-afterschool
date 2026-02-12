/**
 * ProviderRegistry Unit Tests
 *
 * @vitest-environment node
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProviderRegistry } from '@/lib/ai/provider-registry';
import type { ProviderWithModels, ProviderInput, ValidationResult } from '@/lib/ai/types';

// Mock PrismaClient
const mockPrisma = {
  provider: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  model: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

// Mock adapter
const mockAdapter = {
  validate: vi.fn(),
  listModels: vi.fn(),
  generate: vi.fn(),
  stream: vi.fn(),
};

vi.mock('@/lib/ai/adapters', () => ({
  getAdapter: vi.fn(() => mockAdapter),
  BaseAdapter: class BaseAdapter {},
}));

vi.mock('@/lib/ai/encryption', () => ({
  encryptApiKey: vi.fn((key: string) => `encrypted_${key}`),
  decryptApiKey: vi.fn((key: string) => key.replace('encrypted_', '')),
}));

describe('ProviderRegistry', () => {
  let registry: ProviderRegistry;

  beforeEach(() => {
    // Reset singleton
    ProviderRegistry.resetInstance();
    // Reset mocks
    vi.clearAllMocks();
    // Create new instance
    registry = ProviderRegistry.getInstance(mockPrisma as unknown as Parameters<typeof ProviderRegistry.getInstance>[0]!);
  });

  describe('Singleton Pattern', () => {
    it('should create singleton instance', () => {
      const instance1 = ProviderRegistry.getInstance();
      const instance2 = ProviderRegistry.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should reset instance', () => {
      const instance1 = ProviderRegistry.getInstance();
      ProviderRegistry.resetInstance();
      const instance2 = ProviderRegistry.getInstance(mockPrisma as unknown as Parameters<typeof ProviderRegistry.getInstance>[0]!);
      expect(instance1).not.toBe(instance2);
    });

    it('should throw error if no db provided on first init', () => {
      ProviderRegistry.resetInstance();
      expect(() => ProviderRegistry.getInstance()).toThrow('ProviderRegistry requires PrismaClient on first initialization');
    });
  });

  describe('register()', () => {
    const mockProviderInput: ProviderInput = {
      name: 'Test Provider',
      providerType: 'openai',
      baseUrl: 'https://api.test.com',
      authType: 'api_key',
      apiKey: 'test-api-key',
      capabilities: ['streaming', 'vision'],
      costTier: 'medium',
      qualityTier: 'balanced',
      isEnabled: true,
    };

    const mockCreatedProvider: ProviderWithModels = {
      id: 'provider-1',
      name: 'Test Provider',
      providerType: 'openai',
      baseUrl: 'https://api.test.com',
      apiKeyEncrypted: 'encrypted_test-api-key',
      authType: 'api_key',
      customAuthHeader: null,
      capabilities: ['streaming', 'vision'],
      costTier: 'medium',
      qualityTier: 'balanced',
      isEnabled: true,
      isValidated: false,
      validatedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      models: [],
    };

    it('should register a new provider with API key encryption', async () => {
      mockPrisma.provider.create.mockResolvedValue(mockCreatedProvider);
      mockPrisma.provider.findUnique.mockResolvedValue(mockCreatedProvider);

      const result = await registry.register(mockProviderInput);

      expect(mockPrisma.provider.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Test Provider',
          providerType: 'openai',
          apiKeyEncrypted: 'encrypted_test-api-key',
          isEnabled: true,
        }),
        include: { models: true },
      });
      expect(result).toEqual(mockCreatedProvider);
    });

    it('should create default models based on provider type', async () => {
      mockPrisma.provider.create.mockResolvedValue(mockCreatedProvider);
      mockPrisma.provider.findUnique.mockResolvedValue(mockCreatedProvider);

      await registry.register(mockProviderInput);

      // OpenAI type should create default models
      expect(mockPrisma.model.create).toHaveBeenCalled();
    });

    it('should handle missing API key', async () => {
      const inputWithoutKey = { ...mockProviderInput, apiKey: undefined };
      mockPrisma.provider.create.mockResolvedValue({
        ...mockCreatedProvider,
        apiKeyEncrypted: null,
      });
      mockPrisma.provider.findUnique.mockResolvedValue({
        ...mockCreatedProvider,
        apiKeyEncrypted: null,
      });

      await registry.register(inputWithoutKey);

      expect(mockPrisma.provider.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            apiKeyEncrypted: null,
          }),
        })
      );
    });
  });

  describe('update()', () => {
    const mockProvider: ProviderWithModels = {
      id: 'provider-1',
      name: 'Original Name',
      providerType: 'openai',
      baseUrl: 'https://api.test.com',
      apiKeyEncrypted: 'encrypted_key',
      authType: 'api_key',
      customAuthHeader: null,
      capabilities: ['streaming'],
      costTier: 'low',
      qualityTier: 'balanced',
      isEnabled: true,
      isValidated: true,
      validatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      models: [],
    };

    it('should update provider information', async () => {
      mockPrisma.provider.update.mockResolvedValue({
        ...mockProvider,
        name: 'Updated Name',
      });
      mockPrisma.provider.findUnique.mockResolvedValue({
        ...mockProvider,
        name: 'Updated Name',
      });

      const result = await registry.update('provider-1', { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
    });

    it('should reset validation status when API key changes', async () => {
      mockPrisma.provider.update.mockResolvedValue({
        ...mockProvider,
        apiKeyEncrypted: 'encrypted_new-key',
        isValidated: false,
        validatedAt: null,
      });
      mockPrisma.provider.findUnique.mockResolvedValue({
        ...mockProvider,
        apiKeyEncrypted: 'encrypted_new-key',
        isValidated: false,
        validatedAt: null,
      });

      await registry.update('provider-1', { apiKey: 'new-key' });

      expect(mockPrisma.provider.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            apiKeyEncrypted: 'encrypted_new-key',
            isValidated: false,
            validatedAt: null,
          }),
        })
      );
    });

    it('should invalidate cache after update', async () => {
      // First get to populate cache
      mockPrisma.provider.findUnique.mockResolvedValue(mockProvider);
      await registry.get('provider-1');

      // Update
      mockPrisma.provider.update.mockResolvedValue(mockProvider);
      mockPrisma.provider.findUnique.mockResolvedValue(mockProvider);
      await registry.update('provider-1', { name: 'New Name' });

      // Should have called findUnique again after cache invalidation
      expect(mockPrisma.provider.findUnique).toHaveBeenCalledTimes(2);
    });
  });

  describe('remove()', () => {
    it('should delete provider and invalidate cache', async () => {
      mockPrisma.provider.delete.mockResolvedValue({ id: 'provider-1' });

      await registry.remove('provider-1');

      expect(mockPrisma.provider.delete).toHaveBeenCalledWith({
        where: { id: 'provider-1' },
      });
    });

    it('should cascade delete related models (Prisma handles this)', async () => {
      mockPrisma.provider.delete.mockResolvedValue({ id: 'provider-1' });

      await registry.remove('provider-1');

      // Prisma's onDelete: Cascade handles model deletion
      expect(mockPrisma.provider.delete).toHaveBeenCalled();
    });
  });

  describe('get() / list()', () => {
    const mockProvider: ProviderWithModels = {
      id: 'provider-1',
      name: 'Test Provider',
      providerType: 'openai',
      baseUrl: 'https://api.test.com',
      apiKeyEncrypted: 'encrypted_key',
      authType: 'api_key',
      customAuthHeader: null,
      capabilities: ['streaming'],
      costTier: 'medium',
      qualityTier: 'balanced',
      isEnabled: true,
      isValidated: false,
      validatedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      models: [],
    };

    it('should get provider by id with caching', async () => {
      mockPrisma.provider.findUnique.mockResolvedValue(mockProvider);

      // First call - should hit DB
      const result1 = await registry.get('provider-1');
      expect(result1).toEqual(mockProvider);
      expect(mockPrisma.provider.findUnique).toHaveBeenCalledTimes(1);

      // Second call - should hit cache
      const result2 = await registry.get('provider-1');
      expect(result2).toEqual(mockProvider);
      // Should not have called DB again
      expect(mockPrisma.provider.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should return null for non-existent provider', async () => {
      mockPrisma.provider.findUnique.mockResolvedValue(null);

      const result = await registry.get('non-existent');

      expect(result).toBeNull();
    });

    it('should list all providers', async () => {
      const providers = [mockProvider];
      mockPrisma.provider.findMany.mockResolvedValue(providers);

      const result = await registry.list();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockProvider);
    });

    it('should filter by enabled status', async () => {
      mockPrisma.provider.findMany.mockResolvedValue([mockProvider]);

      await registry.list({ enabledOnly: true });

      expect(mockPrisma.provider.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isEnabled: true },
        })
      );
    });
  });

  describe('validate()', () => {
    const mockProvider: ProviderWithModels = {
      id: 'provider-1',
      name: 'Test Provider',
      providerType: 'openai',
      baseUrl: 'https://api.test.com',
      apiKeyEncrypted: 'encrypted_key',
      authType: 'api_key',
      customAuthHeader: null,
      capabilities: ['streaming'],
      costTier: 'medium',
      qualityTier: 'balanced',
      isEnabled: true,
      isValidated: false,
      validatedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      models: [],
    };

    it('should validate provider connection successfully', async () => {
      mockPrisma.provider.findUnique.mockResolvedValue(mockProvider);
      mockAdapter.validate.mockResolvedValue({ isValid: true });
      mockPrisma.provider.update.mockResolvedValue({
        ...mockProvider,
        isValidated: true,
      });

      const result: ValidationResult = await registry.validate('provider-1');

      expect(result.isValid).toBe(true);
      expect(mockAdapter.validate).toHaveBeenCalledWith(mockProvider);
    });

    it('should update validation status on success', async () => {
      mockPrisma.provider.findUnique.mockResolvedValue(mockProvider);
      mockAdapter.validate.mockResolvedValue({ isValid: true });
      mockPrisma.provider.update.mockResolvedValue({
        ...mockProvider,
        isValidated: true,
        validatedAt: new Date(),
      });

      await registry.validate('provider-1');

      expect(mockPrisma.provider.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isValidated: true,
            validatedAt: expect.any(Date),
          }),
        })
      );
    });

    it('should handle validation failure', async () => {
      mockPrisma.provider.findUnique.mockResolvedValue(mockProvider);
      mockAdapter.validate.mockResolvedValue({
        isValid: false,
        error: 'Invalid API key',
      });
      mockPrisma.provider.update.mockResolvedValue(mockProvider);

      const result = await registry.validate('provider-1');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid API key');
    });

    it('should return error for non-existent provider', async () => {
      mockPrisma.provider.findUnique.mockResolvedValue(null);

      const result = await registry.validate('non-existent');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('제공자를 찾을 수 없습니다.');
    });
  });

  describe('syncModels()', () => {
    const mockProvider: ProviderWithModels = {
      id: 'provider-1',
      name: 'Test Provider',
      providerType: 'openai',
      baseUrl: 'https://api.test.com',
      apiKeyEncrypted: 'encrypted_key',
      authType: 'api_key',
      customAuthHeader: null,
      capabilities: ['streaming'],
      costTier: 'medium',
      qualityTier: 'balanced',
      isEnabled: true,
      isValidated: true,
      validatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      models: [],
    };

    const mockModels = [
      { modelId: 'gpt-4', displayName: 'GPT-4', contextWindow: 8192, supportsVision: true },
      { modelId: 'gpt-3.5', displayName: 'GPT-3.5', contextWindow: 4096, supportsVision: false },
    ];

    it('should sync models from provider', async () => {
      mockPrisma.provider.findUnique.mockResolvedValue(mockProvider);
      mockAdapter.listModels.mockResolvedValue(mockModels);
      mockPrisma.model.findMany.mockResolvedValue([]);
      mockPrisma.model.create.mockResolvedValue({});

      const result = await registry.syncModels('provider-1');

      expect(mockAdapter.listModels).toHaveBeenCalledWith(mockProvider);
      expect(mockPrisma.model.create).toHaveBeenCalledTimes(2);
    });

    it('should not duplicate existing models', async () => {
      mockPrisma.provider.findUnique.mockResolvedValue(mockProvider);
      mockAdapter.listModels.mockResolvedValue(mockModels);
      mockPrisma.model.findMany.mockResolvedValue([
        { id: 'model-1', modelId: 'gpt-4', providerId: 'provider-1' },
      ]);
      mockPrisma.model.create.mockResolvedValue({});

      await registry.syncModels('provider-1');

      // Only one new model should be created (gpt-3.5)
      expect(mockPrisma.model.create).toHaveBeenCalledTimes(1);
    });

    it('should throw error for non-existent provider', async () => {
      mockPrisma.provider.findUnique.mockResolvedValue(null);

      await expect(registry.syncModels('non-existent')).rejects.toThrow('제공자를 찾을 수 없습니다.');
    });
  });

  describe('Model Operations', () => {
    it('should add a model', async () => {
      const mockModel = {
        id: 'model-1',
        providerId: 'provider-1',
        modelId: 'test-model',
        displayName: 'Test Model',
        contextWindow: 4096,
        supportsVision: true,
        supportsTools: false,
        defaultParams: null,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.model.create.mockResolvedValue(mockModel);

      const result = await registry.addModel({
        providerId: 'provider-1',
        modelId: 'test-model',
        displayName: 'Test Model',
        contextWindow: 4096,
        supportsVision: true,
      });

      expect(result).toEqual(mockModel);
    });

    it('should update a model', async () => {
      const mockModel = {
        id: 'model-1',
        providerId: 'provider-1',
        modelId: 'test-model',
        displayName: 'Updated Model',
        contextWindow: 8192,
        supportsVision: true,
        supportsTools: false,
        defaultParams: null,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.model.findUnique.mockResolvedValue({
        id: 'model-1',
        providerId: 'provider-1',
      });
      mockPrisma.model.update.mockResolvedValue(mockModel);

      const result = await registry.updateModel('model-1', {
        displayName: 'Updated Model',
        contextWindow: 8192,
      });

      expect(result.displayName).toBe('Updated Model');
    });

    it('should throw when updating non-existent model', async () => {
      mockPrisma.model.findUnique.mockResolvedValue(null);

      await expect(registry.updateModel('non-existent', {})).rejects.toThrow('모델을 찾을 수 없습니다.');
    });

    it('should remove a model', async () => {
      mockPrisma.model.findUnique.mockResolvedValue({
        id: 'model-1',
        providerId: 'provider-1',
      });
      mockPrisma.model.delete.mockResolvedValue({ id: 'model-1' });

      await registry.removeModel('model-1');

      expect(mockPrisma.model.delete).toHaveBeenCalledWith({
        where: { id: 'model-1' },
      });
    });

    it('should handle removing non-existent model gracefully', async () => {
      mockPrisma.model.findUnique.mockResolvedValue(null);

      await expect(registry.removeModel('non-existent')).resolves.not.toThrow();
    });
  });

  describe('Cache Management', () => {
    const mockProvider: ProviderWithModels = {
      id: 'provider-1',
      name: 'Test Provider',
      providerType: 'openai',
      baseUrl: 'https://api.test.com',
      apiKeyEncrypted: 'encrypted_key',
      authType: 'api_key',
      customAuthHeader: null,
      capabilities: ['streaming'],
      costTier: 'medium',
      qualityTier: 'balanced',
      isEnabled: true,
      isValidated: false,
      validatedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      models: [],
    };

    it('should cache provider data', async () => {
      mockPrisma.provider.findUnique.mockResolvedValue(mockProvider);

      // First call - hits DB
      await registry.get('provider-1');
      expect(mockPrisma.provider.findUnique).toHaveBeenCalledTimes(1);

      // Second call - hits cache
      await registry.get('provider-1');
      expect(mockPrisma.provider.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should invalidate specific provider cache', async () => {
      mockPrisma.provider.findUnique.mockResolvedValue(mockProvider);

      // Populate cache
      await registry.get('provider-1');
      expect(mockPrisma.provider.findUnique).toHaveBeenCalledTimes(1);

      // Invalidate
      registry.invalidateCache('provider-1');

      // Next call should hit DB
      await registry.get('provider-1');
      expect(mockPrisma.provider.findUnique).toHaveBeenCalledTimes(2);
    });

    it('should invalidate all cache', async () => {
      mockPrisma.provider.findUnique.mockResolvedValue(mockProvider);

      // Populate cache
      await registry.get('provider-1');

      // Invalidate all
      registry.invalidateCache();

      // Next call should hit DB
      await registry.get('provider-1');
      expect(mockPrisma.provider.findUnique).toHaveBeenCalledTimes(2);
    });
  });

  describe('Adapter Access', () => {
    it('should get adapter for provider', () => {
      const adapter = registry.getAdapter({ providerType: 'openai' });

      expect(adapter).toBe(mockAdapter);
    });

    it('should get adapter by type', () => {
      const adapter = registry.getAdapterByType('anthropic');

      expect(adapter).toBe(mockAdapter);
    });
  });
});
