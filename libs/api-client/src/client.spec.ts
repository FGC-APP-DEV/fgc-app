import * as client from './index'

it('surfaces server conflicts without retrying a write', async () => {
  const fetcher = jest.fn(
    async () =>
      new Response(
        JSON.stringify({
          error: { code: 'VERSION_CONFLICT', message: 'Review the latest changes.' },
          requestId: 'r',
        }),
        { status: 409 },
      ),
  )
  const api = new client.ApiClient({
    baseUrl: 'https://example.org/api/v1',
    fetcher,
    getAuthorization: () => 'Bearer verified',
  })
  await expect(
    api.command(
      '/judging/teams/team/observation',
      { text: 'Keep draft' },
      { method: 'PUT', key: 'key' },
    ),
  ).rejects.toMatchObject({ code: 'VERSION_CONFLICT', status: 409 })
  expect(fetcher).toHaveBeenCalledTimes(1)
})

it('sends credentials only to its configured origin and unwraps the envelope', async () => {
  const fetcher = jest.fn(
    async () =>
      new Response(JSON.stringify({ data: { url: null }, meta: { requestId: 'r' } })),
  )
  const api = new client.ApiClient({
    baseUrl: '/api/v1',
    fetcher,
    getAuthorization: () => undefined,
  })
  await expect(api.get('/schedule')).resolves.toEqual({ url: null })
  await expect(api.get('https://evil.test')).rejects.toThrow()
  expect(fetcher).toHaveBeenCalledTimes(1)
})

it('reports network loss as unsaved without resending', async () => {
  const fetcher = jest.fn(async () => {
    throw new TypeError('network')
  })
  const api = new client.ApiClient({
    baseUrl: '/api/v1',
    fetcher,
    getAuthorization: () => undefined,
  })
  await expect(api.command('/pages', {}, { key: 'key' })).rejects.toMatchObject({
    code: 'NETWORK_ERROR',
  })
  expect(fetcher).toHaveBeenCalledTimes(1)
})

describe('401 recovery', () => {
  const unauthorized = () =>
    new Response(
      JSON.stringify({
        error: { code: 'UNAUTHENTICATED', message: 'Sign in again.' },
        requestId: 'r',
      }),
      { status: 401 },
    )
  const ok = () =>
    new Response(JSON.stringify({ data: ['ok'], meta: { requestId: 'r' } }))

  it('renews the session and retries a GET once', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce(unauthorized())
      .mockResolvedValue(ok())
    const onUnauthenticated = jest.fn(async () => true)
    const api = new client.ApiClient({
      baseUrl: '/api/v1',
      fetcher,
      getAuthorization: () => 'Bearer stale',
      onUnauthenticated,
    })
    await expect(api.get('/judging/annotations')).resolves.toEqual(['ok'])
    expect(onUnauthenticated).toHaveBeenCalledTimes(1)
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('renews the session but never replays a write', async () => {
    const fetcher = jest.fn(async () => unauthorized())
    const onUnauthenticated = jest.fn(async () => true)
    const api = new client.ApiClient({
      baseUrl: '/api/v1',
      fetcher,
      getAuthorization: () => 'Bearer stale',
      onUnauthenticated,
    })
    await expect(api.command('/pages', {}, { key: 'key' })).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
    })
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(onUnauthenticated).toHaveBeenCalledTimes(1)
  })

  it('surfaces the 401 when renewal fails and ignores auth endpoints', async () => {
    const fetcher = jest.fn(async () => unauthorized())
    const onUnauthenticated = jest.fn(async () => false)
    const api = new client.ApiClient({
      baseUrl: '/api/v1',
      fetcher,
      getAuthorization: () => 'Bearer stale',
      onUnauthenticated,
    })
    await expect(api.get('/referee/annotations')).rejects.toMatchObject({ status: 401 })
    expect(fetcher).toHaveBeenCalledTimes(1)
    await expect(api.get('/auth/csrf')).rejects.toMatchObject({ status: 401 })
    expect(onUnauthenticated).toHaveBeenCalledTimes(1)
  })
})
