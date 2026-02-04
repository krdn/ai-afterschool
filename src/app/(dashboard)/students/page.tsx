import Link from 'next/link'
import { verifySession } from '@/lib/dal'
import { getRBACPrisma } from '@/lib/db/rbac'
import { Button } from '@/components/ui/button'
import { StudentTable } from '@/components/students/student-table'
import { EmptyState } from '@/components/students/empty-state'

export default async function StudentsPage() {
  const session = await verifySession()
  const rbacDb = getRBACPrisma(session)

  // 권한에 따른 학생 조회
  const canViewAll = session.role === 'DIRECTOR'
  const canViewTeam = session.role === 'TEAM_LEADER' || session.role === 'MANAGER'

  const students = await rbacDb.student.findMany({
    where: canViewAll
      ? undefined
      : canViewTeam && session.teamId
      ? { teamId: session.teamId }
      : { teacherId: session.userId },
    select: {
      id: true,
      name: true,
      school: true,
      grade: true,
      targetUniversity: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">학생 관리</h1>
          <p className="text-gray-500">
            {students.length > 0
              ? `총 ${students.length}명의 학생이 등록되어 있어요`
              : '학생을 등록해보세요'}
          </p>
        </div>
        {students.length > 0 && (
          <Button asChild>
            <Link href="/students/new">학생 등록</Link>
          </Button>
        )}
      </div>

      {students.length === 0 ? (
        <EmptyState
          tips={[
            '이름, 생년월일, 학교, 학년 정보만으로 등록할 수 있어요',
            '등록 후 MBTI 검사와 성향 분석을 진행할 수 있어요',
            '사진을 업로드하면 관상/손금 분석도 가능해요',
          ]}
        />
      ) : (
        <StudentTable data={students} />
      )}
    </div>
  )
}
