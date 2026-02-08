import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { ProviderName } from '@/lib/ai/providers';

// Open WebUI (OpenAI 호환) 테스트를 위한 함수
async function testOpenWebUI(baseUrl: string, apiKey: string): Promise<{ valid: boolean; response?: string; error?: string }> {
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama3.2:3b',
        messages: [{ role: 'user', content: 'Say "API key is valid" in one short sentence.' }],
        max_tokens: 20,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { valid: false, error: `HTTP ${response.status}: ${error}` };
    }

    const data = await response.json();
    return { 
      valid: true, 
      response: data.choices?.[0]?.message?.content || 'No response'
    };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

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
        case 'anthropic': {
          if (!apiKey) {
            return NextResponse.json({ valid: false, error: 'API key required' });
          }
          const anthropicProvider = createAnthropic({ apiKey });
          model = anthropicProvider('claude-3-5-haiku-latest');
          break;
        }

        case 'openai': {
          if (!apiKey) {
            return NextResponse.json({ valid: false, error: 'API key required' });
          }
          const openaiProvider = createOpenAI({ apiKey });
          model = openaiProvider('gpt-4o-mini');
          break;
        }

        case 'google': {
          if (!apiKey) {
            return NextResponse.json({ valid: false, error: 'API key required' });
          }
          const googleProvider = createGoogleGenerativeAI({ apiKey });
          model = googleProvider('gemini-2.0-flash');
          break;
        }

        case 'ollama': {
          const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://192.168.0.5:11434/api';
          const ollamaApiKey = process.env.OLLAMA_API_KEY;

          if (!ollamaApiKey) {
            clearTimeout(timeout);
            return NextResponse.json({ valid: false, error: 'Ollama API key required' });
          }

          // Open WebUI는 OpenAI 호환 API를 제공 - 직접 fetch 사용
          const result = await testOpenWebUI(ollamaUrl, ollamaApiKey);
          clearTimeout(timeout);
          return NextResponse.json(result);
        }

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
      
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('API key not valid')) {
        return NextResponse.json({ valid: false, error: 'API 키가 유효하지 않습니다' });
      }
      if (errorMessage.includes('quota') || errorMessage.includes('rate') || errorMessage.includes('credit balance')) {
        return NextResponse.json({ valid: true, error: 'API 키는 유효하지만 사용량 한도를 초과했습니다. 요금제를 확인하세요.' });
      }
      if (errorMessage.includes('abort') || errorMessage.includes('timeout')) {
        return NextResponse.json({ valid: false, error: '연결 시간 초과' });
      }
      if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('fetch failed')) {
        return NextResponse.json({ valid: false, error: '프로바이더에 연결할 수 없습니다' });
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
