"use server"

import { redirect } from "next/navigation"
import { randomBytes } from "crypto"
import argon2 from "argon2"
import { db } from "@/lib/db"
import { createSession, deleteSession } from "@/lib/session"
import {
  LoginSchema,
  RequestResetSchema,
  ResetPasswordSchema,
  SignupSchema,
} from "@/lib/validations/auth"

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Resend } = require("resend") as {
  Resend: new (apiKey?: string) => {
    emails: {
      send: (options: {
        from: string
        to: string | string[]
        subject: string
        html?: string
        text?: string
      }) => Promise<unknown>
    }
  }
}

const resend = new Resend(process.env.RESEND_API_KEY)

export type AuthFormState = {
  errors?: {
    email?: string[]
    password?: string[]
    name?: string[]
    confirmPassword?: string[]
    _form?: string[]
  }
  message?: string
}

export type ResetFormState = {
  errors?: {
    email?: string[]
    password?: string[]
    confirmPassword?: string[]
    _form?: string[]
  }
  message?: string
  success?: boolean
}

export async function login(
  prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const validatedFields = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { email, password } = validatedFields.data

  const teacher = await db.teacher.findUnique({
    where: { email },
  })

  if (!teacher) {
    return {
      errors: {
        _form: ["이메일 또는 비밀번호가 일치하지 않아요. 다시 확인해주세요."],
      },
    }
  }

  const passwordMatch = await argon2.verify(teacher.password, password)

  if (!passwordMatch) {
    return {
      errors: {
        _form: ["이메일 또는 비밀번호가 일치하지 않아요. 다시 확인해주세요."],
      },
    }
  }

  await createSession(teacher.id)

  redirect("/students")
}

export async function signup(
  prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const validatedFields = SignupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { name, email, password } = validatedFields.data

  const existingTeacher = await db.teacher.findUnique({
    where: { email },
  })

  if (existingTeacher) {
    return {
      errors: {
        email: ["이미 사용 중인 이메일이에요"],
      },
    }
  }

  const hashedPassword = await argon2.hash(password)

  const teacher = await db.teacher.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  })

  await createSession(teacher.id)

  redirect("/students")
}

export async function logout(): Promise<void> {
  await deleteSession()
  redirect("/login")
}

export async function requestPasswordReset(
  prevState: ResetFormState,
  formData: FormData
): Promise<ResetFormState> {
  const validatedFields = RequestResetSchema.safeParse({
    email: formData.get("email"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { email } = validatedFields.data

  const teacher = await db.teacher.findUnique({
    where: { email },
  })

  const successMessage =
    "비밀번호 재설정 링크를 이메일로 보냈어요. 이메일을 확인해주세요."

  if (!teacher) {
    return {
      success: true,
      message: successMessage,
    }
  }

  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

  await db.passwordResetToken.deleteMany({
    where: { teacherId: teacher.id },
  })

  await db.passwordResetToken.create({
    data: {
      token,
      teacherId: teacher.id,
      expiresAt,
    },
  })

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/${token}`

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@resend.dev",
      to: email,
      subject: "[AI AfterSchool] 비밀번호 재설정",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>비밀번호 재설정</h2>
          <p>${teacher.name}님, 안녕하세요!</p>
          <p>비밀번호 재설정을 요청하셨습니다. 아래 버튼을 클릭하여 새 비밀번호를 설정해주세요.</p>
          <p>
            <a href="${resetUrl}" style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              비밀번호 재설정하기
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            이 링크는 1시간 동안 유효합니다.<br>
            본인이 요청하지 않았다면 이 이메일을 무시해주세요.
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error("Failed to send password reset email:", error)
    return {
      errors: {
        _form: ["이메일 발송 중 오류가 발생했어요. 잠시 후 다시 시도해주세요."],
      },
    }
  }

  return {
    success: true,
    message: successMessage,
  }
}

export async function resetPassword(
  token: string,
  prevState: ResetFormState,
  formData: FormData
): Promise<ResetFormState> {
  const validatedFields = ResetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { password } = validatedFields.data

  const resetToken = await db.passwordResetToken.findUnique({
    where: { token },
    include: { teacher: true },
  })

  if (!resetToken) {
    return {
      errors: {
        _form: ["유효하지 않은 링크예요. 비밀번호 재설정을 다시 요청해주세요."],
      },
    }
  }

  if (resetToken.expiresAt < new Date()) {
    return {
      errors: {
        _form: ["링크가 만료되었어요. 비밀번호 재설정을 다시 요청해주세요."],
      },
    }
  }

  if (resetToken.used) {
    return {
      errors: {
        _form: ["이미 사용된 링크예요. 비밀번호 재설정을 다시 요청해주세요."],
      },
    }
  }

  const hashedPassword = await argon2.hash(password)

  await db.$transaction([
    db.teacher.update({
      where: { id: resetToken.teacherId },
      data: { password: hashedPassword },
    }),
    db.passwordResetToken.update({
      where: { token },
      data: { used: true },
    }),
  ])

  return {
    success: true,
    message: "비밀번호가 변경되었어요. 새 비밀번호로 로그인해주세요.",
  }
}
