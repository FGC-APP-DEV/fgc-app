import type { SessionResult } from '@fgc/contracts'

export interface SecretStore {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  remove(key: string): Promise<void>
}
export interface SessionOptions {
  platform: 'web' | 'mobile'
  store: SecretStore
  post: <T>(path: string, body: unknown) => Promise<T>
  coordinate?: <T>(work: () => Promise<T>) => Promise<T>
}
export class SessionManager {
  current: SessionResult | null = null
  private pending: Promise<SessionResult> | null = null
  private generation = 0
  private signingOut = false
  private storageWrite: Promise<void> = Promise.resolve()
  constructor(private readonly options: SessionOptions) {}
  authorization(): string | undefined {
    return this.current ? `Bearer ${this.current.accessToken}` : undefined
  }
  async accept(
    value: SessionResult,
    generation = this.generation,
  ): Promise<SessionResult> {
    if (generation !== this.generation) throw new Error('Session was signed out.')
    if (this.options.platform === 'mobile' && value.refreshToken) {
      const token = value.refreshToken
      const write = this.storageWrite.then(async () => {
        if (generation !== this.generation) throw new Error('Session was signed out.')
        await this.options.store.set('fgc.refresh', token)
      })
      this.storageWrite = write.catch(() => undefined)
      await write
    }
    if (generation !== this.generation) throw new Error('Session was signed out.')
    this.current = value
    return value
  }
  refresh(): Promise<SessionResult> {
    if (this.signingOut) return Promise.reject(new Error('Sign out is in progress.'))
    if (this.pending) return this.pending
    const generation = this.generation
    const work = async () => {
      if (this.current && Date.parse(this.current.expiresAt) > Date.now() + 30000)
        return this.current
      const refreshToken =
        this.options.platform === 'mobile'
          ? await this.options.store.get('fgc.refresh')
          : undefined
      const value = await this.options.post<SessionResult>('/auth/refresh', {
        platform: this.options.platform,
        ...(refreshToken ? { refreshToken } : {}),
      })
      if (generation !== this.generation) throw new Error('Session was signed out.')
      return this.accept(value, generation)
    }
    this.pending = (
      this.options.coordinate ? this.options.coordinate(work) : work()
    ).finally(() => {
      this.pending = null
    })
    return this.pending
  }
  clear(): void {
    this.generation++
    this.current = null
  }
  async logout(): Promise<void> {
    if (this.signingOut) return
    this.signingOut = true
    try {
      // Wait for the local refresh request to settle, then revoke under the same
      // cross-tab lock used for refresh. This orders Set-Cookie rotation/logout.
      await this.pending?.catch(() => undefined)
      const work = async () => {
        const refreshToken =
          this.options.platform === 'mobile'
            ? await this.options.store.get('fgc.refresh')
            : undefined
        await this.options.post('/auth/logout', {
          platform: this.options.platform,
          ...(refreshToken ? { refreshToken } : {}),
        })
        this.clear()
        await this.storageWrite
        await this.options.store.remove('fgc.refresh')
      }
      if (this.options.coordinate) await this.options.coordinate(work)
      else await work()
    } finally {
      this.signingOut = false
    }
  }
}
