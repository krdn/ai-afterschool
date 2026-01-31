'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Check, X, Eye, EyeOff } from 'lucide-react';
import { saveLLMConfigAction, testProviderAction } from '@/lib/actions/llm-settings';
import type { ProviderName, ProviderConfig } from '@/lib/ai/providers';

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
};

export function ProviderCard({ provider, config, savedConfig }: ProviderCardProps) {
  const [isEnabled, setIsEnabled] = useState(savedConfig?.isEnabled ?? false);
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState(savedConfig?.baseUrl ?? '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; error?: string } | null>(null);
  const [isValidated, setIsValidated] = useState(savedConfig?.isValidated ?? false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveLLMConfigAction({
        provider,
        apiKey: apiKey || undefined,
        isEnabled,
        baseUrl: config.name === 'ollama' ? baseUrl : undefined,
      });
      
      if (apiKey) {
        setIsValidated(false);
        setApiKey('');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!apiKey && config.requiresApiKey) {
      setTestResult({ valid: false, error: 'API key is required' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await testProviderAction(provider, apiKey);
      setTestResult(result);
      if (result.valid) {
        setIsValidated(true);
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
              <p className="text-sm text-muted-foreground">
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
          <Label>기본 모델</Label>
          <p className="text-sm text-muted-foreground">
            {savedConfig?.defaultModel || config.defaultModel}
          </p>
          <p className="text-xs text-muted-foreground">
            사용 가능: {config.models.join(', ')}
          </p>
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
