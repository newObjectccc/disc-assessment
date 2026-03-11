import { NextResponse } from 'next/server'

export const POST = () => {
  const res = NextResponse.json({ message: '已退出登录' })
  res.cookies.delete('admin_token')
  return res
}
