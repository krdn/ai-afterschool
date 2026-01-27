"use client"

import { useActionState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { login, type AuthFormState } from "@/lib/actions/auth"
import { LoginSchema, type LoginInput } from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function LoginForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    login,
    { errors: {} }
  )

  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
  })

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">로그인</CardTitle>
        <CardDescription className="text-center">
          AI AfterSchool에 오신 것을 환영합니다
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state?.errors?._form && (
            <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">
              {state.errors._form[0]}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="teacher@school.com"
              autoComplete="email"
              {...form.register("email")}
            />
            {(state?.errors?.email || form.formState.errors.email) && (
              <p className="text-sm text-red-600">
                {state?.errors?.email?.[0] ||
                  form.formState.errors.email?.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              {...form.register("password")}
            />
            {(state?.errors?.password || form.formState.errors.password) && (
              <p className="text-sm text-red-600">
                {state?.errors?.password?.[0] ||
                  form.formState.errors.password?.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "로그인 중..." : "로그인"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Link
          href="/reset-password"
          className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
        >
          비밀번호를 잊으셨나요?
        </Link>
      </CardFooter>
    </Card>
  )
}
