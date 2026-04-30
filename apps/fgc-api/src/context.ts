import type express from 'express'
import jwt from 'jsonwebtoken'
import { getUserByEmail } from '@fgc/database'

export interface Context {
  req: express.Request
  user: { id: string; email: string; role: string } | null
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

export async function createContext(req: express.Request): Promise<Context> {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) {
    return { req, user: null }
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      sub: string
      email: string
      role: string
    }
    return {
      req,
      user: { id: payload.sub, email: payload.email, role: payload.role },
    }
  } catch {
    return { req, user: null }
  }
}

export async function findUserForLogin(email: string) {
  return getUserByEmail(email)
}

export function signToken(user: {
  id: string
  email: string
  role: string
}): string {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' },
  )
}
