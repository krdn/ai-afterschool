export type ProviderName = 'anthropic' | 'openai' | 'google' | 'ollama' | 'deepseek' | 'mistral' | 'cohere' | 'xai';

export type FeatureType =
  | 'learning_analysis'   // 학습 분석
  | 'counseling_suggest'  // 상담 제안
  | 'report_generate'     // 보고서 생성
  | 'face_analysis'       // 관상 분석
  | 'palm_analysis'       // 손금 분석
  | 'personality_summary' // 통합 성향 분석
  | 'saju_analysis'       // 사주 해석
  | 'mbti_analysis'       // MBTI 해석
  | 'vark_analysis'       // VARK 학습유형 해석
  | 'name_analysis'       // 이름풀이 해석
  | 'zodiac_analysis';    // 별자리 운세 해석

export interface ProviderConfig {
  name: ProviderName;
  displayName: string;
  requiresApiKey: boolean;
  supportsVision: boolean;
  defaultModel: string;
  models: string[];
}

export interface FeatureConfig {
  featureType: FeatureType;
  primaryProvider: ProviderName;
  fallbackOrder: ProviderName[];
  modelOverride?: string;
}

export const PROVIDER_CONFIGS: Record<ProviderName, ProviderConfig> = {
  anthropic: {
    name: 'anthropic',
    displayName: 'Claude',
    requiresApiKey: true,
    supportsVision: true,
    defaultModel: 'claude-sonnet-4-5',
    models: ['claude-sonnet-4-5', 'claude-3-5-haiku-latest'],
  },
  openai: {
    name: 'openai',
    displayName: 'ChatGPT',
    requiresApiKey: true,
    supportsVision: true,
    defaultModel: 'gpt-4o',
    models: ['gpt-4o', 'gpt-4o-mini'],
  },
  google: {
    name: 'google',
    displayName: 'Gemini',
    requiresApiKey: true,
    supportsVision: true,
    defaultModel: 'gemini-2.5-flash-preview-05-20',
    models: ['gemini-2.5-flash-preview-05-20', 'gemini-2.0-flash'],
  },
  ollama: {
    name: 'ollama',
    displayName: 'Ollama',
    requiresApiKey: false,
    supportsVision: false,
    defaultModel: 'llama3.2:3b',
    models: [],  // 서버에서 동적으로 가져옴
  },
  deepseek: {
    name: 'deepseek',
    displayName: 'DeepSeek',
    requiresApiKey: true,
    supportsVision: false,
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
  },
  mistral: {
    name: 'mistral',
    displayName: 'Mistral',
    requiresApiKey: true,
    supportsVision: false,
    defaultModel: 'mistral-large-latest',
    models: ['mistral-large-latest', 'mistral-small-latest', 'codestral-latest'],
  },
  cohere: {
    name: 'cohere',
    displayName: 'Cohere',
    requiresApiKey: true,
    supportsVision: false,
    defaultModel: 'command-r-plus',
    models: ['command-r-plus', 'command-r'],
  },
  xai: {
    name: 'xai',
    displayName: 'Grok',
    requiresApiKey: true,
    supportsVision: true,
    defaultModel: 'grok-3',
    models: ['grok-3', 'grok-3-mini'],
  },
};

// 비용 per 1M tokens (USD, 2026 기준)
export const COST_PER_MILLION_TOKENS: Record<ProviderName, { input: number; output: number }> = {
  anthropic: { input: 3.0, output: 15.0 },    // Sonnet 4.5
  openai: { input: 2.5, output: 10.0 },        // GPT-4o
  google: { input: 0.30, output: 2.50 },       // Gemini 2.5 Flash
  ollama: { input: 0, output: 0 },             // Local, free
  deepseek: { input: 0.27, output: 1.10 },     // DeepSeek V3
  mistral: { input: 2.0, output: 6.0 },        // Mistral Large
  cohere: { input: 2.5, output: 10.0 },        // Command R+
  xai: { input: 3.0, output: 15.0 },           // Grok-3
};
