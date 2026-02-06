"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { SajuAnalysisPanel } from "@/components/students/saju-analysis-panel"
import { FaceAnalysisPanel } from "@/components/students/face-analysis-panel"
import { PalmAnalysisPanel } from "@/components/students/palm-analysis-panel"
import { MbtiAnalysisPanel } from "@/components/students/mbti-analysis-panel"
import { getStudentAnalysisData } from "@/lib/actions/student-analysis-tab"

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
    <Tabs value={subTab} onValueChange={setSubTab} data-testid="analysis-sub-tabs">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="saju">사주</TabsTrigger>
        <TabsTrigger value="face">관상</TabsTrigger>
        <TabsTrigger value="palm">손금</TabsTrigger>
        <TabsTrigger value="mbti">MBTI</TabsTrigger>
      </TabsList>

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
  )
}
