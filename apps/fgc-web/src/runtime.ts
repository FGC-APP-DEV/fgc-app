import type { AuthRuntime } from '@fgc/auth'
import type { SessionResult } from '@fgc/contracts'
import type { ImportFile } from '@fgc/imports'

function isSession(value: unknown): value is SessionResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'accessToken' in value &&
    typeof value.accessToken === 'string' &&
    'expiresAt' in value &&
    typeof value.expiresAt === 'string' &&
    'user' in value &&
    typeof value.user === 'object' &&
    value.user !== null &&
    'id' in value.user &&
    typeof value.user.id === 'string' &&
    'roles' in value.user &&
    Array.isArray(value.user.roles)
  )
}
let current: SessionResult | null = null
const listeners = new Set<(session: SessionResult | null) => void>()
const channel =
  typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('fgc.session') : null
channel?.addEventListener('message', (event) => {
  if (
    event.data?.type === 'request' &&
    current &&
    Date.parse(current.expiresAt) > Date.now() + 30000
  )
    channel.postMessage({ type: 'session', value: current })
  if (
    event.data?.type === 'session' &&
    (event.data.value === null || isSession(event.data.value))
  ) {
    current = event.data.value
    listeners.forEach((fn) => fn(current))
  }
})
const fragment = new URLSearchParams(location.hash.replace(/^#/, ''))
const attemptId =
  fragment.get('attemptId') ?? new URLSearchParams(location.search).get('attemptId')
const tokenHash = fragment.get('tokenHash') ?? fragment.get('token_hash')
const authLink = attemptId && tokenHash ? { attemptId, tokenHash } : null
if (location.hash) history.replaceState(null, '', location.pathname + location.search)
const base64url = (value: Uint8Array) =>
  btoa(String.fromCharCode(...value))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
export const runtime: AuthRuntime = {
  platform: 'web',
  baseUrl: '/api/v1',
  randomId: () => crypto.randomUUID(),
  store: {
    get: async (key) =>
      key === 'fgc.installation'
        ? localStorage.getItem(key)
        : key === 'fgc.attempt'
          ? sessionStorage.getItem(key)
          : null,
    set: async (key, value) => {
      if (key === 'fgc.installation') localStorage.setItem(key, value)
      else if (key === 'fgc.attempt') sessionStorage.setItem(key, value)
    },
    remove: async (key) => {
      if (key === 'fgc.installation') localStorage.removeItem(key)
      else sessionStorage.removeItem(key)
    },
  },
  pkce: async () => {
    const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)))
    const digest = new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)),
    )
    return { verifier, challenge: base64url(digest) }
  },
  coordinate: async (work) => {
    const run = async () => {
      channel?.postMessage({ type: 'request' })
      await new Promise((resolve) => setTimeout(resolve, 60))
      const result = await work()
      if (isSession(result)) {
        current = result
        channel?.postMessage({ type: 'session', value: current })
      }
      return result
    }
    if (navigator.locks) return navigator.locks.request('fgc.refresh', run)
    const owner = crypto.randomUUID()
    const deadline = Date.now() + 20000
    while (Date.now() < deadline) {
      let lease: { owner: string; expiresAt: number } | null = null
      try {
        lease = JSON.parse(localStorage.getItem('fgc.refresh.lock') ?? 'null')
      } catch {
        /* Invalid lease can be replaced. */
      }
      if (!lease || lease.expiresAt < Date.now()) {
        localStorage.setItem(
          'fgc.refresh.lock',
          JSON.stringify({ owner, expiresAt: Date.now() + 15000 }),
        )
        await new Promise((resolve) => setTimeout(resolve, 50))
        if (
          JSON.parse(localStorage.getItem('fgc.refresh.lock') ?? '{}').owner === owner
        ) {
          const renewal = setInterval(() => {
            if (
              JSON.parse(localStorage.getItem('fgc.refresh.lock') ?? '{}').owner === owner
            )
              localStorage.setItem(
                'fgc.refresh.lock',
                JSON.stringify({ owner, expiresAt: Date.now() + 15000 }),
              )
          }, 5000)
          try {
            return await run()
          } finally {
            clearInterval(renewal)
            if (
              JSON.parse(localStorage.getItem('fgc.refresh.lock') ?? '{}').owner === owner
            )
              localStorage.removeItem('fgc.refresh.lock')
          }
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    throw new Error('Another tab is refreshing your session. Please try again.')
  },
  publishSession: (session) => {
    current = session
    channel?.postMessage({ type: 'session', value: session })
  },
  subscribeSession: (callback) => {
    listeners.add(callback)
    return () => {
      listeners.delete(callback)
    }
  },
  subscribeResume: (callback) => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') callback()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  },
  getAuthLink: () => authLink,
}
export function pickFile(): Promise<ImportFile | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.xlsx,.csv,.txt,.json'
    input.addEventListener('cancel', () => resolve(null), { once: true })
    input.addEventListener(
      'change',
      async () => {
        try {
          const file = input.files?.[0]
          if (!file) {
            resolve(null)
            return
          }
          if (file.size > 5 * 1024 * 1024)
            throw new Error('Choose a file smaller than 5 MiB.')
          if (file.name.toLowerCase().endsWith('.xlsx')) {
            const bytes = new Uint8Array(await file.arrayBuffer())
            let binary = ''
            for (const byte of bytes) binary += String.fromCharCode(byte)
            resolve({ fileName: file.name, content: btoa(binary), encoding: 'base64' })
          } else
            resolve({ fileName: file.name, content: await file.text(), encoding: 'utf8' })
        } catch (e) {
          reject(e)
        }
      },
      { once: true },
    )
    input.click()
  })
}
// Remove credentials left by the retired prototype; never migrate them into Auth.
localStorage.removeItem('fgc_token')
