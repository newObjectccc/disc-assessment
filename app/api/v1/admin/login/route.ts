import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/hofs/with-error-handler'
import { withBodyValidation } from '@/lib/hofs/with-body-validation'
import { adminLoginSchema } from '@/lib/dto/admin.dto'
import { loginAdmin } from '@/services/admin.service'

export const POST = withErrorHandler(
  withBodyValidation(adminLoginSchema)(async (req) => {
    const { token, username } = await loginAdmin(req.__parsedBody.username, req.__parsedBody.password)
    const res = NextResponse.json({ username, message: '登录成功' })
    res.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7天
      sameSite: 'lax',
      path: '/',
    })
    return res
  })
) as (req: NextRequest) => Promise<NextResponse>
