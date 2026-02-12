/**
 * Anthropic Adapter
 *
 * Vercel AI SDK의 @ai-sdk/anthropic와 통합됩니다.
 */

import { anthropic, createAnthropic } from '@ai-sdk/anthropic';
import { generateText, streamText } from 'ai';
import type { LanguageModelV1 } from '@ai-sdk/provider';
import { BaseAdapter } from './base';
import type {
  ProviderConfig,
  GenerateOptions,
  GenerateResult,
  StreamResult,
  ValidationResult,
  ModelInfo,
  ModelParams,
} from '../types';

export class AnthropicAdapter extends BaseAdapter {
  readonly providerType = 'anthropic';
  readonly supportsVision = true;
  readonly supportsStreaming = true;
  readonly supportsTools = true;
  readonly supportsJsonMode = true;

  private apiKey: string = '';
  private baseUrl: string = 'https://api.anthropic.com/v1';

  createModel(modelId: string, config?: ProviderConfig): LanguageModelV1 {
    const effectiveConfig = config || ({} as ProviderConfig);
    const effectiveApiKey = effectiveConfig.apiKeyEncrypted
      ? this.decryptApiKey(effectiveConfig.apiKeyEncrypted)
      : this.apiKey;
    const effectiveBaseUrl = effectiveConfig.baseUrl || this.baseUrl;

    if (effectiveBaseUrl !== 'https://api.anthropic.com/v1' || effectiveApiKey) {
      const custom = createAnthropic({
        apiKey: effectiveApiKey,
        baseURL: effectiveBaseUrl,
      });
      return custom.chatModel(modelId);
    }

    return anthropic.chatModel(modelId);
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const model = options.model;

    const result = await generateText({
      model,
      prompt: options.prompt,
      messages: options.messages,
      system: options.system,
      maxTokens: options.maxTokens,
      temperature: options.temperature,
      topP: options.topP,
    });

    return {
      text: result.text,
      usage: result.usage,
    };
  }

  async stream(options: GenerateOptions): Promise<StreamResult> {
    const model = options.model;

    const result = streamText({
      model,
      prompt: options.prompt,
      messages: options.messages,
      system: options.system,
      maxTokens: options.maxTokens,
      temperature: options.temperature,
      topP: options.topP,
    });

    return {
      stream: result.textStream,
      provider: this.providerType,
      model: model.modelId,
    };
  }

  async validate(config: ProviderConfig): Promise<ValidationResult> {
    try {
      const apiKey = config.apiKeyEncrypted
        ? this.decryptApiKey(config.apiKeyEncrypted)
        : this.apiKey;

      if (!apiKey) {
        return {
          isValid: false,
          error: 'API 키가 설정되지 않았습니다.',
        };
      }

      const testModel = this.createModel('claude-3-5-haiku-latest', config);

      await generateText({
        model: testModel,
        prompt: 'Hello',
        maxTokens: 1,
      });

      return {
        isValid: true,
      };
    } catch (error) {
      return {
        isValid: false,
        error: this.handleError(error, 'validation').message,
      };
    }
  }

  async listModels(_config: ProviderConfig): Promise<ModelInfo[]> {
    return [
      {
        id: 'claude-sonnet-4-5',
        modelId: 'claude-sonnet-4-5',
        displayName: 'Claude Sonnet 4.5',
        contextWindow: 200000,
        supportsVision: true,
        supportsTools: true,
      },
      {
        id: 'claude-3-5-haiku-latest',
        modelId: 'claude-3-5-haiku-latest',
        displayName: 'Claude 3.5 Haiku',
        contextWindow: 200000,
        supportsVision: true,
        supportsTools: true,
      },
      {
        id: 'claude-3-opus-latest',
        modelId: 'claude-3-opus-latest',
        displayName: 'Claude 3 Opus',
        contextWindow: 200000,
        supportsVision: true,
        supportsTools: true,
      },
    ];
  }

  normalizeParams(params?: ModelParams): Record<string, unknown> {
    return {
      temperature: params?.temperature ?? 0.7,
      max_tokens: params?.maxTokens,
      top_p: params?.topP,
    };
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl;
  }

  protected buildHeaders(config: ProviderConfig): Record<string, string> {
    const apiKey = config.apiKeyEncrypted
      ? this.decryptApiKey(config.apiKeyEncrypted)
      : this.apiKey;

    return {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    };
  }

  protected getDefaultBaseUrl(): string {
    return 'https://api.anthropic.com/v1';
  }

  private decryptApiKey(encrypted: string | null): string {
    if (!encrypted) return '';
    try {
      const { decryptApiKey } = require('../encryption');
      return decryptApiKey(encrypted);
    } catch {
      return '';
    }
  }
}
