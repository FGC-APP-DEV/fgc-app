/** @jest-environment jsdom */
import React, { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { ApiError } from '@fgc/api-client'
import { AuthProvider, useAuth, type AuthRuntime } from './provider'
import type { SessionResult } from '@fgc/contracts'

let mockRefreshError: ApiError | null = null
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
const mockPost = jest.fn()
jest.mock('@fgc/api-client', () => {
  const actual = jest.requireActual('@fgc/api-client')
  return {
    ...actual,
    ApiClient: class {
      async get(path: string) {
        if (path === '/mentor/me')
          throw new actual.ApiError('UNAUTHENTICATED', 'No mentor session', 401)
        if (path === '/auth/csrf') return { csrfToken: 'csrf' }
        throw new Error('Unexpected read')
      }
      async post(path: string, body: unknown) {
        return mockPost(path, body)
      }
    },
  }
})
let node: HTMLDivElement
let root: Root
let resume: () => void
let result: SessionResult
function Draft() {
  const [text] = useState('unsaved observation')
  return <p>{text}</p>
}
function Consumer() {
  const auth = useAuth()
  return (
    <>
      {auth.user ? <Draft /> : <p>Login</p>}
      <span>{auth.error}</span>
    </>
  )
}
beforeEach(() => {
  jest.useFakeTimers()
  jest.setSystemTime(new Date('2026-09-22T00:00:00.000Z'))
  result = {
    accessToken: 'access',
    expiresAt: '2026-09-22T00:01:00.000Z',
    user: {
      id: 'user',
      email: 'user@example.test',
      name: null,
      roles: ['judge'],
      version: 1,
    },
  }
  mockRefreshError = null
  mockPost.mockReset()
  mockPost.mockImplementation(async () => {
    if (mockRefreshError) throw mockRefreshError
    return result
  })
  node = document.createElement('div')
  document.body.appendChild(node)
  root = createRoot(node)
})
afterEach(async () => {
  await act(async () => root.unmount())
  node.remove()
  jest.useRealTimers()
})
async function mount() {
  const runtime: AuthRuntime = {
    platform: 'web',
    baseUrl: 'https://fgc.test',
    randomId: () => 'installation',
    pkce: async () => ({ verifier: 'proof', challenge: 'challenge' }),
    store: {
      get: async () => null,
      set: async () => undefined,
      remove: async () => undefined,
    },
    subscribeResume: (callback) => {
      resume = callback
      return () => undefined
    },
  }
  await act(async () => {
    root.render(
      <AuthProvider runtime={runtime}>
        <Consumer />
      </AuthProvider>,
    )
  })
}
test('periodic renewal preserves mounted draft on temporary failure and renews without replaying writes', async () => {
  await mount()
  expect(node.textContent).toContain('unsaved observation')
  const draftNode = node.querySelector('p')
  mockRefreshError = new ApiError('NETWORK_ERROR', 'offline')
  await act(async () => {
    jest.advanceTimersByTime(45_000)
  })
  expect(node.querySelector('p')).toBe(draftNode)
  expect(node.textContent).toContain('current screen is preserved')
  expect(mockPost.mock.calls.every(([path]) => path === '/auth/refresh')).toBe(true)
  mockRefreshError = null
  result = { ...result, accessToken: 'renewed', expiresAt: '2026-09-22T00:20:00.000Z' }
  await act(async () => resume())
  expect(node.querySelector('p')).toBe(draftNode)
})
test('revoked session returns to login instead of retrying indefinitely', async () => {
  await mount()
  mockRefreshError = new ApiError('UNAUTHENTICATED', 'revoked', 401)
  await act(async () => {
    jest.advanceTimersByTime(45_000)
  })
  expect(node.textContent).toContain('Login')
  const count = mockPost.mock.calls.length
  await act(async () => {
    jest.advanceTimersByTime(60_000)
  })
  expect(mockPost).toHaveBeenCalledTimes(count)
})
