import { ApiError } from '@fgc/api-client'

export type LoginInput =
  | { kind: 'empty' }
  | { kind: 'email'; email: string; valid: boolean }
  | { kind: 'code'; code: string }

const emailShape = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * The single sign-in field accepts either an email address (staff, judges) or a
 * mentor access code. Anything containing "@" is an email; everything else is a code.
 */
export function classifyLoginInput(raw: string): LoginInput {
  const value = raw.trim()
  if (!value) return { kind: 'empty' }
  if (value.includes('@'))
    return { kind: 'email', email: value, valid: emailShape.test(value) }
  return { kind: 'code', code: value }
}

export const notRegisteredMessage =
  'This email or code is not registered in the system. Contact an administrator to be validated.'

/**
 * Failures that mean "we could not match you", as opposed to operational ones
 * (rate limits, connectivity) whose own message must stay visible. The message is
 * identical for unknown emails and codes so it reveals nothing about which exist.
 */
export function loginFailureMessage(error: unknown): string | null {
  if (
    error instanceof ApiError &&
    (error.code === 'RATE_LIMITED' ||
      error.code === 'NETWORK_ERROR' ||
      error.code === 'INVALID_RESPONSE' ||
      error.status >= 500)
  )
    return null
  return notRegisteredMessage
}
