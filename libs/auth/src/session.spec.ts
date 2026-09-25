import * as session from './session'
import type { SessionResult } from '@fgc/contracts'

const result: SessionResult = {
  accessToken: 'access',
  refreshToken: 'next',
  expiresAt: '2030-01-01T00:00:00.000Z',
  user: {
    id: 'user',
    email: 'user@example.test',
    name: null,
    roles: ['judge'],
    version: 1,
  },
}

it('serializes refresh and clears in-memory identity on logout', async () => {
  let resolve: (value: unknown) => void = () => undefined
  const request = jest.fn(
    () =>
      new Promise((r) => {
        resolve = r
      }),
  )
  const store = {
    get: async () => 'refresh',
    set: async () => undefined,
    remove: async () => undefined,
  }
  const manager = new session.SessionManager({ platform: 'mobile', store, post: request })
  const a = manager.refresh()
  const b = manager.refresh()
  await new Promise((r) => setTimeout(r, 0))
  resolve({
    accessToken: 'access',
    refreshToken: 'next',
    expiresAt: new Date(Date.now() + 60000).toISOString(),
    user: { id: 'u', roles: ['judge'] },
  })
  await Promise.all([a, b])
  expect(request).toHaveBeenCalledTimes(1)
  expect(manager.authorization()).toBe('Bearer access')
  manager.clear()
  expect(manager.authorization()).toBeUndefined()
})

it('logout waits for refresh and revokes the newly persisted refresh token under coordinator', async () => {
  let release: (value: SessionResult) => void = () => undefined
  let token = 'old'
  const events: string[] = []
  const store = {
    get: async () => token,
    set: async (_: string, value: string) => {
      token = value
    },
    remove: async () => {
      token = ''
    },
  }
  const post = jest.fn(async (path: string, body: unknown) => {
    events.push(path)
    if (path === '/auth/refresh')
      return new Promise<SessionResult>((resolve) => {
        release = resolve
      })
    expect(body).toEqual({ platform: 'mobile', refreshToken: 'next' })
    return { signedOut: true }
  })
  const manager = new session.SessionManager({
    platform: 'mobile',
    store,
    post: post as session.SessionOptions['post'],
    coordinate: async (work) => {
      events.push('lock')
      return work()
    },
  })
  const refreshing = manager.refresh()
  await Promise.resolve()
  await Promise.resolve()
  const logout = manager.logout()
  release(result)
  await refreshing
  await logout
  expect(events).toEqual(['lock', '/auth/refresh', 'lock', '/auth/logout'])
  expect(manager.current).toBeNull()
  expect(token).toBe('')
})
it('clear invalidates a refresh response before it can restore in-memory identity', async () => {
  let release: (value: SessionResult) => void = () => undefined
  const store = {
    get: async () => 'old',
    set: jest.fn(async () => undefined),
    remove: async () => undefined,
  }
  const manager = new session.SessionManager({
    platform: 'mobile',
    store,
    post: () =>
      new Promise((resolve) => {
        release = resolve as (value: SessionResult) => void
      }),
  })
  const refresh = manager.refresh()
  await Promise.resolve()
  manager.clear()
  release(result)
  await expect(refresh).rejects.toThrow('signed out')
  expect(manager.current).toBeNull()
  expect(store.set).not.toHaveBeenCalled()
})
it('a failed logout preserves the session so the user can explicitly retry', async () => {
  const store = {
    get: async () => 'old',
    set: async () => undefined,
    remove: jest.fn(async () => undefined),
  }
  const manager = new session.SessionManager({
    platform: 'web',
    store,
    post: async () => {
      throw new Error('offline')
    },
  })
  await manager.accept(result)
  await expect(manager.logout()).rejects.toThrow('offline')
  expect(manager.current).toEqual(result)
  expect(store.remove).not.toHaveBeenCalled()
})
