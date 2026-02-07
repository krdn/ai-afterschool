"use client"

import { useState, useEffect, useCallback } from "react"
import { History } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { SajuAnalysisPanel } from "@/components/students/saju-analysis-panel"
import { FaceAnalysisPanel } from "@/components/students/face-analysis-panel"
import { PalmAnalysisPanel } from "@/components/students/palm-analysis-panel"
import { MbtiAnalysisPanel } from "@/components/students/mbti-analysis-panel"
import { AnalysisHistoryDialog } from "@/components/students/analysis-history-dialog"
import { AnalysisHistoryDetailDialog } from "@/components/students/analysis-history-detail-dialog"
import { getStudentAnalysisData } from "@/lib/actions/student-analysis-tab"
import { getAnalysisHistory } from "@/lib/actions/analysis"
import type { AnalysisHistoryItem } from "@/components/students/analysis-history-dialog"

export default function AnalysisTab({ studentId }: { studentId: string }) {
  const [subTab, setSubTab] = useState("saju")
  const [data, setData] = useState<{
    student: {
      id: string
      name: string
      birthDate: Date | string
      birthTimeHour: number | null
      birthTimeMinute: number | null
      sajuAnalysis: {
        result: unknown
        interpretation: string | null
        calculatedAt: Date | string
      } | null
      images: Array<{
        type: string
        originalUrl: string
        resizedUrl: string
      }> | null
    } | null
    faceAnalysis: any
    palmAnalysis: any
    mbtiAnalysis: any
  }>({ student: null, faceAnalysis: null, palmAnalysis: null, mbtiAnalysis: null })
  const [loading, setLoading] = useState(true)

  // History dialog states
  const [showHistory, setShowHistory] = useState(false)
  const [showHistoryDetail, setShowHistoryDetail] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyItems, setHistoryItems] = useState<AnalysisHistoryItem[]>([])
  const [historyNote, setHistoryNote] = useState<string>()
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<AnalysisHistoryItem | null>(null)

  // Tab titles for history
  const tabTitles: Record<string, string> = {
    saju: "사주",
    face: "관상",
    palm: "손금",
    mbti: "MBTI",
  }

  // Fetch history when dialog opens
  useEffect(() => {
    if (showHistory) {
      const loadHistory = async () => {
        setHistoryLoading(true)
        try {
          const result = await getAnalysisHistory(
            studentId,
            subTab as 'saju' | 'face' | 'palm' | 'mbti'
          )
          if (result.success) {
            setHistoryItems(result.history)
            setHistoryNote(result.note)
          }
        } catch (error) {
          console.error("Failed to load history:", error)
        } finally {
          setHistoryLoading(false)
        }
      }

      loadHistory()
    }
  }, [showHistory, studentId, subTab])

  // Handle view detail
  const handleViewDetail = useCallback((item: AnalysisHistoryItem) => {
    setSelectedHistoryItem(item)
    setShowHistory(false)
    setShowHistoryDetail(true)
  }, [])

  // Handle close detail
  const handleCloseDetail = useCallback(() => {
    setShowHistoryDetail(false)
    setSelectedHistoryItem(null)
  }, [])

  // Fetch student and analysis data
  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await getStudentAnalysisData(studentId)
        setData(result)
      } catch (error) {
        console.error("Failed to load analysis data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [studentId])

  if (loading) {
    return (
      <div data-testid="analysis-loading" className="flex justify-center items-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!data.student) {
    return (
      <div className="text-center py-8 text-gray-500">
        학생 정보를 불러올 수 없습니다.
      </div>
    )
  }

  // Get image URLs for analysis panels
  const faceImageUrl = data.student.images?.find(img => img.type === "face")?.originalUrl || null
  const palmImageUrl = data.student.images?.find(img => img.type === "palm")?.originalUrl || null

  return (
    <>
      <Tabs value={subTab} onValueChange={setSubTab} data-testid="analysis-sub-tabs">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="saju" data-testid="saju-tab">사주</TabsTrigger>
            <TabsTrigger value="face" data-testid="face-tab">관상</TabsTrigger>
            <TabsTrigger value="palm" data-testid="palm-tab">손금</TabsTrigger>
            <TabsTrigger value="mbti" data-testid="mbti-tab">MBTI</TabsTrigger>
          </TabsList>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-2"
            data-testid="history-button"
          >
            <History className="w-4 h-4" />
            이력 보기
          </Button>
        </div>

        <TabsContent value="saju" className="mt-6">
          <SajuAnalysisPanel
            student={{
              id: data.student.id,
              name: data.student.name,
              birthDate: data.student.birthDate,
              birthTimeHour: data.student.birthTimeHour,
              birthTimeMinute: data.student.birthTimeMinute
            }}
            analysis={data.student.sajuAnalysis}
          />
        </TabsContent>

        <TabsContent value="face" className="mt-6">
          <FaceAnalysisPanel
            studentId={studentId}
            analysis={data.faceAnalysis}
            faceImageUrl={faceImageUrl}
          />
        </TabsContent>

        <TabsContent value="palm" className="mt-6">
          <PalmAnalysisPanel
            studentId={studentId}
            analysis={data.palmAnalysis}
            palmImageUrl={palmImageUrl}
          />
        </TabsContent>

        <TabsContent value="mbti" className="mt-6">
          <MbtiAnalysisPanel
            studentId={studentId}
            studentName={data.student.name}
            analysis={data.mbtiAnalysis}
          />
        </TabsContent>
      </Tabs>

      {/* History List Dialog */}
      <AnalysisHistoryDialog
        open={showHistory}
        onOpenChange={setShowHistory}
        title={`${tabTitles[subTab]} 분석 이력`}
        history={historyItems}
        note={historyNote}
        loading={historyLoading}
        onViewDetail={handleViewDetail}
      />

      {/* History Detail Dialog */}
      <AnalysisHistoryDetailDialog
        open={showHistoryDetail}
        onOpenChange={handleCloseDetail}
        title={`${tabTitles[subTab]} 분석 상세`}
        item={selectedHistoryItem}
        type={subTab as 'saju' | 'face' | 'palm' | 'mbti'}
      />
    </>
  )
}
