import { notFound } from "next/navigation"
import { verifySession } from "@/lib/dal"
import { db } from "@/lib/db"
import { StudentDetail } from "@/components/students/student-detail"
import { SajuAnalysisPanel } from "@/components/students/saju-analysis-panel"
import { NameAnalysisPanel } from "@/components/students/name-analysis-panel"
import { MbtiAnalysisPanel } from "@/components/students/mbti-analysis-panel"
import { FaceAnalysisPanel } from "@/components/students/face-analysis-panel"
import { PalmAnalysisPanel } from "@/components/students/palm-analysis-panel"
import { PersonalitySummaryCard } from "@/components/students/personality-summary-card"
import { LearningStrategyPanel } from "@/components/students/learning-strategy-panel"
import { CareerGuidancePanel } from "@/components/students/career-guidance-panel"
import { ReportButton } from "@/components/students/report-button"
import { getCalculationStatus } from "@/lib/actions/calculation-analysis"

export default async function StudentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await verifySession()

  const student = await db.student.findFirst({
    where: {
      id,
      teacherId: session.userId,
    },
    include: {
      images: true,
    },
  })

  if (!student) {
    notFound()
  }

  type SajuAnalysisRecord = {
    result: unknown
    interpretation: string | null
    calculatedAt: Date
  }

  type NameAnalysisRecord = {
    result: unknown
    interpretation: string | null
    calculatedAt: Date
  }

  type FaceAnalysisRecord = {
    id: string
    status: string
    result: unknown
    imageUrl: string
    errorMessage: string | null
  } | null

  type PalmAnalysisRecord = {
    id: string
    status: string
    result: unknown
    imageUrl: string
    hand: string
    errorMessage: string | null
  } | null

  const sajuAnalysisDelegate = (
    db as unknown as {
      sajuAnalysis: {
        findUnique: (args: {
          where: { studentId: string }
        }) => Promise<SajuAnalysisRecord | null>
      }
    }
  ).sajuAnalysis

  const nameAnalysisDelegate = (
    db as unknown as {
      nameAnalysis: {
        findUnique: (args: {
          where: { studentId: string }
        }) => Promise<NameAnalysisRecord | null>
      }
    }
  ).nameAnalysis

  const mbtiAnalysisDelegate = (
    db as unknown as {
      mbtiAnalysis: {
        findUnique: (args: {
          where: { studentId: string }
        }) => Promise<{
          mbtiType: string
          percentages: Record<string, number>
          calculatedAt: Date
        } | null>
      }
    }
  ).mbtiAnalysis

  const faceAnalysisDelegate = (
    db as unknown as {
      faceAnalysis: {
        findUnique: (args: {
          where: { studentId: string }
        }) => Promise<FaceAnalysisRecord>
      }
    }
  ).faceAnalysis

  const palmAnalysisDelegate = (
    db as unknown as {
      palmAnalysis: {
        findUnique: (args: {
          where: { studentId: string }
        }) => Promise<PalmAnalysisRecord>
      }
    }
  ).palmAnalysis

  const [analysisStatus, sajuAnalysis, nameAnalysis, mbtiAnalysis, faceAnalysis, palmAnalysis] = await Promise.all([
    getCalculationStatus(student.id),
    sajuAnalysisDelegate.findUnique({
      where: {
        studentId: student.id,
      },
    }),
    nameAnalysisDelegate.findUnique({
      where: {
        studentId: student.id,
      },
    }),
    mbtiAnalysisDelegate.findUnique({
      where: {
        studentId: student.id,
      },
    }),
    faceAnalysisDelegate.findUnique({
      where: {
        studentId: student.id,
      },
    }),
    palmAnalysisDelegate.findUnique({
      where: {
        studentId: student.id,
      },
    }),
  ])

  // Extract face and palm image URLs from student images
  const faceImageUrl = student.images.find(img => img.type === 'face')?.resizedUrl || null
  const palmImageUrl = student.images.find(img => img.type === 'palm')?.resizedUrl || null

  return (
    <div className="space-y-6">
      <StudentDetail student={student} analysisStatus={analysisStatus} />
      <SajuAnalysisPanel student={student} analysis={sajuAnalysis} />
      <NameAnalysisPanel student={student} analysis={nameAnalysis} />
      <MbtiAnalysisPanel
        studentId={student.id}
        studentName={student.name}
        analysis={mbtiAnalysis}
      />
      {faceImageUrl && (
        <FaceAnalysisPanel
          studentId={student.id}
          analysis={faceAnalysis}
          faceImageUrl={faceImageUrl}
        />
      )}
      {palmImageUrl && (
        <PalmAnalysisPanel
          studentId={student.id}
          analysis={palmAnalysis}
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
