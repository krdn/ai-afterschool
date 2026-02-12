'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Edit,
  Trash2,
  TestTube,
  Server,
  Sparkles,
  DollarSign,
  Gauge,
  ChevronDown,
  ChevronUp,
  Brain,
  Pin,
  Key,
} from 'lucide-react';
import type { ProviderWithModels } from '@/lib/ai/types';

interface ProviderCardProps {
  provider: ProviderWithModels;
  onEdit: () => void;
  onDelete: () => void;
  onTest: () => Promise<{ success: boolean; message: string }>;
  onToggle: (enabled: boolean) => void;
}

/**
 * 제공자 카드 컴포넌트
 * 
 * 개별 제공자의 정보를 표시하고 관리하는 카드 UI
 */
export function ProviderCard({
  provider,
  onEdit,
  onDelete,
  onTest,
  onToggle,
}: ProviderCardProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<{
    tested: boolean;
    success: boolean;
    message?: string;
  }>({
    tested: (provider as unknown as Record<string, unknown>).isValidated as boolean,
    success: (provider as unknown as Record<string, unknown>).isValidated as boolean,
  });

  const providerData = provider as unknown as Record<string, unknown>;
  const [showModels, setShowModels] = useState(false);

  // 연결 테스트 실행
  const handleTest = async () => {
    setIsTesting(true);
    try {
      const result = await onTest();
      setTestStatus({
        tested: true,
        success: result.success,
        message: result.message,
      });
    } catch (error) {
      setTestStatus({
        tested: true,
        success: false,
        message: error instanceof Error ? error.message : '테스트 실패',
      });
    } finally {
      setIsTesting(false);
    }
  };

  // 상태 배지 렌더링
  const renderStatusBadge = () => {
    if (!testStatus.tested) {
      return (
        <Badge variant="secondary" className="gap-1">
          <HelpCircle className="w-3 h-3" />
          미검증
        </Badge>
      );
    }

    if (testStatus.success) {
      return (
        <Badge
          variant="default"
          className="gap-1 bg-green-600 hover:bg-green-700"
        >
          <CheckCircle2 className="w-3 h-3" />
          연결됨
        </Badge>
      );
    }

    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="w-3 h-3" />
        연결 실패
      </Badge>
    );
  };

  // 활성화 상태 배지
  const renderEnabledBadge = () => (
    <Badge
      variant={providerData.isEnabled ? 'default' : 'secondary'}
      className={cn(
        'gap-1',
        providerData.isEnabled
          ? 'bg-blue-600 hover:bg-blue-700'
          : 'text-muted-foreground'
      )}
    >
      <Server className="w-3 h-3" />
      {providerData.isEnabled ? '활성' : '비활성'}
    </Badge>
  );

  // 기능 태그 렌더링
  const renderCapabilityBadges = () => {
    const caps = (providerData.capabilities as string[]) || [];
    if (caps.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1">
        {caps.slice(0, 4).map((cap) => (
          <Badge key={cap} variant="outline" className="text-xs">
            {getCapabilityLabel(cap)}
          </Badge>
        ))}
        {caps.length > 4 && (
          <Badge variant="outline" className="text-xs">
            +{caps.length - 4}
          </Badge>
        )}
      </div>
    );
  };

  // 티어 배지 렌더링
  const renderTierBadges = () => (
    <div className="flex items-center gap-2">
      <Badge
        variant="outline"
        className={cn('text-xs gap-1', getCostTierStyle(providerData.costTier as string))}
      >
        <DollarSign className="w-3 h-3" />
        {getCostTierLabel(providerData.costTier as string)}
      </Badge>

      <Badge
        variant="outline"
        className={cn('text-xs gap-1', getQualityTierStyle(providerData.qualityTier as string))}
      >
        <Gauge className="w-3 h-3" />
        {getQualityTierLabel(providerData.qualityTier as string)}
      </Badge>
    </div>
  );

  return (
    <Card className={cn('transition-all duration-200', !providerData.isEnabled && 'opacity-75')}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* 제공자 아이콘/이니셜 */}
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg font-bold">
              {String(providerData.name || '').charAt(0)}
            </div>

            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {String(providerData.name)}
                {Boolean(providerData.isDefault) && (
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                )}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {providerData.providerType as string}
                </Badge>
                {renderStatusBadge()}
                {renderEnabledBadge()}
              </div>
            </div>
          </div>

          {/* 활성화 토글 */}
          <div className="flex items-center gap-2">
            <Switch
              checked={providerData.isEnabled as boolean}
              onCheckedChange={onToggle}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* URL 정보 */}
        {providerData.baseUrl ? (
          <p className="text-sm text-muted-foreground truncate">
            {String(providerData.baseUrl)}
          </p>
        ) : null}

        {/* 기본 모델 (접힌 상태에서도 표시) */}
        {(() => {
          const defaultModel = provider.models?.find(m => m.isDefault);
          if (!defaultModel) return null;
          return (
            <div className="flex items-center gap-2 text-sm">
              <Pin className="w-4 h-4 text-yellow-500" />
              <span className="font-medium">기본 모델:</span>
              <span>{defaultModel.displayName}</span>
              {defaultModel.contextWindow && (
                <Badge variant="secondary" className="text-[10px] h-4 px-1">
                  {formatContextWindow(defaultModel.contextWindow)}
                </Badge>
              )}
            </div>
          );
        })()}

        {/* API 키 상태 - hasApiKey 필드 사용 */}
        <div className="flex items-center gap-2 text-sm">
          <Key className={cn(
            "w-4 h-4",
            (providerData.hasApiKey || providerData.apiKey) ? "text-green-500" : "text-muted-foreground"
          )} />
          <span className={cn(
            (providerData.hasApiKey || providerData.apiKey) ? "text-green-600 font-medium" : "text-muted-foreground"
          )}>
            {(providerData.hasApiKey || providerData.apiKey) ? "✓ API 키 설정됨" : "API 키 없음"}
          </span>
        </div>

        {/* 모델 수 & 토글 */}
        <div 
          className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors"
          onClick={() => setShowModels(!showModels)}
        >
          <Server className="w-4 h-4 text-muted-foreground" />
          <span>{(provider.models?.length || 0)}개 모델 등록됨</span>
          {showModels ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>

        {/* 모델 리스트 */}
        {showModels && provider.models && provider.models.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground mb-2">등록된 모델:</p>
            <div className="space-y-1">
              {provider.models.map((model) => (
                <div
                  key={model.id}
                  className={cn(
                    "flex items-center gap-2 text-sm py-1 px-2 rounded",
                    model.isDefault 
                      ? "bg-yellow-50 border border-yellow-200 hover:bg-yellow-100" 
                      : "hover:bg-muted"
                  )}
                >
                  {model.isDefault ? (
                    <Pin className="w-3 h-3 text-yellow-500" />
                  ) : (
                    <Brain className="w-3 h-3 text-muted-foreground" />
                  )}
                  <span className="font-medium">{model.displayName || model.modelId}</span>
                  {model.isDefault && (
                    <Badge className="bg-yellow-500 text-white text-[10px] h-4 px-1">
                      기본
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto flex items-center gap-2">
                    {model.contextWindow && (
                      <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {formatContextWindow(model.contextWindow)}
                      </span>
                    )}
                    <span>({model.modelId})</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 기능 태그 */}
        {renderCapabilityBadges()}

        {/* 티어 정보 */}
        {renderTierBadges()}

        {/* 액션 버튼들 */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={isTesting}
            className="gap-1"
          >
            <TestTube className="w-4 h-4" />
            {isTesting ? '테스트 중...' : '연결 테스트'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit()}
            className="gap-1"
          >
            <Edit className="w-4 h-4" />
            편집
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                삭제
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>제공자 삭제</AlertDialogTitle>
                <AlertDialogDescription>
                  정말로 <strong>{providerData.name as string}</strong> 제공자를 삭제하시겠습니까?
                  이 작업은 되돌릴 수 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  삭제
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

// 헬퍼 함수들
function getCapabilityLabel(capability: string): string {
  const labels: Record<string, string> = {
    vision: 'Vision',
    function_calling: 'Functions',
    json_mode: 'JSON',
    streaming: 'Streaming',
    tools: 'Tools',
  };
  return labels[capability] || capability;
}

function getCostTierLabel(tier: string): string {
  const labels: Record<string, string> = {
    free: '묶뤂',
    low: '저렴',
    medium: '중간',
    high: '고가',
  };
  return labels[tier] || tier;
}

function getCostTierStyle(tier: string): string {
  const styles: Record<string, string> = {
    free: 'text-green-600 border-green-600',
    low: 'text-blue-600 border-blue-600',
    medium: 'text-yellow-600 border-yellow-600',
    high: 'text-red-600 border-red-600',
  };
  return styles[tier] || '';
}

function getQualityTierLabel(tier: string): string {
  const labels: Record<string, string> = {
    fast: '빠름',
    balanced: '균형',
    premium: '프리미엄',
  };
  return labels[tier] || tier;
}

function getQualityTierStyle(tier: string): string {
  const styles: Record<string, string> = {
    fast: 'text-blue-600 border-blue-600',
    balanced: 'text-green-600 border-green-600',
    premium: 'text-purple-600 border-purple-600',
  };
  return styles[tier] || '';
}

/**
 * 컨텍스트 윈도우 포맷팅
 * 4000 -> 4K, 128000 -> 128K, 200000 -> 200K
 */
function formatContextWindow(n?: number | null): string {
  if (!n) return '';
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return `${n}`;
}

/**
 * API 키 마스킹
 * sk-abc123def456 -> sk-...456
 */
function maskApiKey(key: string): string {
  if (!key || key.length < 8) return key;
  const prefix = key.slice(0, 4);
  const suffix = key.slice(-4);
  return `${prefix}...${suffix}`;
}
