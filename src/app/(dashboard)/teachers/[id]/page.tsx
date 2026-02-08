import { notFound } from "next/navigation"
import { verifySession } from "@/lib/dal"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Pencil } from "lucide-react"
import { TeacherDeleteDialog } from "@/components/teachers/teacher-delete-dialog"
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

  const canEdit =
    session.role === "DIRECTOR" ||
    (session.role === "TEAM_LEADER" && session.teamId === teacher.teamId) ||
    session.userId === teacher.id

  const canDelete = session.role === "DIRECTOR" && session.userId !== teacher.id

  return (
    <div className="space-y-6">
      {/* 헤더: 이름 + 액션 버튼 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{teacher.name}</h1>
          <p className="text-gray-600">{teacher.email}</p>
          <div className="flex gap-2 mt-2">
            <span className="badge">{teacher.role}</span>
            {teacher.team && <span className="badge">{teacher.team.name}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/teachers/${teacher.id}/edit`}>
                <Pencil className="h-4 w-4 mr-2" />
                수정하기
              </Link>
            </Button>
          )}
          {canDelete && (
            <TeacherDeleteDialog
              teacherId={teacher.id}
              teacherName={teacher.name}
            />
          )}
        </div>
      </div>

      {/* 기본 정보 카드 */}
      <TeacherDetail
        teacher={teacher}
        currentRole={session.role as "DIRECTOR" | "TEAM_LEADER" | "MANAGER" | "TEACHER"}
        currentUserId={session.userId}
        currentTeamId={session.teamId ?? null}
      />
    </div>
  )
}
