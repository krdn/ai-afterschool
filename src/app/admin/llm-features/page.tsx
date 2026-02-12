import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, Info } from 'lucide-react';
import { FeatureMappingList } from '@/components/admin/llm-features/feature-mapping-list';
import { getFeatureMappingsAction } from '@/lib/actions/feature-mapping-actions';
import { getProvidersAction } from '@/lib/actions/provider-actions';
import { verifySession } from '@/lib/dal';
import type { MatchMode, FallbackMode } from '@/lib/ai/types';

export const metadata: Metadata = {
  title: '기능별 LLM 매핑 | AI 애프터스쿨',
  description: '기능별 LLM 모델 매핑 규칙을 관리합니다.',
};

export default async function LLMFeaturesPage() {
  // DIRECTOR 권한 확인
  const session = await verifySession();
  if (!session || session.role !== 'DIRECTOR') {
    redirect('/');
  }

  // 데이터 조회
  const mappingsResult = await getFeatureMappingsAction();
  const providers = await getProvidersAction();

  const mappings = mappingsResult.success ? mappingsResult.data || [] : [];

  // 활성화된 제공자만 필터링
  const activeProviders = providers.filter((p: { isEnabled?: boolean }) => p.isEnabled);

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">기능별 LLM 매핑</h1>
        <p className="text-muted-foreground">
          각 기능에 사용될 LLM 모델의 매핑 규칙을 설정하고 관리합니다.
        </p>
      </div>

      {/* 정보 카드 */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-200" />
              </div>
              <CardTitle className="text-base">태그 기반 자동 매칭</CardTitle>
            </div>          </CardHeader>
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

      {/* 에러 메시지 */}
      {!mappingsResult.success && (
        <Card className="mb-6 border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>매핑 데이터를 불러오는데 실패했습니다: {mappingsResult.error}</span>
            </div>
          </CardContent>
        </Card>
      )}



      {/* 제공자 없음 경고 */}
      {activeProviders.length === 0 && (
        <Card className="mb-6 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <AlertCircle className="h-5 w-5" />
              <span>
                활성화된 LLM 제공자가 없습니다.
                <a href="/admin/llm-providers" className="underline font-medium">
                  제공자 관리 페이지</a>에서 제공자를 먼저 등록해주세요.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 메인 콘텐츠 */}
      <FeatureMappingList
        mappings={mappings.map((m) => ({
          id: (m as unknown as Record<string, string>).id || '',
          featureType: (m as unknown as Record<string, string>).featureType || '',
          matchMode: (m as unknown as Record<string, string>).matchMode as MatchMode,
          requiredTags: ((m as unknown as Record<string, string[]>).requiredTags) || [],
          excludedTags: ((m as unknown as Record<string, string[]>).excludedTags) || [],
          specificModelId: (m as unknown as Record<string, string | null>).specificModelId || null,
          priority: (m as unknown as Record<string, number>).priority || 1,
          fallbackMode: (m as unknown as Record<string, string>).fallbackMode as FallbackMode,
          specificModel: null,
        }))}
        providers={providers.map((p: { id: string; name: string; models?: { id: string; modelId: string; displayName: string }[] }) => ({
          id: p.id,
          name: p.name,
          models: p.models || [],
        }))}
        onRefresh={() => {
          // 서버 컴포넌트에서는 router.refresh()를 사용할 수 없으므로
          // 페이지를 다시 로드하거나 클라이언트 사이드에서 처리
          'use server';
        }}
      />
    </div>
  );
}
