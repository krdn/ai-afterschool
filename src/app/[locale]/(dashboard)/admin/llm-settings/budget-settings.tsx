'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { getBudgetConfigsAction, saveBudgetConfigAction } from '@/lib/actions/admin/llm-settings';

interface BudgetConfig {
  period: 'daily' | 'weekly' | 'monthly';
  budgetUsd: number;
  alertAt80: boolean;
  alertAt100: boolean;
  currentUsage?: number;
}

interface BudgetSettingsProps {
  initialData?: Array<{
    period: string;
    budgetUsd: number;
    alertAt80: boolean;
    alertAt100: boolean;
  }>;
  usageSummary?: Array<{
    period: string;
    currentCost: number;
    percentUsed: number;
  }>;
}

const PERIOD_LABELS: Record<string, { name: string; description: string }> = {
  daily: { name: '일일', description: '매일 자정에 리셋' },
  weekly: { name: '주간', description: '매주 일요일에 리셋' },
  monthly: { name: '월간', description: '매월 1일에 리셋' },
};

export function BudgetSettings({ initialData, usageSummary }: BudgetSettingsProps) {
  const [configs, setConfigs] = useState<Record<string, BudgetConfig>>({
    daily: { period: 'daily', budgetUsd: 0, alertAt80: true, alertAt100: true },
    weekly: { period: 'weekly', budgetUsd: 0, alertAt80: true, alertAt100: true },
    monthly: { period: 'monthly', budgetUsd: 0, alertAt80: true, alertAt100: true },
  });
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<Record<string, 'success' | 'error' | null>>({});
  const [isLoading, setIsLoading] = useState(!initialData);

  useEffect(() => {
    if (initialData) {
      const configMap: Record<string, BudgetConfig> = { ...configs };
      initialData.forEach((config) => {
        if (config.period in configMap) {
          const usage = usageSummary?.find((u) => u.period === config.period);
          configMap[config.period] = {
            period: config.period as 'daily' | 'weekly' | 'monthly',
            budgetUsd: config.budgetUsd,
            alertAt80: config.alertAt80,
            alertAt100: config.alertAt100,
            currentUsage: usage?.currentCost,
          };
        }
      });
      setConfigs(configMap);
    } else {
      loadConfigs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadConfigs = async () => {
    try {
      const data = await getBudgetConfigsAction();
      const configMap: Record<string, BudgetConfig> = { ...configs };
      data.forEach((config: { period: string; budgetUsd: number; alertAt80: boolean; alertAt100: boolean }) => {
        if (config.period in configMap) {
          configMap[config.period] = {
            period: config.period as 'daily' | 'weekly' | 'monthly',
            budgetUsd: config.budgetUsd,
            alertAt80: config.alertAt80,
            alertAt100: config.alertAt100,
          };
        }
      });
      setConfigs(configMap);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (period: string) => {
    const config = configs[period];
    setIsSaving(period);
    setSaveStatus((prev) => ({ ...prev, [period]: null }));

    try {
      await saveBudgetConfigAction({
        period: config.period,
        budgetUsd: config.budgetUsd,
        alertAt80: config.alertAt80,
        alertAt100: config.alertAt100,
      });
      setSaveStatus((prev) => ({ ...prev, [period]: 'success' }));
      setTimeout(() => {
        setSaveStatus((prev) => ({ ...prev, [period]: null }));
      }, 2000);
    } catch {
      setSaveStatus((prev) => ({ ...prev, [period]: 'error' }));
    } finally {
      setIsSaving(null);
    }
  };

  const updateConfig = (period: string, updates: Partial<BudgetConfig>) => {
    setConfigs((prev) => ({
      ...prev,
      [period]: { ...prev[period], ...updates },
    }));
  };

  const getUsagePercentage = (period: string): number => {
    const config = configs[period];
    if (!config.currentUsage || !config.budgetUsd) return 0;
    return (config.currentUsage / config.budgetUsd) * 100;
  };

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 100) return 'text-red-600 dark:text-red-400';
    if (percentage >= 80) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          예산 설정
          <span className="text-sm font-normal text-muted-foreground">
            (비용 폭발 방지)
          </span>
        </CardTitle>
        <CardDescription>
          기간별 LLM 사용 예산을 설정하고 임계값 도달 시 알림을 받습니다.
          예산 초과 시 Ollama(무료)로 자동 전환됩니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {(['daily', 'weekly', 'monthly'] as const).map((period) => {
          const config = configs[period];
          const usagePercent = getUsagePercentage(period);
          const periodInfo = PERIOD_LABELS[period];

          return (
            <div
              key={period}
              className="border rounded-lg p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{periodInfo.name} 예산</h4>
                  <p className="text-xs text-muted-foreground">
                    {periodInfo.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {saveStatus[period] === 'success' && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  {saveStatus[period] === 'error' && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSave(period)}
                    disabled={isSaving === period}
                  >
                    {isSaving === period ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      '저장'
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`budget-${period}`}>예산 (USD)</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">$</span>
                    <Input
                      id={`budget-${period}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={config.budgetUsd || ''}
                      onChange={(e) =>
                        updateConfig(period, {
                          budgetUsd: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>알림 설정</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor={`alert80-${period}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        80% 도달 시 알림
                      </Label>
                      <Switch
                        id={`alert80-${period}`}
                        checked={config.alertAt80}
                        onCheckedChange={(checked) =>
                          updateConfig(period, { alertAt80: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor={`alert100-${period}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        100% 도달 시 알림
                      </Label>
                      <Switch
                        id={`alert100-${period}`}
                        checked={config.alertAt100}
                        onCheckedChange={(checked) =>
                          updateConfig(period, { alertAt100: checked })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 사용량 표시 */}
              {config.budgetUsd > 0 && config.currentUsage !== undefined && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">현재 사용량</span>
                    <span className={getUsageColor(usagePercent)}>
                      ${config.currentUsage.toFixed(4)} / ${config.budgetUsd.toFixed(2)}
                      {' '}({usagePercent.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${getProgressColor(usagePercent)}`}
                      style={{ width: `${Math.min(100, usagePercent)}%` }}
                    />
                  </div>
                  {usagePercent >= 80 && usagePercent < 100 && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      예산의 80%를 사용했습니다
                    </p>
                  )}
                  {usagePercent >= 100 && (
                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      예산을 초과했습니다. Ollama만 사용 가능합니다.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <div className="bg-muted p-4 rounded-lg space-y-2">
          <p className="text-sm font-medium">비용 최적화 전략</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Ollama 우선 사용</strong>: 로컬 LLM으로 비용 0원</li>
            <li>• <strong>예산 초과 시</strong>: 자동으로 Ollama로 전환</li>
            <li>• <strong>80% 알림</strong>: 예산 소진 전 경고 수신</li>
            <li>• <strong>비전 기능</strong>: Claude, GPT-4, Gemini만 지원 (Ollama 불가)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
