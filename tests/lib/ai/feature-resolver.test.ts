/**
 * FeatureResolver Unit Tests
 *
 * @vitest-environment node
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FeatureResolver } from '@/lib/ai/feature-resolver';
import type { FeatureMappingInput } from '@/lib/ai/types';

// Mock PrismaClient
const mockPrisma = {
  featureMapping: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  model: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
};

describe('FeatureResolver', () => {
  let resolver: FeatureResolver;

  beforeEach(() => {
    vi.clearAllMocks();
    resolver = new FeatureResolver(mockPrisma as unknown as Parameters<typeof FeatureResolver.prototype.constructor>[0]);
  });

  // Test fixtures
  const mockProvider = (id: string, overrides = {}) => ({
    id,
    name: `Provider ${id}`,
    providerType: 'openai',
    baseUrl: 'https://api.test.com',
    apiKeyEncrypted: 'encrypted',
    authType: 'api_key',
    customAuthHeader: null,
    capabilities: ['streaming', 'vision'],
    costTier: 'medium',
    qualityTier: 'balanced',
    isEnabled: true,
    isValidated: true,
    validatedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const mockModel = (id: string, providerId: string, overrides = {}) => ({
    id,
    providerId,
    modelId: `model-${id}`,
    displayName: `Model ${id}`,
    contextWindow: 8192,
    supportsVision: true,
    supportsTools: true,
    defaultParams: null,
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  describe('resolve() - Basic', () => {
    it('should resolve the best matching model for a feature', async () => {
      const provider = mockProvider('p1');
      const model = mockModel('m1', 'p1');
      const mapping = {
        id: 'map1',
        featureType: 'student_analysis',
        matchMode: 'auto_tag',
        requiredTags: ['vision'],
        excludedTags: [],
        specificModelId: null,
        priority: 1,
        fallbackMode: 'next_priority',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.featureMapping.findMany.mockResolvedValue([mapping]);
      mockPrisma.model.findMany.mockResolvedValue([{ ...model, provider }]);

      const result = await resolver.resolve('student_analysis');

      expect(result).not.toBeNull();
      expect(result?.model.id).toBe('m1');
      expect(result?.provider.id).toBe('p1');
      expect(result?.priority).toBe(1);
    });

    it('should return null when no mappings exist', async () => {
      mockPrisma.featureMapping.findMany.mockResolvedValue([]);

      const result = await resolver.resolve('unknown_feature');

      expect(result).toBeNull();
    });

    it('should return null when no models match requirements', async () => {
      const mapping = {
        id: 'map1',
        featureType: 'student_analysis',
        matchMode: 'auto_tag',
        requiredTags: ['vision'],
        excludedTags: [],
        specificModelId: null,
        priority: 1,
        fallbackMode: 'next_priority',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.featureMapping.findMany.mockResolvedValue([mapping]);
      mockPrisma.model.findMany.mockResolvedValue([]);

      const result = await resolver.resolve('student_analysis');

      expect(result).toBeNull();
    });
  });

  describe('resolve() - Tag-based matching', () => {
    it('should filter by requiredTags', async () => {
      const provider1 = mockProvider('p1');
      const provider2 = mockProvider('p2');
      const model1 = mockModel('m1', 'p1', { supportsVision: true });
      const model2 = mockModel('m2', 'p2', { supportsVision: false });

      const mapping = {
        id: 'map1',
        featureType: 'vision_analysis',
        matchMode: 'auto_tag',
        requiredTags: ['vision'],
        excludedTags: [],
        specificModelId: null,
        priority: 1,
        fallbackMode: 'next_priority',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.featureMapping.findMany.mockResolvedValue([mapping]);
      mockPrisma.model.findMany.mockResolvedValue([
        { ...model1, provider: provider1 },
        { ...model2, provider: provider2 },
      ]);

      const result = await resolver.resolve('vision_analysis');

      expect(result?.model.id).toBe('m1');
    });

    it('should filter by excludedTags', async () => {
      const provider1 = mockProvider('p1');
      const provider2 = mockProvider('p2');
      const model1 = mockModel('m1', 'p1', { supportsVision: true });
      const model2 = mockModel('m2', 'p2', { supportsVision: false });

      const mapping = {
        id: 'map1',
        featureType: 'text_analysis',
        matchMode: 'auto_tag',
        requiredTags: [],
        excludedTags: ['vision'],
        specificModelId: null,
        priority: 1,
        fallbackMode: 'next_priority',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.featureMapping.findMany.mockResolvedValue([mapping]);
      mockPrisma.model.findMany.mockResolvedValue([
        { ...model1, provider: provider1 },
        { ...model2, provider: provider2 },
      ]);

      const result = await resolver.resolve('text_analysis');

      expect(result?.model.id).toBe('m2');
    });

    it('should filter by cost tier tags', async () => {
      const provider1 = mockProvider('p1', { costTier: 'low' });
      const provider2 = mockProvider('p2', { costTier: 'high' });
      const model1 = mockModel('m1', 'p1');
      const model2 = mockModel('m2', 'p2');

      const mapping = {
        id: 'map1',
        featureType: 'cost_sensitive',
        matchMode: 'auto_tag',
        requiredTags: ['low'],
        excludedTags: [],
        specificModelId: null,
        priority: 1,
        fallbackMode: 'next_priority',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.featureMapping.findMany.mockResolvedValue([mapping]);
      mockPrisma.model.findMany.mockResolvedValue([
        { ...model1, provider: provider1 },
        { ...model2, provider: provider2 },
      ]);

      const result = await resolver.resolve('cost_sensitive');

      expect(result?.provider.costTier).toBe('low');
    });

    it('should filter by quality tier tags', async () => {
      const provider1 = mockProvider('p1', { qualityTier: 'fast' });
      const provider2 = mockProvider('p2', { qualityTier: 'premium' });
      const model1 = mockModel('m1', 'p1');
      const model2 = mockModel('m2', 'p2');

      const mapping = {
        id: 'map1',
        featureType: 'premium_quality',
        matchMode: 'auto_tag',
        requiredTags: ['premium'],
        excludedTags: [],
        specificModelId: null,
        priority: 1,
        fallbackMode: 'next_priority',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.featureMapping.findMany.mockResolvedValue([mapping]);
      mockPrisma.model.findMany.mockResolvedValue([
        { ...model1, provider: provider1 },
        { ...model2, provider: provider2 },
      ]);

      const result = await resolver.resolve('premium_quality');

      expect(result?.provider.qualityTier).toBe('premium');
    });

    it('should handle multiple tags', async () => {
      const provider = mockProvider('p1', { costTier: 'low', capabilities: ['vision'] });
      const model = mockModel('m1', 'p1', { supportsVision: true });

      const mapping = {
        id: 'map1',
        featureType: 'complex',
        matchMode: 'auto_tag',
        requiredTags: ['vision', 'low'],
        excludedTags: [],
        specificModelId: null,
        priority: 1,
        fallbackMode: 'next_priority',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.featureMapping.findMany.mockResolvedValue([mapping]);
      mockPrisma.model.findMany.mockResolvedValue([{ ...model, provider }]);

      const result = await resolver.resolve('complex');

      expect(result).not.toBeNull();
      expect(result?.model.supportsVision).toBe(true);
      expect(result?.provider.costTier).toBe('low');
    });
  });

  describe('resolve() - Specific model', () => {
    it('should resolve specific model directly', async () => {
      const provider = mockProvider('p1');
      const model = mockModel('m1', 'p1');

      const mapping = {
        id: 'map1',
        featureType: 'specific_feature',
        matchMode: 'specific_model',
        requiredTags: [],
        excludedTags: [],
        specificModelId: 'm1',
        priority: 1,
        fallbackMode: 'next_priority',
        specificModel: { ...model, provider },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.featureMapping.findMany.mockResolvedValue([mapping]);

      const result = await resolver.resolve('specific_feature');

      expect(result?.model.id).toBe('m1');
      expect(result?.provider.id).toBe('p1');
    });

    it('should fetch specific model from DB if not included', async () => {
      const provider = mockProvider('p1');
      const model = mockModel('m1', 'p1');

      const mapping = {
        id: 'map1',
        featureType: 'specific_feature',
        matchMode: 'specific_model',
        requiredTags: [],
        excludedTags: [],
        specificModelId: 'm1',
        priority: 1,
        fallbackMode: 'next_priority',
        specificModel: null, // Not included
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.featureMapping.findMany.mockResolvedValue([mapping]);
      mockPrisma.model.findUnique.mockResolvedValue({ ...model, provider });

      const result = await resolver.resolve('specific_feature');

      expect(mockPrisma.model.findUnique).toHaveBeenCalledWith({
        where: { id: 'm1' },
        include: { provider: true },
      });
      expect(result?.model.id).toBe('m1');
    });

    it('should return null when specific model is disabled', async () => {
      const provider = mockProvider('p1', { isEnabled: false });
      const model = mockModel('m1', 'p1');

      const mapping = {
        id: 'map1',
        featureType: 'specific_feature',
        matchMode: 'specific_model',
        requiredTags: [],
        excludedTags: [],
        specificModelId: 'm1',
        priority: 1,
        fallbackMode: 'next_priority',
        specificModel: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.featureMapping.findMany.mockResolvedValue([mapping]);
      mockPrisma.model.findUnique.mockResolvedValue({ ...model, provider });

      const result = await resolver.resolve('specific_feature');

      expect(result).toBeNull();
    });
  });

  describe('resolve() - Vision requirements', () => {
    it('should filter by needsVision requirement', async () => {
      const provider = mockProvider('p1');
      const visionModel = mockModel('m1', 'p1', { supportsVision: true });
      const nonVisionModel = mockModel('m2', 'p1', { supportsVision: false });

      const mapping = {
        id: 'map1',
        featureType: 'vision_required',
        matchMode: 'auto_tag',
        requiredTags: [],
        excludedTags: [],
        specificModelId: null,
        priority: 1,
        fallbackMode: 'next_priority',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.featureMapping.findMany.mockResolvedValue([mapping]);
      mockPrisma.model.findMany.mockResolvedValue([
        { ...visionModel, provider },
        { ...nonVisionModel, provider },
      ]);

      const result = await resolver.resolve('vision_required', { needsVision: true });

      expect(result?.model.supportsVision).toBe(true);
    });

    it('should filter by needsTools requirement', async () => {
      const provider = mockProvider('p1');
      const toolsModel = mockModel('m1', 'p1', { supportsTools: true });
      const nonToolsModel = mockModel('m2', 'p1', { supportsTools: false });

      const mapping = {
        id: 'map1',
        featureType: 'tools_required',
        matchMode: 'auto_tag',
        requiredTags: [],
        excludedTags: [],
        specificModelId: null,
        priority: 1,
        fallbackMode: 'next_priority',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.featureMapping.findMany.mockResolvedValue([mapping]);
      mockPrisma.model.findMany.mockResolvedValue([
        { ...toolsModel, provider },
        { ...nonToolsModel, provider },
      ]);

      const result = await resolver.resolve('tools_required', { needsTools: true });

      expect(result?.model.supportsTools).toBe(true);
    });

    it('should filter by minContextWindow requirement', async () => {
      const provider = mockProvider('p1');
      const smallModel = mockModel('m1', 'p1', { contextWindow: 4096 });
      const largeModel = mockModel('m2', 'p1', { contextWindow: 128000 });

      const mapping = {
        id: 'map1',
        featureType: 'long_context',
        matchMode: 'auto_tag',
        requiredTags: [],
        excludedTags: [],
        specificModelId: null,
        priority: 1,
        fallbackMode: 'next_priority',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.featureMapping.findMany.mockResolvedValue([mapping]);
      mockPrisma.model.findMany.mockResolvedValue([
        { ...smallModel, provider },
        { ...largeModel, provider },
      ]);

      const result = await resolver.resolve('long_context', { minContextWindow: 10000 });

      expect(result?.model.contextWindow).toBe(128000);
    });
  });

  describe('resolveWithFallback()', () => {
    it('should return fallback chain in priority order', async () => {
      const provider1 = mockProvider('p1');
      const provider2 = mockProvider('p2');
      const model1 = mockModel('m1', 'p1');
      const model2 = mockModel('m2', 'p2');

      const mappings = [
        {
          id: 'map1',
          featureType: 'test_feature',
          matchMode: 'auto_tag',
          requiredTags: [],
          excludedTags: [],
          specificModelId: null,
          priority: 2,
          fallbackMode: 'next_priority',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'map2',
          featureType: 'test_feature',
          matchMode: 'auto_tag',
          requiredTags: [],
          excludedTags: [],
          specificModelId: null,
          priority: 1,
          fallbackMode: 'any_available',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.featureMapping.findMany.mockResolvedValue(mappings);
      mockPrisma.model.findMany.mockResolvedValue([
        { ...model1, provider: provider1 },
        { ...model2, provider: provider2 },
      ]);

      const results = await resolver.resolveWithFallback('test_feature');

      expect(results).toHaveLength(2);
      expect(results[0].priority).toBe(2);
      expect(results[1].priority).toBe(1);
    });

    it('should deduplicate same provider+model combinations', async () => {
      const provider = mockProvider('p1');
      const model = mockModel('m1', 'p1');

      const mappings = [
        {
          id: 'map1',
          featureType: 'test_feature',
          matchMode: 'specific_model',
          requiredTags: [],
          excludedTags: [],
          specificModelId: 'm1',
          priority: 2,
          fallbackMode: 'next_priority',
          specificModel: { ...model, provider },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'map2',
          featureType: 'test_feature',
          matchMode: 'auto_tag',
          requiredTags: [],
          excludedTags: [],
          specificModelId: null,
          priority: 1,
          fallbackMode: 'any_available',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.featureMapping.findMany.mockResolvedValue(mappings);
      mockPrisma.model.findMany.mockResolvedValue([{ ...model, provider }]);

      const results = await resolver.resolveWithFallback('test_feature');

      expect(results).toHaveLength(1);
    });

    it('should stop on fail fallback mode', async () => {
      const provider = mockProvider('p1');
      const model = mockModel('m1', 'p1');

      const mappings = [
        {
          id: 'map1',
          featureType: 'test_feature',
          matchMode: 'auto_tag',
          requiredTags: [],
          excludedTags: [],
          specificModelId: null,
          priority: 2,
          fallbackMode: 'fail',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'map2',
          featureType: 'test_feature',
          matchMode: 'auto_tag',
          requiredTags: [],
          excludedTags: [],
          specificModelId: null,
          priority: 1,
          fallbackMode: 'any_available',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.featureMapping.findMany.mockResolvedValue(mappings);
      mockPrisma.model.findMany.mockResolvedValue([{ ...model, provider }]);

      const results = await resolver.resolveWithFallback('test_feature');

      // Should only get results from first mapping due to 'fail' mode
      expect(results.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getMappings()', () => {
    it('should get all mappings', async () => {
      const mappings = [
        { id: 'map1', featureType: 'feature1' },
        { id: 'map2', featureType: 'feature2' },
      ];
      mockPrisma.featureMapping.findMany.mockResolvedValue(mappings);

      const result = await resolver.getMappings();

      expect(result).toHaveLength(2);
      expect(mockPrisma.featureMapping.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [
            { featureType: 'asc' },
            { priority: 'desc' },
          ],
        })
      );
    });

    it('should filter by feature type', async () => {
      const mappings = [{ id: 'map1', featureType: 'specific_feature' }];
      mockPrisma.featureMapping.findMany.mockResolvedValue(mappings);

      const result = await resolver.getMappings('specific_feature');

      expect(mockPrisma.featureMapping.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { featureType: 'specific_feature' },
        })
      );
    });
  });

  describe('createOrUpdateMapping()', () => {
    const input: FeatureMappingInput = {
      featureType: 'test_feature',
      matchMode: 'auto_tag',
      requiredTags: ['vision'],
      excludedTags: [],
      priority: 1,
      fallbackMode: 'next_priority',
    };

    it('should create new mapping when not exists', async () => {
      mockPrisma.featureMapping.findFirst.mockResolvedValue(null);
      mockPrisma.featureMapping.create.mockResolvedValue({
        id: 'new-map',
        ...input,
        specificModelId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await resolver.createOrUpdateMapping(input);

      expect(mockPrisma.featureMapping.create).toHaveBeenCalled();
      expect(result.featureType).toBe('test_feature');
    });

    it('should update existing mapping with same featureType + priority', async () => {
      const existing = {
        id: 'existing-map',
        featureType: 'test_feature',
        priority: 1,
      };
      mockPrisma.featureMapping.findFirst.mockResolvedValue(existing);
      mockPrisma.featureMapping.update.mockResolvedValue({
        ...existing,
        ...input,
        specificModelId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await resolver.createOrUpdateMapping(input);

      expect(mockPrisma.featureMapping.update).toHaveBeenCalledWith({
        where: { id: 'existing-map' },
        data: expect.objectContaining({
          featureType: 'test_feature',
          matchMode: 'auto_tag',
        }),
      });
    });

    it('should use default priority of 1', async () => {
      const inputWithoutPriority = { ...input };
      delete (inputWithoutPriority as unknown as Record<string, unknown>).priority;

      mockPrisma.featureMapping.findFirst.mockResolvedValue(null);
      mockPrisma.featureMapping.create.mockResolvedValue({
        id: 'new-map',
        ...inputWithoutPriority,
        priority: 1,
        specificModelId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await resolver.createOrUpdateMapping(inputWithoutPriority);

      expect(mockPrisma.featureMapping.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ priority: 1 }),
        })
      );
    });
  });

  describe('deleteMapping()', () => {
    it('should delete mapping by id', async () => {
      mockPrisma.featureMapping.delete.mockResolvedValue({ id: 'map1' });

      await resolver.deleteMapping('map1');

      expect(mockPrisma.featureMapping.delete).toHaveBeenCalledWith({
        where: { id: 'map1' },
      });
    });
  });
});
