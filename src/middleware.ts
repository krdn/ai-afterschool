import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/session'
import { createRequestLogger } from '@/lib/logger/request'

const protectedRoutes = ['/students', '/dashboard']
const authRoutes = ['/login', '/reset-password']

export async function middleware(req: NextRequest) {
  const currentPath = req.nextUrl.pathname

  // Create request-scoped logger for tracing
  const log = createRequestLogger(req)

  // Log incoming request
  log.info({ pathname: currentPath }, 'Incoming request')

  const sessionCookie = req.cookies.get('session')?.value
  const session = await decrypt(sessionCookie)

  const isProtectedRoute = protectedRoutes.some((route) =>
    currentPath.startsWith(route)
  )
  const isAuthRoute = authRoutes.some((route) => currentPath.startsWith(route))

  if (isProtectedRoute && !session?.userId) {
    const loginUrl = new URL('/login', req.nextUrl)
    loginUrl.searchParams.set('callbackUrl', currentPath)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthRoute && session?.userId) {
    return NextResponse.redirect(new URL('/students', req.nextUrl))
  }

  const response = NextResponse.next()

  // Attach request ID to response headers for distributed tracing
  const requestId = log.bindings().requestId as string
  response.headers.set('x-request-id', requestId)

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
