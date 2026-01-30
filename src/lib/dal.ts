import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { decrypt, updateSession } from '@/lib/session'
import { db } from '@/lib/db'

/**
 * Verifies the session and returns the authenticated user.
 * CRITICAL: Call this in every Server Action and Server Component that accesses data.
 * This is the security layer - middleware is for UX (fast redirects) only.
 */
export const verifySession = cache(async () => {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  const payload = await decrypt(session)

  if (!payload?.userId) {
    redirect('/login')
  }

  await updateSession()

  return {
    isAuth: true,
    userId: payload.userId,
    role: payload.role || 'TEACHER',
    teamId: payload.teamId || null,
  }
})

/**
 * Get current teacher with session verification.
 * Returns teacher data after verifying auth.
 */
export const getCurrentTeacher = cache(async () => {
  const session = await verifySession()

  const teacher = await db.teacher.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
    },
  })

  if (!teacher) {
    redirect('/login')
  }

  return teacher
})
