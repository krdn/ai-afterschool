import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Settings } from 'lucide-react';
import { getProvidersAction } from '@/lib/actions/provider-actions';
import { ProviderListClient } from './provider-list-client';
import { HelpIntegration, QuickHelpSection } from './help-integration';

export const metadata: Metadata = {
  title: 'LLM 제공자 관리 | AI AfterSchool Admin',
  description: 'LLM 제공자를 관리하고 설정합니다.',
};

/**
 * LLM 제공자 관리 페이지 (Server Component)
 *
 * 제공자 목록을 서버에서 가져와서 클라이언트 컴포넌트에 전달합니다.
 */
export default async function LLMProvidersPage() {
  const providers = await getProvidersAction();

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* 도움말 시스템 통합 */}
      <HelpIntegration />

      {/* 페이지 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">LLM 제공자 관리</h1>
          <p className="text-muted-foreground mt-1">
            AI 기능에 사용될 LLM 제공자를 등록하고 관리합니다
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/llm-settings">
              <Settings className="w-4 h-4 mr-2" />
              라우터 설정
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/llm-providers/new">
              <Plus className="w-4 h-4 mr-2" />
              새 제공자 추가
            </Link>
          </Button>
        </div>
      </div>

      {/* 제공자 목록 */}
      <ProviderListClient providers={providers} />

      {/* 퀵 헬프 섹션 */}
      <QuickHelpSection />
    </div>
  );
}
