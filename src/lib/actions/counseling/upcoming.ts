'use server'

import { addDays, startOfDay, endOfDay } from 'date-fns'
import { db } from '@/lib/db'
import { verifySession } from '@/lib/dal'

/**
 * 다가오는 상담 조회 결과 타입
 */
export type UpcomingCounselingResult = {
  success: boolean
  data?: Array<{
    id: string
    scheduledAt: Date
    student: { id: string; name: string }
    parent: { id: string; name: string; relation: string }
  }>
  error?: string
}

/**
 * 다가오는 상담 조회 액션
 * - 오늘부터 7일 이내의 SCHEDULED 상태 예약을 조회합니다
 * - verifySession으로 인증된 사용자의 예약만 조회
 */
export async function getUpcomingCounseling(): Promise<UpcomingCounselingResult> {
  const session = await verifySession()

  if (!session) {
    return {
      success: false,
      error: '인증되지 않은 요청입니다.',
    }
  }

  try {
    const now = new Date()
    const sevenDaysLater = addDays(now, 7)

    const reservations = await db.parentCounselingReservation.findMany({
      where: {
        teacherId: session.userId,
        status: 'SCHEDULED',
        scheduledAt: {
          gte: startOfDay(now),
          lte: endOfDay(sevenDaysLater),
        },
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
            relation: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    })

    return {
      success: true,
      data: reservations,
    }
  } catch (error) {
    console.error('Failed to get upcoming counseling:', error)
    return {
      success: false,
      error: '다가오는 상담 조회 중 오류가 발생했습니다.',
    }
  }
}
