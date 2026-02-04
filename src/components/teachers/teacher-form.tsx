"use client"

import { startTransition, useActionState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { createTeacher, type TeacherFormState } from "@/lib/actions/teachers"
import { TeacherSchema } from "@/lib/validations/teachers"
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

type TeacherFormProps = {
  teams?: Array<{ id: string; name: string }>
}

type TeacherFormValues = z.infer<typeof TeacherSchema>

export function TeacherForm({ teams = [] }: TeacherFormProps) {
  const [state, formAction, pending] = useActionState<TeacherFormState, FormData>(
    createTeacher,
    { errors: {} }
  )

  // 폼 에러 발생 시 토스트 표시
  const prevErrorRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    const errorMessage = state?.errors?._form?.[0]
    if (errorMessage && errorMessage !== prevErrorRef.current) {
      toast.error(errorMessage, { id: "teacher-form-submit" })
      prevErrorRef.current = errorMessage
    }
  }, [state?.errors?._form])

  // pending이 끝났지만 에러가 없으면 로딩 토스트 닫기
  useEffect(() => {
    if (!pending && !state?.errors?._form) {
      toast.dismiss("teacher-form-submit")
    }
  }, [pending, state?.errors?._form])

  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(TeacherSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "TEACHER",
      teamId: null,
      phone: "",
    },
    mode: "onChange",
  })

  const handleSubmit = form.handleSubmit((_values, event) => {
    event?.preventDefault()
    const formElement = event?.currentTarget
    if (!formElement) return

    const formData = new FormData(formElement)

    // 제출 시작 토스트 표시
    toast.loading("선생님 등록 중...", { id: "teacher-form-submit" })

    startTransition(() => {
      formAction(formData)
    })
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>선생님 등록</CardTitle>
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
                  {state?.errors?.name?.[0] || form.formState.errors.name?.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">이메일 *</Label>
              <Input
                id="email"
                type="email"
                placeholder="teacher@example.com"
                {...form.register("email")}
              />
              {(state?.errors?.email || form.formState.errors.email) && (
                <p className="text-sm text-red-600">
                  {state?.errors?.email?.[0] || form.formState.errors.email?.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호 *</Label>
              <Input
                id="password"
                type="password"
                placeholder="8자 이상"
                {...form.register("password")}
              />
              {(state?.errors?.password || form.formState.errors.password) && (
                <p className="text-sm text-red-600">
                  {state?.errors?.password?.[0] ||
                    form.formState.errors.password?.message}
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
                  {state?.errors?.phone?.[0] || form.formState.errors.phone?.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">역할 및 소속</h3>

            <div className="space-y-2">
              <Label htmlFor="role">역할 *</Label>
              <Select name="role" defaultValue="TEACHER">
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEACHER">선생님</SelectItem>
                  <SelectItem value="MANAGER">매니저</SelectItem>
                  <SelectItem value="TEAM_LEADER">팀장</SelectItem>
                  <SelectItem value="DIRECTOR">원장</SelectItem>
                </SelectContent>
              </Select>
              {state?.errors?.role && (
                <p className="text-sm text-red-600">{state.errors.role[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="teamId">팀 (선택)</Label>
              <Select name="teamId">
                <SelectTrigger id="teamId">
                  <SelectValue placeholder="팀을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {teams.length > 0 ? (
                    teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-team" disabled>
                      등록된 팀이 없습니다
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {state?.errors?.teamId && (
                <p className="text-sm text-red-600">{state.errors.teamId[0]}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? "등록 중..." : "등록하기"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
