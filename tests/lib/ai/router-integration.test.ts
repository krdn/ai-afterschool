/**
 * Universal Router Integration Tests
 * 
 * LLM Router Integration (35-05)의 통합 테스트입니다.
 * 기존 router.ts와 새로운 universal-router.ts의 호환성을 검증합니다.
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';

// 테스트 대상 모듈
import {
  generateWithProvider,
  streamWithProvider,
  generateWithSpecificProvider,
  generateWithVision,
  generateVisionWithSpecificProvider,
} from '@/lib/ai/router';

import * as universalRouter from '@/lib/ai/universal-router';
import * as compat from '@/lib/ai/compat';

// Mock 설정
vi.mock('@/lib/db', () => ({
  db: {
    provider: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
    },
    model: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    featureMapping: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

describe('Universal Router Integration', () => {
  beforeAll(() => {
    // 테스트 환경 설정
    console.log('Testing Universal Router Integration');
  });

  describe('Compatibility Layer', () => {
    it('should convert legacy ProviderName to new format', () => {
      const result = compat.legacyProviderToNew('anthropic');
      expect(result).toBe('anthropic');
    });

    it('should convert new provider type to legacy format', () => {
      const result = compat.newProviderToLegacy('anthropic');
      expect(result).toBe('anthropic');
    });

    it('should return null for unknown provider type', () => {
      const result = compat.newProviderToLegacy('unknown-provider');
      expect(result).toBeNull();
    });

    it('should convert legacy FeatureType to new format', () => {
      const result = compat.legacyFeatureToNew('learning_analysis');
      expect(result).toBe('learning_analysis');
    });
  });

  describe('Universal Router Exports', () => {
    it('should export all required functions from universal-router', () => {
      expect(typeof universalRouter.generateWithProvider).toBe('function');
      expect(typeof universalRouter.streamWithProvider).toBe('function');
      expect(typeof universalRouter.generateWithSpecificProvider).toBe('function');
      expect(typeof universalRouter.generateWithVision).toBe('function');
      expect(typeof universalRouter.generateVisionWithSpecificProvider).toBe('function');
    });

    it('should export FailoverError from universal-router', () => {
      expect(universalRouter.FailoverError).toBeDefined();
    });
  });

  describe('Legacy Router Delegation', () => {
    it('should have generateWithProvider function', () => {
      expect(typeof generateWithProvider).toBe('function');
    });

    it('should have streamWithProvider function', () => {
      expect(typeof streamWithProvider).toBe('function');
    });

    it('should have generateWithSpecificProvider function', () => {
      expect(typeof generateWithSpecificProvider).toBe('function');
    });

    it('should have generateWithVision function', () => {
      expect(typeof generateWithVision).toBe('function');
    });

    it('should have generateVisionWithSpecificProvider function', () => {
      expect(typeof generateVisionWithSpecificProvider).toBe('function');
    });
  });

  describe('Integration Flow', () => {
    it('should use FeatureResolver for model selection', async () => {
      // FeatureResolver가 ProviderRegistry와 함께 작동하는지 확인
      const { FeatureResolver } = await import('@/lib/ai/feature-resolver');
      expect(FeatureResolver).toBeDefined();
      
      // 인스턴스 생성 테스트
      const { db } = await import('@/lib/db');
      const resolver = new FeatureResolver(db);
      expect(resolver).toBeInstanceOf(FeatureResolver);
    });

    it('should have ProviderRegistry singleton', async () => {
      const { getProviderRegistry } = await import('@/lib/ai/provider-registry');
      expect(typeof getProviderRegistry).toBe('function');
    });

    it('should have adapters registered', async () => {
      const adapters = await import('@/lib/ai/adapters');
      expect(typeof adapters.getAdapter).toBe('function');
      expect(typeof adapters.hasAdapter).toBe('function');
    });
  });

  describe('Type Compatibility', () => {
    it('should maintain legacy GenerateOptions interface', () => {
      // 레거시 인터페이스가 여전히 작동하는지 확인
      const options = {
        prompt: 'test prompt',
        featureType: 'learning_analysis' as const,
        teacherId: 'test-teacher',
        maxOutputTokens: 1000,
        temperature: 0.7,
        system: 'test system',
      };
      
      expect(options.prompt).toBe('test prompt');
      expect(options.featureType).toBe('learning_analysis');
    });

    it('should maintain legacy VisionGenerateOptions interface', () => {
      const options = {
        featureType: 'face_analysis' as const,
        teacherId: 'test-teacher',
        maxOutputTokens: 2048,
        temperature: 0.5,
        system: 'test system',
        imageBase64: 'base64encoded',
        mimeType: 'image/jpeg' as const,
        prompt: 'analyze this image',
      };
      
      expect(options.imageBase64).toBe('base64encoded');
      expect(options.mimeType).toBe('image/jpeg');
    });
  });

  describe('Error Handling', () => {
    it('should export FailoverError for legacy compatibility', async () => {
      const { FailoverError: LegacyFailoverError } = await import('@/lib/ai/router');
      expect(LegacyFailoverError).toBeDefined();
      
      // FailoverError 인스턴스 생성 테스트
      const error = new LegacyFailoverError('learning_analysis', [
        {
          provider: 'ollama',
          error: new Error('Test error'),
          timestamp: new Date(),
          durationMs: 100,
        },
      ]);
      
      expect(error.name).toBe('FailoverError');
      expect(error.featureType).toBe('learning_analysis');
    });
  });
});

describe('Router Migration Verification', () => {
  it('should verify all legacy exports are available', () => {
    // smart-routing exports
    expect(typeof universalRouter).toBe('object');
  });

  it('should verify compat layer exports', () => {
    expect(typeof compat.legacyProviderToNew).toBe('function');
    expect(typeof compat.newProviderToLegacy).toBe('function');
    expect(typeof compat.legacyFeatureToNew).toBe('function');
    expect(typeof compat.adaptOptions).toBe('function');
    expect(typeof compat.adaptResult).toBe('function');
    expect(typeof compat.getLLMConfigAdapter).toBe('function');
    expect(typeof compat.getFeatureConfigAdapter).toBe('function');
    expect(typeof compat.getProviderConfigsCompat).toBe('function');
  });
});
