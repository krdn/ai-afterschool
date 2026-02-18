'use server'

import { db } from '@/lib/db'
import { verifySession } from '@/lib/dal'
import {
  getReservations,
  getReservationById,
  type GetReservationsParams,
} from '@/lib/db/counseling/reservations'
import { ReservationStatus } from '@prisma/client'

/**
 * 예약 목록 조회 액션
 * - 인증 체크
 * - TEACHER 역할 시 자신 예약만 조회
 * - 검색 파라미터 전달
 * - { success, data? } 형식 응답
 */
export async function getReservationsAction(params: {
  studentId?: string
  dateFrom?: string
  dateTo?: string
  status?: ReservationStatus
}) {
  const session = await verifySession()

  if (!session) {
    return {
      success: false,
      error: '인증되지 않은 요청입니다.',
    }
  }

  try {
    // 날짜 파싱
    const dateFrom = params.dateFrom ? new Date(params.dateFrom) : undefined
    const dateTo = params.dateTo ? new Date(params.dateTo) : undefined

    // 조회 파라미터 구성
    const getParams: GetReservationsParams = {
      teacherId: session.userId,
      studentId: params.studentId,
      dateFrom,
      dateTo,
      status: params.status,
    }

    const reservations = await getReservations(getParams)

    return {
      success: true,
      data: reservations,
    }
  } catch (error) {
    console.error('Failed to get reservations:', error)
    return {
      success: false,
      error: '예약 목록 조회 중 오류가 발생했습니다.',
    }
  }
}

/**
 * 단일 예약 조회 액션
 * - 인증 및 권한 체크
 * - 예약 데이터 반환
 */
export async function getReservationByIdAction(id: string) {
  const session = await verifySession()

  if (!session) {
    return {
      success: false,
      error: '인증되지 않은 요청입니다.',
    }
  }

  try {
    const reservation = await getReservationById(id, session.userId)

    if (!reservation) {
      return {
        success: false,
        error: '예약을 찾을 수 없습니다.',
      }
    }

    return {
      success: true,
      data: reservation,
    }
  } catch (error) {
    console.error('Failed to get reservation:', error)
    return {
      success: false,
      error: '예약 조회 중 오류가 발생했습니다.',
    }
  }
}

/**
 * 예약 상태별 개수 조회 액션
 * - 대시보드용 통계
 */
export async function getReservationStatsAction() {
  const session = await verifySession()

  if (!session) {
    return {
      success: false,
      error: '인증되지 않은 요청입니다.',
    }
  }

  try {
    const stats = await db.parentCounselingReservation.groupBy({
      by: ['status'],
      where: {
        teacherId: session.userId,
      },
      _count: {
        status: true,
      },
    })

    // 상태별 개수를 객체로 변환
    const statsMap: Record<ReservationStatus, number> = {
      SCHEDULED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      NO_SHOW: 0,
    }

    for (const stat of stats) {
      statsMap[stat.status as ReservationStatus] = stat._count.status
    }

    return {
      success: true,
      data: statsMap,
    }
  } catch (error) {
    console.error('Failed to get reservation stats:', error)
    return {
      success: false,
      error: '예약 통계 조회 중 오류가 발생했습니다.',
    }
  }
}
