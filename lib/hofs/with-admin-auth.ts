import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '../utils/jwt'
import { UnauthorizedError } from '../errors/http-error'

export type AdminRequest = NextRequest & { adminId: string; adminUsername: string }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminHandler = (req: AdminRequest, ctx: unknown) => Promise<any>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withAdminAuth(handler: AdminHandler): (req: NextRequest, ctx: unknown) => Promise<any> {
  return async (req: NextRequest, ctx: unknown) => {
    const token = req.cookies.get('admin_token')?.value
      || req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) throw new UnauthorizedError('未登录')
    const payload = verifyAdminToken(token)
    if (!payload) throw new UnauthorizedError('登录已过期，请重新登录')
    const adminReq = req as AdminRequest
    adminReq.adminId = payload.id
    adminReq.adminUsername = payload.username
    return handler(adminReq, ctx)
  }
}
