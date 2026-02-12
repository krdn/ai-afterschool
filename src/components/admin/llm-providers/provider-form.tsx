'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { InlineHelp } from '@/components/help/inline-help';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import {
  createProviderFromTemplateAction,
  updateProviderAction,
  validateProviderAction,
  syncProviderModelsAction,
} from '@/lib/actions/provider-actions';
import type { ProviderWithModels, ProviderInput, Capability } from '@/lib/ai/types';
import type { ProviderTemplate } from '@/lib/ai/templates';

// Zod 스키마 정의
const providerFormSchema = z.object({
  name: z.string().min(1, '제공자명을 입력해주세요').max(100, '100자 이내로 입력해주세요'),
  providerType: z.enum([
    'openai',
    'anthropic',
    'google',
    'ollama',
    'deepseek',
    'mistral',
    'cohere',
    'xai',
    'zhipu',
    'moonshot',
    'custom',
  ]),
  baseUrl: z.string().url('올바른 URL을 입력해주세요').optional().or(z.literal('')),
  authType: z.enum(['api_key', 'bearer', 'custom_header']),
  customAuthHeader: z.string().optional(),
  apiKey: z.string().optional(),
  capabilities: z.array(z.string()).default([]),
  costTier: z.enum(['free', 'low', 'medium', 'high']),
  qualityTier: z.enum(['fast', 'balanced', 'premium']),
  isEnabled: z.boolean().default(false),
});

type ProviderFormValues = z.infer<typeof providerFormSchema>;

interface ProviderFormProps {
  provider?: ProviderWithModels;
  template?: ProviderTemplate;
  onSuccess?: () => void;
}

const ALL_CAPABILITIES: { value: Capability; label: string; description: string }[] = [
  { value: 'vision', label: 'Vision', description: '이미지 인식 및 분석' },
  { value: 'function_calling', label: 'Function Calling', description: '함수 호출 지원' },
  { value: 'json_mode', label: 'JSON Mode', description: 'JSON 출력 형식' },
  { value: 'streaming', label: 'Streaming', description: '실시간 스트리밍 응답' },
  { value: 'tools', label: 'Tools', description: '도구 사용 지원' },
];

/**
 * 제공자 등록/수정 폼 컴포넌트
 * 
 * 템플릿 기반으로 생성하거나 직접 설정할 수 있습니다.
 */
export function ProviderForm({ provider, template, onSuccess }: ProviderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(
    null
  );
  const [syncedModels, setSyncedModels] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const isEditing = !!provider;

  // 폼 초기화
  const form = useForm<ProviderFormValues>({
    resolver: zodResolver(providerFormSchema),
    defaultValues: {
      name: '',
      providerType: 'custom',
      baseUrl: '',
      authType: 'api_key',
      customAuthHeader: '',
      apiKey: '',
      capabilities: [],
      costTier: 'medium',
      qualityTier: 'balanced',
      isEnabled: false,
    },
  });

  // 템플릿이나 기존 제공자로 폼 초기값 설정
  useEffect(() => {
    if (provider) {
      // 기존 제공자 수정
      form.reset({
        name: provider.name,
        providerType: provider.providerType as ProviderFormValues['providerType'],
        baseUrl: provider.baseUrl || '',
        authType: provider.authType as ProviderFormValues['authType'],
        customAuthHeader: provider.customAuthHeader || '',
        apiKey: '', // API 키는 표시하지 않음
        capabilities: provider.capabilities as Capability[],
        costTier: provider.costTier as ProviderFormValues['costTier'],
        qualityTier: provider.qualityTier as ProviderFormValues['qualityTier'],
        isEnabled: provider.isEnabled,
      });
    } else if (template) {
      // 템플릿 기반 새 제공자
      form.reset({
        name: template.name,
        providerType: template.providerType as ProviderFormValues['providerType'],
        baseUrl: template.defaultBaseUrl || '',
        authType: template.defaultAuthType as ProviderFormValues['authType'],
        customAuthHeader: template.customAuthHeaderName || '',
        apiKey: '',
        capabilities: template.defaultCapabilities,
        costTier: template.defaultCostTier as ProviderFormValues['costTier'],
        qualityTier: template.defaultQualityTier as ProviderFormValues['qualityTier'],
        isEnabled: false,
      });
    }
  }, [provider, template, form]);

  // 폼 제출 핸들러
  const onSubmit = async (values: ProviderFormValues) => {
    setIsSubmitting(true);
    setTestResult(null);

    try {
      const input: Partial<ProviderInput> = {
        ...values,
        baseUrl: values.baseUrl || undefined,
        customAuthHeader: values.customAuthHeader || undefined,
        apiKey: values.apiKey || undefined,
      };

      if (isEditing && provider) {
        // 수정
        await updateProviderAction(provider.id, input);
      } else if (template) {
        // 템플릿 기반 생성
        await createProviderFromTemplateAction(template.templateId, input);
      }

      onSuccess?.();
    } catch (error) {
      console.error('Failed to save provider:', error);
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : '저장에 실패했습니다.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 연결 테스트
  const handleTestConnection = async () => {
    if (!provider) {
      setTestResult({
        success: false,
        message: '먼저 제공자를 저장한 후 테스트할 수 있습니다.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await validateProviderAction(provider.id);
      setTestResult({
        success: result.isValid,
        message: result.isValid
          ? '연결 성공!'
          : `연결 실패: ${result.error || '알 수 없는 오류'}`,
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : '테스트 중 오류가 발생했습니다.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  // 모델 동기화
  const handleSyncModels = async () => {
    if (!provider) {
      setTestResult({
        success: false,
        message: '먼저 제공자를 저장한 후 동기화할 수 있습니다.',
      });
      return;
    }

    setIsSyncing(true);
    setTestResult(null);

    try {
      const models = await syncProviderModelsAction(provider.id);
      setSyncedModels(models.length);
      setTestResult({
        success: true,
        message: `${models.length}개의 모델이 동기화되었습니다.`,
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : '동기화 중 오류가 발생했습니다.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const authType = form.watch('authType');
  const selectedCapabilities = form.watch('capabilities');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* 기본 정보 카드 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    제공자명 *
                    <InlineHelp helpId="provider-name" />
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="예: OpenAI GPT-4" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="providerType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>제공자 타입 *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={!!template && template.templateId !== 'custom'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="타입을 선택하세요" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                      <SelectItem value="google">Google</SelectItem>
                      <SelectItem value="ollama">Ollama</SelectItem>
                      <SelectItem value="deepseek">DeepSeek</SelectItem>
                      <SelectItem value="mistral">Mistral AI</SelectItem>
                      <SelectItem value="cohere">Cohere</SelectItem>
                      <SelectItem value="xai">xAI (Grok)</SelectItem>
                      <SelectItem value="zhipu">Zhipu AI</SelectItem>
                      <SelectItem value="moonshot">Moonshot AI</SelectItem>
                      <SelectItem value="custom">Custom (OpenAI 호환)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* 연결 설정 카드 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">연결 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="baseUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    Base URL
                    <InlineHelp helpId="provider-custom" />
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://api.example.com/v1" />
                  </FormControl>
                  <FormDescription>
                    {template?.defaultBaseUrl
                      ? `기본값: ${template.defaultBaseUrl}`
                      : 'API 엔드포인트 URL을 입력하세요'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="authType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>인증 방식 *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="인증 방식을 선택하세요" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="api_key">API Key</SelectItem>
                      <SelectItem value="bearer">Bearer Token</SelectItem>
                      <SelectItem value="custom_header">Custom Header</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {authType === 'custom_header' && (
              <FormField
                control={form.control}
                name="customAuthHeader"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Header 이름 *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="X-API-Key" />
                    </FormControl>
                    <FormDescription>HTTP 헤더 이름을 입력하세요</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    {isEditing ? 'API 키 (변경 시에만 입력)' : 'API 키 *'}
                    <InlineHelp helpId="api-key-guide" />
                  </FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="sk-..." />
                  </FormControl>
                  {template?.apiKeyInstructions && (
                    <FormDescription>{template.apiKeyInstructions}</FormDescription>
                  )}
                  {template?.apiKeyUrl && (
                    <FormDescription>
                      <a
                        href={template.apiKeyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        API 키 발급 페이지 →
                      </a>
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* 기능 및 티어 설정 카드 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">기능 및 티어</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 기능 태그 */}
            <div>
              <FormLabel className="text-base flex items-center gap-1">
                지원 기능
                <InlineHelp helpId="capabilities" />
              </FormLabel>
              <div className="grid grid-cols-2 gap-4 mt-3">
                {ALL_CAPABILITIES.map((cap) => (
                  <FormField
                    key={cap.value}
                    control={form.control}
                    name="capabilities"
                    render={({ field }) => {
                      return (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(cap.value)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, cap.value])
                                  : field.onChange(
                                      field.value?.filter((value) => value !== cap.value)
                                    );
                              }}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              {cap.label}
                            </FormLabel>
                            <FormDescription>{cap.description}</FormDescription>
                          </div>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="border-t my-4" />

            {/* 비용 티어 */}
            <FormField
              control={form.control}
              name="costTier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>비용 등급 *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="비용 등급을 선택하세요" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="free">묶뤂</SelectItem>
                      <SelectItem value="low">저렴</SelectItem>
                      <SelectItem value="medium">중간</SelectItem>
                      <SelectItem value="high">고가</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 품질 티어 */}
            <FormField
              control={form.control}
              name="qualityTier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>품질 등급 *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="품질 등급을 선택하세요" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="fast">빠름</SelectItem>
                      <SelectItem value="balanced">균형</SelectItem>
                      <SelectItem value="premium">프리미엄</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* 모델 설정 - 수정 모드에서만 표시 */}
        {isEditing && provider?.models && provider.models.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">모델 설정</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <label className="text-sm font-medium">기본 모델</label>
                <Select
                  value={selectedModel || ''}
                  onValueChange={setSelectedModel}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="모델을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {provider.models.map((model) => (
                      <SelectItem key={model.id} value={model.modelId}>
                        {model.displayName || model.modelId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  이 제공자의 기본 모델을 선택합니다.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 상태 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">상태</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="isEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">활성화</FormLabel>
                    <FormDescription>
                      활성화하면 라우터에서 이 제공자를 사용할 수 있습니다
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* 테스트 결과 알림 */}
        {testResult && (
          <Alert variant={testResult.success ? 'default' : 'destructive'}>
            {testResult.success ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{testResult.message}</AlertDescription>
          </Alert>
        )}

        {/* 동기화된 모델 표시 */}
        {syncedModels !== null && testResult?.success && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{syncedModels}개 모델 동기화됨</Badge>
          </div>
        )}

        {/* 액션 버튼들 */}
        <div className="flex flex-wrap gap-3 pt-4">
          {isEditing && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={isTesting || isSubmitting}
              >
                {isTesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    테스트 중...
                  </>
                ) : (
                  '연결 테스트'
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleSyncModels}
                disabled={isSyncing || isSubmitting}
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    동기화 중...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    모델 동기화
                  </>
                )}
              </Button>
            </>
          )}

          <div className="flex-1" />

          <Button
            type="button"
            variant="outline"
            onClick={() => onSuccess?.()}
            disabled={isSubmitting}
          >
            취소
          </Button>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                저장 중...
              </>
            ) : isEditing ? (
              '저장'
            ) : (
              '등록'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
