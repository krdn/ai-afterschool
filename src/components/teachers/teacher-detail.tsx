'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CldImage } from 'next-cloudinary'
import {
  Mail,
  Phone,
  Calendar,
  Users,
  Shield,
  Cake,
  Clock,
  GraduationCap,
} from 'lucide-react'
import { TeacherDeleteDialog } from './teacher-delete-dialog'

type TeacherDetailProps = {
  teacher: {
    id: string
    name: string
    email: string
    role: 'DIRECTOR' | 'TEAM_LEADER' | 'MANAGER' | 'TEACHER'
    teamId: string | null
    team: { id: string; name: string } | null
    phone: string | null
    birthDate: Date | null
    nameHanja: string | null
    birthTimeHour: number | null
    birthTimeMinute: number | null
    profileImage: string | null
    profileImagePublicId: string | null
    createdAt: Date
    updatedAt: Date
    _count: { students: number }
  }
  currentRole: 'DIRECTOR' | 'TEAM_LEADER' | 'MANAGER' | 'TEACHER'
  currentUserId: string
  currentTeamId: string | null
}

const roleLabels: Record<TeacherDetailProps['teacher']['role'], string> = {
  DIRECTOR: '원장',
  TEAM_LEADER: '팀장',
  MANAGER: '매니저',
  TEACHER: '선생님',
}

export function TeacherDetail({ teacher, currentRole, currentUserId, currentTeamId }: TeacherDetailProps) {
  const canDelete = currentRole === 'DIRECTOR' && currentUserId !== teacher.id
  const canEdit =
    currentRole === 'DIRECTOR' ||
    currentUserId === teacher.id ||
    (currentRole === 'TEAM_LEADER' && currentTeamId !== null && currentTeamId === teacher.teamId)
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>기본 정보</CardTitle>
            {(canEdit || canDelete) && (
              <div className="flex items-center gap-2">
                {canEdit && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/teachers/${teacher.id}/edit`}>
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
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {teacher.profileImagePublicId && (
            <div className="flex justify-center pb-2">
              <CldImage
                width={128}
                height={128}
                src={teacher.profileImagePublicId}
                sizes="128px"
                alt={`${teacher.name} 프로필 사진`}
                className="h-32 w-32 rounded-full object-cover border-2 border-gray-100"
                crop="fill"
                gravity="face"
                quality="auto"
                format="auto"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">이름</p>
              <p className="font-medium">
                {teacher.name}
                {teacher.nameHanja && (
                  <span className="ml-1 text-gray-400">({teacher.nameHanja})</span>
                )}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">역할</p>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-400" />
                <p className="font-medium">{roleLabels[teacher.role]}</p>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-gray-500">이메일</p>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <p className="font-medium">{teacher.email}</p>
            </div>
          </div>

          {teacher.phone && (
            <div className="space-y-1">
              <p className="text-sm text-gray-500">전화번호</p>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <p className="font-medium">{teacher.phone}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {teacher.birthDate && (
              <div className="space-y-1">
                <p className="text-sm text-gray-500">생년월일</p>
                <div className="flex items-center gap-2">
                  <Cake className="h-4 w-4 text-gray-400" />
                  <p className="font-medium">{formatDate(teacher.birthDate)}</p>
                </div>
              </div>
            )}
            {teacher.birthTimeHour !== null && (
              <div className="space-y-1">
                <p className="text-sm text-gray-500">태어난 시간</p>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <p className="font-medium">
                    {String(teacher.birthTimeHour).padStart(2, '0')}시
                    {teacher.birthTimeMinute !== null && ` ${String(teacher.birthTimeMinute).padStart(2, '0')}분`}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">소속 팀</p>
              {teacher.team ? (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <p className="font-medium">{teacher.team.name}</p>
                </div>
              ) : (
                <p className="text-gray-400">미배정</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">담당 학생</p>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-gray-400" />
                <p className="font-medium">
                  {teacher._count.students > 0 ? `${teacher._count.students}명` : '없음'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">가입일</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <p className="font-medium">{formatDate(teacher.createdAt)}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">수정일</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <p className="font-medium">{formatDate(teacher.updatedAt)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {teacher.role === 'TEAM_LEADER' && teacher.team && (
        <Card>
          <CardHeader>
            <CardTitle>팀 관리</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              팀장으로서 팀 정보를 관리할 수 있어요
            </p>
            <Button variant="outline" asChild>
              <Link href={`/teams/${teacher.team.id}`}>
                팀 정보 보기
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
