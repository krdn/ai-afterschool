/**
 * Legacy Router - Deprecated
 *
 * 이 파일은 하위호환성을 위해 유지됩니다.
 * 새로운 코드에서는 universal-router.ts를 직접 사용하세요.
 *
 * Migration Guide:
 * - 기존: import { generateWithProvider } from './router'
 * - 새로움: import { generateWithProvider } from './universal-router'
 */

import type { LanguageModelUsage } from 'ai';
import type { ProviderName, FeatureType } from './providers';
import {
  FailoverError,
  isRetryableError,
} from './failover';
import {
  optimizeProviderOrder,
  checkAllBudgetThresholds,
  filterByBudget,
  getSmartRoutingDecision,
  type BudgetAlert,
} from './smart-routing';

// Universal Router에서 새로운 구현 가져오기
import {
  generateWithProvider as universalGenerate,
  streamWithProvider as universalStream,
  generateWithSpecificProvider as universalGenerateSpecific,
  generateWithVision as universalGenerateVision,
  generateVisionWithSpecificProvider as universalGenerateVisionSpecific,
  type GenerateOptions as UniversalGenerateOptions,
  type VisionGenerateOptions as UniversalVisionOptions,
  type GenerateResult as UniversalGenerateResult,
} from './universal-router';

// 호환성 레이어
import { legacyFeatureToNew, newProviderToLegacy } from './compat';

export { FailoverError } from './failover';
export { optimizeProviderOrder, checkAllBudgetThresholds, getSmartRoutingDecision } from './smart-routing';
export type { BudgetAlert } from './smart-routing';

// 기존 인터페이스 유지 (하위호환성)
interface GenerateOptions {
  prompt: string;
  featureType: FeatureType;
  teacherId?: string;
  maxOutputTokens?: number;
  temperature?: number;
  system?: string;
}

/**
 * Vision 분석 옵션 - 이미지를 포함한 요청
 */
interface VisionGenerateOptions {
  featureType: FeatureType;
  teacherId?: string;
  maxOutputTokens?: number;
  temperature?: number;
  system?: string;
  /** base64 인코딩된 이미지 데이터 */
  imageBase64: string;
  /** 이미지 MIME 타입 (예: 'image/jpeg', 'image/png') */
  mimeType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  /** 이미지와 함께 별낼 프롬프트 */
  prompt: string;
}

interface GenerateResult {
  text: string;
  usage: LanguageModelUsage;
  provider: ProviderName;
  model: string;
  wasFailover: boolean;
  failoverFrom?: ProviderName;
}

// =============================================================================
// Legacy Implementation -> Delegates to Universal Router
// =============================================================================

/**
 * 텍스트를 생성합니다.
 * 
 * @deprecated universal-router.ts의 generateWithProvider를 사용하세요
 */
export async function generateWithProvider(options: GenerateOptions): Promise<GenerateResult> {
  // Universal Router 호출
  const result = await universalGenerate({
    prompt: options.prompt,
    featureType: legacyFeatureToNew(options.featureType),
    teacherId: options.teacherId,
    maxOutputTokens: options.maxOutputTokens,
    temperature: options.temperature,
    system: options.system,
  });

  // 레거시 형식으로 변환하여 반환
  return {
    text: result.text,
    usage: result.usage,
    provider: newProviderToLegacy(result.provider) ?? 'ollama',
    model: result.model,
    wasFailover: result.wasFailover,
    failoverFrom: result.failoverFrom 
      ? (newProviderToLegacy(result.failoverFrom) ?? undefined)
      : undefined,
  };
}

/**
 * 텍스트를 스트리밍합니다.
 * 
 * @deprecated universal-router.ts의 streamWithProvider를 사용하세요
 */
export async function streamWithProvider(options: GenerateOptions) {
  // Universal Router 호출
  const result = await universalStream({
    prompt: options.prompt,
    featureType: legacyFeatureToNew(options.featureType),
    teacherId: options.teacherId,
    maxOutputTokens: options.maxOutputTokens,
    temperature: options.temperature,
    system: options.system,
  });

  // 레거시 형식으로 변환하여 반환
  return {
    stream: result.stream,
    provider: newProviderToLegacy(result.provider) ?? 'ollama',
    model: result.model,
  };
}

/**
 * 특정 제공자로 텍스트를 생성합니다.
 * 
 * @deprecated universal-router.ts의 generateWithSpecificProvider를 사용하세요
 */
export async function generateWithSpecificProvider(
  provider: ProviderName,
  options: Omit<GenerateOptions, 'featureType'> & { featureType?: FeatureType }
): Promise<GenerateResult> {
  // Universal Router 호출
  const result = await universalGenerateSpecific(provider, {
    prompt: options.prompt,
    featureType: options.featureType ? legacyFeatureToNew(options.featureType) : undefined,
    teacherId: options.teacherId,
    maxOutputTokens: options.maxOutputTokens,
    temperature: options.temperature,
    system: options.system,
  });

  // 레거시 형식으로 변환하여 반환
  return {
    text: result.text,
    usage: result.usage,
    provider: newProviderToLegacy(result.provider) ?? provider,
    model: result.model,
    wasFailover: result.wasFailover,
  };
}

/**
 * Vision 기반 텍스트 생성 (이미지 분석)
 * 
 * @deprecated universal-router.ts의 generateWithVision를 사용하세요
 */
export async function generateWithVision(
  options: VisionGenerateOptions
): Promise<GenerateResult> {
  // Universal Router 호출
  const result = await universalGenerateVision({
    featureType: legacyFeatureToNew(options.featureType),
    teacherId: options.teacherId,
    maxOutputTokens: options.maxOutputTokens ?? 2048,
    temperature: options.temperature,
    system: options.system,
    imageBase64: options.imageBase64,
    mimeType: options.mimeType,
    prompt: options.prompt,
  });

  // 레거시 형식으로 변환하여 반환
  return {
    text: result.text,
    usage: result.usage,
    provider: newProviderToLegacy(result.provider) ?? 'ollama',
    model: result.model,
    wasFailover: result.wasFailover,
    failoverFrom: result.failoverFrom 
      ? (newProviderToLegacy(result.failoverFrom) ?? undefined)
      : undefined,
  };
}

/**
 * 특정 Vision 제공자로 이미지 분석
 * 
 * @deprecated universal-router.ts의 generateVisionWithSpecificProvider를 사용하세요
 */
export async function generateVisionWithSpecificProvider(
  provider: ProviderName,
  options: Omit<VisionGenerateOptions, 'featureType'> & { featureType?: FeatureType }
): Promise<GenerateResult> {
  // Universal Router 호출
  const result = await universalGenerateVisionSpecific(provider, {
    featureType: options.featureType ? legacyFeatureToNew(options.featureType) : undefined,
    teacherId: options.teacherId,
    maxOutputTokens: options.maxOutputTokens ?? 2048,
    temperature: options.temperature,
    system: options.system,
    imageBase64: options.imageBase64,
    mimeType: options.mimeType,
    prompt: options.prompt,
  });

  // 레거시 형식으로 변환하여 반환
  return {
    text: result.text,
    usage: result.usage,
    provider: newProviderToLegacy(result.provider) ?? provider,
    model: result.model,
    wasFailover: result.wasFailover,
  };
}
