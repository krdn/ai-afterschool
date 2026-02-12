/**
 * Ollama Adapter
 *
 * Vercel AI SDK의 ollama-ai-provider-v2와 통합됩니다.
 * 로컬/원격 Ollama 서버 및 Open WebUI 프록시를 지원합니다.
 */

import { createOllama } from 'ollama-ai-provider-v2';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText, streamText, type LanguageModel } from 'ai';
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

export class OllamaAdapter extends BaseAdapter {
  readonly providerType = 'ollama';
  readonly supportsVision = true;
  readonly supportsStreaming = true;
  readonly supportsTools = false;
  readonly supportsJsonMode = false;

  private apiKey: string = '';
  private baseUrl: string = 'http://localhost:11434/api';

  createModel(modelId: string, config?: ProviderConfig): LanguageModel {
    const effectiveConfig = config || ({} as ProviderConfig);
    const effectiveApiKey = effectiveConfig.apiKeyEncrypted
      ? this.decryptApiKey(effectiveConfig.apiKeyEncrypted)
      : this.apiKey;
    const effectiveBaseUrl = effectiveConfig.baseUrl || this.baseUrl;

    // API 키가 있으면 Open WebUI 프록시 → OpenAI 호환 API 사용
    if (effectiveApiKey) {
      const provider = createOpenAICompatible({
        name: 'ollama-proxy',
        baseURL: this.ensureHttps(effectiveBaseUrl),
        apiKey: effectiveApiKey,
      });
      return provider(modelId);
    }

    // 직접 Ollama 서버 → 네이티브 API
    return createOllama({
      baseURL: this.ensureHttps(effectiveBaseUrl),
    })(modelId);
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const model = options.model;

    const result = await generateText({
      model,
      ...(options.messages 
        ? { messages: options.messages }
        : { prompt: options.prompt || '' }
      ),
      system: options.system,
      maxOutputTokens: options.maxTokens,
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
      ...(options.messages 
        ? { messages: options.messages }
        : { prompt: options.prompt || '' }
      ),
      system: options.system,
      maxOutputTokens: options.maxTokens,
      temperature: options.temperature,
      topP: options.topP,
    });

    return {
      stream: result.textStream,
      provider: this.providerType,
      model: 'unknown',
    };
  }

  async validate(config: ProviderConfig): Promise<ValidationResult> {
    try {
      const baseUrl = this.ensureHttps(config.baseUrl || this.baseUrl);
      const apiKey = config.apiKeyEncrypted
        ? this.decryptApiKey(config.apiKeyEncrypted)
        : this.apiKey;

      // 연결 테스트 - /api/version 호출
      const versionUrl = baseUrl.replace(/\/api$/, '/api/version');

      console.log('[OllamaAdapter] Validating URL:', versionUrl);

      const controller = new AbortController();
      const timeout = setTimeout(() => {
        console.log('[OllamaAdapter] Timeout after 10s');
        controller.abort();
      }, 10000);

      const headers: Record<string, string> = {};
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(versionUrl, {
        signal: controller.signal,
        headers,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        return {
          isValid: false,
          error: `Ollama 서버 연결 실패: HTTP ${response.status}`,
        };
      }

      return {
        isValid: true,
      };
    } catch (error) {
      console.error('[OllamaAdapter] Validation error:', error);
      
      // 더 구체적인 오류 메시지
      let errorMessage = '알 수 없는 오류';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = '연결 시간 초과 (10초). 서버가 접근 가능한지 확인하세요.';
        } else if (error.message.includes('ECONNREFUSED')) {
          errorMessage = '연결 거부됨. 서버가 실행 중인지 확인하세요.';
        } else if (error.message.includes('ENOTFOUND')) {
          errorMessage = '호스트를 찾을 수 없음. URL을 확인하세요.';
        } else {
          errorMessage = error.message;
        }
      }
      
      return {
        isValid: false,
        error: `[Ollama] ${errorMessage}`,
      };
    }
  }

  async listModels(config: ProviderConfig): Promise<ModelInfo[]> {
    const baseUrl = this.ensureHttps(config.baseUrl || this.baseUrl);
    const apiKey = config.apiKeyEncrypted
      ? this.decryptApiKey(config.apiKeyEncrypted)
      : this.apiKey;
    const isProxy = !!apiKey;

    try {
      const modelsUrl = isProxy
        ? baseUrl.replace(/\/api$/, '/api/models')
        : baseUrl.replace(/\/api$/, '/api/tags');

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const headers: Record<string, string> = {};
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(modelsUrl, {
        signal: controller.signal,
        headers,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        return [];
      }

      const data = await response.json();

      // Open WebUI 프록시
      if (isProxy && data.data) {
        return data.data
          .filter((m: { ollama?: unknown }) => m.ollama)
          .map((m: { id: string; name: string; ollama?: { size?: number } }) => ({
            id: m.id,
            modelId: m.id,
            displayName: m.name || m.id,
            contextWindow: 8192,
            supportsVision: m.id.includes('vision') || m.id.includes('llava'),
            supportsTools: false,
          }));
      }

      // 직접 Ollama
      const models = data.models || [];
      return models.map((m: { name: string }) => ({
        id: m.name,
        modelId: m.name,
        displayName: m.name,
        contextWindow: 8192,
        supportsVision: m.name.includes('vision') || m.name.includes('llava'),
        supportsTools: false,
      }));
    } catch {
      return [];
    }
  }

  normalizeParams(params?: ModelParams): Record<string, unknown> {
    return {
      temperature: params?.temperature ?? 0.7,
      num_predict: params?.maxTokens,
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
    const headers: Record<string, string> = {};
    const apiKey = config.apiKeyEncrypted
      ? this.decryptApiKey(config.apiKeyEncrypted)
      : this.apiKey;

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    return headers;
  }

  protected getDefaultBaseUrl(): string {
    return 'http://localhost:11434/api';
  }

  /**
   * 외부 도메인의 HTTP URL을 HTTPS로 변환합니다.
   * 로컬 IP/localhost는 HTTP 유지.
   */
  private ensureHttps(url: string): string {
    if (!url.startsWith('http://')) return url;
    try {
      const parsed = new URL(url);
      const host = parsed.hostname;
      // 로컬 주소는 HTTP 유지
      if (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host.startsWith('192.168.') ||
        host.startsWith('10.') ||
        host.startsWith('172.')
      ) {
        return url;
      }
      return url.replace(/^http:\/\//, 'https://');
    } catch {
      return url;
    }
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
