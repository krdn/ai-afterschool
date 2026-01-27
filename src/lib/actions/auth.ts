"use server"

import { redirect } from "next/navigation"
import argon2 from "argon2"
import { db } from "@/lib/db"
import { createSession, deleteSession } from "@/lib/session"
import { LoginSchema, SignupSchema } from "@/lib/validations/auth"

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
