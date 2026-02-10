import { notFound } from "next/navigation"
import { verifySession } from "@/lib/dal"
import { db } from "@/lib/db"
import { TeacherDetail } from "@/components/teachers/teacher-detail"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function TeacherDetailPage({ params }: PageProps) {
  const session = await verifySession()
  if (!session) {
    return <div>Unauthorized</div>
  }

  const { id } = await params

  const teacher = await db.teacher.findUnique({
    where: { id },
    include: {
      team: true,
    },
  })

  if (!teacher) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* 헤더: 이름 */}
      <div>
        <h1 className="text-3xl font-bold">{teacher.name}</h1>
        <p className="text-gray-600">{teacher.email}</p>
        <div className="flex gap-2 mt-2">
          <span className="badge">{teacher.role}</span>
          {teacher.team && <span className="badge">{teacher.team.name}</span>}
        </div>
      </div>

      {/* 기본 정보 카드 (수정/삭제 버튼 포함) */}
      <TeacherDetail
        teacher={teacher}
        currentRole={session.role as "DIRECTOR" | "TEAM_LEADER" | "MANAGER" | "TEACHER"}
        currentUserId={session.userId}
        currentTeamId={session.teamId ?? null}
      />
    </div>
  )
}
