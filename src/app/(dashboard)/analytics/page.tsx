"use client"

import { useState } from "react"
import { PerformanceDashboard } from "@/components/analytics/PerformanceDashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)

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
      ) : (
        <PerformanceDashboard />
      )}
    </div>
  )
}
