import Link from "next/link"
import { getCurrentTeacher } from "@/lib/dal"
import { NotificationBell } from "@/components/layout/notification-bell"
import { UserMenu } from "@/components/layout/user-menu"
import { DevUserSwitcher } from "@/components/dev/dev-user-switcher"

const isDev = process.env.NODE_ENV === "development"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const teacher = await getCurrentTeacher()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/students" className="text-xl font-bold">
                AI AfterSchool
              </Link>
              <nav className="hidden md:flex space-x-4">
                <Link
                  href="/students"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  학생 관리
                </Link>
                <Link
                  href="/counseling"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  상담
                </Link>
                {(teacher.role === "DIRECTOR" || teacher.role === "TEAM_LEADER") && (
                  <>
                    <Link
                      href="/teachers"
                      className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      선생님
                    </Link>
                    <Link
                      href="/matching"
                      className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      매칭
                    </Link>
                    <Link
                      href="/analytics"
                      className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      분석
                    </Link>
                  </>
                )}
                {(teacher.role === "DIRECTOR" || teacher.role === "TEAM_LEADER") && (
                  <Link
                    href="/admin"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    관리자 도구
                  </Link>
                )}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              {teacher.role === "DIRECTOR" && <NotificationBell />}
              <UserMenu name={teacher.name} role={teacher.role} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {isDev && <DevUserSwitcher currentUserId={teacher.id} />}
    </div>
  )
}
