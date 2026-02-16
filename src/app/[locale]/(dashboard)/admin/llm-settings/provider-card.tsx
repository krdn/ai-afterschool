'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Check, X, Eye, EyeOff } from 'lucide-react';
import { saveLLMConfigAction, testProviderAction, getOllamaModelsAction } from '@/lib/actions/admin/llm-settings';
import type { ProviderName, ProviderConfig } from '@/lib/ai/providers/types';

interface ProviderCardProps {
  provider: ProviderName;
  config: ProviderConfig;
  savedConfig?: {
    isEnabled: boolean;
    isValidated: boolean;
    validatedAt: Date | null;
    apiKeyMasked: string | null;
    baseUrl: string | null;
    defaultModel: string | null;
  };
}

const PROVIDER_COLORS: Record<ProviderName, string> = {
  anthropic: 'bg-orange-100 text-orange-700 border-orange-200',
  openai: 'bg-green-100 text-green-700 border-green-200',
  google: 'bg-blue-100 text-blue-700 border-blue-200',
  ollama: 'bg-purple-100 text-purple-700 border-purple-200',
  deepseek: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  mistral: 'bg-amber-100 text-amber-700 border-amber-200',
  cohere: 'bg-rose-100 text-rose-700 border-rose-200',
  xai: 'bg-slate-100 text-slate-700 border-slate-200',
  zhipu: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  moonshot: 'bg-violet-100 text-violet-700 border-violet-200',
  openrouter: 'bg-teal-100 text-teal-700 border-teal-200',
};

export function ProviderCard({ provider, config, savedConfig }: ProviderCardProps) {
  const [isEnabled, setIsEnabled] = useState(savedConfig?.isEnabled ?? false);
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState(savedConfig?.baseUrl || (provider === 'ollama' ? 'http://192.168.0.5:11434/api' : ''));
  const [defaultModel, setDefaultModel] = useState(savedConfig?.defaultModel ?? config.defaultModel);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; error?: string } | null>(null);
  const [isValidated, setIsValidated] = useState(savedConfig?.isValidated ?? false);
  const [ollamaModels, setOllamaModels] = useState<{ name: string; size: number }[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveLLMConfigAction({
        provider,
        apiKey: apiKey || undefined,
        isEnabled,
        baseUrl: config.name === 'ollama' ? baseUrl : undefined,
        defaultModel,
      });

      if (apiKey) {
        setIsValidated(false);
        setApiKey('');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const loadOllamaModels = async () => {
    setIsLoadingModels(true);
    try {
      const models = await getOllamaModelsAction();
      setOllamaModels(models);
    } catch (error) {
      console.error('Failed to load Ollama models:', error);
    } finally {
      setIsLoadingModels(false);
    }
  };

  useEffect(() => {
    if (provider === 'ollama') {
      loadOllamaModels();
    }
  }, [provider]);

  const handleTest = async () => {
    // 새 키가 없고, 저장된 키도 없으면 검증 불가
    if (!apiKey && !savedConfig?.apiKeyMasked && config.requiresApiKey) {
      setTestResult({ valid: false, error: 'API 키를 입력해주세요' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      // 새 키가 있으면 먼저 저장한 후 검증
      if (apiKey) {
        await saveLLMConfigAction({
          provider,
          apiKey,
          isEnabled: true,
          baseUrl: config.name === 'ollama' ? baseUrl : undefined,
          defaultModel,
        });
      }

      // 서버에서 저장된 키(또는 방금 저장한 키)로 검증
      const result = await testProviderAction(provider, apiKey || undefined);
      setTestResult(result);
      if (result.valid) {
        setIsValidated(true);
        setIsEnabled(true);
        if (apiKey) setApiKey('');
      }
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className={`border-2 ${isEnabled ? 'border-primary' : 'border-muted'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg border ${PROVIDER_COLORS[provider]}`}>
              {config.displayName.charAt(0)}
            </div>
            <div>
              <CardTitle className="text-lg">{config.displayName}</CardTitle>
              <CardDescription>
                {config.supportsVision ? '텍스트 + 비전' : '텍스트 전용'}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isValidated && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <Check className="h-3 w-3" /> 검증됨
              </span>
            )}
            <Switch
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
              disabled={isSaving}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {config.requiresApiKey && (
          <div className="space-y-2">
            <Label htmlFor={`${provider}-apikey`}>API Key</Label>
            {savedConfig?.apiKeyMasked && !apiKey && (
              <p data-testid="api-key-display" className="text-sm text-muted-foreground">
                현재: <code className="bg-muted px-1 rounded">{savedConfig.apiKeyMasked}</code>
              </p>
            )}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id={`${provider}-apikey`}
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="새 API 키 입력..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTest}
                disabled={isTesting || (!apiKey && !savedConfig?.apiKeyMasked)}
              >
                {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : '검증'}
              </Button>
            </div>
            
            {testResult && (
              <div className={`text-sm flex items-center gap-1 ${testResult.valid ? 'text-green-600' : 'text-red-600'}`}>
                {testResult.valid ? (
                  <>
                    <Check className="h-4 w-4" /> API 키가 유효합니다
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4" /> {testResult.error}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {provider === 'ollama' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`${provider}-baseurl`}>Ollama Server URL</Label>
              <Input
                id={`${provider}-baseurl`}
                placeholder="http://192.168.0.5:11434/api"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Ollama 서버 주소. 로컬 Docker 사용 시 명시적 IP 필요
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${provider}-apikey`}>API Key <span className="text-muted-foreground font-normal">(선택)</span></Label>
              {savedConfig?.apiKeyMasked && !apiKey && (
                <p className="text-sm text-muted-foreground">
                  현재: <code className="bg-muted px-1 rounded">{savedConfig.apiKeyMasked}</code>
                </p>
              )}
              <div className="relative">
                <Input
                  id={`${provider}-apikey`}
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="인증이 필요한 경우 API 키 입력..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Ollama 서버에 인증이 설정된 경우에만 입력
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={isTesting}
            >
              {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : '연결 테스트'}
            </Button>
            {testResult && (
              <div className={`text-sm flex items-center gap-1 ${testResult.valid ? 'text-green-600' : 'text-red-600'}`}>
                {testResult.valid ? (
                  <>
                    <Check className="h-4 w-4" /> 연결 성공
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4" /> {testResult.error}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor={`${provider}-model`}>기본 모델</Label>
          {provider === 'ollama' ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <select
                  id={`${provider}-model`}
                  value={defaultModel}
                  onChange={(e) => setDefaultModel(e.target.value)}
                  disabled={isLoadingModels}
                  className="flex-1 px-3 py-2 border rounded-md bg-white text-sm disabled:opacity-50"
                >
                  {isLoadingModels ? (
                    <option>모델 불러오는 중...</option>
                  ) : ollamaModels.length === 0 ? (
                    <option value={defaultModel}>{defaultModel}</option>
                  ) : (
                    ollamaModels.map((m) => (
                      <option key={m.name} value={m.name}>
                        {m.name} ({(m.size / 1e9).toFixed(1)}GB)
                      </option>
                    ))
                  )}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadOllamaModels}
                  disabled={isLoadingModels}
                >
                  {isLoadingModels ? <Loader2 className="h-4 w-4 animate-spin" /> : '새로고침'}
                </Button>
              </div>
              {ollamaModels.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Ollama 서버에서 {ollamaModels.length}개 모델 로드됨
                </p>
              )}
            </div>
          ) : (
            <select
              id={`${provider}-model`}
              value={defaultModel}
              onChange={(e) => setDefaultModel(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-white text-sm"
            >
              {config.models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          )}
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 저장 중...
            </>
          ) : (
            '설정 저장'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
