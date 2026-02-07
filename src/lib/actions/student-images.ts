"use server"

import { db } from "@/lib/db"
import { verifySession } from "@/lib/dal"
import { cloudinary, buildResizedImageUrl } from "@/lib/cloudinary"
import {
  StudentImageSchema,
  type StudentImageInput,
} from "@/lib/validations/student-images"
import { z } from "zod"

export type StudentImageTypeValue = StudentImageInput["type"]

export type StudentImageResult =
  | { success: true }
  | { success: false; error: string }

export async function setStudentImage(
  studentId: string,
  payload: StudentImageInput
): Promise<StudentImageResult> {
  try {
    const session = await verifySession()

    // 스키마 검증
    let validatedPayload: StudentImageInput
    try {
      validatedPayload = StudentImageSchema.parse(payload)
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error:", error.errors)
        // 사용자 친화적인 에러 메시지 생성
        const firstError = error.errors[0]
        if (firstError.path.includes("bytes")) {
          return {
            success: false,
            error: "파일 크기는 10MB 이하여야 해요",
          }
        }
        if (firstError.path.includes("originalUrl")) {
          return {
            success: false,
            error: "이미지 URL이 올바르지 않아요",
          }
        }
        return {
          success: false,
          error: "이미지 정보 형식이 올바르지 않아요",
        }
      }
      return {
        success: false,
        error: "이미지 검증 중 오류가 발생했어요",
      }
    }

    // 학생 존재 여부 및 권한 확인
    const student = await db.student.findFirst({
      where: {
        id: studentId,
        teacherId: session.userId,
      },
    })

    if (!student) {
      return {
        success: false,
        error: "학생을 찾을 수 없어요",
      }
    }

    // 기존 이미지 확인
    const existingImage = await db.studentImage.findUnique({
      where: {
        studentId_type: {
          studentId,
          type: validatedPayload.type,
        },
      },
    })

    const resizedUrl = buildResizedImageUrl(validatedPayload.publicId)

    // 이미지 저장
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

    // 기존 이미지가 있고 publicId가 변경된 경우 Cloudinary에서 삭제
    if (existingImage && existingImage.publicId !== validatedPayload.publicId) {
      try {
        await cloudinary.uploader.destroy(existingImage.publicId)
      } catch (error) {
        console.error("Failed to delete old Cloudinary asset:", error)
        // 실패해도 메인 작업은 성공한 것으로 처리
      }
    }

    return { success: true }
  } catch (error) {
    console.error("setStudentImage error:", error)

    // 네트워크 또는 Cloudinary 에러 처리
    if (error instanceof Error) {
      if (error.message.includes("network") || error.message.includes("fetch")) {
        return {
          success: false,
          error: "이미지 업로드 중 연결 오류가 발생했어요",
        }
      }
      if (error.message.includes("Cloudinary")) {
        return {
          success: false,
          error: "이미지 서비스 오류가 발생했어요. 잠시 후 다시 시도해주세요",
        }
      }
    }

    return {
      success: false,
      error: "이미지 저장 중 오류가 발생했어요. 다시 시도해주세요",
    }
  }
}

export async function deleteStudentImage(
  studentId: string,
  type: StudentImageTypeValue
): Promise<StudentImageResult> {
  try {
    const session = await verifySession()

    // 학생 존재 여부 및 권한 확인
    const student = await db.student.findFirst({
      where: {
        id: studentId,
        teacherId: session.userId,
      },
    })

    if (!student) {
      return {
        success: false,
        error: "학생을 찾을 수 없어요",
      }
    }

    // 기존 이미지 확인
    const existingImage = await db.studentImage.findUnique({
      where: {
        studentId_type: {
          studentId,
          type,
        },
      },
    })

    if (!existingImage) {
      return { success: true }
    }

    // 데이터베이스에서 삭제
    await db.studentImage.delete({
      where: {
        studentId_type: {
          studentId,
          type,
        },
      },
    })

    // Cloudinary에서 삭제
    try {
      await cloudinary.uploader.destroy(existingImage.publicId)
    } catch (error) {
      console.error("Failed to delete Cloudinary asset:", error)
      // 실패해도 DB 삭제는 성공한 것으로 처리
    }

    return { success: true }
  } catch (error) {
    console.error("deleteStudentImage error:", error)
    return {
      success: false,
      error: "이미지 삭제 중 오류가 발생했어요. 다시 시도해주세요",
    }
  }
}
