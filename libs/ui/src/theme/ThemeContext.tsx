import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ThemeColors } from './colors'
import { darkColors, lightColors } from './colors'

export interface ThemeContextValue {
  isDark: boolean
  colors: ThemeColors
  setDark: (v: boolean) => void
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setDark] = useState(true)
  const colors = useMemo(() => (isDark ? darkColors : lightColors), [isDark])
  const toggle = useCallback(() => setDark(d => !d), [])
  const value = useMemo(
    () => ({ isDark, colors, setDark, toggle }),
    [isDark, colors, toggle],
  )
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
