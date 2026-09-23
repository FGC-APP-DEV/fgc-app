import type { Envelope, ErrorCode, ErrorEnvelope, Receipt } from '@fgc/contracts'

export class ApiError extends Error {
  constructor(
    public readonly code: ErrorCode | 'NETWORK_ERROR' | 'INVALID_RESPONSE',
    message: string,
    public readonly status = 0,
    public readonly requestId?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
export interface ApiClientOptions {
  baseUrl: string
  getAuthorization: () => string | undefined
  getCsrfToken?: () => Promise<string | undefined>
  fetcher?: typeof fetch
  createId?: () => string
}
export class ApiClient {
  constructor(private readonly options: ApiClientOptions) {}
  newKey(): string {
    return this.options.createId?.() ?? globalThis.crypto.randomUUID()
  }
  async envelope<T>(path: string, init: RequestInit = {}): Promise<Envelope<T>> {
    if (!/^\/[a-z]/i.test(path) || path.includes('..') || path.includes('\\'))
      throw new Error('Invalid API path')
    const headers = new Headers(init.headers)
    headers.set('Accept', 'application/json')
    if (init.body) headers.set('Content-Type', 'application/json')
    const authorization = this.options.getAuthorization()
    if (authorization) headers.set('Authorization', authorization)
    if (init.method && init.method !== 'GET' && this.options.getCsrfToken) {
      const csrf = await this.options.getCsrfToken()
      if (csrf) headers.set('X-CSRF-Token', csrf)
    }
    let response: Response
    try {
      response = await (this.options.fetcher ?? fetch)(
        `${this.options.baseUrl.replace(/\/$/, '')}${path}`,
        { ...init, headers, credentials: 'include', cache: 'no-store' },
      )
    } catch {
      throw new ApiError(
        'NETWORK_ERROR',
        'Connection lost. Your changes have not been confirmed. Keep this screen open and retry manually.',
      )
    }
    const result = (await response.json().catch(() => null)) as
      | Envelope<T>
      | ErrorEnvelope
      | null
    if (!response.ok) {
      if (result && 'error' in result)
        throw new ApiError(
          result.error.code,
          result.error.message,
          response.status,
          result.requestId,
        )
      throw new ApiError(
        'DEPENDENCY_UNAVAILABLE',
        'The service is temporarily unavailable. Please try again.',
        response.status,
      )
    }
    if (!result || !('data' in result) || !result.meta?.requestId)
      throw new ApiError('INVALID_RESPONSE', 'The service returned an invalid response.')
    return result
  }
  async get<T>(path: string): Promise<T> {
    return (await this.envelope<T>(path)).data
  }
  async post<T>(path: string, body: unknown): Promise<T> {
    return (await this.envelope<T>(path, { method: 'POST', body: JSON.stringify(body) }))
      .data
  }
  async command<T = Receipt>(
    path: string,
    body: unknown,
    options: { method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE'; key?: string } = {},
  ): Promise<T> {
    return (
      await this.envelope<T>(path, {
        method: options.method ?? 'POST',
        headers: { 'Idempotency-Key': options.key ?? this.newKey() },
        body: JSON.stringify(body),
      })
    ).data
  }
  async list<T>(path: string): Promise<T[]> {
    const items: T[] = []
    let cursor: string | undefined
    const seen = new Set<string>()
    do {
      const separator = path.includes('?') ? '&' : '?'
      const result = await this.envelope<T[]>(
        `${path}${separator}limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
      )
      items.push(...result.data)
      cursor = result.meta.nextCursor
      if (cursor && seen.has(cursor))
        throw new ApiError('INVALID_RESPONSE', 'Pagination did not advance.')
      if (cursor) seen.add(cursor)
    } while (cursor)
    return items
  }
}
