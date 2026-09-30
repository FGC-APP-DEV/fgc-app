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

const unmatchedCodes: ReadonlySet<string> = new Set([
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VALIDATION_ERROR',
])

/**
 * Only genuine authentication failures from the API (unknown/invalid email code or
 * mentor code) map to the generic message. Everything else (rate limits, connectivity,
 * confirmation-link, PKCE or storage errors) returns null so its own actionable message
 * stays visible. The message is identical for unknown emails and codes so it reveals
 * nothing about which exist.
 */
export function loginFailureMessage(error: unknown): string | null {
  return error instanceof ApiError && unmatchedCodes.has(error.code)
    ? notRegisteredMessage
    : null
}
