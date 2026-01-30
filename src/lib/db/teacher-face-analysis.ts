import { db as prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

/**
 * 관상 분석 결과 생성
 */
export async function createTeacherFaceAnalysis(data: {
  teacherId: string
  imageUrl: string
  result: unknown
  status: string
  errorMessage?: string
}) {
  return prisma.teacherFaceAnalysis.create({
    data: {
      teacherId: data.teacherId,
      imageUrl: data.imageUrl,
      result: data.result as Prisma.InputJsonValue,
      status: data.status,
      errorMessage: data.errorMessage,
      analyzedAt: new Date()
    }
  })
}

/**
 * 관상 분석 결과 생성/업데이트 (upsert)
 */
export async function upsertTeacherFaceAnalysis(data: {
  teacherId: string
  imageUrl: string
  result: unknown | null
  status: string
  errorMessage?: string
}) {
  return prisma.teacherFaceAnalysis.upsert({
    where: { teacherId: data.teacherId },
    create: {
      teacherId: data.teacherId,
      imageUrl: data.imageUrl,
      result: data.result as Prisma.InputJsonValue,
      status: data.status,
      errorMessage: data.errorMessage,
      analyzedAt: new Date()
    },
    update: {
      imageUrl: data.imageUrl,
      result: data.result as Prisma.InputJsonValue,
      status: data.status,
      errorMessage: data.errorMessage,
      analyzedAt: new Date(),
      version: { increment: 1 }
    }
  })
}

/**
 * 선생님 ID로 관상 분석 결과 조회
 */
export async function getTeacherFaceAnalysis(teacherId: string) {
  return prisma.teacherFaceAnalysis.findUnique({
    where: { teacherId }
  })
}
