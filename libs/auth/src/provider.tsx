import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { ApiClient, ApiError } from '@fgc/api-client'
import type { Mentor, SessionResult, User } from '@fgc/contracts'
import { SessionManager, type SecretStore } from './session'

export interface AuthRuntime {
  platform: 'web' | 'mobile'
  baseUrl: string
  store: SecretStore
  randomId(): string
  pkce(): Promise<{ verifier: string; challenge: string }>
  coordinate?<T>(work: () => Promise<T>): Promise<T>
  subscribeResume?(callback: () => void): () => void
  publishSession?(session: SessionResult | null): void
  subscribeSession?(callback: (session: SessionResult | null) => void): () => void
  getAuthLink?(): { attemptId: string; tokenHash: string } | null
}
interface AuthValue {
  api: ApiClient
  user: User | null
  mentor: Mentor | null
  loading: boolean
  error: string
  installationId: string
  sendEmail(email: string): Promise<void>
  verify(code: string): Promise<void>
  redeem(code: string): Promise<void>
  logout(): Promise<void>
  reloadProfile(): Promise<void>
  hasAuthLink: boolean
  confirmLink(): Promise<void>
}
const Context = createContext<AuthValue | null>(null)
export function AuthProvider({
  runtime,
  children,
}: {
  runtime: AuthRuntime
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [mentor, setMentor] = useState<Mentor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [installationId, setInstallation] = useState('')
  const state = useMemo(() => {
    const value: {
      manager?: SessionManager
      mentorToken?: string
      mentorMode: boolean
      attempt?: { id: string; verifier: string }
      installationId: string
      epoch: number
    } = { mentorMode: false, installationId: '', epoch: 0 }
    const raw = new ApiClient({
      baseUrl: runtime.baseUrl,
      createId: runtime.randomId,
      getAuthorization: () => undefined,
    })
    const authTransport = new ApiClient({
      baseUrl: runtime.baseUrl,
      createId: runtime.randomId,
      getAuthorization: () => undefined,
      getCsrfToken:
        runtime.platform === 'web'
          ? async () => (await raw.get<{ csrfToken: string }>('/auth/csrf')).csrfToken
          : undefined,
    })
    const api = new ApiClient({
      baseUrl: runtime.baseUrl,
      createId: runtime.randomId,
      getAuthorization: () =>
        value.mentorToken
          ? `Mentor ${value.mentorToken}`
          : value.manager?.authorization(),
      getCsrfToken:
        runtime.platform === 'web'
          ? async () => {
              try {
                return (
                  await raw.get<{ csrfToken: string }>(
                    value.mentorMode ? '/mentor/csrf' : '/auth/csrf',
                  )
                ).csrfToken
              } catch {
                return undefined
              }
            }
          : undefined,
      fetcher: (url, init) =>
        fetch(url, {
          ...init,
          headers: {
            ...Object.fromEntries(new Headers(init?.headers).entries()),
            ...(value.installationId
              ? { 'X-Installation-Id': value.installationId }
              : {}),
          },
        }),
    })
    value.manager = new SessionManager({
      platform: runtime.platform,
      store: runtime.store,
      post: (path, body) =>
        path === '/auth/refresh' ? authTransport.post(path, body) : api.post(path, body),
      coordinate: runtime.coordinate,
    })
    return { value, api, manager: value.manager }
  }, [runtime])
  useEffect(() => {
    let disposed = false
    let restoring: Promise<void> | null = null
    const invalidSession = (e: unknown) =>
      e instanceof ApiError && e.code === 'UNAUTHENTICATED'
    const restore = async () => {
      if (restoring) return restoring
      const epoch = state.value.epoch
      const active = () => !disposed && epoch === state.value.epoch
      const work = async () => {
        try {
          const id = (await runtime.store.get('fgc.installation')) ?? runtime.randomId()
          await runtime.store.set('fgc.installation', id)
          state.value.installationId = id
          if (!active()) return
          setInstallation(id)
          if (!state.manager.current) {
            const mentorToken =
              runtime.platform === 'mobile' ? await runtime.store.get('fgc.mentor') : null
            if (!active()) return
            if (mentorToken) {
              state.value.mentorToken = mentorToken
              state.value.mentorMode = true
            }
            try {
              const profile = await state.api.get<Mentor>('/mentor/me')
              if (active()) {
                state.value.mentorMode = true
                setMentor(profile)
                setUser(null)
                setError('')
              }
              return
            } catch (e) {
              // Network/503 errors do not turn a mounted feature into the login screen.
              if (!invalidSession(e)) throw e
              if (!active()) return
              state.value.mentorToken = undefined
              state.value.mentorMode = false
            }
          }
          const previousToken = state.manager.current?.accessToken
          const session = await state.manager.refresh()
          if (active()) {
            setUser(session.user)
            setMentor(null)
            setError('')
            if (previousToken !== session.accessToken) runtime.publishSession?.(session)
          }
        } catch (e) {
          if (active()) {
            if (invalidSession(e)) {
              state.manager.clear()
              state.value.mentorToken = undefined
              state.value.mentorMode = false
              setUser(null)
              setMentor(null)
            } else
              setError(
                'Session could not be refreshed. Your current screen is preserved. Check your connection and retry.',
              )
          }
        } finally {
          if (active()) setLoading(false)
        }
      }
      restoring = work().finally(() => {
        restoring = null
      })
      return restoring
    }
    void restore()
    const unsubscribe = runtime.subscribeResume?.(() => {
      void restore()
    })
    const refreshTimer = setInterval(() => {
      if (state.manager.current && !state.value.mentorMode) void restore()
    }, 15_000)
    const sessionUnsubscribe = runtime.subscribeSession?.((value) => {
      if (disposed) return
      state.value.epoch++
      if (value) {
        const epoch = state.value.epoch
        state.manager.clear()
        void state.manager
          .accept(value)
          .then(() => {
            if (!disposed && epoch === state.value.epoch) {
              state.value.mentorMode = false
              state.value.mentorToken = undefined
              setUser(value.user)
              setMentor(null)
              setLoading(false)
            }
          })
          .catch(() => undefined)
      } else {
        state.manager.clear()
        state.value.mentorToken = undefined
        state.value.mentorMode = false
        setUser(null)
        setMentor(null)
        setLoading(false)
      }
    })
    return () => {
      disposed = true
      clearInterval(refreshTimer)
      unsubscribe?.()
      sessionUnsubscribe?.()
      state.manager.clear()
    }
  }, [runtime, state])
  const action = async (work: () => Promise<void>) => {
    setError('')
    try {
      await work()
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'The operation failed. Please try again.'
      setError(message)
      throw e
    }
  }
  const value: AuthValue = {
    api: state.api,
    user,
    mentor,
    loading,
    error,
    installationId,
    hasAuthLink: Boolean(runtime.getAuthLink?.()),
    sendEmail: (email) =>
      action(async () => {
        const proof = await runtime.pkce()
        const result = await state.api.post<{ attemptId: string }>('/auth/email', {
          email,
          platform: runtime.platform,
          codeChallenge: proof.challenge,
        })
        state.value.attempt = { id: result.attemptId, verifier: proof.verifier }
        await runtime.store.set(
          'fgc.attempt',
          JSON.stringify({ ...state.value.attempt, expiresAt: Date.now() + 600000 }),
        )
      }),
    verify: (code) =>
      action(async () => {
        const attempt = state.value.attempt
        if (!attempt) throw new Error('Request a new code on this device.')
        const result = await state.api.post<SessionResult>('/auth/verify', {
          attemptId: attempt.id,
          emailCode: code,
          codeVerifier: attempt.verifier,
        })
        await state.manager.accept(result)
        state.value.attempt = undefined
        await runtime.store.remove('fgc.attempt')
        runtime.publishSession?.(result)
        setUser(result.user)
      }),
    confirmLink: () =>
      action(async () => {
        const link = runtime.getAuthLink?.()
        const saved = await runtime.store.get('fgc.attempt')
        const attempt = saved
          ? (JSON.parse(saved) as { id: string; verifier: string; expiresAt: number })
          : null
        if (
          !link ||
          !attempt ||
          attempt.id !== link.attemptId ||
          attempt.expiresAt <= Date.now()
        )
          throw new Error(
            'Use the email code on the device that requested it, or request a new login.',
          )
        const confirmed = await state.api.post<{ ticket: string }>(
          '/auth/confirm-link',
          link,
        )
        const result = await state.api.post<SessionResult>('/auth/exchange', {
          ticket: confirmed.ticket,
          codeVerifier: attempt.verifier,
        })
        await state.manager.accept(result)
        await runtime.store.remove('fgc.attempt')
        runtime.publishSession?.(result)
        setUser(result.user)
      }),
    redeem: (code) =>
      action(async () => {
        const result = await state.api.post<Mentor>('/mentor/redeem', {
          code,
          platform: runtime.platform,
          installationId,
        })
        if (result.sessionToken) {
          await runtime.store.set('fgc.mentor', result.sessionToken)
          state.value.mentorToken = result.sessionToken
        }
        state.value.mentorMode = true
        setMentor(result)
      }),
    logout: () =>
      action(async () => {
        state.value.epoch++
        if (state.value.mentorMode) {
          await state.api.post('/mentor/logout', {})
          await runtime.store.remove('fgc.mentor')
          state.value.mentorToken = undefined
          state.value.mentorMode = false
        } else await state.manager.logout()
        await runtime.store.remove('fgc.attempt')
        state.value.attempt = undefined
        runtime.publishSession?.(null)
        setUser(null)
        setMentor(null)
      }),
    reloadProfile: async () => {
      setUser(await state.api.get<User>('/me'))
    },
  }
  return <Context.Provider value={value}>{children}</Context.Provider>
}
export function useAuth(): AuthValue {
  const value = useContext(Context)
  if (!value) throw new Error('AuthProvider is required')
  return value
}
