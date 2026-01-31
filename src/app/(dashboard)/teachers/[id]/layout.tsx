import Link from 'next/link'
import { notFound } from 'next/navigation'
import { verifySession } from '@/lib/dal'
import { getRBACPrisma } from '@/lib/db/rbac'
import type { TeacherRole } from '@/lib/db/rbac'

type LayoutProps = {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

async function checkTeacherAccess(
  session: { userId: string; role?: TeacherRole; teamId?: string | null },
  teacherId: string
): Promise<boolean> {
  if (session.role === 'DIRECTOR') {
    return true
  }

  if (session.role === 'TEACHER' || session.role === 'MANAGER') {
    return session.userId === teacherId
  }

  if (session.role === 'TEAM_LEADER') {
    if (session.userId === teacherId) {
      return true
    }

    const rbacDb = getRBACPrisma(session)
    const teacher = await rbacDb.teacher.findUnique({
      where: { id: teacherId },
      select: { teamId: true },
    })

    return teacher?.teamId === session.teamId
  }

  return false
}

export default async function TeacherLayout({ children, params }: LayoutProps) {
  const session = await verifySession()
  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">로그인이 필요합니다</p>
        </div>
      </div>
    )
  }

  const { id } = await params

  // RBAC 권한 체크
  const canAccess = await checkTeacherAccess(session, id)
  if (!canAccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">접근 권한이 없습니다</p>
        </div>
      </div>
    )
  }

  // 선생님 존재 확인
  const rbacDb = getRBACPrisma(session)
  const teacher = await rbacDb.teacher.findUnique({
    where: { id },
    select: { id: true, name: true },
  })

  if (!teacher) {
    notFound()
  }

  const tabs = [
    { href: `/teachers/${id}`, label: '기본 정보' },
    { href: `/teachers/${id}/analysis`, label: '성향 분석' },
    { href: `/teachers/${id}/students`, label: '담당 학생' },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 탭 네비게이션 */}
      <div className="border-b mb-6">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className="pb-4 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 data-[active=true]:border-blue-600 data-[active=true]:text-blue-600"
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* 페이지 콘텐츠 */}
      {children}
    </div>
  )
}
