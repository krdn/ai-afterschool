'use client';

/**
 * Resolution Preview Component
 * 
 * 기능별 LLM 매핑의 해결 결과를 미리 보여주는 컴포넌트
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ArrowDown, CheckCircle2, RefreshCw, Server } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveFeatureAction, getResolutionChainAction } from '@/lib/actions/admin/feature-mappings';
import type { ResolutionRequirements } from '@/lib/ai/types';

interface ResolutionPreviewProps {
  featureType: string;
  requirements?: ResolutionRequirements;
}

interface ResolutionResult {
  provider: {
    id: string;
    name: string;
    providerType: string;
  };
  model: {
    id: string;
    modelId: string;
    displayName: string;
    contextWindow: number | null;
    supportsVision: boolean;
    supportsTools: boolean;
  };
  priority: number;
}

interface ResolutionChainItem extends ResolutionResult {
  fallbackMode: string;
}

export function ResolutionPreview({ featureType, requirements }: ResolutionPreviewProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [primaryResult, setPrimaryResult] = useState<ResolutionResult | null>(null);
  const [fallbackChain, setFallbackChain] = useState<ResolutionChainItem[]>([]);

  const handlePreview = async () => {
    setLoading(true);
    setError(null);

    try {
      // 폴 백 체인 전체를 가져옵니다
      const chainResult = await getResolutionChainAction(featureType);

      if (!chainResult.success || !chainResult.data || chainResult.data.length === 0) {
        setError('해당 기능에 적합한 모델을 찾을 수 없습니다.');
        setPrimaryResult(null);
        setFallbackChain([]);
        return;
      }

      const chain = chainResult.data;
      setPrimaryResult(chain[0]);
      setFallbackChain(chain.slice(1));
    } catch (err) {
      setError(err instanceof Error ? err.message : '미리보기 로딩 중 오류가 발생했습니다.');
      setPrimaryResult(null);
      setFallbackChain([]);
    } finally {
      setLoading(false);
    }
  };

  const getFallbackModeLabel = (mode: string): string => {
    switch (mode) {
      case 'next_priority':
        return '다음 우선순위로';
      case 'any_available':
        return '사용 가능한 모델 중';
      case 'fail':
        return '실패 처리';
      default:
        return mode;
    }
  };

  const getFallbackModeDescription = (mode: string): string => {
    switch (mode) {
      case 'next_priority':
        return '첫 번째 모델 실패 시 다음 우선순위 모델로 폴 백';
      case 'any_available':
        return '규칙에 맞는 사용 가능한 모델 중 자동 선택';
      case 'fail':
        return '폴 백 없이 실패 처리';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      {/* 테스트 버튼 */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handlePreview}
          disabled={loading}
          variant="outline"
          className="gap-2"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Server className="h-4 w-4" />
          )}
          {loading ? '확인 중...' : '어떤 모델이 선택될지 미리보기'}
        </Button>
        {(primaryResult || error) && (
          <Button
            onClick={handlePreview}
            disabled={loading}
            variant="ghost"
            size="sm"
            className="gap-1"
          >
            <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} />
            새로고침
          </Button>
        )}
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {/* 에러 상태 */}
      {!loading && error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-medium text-destructive">모델을 찾을 수 없습니다</p>
                <p className="text-sm text-muted-foreground">{error}</p>
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md mt-3">
                  <p className="font-medium mb-1">제안:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>다른 태그 조합을 시도필보세요</li>
                    <li>제외 태그를 줄여보세요</li>
                    <li>직접 모델 지정 모드를 사용필보세요</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 1순위 결과 */}
      {!loading && primaryResult && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-primary text-primary-foreground">
                  1순위
                </Badge>
                <CardTitle className="text-base">선택될 모델</CardTitle>
              </div>
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 제공자 정보 */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Server className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{primaryResult.provider.name}</p>
                <p className="text-sm text-muted-foreground">{primaryResult.provider.providerType}</p>
              </div>
            </div>

            {/* 모델 정보 */}
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-lg">{primaryResult.model.displayName}</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">{primaryResult.model.modelId}</code>
              </div>
              
              {primaryResult.model.contextWindow && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>컨텍스트 윈도우:</span>
                  <Badge variant="secondary" className="font-mono">
                    {(primaryResult.model.contextWindow / 1000).toFixed(0)}K
                  </Badge>
                </div>
              )}

              {/* 지원 기능 태그 */}
              <div className="flex flex-wrap gap-2 pt-2">
                {primaryResult.model.supportsVision && (
                  <Badge variant="outline" className="gap-1">
                    <span className="text-xs">👁</span> Vision
                  </Badge>
                )}
                {primaryResult.model.supportsTools && (
                  <Badge variant="outline" className="gap-1">
                    <span className="text-xs">🛠</span> Tools
                  </Badge>
                )}
              </div>
            </div>

            {/* 폴 백 모드 */}
            {fallbackChain.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>폴 백 전략:</span>
                <Badge variant="secondary">{getFallbackModeLabel(fallbackChain[0].fallbackMode)}</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 폴 백 체인 */}
      {!loading && fallbackChain.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
            <ArrowDown className="h-4 w-4" />
            <span>실패 시 다음으로 폴 백</span>
          </div>

          {fallbackChain.map((item, index) => (
            <Card key={`${item.provider.id}-${item.model.id}-${index}`} className="border-muted bg-muted/30">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {index + 2}순위
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {getFallbackModeLabel(item.fallbackMode)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                    <Server className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{item.provider.name}</p>
                    <p className="text-xs text-muted-foreground">{item.model.displayName}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {item.model.supportsVision && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <span>👁</span> Vision
                    </Badge>
                  )}
                  {item.model.supportsTools && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <span>🛠</span> Tools
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  {getFallbackModeDescription(item.fallbackMode)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 결과 없음 상태 */}
      {!loading && !primaryResult && !error && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <Server className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              미리보기를 실행하면 선택될 모델을 확인할 수 있습니다.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
