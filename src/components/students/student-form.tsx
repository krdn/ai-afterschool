"use client"

import { useActionState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  createStudent,
  updateStudent,
  type StudentFormState,
} from "@/lib/actions/students"
import { CreateStudentSchema } from "@/lib/validations/students"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type StudentFormProps = {
  student?: {
    id: string
    name: string
    birthDate: Date | string
    phone: string | null
    school: string
    grade: number
    targetUniversity: string | null
    targetMajor: string | null
    bloodType: "A" | "B" | "AB" | "O" | null
  }
}

function toDateInputValue(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0]
}

export function StudentForm({ student }: StudentFormProps) {
  const isEditing = Boolean(student)

  const boundUpdateStudent = student
    ? updateStudent.bind(null, student.id)
    : null

  const [state, formAction, pending] = useActionState<StudentFormState, FormData>(
    isEditing ? boundUpdateStudent! : createStudent,
    { errors: {} }
  )

  type StudentFormValues = z.input<typeof CreateStudentSchema>

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(CreateStudentSchema),
    defaultValues: student
      ? {
          name: student.name,
          birthDate: toDateInputValue(student.birthDate),
          phone: student.phone || "",
          school: student.school,
          grade: student.grade,
          targetUniversity: student.targetUniversity || "",
          targetMajor: student.targetMajor || "",
          bloodType: student.bloodType,
        }
      : {
          name: "",
          birthDate: "",
          phone: "",
          school: "",
          grade: 1,
          targetUniversity: "",
          targetMajor: "",
          bloodType: null,
        },
    mode: "onChange",
  })

  const handleSubmit = form.handleSubmit((_, event) => {
    const formElement = event?.target as HTMLFormElement | null
    if (!formElement) return
    formAction(new FormData(formElement))
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "학생 정보 수정" : "학생 등록"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {state?.errors?._form && (
            <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">
              {state.errors._form[0]}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-medium">기본 정보</h3>

            <div className="space-y-2">
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                placeholder="홍길동"
                {...form.register("name")}
              />
              {(state?.errors?.name || form.formState.errors.name) && (
                <p className="text-sm text-red-600">
                  {state?.errors?.name?.[0] ||
                    form.formState.errors.name?.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">생년월일 *</Label>
              <Input
                id="birthDate"
                type="date"
                {...form.register("birthDate")}
              />
              {(state?.errors?.birthDate || form.formState.errors.birthDate) && (
                <p className="text-sm text-red-600">
                  {state?.errors?.birthDate?.[0] ||
                    form.formState.errors.birthDate?.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">연락처</Label>
              <Input
                id="phone"
                placeholder="010-0000-0000"
                {...form.register("phone")}
              />
              {(state?.errors?.phone || form.formState.errors.phone) && (
                <p className="text-sm text-red-600">
                  {state?.errors?.phone?.[0] ||
                    form.formState.errors.phone?.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bloodType">혈액형</Label>
              <Select name="bloodType" defaultValue={student?.bloodType || ""}>
                <SelectTrigger id="bloodType">
                  <SelectValue placeholder="선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A형</SelectItem>
                  <SelectItem value="B">B형</SelectItem>
                  <SelectItem value="AB">AB형</SelectItem>
                  <SelectItem value="O">O형</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">학업 정보</h3>

            <div className="space-y-2">
              <Label htmlFor="school">학교 *</Label>
              <Input
                id="school"
                placeholder="서울고등학교"
                {...form.register("school")}
              />
              {(state?.errors?.school || form.formState.errors.school) && (
                <p className="text-sm text-red-600">
                  {state?.errors?.school?.[0] ||
                    form.formState.errors.school?.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade">학년 *</Label>
              <Input
                id="grade"
                type="number"
                min={1}
                max={12}
                {...form.register("grade")}
              />
              {(state?.errors?.grade || form.formState.errors.grade) && (
                <p className="text-sm text-red-600">
                  {state?.errors?.grade?.[0] ||
                    form.formState.errors.grade?.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetUniversity">목표 대학</Label>
              <Input
                id="targetUniversity"
                placeholder="서울대학교"
                {...form.register("targetUniversity")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetMajor">목표 학과</Label>
              <Input
                id="targetMajor"
                placeholder="컴퓨터공학과"
                {...form.register("targetMajor")}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="submit" disabled={pending}>
              {pending
                ? isEditing
                  ? "수정 중..."
                  : "등록 중..."
                : isEditing
                  ? "수정하기"
                  : "등록하기"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
