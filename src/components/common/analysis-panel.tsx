"use client"

import { useState, type ReactNode } from "react"
import { AlertCircle, Sparkles, type LucideIcon } from "lucide-react"
import type { ProviderName } from "@/lib/ai/providers/types"
import { ProviderSelector } from "@/components/students/provider-selector"
import { PromptSelector } from "@/components/students/prompt-selector"
import type { GenericPromptMeta } from "@/components/students/prompt-selector"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// --- 에러 배너 ---
export function AnalysisErrorBanner({
  message,
  onDismiss,
  testId,
}: {
  message: string
  onDismiss: () => void
  testId?: string
}) {
  return (
    <div data-testid={testId} className="bg-red-50 border-l-4 border-red-400 p-4">
      <div className="flex">
        <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
        <div className="ml-3">
          <p className="text-sm text-red-800">{message}</p>
          <Button
            onClick={onDismiss}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            닫기
          </Button>
        </div>
      </div>
    </div>
  )
}

// --- AI 해석 설정 영역 ---
export type AIInterpretationControlsProps = {
  enabledProviders: ProviderName[]
  promptOptions: GenericPromptMeta[]
  isGenerating: boolean
  onGenerate: (provider: string, promptId: string) => Promise<void>
  providerSelectorProps?: {
    requiresVision?: boolean
    showBuiltIn?: boolean
  }
}

export function AIInterpretationControls({
  enabledProviders,
  promptOptions,
  isGenerating,
  onGenerate,
  providerSelectorProps,
}: AIInterpretationControlsProps) {
  const [selectedProvider, setSelectedProvider] = useState("auto")
  const [selectedPromptId, setSelectedPromptId] = useState("default")

  return (
    <div className="rounded-md border border-gray-200 p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
        <ProviderSelector
          selectedProvider={selectedProvider}
          onProviderChange={setSelectedProvider}
          availableProviders={enabledProviders}
          disabled={isGenerating}
          {...providerSelectorProps}
        />
        {promptOptions.length > 0 && (
          <PromptSelector
            selectedPromptId={selectedPromptId}
            onPromptChange={setSelectedPromptId}
            promptOptions={promptOptions}
            disabled={isGenerating}
          />
        )}
        <Button
          onClick={() => onGenerate(selectedProvider, selectedPromptId)}
          disabled={isGenerating}
          className="w-full sm:w-auto"
        >
          <Sparkles className="w-4 h-4 mr-1" />
          {isGenerating ? "AI 해석 중..." : "AI로 해석하기"}
        </Button>
      </div>
    </div>
  )
}

// --- 빈 상태 ---
export function AnalysisEmptyState({
  icon: Icon,
  message,
  actionLabel,
  onAction,
  isLoading,
  children,
}: {
  icon: LucideIcon
  message: string
  actionLabel?: string
  onAction?: () => void
  isLoading?: boolean
  children?: ReactNode
}) {
  return (
    <div className="text-center py-8">
      <Icon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p className="text-gray-500 mb-4">{message}</p>
      {children}
      {actionLabel && onAction && (
        <Button onClick={onAction} disabled={isLoading}>
          {isLoading ? "분석 중..." : actionLabel}
        </Button>
      )}
    </div>
  )
}

// --- 로딩 상태 ---
export function AnalysisLoadingState({
  message = "AI가 분석 중이에요...",
  subMessage = "10~20초 정도 소요됩니다.",
  color = "blue",
}: {
  message?: string
  subMessage?: string
  color?: string
}) {
  return (
    <div className="text-center py-8">
      <div
        className={`animate-spin w-12 h-12 border-4 border-${color}-600 border-t-transparent rounded-full mx-auto mb-4`}
      />
      <p className="text-gray-600">{message}</p>
      <p className="text-sm text-gray-500 mt-2">{subMessage}</p>
    </div>
  )
}

// --- 패널 헤더 (Card 기반) ---
export function AnalysisPanelHeader({
  icon: Icon,
  iconBgColor,
  iconColor,
  title,
  headerRight,
}: {
  icon: LucideIcon
  iconBgColor: string
  iconColor: string
  title: string
  headerRight?: ReactNode
}) {
  return (
    <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className={`p-2 ${iconBgColor} rounded-lg`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <CardTitle>{title}</CardTitle>
      </div>
      {headerRight}
    </CardHeader>
  )
}

// --- 패널 래퍼 (Card 기반) ---
export function AnalysisPanelCard({
  children,
  testId,
}: {
  children: ReactNode
  testId?: string
}) {
  return (
    <Card data-testid={testId}>
      {children}
    </Card>
  )
}

// --- 해석 결과 없음 ---
export function AnalysisNoResult({ label = "해석" }: { label?: string }) {
  return (
    <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-500">
      {label}이(가) 아직 생성되지 않았어요.
    </div>
  )
}
