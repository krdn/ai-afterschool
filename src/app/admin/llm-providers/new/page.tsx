'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Check } from 'lucide-react';
import { TemplateSelector } from '@/components/admin/llm-providers/template-selector';
import { ProviderForm } from '@/components/admin/llm-providers/provider-form';
import { getProviderTemplates } from '@/lib/ai/templates';
import type { ProviderTemplate } from '@/lib/ai/templates';

/**
 * 새 제공자 등록 페이지
 * 
 * 2단계 진행:
 * 1. 템플릿 선택 (또는 직접 설정)
 * 2. 제공자 정보 입력 및 저장
 */
export default function NewProviderPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedTemplate, setSelectedTemplate] = useState<ProviderTemplate | null>(
    null
  );

  // 템플릿 목록
  const templates = getProviderTemplates();

  // 템플릿 선택 핸들러
  const handleSelectTemplate = (templateId: string) => {
    const template = templates.find((t) => t.templateId === templateId);
    if (template) {
      setSelectedTemplate(template);
      setStep(2);
    }
  };

  // 뒤로 가기 핸들러
  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setSelectedTemplate(null);
    } else {
      router.push('/admin/llm-providers');
    }
  };

  // 저장 성공 핸들러
  const handleSuccess = () => {
    toast.success('제공자가 등록되었습니다.');
    router.push('/admin/llm-providers');
    router.refresh();
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* 페이지 헤더 */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {step === 1 ? '새 제공자 등록' : '제공자 정보 입력'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {step === 1
              ? '사용할 LLM 제공자를 선택하세요'
              : `${selectedTemplate?.name} 설정을 완료하세요`}
          </p>
        </div>
      </div>

      {/* 진행 단계 표시 */}
      <div className="flex items-center gap-2 mb-8">
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-full ${
            step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}
        >
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-sm font-medium">
            {step > 1 ? <Check className="w-3 h-3" /> : '1'}
          </div>
          <span className="text-sm font-medium">템플릿 선택</span>
        </div>
        <div className="w-8 h-px bg-border" />
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-full ${
            step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}
        >
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-sm font-medium">
            2
          </div>
          <span className="text-sm font-medium">정보 입력</span>
        </div>
      </div>

      {/* 단계별 콘텐츠 */}
      <div className="max-w-5xl">
        {step === 1 && (
          <TemplateSelector
            templates={templates}
            onSelect={handleSelectTemplate}
            selectedId={selectedTemplate?.templateId}
          />
        )}

        {step === 2 && selectedTemplate && (
          <Card>
            <CardContent className="p-6">
              <ProviderForm
                template={selectedTemplate}
                onSuccess={handleSuccess}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
