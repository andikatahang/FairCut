import type { UserRole } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { verifyPassword } from '../../lib/password.js'
import { generateRefreshToken, hashRefreshToken, signAccessToken } from '../../lib/jwt.js'
import { HttpError } from '../../middleware/errorHandler.js'

export interface AuthUser {
  user_id: string
  full_name: string
  email: string
  role: UserRole
  avatar: string | null
}

export interface AuthResult {
  accessToken: string
  refreshToken: string       // raw token, sent to client via httpOnly cookie
  refreshExpiresAt: Date
  user: AuthUser
}

// Look the user up, verify password, issue access + refresh pair.
export async function login(email: string, password: string): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.is_active) {
    throw new HttpError(401, 'Invalid credentials')
  }
  const ok = await verifyPassword(password, user.password_hash)
  if (!ok) throw new HttpError(401, 'Invalid credentials')

  return issueTokens({
    user_id: user.user_id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
  })
}

// Refresh flow: verify the presented raw token matches a stored hash, then
// rotate — revoke the used token and issue a fresh pair.
export async function refresh(rawToken: string): Promise<AuthResult> {
  const tokenHash = hashRefreshToken(rawToken)
  const record = await prisma.refreshToken.findUnique({
    where: { token_hash: tokenHash },
    include: { user: true },
  })
  if (!record || record.revoked_at) throw new HttpError(401, 'Refresh token invalid')
  if (record.expires_at.getTime() < Date.now()) {
    throw new HttpError(401, 'Refresh token expired')
  }

  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { revoked_at: new Date() },
  })

  const u = record.user
  return issueTokens({
    user_id: u.user_id,
    full_name: u.full_name,
    email: u.email,
    role: u.role,
    avatar: u.avatar,
  })
}

export async function logout(rawToken: string | null): Promise<void> {
  if (!rawToken) return
  const tokenHash = hashRefreshToken(rawToken)
  await prisma.refreshToken.updateMany({
    where: { token_hash: tokenHash, revoked_at: null },
    data: { revoked_at: new Date() },
  })
}

export async function getUserById(userId: string): Promise<AuthUser> {
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    select: {
      user_id: true,
      full_name: true,
      email: true,
      role: true,
      avatar: true,
      is_active: true,
    },
  })
  if (!user || !user.is_active) throw new HttpError(401, 'User not found')
  return {
    user_id: user.user_id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
  }
}

async function issueTokens(user: AuthUser): Promise<AuthResult> {
  const accessToken = signAccessToken({
    sub: user.user_id,
    role: user.role,
    email: user.email,
  })
  const { raw, hash, expires_at } = generateRefreshToken()
  await prisma.refreshToken.create({
    data: { user_id: user.user_id, token_hash: hash, expires_at },
  })
  return { accessToken, refreshToken: raw, refreshExpiresAt: expires_at, user }
}
