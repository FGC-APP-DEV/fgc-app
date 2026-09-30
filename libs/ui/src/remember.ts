import { useCallback, useState } from 'react'

const memory = new Map<string, unknown>()

/**
 * `useState` whose value survives the remount that follows a theme switch (ThemeProvider
 * re-keys its subtree so every component re-reads the new palette). Keys are plain strings;
 * call `clearRememberedState` when the session ends so nothing leaks to the next sign-in.
 */
export function useRememberedState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() =>
    memory.has(key) ? (memory.get(key) as T) : initial,
  )
  const set = useCallback(
    (next: T | ((previous: T) => T)) =>
      setValue((previous) => {
        const resolved =
          typeof next === 'function' ? (next as (value: T) => T)(previous) : next
        memory.set(key, resolved)
        return resolved
      }),
    [key],
  )
  return [value, set] as const
}

export function clearRememberedState() {
  memory.clear()
}

let owner: string | undefined
/**
 * Binds the remembered state to one identity: a different owner (another account signing in
 * without an intervening logout, or signing out) starts from a clean slate. Idempotent.
 */
export function claimRememberedState(next: string) {
  if (owner !== undefined && owner !== next) memory.clear()
  owner = next
}
