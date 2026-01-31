"use client"

import { useState, useEffect } from "react"
import { PerformanceDashboard } from "@/components/analytics/PerformanceDashboard"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, AlertCircle } from "lucide-react"
import { getTeachers } from "@/lib/actions/teachers"
import { compareTeachersByGradeImprovement, getCounselingStats, CounselingStats } from "@/lib/actions/analytics"
import { TeacherWithMetrics } from "@/components/analytics/TeacherPerformanceCard"
import { getTeacherStudentMetrics } from "@/lib/actions/teacher-performance"
import { TrendDataPoint } from "@/components/analytics/GradeTrendChart"

export default function AnalyticsPage() {
  const [teachers, setTeachers] = useState<TeacherWithMetrics[]>([])
  const [gradeTrendData, setGradeTrendData] = useState<TrendDataPoint[]>([])
  const [comparisonData, setComparisonData] = useState<any[]>([])
  const [counselingStats, setCounselingStats] = useState<CounselingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAnalyticsData() {
      setLoading(true)
      setError(null)
      try {
        const teachersList = await getTeachers()

        const teachersWithMetrics: TeacherWithMetrics[] = []
        for (const teacher of teachersList) {
          const metricsResult = await getTeacherStudentMetrics(teacher.id)
          if ("data" in metricsResult) {
            teachersWithMetrics.push({
              id: teacher.id,
              name: teacher.name,
              totalStudents: metricsResult.data.totalStudents,
              averageGradeChange: metricsResult.data.averageGradeChange,
              totalCounselingSessions: metricsResult.data.totalCounselingSessions,
              averageCompatibilityScore: metricsResult.data.averageCompatibilityScore,
              averageSatisfactionScore: 0,
              subjectDistribution: metricsResult.data.subjectDistribution,
            })
          }
        }

        setTeachers(teachersWithMetrics)

        const comparisonResult = await compareTeachersByGradeImprovement()
        if ("data" in comparisonResult) {
          setComparisonData(comparisonResult.data)
        } else {
          console.error("Comparison error:", (comparisonResult as any).error)
        }

        const counselingResult = await getCounselingStats()
        if ("data" in counselingResult) {
          setCounselingStats(counselingResult.data)
        } else {
          console.error("Counseling error:", (counselingResult as any).error)
        }

        const trendData: TrendDataPoint[] = []
        setGradeTrendData(trendData)
      } catch (err) {
        console.error("Failed to fetch analytics data:", err)
        setError("데이터를 불러오는데 실패했습니다")
      } finally {
        setLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">성과 분석</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            기간: 최근 3개월
          </span>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
              <span className="text-gray-500">데이터를 불러오는 중입니다...</span>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <span className="text-red-600 font-medium">{error}</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <PerformanceDashboard
          teachers={teachers}
          gradeTrendData={gradeTrendData}
          comparisonData={comparisonData}
          counselingStats={counselingStats}
        />
      )}
    </div>
  )
}
