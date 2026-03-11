import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from './lib/utils/jwt'

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 保护 admin 路由（登录页除外）
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = req.cookies.get('admin_token')?.value
    if (!token || !verifyAdminToken(token)) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
