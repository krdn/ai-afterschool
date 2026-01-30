import { db as prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

/**
 * 선생님 손금 분석 결과 생성
 */
export async function createTeacherPalmAnalysis(data: {
  teacherId: string
  hand: 'left' | 'right'
  imageUrl: string
  result: unknown
  status: string
  errorMessage?: string
}) {
  return prisma.teacherPalmAnalysis.create({
    data: {
      teacherId: data.teacherId,
      hand: data.hand,
      imageUrl: data.imageUrl,
      result: data.result as Prisma.InputJsonValue,
      status: data.status,
      errorMessage: data.errorMessage,
      analyzedAt: new Date()
    }
  })
}

/**
 * 선생님 손금 분석 결과 생성/업데이트 (upsert)
 */
export async function upsertTeacherPalmAnalysis(data: {
  teacherId: string
  hand: 'left' | 'right'
  imageUrl: string
  result: unknown | null
  status: string
  errorMessage?: string
}) {
  return prisma.teacherPalmAnalysis.upsert({
    where: { teacherId: data.teacherId },
    create: {
      teacherId: data.teacherId,
      hand: data.hand,
      imageUrl: data.imageUrl,
      result: data.result as Prisma.InputJsonValue,
      status: data.status,
      errorMessage: data.errorMessage,
      analyzedAt: new Date()
    },
    update: {
      hand: data.hand,
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
 * 선생님 ID로 손금 분석 결과 조회
 */
export async function getTeacherPalmAnalysis(teacherId: string) {
  return prisma.teacherPalmAnalysis.findUnique({
    where: { teacherId }
  })
}
