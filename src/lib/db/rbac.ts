import 'server-only'
import { PrismaClient } from '@prisma/client'
import { db } from '@/lib/db'

export type TeacherRole = 'DIRECTOR' | 'TEAM_LEADER' | 'MANAGER' | 'TEACHER'

export interface RLSSessionContext {
  teacherId: string
  role: TeacherRole
  teamId: string | null
}

/**
 * PostgreSQL RLS 세션 변수 설정
 * 모든 DB 쿼리 전에 호출해야 함
 */
export async function setRLSSessionContext({
  teacherId,
  role,
  teamId,
}: RLSSessionContext): Promise<void> {
  await db.$executeRaw`SET LOCAL rls.teacher_id = ${teacherId}`
  await db.$executeRaw`SET LOCAL rls.teacher_role = ${role}`
  if (teamId) {
    await db.$executeRaw`SET LOCAL rls.team_id = ${teamId}`
  } else {
    await db.$executeRaw`SET LOCAL rls.team_id = NULL`
  }
}

/**
 * 팀 필터링이 적용된 Prisma Client Extensions 생성
 * 애플리케이션 레이어에서 추가 보안 계층 제공
 */
export function createTeamFilteredPrisma(
  teamId: string | null,
  role: TeacherRole
) {
  // 원장은 필터링 없이 전체 Prisma Client 반환
  if (role === 'DIRECTOR') {
    return db
  }

  // 팀장/매니저/선생님은 자신의 팀 데이터만 접근 가능
  return db.$extends({
    query: {
      $allOperations({ model, args, query }) {
        // Student와 Teacher 모델에 teamId 필터 적용
        if ((model === 'Teacher' || model === 'Student') && teamId) {
          args.where = {
            ...args.where,
            teamId,
          }
        }
        return query(args)
      },
    },
  })
}

/**
 * 현재 세션의 RBAC 컨텍스트로 Prisma Client 생성
 * 세션 정보가 없으면 기본 db 반환
 */
export function getRBACPrisma(session: {
  userId: string
  role?: TeacherRole
  teamId?: string | null
}) {
  const role = session.role || 'TEACHER'
  const teamId = session.teamId || null

  return createTeamFilteredPrisma(teamId, role)
}
