import { notFound } from "next/navigation"
import { verifySession } from "@/lib/dal"
import { db } from "@/lib/db"
import { TeacherMbtiPanel } from "@/components/teachers/teacher-mbti-panel"
import { TeacherSajuPanel } from "@/components/teachers/teacher-saju-panel"
import { TeacherNamePanel } from "@/components/teachers/teacher-name-panel"
import { TeacherFacePanel } from "@/components/teachers/teacher-face-panel"
import { TeacherPalmPanel } from "@/components/teachers/teacher-palm-panel"
import type { SajuResult } from "@/lib/analysis/saju"
import type { NameNumerologyResult } from "@/lib/analysis/name-numerology"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function TeacherAnalysisPage({ params }: PageProps) {
  const session = await verifySession()
  if (!session) {
    return <div>Unauthorized</div>
  }

  const { id } = await params

  const teacher = await db.teacher.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      birthDate: true,
      birthTimeHour: true,
      birthTimeMinute: true,
      nameHanja: true,
      teacherMbtiAnalysis: true,
      teacherSajuAnalysis: true,
      teacherNameAnalysis: true,
      teacherFaceAnalysis: true,
      teacherPalmAnalysis: true,
    },
  })

  if (!teacher) {
    notFound()
  }

  const mbtiAnalysis = teacher.teacherMbtiAnalysis
    ? {
        ...teacher.teacherMbtiAnalysis,
        percentages: teacher.teacherMbtiAnalysis.percentages as Record<string, number>,
      }
    : null

  const sajuAnalysis = teacher.teacherSajuAnalysis
    ? {
        ...teacher.teacherSajuAnalysis,
        result: teacher.teacherSajuAnalysis.result as SajuResult,
      }
    : null

  const nameAnalysis = teacher.teacherNameAnalysis
    ? {
        ...teacher.teacherNameAnalysis,
        result: teacher.teacherNameAnalysis.result as NameNumerologyResult,
      }
    : null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* MBTI 분석 */}
      <TeacherMbtiPanel
        teacherId={teacher.id}
        teacherName={teacher.name}
        analysis={mbtiAnalysis}
      />

      {/* 사주 분석 */}
      <TeacherSajuPanel
        teacherId={teacher.id}
        teacherName={teacher.name}
        analysis={sajuAnalysis}
        teacherBirthDate={teacher.birthDate}
        teacherBirthTimeHour={teacher.birthTimeHour}
        teacherBirthTimeMinute={teacher.birthTimeMinute}
      />

      {/* 이름 분석 */}
      <TeacherNamePanel
        teacherId={teacher.id}
        teacherName={teacher.name}
        analysis={nameAnalysis}
        teacherNameHanja={teacher.nameHanja}
      />

      {/* 관상 분석 */}
      {teacher.teacherFaceAnalysis && (
        <TeacherFacePanel
          teacherId={teacher.id}
          teacherName={teacher.name}
          analysis={teacher.teacherFaceAnalysis}
          faceImageUrl={teacher.teacherFaceAnalysis.imageUrl}
        />
      )}

      {/* 손금 분석 */}
      {teacher.teacherPalmAnalysis && (
        <TeacherPalmPanel
          teacherId={teacher.id}
          teacherName={teacher.name}
          analysis={teacher.teacherPalmAnalysis}
          palmImageUrl={teacher.teacherPalmAnalysis.imageUrl}
        />
      )}
    </div>
  )
}
