import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { createOllama } from 'ollama-ai-provider-v2';
import type { ProviderName } from './types';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://192.168.0.5:11434/api';

export const providers = {
  anthropic: (model?: string) => anthropic(model || 'claude-sonnet-4-5'),
  openai: (model?: string) => openai(model || 'gpt-4o'),
  google: (model?: string) => google(model || 'gemini-2.5-flash-preview-05-20'),
  ollama: (model?: string) => {
    const ollamaInstance = createOllama({ baseURL: OLLAMA_BASE_URL });
    return ollamaInstance(model || 'llama3.1:8b');
  },
} as const;

export function getProvider(name: ProviderName, model?: string) {
  const providerFn = providers[name];
  if (!providerFn) {
    throw new Error(`Unknown provider: ${name}`);
  }
  return providerFn(model);
}

export * from './types';
