import Link from "next/link"
import { getCurrentTeacher } from "@/lib/dal"
import { LogoutButton } from "@/components/auth/logout-button"
import { NotificationBell } from "@/components/layout/notification-bell"

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
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              {teacher.role === "DIRECTOR" && <NotificationBell />}
              <span className="text-sm text-gray-600">{teacher.name}</span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
