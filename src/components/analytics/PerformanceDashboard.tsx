"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { PerformanceMetricsGrid } from "./PerformanceMetricsGrid"
import { GradeTrendChart } from "./GradeTrendChart"
import { MultiSubjectChart } from "./MultiSubjectChart"
import { ControlVariablePanel } from "./ControlVariablePanel"
import { TeacherWithMetrics } from "./TeacherPerformanceCard"
import { BarChart3, Users, TrendingUp, FileDown } from "lucide-react"

interface PerformanceDashboardProps {
  teamId?: string
  dateRange?: "1M" | "3M" | "6M" | "1Y"
}

export function PerformanceDashboard({
  dateRange = "3M",
}: PerformanceDashboardProps) {
  const [activeTab, setActiveTab] = useState("individual")
  const [selectedDateRange, setSelectedDateRange] = useState(dateRange)
  const [controlVariables, setControlVariables] = useState({
    initialGradeFilter: true,
    attendanceFilter: true,
  })

  const tabs = [
    { value: "individual", label: "개별 성과" },
    { value: "trend", label: "성적 추이" },
    { value: "comparison", label: "비교 분석" },
    { value: "summary", label: "통계 요약" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start">
        <div className="flex flex-wrap gap-4">
          <Select value={selectedDateRange} onValueChange={(v) => setSelectedDateRange(v as "1M" | "3M" | "6M" | "1Y")}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1M">최근 1개월</SelectItem>
              <SelectItem value="3M">최근 3개월</SelectItem>
              <SelectItem value="6M">최근 6개월</SelectItem>
              <SelectItem value="1Y">최근 1년</SelectItem>
            </SelectContent>
          </Select>
          <ControlVariablePanel
            controlVariables={controlVariables}
            onToggle={(key) => setControlVariables((prev) => ({
              ...prev,
              [key]: !prev[key as keyof typeof prev],
            }))}
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <FileDown className="w-4 h-4" />
          리포트 다운로드
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="individual" className="space-y-4">
          <PerformanceMetricsGrid teachers={[]} />
        </TabsContent>

        <TabsContent value="trend" className="space-y-4">
          <div className="flex gap-4">
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="text-base">과목 필터</CardTitle>
              </CardHeader>
              <CardContent>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="math">수학</SelectItem>
                    <SelectItem value="english">영어</SelectItem>
                    <SelectItem value="korean">국어</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>
          <GradeTrendChart data={[]} title="팀 성적 추이" />
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">선생님 선택</CardTitle>
              </CardHeader>
              <CardContent>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="첫 번째 선생님" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teacher1">선생님 1</SelectItem>
                    <SelectItem value="teacher2">선생님 2</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">비교 기준</CardTitle>
              </CardHeader>
              <CardContent>
                <Select defaultValue="improvement">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="improvement">성적 향상률</SelectItem>
                    <SelectItem value="compatibility">궁합 점수</SelectItem>
                    <SelectItem value="satisfaction">학생 만족도</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>
          <MultiSubjectChart data={[]} title="선생님 비교" comparison={true} />
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  총 학생 수
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">0</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  평균 성적 향상
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">0%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  총 상담 횟수
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">0</div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>팀 통계 상세</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-500 py-8 text-center">
                데이터를 불러오는 중입니다...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
