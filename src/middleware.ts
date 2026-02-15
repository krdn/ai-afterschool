import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/session'

const protectedRoutes = ['/students', '/dashboard', '/teachers', '/matching', '/analytics', '/counseling', '/teams', '/satisfaction', '/issues']
const authRoutes = ['/auth/login', '/auth/register', '/auth/reset-password']
const adminRoutes = ['/admin']

export async function middleware(req: NextRequest) {
  const currentPath = req.nextUrl.pathname

  // Generate or extract request ID for tracing
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID()

  const sessionCookie = req.cookies.get('session')?.value
  const session = await decrypt(sessionCookie)

  const isProtectedRoute = protectedRoutes.some((route) =>
    currentPath.startsWith(route)
  )
  const isAuthRoute = authRoutes.some((route) => currentPath.startsWith(route))
  const isAdminRoute = adminRoutes.some((route) => currentPath.startsWith(route))

  // Redirect /dashboard to /students
  if (currentPath === '/dashboard') {
    return NextResponse.redirect(new URL('/students', req.nextUrl))
  }

  // Check admin access
  if (isAdminRoute && session?.role !== 'DIRECTOR') {
    return NextResponse.redirect(new URL('/students', req.nextUrl))
  }

  if (isProtectedRoute && !session?.userId) {
    const loginUrl = new URL('/auth/login', req.nextUrl)
    loginUrl.searchParams.set('callbackUrl', currentPath)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthRoute && session?.userId) {
    return NextResponse.redirect(new URL('/students', req.nextUrl))
  }

  const response = NextResponse.next()

  // Attach request ID to response headers for distributed tracing
  response.headers.set('x-request-id', requestId)

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
