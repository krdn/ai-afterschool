"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { verifySession } from "@/lib/dal"
import {
  CreateStudentSchema,
  UpdateStudentSchema,
} from "@/lib/validations/students"

export type StudentFormState = {
  errors?: {
    name?: string[]
    birthDate?: string[]
    phone?: string[]
    school?: string[]
    grade?: string[]
    targetUniversity?: string[]
    targetMajor?: string[]
    bloodType?: string[]
    _form?: string[]
  }
  message?: string
}

export async function createStudent(
  prevState: StudentFormState,
  formData: FormData
): Promise<StudentFormState> {
  const session = await verifySession()

  const validatedFields = CreateStudentSchema.safeParse({
    name: formData.get("name"),
    birthDate: formData.get("birthDate"),
    phone: formData.get("phone") || undefined,
    school: formData.get("school"),
    grade: formData.get("grade"),
    targetUniversity: formData.get("targetUniversity") || undefined,
    targetMajor: formData.get("targetMajor") || undefined,
    bloodType: formData.get("bloodType") || null,
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    const student = await db.student.create({
      data: {
        ...validatedFields.data,
        birthDate: new Date(validatedFields.data.birthDate),
        teacherId: session.userId,
      },
    })

    revalidatePath("/students")
    redirect(`/students/${student.id}`)
  } catch (error) {
    console.error("Failed to create student:", error)
    return {
      errors: {
        _form: ["학생 등록 중 오류가 발생했어요. 다시 시도해주세요."],
      },
    }
  }
}

export async function updateStudent(
  studentId: string,
  prevState: StudentFormState,
  formData: FormData
): Promise<StudentFormState> {
  const session = await verifySession()

  const existingStudent = await db.student.findFirst({
    where: {
      id: studentId,
      teacherId: session.userId,
    },
  })

  if (!existingStudent) {
    return {
      errors: {
        _form: ["학생을 찾을 수 없어요."],
      },
    }
  }

  const validatedFields = UpdateStudentSchema.safeParse({
    name: formData.get("name"),
    birthDate: formData.get("birthDate"),
    phone: formData.get("phone") || undefined,
    school: formData.get("school"),
    grade: formData.get("grade"),
    targetUniversity: formData.get("targetUniversity") || undefined,
    targetMajor: formData.get("targetMajor") || undefined,
    bloodType: formData.get("bloodType") || null,
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    await db.student.update({
      where: { id: studentId },
      data: {
        ...validatedFields.data,
        birthDate: validatedFields.data.birthDate
          ? new Date(validatedFields.data.birthDate)
          : undefined,
      },
    })

    revalidatePath("/students")
    revalidatePath(`/students/${studentId}`)
    redirect(`/students/${studentId}`)
  } catch (error) {
    console.error("Failed to update student:", error)
    return {
      errors: {
        _form: ["학생 정보 수정 중 오류가 발생했어요. 다시 시도해주세요."],
      },
    }
  }
}

export async function deleteStudent(studentId: string): Promise<void> {
  const session = await verifySession()

  await db.student.deleteMany({
    where: {
      id: studentId,
      teacherId: session.userId,
    },
  })

  revalidatePath("/students")
  redirect("/students")
}
