import { verifySession } from "@/lib/dal"
import { getRBACPrisma } from "@/lib/db/rbac"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CounselingSessionForm,
} from "@/components/counseling/CounselingSessionForm"
import type { CounselingType, Prisma } from "@prisma/client"

type PageProps = {
  searchParams: Promise<{
    studentName?: string
    teacherName?: string
    type?: string
    startDate?: string
    endDate?: string
    followUpRequired?: string
  }>
}

export default async function CounselingPage({
  searchParams,
}: PageProps) {
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

  const params = await searchParams

  const canViewAll = session.role === "DIRECTOR"
  const canViewTeam =
    session.role === "TEAM_LEADER" ||
    session.role === "MANAGER" ||
    session.role === "DIRECTOR"

  const rbacDb = getRBACPrisma(session)

  // Build teacher filter conditions
  const teacherConditions: Prisma.TeacherWhereInput = {}
  if (params.teacherName && canViewTeam) {
    teacherConditions.name = {
      contains: params.teacherName,
      mode: "insensitive",
    }
  }
  if (session.role === "TEAM_LEADER" && session.teamId) {
    teacherConditions.teamId = session.teamId
  }

  const where: Prisma.CounselingSessionWhereInput = {}

  if (params.studentName) {
    where.student = {
      name: {
        contains: params.studentName,
        mode: "insensitive",
      },
    }
  }

  if (Object.keys(teacherConditions).length > 0) {
    where.teacher = teacherConditions
  }

  if (params.type && params.type !== "all") {
    where.type = params.type as CounselingType
  }

  if (params.startDate || params.endDate) {
    where.sessionDate = {}
    if (params.startDate) {
      where.sessionDate.gte = new Date(params.startDate)
    }
    if (params.endDate) {
      where.sessionDate.lte = new Date(params.endDate)
    }
  }

  if (params.followUpRequired === "true") {
    where.followUpRequired = true
  }

  if (!canViewAll && !canViewTeam) {
    where.teacherId = session.userId
  }

  const sessions = await rbacDb.counselingSession.findMany({
    where,
    include: {
      student: {
        select: {
          id: true,
          name: true,
          school: true,
          grade: true,
        },
      },
      teacher: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: {
      sessionDate: "desc",
    },
    take: 100,
  })

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const monthlySessions = sessions.filter(
    (s) => new Date(s.sessionDate) >= startOfMonth
  )

  const totalSessions = sessions.length
  const monthlyCount = monthlySessions.length
  const typeDistribution = sessions.reduce(
    (acc, s) => {
      acc[s.type] = (acc[s.type] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )
  const avgDuration =
    sessions.length > 0
      ? sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length
      : 0
  const followUpCount = sessions.filter((s) => s.followUpRequired).length

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">상담 관리</h1>
          <p className="text-gray-600">선생님-학생 상담 기록을 관리합니다</p>
        </div>
        <Button variant="outline" asChild>
          <a href="/counseling/new">새 상담 기록</a>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              이번 달 상담 횟수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{monthlyCount}회</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              전체 상담 횟수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalSessions}회</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              평균 상담 시간
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {avgDuration.toFixed(0)}분
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              후속 조치 예정
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{followUpCount}건</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>필터</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label htmlFor="studentName">학생 이름</Label>
              <Input
                id="studentName"
                name="studentName"
                defaultValue={params.studentName || ""}
                placeholder="이름 검색"
              />
            </div>

            {(canViewTeam || canViewAll) && (
              <div className="space-y-2">
                <Label htmlFor="teacherName">선생님 이름</Label>
                <Input
                  id="teacherName"
                  name="teacherName"
                  defaultValue={params.teacherName || ""}
                  placeholder="이름 검색"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="type">상담 유형</Label>
              <Select name="type" defaultValue={params.type || "all"}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="ACADEMIC">학업</SelectItem>
                  <SelectItem value="CAREER">진로</SelectItem>
                  <SelectItem value="PSYCHOLOGICAL">심리</SelectItem>
                  <SelectItem value="BEHAVIORAL">행동</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">시작일</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                defaultValue={params.startDate || ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">종료일</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                defaultValue={params.endDate || ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="followUpRequired">후속 조치</Label>
              <Select
                name="followUpRequired"
                defaultValue={params.followUpRequired || "all"}
              >
                <SelectTrigger id="followUpRequired">
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="true">필요함</SelectItem>
                  <SelectItem value="false">필요하지 않음</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-6 flex justify-end">
              <Button type="submit" variant="outline">
                필터 적용
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>상담 기록 ({sessions.length}건)</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">조건에 맞는 상담 기록이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {session.student.name} ({session.student.school}{" "}
                        {session.student.grade}학년)
                      </div>
                      <div className="text-sm text-gray-600">
                        {session.teacher.name} · {session.duration}분
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                        session.type
                      )}`}
                    >
                      {getTypeLabel(session.type)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700">{session.summary}</div>
                  {session.followUpRequired && (
                    <div className="text-sm text-amber-600">
                      후속 조치:{" "}
                      {session.followUpDate
                        ? new Date(session.followUpDate).toLocaleDateString(
                            "ko-KR"
                          )
                        : "예정됨"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    ACADEMIC: "학업",
    CAREER: "진로",
    PSYCHOLOGICAL: "심리",
    BEHAVIORAL: "행동",
  }
  return labels[type] || type
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    ACADEMIC: "bg-blue-100 text-blue-800",
    CAREER: "bg-green-100 text-green-800",
    PSYCHOLOGICAL: "bg-purple-100 text-purple-800",
    BEHAVIORAL: "bg-orange-100 text-orange-800",
  }
  return colors[type] || "bg-gray-100 text-gray-800"
}
