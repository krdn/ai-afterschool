"use client"

import { useState, useTransition } from "react"
import { Camera, Sparkles, AlertCircle } from "lucide-react"
import { runTeacherFaceAnalysis } from "@/lib/actions/teacher/face-analysis"
import { DISCLAIMER_TEXT } from "@/lib/ai/prompts"
import type { ProviderName } from "@/lib/ai/providers/types"
import { ProviderSelector } from "@/components/students/provider-selector"
import { PromptSelector } from "@/components/students/prompt-selector"
import type { GenericPromptMeta } from "@/components/students/prompt-selector"
import { FaceHelpDialog } from "@/components/students/face-help-dialog"
import { Button } from "@/components/ui/button"

type TeacherFaceAnalysis = {
  id: string
  status: string
  result: unknown
  imageUrl: string
  errorMessage: string | null
} | null

type Props = {
  teacherId: string
  teacherName: string
  analysis: TeacherFaceAnalysis
  faceImageUrl: string | null
  enabledProviders?: ProviderName[]
  promptOptions?: GenericPromptMeta[]
}

export function TeacherFacePanel({
  teacherId,
  teacherName,
  analysis,
  faceImageUrl,
  enabledProviders = [],
  promptOptions = [],
}: Props) {
  const [, startTransition] = useTransition()
  const [localStatus, setLocalStatus] = useState<'idle' | 'analyzing'>('idle')
  const [selectedProvider, setSelectedProvider] = useState('auto')
  const [selectedPromptId, setSelectedPromptId] = useState('default')

  const handleAnalyze = () => {
    if (!faceImageUrl) {
      alert("먼저 얼굴 사진을 업로드해주세요.")
      return
    }

    setLocalStatus('analyzing')
    startTransition(async () => {
      const result = await runTeacherFaceAnalysis(teacherId, faceImageUrl)
      if (result.success) {
        window.location.reload()
      } else {
        alert(result.error || "분석에 실패했습니다.")
        setLocalStatus('idle')
      }
    })
  }

  const isAnalyzing = localStatus === 'analyzing' ||
    (analysis?.status === 'pending')

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Sparkles className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold">AI 관상 분석</h2>
          <FaceHelpDialog />
        </div>
      </div>

      {/* Provider/Prompt selectors */}
      <div className="px-6 pt-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
          <ProviderSelector
            selectedProvider={selectedProvider}
            onProviderChange={setSelectedProvider}
            availableProviders={enabledProviders}
            disabled={isAnalyzing}
          />
          {promptOptions.length > 0 && (
            <PromptSelector
              selectedPromptId={selectedPromptId}
              onPromptChange={setSelectedPromptId}
              promptOptions={promptOptions}
              disabled={isAnalyzing}
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {analysis?.status === 'complete' && analysis.result ? (
          <AnalysisResult result={analysis.result} imageUrl={analysis.imageUrl} onReanalyze={handleAnalyze} />
        ) : analysis?.status === 'failed' ? (
          <ErrorState
            message={analysis.errorMessage || "분석에 실패했습니다."}
            onRetry={handleAnalyze}
          />
        ) : isAnalyzing ? (
          <LoadingState />
        ) : (
          <EmptyState
            hasImage={!!faceImageUrl}
            onAnalyze={handleAnalyze}
          />
        )}
      </div>
    </div>
  )
}

function AnalysisResult({ result, imageUrl, onReanalyze }: { result: unknown; imageUrl: string | null; onReanalyze: () => void }) {
  const analysisResult = result as {
    faceShape: string
    features: {
      eyes: string
      nose: string
      mouth: string
      ears: string
      forehead: string
      chin: string
    }
    personalityTraits: string[]
    fortune: {
      academic: string
      career: string
      relationships: string
    }
    overallInterpretation?: string
  }
  return (
    <div className="space-y-6">
      {imageUrl && (
        <div className="flex justify-center">
          <img
            src={imageUrl}
            alt="얼굴 사진"
            className="w-48 h-48 object-cover rounded-lg shadow-md"
          />
        </div>
      )}

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <p className="text-sm text-yellow-800">
          {DISCLAIMER_TEXT.face}
        </p>
      </div>

      <div>
        <h3 className="font-semibold mb-2">얼굴형</h3>
        <p className="text-gray-700">{analysisResult.faceShape}</p>
      </div>

      <div>
        <h3 className="font-semibold mb-2">이목구비</h3>
        <dl className="grid grid-cols-2 gap-3">
          <FeatureItem label="눈" value={analysisResult.features.eyes} />
          <FeatureItem label="코" value={analysisResult.features.nose} />
          <FeatureItem label="입" value={analysisResult.features.mouth} />
          <FeatureItem label="귀" value={analysisResult.features.ears} />
          <FeatureItem label="이마" value={analysisResult.features.forehead} />
          <FeatureItem label="턱" value={analysisResult.features.chin} />
        </dl>
      </div>

      <div>
        <h3 className="font-semibold mb-2">성격 특성</h3>
        <ul className="list-disc list-inside space-y-1">
          {analysisResult.personalityTraits.map((trait: string, i: number) => (
            <li key={i} className="text-gray-700">{trait}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-semibold mb-2">운세 해석</h3>
        <div className="space-y-2 text-sm">
          <p><span className="font-medium">학업:</span> {analysisResult.fortune.academic}</p>
          <p><span className="font-medium">진로:</span> {analysisResult.fortune.career}</p>
          <p><span className="font-medium">인간관계:</span> {analysisResult.fortune.relationships}</p>
        </div>
      </div>

      {analysisResult.overallInterpretation && (
        <div>
          <h3 className="font-semibold mb-2">종합 해석</h3>
          <p className="text-gray-700 text-sm leading-relaxed">
            {analysisResult.overallInterpretation}
          </p>
        </div>
      )}

      <div className="pt-4 border-t">
        <Button variant="outline" onClick={onReanalyze}>
          <Sparkles className="w-4 h-4 mr-1" />
          재분석
        </Button>
      </div>
    </div>
  )
}

function FeatureItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-gray-700">{value}</dd>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="text-center py-8">
      <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
      <p className="text-gray-600">AI가 얼굴 사진을 분석 중이에요...</p>
      <p className="text-sm text-gray-500 mt-2">10~20초 정도 소요됩니다.</p>
    </div>
  )
}

function EmptyState({ hasImage, onAnalyze }: { hasImage: boolean; onAnalyze: () => void }) {
  return (
    <div className="text-center py-8">
      <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p className="text-gray-500 mb-4">
        {hasImage
          ? "얼굴 사진이 준비되었어요. 분석을 시작할까요?"
          : "아직 얼굴 사진이 없어요. 선생님 정보에서 얼굴 사진을 업로드해주세요."
        }
      </p>
      {hasImage && (
        <Button onClick={onAnalyze}>
          <Sparkles className="w-4 h-4 mr-1" />
          분석 시작
        </Button>
      )}
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="text-center py-8">
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 text-left">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
          <div className="ml-3">
            <p className="text-sm text-red-800">{message}</p>
          </div>
        </div>
      </div>
      <Button variant="outline" onClick={onRetry}>
        다시 시도
      </Button>
    </div>
  )
}
