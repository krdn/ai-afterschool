'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { saveFeatureConfigAction } from '@/lib/actions/admin/llm-settings';
import { PROVIDER_CONFIGS, type ProviderName, type FeatureType } from '@/lib/ai/providers/types';

interface FeatureMappingProps {
  enabledProviders: ProviderName[];
  savedConfigs: Array<{
    featureType: string;
    primaryProvider: string;
    fallbackOrder: ProviderName[];
  }>;
}

const FEATURE_LABELS: Record<FeatureType, string> = {
  learning_analysis: '학습 분석',
  counseling_suggest: '상담 제안',
  report_generate: '보고서 생성',
  face_analysis: '관상 분석',
  palm_analysis: '손금 분석',
  personality_summary: '통합 성향 분석',
  saju_analysis: '사주 해석',
  mbti_analysis: 'MBTI 해석',
  vark_analysis: 'VARK 학습유형 해석',
  name_analysis: '이름풀이 해석',
  zodiac_analysis: '별자리 운세 해석',
  compatibility_analysis: '궁합 분석',
  general_chat: '일반 채팅',
};

const VISION_FEATURES: FeatureType[] = ['face_analysis', 'palm_analysis'];

export function FeatureMapping({ enabledProviders, savedConfigs }: FeatureMappingProps) {
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [configs, setConfigs] = useState<Record<FeatureType, { primary: ProviderName; fallback: ProviderName[] }>>(() => {
    const initial: Record<string, { primary: ProviderName; fallback: ProviderName[] }> = {};
    
    (Object.keys(FEATURE_LABELS) as FeatureType[]).forEach((feature) => {
      const saved = savedConfigs.find((c) => c.featureType === feature);
      initial[feature] = {
        primary: (saved?.primaryProvider || 'ollama') as ProviderName,
        fallback: saved?.fallbackOrder || ['anthropic', 'openai', 'google'],
      };
    });
    
    return initial;
  });

  const handleSave = async (featureType: FeatureType) => {
    setIsSaving(featureType);
    try {
      await saveFeatureConfigAction({
        featureType,
        primaryProvider: configs[featureType].primary,
        fallbackOrder: configs[featureType].fallback,
      });
    } finally {
      setIsSaving(null);
    }
  };

  const getAvailableProviders = (featureType: FeatureType): ProviderName[] => {
    if (VISION_FEATURES.includes(featureType)) {
      return enabledProviders.filter((p) => PROVIDER_CONFIGS[p].supportsVision);
    }
    return enabledProviders;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>기능별 LLM 매핑</CardTitle>
        <CardDescription>
          각 기능에 우선 사용할 LLM 제공자를 지정합니다. 실패 시 폴백 순서대로 시도합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {(Object.keys(FEATURE_LABELS) as FeatureType[]).map((feature) => {
          const available = getAvailableProviders(feature);
          const isVision = VISION_FEATURES.includes(feature);

          return (
            <div key={feature} className="grid gap-4 md:grid-cols-3 items-end border-b pb-4 last:border-0">
              <div className="space-y-1">
                <Label className="font-medium">{FEATURE_LABELS[feature]}</Label>
                {isVision && (
                  <p className="text-xs text-muted-foreground">비전 지원 제공자만 선택 가능</p>
                )}
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">우선 제공자</Label>
                <Select
                  value={configs[feature].primary}
                  onValueChange={(value: ProviderName) => {
                    setConfigs((prev) => ({
                      ...prev,
                      [feature]: { ...prev[feature], primary: value },
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {available.map((provider) => (
                      <SelectItem key={provider} value={provider}>
                        {PROVIDER_CONFIGS[provider].displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSave(feature)}
                disabled={isSaving === feature}
              >
                {isSaving === feature ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  '저장'
                )}
              </Button>
            </div>
          );
        })}

        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>비용 최적화 팁:</strong> Ollama(로컬)를 우선 사용하고 Claude/GPT를 폴백으로 설정하면 비용을 절감할 수 있습니다.
            비전 기능(관상/손금 분석)은 Claude, GPT-4, Gemini만 지원합니다.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
