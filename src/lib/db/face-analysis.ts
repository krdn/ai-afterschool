import { db as prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

/**
 * 관상 분석 결과 생성
 */
export async function createFaceAnalysis(data: {
  studentId: string
  imageUrl: string
  result: unknown
  status: string
  errorMessage?: string
}) {
  return prisma.faceAnalysis.create({
    data: {
      studentId: data.studentId,
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
export async function upsertFaceAnalysis(data: {
  studentId: string
  imageUrl: string
  result: unknown | null
  status: string
  errorMessage?: string
}) {
  return prisma.faceAnalysis.upsert({
    where: { studentId: data.studentId },
    create: {
      studentId: data.studentId,
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
 * 학생 ID로 관상 분석 결과 조회
 */
export async function getFaceAnalysisByStudentId(studentId: string) {
  return prisma.faceAnalysis.findUnique({
    where: { studentId }
  })
}
