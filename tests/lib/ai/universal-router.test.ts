/**
 * Universal Router Unit Tests
 *
 * @vitest-environment node
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
  GenerateOptions,
  VisionGenerateOptions,
  GenerateResult,
  StreamResult,
} from '@/lib/ai/universal-router';

// Mocks
const mockGenerateText = vi.fn();
const mockStreamText = vi.fn();
const mockTrackUsage = vi.fn();
const mockTrackFailure = vi.fn();
const mockDecryptApiKey = vi.fn();
const mockGetAdapter = vi.fn();
const mockFeatureResolver = {
  resolveWithFallback: vi.fn(),
};
const mockProviderRegistry = {
  list: vi.fn(),
};

vi.mock('ai', () => ({
  generateText: (...args: unknown[]) => mockGenerateText(...args),
  streamText: (...args: unknown[]) => mockStreamText(...args),
}));

vi.mock('@/lib/ai/usage-tracker', () => ({
  trackUsage: (...args: unknown[]) => mockTrackUsage(...args),
  trackFailure: (...args: unknown[]) => mockTrackFailure(...args),
}));

vi.mock('@/lib/ai/encryption', () => ({
  decryptApiKey: (key: string) => mockDecryptApiKey(key),
}));

vi.mock('@/lib/ai/adapters', () => ({
  getAdapter: (type: string) => mockGetAdapter(type),
}));

vi.mock('@/lib/ai/feature-resolver', () => ({
  FeatureResolver: class MockFeatureResolver {
    resolveWithFallback = mockFeatureResolver.resolveWithFallback;
  },
}));

vi.mock('@/lib/ai/provider-registry', () => ({
  getProviderRegistry: () => mockProviderRegistry,
}));

vi.mock('@/lib/db', () => ({
  db: {},
}));

// Import after mocks
import {
  generateWithProvider,
  streamWithProvider,
  generateWithSpecificProvider,
  generateWithVision,
} from '@/lib/ai/universal-router';

describe('Universal Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDecryptApiKey.mockImplementation((key: string) => key.replace('encrypted_', ''));
  });

  // Test fixtures
  const mockProvider = (id: string, type: string, overrides = {}) => ({
    id,
    name: `Provider ${type}`,
    providerType: type,
    baseUrl: 'https://api.test.com',
    apiKeyEncrypted: 'encrypted_test-key',
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

  const mockModel = (id: string, overrides = {}) => ({
    id,
    providerId: 'p1',
    modelId: `model-${id}`,
    displayName: `Model ${id}`,
    contextWindow: 8192,
    supportsVision: true,
    supportsTools: true,
    defaultParams: null,
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const mockLanguageModel = {
    provider: 'test',
    modelId: 'test-model',
  };

  const mockAdapter = {
    createModel: vi.fn(() => mockLanguageModel),
    setApiKey: vi.fn(),
    setBaseUrl: vi.fn(),
  };

  describe('generateWithProvider()', () => {
    const options: GenerateOptions = {
      prompt: 'Test prompt',
      featureType: 'student_analysis',
    };

    it('should generate text with first available provider', async () => {
      const provider = mockProvider('p1', 'openai');
      const model = mockModel('m1');

      mockFeatureResolver.resolveWithFallback.mockResolvedValue([
        { provider, model, priority: 1, fallbackMode: 'next_priority' },
      ]);
      mockGetAdapter.mockReturnValue(mockAdapter);
      mockGenerateText.mockResolvedValue({
        text: 'Generated text',
        usage: { inputTokens: 10, outputTokens: 20 },
      });

      const result: GenerateResult = await generateWithProvider(options);

      expect(result.text).toBe('Generated text');
      expect(result.provider).toBe('openai');
      expect(result.model).toBe('model-m1');
      expect(result.wasFailover).toBe(false);
    });

    it('should handle failover to next provider', async () => {
      const provider1 = mockProvider('p1', 'openai');
      const provider2 = mockProvider('p2', 'anthropic');
      const model1 = mockModel('m1');
      const model2 = mockModel('m2');

      mockFeatureResolver.resolveWithFallback.mockResolvedValue([
        { provider: provider1, model: model1, priority: 2, fallbackMode: 'next_priority' },
        { provider: provider2, model: model2, priority: 1, fallbackMode: 'any_available' },
      ]);
      mockGetAdapter.mockReturnValue(mockAdapter);

      // First provider fails
      mockGenerateText
        .mockRejectedValueOnce(new Error('OpenAI error'))
        .mockResolvedValueOnce({
          text: 'Generated text',
          usage: { inputTokens: 10, outputTokens: 20 },
        });

      const result: GenerateResult = await generateWithProvider(options);

      expect(result.text).toBe('Generated text');
      expect(result.wasFailover).toBe(true);
      expect(result.failoverFrom).toBe('openai');
    });

    it('should track usage on success', async () => {
      const provider = mockProvider('p1', 'openai');
      const model = mockModel('m1');

      mockFeatureResolver.resolveWithFallback.mockResolvedValue([
        { provider, model, priority: 1, fallbackMode: 'next_priority' },
      ]);
      mockGetAdapter.mockReturnValue(mockAdapter);
      mockGenerateText.mockResolvedValue({
        text: 'Generated text',
        usage: { inputTokens: 10, outputTokens: 20 },
      });

      await generateWithProvider({
        ...options,
        teacherId: 'teacher-1',
      });

      expect(mockTrackUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'openai',
          modelId: 'model-m1',
          featureType: 'student_analysis',
          teacherId: 'teacher-1',
          inputTokens: 10,
          outputTokens: 20,
          success: true,
        })
      );
    });

    it('should track failure on error', async () => {
      const provider = mockProvider('p1', 'openai');
      const model = mockModel('m1');

      mockFeatureResolver.resolveWithFallback.mockResolvedValue([
        { provider, model, priority: 1, fallbackMode: 'next_priority' },
      ]);
      mockGetAdapter.mockReturnValue(mockAdapter);
      mockGenerateText.mockRejectedValue(new Error('API error'));

      await expect(generateWithProvider(options)).rejects.toThrow();

      expect(mockTrackFailure).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'openai',
          modelId: 'model-m1',
          errorMessage: 'API error',
        })
      );
    });

    it('should throw when no providers available', async () => {
      mockFeatureResolver.resolveWithFallback.mockResolvedValue([]);

      await expect(generateWithProvider(options)).rejects.toThrow(
        'No providers available'
      );
    });

    it('should throw when all providers fail', async () => {
      const provider1 = mockProvider('p1', 'openai');
      const provider2 = mockProvider('p2', 'anthropic');
      const model1 = mockModel('m1');
      const model2 = mockModel('m2');

      mockFeatureResolver.resolveWithFallback.mockResolvedValue([
        { provider: provider1, model: model1, priority: 2, fallbackMode: 'next_priority' },
        { provider: provider2, model: model2, priority: 1, fallbackMode: 'any_available' },
      ]);
      mockGetAdapter.mockReturnValue(mockAdapter);
      mockGenerateText
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'));

      await expect(generateWithProvider(options)).rejects.toThrow(
        'All providers failed'
      );
    });

    it('should skip disabled providers', async () => {
      const disabledProvider = mockProvider('p1', 'openai', { isEnabled: false });
      const enabledProvider = mockProvider('p2', 'anthropic');
      const model = mockModel('m2');

      mockFeatureResolver.resolveWithFallback.mockResolvedValue([
        { provider: disabledProvider, model: mockModel('m1'), priority: 2, fallbackMode: 'next_priority' },
        { provider: enabledProvider, model, priority: 1, fallbackMode: 'any_available' },
      ]);
      mockGetAdapter.mockReturnValue(mockAdapter);
      mockGenerateText.mockResolvedValue({
        text: 'Generated',
        usage: { inputTokens: 5, outputTokens: 10 },
      });

      await generateWithProvider(options);

      // Should use the enabled provider
      expect(mockGenerateText).toHaveBeenCalledTimes(1);
    });

    it('should pass generation parameters', async () => {
      const provider = mockProvider('p1', 'openai');
      const model = mockModel('m1');

      mockFeatureResolver.resolveWithFallback.mockResolvedValue([
        { provider, model, priority: 1, fallbackMode: 'next_priority' },
      ]);
      mockGetAdapter.mockReturnValue(mockAdapter);
      mockGenerateText.mockResolvedValue({
        text: 'Generated',
        usage: { inputTokens: 5, outputTokens: 10 },
      });

      await generateWithProvider({
        prompt: 'Test',
        featureType: 'analysis',
        system: 'System prompt',
        temperature: 0.5,
        maxOutputTokens: 100,
      });

      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: 'Test',
          system: 'System prompt',
          temperature: 0.5,
          maxOutputTokens: 100,
        })
      );
    });
  });

  describe('streamWithProvider()', () => {
    const options: GenerateOptions = {
      prompt: 'Test prompt',
      featureType: 'student_analysis',
    };

    it('should stream text with provider', async () => {
      const provider = mockProvider('p1', 'openai');
      const model = mockModel('m1');

      mockFeatureResolver.resolveWithFallback.mockResolvedValue([
        { provider, model, priority: 1, fallbackMode: 'next_priority' },
      ]);
      mockGetAdapter.mockReturnValue(mockAdapter);
      mockStreamText.mockReturnValue({
        textStream: new ReadableStream(),
      });

      const result: StreamResult = await streamWithProvider(options);

      expect(result.stream).toBeDefined();
      expect(result.provider).toBe('openai');
      expect(result.model).toBe('model-m1');
    });

    it('should track usage on stream finish', async () => {
      const provider = mockProvider('p1', 'openai');
      const model = mockModel('m1');

      mockFeatureResolver.resolveWithFallback.mockResolvedValue([
        { provider, model, priority: 1, fallbackMode: 'next_priority' },
      ]);
      mockGetAdapter.mockReturnValue(mockAdapter);

      let onFinishCallback: (({ usage }: { usage: { inputTokens: number; outputTokens: number } }) => Promise<void>) | null = null;
      mockStreamText.mockImplementation(({ onFinish }: { onFinish: typeof onFinishCallback }) => {
        onFinishCallback = onFinish;
        return { textStream: new ReadableStream() };
      });

      await streamWithProvider({ ...options, teacherId: 'teacher-1' });

      // Simulate onFinish callback
      if (onFinishCallback) {
        await onFinishCallback({ usage: { inputTokens: 10, outputTokens: 20 } });
      }

      expect(mockTrackUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'openai',
          teacherId: 'teacher-1',
          inputTokens: 10,
          outputTokens: 20,
        })
      );
    });

    it('should throw when all providers fail', async () => {
      mockFeatureResolver.resolveWithFallback.mockResolvedValue([]);

      await expect(streamWithProvider(options)).rejects.toThrow();
    });
  });

  describe('generateWithSpecificProvider()', () => {
    const options = {
      prompt: 'Test prompt',
      featureType: 'analysis',
    };

    it('should generate with specified provider', async () => {
      const provider = mockProvider('p1', 'openai');
      const model = mockModel('m1');

      mockProviderRegistry.list.mockResolvedValue([
        { ...provider, models: [model] },
      ]);
      mockGetAdapter.mockReturnValue(mockAdapter);
      mockGenerateText.mockResolvedValue({
        text: 'Generated',
        usage: { inputTokens: 10, outputTokens: 20 },
      });

      const result: GenerateResult = await generateWithSpecificProvider('openai', options);

      expect(result.provider).toBe('openai');
      expect(result.wasFailover).toBe(false);
    });

    it('should throw when provider not found', async () => {
      mockProviderRegistry.list.mockResolvedValue([]);

      await expect(generateWithSpecificProvider('unknown', options)).rejects.toThrow(
        'Provider unknown is not configured'
      );
    });

    it('should throw when provider disabled', async () => {
      const provider = mockProvider('p1', 'openai', { isEnabled: false });

      mockProviderRegistry.list.mockResolvedValue([
        { ...provider, models: [mockModel('m1')] },
      ]);

      await expect(generateWithSpecificProvider('openai', options)).rejects.toThrow();
    });

    it('should throw when no models available', async () => {
      const provider = mockProvider('p1', 'openai');

      mockProviderRegistry.list.mockResolvedValue([
        { ...provider, models: [] },
      ]);

      await expect(generateWithSpecificProvider('openai', options)).rejects.toThrow(
        'No models available'
      );
    });

    it('should use default model', async () => {
      const provider = mockProvider('p1', 'openai');
      const defaultModel = mockModel('m1', { isDefault: true });
      const otherModel = mockModel('m2', { isDefault: false });

      mockProviderRegistry.list.mockResolvedValue([
        { ...provider, models: [otherModel, defaultModel] },
      ]);
      mockGetAdapter.mockReturnValue(mockAdapter);
      mockGenerateText.mockResolvedValue({
        text: 'Generated',
        usage: { inputTokens: 5, outputTokens: 10 },
      });

      await generateWithSpecificProvider('openai', options);

      expect(mockAdapter.createModel).toHaveBeenCalledWith(
        'model-m1',
        expect.anything()
      );
    });
  });

  describe('generateWithVision()', () => {
    const options: VisionGenerateOptions = {
      featureType: 'face_analysis',
      prompt: 'Analyze this image',
      imageBase64: 'base64data',
      mimeType: 'image/jpeg',
    };

    it('should generate with vision-capable model', async () => {
      const provider = mockProvider('p1', 'openai');
      const visionModel = mockModel('m1', { supportsVision: true });

      mockFeatureResolver.resolveWithFallback.mockResolvedValue([
        { provider, model: visionModel, priority: 1, fallbackMode: 'next_priority' },
      ]);
      mockGetAdapter.mockReturnValue(mockAdapter);
      mockGenerateText.mockResolvedValue({
        text: 'Image analysis result',
        usage: { inputTokens: 100, outputTokens: 50 },
      });

      const result: GenerateResult = await generateWithVision(options);

      expect(result.text).toBe('Image analysis result');
      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.arrayContaining([
                expect.objectContaining({ type: 'image' }),
                expect.objectContaining({ type: 'text', text: 'Analyze this image' }),
              ]),
            }),
          ]),
        })
      );
    });

    it('should skip non-vision models', async () => {
      const provider1 = mockProvider('p1', 'openai');
      const provider2 = mockProvider('p2', 'anthropic');
      const nonVisionModel = mockModel('m1', { supportsVision: false });
      const visionModel = mockModel('m2', { supportsVision: true });

      mockFeatureResolver.resolveWithFallback.mockResolvedValue([
        { provider: provider1, model: nonVisionModel, priority: 2, fallbackMode: 'next_priority' },
        { provider: provider2, model: visionModel, priority: 1, fallbackMode: 'any_available' },
      ]);
      mockGetAdapter.mockReturnValue(mockAdapter);
      mockGenerateText.mockResolvedValue({
        text: 'Vision result',
        usage: { inputTokens: 100, outputTokens: 50 },
      });

      const result: GenerateResult = await generateWithVision(options);

      expect(result.provider).toBe('anthropic');
    });

    it('should handle vision failover', async () => {
      const provider1 = mockProvider('p1', 'openai');
      const provider2 = mockProvider('p2', 'anthropic');
      const visionModel1 = mockModel('m1', { supportsVision: true });
      const visionModel2 = mockModel('m2', { supportsVision: true });

      mockFeatureResolver.resolveWithFallback.mockResolvedValue([
        { provider: provider1, model: visionModel1, priority: 2, fallbackMode: 'next_priority' },
        { provider: provider2, model: visionModel2, priority: 1, fallbackMode: 'any_available' },
      ]);
      mockGetAdapter.mockReturnValue(mockAdapter);

      mockGenerateText
        .mockRejectedValueOnce(new Error('Vision error'))
        .mockResolvedValueOnce({
          text: 'Vision result',
          usage: { inputTokens: 100, outputTokens: 50 },
        });

      const result: GenerateResult = await generateWithVision(options);

      expect(result.wasFailover).toBe(true);
      expect(result.failoverFrom).toBe('openai');
    });

    it('should track vision usage', async () => {
      const provider = mockProvider('p1', 'openai');
      const visionModel = mockModel('m1', { supportsVision: true });

      mockFeatureResolver.resolveWithFallback.mockResolvedValue([
        { provider, model: visionModel, priority: 1, fallbackMode: 'next_priority' },
      ]);
      mockGetAdapter.mockReturnValue(mockAdapter);
      mockGenerateText.mockResolvedValue({
        text: 'Result',
        usage: { inputTokens: 100, outputTokens: 50 },
      });

      await generateWithVision({ ...options, teacherId: 'teacher-1' });

      expect(mockTrackUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'openai',
          featureType: 'face_analysis',
          inputTokens: 100,
          outputTokens: 50,
        })
      );
    });

    it('should use default max tokens for vision', async () => {
      const provider = mockProvider('p1', 'openai');
      const visionModel = mockModel('m1', { supportsVision: true });

      mockFeatureResolver.resolveWithFallback.mockResolvedValue([
        { provider, model: visionModel, priority: 1, fallbackMode: 'next_priority' },
      ]);
      mockGetAdapter.mockReturnValue(mockAdapter);
      mockGenerateText.mockResolvedValue({
        text: 'Result',
        usage: { inputTokens: 100, outputTokens: 50 },
      });

      await generateWithVision({
        ...options,
        maxOutputTokens: undefined,
      });

      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          maxOutputTokens: 2048, // Default for vision
        })
      );
    });
  });

  describe('Environment Setup', () => {
    const options: GenerateOptions = {
      prompt: 'Test',
      featureType: 'analysis',
    };

    it('should setup API key for OpenAI', async () => {
      const provider = mockProvider('p1', 'openai', { apiKeyEncrypted: 'encrypted_sk-test' });
      const model = mockModel('m1');

      mockFeatureResolver.resolveWithFallback.mockResolvedValue([
        { provider, model, priority: 1, fallbackMode: 'next_priority' },
      ]);
      mockGetAdapter.mockReturnValue(mockAdapter);
      mockGenerateText.mockResolvedValue({
        text: 'Result',
        usage: { inputTokens: 5, outputTokens: 10 },
      });

      await generateWithProvider(options);

      expect(mockAdapter.setApiKey).toHaveBeenCalledWith('sk-test');
    });

    it('should setup base URL when provided', async () => {
      const provider = mockProvider('p1', 'openai', { baseUrl: 'https://custom.api.com' });
      const model = mockModel('m1');

      mockFeatureResolver.resolveWithFallback.mockResolvedValue([
        { provider, model, priority: 1, fallbackMode: 'next_priority' },
      ]);
      mockGetAdapter.mockReturnValue(mockAdapter);
      mockGenerateText.mockResolvedValue({
        text: 'Result',
        usage: { inputTokens: 5, outputTokens: 10 },
      });

      await generateWithProvider(options);

      expect(mockAdapter.setBaseUrl).toHaveBeenCalledWith('https://custom.api.com');
    });

    it('should handle Ollama without API key', async () => {
      const provider = mockProvider('p1', 'ollama', { apiKeyEncrypted: null });
      const model = mockModel('m1');

      mockFeatureResolver.resolveWithFallback.mockResolvedValue([
        { provider, model, priority: 1, fallbackMode: 'next_priority' },
      ]);
      mockGetAdapter.mockReturnValue(mockAdapter);
      mockGenerateText.mockResolvedValue({
        text: 'Result',
        usage: { inputTokens: 5, outputTokens: 10 },
      });

      await generateWithProvider(options);

      expect(mockAdapter.setApiKey).not.toHaveBeenCalled();
    });
  });
});
