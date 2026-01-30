import { notFound } from "next/navigation"
import { verifySession } from "@/lib/dal"
import { db } from "@/lib/db"
import { TeacherMbtiPanel } from "@/components/teachers/teacher-mbti-panel"
import { TeacherSajuPanel } from "@/components/teachers/teacher-saju-panel"
import { TeacherNamePanel } from "@/components/teachers/teacher-name-panel"
import { TeacherFacePanel } from "@/components/teachers/teacher-face-panel"
import { TeacherPalmPanel } from "@/components/teachers/teacher-palm-panel"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { SajuResult } from "@/lib/analysis/saju"
import type { NameNumerologyResult } from "@/lib/analysis/name-numerology"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function TeacherDetailPage({ params }: PageProps) {
  const session = await verifySession()
  if (!session) {
    return <div>Unauthorized</div>
  }

  const { id } = await params

  // Teacher 조회 (모든 분석 데이터 포함)
  const teacher = await db.teacher.findUnique({
    where: { id },
    include: {
      team: true,
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

  // Type casts for Prisma JsonValue to component-expected types
  // The analysis components expect specific types but Prisma returns JsonValue
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

  // RBAC: 팀 데이터 접근 제어 (Phase 11-02 패턴 재사용)
  const canAccess =
    session.role === "DIRECTOR" ||
    (session.role === "TEAM_LEADER" && session.teamId === teacher.teamId) ||
    session.userId === teacher.id

  if (!canAccess) {
    return <div>Access Denied</div>
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* 뒤로 가기 및 헤더: 기본 정보 */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/teachers">
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{teacher.name}</h1>
          <p className="text-gray-600">{teacher.email}</p>
          <div className="flex gap-2 mt-2">
            <span className="badge">{teacher.role}</span>
            {teacher.team && <span className="badge">{teacher.team.name}</span>}
          </div>
        </div>
      </div>

      {/* 분석 패널 그리드 */}
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

        {/* 관상 분석 - imageUrl은 분석 결과에서 가져옴 */}
        {teacher.teacherFaceAnalysis && (
          <TeacherFacePanel
            teacherId={teacher.id}
            teacherName={teacher.name}
            analysis={teacher.teacherFaceAnalysis}
            faceImageUrl={teacher.teacherFaceAnalysis.imageUrl}
          />
        )}

        {/* 손금 분석 - imageUrl은 분석 결과에서 가져옴 */}
        {teacher.teacherPalmAnalysis && (
          <TeacherPalmPanel
            teacherId={teacher.id}
            teacherName={teacher.name}
            analysis={teacher.teacherPalmAnalysis}
            palmImageUrl={teacher.teacherPalmAnalysis.imageUrl}
          />
        )}
      </div>
    </div>
  )
}
