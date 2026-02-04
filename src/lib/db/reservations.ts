import 'server-only'
import { db } from '@/lib/db'
import { ReservationStatus } from '@prisma/client'

/**
 * 예약 목록 조회 파라미터
 */
export interface GetReservationsParams {
  teacherId: string
  studentId?: string
  dateFrom?: Date
  dateTo?: Date
  status?: ReservationStatus
}

/**
 * 예약 목록 조회
 * - teacherId로 필터링 (현재 세션 선생님)
 * - 선택적 필터: studentId, dateFrom, dateTo, status
 * - Student, Parent 조인 포함
 * - scheduledAt 기준 내림차순 정렬
 */
export async function getReservations(params: GetReservationsParams) {
  const { teacherId, studentId, dateFrom, dateTo, status } = params

  const where: any = {
    teacherId,
  }

  // 학생 필터
  if (studentId) {
    where.studentId = studentId
  }

  // 날짜 범위 필터
  if (dateFrom || dateTo) {
    where.scheduledAt = {}
    if (dateFrom) {
      where.scheduledAt.gte = dateFrom
    }
    if (dateTo) {
      where.scheduledAt.lte = dateTo
    }
  }

  // 상태 필터
  if (status) {
    where.status = status
  }

  return db.parentCounselingReservation.findMany({
    where,
    include: {
      student: {
        select: {
          id: true,
          name: true,
          school: true,
          grade: true,
        },
      },
      parent: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          relation: true,
        },
      },
    },
    orderBy: {
      scheduledAt: 'desc',
    },
  })
}

/**
 * 단일 예약 조회
 * - ID로 예약 상세 조회
 * - 관련 Student, Parent 정보 포함
 */
export async function getReservationById(id: string, teacherId: string) {
  return db.parentCounselingReservation.findUnique({
    where: {
      id,
      teacherId, // 보안: 다른 선생님 예약 접근 방지
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          school: true,
          grade: true,
          phone: true,
          primaryParentId: true,
        },
      },
      parent: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          relation: true,
          note: true,
        },
      },
      counselingSession: {
        select: {
          id: true,
          type: true,
          duration: true,
        },
      },
    },
  })
}
