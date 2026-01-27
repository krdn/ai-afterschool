"use client"

import Link from "next/link"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { deleteStudent } from "@/lib/actions/students"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type StudentDetailProps = {
  student: {
    id: string
    name: string
    birthDate: Date | string
    phone: string | null
    school: string
    grade: number
    targetUniversity: string | null
    targetMajor: string | null
    bloodType: "A" | "B" | "AB" | "O" | null
    createdAt: Date | string
  }
}

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value)
}

export function StudentDetail({ student }: StudentDetailProps) {
  const boundDeleteStudent = deleteStudent.bind(null, student.id)
  const birthDate = toDate(student.birthDate)
  const createdAt = toDate(student.createdAt)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{student.name}</h1>
        <div className="flex space-x-2">
          <Button asChild variant="outline">
            <Link href={`/students/${student.id}/edit`}>수정</Link>
          </Button>
          <form
            action={boundDeleteStudent}
            onSubmit={(event) => {
              if (!confirm("정말 삭제하시겠어요?")) {
                event.preventDefault()
              }
            }}
          >
            <Button type="submit" variant="destructive">
              삭제
            </Button>
          </form>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <dt className="text-sm text-gray-500">이름</dt>
              <dd className="mt-1 font-medium">{student.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">생년월일</dt>
              <dd className="mt-1 font-medium">
                {format(birthDate, "yyyy년 M월 d일", { locale: ko })}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">연락처</dt>
              <dd className="mt-1 font-medium">{student.phone || "-"}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">혈액형</dt>
              <dd className="mt-1 font-medium">
                {student.bloodType ? `${student.bloodType}형` : "-"}
              </dd>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>학업 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <dt className="text-sm text-gray-500">학교</dt>
              <dd className="mt-1 font-medium">{student.school}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">학년</dt>
              <dd className="mt-1 font-medium">{student.grade}학년</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">목표 대학</dt>
              <dd className="mt-1 font-medium">
                {student.targetUniversity || "-"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">목표 학과</dt>
              <dd className="mt-1 font-medium">{student.targetMajor || "-"}</dd>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-gray-500">
        등록일: {format(createdAt, "yyyy년 M월 d일", { locale: ko })}
      </p>
    </div>
  )
}
