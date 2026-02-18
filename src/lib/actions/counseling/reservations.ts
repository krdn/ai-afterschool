'use server'

import { revalidatePath } from 'next/cache'
import { verifySession } from '@/lib/dal'
import { getRBACPrisma } from '@/lib/db/common/rbac'
import {
  createReservationWithConflictCheck,
  updateReservation,
} from '@/lib/db/counseling/reservations'
import {
  createReservationSchema,
  reservationUpdateSchema,
} from '@/lib/validations/reservations'
import type {
  CreateReservationInput,
  UpdateReservationInput,
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

// 조회 함수 re-export (reservations-query.ts에서 분리)
export {
  getReservationsAction,
  getReservationByIdAction,
  getReservationStatsAction,
} from './reservations-query'

// 상태 전환/삭제 함수 re-export (reservations-status.ts에서 분리)
export {
  deleteReservationAction,
  completeReservationAction,
  cancelReservationAction,
  markNoShowAction,
  type DeleteReservationResult,
  type CompleteReservationResult,
  type CancelReservationResult,
} from './reservations-status'

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
