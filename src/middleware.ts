import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Clear cookie on logout route
  if (request.nextUrl.pathname === '/admin/logout') {
    response.headers.set('Set-Cookie', 'payload-token=; Max-Age=0; Path=/')
  }
  
  return response
}

export const config = {
  matcher: '/admin/logout',
}

