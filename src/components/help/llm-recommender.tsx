'use client';

import * as React from 'react';
import {
  Sparkles,
  Lightbulb,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Zap,
  Brain,
  Image,
  Coins,
  Shield,
  Server,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  getProviderTemplate,
  getPopularTemplates,
  type ProviderTemplate,
} from '@/lib/ai/templates';

// ============================================================
// Types
// ============================================================

type Step = 'purpose' | 'tech-level' | 'budget' | 'result';

interface Recommendation {
  rank: 1 | 2;
  template: ProviderTemplate;
  reasons: string[];
  score: number;
}

interface RecommenderState {
  step: Step;
  purpose?: string;
  techLevel?: 'easy' | 'advanced';
  budget?: 'free' | 'low' | 'medium' | 'unlimited';
  recommendations?: Recommendation[];
}

interface LLMRecommenderProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: 'dialog' | 'sheet';
  onSelectProvider?: (templateId: string) => void;
  className?: string;
}

// ============================================================
// Purpose Options
// ============================================================

const purposeOptions = [
  {
    id: 'analysis',
    label: '학생 분석 및 상담 보고서',
    description: '학생 성향 분석, 상담 내용 요약 등 균형잡힌 성능 필요',
    icon: Brain,
    tags: ['balanced', 'korean', 'premium'],
    priority: 1,
  },
  {
    id: 'vision',
    label: '이미지 분석 (관상, 손금)',
    description: '사진을 업로드하여 분석하는 기능에 최적화된 모델',
    icon: Image,
    tags: ['vision', 'premium'],
    priority: 2,
  },
  {
    id: 'quick',
    label: '빠른 간단 분석',
    description: '즉각적인 응답이 필요한 간단한 작업',
    icon: Zap,
    tags: ['low', 'balanced', 'fast'],
    priority: 3,
  },
  {
    id: 'quality',
    label: '고품질 심층 분석',
    description: '복잡한 추론과 고품질 결과가 필요한 작업',
    icon: Sparkles,
    tags: ['premium', 'high'],
    priority: 4,
  },
  {
    id: 'cost',
    label: '비용 절감',
    description: '가능한 낮은 비용으로 기본적인 AI 기능 사용',
    icon: Coins,
    tags: ['low', 'free'],
    priority: 5,
  },
  {
    id: 'privacy',
    label: '로컬에서만 사용',
    description: '데이터가 외부로 나가지 않는 프라이버시 중시',
    icon: Shield,
    tags: ['free', 'local'],
    priority: 6,
  },
];

// ============================================================
// Tech Level Options
// ============================================================

const techLevelOptions = [
  {
    id: 'easy',
    label: '쉬운 방법을 원해요',
    description: '클릭 몇 번으로 바로 사용할 수 있는 상용 클라우드 서비스',
    icon: Zap,
  },
  {
    id: 'advanced',
    label: '직접 설정할 수 있어요',
    description: '로컬 설치나 복잡한 설정도 문제없어요',
    icon: Server,
  },
];

// ============================================================
// Budget Options
// ============================================================

const budgetOptions = [
  {
    id: 'free',
    label: '물뤂으로 사용',
    description: '완전 물뤂이거나 로컬에서 실행',
    icon: Shield,
  },
  {
    id: 'low',
    label: '월 10만원 이하',
    description: '비용 효율적인 선택',
    icon: Coins,
  },
  {
    id: 'medium',
    label: '월 50만원 이하',
    description: '적당한 성능과 비용의 균형',
    icon: Coins,
  },
  {
    id: 'unlimited',
    label: '예산 제한 없음',
    description: '최고 성능이 우선',
    icon: Sparkles,
  },
];

// ============================================================
// Scoring Functions
// ============================================================

function calculateRecommendations(
  purpose: string,
  techLevel: 'easy' | 'advanced',
  budget: 'free' | 'low' | 'medium' | 'unlimited'
): Recommendation[] {
  const templates = getPopularTemplates();
  const purposeOption = purposeOptions.find((p) => p.id === purpose);
  const purposeTags = purposeOption?.tags || [];

  const scored = templates
    .filter((template) => {
      // 기술 수준 필터링
      if (techLevel === 'easy' && template.templateId === 'ollama') {
        return false; // Ollama는 advanced
      }

      // 예산 필터링
      if (budget === 'free' && template.defaultCostTier !== 'free') {
        return false;
      }
      if (budget === 'low' && ['high'].includes(template.defaultCostTier)) {
        return false;
      }
      if (budget === 'medium' && template.defaultCostTier === 'high') {
        return false;
      }

      return true;
    })
    .map((template) => {
      let score = 0;
      const reasons: string[] = [];

      // 목적 기반 점수
      if (purposeTags.includes('vision') && template.defaultCapabilities.includes('vision')) {
        score += 30;
        reasons.push('Vision(이미지 분석) 지원');
      }

      if (purposeTags.includes('premium') && template.defaultQualityTier === 'premium') {
        score += 25;
        reasons.push('프리미엄 품질');
      }

      if (purposeTags.includes('balanced') && template.defaultQualityTier === 'balanced') {
        score += 20;
        reasons.push('균형잡힌 성능');
      }

      if (purposeTags.includes('low') && template.defaultCostTier === 'low') {
        score += 20;
        reasons.push('비용 효율적');
      }

      if (purposeTags.includes('free') && template.defaultCostTier === 'free') {
        score += 30;
        reasons.push('완전 물뤂');
      }

      if (purposeTags.includes('korean')) {
        // Google Gemini는 한국어에 강함
        if (template.templateId === 'google') {
          score += 15;
          reasons.push('한국어 성능 우수');
        }
      }

      // 예산 기반 점수
      if (budget === 'free' && template.defaultCostTier === 'free') {
        score += 25;
      } else if (budget === 'low' && template.defaultCostTier === 'low') {
        score += 20;
      }

      // 인기도 별 점수
      if (template.isPopular) {
        score += 10;
      }

      // 기본 이유 추가
      if (reasons.length === 0) {
        reasons.push('안정적인 성능');
      }

      // 특별 보정
      if (purpose === 'privacy' && template.templateId === 'ollama') {
        score = 100;
        reasons.push('로컬 실행으로 데이터 프라이버시 보장');
      }

      if (purpose === 'vision' && template.templateId === 'google') {
        score += 10;
        reasons.push('Vision 기능 및 비용 효율적');
      }

      return {
        template,
        score,
        reasons: [...new Set(reasons)], // 중복 제거
        rank: 1 as 1 | 2,
      };
    });

  // 점수순 정렬
  scored.sort((a, b) => b.score - a.score);

  // 순위 할당
  const results: Recommendation[] = scored.slice(0, 2).map((item, index) => ({
    ...item,
    rank: (index + 1) as 1 | 2,
  }));

  return results;
}

// ============================================================
// Components
// ============================================================

function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>단계 {currentStep} / {totalSteps}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}

function PurposeStep({
  selected,
  onSelect,
}: {
  selected?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">어떤 용도로 LLM을 사용하시나요?</h3>
        <p className="text-sm text-muted-foreground">
          사용 목적에 따라 최적의 AI 모델을 추천해드립니다
        </p>
      </div>

      <div className="grid gap-3">
        {purposeOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selected === option.id;

          return (
            <Card
              key={option.id}
              className={cn(
                'cursor-pointer transition-all duration-200 hover:shadow-md',
                isSelected && 'ring-2 ring-primary border-primary'
              )}
              onClick={() => onSelect(option.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'p-3 rounded-lg transition-colors',
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{option.label}</h4>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {option.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function TechLevelStep({
  selected,
  onSelect,
  purpose,
}: {
  selected?: 'easy' | 'advanced';
  onSelect: (level: 'easy' | 'advanced') => void;
  purpose?: string;
}) {
  // 로컬/프라이버시 선택 시 기술 수준 단계 스킵
  if (purpose === 'privacy') {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="p-4 bg-muted rounded-full inline-flex">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">로컬 실행을 선택하셨네요</h3>
        <p className="text-sm text-muted-foreground">
          Ollama를 통해 컴퓨터에서 직접 LLM을 실행합니다.<br />
          기술적인 설정이 필요하지만 데이터가 외부로 전송되지 않습니다.
        </p>
        <Button onClick={() => onSelect('advanced')}>계속하기</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">기술적인 설정이 편하신가요?</h3>
        <p className="text-sm text-muted-foreground">
          설정 난이도에 따라 적합한 옵션을 추천해드립니다
        </p>
      </div>

      <div className="grid gap-3">
        {techLevelOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selected === option.id;

          return (
            <Card
              key={option.id}
              className={cn(
                'cursor-pointer transition-all duration-200 hover:shadow-md',
                isSelected && 'ring-2 ring-primary border-primary'
              )}
              onClick={() => onSelect(option.id as 'easy' | 'advanced')}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'p-3 rounded-lg transition-colors',
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{option.label}</h4>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {option.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function BudgetStep({
  selected,
  onSelect,
}: {
  selected?: 'free' | 'low' | 'medium' | 'unlimited';
  onSelect: (budget: 'free' | 'low' | 'medium' | 'unlimited') => void;
}) {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">월 예산은 어느 정도로 생각하시나요?</h3>
        <p className="text-sm text-muted-foreground">
          예산에 따라 가장 적합한 제공자를 추천해드립니다
        </p>
      </div>

      <div className="grid gap-3">
        {budgetOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selected === option.id;

          return (
            <Card
              key={option.id}
              className={cn(
                'cursor-pointer transition-all duration-200 hover:shadow-md',
                isSelected && 'ring-2 ring-primary border-primary'
              )}
              onClick={() => onSelect(option.id as 'free' | 'low' | 'medium' | 'unlimited')}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'p-3 rounded-lg transition-colors',
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{option.label}</h4>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {option.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ResultStep({
  recommendations,
  onSelectProvider,
  onClose,
}: {
  recommendations: Recommendation[];
  onSelectProvider?: (templateId: string) => void;
  onClose?: () => void;
}) {
  const [first, second] = recommendations;

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 bg-primary/10 rounded-full">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">추천 결과</h3>
        <p className="text-sm text-muted-foreground">
          입력하신 조건에 가장 적합한 AI 모델입니다
        </p>
      </div>

      <ScrollArea className="h-[300px]">
        <div className="space-y-3">
          {/* 1순위 추천 */}
          {first && (
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary">1순위 추천</Badge>
                  <Badge variant="outline">{first.template.defaultCostTier === 'free' ? '묶음' : first.template.defaultCostTier}</Badge>
                </div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {first.template.name}
                </CardTitle>
                <CardDescription>{first.template.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {first.reasons.map((reason, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      <Check className="h-3 w-3 mr-1" />
                      {reason}
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      onSelectProvider?.(first.template.templateId);
                      onClose?.();
                    }}
                  >
                    바로 등록하기
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      window.open(first.template.apiKeyUrl || first.template.helpUrl, '_blank');
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 2순위 추천 */}
          {second && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">2순위</Badge>
                  <Badge variant="outline">{second.template.defaultCostTier === 'free' ? '묶음' : second.template.defaultCostTier}</Badge>
                </div>
                <CardTitle className="text-base">{second.template.name}</CardTitle>
                <CardDescription className="text-sm">
                  {second.template.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {second.reasons.slice(0, 2).map((reason, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {reason}
                    </Badge>
                  ))}
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    onSelectProvider?.(second.template.templateId);
                    onClose?.();
                  }}
                >
                  이 모델로 등록하기
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function LLMRecommender({
  open,
  onOpenChange,
  variant = 'dialog',
  onSelectProvider,
  className,
}: LLMRecommenderProps) {
  const [state, setState] = React.useState<RecommenderState>({
    step: 'purpose',
  });

  // 단계별 총 단계 수 계산
  const getTotalSteps = () => {
    if (state.purpose === 'privacy') return 3; // tech-level 스킵
    return 4;
  };

  const getCurrentStepNumber = () => {
    switch (state.step) {
      case 'purpose':
        return 1;
      case 'tech-level':
        return 2;
      case 'budget':
        return state.purpose === 'privacy' ? 2 : 3;
      case 'result':
        return getTotalSteps();
      default:
        return 1;
    }
  };

  const handlePurposeSelect = (purpose: string) => {
    setState((prev) => ({ ...prev, purpose }));

    if (purpose === 'privacy') {
      // 로컬/프라이버시 선택 시 tech-level 스킵하고 바로 결과
      const techLevel = 'advanced';
      setState((prev) => ({ ...prev, purpose, techLevel, step: 'budget' }));
    } else {
      setState((prev) => ({ ...prev, purpose, step: 'tech-level' }));
    }
  };

  const handleTechLevelSelect = (techLevel: 'easy' | 'advanced') => {
    setState((prev) => ({ ...prev, techLevel, step: 'budget' }));
  };

  const handleBudgetSelect = (budget: 'free' | 'low' | 'medium' | 'unlimited') => {
    const recommendations = calculateRecommendations(
      state.purpose!,
      state.techLevel || 'easy',
      budget
    );
    setState((prev) => ({ ...prev, budget, recommendations, step: 'result' }));
  };

  const handleBack = () => {
    if (state.step === 'result') {
      setState((prev) => ({ ...prev, step: 'budget' }));
    } else if (state.step === 'budget') {
      if (state.purpose === 'privacy') {
        setState((prev) => ({ ...prev, step: 'purpose' }));
      } else {
        setState((prev) => ({ ...prev, step: 'tech-level' }));
      }
    } else if (state.step === 'tech-level') {
      setState((prev) => ({ ...prev, step: 'purpose' }));
    }
  };

  const handleClose = () => {
    onOpenChange?.(false);
    // Reset state after animation
    setTimeout(() => {
      setState({ step: 'purpose' });
    }, 300);
  };

  const content = (
    <>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <span className="font-semibold">LLM 추천 위자드</span>
        </div>
        {state.step !== 'purpose' && (
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            뒤로
          </Button>
        )}
      </div>

      {/* 진행률 */}
      <StepIndicator currentStep={getCurrentStepNumber()} totalSteps={getTotalSteps()} />

      {/* 단계별 콘텐츠 */}
      <div className="py-4">
        {state.step === 'purpose' && (
          <PurposeStep selected={state.purpose} onSelect={handlePurposeSelect} />
        )}

        {state.step === 'tech-level' && (
          <TechLevelStep
            selected={state.techLevel}
            onSelect={handleTechLevelSelect}
            purpose={state.purpose}
          />
        )}

        {state.step === 'budget' && (
          <BudgetStep selected={state.budget} onSelect={handleBudgetSelect} />
        )}

        {state.step === 'result' && state.recommendations && (
          <ResultStep
            recommendations={state.recommendations}
            onSelectProvider={onSelectProvider}
            onClose={handleClose}
          />
        )}
      </div>
    </>
  );

  if (variant === 'sheet') {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className={cn('w-full sm:max-w-lg', className)}>
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              LLM 추천받기
            </SheetTitle>
            <SheetDescription>
              몇 가지 질문에 답하면 최적의 AI 모델을 추천해드립니다
            </SheetDescription>
          </SheetHeader>
          {content}
          <SheetFooter className="pt-4">
            <Button variant="outline" className="w-full" onClick={handleClose}>
              <X className="h-4 w-4 mr-1" />
              닫기
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('max-w-lg max-h-[90vh] overflow-hidden', className)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            LLM 추천받기
          </DialogTitle>
          <DialogDescription>
            몇 가지 질문에 답하면 최적의 AI 모델을 추천해드립니다
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">{content}</ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            <X className="h-4 w-4 mr-1" />
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default LLMRecommender;
