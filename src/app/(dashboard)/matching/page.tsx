import Link from "next/link"
import { verifySession } from "@/lib/dal"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ManualAssignmentForm } from "@/components/assignment/manual-assignment-form"
import { BatchAssignment } from "@/components/assignment/batch-assignment"
import { TeacherAssignmentTable } from "@/components/assignment/teacher-assignment-table"
import { MatchingHistoryTab } from "@/components/matching/MatchingHistoryTab"
import { Users, Brain, ArrowRight } from "lucide-react"

export default async function MatchingPage() {
  await verifySession()

  const totalStudents = await db.student.count()

  const teachers = await db.teacher.findMany({
    where: {
      role: {
        in: ["TEACHER", "MANAGER", "TEAM_LEADER"],
      },
    },
    select: {
      id: true,
      name: true,
      role: true,
      email: true,
      students: {
        select: {
          id: true,
          name: true,
          school: true,
          grade: true,
        },
      },
    },
    orderBy: { name: "asc" },
  })

  const averageStudentsPerTeacher =
    teachers.length > 0 ? Math.round(totalStudents / teachers.length) : 0

  const allStudents = await db.student.findMany({
    select: {
      id: true,
      name: true,
      school: true,
      grade: true,
      teacherId: true,
    },
  })

  const teachersList = teachers.map((t) => ({
    id: t.id,
    name: t.name,
    role: t.role,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">배정 관리</h1>
          <p className="text-gray-500">학생-선생님 배정 현황 및 관리</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 학생</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}명</div>
            <p className="text-xs text-muted-foreground">
              {teachers.length}명의 선생님에게 배정됨
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 담당 학생</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageStudentsPerTeacher}명</div>
            <p className="text-xs text-muted-foreground">
              선생님 {teachers.length}명 기준
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs UI - 기존 컨텐츠를 배정 현황 탭으로 이동 */}
      <MatchingPageTabs
        teachers={teachers}
        allStudents={allStudents}
        teachersList={teachersList}
      />
    </div>
  )
}

// 별도의 Client Component로 탭 상태 관리
import { MatchingPageTabs } from "./matching-tabs"
