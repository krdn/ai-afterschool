"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getPromptPreviewAction } from "@/app/(dashboard)/students/[id]/saju/actions"
import type { AnalysisPromptMeta } from "@/lib/ai/saju-prompts"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  prompt: AnalysisPromptMeta | null
}

export function PromptPreviewDialog({ open, onOpenChange, prompt }: Props) {
  const [view, setView] = useState<"info" | "prompt">("info")
  const [previewText, setPreviewText] = useState("")
  const [previewLoading, setPreviewLoading] = useState(false)

  // DB에서 프롬프트 미리보기 로드
  useEffect(() => {
    if (open && view === "prompt" && prompt) {
      setPreviewLoading(true)
      getPromptPreviewAction(prompt.id)
        .then(setPreviewText)
        .catch(() => setPreviewText("미리보기를 불러올 수 없습니다."))
        .finally(() => setPreviewLoading(false))
    }
  }, [open, view, prompt])

  if (!prompt) return null

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setView("info") }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{prompt.name}</DialogTitle>
          <DialogDescription>{prompt.shortDescription}</DialogDescription>
        </DialogHeader>

        <div className="flex gap-1 border-b pb-2">
          <Button
            variant={view === "info" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("info")}
          >
            정보
          </Button>
          <Button
            variant={view === "prompt" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("prompt")}
          >
            프롬프트 원문
          </Button>
        </div>

        {view === "info" ? (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-[80px_1fr] gap-y-3 gap-x-2">
              <span className="text-gray-500">대상</span>
              <span>{prompt.target}</span>

              <span className="text-gray-500">난이도</span>
              <span>{prompt.levels}</span>

              <span className="text-gray-500">목적</span>
              <span className="text-gray-700">{prompt.purpose}</span>

              <span className="text-gray-500">추천 시기</span>
              <span>{prompt.recommendedTiming}</span>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {prompt.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            {previewLoading ? (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                미리보기 로딩 중...
              </div>
            ) : (
              <>
                <pre className="text-xs leading-5 text-gray-700 whitespace-pre-wrap break-words font-mono bg-gray-50 rounded-md p-3 border">
                  {previewText}
                </pre>
                <p className="text-xs text-gray-400 mt-2">
                  * DB에 저장된 프롬프트 원문입니다. 실제 분석 시 {"{학생정보}"}, {"{사주데이터}"} 부분이 학생 데이터로 치환됩니다.
                </p>
              </>
            )}
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}
