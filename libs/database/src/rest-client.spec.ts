import { createDatabaseGateway, DatabaseFailure } from './rest-client'

const mockRpc = jest.fn()
const mockGetUser = jest.fn()
const mockCreateClient = jest.fn()
jest.mock('@supabase/supabase-js', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}))

const config = {
  url: 'https://db.example.invalid',
  publicKey: 'public',
  serviceKey: 'service',
}
beforeEach(() => {
  mockRpc.mockReset()
  mockGetUser.mockReset()
  mockCreateClient.mockReset()
  mockCreateClient.mockImplementation(() => ({
    auth: { getUser: mockGetUser },
    schema: () => ({ rpc: mockRpc }),
  }))
})

describe('database gateway', () => {
  it('rejects service calls to functions outside the service allowlist', async () => {
    const gateway = createDatabaseGateway(config)
    await expect(gateway.service.rpc('judging_audit')).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
    await expect(gateway.service.rpc('observation_put')).rejects.toBeInstanceOf(
      DatabaseFailure,
    )
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('lets the service client call named mentor and worker functions', async () => {
    mockRpc.mockResolvedValue({ data: true, error: null })
    const gateway = createDatabaseGateway(config)
    await expect(gateway.service.rpc('mentor_redeem', { p_digest: 'x' })).resolves.toBe(
      true,
    )
    expect(mockRpc).toHaveBeenCalledWith('mentor_redeem', { p_digest: 'x' })
  })

  it('forwards the staff bearer token and maps database errors', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { code: 'P0001', message: 'FORBIDDEN' },
    })
    const gateway = createDatabaseGateway(config)
    await expect(gateway.staff('token-1').rpc('panels_list')).rejects.toMatchObject({
      code: 'P0001',
      detail: 'FORBIDDEN',
    })
    const staffOptions = mockCreateClient.mock.calls.find(
      ([, , options]) => options?.global?.headers?.Authorization,
    )?.[2]
    expect(staffOptions.global.headers.Authorization).toBe('Bearer token-1')
    expect(staffOptions.auth.persistSession).toBe(false)
  })

  it('verifies tokens and reports readiness without throwing', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'bad' } })
    const gateway = createDatabaseGateway(config)
    await expect(gateway.verify('good')).resolves.toEqual({ id: 'u1' })
    await expect(gateway.verify('bad')).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
    mockRpc.mockRejectedValueOnce(new Error('offline'))
    await expect(gateway.ready()).resolves.toBe(false)
    mockRpc.mockResolvedValueOnce({ data: true, error: null })
    await expect(gateway.ready()).resolves.toBe(true)
  })
})
