import { createOllama } from 'ollama-ai-provider-v2';
import { generateText } from 'ai';

export function getOllamaBaseUrl(): string {
  return process.env.OLLAMA_BASE_URL || 'http://192.168.0.5:11434/api';
}

export function createOllamaInstance() {
  return createOllama({
    baseURL: getOllamaBaseUrl(),
  });
}

interface OllamaConnectionResult {
  connected: boolean;
  baseUrl: string;
  error?: string;
  responseTimeMs?: number;
}

export async function testOllamaConnection(): Promise<OllamaConnectionResult> {
  const baseUrl = getOllamaBaseUrl();
  const startTime = Date.now();

  try {
    const versionUrl = baseUrl.replace('/api', '/api/version');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(versionUrl, {
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return {
        connected: false,
        baseUrl,
        error: `HTTP ${response.status}: ${response.statusText}`,
        responseTimeMs: Date.now() - startTime,
      };
    }

    return {
      connected: true,
      baseUrl,
      responseTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      connected: false,
      baseUrl,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTimeMs: Date.now() - startTime,
    };
  }
}

interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
}

export async function getOllamaModels(): Promise<OllamaModel[]> {
  const baseUrl = getOllamaBaseUrl();

  try {
    const tagsUrl = baseUrl.replace('/api', '/api/tags');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(tagsUrl, {
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error('Failed to fetch Ollama models:', response.statusText);
      return [];
    }

    const data = await response.json();
    return data.models || [];
  } catch (error) {
    console.error('Failed to fetch Ollama models:', error);
    return [];
  }
}

export async function testOllamaGeneration(model = 'llama3.1:8b'): Promise<{
  success: boolean;
  response?: string;
  error?: string;
  responseTimeMs: number;
}> {
  const startTime = Date.now();

  try {
    const ollama = createOllamaInstance();
    const ollamaModel = ollama(model);

    const result = await generateText({
      model: ollamaModel,
      prompt: 'Say "Hello, Ollama is working!" in one short sentence.',
      maxOutputTokens: 20,
    });

    return {
      success: true,
      response: result.text,
      responseTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTimeMs: Date.now() - startTime,
    };
  }
}

export async function checkOllamaHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unavailable';
  connection: OllamaConnectionResult;
  models: OllamaModel[];
  canGenerate: boolean;
}> {
  const connection = await testOllamaConnection();

  if (!connection.connected) {
    return {
      status: 'unavailable',
      connection,
      models: [],
      canGenerate: false,
    };
  }

  const models = await getOllamaModels();

  if (models.length === 0) {
    return {
      status: 'degraded',
      connection,
      models: [],
      canGenerate: false,
    };
  }

  const genTest = await testOllamaGeneration(models[0].name);

  return {
    status: genTest.success ? 'healthy' : 'degraded',
    connection,
    models,
    canGenerate: genTest.success,
  };
}
