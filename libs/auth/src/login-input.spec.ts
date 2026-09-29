import { ApiError } from '@fgc/api-client'
import {
  classifyLoginInput,
  loginFailureMessage,
  notRegisteredMessage,
} from './login-input'

describe('classifyLoginInput', () => {
  it('detects empty input', () => {
    expect(classifyLoginInput('   ')).toEqual({ kind: 'empty' })
  })
  it('detects a valid email and trims it', () => {
    expect(classifyLoginInput(' judge@fgc.test ')).toEqual({
      kind: 'email',
      email: 'judge@fgc.test',
      valid: true,
    })
  })
  it('flags a malformed email', () => {
    expect(classifyLoginInput('judge@')).toMatchObject({ kind: 'email', valid: false })
  })
  it('treats anything else as a mentor code', () => {
    expect(classifyLoginInput('ABCD-1234')).toEqual({ kind: 'code', code: 'ABCD-1234' })
  })
})

describe('loginFailureMessage', () => {
  it.each(['UNAUTHENTICATED', 'NOT_FOUND', 'FORBIDDEN', 'VALIDATION_ERROR'] as const)(
    'maps %s to the not-registered message',
    (code) => {
      expect(loginFailureMessage(new ApiError(code, 'x', 400))).toBe(notRegisteredMessage)
    },
  )
  it('keeps operational API errors visible', () => {
    expect(loginFailureMessage(new ApiError('RATE_LIMITED', 'x', 429))).toBeNull()
    expect(loginFailureMessage(new ApiError('NETWORK_ERROR', 'x'))).toBeNull()
    expect(
      loginFailureMessage(new ApiError('DEPENDENCY_UNAVAILABLE', 'x', 503)),
    ).toBeNull()
  })
  it('keeps local errors such as confirmation-link guidance visible', () => {
    expect(
      loginFailureMessage(
        new Error(
          'Use the email code on the device that requested it, or request a new login.',
        ),
      ),
    ).toBeNull()
  })
})
