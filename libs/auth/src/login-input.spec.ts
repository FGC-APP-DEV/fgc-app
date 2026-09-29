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
  it('maps unmatched credentials to the not-registered message', () => {
    expect(loginFailureMessage(new ApiError('NOT_FOUND', 'x', 404))).toBe(
      notRegisteredMessage,
    )
    expect(loginFailureMessage(new Error('bad code'))).toBe(notRegisteredMessage)
  })
  it('keeps operational errors', () => {
    expect(loginFailureMessage(new ApiError('RATE_LIMITED', 'x', 429))).toBeNull()
    expect(loginFailureMessage(new ApiError('NETWORK_ERROR', 'x'))).toBeNull()
  })
})
