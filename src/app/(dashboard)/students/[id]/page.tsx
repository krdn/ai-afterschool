import { notFound } from "next/navigation"
import { verifySession } from "@/lib/dal"
import { db } from "@/lib/db"
import { getPersonalitySummary } from "@/lib/db/personality-summary"
import { StudentDetail } from "@/components/students/student-detail"
import { SajuAnalysisPanel } from "@/components/students/saju-analysis-panel"
import { NameAnalysisPanel } from "@/components/students/name-analysis-panel"
import { MbtiAnalysisPanel } from "@/components/students/mbti-analysis-panel"
import { FaceAnalysisPanel } from "@/components/students/face-analysis-panel"
import { PalmAnalysisPanel } from "@/components/students/palm-analysis-panel"
import { PersonalitySummaryCardInline } from "@/components/students/personality-summary-card-inline"
import { LearningStrategyPanelInline } from "@/components/students/learning-strategy-panel-inline"
import { CareerGuidancePanelInline } from "@/components/students/career-guidance-panel-inline"
import { ReportButton } from "@/components/students/report-button"

export default async function StudentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await verifySession()

  // 단일 쿼리로 모든 관계 로드 (N+1 최적화)
  const student = await db.student.findFirst({
    where: {
      id,
      teacherId: session.userId,
    },
    include: {
      images: true,
      sajuAnalysis: true,
      nameAnalysis: true,
      mbtiAnalysis: true,
      faceAnalysis: true,
      palmAnalysis: true,
      personalitySummary: true,
    },
  })

  if (!student) {
    notFound()
  }

  // getCalculationStatus에서 필요한 데이터를 student에서 직접 계산
  const analysisStatus = {
    studentId: student.id,
    sajuCalculatedAt: student.sajuAnalysis?.calculatedAt ?? null,
    nameCalculatedAt: student.nameAnalysis?.calculatedAt ?? null,
    latestCalculatedAt: (() => {
      const sajuAt = student.sajuAnalysis?.calculatedAt ?? null
      const nameAt = student.nameAnalysis?.calculatedAt ?? null
      if (!sajuAt && !nameAt) return null
      if (sajuAt && nameAt) return sajuAt > nameAt ? sajuAt : nameAt
      return sajuAt ?? nameAt
    })(),
    needsRecalculation: student.calculationRecalculationNeeded,
    recalculationReason: student.calculationRecalculationReason,
    recalculationAt: student.calculationRecalculationAt,
  }

  // Extract face and palm image URLs from student images
  const faceImageUrl = student.images.find(img => img.type === 'face')?.resizedUrl || null
  const palmImageUrl = student.images.find(img => img.type === 'palm')?.resizedUrl || null

  return (
    <div className="space-y-6">
      <StudentDetail student={student} analysisStatus={analysisStatus} />
      <SajuAnalysisPanel student={student} analysis={student.sajuAnalysis} />
      <NameAnalysisPanel student={student} analysis={student.nameAnalysis} />
      <MbtiAnalysisPanel
        studentId={student.id}
        studentName={student.name}
        analysis={student.mbtiAnalysis}
      />
      {faceImageUrl && (
        <FaceAnalysisPanel
          studentId={student.id}
          analysis={student.faceAnalysis}
          faceImageUrl={faceImageUrl}
        />
      )}
      {palmImageUrl && (
        <PalmAnalysisPanel
          studentId={student.id}
          analysis={student.palmAnalysis}
          palmImageUrl={palmImageUrl}
        />
      )}

      <section>
        <h2 className="text-2xl font-bold mb-4">통합 성향 분석</h2>
        <PersonalitySummaryCard studentId={student.id} teacherId={session.userId} />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">AI 맞춤형 제안</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LearningStrategyPanel studentId={student.id} teacherId={session.userId} />
          <CareerGuidancePanel studentId={student.id} teacherId={session.userId} />
        </div>
      </section>

      {/* PDF Report Section */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">상담 보고서</h3>
            <p className="text-sm text-gray-600">
              학생의 모든 분석 결과와 AI 제안을 포함한 종합 PDF 보고서를 생성합니다.
            </p>
          </div>
          <ReportButton studentId={student.id} />
        </div>
      </div>
    </div>
  )
}
