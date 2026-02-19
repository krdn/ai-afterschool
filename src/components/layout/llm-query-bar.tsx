"use client"

import { useState, useCallback, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { Sparkles, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function LLMQueryBar() {
  const t = useTranslations("LLMChat")
  const router = useRouter()
  const pathname = usePathname()
  const [prompt, setPrompt] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = useCallback(() => {
    const trimmed = prompt.trim()
    if (!trimmed) {
      toast.error(t("errorNoPrompt"))
      return
    }
    router.push(`/chat?q=${encodeURIComponent(trimmed)}`)
    setPrompt("")
  }, [prompt, router, t])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  // 채팅 페이지에서는 자체 입력창이 있으므로 숨김
  if (pathname.includes("/chat")) return null

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-500 flex-shrink-0" />

          <input
            ref={inputRef}
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("placeholder")}
            className="flex-1 h-[38px] px-3 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />

          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!prompt.trim()}
            className="h-[38px] flex-shrink-0"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">{t("send")}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
