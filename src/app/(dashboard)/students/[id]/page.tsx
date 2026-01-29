import { notFound } from "next/navigation"
import { verifySession } from "@/lib/dal"
import { db } from "@/lib/db"
import { StudentDetail } from "@/components/students/student-detail"
import { SajuAnalysisPanel } from "@/components/students/saju-analysis-panel"
import { NameAnalysisPanel } from "@/components/students/name-analysis-panel"
import { MbtiAnalysisPanel } from "@/components/students/mbti-analysis-panel"
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

  const [analysisStatus, sajuAnalysis, nameAnalysis, mbtiAnalysis] = await Promise.all([
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
  ])

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
    </div>
  )
}
