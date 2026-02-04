import 'server-only'
import { db } from '@/lib/db'
import { ReservationStatus } from '@prisma/client'

/**
 * 예약 생성 파라미터
 */
export interface CreateReservationParams {
  scheduledAt: Date
  studentId: string
  teacherId: string
  parentId: string
  topic: string
}

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
 * 트랜잭션 기반 중복 검증과 함께 예약 생성
 *
 * 같은 선생님의 같은 시간대에 이미 예약이 있는지 확인합니다.
 * CANCELLED 상태의 예약은 제외하고 확인합니다.
 *
 * @param params 예약 생성 파라미터
 * @returns 생성된 예약
 * @throws {Error} 같은 선생님의 같은 시간대에 이미 예약이 있는 경우
 */
export async function createReservationWithConflictCheck(
  params: CreateReservationParams
) {
  const { scheduledAt, studentId, teacherId, parentId, topic } = params

  // 예약 시간의 시작과 끝 (30분 간격)
  const slotStart = new Date(scheduledAt)
  const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000) // +30분

  // 트랜잭션으로 중복 검증과 생성 원자성 보장
  return await db.$transaction(async (tx) => {
    // 같은 선생님의 같은 시간대에 있는 예약 확인 (CANCELLED 제외)
    const conflictingReservation = await tx.parentCounselingReservation.findFirst({
      where: {
        teacherId,
        status: {
          not: ReservationStatus.CANCELLED,
        },
        OR: [
          // 새 예약의 시작 시간이 기존 예약 시간대와 겹침
          {
            scheduledAt: {
              gte: slotStart,
              lt: slotEnd,
            },
          },
          // 기존 예약의 시작 시간이 새 예약 시간대와 겹침
          {
            scheduledAt: {
              lt: slotStart,
            },
            counselingSessionId: null, // 완료되지 않은 예약만 확인
          },
        ],
      },
    })

    if (conflictingReservation) {
      throw new Error('이미 해당 시간대에 예약이 있습니다')
    }

    // 충돌이 없으면 예약 생성
    const reservation = await tx.parentCounselingReservation.create({
      data: {
        scheduledAt: slotStart,
        studentId,
        teacherId,
        parentId,
        topic,
        status: ReservationStatus.SCHEDULED,
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
        teacher: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return reservation
  })
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
