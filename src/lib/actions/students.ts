"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { verifySession } from "@/lib/dal"
import {
  CreateStudentSchema,
  UpdateStudentSchema,
} from "@/lib/validations/students"
import {
  StudentImageSchema,
  type StudentImageInput,
} from "@/lib/validations/student-images"
import { setStudentImage } from "@/lib/actions/student-images"

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

type ImageFieldConfig = {
  key: "profileImage" | "faceImage" | "palmImage"
  expectedType: StudentImageInput["type"]
}

const imageFieldConfigs: ImageFieldConfig[] = [
  { key: "profileImage", expectedType: "profile" },
  { key: "faceImage", expectedType: "face" },
  { key: "palmImage", expectedType: "palm" },
]

function parseImagePayloads(formData: FormData): {
  images: StudentImageInput[]
  error?: string
} {
  const images: StudentImageInput[] = []

  for (const { key, expectedType } of imageFieldConfigs) {
    const value = formData.get(key)

    if (!value) {
      continue
    }

    if (typeof value !== "string") {
      return { images, error: "이미지 정보 형식이 올바르지 않아요." }
    }

    let parsedValue: unknown

    try {
      parsedValue = JSON.parse(value)
    } catch {
      return { images, error: "이미지 정보 형식이 올바르지 않아요." }
    }

    const parsed = StudentImageSchema.safeParse(parsedValue)

    if (!parsed.success || parsed.data.type !== expectedType) {
      return { images, error: "이미지 정보 형식이 올바르지 않아요." }
    }

    images.push(parsed.data)
  }

  return { images }
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

  const imagePayloads = parseImagePayloads(formData)

  if (imagePayloads.error) {
    return {
      errors: {
        _form: [imagePayloads.error],
      },
    }
  }

  let studentId: string

  try {
    const student = await db.student.create({
      data: {
        ...validatedFields.data,
        birthDate: new Date(validatedFields.data.birthDate),
        teacherId: session.userId,
      },
    })

    studentId = student.id

    for (const imagePayload of imagePayloads.images) {
      await setStudentImage(studentId, imagePayload)
    }
  } catch (error) {
    console.error("Failed to create student:", error)
    return {
      errors: {
        _form: ["학생 등록 중 오류가 발생했어요. 다시 시도해주세요."],
      },
    }
  }

  revalidatePath("/students")
  redirect(`/students/${studentId}`)
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

  const imagePayloads = parseImagePayloads(formData)

  if (imagePayloads.error) {
    return {
      errors: {
        _form: [imagePayloads.error],
      },
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

    for (const imagePayload of imagePayloads.images) {
      await setStudentImage(studentId, imagePayload)
    }
  } catch (error) {
    console.error("Failed to update student:", error)
    return {
      errors: {
        _form: ["학생 정보 수정 중 오류가 발생했어요. 다시 시도해주세요."],
      },
    }
  }

  revalidatePath("/students")
  revalidatePath(`/students/${studentId}`)
  redirect(`/students/${studentId}`)
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
