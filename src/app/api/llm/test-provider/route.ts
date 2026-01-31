import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { createOllama } from 'ollama-ai-provider-v2';
import type { ProviderName } from '@/lib/ai/providers';

const TIMEOUT_MS = 10000;

export async function POST(request: Request) {
  try {
    const { provider, apiKey } = await request.json() as {
      provider: ProviderName;
      apiKey?: string;
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      let model;

      switch (provider) {
        case 'anthropic':
          if (!apiKey) {
            return NextResponse.json({ valid: false, error: 'API key required' });
          }
          process.env.ANTHROPIC_API_KEY = apiKey;
          model = anthropic('claude-3-5-haiku-latest');
          break;

        case 'openai':
          if (!apiKey) {
            return NextResponse.json({ valid: false, error: 'API key required' });
          }
          process.env.OPENAI_API_KEY = apiKey;
          model = openai('gpt-4o-mini');
          break;

        case 'google':
          if (!apiKey) {
            return NextResponse.json({ valid: false, error: 'API key required' });
          }
          process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey;
          model = google('gemini-2.0-flash');
          break;

        case 'ollama':
          const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://192.168.0.5:11434/api';
          const ollamaInstance = createOllama({ baseURL: ollamaUrl });
          model = ollamaInstance('llama3.1:8b');
          break;

        default:
          return NextResponse.json({ valid: false, error: 'Unknown provider' });
      }

      const result = await generateText({
        model,
        prompt: 'Say "API key is valid" in one short sentence.',
        maxOutputTokens: 20,
        abortSignal: controller.signal,
      });

      clearTimeout(timeout);

      return NextResponse.json({ 
        valid: true, 
        response: result.text,
        usage: result.usage,
      });
    } catch (error) {
      clearTimeout(timeout);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        return NextResponse.json({ valid: false, error: 'Invalid API key' });
      }
      if (errorMessage.includes('abort') || errorMessage.includes('timeout')) {
        return NextResponse.json({ valid: false, error: 'Connection timeout' });
      }
      if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('fetch failed')) {
        return NextResponse.json({ valid: false, error: 'Cannot connect to provider' });
      }

      return NextResponse.json({ valid: false, error: errorMessage });
    }
  } catch (error) {
    return NextResponse.json({ 
      valid: false, 
      error: error instanceof Error ? error.message : 'Request parsing failed' 
    }, { status: 400 });
  }
}
