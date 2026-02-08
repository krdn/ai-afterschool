"use client"

import { useState } from "react"
import { Info } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { PromptPreviewDialog } from "./prompt-preview-dialog"
import type { AnalysisPromptId, AnalysisPromptMeta } from "@/lib/ai/saju-prompts"

type Props = {
  selectedPromptId: AnalysisPromptId
  onPromptChange: (id: AnalysisPromptId) => void
  promptOptions: AnalysisPromptMeta[]
  disabled?: boolean
}

export function PromptSelector({
  selectedPromptId,
  onPromptChange,
  promptOptions,
  disabled = false,
}: Props) {
  const [previewOpen, setPreviewOpen] = useState(false)

  const selectedMeta = promptOptions.find((p) => p.id === selectedPromptId) ?? null
  const showInfo = selectedPromptId !== "default"

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-600 whitespace-nowrap">프롬프트:</label>
      <Select
        value={selectedPromptId}
        onValueChange={(v) => onPromptChange(v as AnalysisPromptId)}
        disabled={disabled}
      >
        <SelectTrigger className="w-[200px] h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {promptOptions.map((opt) => (
            <SelectItem key={opt.id} value={opt.id}>
              {opt.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {showInfo && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setPreviewOpen(true)}
          disabled={disabled}
        >
          <Info className="h-4 w-4 text-gray-500" />
        </Button>
      )}
      <PromptPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        prompt={selectedMeta}
      />
    </div>
  )
}
