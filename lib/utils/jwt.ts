import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'disc-dev-secret-2024'
const EXPIRES_IN = '7d'

export interface AdminTokenPayload {
  id: string
  username: string
}

export function signAdminToken(payload: AdminTokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN })
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
  try {
    return jwt.verify(token, SECRET) as AdminTokenPayload
  } catch {
    return null
  }
}
