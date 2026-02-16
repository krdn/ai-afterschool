'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { verifySession, getRBACDB } from '@/lib/dal'
import { getRBACPrisma } from '@/lib/db/rbac'
import {
  getReservations,
  getReservationById,
  createReservationWithConflictCheck,
  updateReservation,
  deleteReservation,
  transitionReservationStatus,
  type GetReservationsParams,
} from '@/lib/db/reservations'
import { ReservationStatus } from '@prisma/client'
import {
  createReservationSchema,
  reservationUpdateSchema,
  reservationDeleteSchema,
  completeReservationSchema,
} from '@/lib/validations/reservations'
import type {
  CreateReservationInput,
  UpdateReservationInput,
  DeleteReservationInput,
  CompleteReservationInput,
} from '@/lib/validations/reservations'

/**
 * 예약 생성 결과 타입
 */
export type CreateReservationResult = {
  success: boolean
  data?: {
    id: string
    scheduledAt: Date
    student: { id: string; name: string }
    parent: { id: string; name: string; relation: string }
    teacher: { id: string; name: string }
  }
  error?: string
  fieldErrors?: {
    scheduledAt?: string[]
    studentId?: string[]
    parentId?: string[]
    topic?: string[]
  }
}

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

/**
 * 예약 생성 액션
 * - verifySession() 인증 체크
 * - Zod 스키마 검증
 * - TEACHER 역할 시 RBAC 체크 (getRBACPrisma)
 * - createReservationWithConflictCheck() 호출
 * - revalidatePath()로 캐시 무효화
 * - { success, error? } 형식 응답
 */
export async function createReservationAction(
  input: CreateReservationInput
): Promise<CreateReservationResult> {
  // 1. 인증 체크
  const session = await verifySession()

  // 2. Zod 스키마 검증
  const validationResult = createReservationSchema.safeParse(input)

  if (!validationResult.success) {
    return {
      success: false,
      fieldErrors: validationResult.error.flatten().fieldErrors,
    }
  }

  const { scheduledAt, studentId, parentId, topic } = validationResult.data

  // 3. RBAC Prisma Client 생성 (TEACHER 역할 시 팀 필터링 적용)
  const rbacDb = getRBACPrisma(session)

  try {
    // 4. 학생 접근 권한 확인 (TEACHER는 자신 팀 학생만 예약 가능)
    const student = await rbacDb.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        primaryParentId: true,
      },
    })

    if (!student) {
      return {
        success: false,
        error: '학생을 찾을 수 없습니다.',
      }
    }

    // 5. 학부모 검증 (해당 학생의 학부모인지 확인)
    const parent = await rbacDb.parent.findFirst({
      where: {
        id: parentId,
        studentId: studentId,
      },
    })

    if (!parent) {
      return {
        success: false,
        error: '학부모를 찾을 수 없습니다.',
      }
    }

    // 6. 중복 검증과 함께 예약 생성
    const reservation = await createReservationWithConflictCheck({
      scheduledAt: new Date(scheduledAt),
      studentId,
      teacherId: session.userId,
      parentId,
      topic,
    })

    // 7. 캐시 무효화
    revalidatePath('/reservations')
    revalidatePath(`/students/${studentId}`)

    return {
      success: true,
      data: {
        id: reservation.id,
        scheduledAt: reservation.scheduledAt,
        student: reservation.student,
        parent: reservation.parent,
        teacher: reservation.teacher,
      },
    }
  } catch (error) {
    console.error('Failed to create reservation:', error)

    // 중복 에러 처리
    if (error instanceof Error && error.message === '이미 해당 시간대에 예약이 있습니다') {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error: '예약 생성 중 오류가 발생했습니다.',
    }
  }
}

/**
 * 예약 수정 결과 타입
 */
export type UpdateReservationResult = {
  success: boolean
  data?: {
    id: string
    scheduledAt: Date
    student: { id: string; name: string }
    parent: { id: string; name: string; relation: string }
    teacher: { id: string; name: string }
  }
  error?: string
  fieldErrors?: {
    scheduledAt?: string[]
    studentId?: string[]
    parentId?: string[]
    topic?: string[]
  }
}

/**
 * 예약 삭제 결과 타입
 */
export type DeleteReservationResult = {
  success: boolean
  error?: string
}

/**
 * 예약 수정 액션
 * - 인증 및 권한 체크
 * - Zod 검증
 * - RBAC 체크
 * - updateReservation() 호출
 * - revalidatePath()
 */
export async function updateReservationAction(
  input: UpdateReservationInput & { reservationId: string }
): Promise<UpdateReservationResult> {
  // 1. 인증 체크
  const session = await verifySession()

  if (!session) {
    return {
      success: false,
      error: '인증되지 않은 요청입니다.',
    }
  }

  // 2. Zod 스키마 검증
  const validationResult = reservationUpdateSchema.safeParse(input)

  if (!validationResult.success) {
    return {
      success: false,
      fieldErrors: validationResult.error.flatten().fieldErrors,
    }
  }

  const { reservationId, scheduledAt, studentId, parentId, topic } =
    validationResult.data

  // 3. RBAC Prisma Client 생성
  const rbacDb = getRBACPrisma(session)

  try {
    // 4. 기존 예약 조회
    const existingReservation = await rbacDb.parentCounselingReservation.findUnique({
      where: {
        id: reservationId,
        teacherId: session.userId,
      },
      select: {
        id: true,
        studentId: true,
        status: true,
      },
    })

    if (!existingReservation) {
      return {
        success: false,
        error: '예약을 찾을 수 없습니다.',
      }
    }

    // 5. 학생 변경 시 권한 확인
    if (studentId && studentId !== existingReservation.studentId) {
      const student = await rbacDb.student.findUnique({
        where: { id: studentId },
        select: { id: true, name: true, primaryParentId: true },
      })

      if (!student) {
        return {
          success: false,
          error: '학생을 찾을 수 없습니다.',
        }
      }
    }

    // 6. 학부모 변경 시 검증
    const targetStudentId = studentId || existingReservation.studentId
    if (parentId) {
      const parent = await rbacDb.parent.findFirst({
        where: {
          id: parentId,
          studentId: targetStudentId,
        },
      })

      if (!parent) {
        return {
          success: false,
          error: '학부모를 찾을 수 없습니다.',
        }
      }
    }

    // 7. 예약 수정
    const updatedReservation = await updateReservation({
      reservationId,
      teacherId: session.userId,
      ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
      ...(studentId && { studentId }),
      ...(parentId && { parentId }),
      ...(topic && { topic }),
    })

    // 8. 캐시 무효화
    revalidatePath('/reservations')
    revalidatePath(`/reservations/${reservationId}`)
    revalidatePath(`/students/${targetStudentId}`)

    return {
      success: true,
      data: {
        id: updatedReservation.id,
        scheduledAt: updatedReservation.scheduledAt,
        student: updatedReservation.student,
        parent: updatedReservation.parent,
        teacher: updatedReservation.teacher,
      },
    }
  } catch (error) {
    console.error('Failed to update reservation:', error)

    // 에러 메시지 처리
    if (error instanceof Error) {
      if (error.message === '이미 완료된 예약은 수정할 수 없습니다') {
        return {
          success: false,
          error: error.message,
        }
      }
      if (error.message === '이미 해당 시간대에 예약이 있습니다') {
        return {
          success: false,
          error: error.message,
        }
      }
    }

    return {
      success: false,
      error: '예약 수정 중 오류가 발생했습니다.',
    }
  }
}

/**
 * 예약 삭제 액션
 * - 인증 및 권한 체크
 * - 상태 검증
 * - 삭제 처리
 * - revalidatePath()
 */
export async function deleteReservationAction(
  input: DeleteReservationInput
): Promise<DeleteReservationResult> {
  // 1. 인증 체크
  const session = await verifySession()

  if (!session) {
    return {
      success: false,
      error: '인증되지 않은 요청입니다.',
    }
  }

  // 2. Zod 스키마 검증
  const validationResult = reservationDeleteSchema.safeParse(input)

  if (!validationResult.success) {
    return {
      success: false,
      error: '잘못된 요청입니다.',
    }
  }

  const { reservationId } = validationResult.data

  // 3. RBAC Prisma Client 생성
  const rbacDb = getRBACPrisma(session)

  try {
    // 4. 기존 예약 조회 (캐시 무효화를 위해 studentId 필요)
    const existingReservation = await rbacDb.parentCounselingReservation.findUnique({
      where: {
        id: reservationId,
        teacherId: session.userId,
      },
      select: {
        id: true,
        studentId: true,
        status: true,
      },
    })

    if (!existingReservation) {
      return {
        success: false,
        error: '예약을 찾을 수 없습니다.',
      }
    }

    // 5. 예약 삭제
    await deleteReservation(reservationId, session.userId)

    // 6. 캐시 무효화
    revalidatePath('/reservations')
    revalidatePath(`/reservations/${reservationId}`)
    revalidatePath(`/students/${existingReservation.studentId}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error('Failed to delete reservation:', error)

    // 에러 메시지 처리
    if (error instanceof Error) {
      if (error.message === '이미 완료된 예약은 삭제할 수 없습니다') {
        return {
          success: false,
          error: error.message,
        }
      }
    }

    return {
      success: false,
      error: '예약 삭제 중 오류가 발생했습니다.',
    }
  }
}

/**
 * 예약 완료 결과 타입
 */
export type CompleteReservationResult = {
  success: boolean
  data?: {
    id: string
    status: ReservationStatus
    counselingSessionId?: string | null
  }
  error?: string
}

/**
 * 예약 취소/불참 결과 타입
 */
export type CancelReservationResult = {
  success: boolean
  data?: {
    id: string
    status: ReservationStatus
  }
  error?: string
}

/**
 * 예약 완료 액션
 * - 인증 및 권한 체크
 * - Zod 검증
 * - COMPLETED로 상태 변경 + CounselingSession 생성
 * - revalidatePath()
 */
export async function completeReservationAction(
  input: CompleteReservationInput
): Promise<CompleteReservationResult> {
  // 1. 인증 체크
  const session = await verifySession()

  if (!session) {
    return {
      success: false,
      error: '인증되지 않은 요청입니다.',
    }
  }

  // 2. Zod 스키마 검증
  const validationResult = completeReservationSchema.safeParse(input)

  if (!validationResult.success) {
    return {
      success: false,
      error: '잘못된 요청입니다.',
    }
  }

  const { reservationId, summary } = validationResult.data

  // 3. RBAC Prisma Client 생성
  const rbacDb = getRBACPrisma(session)

  try {
    // 4. 예약 접근 권한 확인
    const existingReservation = await rbacDb.parentCounselingReservation.findUnique({
      where: {
        id: reservationId,
        teacherId: session.userId,
      },
      select: {
        id: true,
        studentId: true,
        status: true,
      },
    })

    if (!existingReservation) {
      return {
        success: false,
        error: '예약을 찾을 수 없습니다.',
      }
    }

    // 5. 상태 전환 (COMPLETED + CounselingSession 생성)
    const updatedReservation = await transitionReservationStatus({
      reservationId,
      teacherId: session.userId,
      newStatus: ReservationStatus.COMPLETED,
      summary,
    })

    // 6. 캐시 무효화
    revalidatePath('/reservations')
    revalidatePath(`/reservations/${reservationId}`)
    revalidatePath(`/students/${existingReservation.studentId}`)

    return {
      success: true,
      data: {
        id: updatedReservation.id,
        status: updatedReservation.status,
        counselingSessionId: updatedReservation.counselingSessionId,
      },
    }
  } catch (error) {
    console.error('Failed to complete reservation:', error)

    // 에러 메시지 처리
    if (error instanceof Error) {
      if (error.message === '이미 완료된 예약은 상태를 변경할 수 없습니다') {
        return {
          success: false,
          error: error.message,
        }
      }
    }

    return {
      success: false,
      error: '예약 완료 처리 중 오류가 발생했습니다.',
    }
  }
}

/**
 * 예약 취소 액션
 * - 인증 및 권한 체크
 * - CANCELLED로 상태 변경 (세션 생성 없음)
 * - revalidatePath()
 */
export async function cancelReservationAction(
  reservationId: string
): Promise<CancelReservationResult> {
  // 1. 인증 체크
  const session = await verifySession()

  if (!session) {
    return {
      success: false,
      error: '인증되지 않은 요청입니다.',
    }
  }

  // 2. RBAC Prisma Client 생성
  const rbacDb = getRBACPrisma(session)

  try {
    // 3. 예약 접근 권한 확인
    const existingReservation = await rbacDb.parentCounselingReservation.findUnique({
      where: {
        id: reservationId,
        teacherId: session.userId,
      },
      select: {
        id: true,
        studentId: true,
        status: true,
      },
    })

    if (!existingReservation) {
      return {
        success: false,
        error: '예약을 찾을 수 없습니다.',
      }
    }

    // 4. 상태 전환 (CANCELLED)
    const updatedReservation = await transitionReservationStatus({
      reservationId,
      teacherId: session.userId,
      newStatus: ReservationStatus.CANCELLED,
    })

    // 5. 캐시 무효화
    revalidatePath('/reservations')
    revalidatePath(`/reservations/${reservationId}`)
    revalidatePath(`/students/${existingReservation.studentId}`)

    return {
      success: true,
      data: {
        id: updatedReservation.id,
        status: updatedReservation.status,
      },
    }
  } catch (error) {
    console.error('Failed to cancel reservation:', error)

    // 에러 메시지 처리
    if (error instanceof Error) {
      if (error.message === '이미 완료된 예약은 상태를 변경할 수 없습니다') {
        return {
          success: false,
          error: error.message,
        }
      }
    }

    return {
      success: false,
      error: '예약 취소 처리 중 오류가 발생했습니다.',
    }
  }
}

/**
 * 예약 불참 액션
 * - 인증 및 권한 체크
 * - NO_SHOW로 상태 변경 (세션 생성 없음)
 * - revalidatePath()
 */
export async function markNoShowAction(
  reservationId: string
): Promise<CancelReservationResult> {
  // 1. 인증 체크
  const session = await verifySession()

  if (!session) {
    return {
      success: false,
      error: '인증되지 않은 요청입니다.',
    }
  }

  // 2. RBAC Prisma Client 생성
  const rbacDb = getRBACPrisma(session)

  try {
    // 3. 예약 접근 권한 확인
    const existingReservation = await rbacDb.parentCounselingReservation.findUnique({
      where: {
        id: reservationId,
        teacherId: session.userId,
      },
      select: {
        id: true,
        studentId: true,
        status: true,
      },
    })

    if (!existingReservation) {
      return {
        success: false,
        error: '예약을 찾을 수 없습니다.',
      }
    }

    // 4. 상태 전환 (NO_SHOW)
    const updatedReservation = await transitionReservationStatus({
      reservationId,
      teacherId: session.userId,
      newStatus: ReservationStatus.NO_SHOW,
    })

    // 5. 캐시 무효화
    revalidatePath('/reservations')
    revalidatePath(`/reservations/${reservationId}`)
    revalidatePath(`/students/${existingReservation.studentId}`)

    return {
      success: true,
      data: {
        id: updatedReservation.id,
        status: updatedReservation.status,
      },
    }
  } catch (error) {
    console.error('Failed to mark no-show:', error)

    // 에러 메시지 처리
    if (error instanceof Error) {
      if (error.message === '이미 완료된 예약은 상태를 변경할 수 없습니다') {
        return {
          success: false,
          error: error.message,
        }
      }
    }

    return {
      success: false,
      error: '예약 불참 처리 중 오류가 발생했습니다.',
    }
  }
}
