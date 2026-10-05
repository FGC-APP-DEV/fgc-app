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

it('renews a locally valid token when refresh is forced', async () => {
  const store = {
    get: async () => null,
    set: async () => undefined,
    remove: async () => undefined,
  }
  const post = jest.fn(async () => ({
    ...result,
    accessToken: 'renewed',
    expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
  }))
  const manager = new session.SessionManager({ platform: 'web', store, post })
  await manager.accept({
    ...result,
    expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
  })
  await manager.refresh()
  expect(post).not.toHaveBeenCalled()
  await manager.refresh(true)
  expect(post).toHaveBeenCalledTimes(1)
  expect(manager.authorization()).toBe('Bearer renewed')
})

it('a forced refresh issued during a normal refresh still renews a rejected token', async () => {
  const expiresAt = new Date(Date.now() + 600000).toISOString()
  let calls = 0
  const post = jest.fn(async () => ({
    ...result,
    accessToken: `renewed-${++calls}`,
    expiresAt,
  }))
  const store = {
    get: async () => 'refresh',
    set: async () => undefined,
    remove: async () => undefined,
  }
  // The coordinator delays the work, like the web lock does, so the normal refresh is
  // still pending when the forced one arrives; by then the stored token looks valid.
  const manager = new session.SessionManager({
    platform: 'web',
    store,
    post: post as session.SessionOptions['post'],
    coordinate: async (work) => {
      await new Promise((r) => setTimeout(r, 20))
      return work()
    },
  })
  manager.current = { ...result, accessToken: 'rejected', expiresAt }
  const normal = manager.refresh()
  const forced = manager.refresh(true)
  expect(await normal).toMatchObject({ accessToken: 'rejected' })
  expect(await forced).toMatchObject({ accessToken: 'renewed-1' })
  expect(post).toHaveBeenCalledTimes(1)
  expect(manager.authorization()).toBe('Bearer renewed-1')
})

it('a queued forced refresh is abandoned when the session is cleared meanwhile', async () => {
  const expiresAt = new Date(Date.now() + 600000).toISOString()
  const post = jest.fn(async () => ({ ...result, accessToken: 'renewed', expiresAt }))
  const store = {
    get: async () => 'refresh',
    set: async () => undefined,
    remove: async () => undefined,
  }
  const manager = new session.SessionManager({
    platform: 'web',
    store,
    post: post as session.SessionOptions['post'],
    coordinate: async (work) => {
      await new Promise((r) => setTimeout(r, 20))
      return work()
    },
  })
  manager.current = { ...result, accessToken: 'rejected', expiresAt }
  const normal = manager.refresh()
  const forced = manager.refresh(true)
  manager.clear()
  await normal.catch(() => undefined)
  await expect(forced).rejects.toThrow('Session was signed out.')
  // Only the refresh already in flight posted; the queued forced one added nothing.
  expect(post).toHaveBeenCalledTimes(1)
  expect(manager.authorization()).toBeUndefined()
})
