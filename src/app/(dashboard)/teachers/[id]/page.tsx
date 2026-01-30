import { notFound } from 'next/navigation'
import { verifySession } from '@/lib/dal'
import { getTeacherById } from '@/lib/actions/teachers'
import { TeacherDetail } from '@/components/teachers/teacher-detail'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function TeacherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await verifySession()
  const teacher = await getTeacherById(id)

  if (!teacher) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/teachers">
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{teacher.name}</h1>
          <p className="text-gray-500">선생님 상세 정보</p>
        </div>
      </div>

      <TeacherDetail teacher={teacher} currentRole={session.role} />
    </div>
  )
}
