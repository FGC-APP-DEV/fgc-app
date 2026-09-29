import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { Appearance } from 'react-native'
import { applyTheme, type ThemeMode } from './operations'

export const THEME_STORAGE_KEY = 'fgc.theme'

/** Key-value store used to persist the preference (localStorage on web, AsyncStorage on native). */
export type ThemeStorage = {
  get: (key: string) => Promise<string | null> | string | null
  set: (key: string, value: string) => Promise<void> | void
}

type ThemeContextValue = { mode: ThemeMode; toggle: () => void }
const ThemeContext = createContext<ThemeContextValue>({ mode: 'light', toggle: () => {} })

export function useTheme() {
  return useContext(ThemeContext)
}

function systemMode(): ThemeMode {
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'
}

/**
 * Owns the light/dark preference: a stored choice wins, otherwise the system scheme. The
 * subtree is keyed by mode so every component re-reads the freshly applied tokens.
 */
export function ThemeProvider({
  storage,
  onChange,
  children,
}: {
  storage?: ThemeStorage
  onChange?: (mode: ThemeMode) => void
  children: React.ReactNode
}) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const initial = systemMode()
    applyTheme(initial)
    return initial
  })
  const [ready, setReady] = useState(!storage)
  useEffect(() => {
    if (!storage) return
    let live = true
    void (async () => {
      try {
        const saved = await storage.get(THEME_STORAGE_KEY)
        if (live && (saved === 'dark' || saved === 'light')) {
          applyTheme(saved)
          setMode(saved)
        }
      } catch {
        /* An unreadable preference falls back to the system scheme. */
      } finally {
        if (live) setReady(true)
      }
    })()
    return () => {
      live = false
    }
  }, [storage])
  useEffect(() => onChange?.(mode), [mode, onChange])
  const toggle = useCallback(() => {
    const next: ThemeMode = mode === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setMode(next)
    void Promise.resolve()
      .then(() => storage?.set(THEME_STORAGE_KEY, next))
      .catch(() => undefined)
  }, [mode, storage])
  if (!ready) return null
  return (
    <ThemeContext.Provider value={{ mode, toggle }}>
      <React.Fragment key={mode}>{children}</React.Fragment>
    </ThemeContext.Provider>
  )
}
