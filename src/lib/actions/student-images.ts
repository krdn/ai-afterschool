"use server"

import { db } from "@/lib/db"
import { verifySession } from "@/lib/dal"
import { cloudinary, buildResizedImageUrl } from "@/lib/cloudinary"
import {
  StudentImageSchema,
  type StudentImageInput,
} from "@/lib/validations/student-images"

export type StudentImageTypeValue = StudentImageInput["type"]

export async function setStudentImage(
  studentId: string,
  payload: StudentImageInput
): Promise<void> {
  const session = await verifySession()
  const validatedPayload = StudentImageSchema.parse(payload)

  const student = await db.student.findFirst({
    where: {
      id: studentId,
      teacherId: session.userId,
    },
  })

  if (!student) {
    throw new Error("Student not found")
  }

  const existingImage = await db.studentImage.findUnique({
    where: {
      studentId_type: {
        studentId,
        type: validatedPayload.type,
      },
    },
  })

  const resizedUrl = buildResizedImageUrl(validatedPayload.publicId)

  await db.studentImage.upsert({
    where: {
      studentId_type: {
        studentId,
        type: validatedPayload.type,
      },
    },
    create: {
      studentId,
      type: validatedPayload.type,
      originalUrl: validatedPayload.originalUrl,
      resizedUrl,
      publicId: validatedPayload.publicId,
      format: validatedPayload.format,
      bytes: validatedPayload.bytes,
      width: validatedPayload.width,
      height: validatedPayload.height,
    },
    update: {
      originalUrl: validatedPayload.originalUrl,
      resizedUrl,
      publicId: validatedPayload.publicId,
      format: validatedPayload.format,
      bytes: validatedPayload.bytes,
      width: validatedPayload.width,
      height: validatedPayload.height,
    },
  })

  if (existingImage && existingImage.publicId !== validatedPayload.publicId) {
    try {
      await cloudinary.uploader.destroy(existingImage.publicId)
    } catch (error) {
      console.error("Failed to delete old Cloudinary asset:", error)
    }
  }
}

export async function deleteStudentImage(
  studentId: string,
  type: StudentImageTypeValue
): Promise<void> {
  const session = await verifySession()

  const student = await db.student.findFirst({
    where: {
      id: studentId,
      teacherId: session.userId,
    },
  })

  if (!student) {
    throw new Error("Student not found")
  }

  const existingImage = await db.studentImage.findUnique({
    where: {
      studentId_type: {
        studentId,
        type,
      },
    },
  })

  if (!existingImage) {
    return
  }

  await db.studentImage.delete({
    where: {
      studentId_type: {
        studentId,
        type,
      },
    },
  })

  try {
    await cloudinary.uploader.destroy(existingImage.publicId)
  } catch (error) {
    console.error("Failed to delete Cloudinary asset:", error)
  }
}
