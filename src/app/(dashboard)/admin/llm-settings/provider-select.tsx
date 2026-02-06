"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { saveLLMConfigAction } from "@/lib/actions/llm-settings"
import type { ProviderName } from "@/lib/ai/providers"

interface ProviderSelectProps {
  enabledProviders: ProviderName[]
}

const PROVIDER_NAMES: Record<ProviderName, string> = {
  anthropic: "Claude (Anthropic)",
  openai: "OpenAI",
  google: "Google",
  ollama: "Ollama (Local)",
}

export function ProviderSelect({ enabledProviders }: ProviderSelectProps) {
  const [selectedProvider, setSelectedProvider] = useState<ProviderName | "">("")
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSelect = async (provider: ProviderName) => {
    setSelectedProvider(provider)
    setIsOpen(false)
    setIsSaving(true)

    try {
      // Note: 기본 제공자 저장 기능은 향후 Phase에서 구현
      // 여기서는 UI만 구현합니다
      await saveLLMConfigAction({
        provider,
        isEnabled: true,
      })
    } catch (error) {
      console.error("Failed to set primary provider:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="provider-select">기본 제공자 선택</Label>
      <div className="relative">
        <button
          id="provider-select"
          data-testid="provider-select"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isSaving}
          className="w-full flex items-center justify-between px-4 py-2 border rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          <span>
            {selectedProvider
              ? PROVIDER_NAMES[selectedProvider]
              : "기본 제공자 선택..."}
          </span>
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
            {enabledProviders.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500">
                먼저 제공자를 활성화해주세요
              </div>
            ) : (
              enabledProviders.map((provider) => (
                <button
                  key={provider}
                  type="button"
                  onClick={() => handleSelect(provider)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 transition"
                >
                  {PROVIDER_NAMES[provider]}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
