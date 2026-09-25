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
