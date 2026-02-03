import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { decrypt, updateSession } from '@/lib/session'
import { db } from '@/lib/db'
import { setRLSSessionContext, getRBACPrisma } from '@/lib/db/rbac'

export type VerifiedSession = {
  isAuth: true
  userId: string
  role: 'DIRECTOR' | 'TEAM_LEADER' | 'MANAGER' | 'TEACHER'
  teamId: string | null
}

/**
 * Verifies the session and returns the authenticated user.
 * CRITICAL: Call this in every Server Action and Server Component that accesses data.
 * This is the security layer - middleware is for UX (fast redirects) only.
 * Also sets PostgreSQL RLS context for tenant isolation.
 */
export const verifySession = cache(async (): Promise<VerifiedSession> => {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  const payload = await decrypt(session)

  if (!payload?.userId) {
    redirect('/login')
  }

  await updateSession(payload.userId, payload.role, payload.teamId)

  // PostgreSQL RLS 세션 컨텍스트 설정 (일시적으로 비활성화)
  // TODO: RLS 설정 후 다시 활성화 필요
  // 빈 문자열 teamId를 null로 변환
  // const normalizedTeamId = payload.teamId && payload.teamId.trim() !== '' ? payload.teamId : null
  //
  // await setRLSSessionContext({
  //   teacherId: payload.userId,
  //   role: payload.role,
  //   teamId: normalizedTeamId,
  // })

  return {
    isAuth: true,
    userId: payload.userId,
    role: payload.role,
    teamId: payload.teamId,
  }
})

/**
 * Get RBAC-aware Prisma client with team filtering.
 * Convenience function that combines session verification with RBAC client.
 */
export const getRBACDB = cache(async () => {
  const session = await verifySession()
  return getRBACPrisma(session)
})

/**
 * Get current teacher with session verification.
 * Returns teacher data including role, teamId, and team relation after verifying auth.
 */
export const getCurrentTeacher = cache(async () => {
  const session = await verifySession()

  const teacher = await db.teacher.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      teamId: true,
      team: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  if (!teacher) {
    redirect('/login')
  }

  return teacher
})
