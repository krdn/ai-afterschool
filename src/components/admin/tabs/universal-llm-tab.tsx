'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Settings, Info, AlertCircle } from 'lucide-react';
import { ProviderList } from '@/components/admin/llm-providers/provider-list';
import { FeatureMappingList } from '@/components/admin/llm-features/feature-mapping-list';
import type { ProviderWithModels } from '@/lib/ai/types';
import type { MatchMode, FallbackMode } from '@/lib/ai/types';

interface FeatureMapping {
  id: string;
  featureType: string;
  matchMode: MatchMode;
  requiredTags: string[];
  excludedTags: string[];
  specificModelId: string | null;
  priority: number;
  fallbackMode: FallbackMode;
  specificModel: null;
}

interface UniversalLLMTabProps {
  providers: ProviderWithModels[];
  mappings: FeatureMapping[];
}

/**
 * Universal LLM Hub 탭 컴포넌트
 * 
 * Phase 35의 제공자 관리와 기능별 LLM 매핑을 통합하여 제공합니다.
 */
export function UniversalLLMTab({ providers, mappings }: UniversalLLMTabProps) {
  const [activeSubTab, setActiveSubTab] = useState('providers');
  const [isLoading, setIsLoading] = useState(false);

  // 활성화된 제공자 필터링
  const activeProviders = providers.filter((p) => p.isEnabled);

  // 제공자 액션 핸들러 (더미 - 실제로는 페이지 이동)
  const handleEdit = (provider: ProviderWithModels) => {
    window.location.href = `/admin/llm-providers/${(provider as unknown as { id: string }).id}/edit`;
  };

  const handleDelete = async (provider: ProviderWithModels) => {
    if (confirm('정말 이 제공자를 삭제하시겠습니까?')) {
      window.location.href = `/admin/llm-providers/${(provider as unknown as { id: string }).id}/delete`;
    }
  };

  const handleTest = async (provider: ProviderWithModels): Promise<{ success: boolean; message: string }> => {
    // 테스트 로직은 별도 페이지에서 처리
    return { success: true, message: '테스트 페이지로 이동합니다.' };
  };

  const handleToggle = async (provider: ProviderWithModels, enabled: boolean) => {
    // 토글 로직은 별도 페이지에서 처리
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* 헤더 설명 */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Settings className="w-6 h-6 text-blue-600 dark:text-blue-200" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">Universal LLM Hub</h3>
              <p className="text-muted-foreground text-sm">
                Phase 35에서 도입된 새로운 LLM 관리 시스템입니다. 
                모든 LLM 제공자를 중앙에서 관리하고, 기능별로 유연하게 매핑할 수 있습니다.
                <br />
                <span className="text-xs text-blue-600 dark:text-blue-400 mt-1 block">
                  * 기존 LLM 설정 탭은 하위 호환성을 위해 유지됩니다.
                </span>
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/admin/llm-providers">
                  <Plus className="w-4 h-4 mr-2" />
                  새 제공자 추가
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 서브 탭 */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="providers">
            제공자 관리 ({providers.length})
          </TabsTrigger>
          <TabsTrigger value="mappings">
            기능별 매핑 ({mappings.length})
          </TabsTrigger>
        </TabsList>

        {/* 제공자 관리 탭 */}
        <TabsContent value="providers" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">등록된 제공자</h3>
              <p className="text-sm text-muted-foreground">
                활성: {activeProviders.length}개 / 전체: {providers.length}개
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/llm-providers">
                전체 관리 페이지 →
              </Link>
            </Button>
          </div>

          {activeProviders.length === 0 && (
            <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                  <AlertCircle className="h-5 w-5" />
                  <span>
                    활성화된 LLM 제공자가 없습니다.
                    <Link href="/admin/llm-providers/new" className="underline font-medium ml-1">
                      제공자를 먼저 등록해주세요.
                    </Link>
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <ProviderList
            providers={providers}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onTest={handleTest}
            onToggle={handleToggle}
          />
        </TabsContent>

        {/* 기능별 매핑 탭 */}
        <TabsContent value="mappings" className="space-y-4">
          {/* 정보 카드 */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-200" />
                  </div>
                  <CardTitle className="text-base">태그 기반 자동 매칭</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  태그 조건(vision, function_calling 등)에 맞는 모델을 자동으로 선택합니다.
                  <br />
                  우선순위가 높은 규칙부터 적용되며, 실패 시 다음 규칙으로 폴 백합니다.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                    <Info className="h-4 w-4 text-purple-600 dark:text-purple-200" />
                  </div>
                  <CardTitle className="text-base">직접 모델 지정</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  특정 제공자와 모델을 직접 지정하여 사용합니다.
                  <br />
                  정확한 모델 선택이 필요한 경우에 적합합니다.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">기능별 LLM 매핑</h3>
              <p className="text-sm text-muted-foreground">
                각 기능에 사용될 LLM 모델의 매핑 규칙
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/llm-features">
                전체 관리 페이지 →
              </Link>
            </Button>
          </div>

          {activeProviders.length === 0 ? (
            <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                  <AlertCircle className="h-5 w-5" />
                  <span>
                    활성화된 LLM 제공자가 없습니다.
                    <Link href="/admin/llm-providers" className="underline font-medium ml-1">
                      제공자를 먼저 등록해주세요.
                    </Link>
                  </span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <FeatureMappingList
              mappings={mappings}
              providers={providers.map((p) => ({
                id: (p as unknown as { id: string }).id,
                name: p.name,
                models: p.models || [],
              }))}
              onRefresh={async () => {
                window.location.reload();
              }}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
