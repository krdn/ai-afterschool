import Link from 'next/link'
import { verifySession } from '@/lib/dal'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { StudentTable } from '@/components/students/student-table'
import { EmptyState } from '@/components/students/empty-state'

export default async function StudentsPage() {
  const session = await verifySession()

  const students = await db.student.findMany({
    where: { teacherId: session.userId },
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

      {students.length === 0 ? <EmptyState /> : <StudentTable data={students} />}
    </div>
  )
}
