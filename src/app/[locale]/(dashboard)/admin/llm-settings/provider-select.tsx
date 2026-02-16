"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Loader2, Check } from "lucide-react"
import { setDefaultProviderAction } from "@/lib/actions/admin/llm-settings"
import { PROVIDER_CONFIGS, type ProviderName } from "@/lib/ai/providers/types"

interface ProviderSelectProps {
  enabledProviders: ProviderName[]
  currentDefault: ProviderName | null
}

const ALL_PROVIDERS: ProviderName[] = ['ollama', 'anthropic', 'openai', 'google', 'deepseek', 'mistral', 'cohere', 'xai', 'zhipu', 'moonshot']

const PROVIDER_ICONS: Record<ProviderName, string> = {
  ollama: 'O',
  anthropic: 'C',
  openai: 'G',
  google: 'G',
  deepseek: 'D',
  mistral: 'M',
  cohere: 'C',
  xai: 'X',
  zhipu: 'Z',
  moonshot: 'K',
  openrouter: 'R',
}

const PROVIDER_COLORS: Record<ProviderName, { bg: string; selected: string }> = {
  ollama: { bg: 'bg-purple-50 border-purple-200 hover:bg-purple-100', selected: 'bg-purple-100 border-purple-500 ring-2 ring-purple-300' },
  anthropic: { bg: 'bg-orange-50 border-orange-200 hover:bg-orange-100', selected: 'bg-orange-100 border-orange-500 ring-2 ring-orange-300' },
  openai: { bg: 'bg-green-50 border-green-200 hover:bg-green-100', selected: 'bg-green-100 border-green-500 ring-2 ring-green-300' },
  google: { bg: 'bg-blue-50 border-blue-200 hover:bg-blue-100', selected: 'bg-blue-100 border-blue-500 ring-2 ring-blue-300' },
  deepseek: { bg: 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100', selected: 'bg-cyan-100 border-cyan-500 ring-2 ring-cyan-300' },
  mistral: { bg: 'bg-amber-50 border-amber-200 hover:bg-amber-100', selected: 'bg-amber-100 border-amber-500 ring-2 ring-amber-300' },
  cohere: { bg: 'bg-rose-50 border-rose-200 hover:bg-rose-100', selected: 'bg-rose-100 border-rose-500 ring-2 ring-rose-300' },
  xai: { bg: 'bg-slate-50 border-slate-200 hover:bg-slate-100', selected: 'bg-slate-100 border-slate-500 ring-2 ring-slate-300' },
  zhipu: { bg: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100', selected: 'bg-indigo-100 border-indigo-500 ring-2 ring-indigo-300' },
  moonshot: { bg: 'bg-violet-50 border-violet-200 hover:bg-violet-100', selected: 'bg-violet-100 border-violet-500 ring-2 ring-violet-300' },
  openrouter: { bg: 'bg-teal-50 border-teal-200 hover:bg-teal-100', selected: 'bg-teal-100 border-teal-500 ring-2 ring-teal-300' },
}

export function ProviderSelect({ enabledProviders, currentDefault }: ProviderSelectProps) {
  const [selected, setSelected] = useState<ProviderName | null>(currentDefault)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSelect = async (provider: ProviderName) => {
    if (isSaving) return
    setSelected(provider)
    setIsSaving(true)
    setSaved(false)

    try {
      await setDefaultProviderAction(provider)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error("Failed to set default provider:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>기본 제공자 선택</Label>
        {saved && (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <Check className="h-3 w-3" /> 저장됨
          </span>
        )}
        {isSaving && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" /> 저장 중...
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {ALL_PROVIDERS.map((provider) => {
          const config = PROVIDER_CONFIGS[provider]
          const isSelected = selected === provider
          const isEnabled = enabledProviders.includes(provider)
          const isBuiltIn = provider === 'ollama'
          const colors = PROVIDER_COLORS[provider]

          return (
            <button
              key={provider}
              type="button"
              onClick={() => handleSelect(provider)}
              disabled={isSaving || (!isEnabled && !isBuiltIn)}
              className={`
                relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
                ${isSelected ? colors.selected : colors.bg}
                ${(!isEnabled && !isBuiltIn) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                disabled:pointer-events-none
              `}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg bg-white/80 border">
                {PROVIDER_ICONS[provider]}
              </div>
              <span className="text-sm font-medium">{config.displayName}</span>
              <span className="text-xs text-muted-foreground">
                {isBuiltIn ? '내장 (무료)' : config.requiresApiKey ? 'API 키 필요' : ''}
              </span>
              {!isEnabled && !isBuiltIn && (
                <span className="text-xs text-red-500">미활성</span>
              )}
              {isBuiltIn && !isEnabled && (
                <span className="text-xs text-green-600">항상 사용 가능</span>
              )}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        선택한 제공자가 모든 AI 기능의 기본 제공자로 설정됩니다. 비전 기능(관상/손금)은 비전 지원 제공자만 적용됩니다.
      </p>
    </div>
  )
}
