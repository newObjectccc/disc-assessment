import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { UnauthorizedError } from '@/lib/errors/http-error'
import { signAdminToken } from '@/lib/utils/jwt'

export async function loginAdmin(username: string, password: string) {
  const admin = await db.adminUser.findUnique({ where: { username } })
  if (!admin) throw new UnauthorizedError('用户名或密码错误')
  const valid = await bcrypt.compare(password, admin.password)
  if (!valid) throw new UnauthorizedError('用户名或密码错误')
  const token = signAdminToken({ id: admin.id, username: admin.username })
  return { token, username: admin.username }
}
