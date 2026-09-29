import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Platform, View, type ViewStyle } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  DEFAULT_LOCALE,
  LOCALE_INFO,
  detectLocale,
  isAppLocale,
  translateShell,
  type AppLocale,
  type ShellMessageKey,
} from '@fgc/shared'

const STORAGE_KEY = 'fgc.locale'

export interface I18nValue {
  locale: AppLocale
  rtl: boolean
  setLocale: (locale: AppLocale) => void
  t: (key: ShellMessageKey, values?: Record<string, string | number>) => string
  /** Spread on overlay roots (Modals render outside the provider's tree on native). */
  dirStyle: ViewStyle
}

const fallback: I18nValue = {
  locale: DEFAULT_LOCALE,
  rtl: false,
  setLocale: () => undefined,
  t: (key, values) => translateShell(DEFAULT_LOCALE, key, values),
  dirStyle: { direction: 'ltr' },
}

const I18nContext = createContext<I18nValue>(fallback)

export function useI18n(): I18nValue {
  return useContext(I18nContext)
}

/** Preferred languages of the device (browser or native runtime). */
function devicePreferences(): string[] {
  const nav = (globalThis as { navigator?: { languages?: readonly string[]; language?: string } })
    .navigator
  const fromNav = nav?.languages?.length ? [...nav.languages] : nav?.language ? [nav.language] : []
  if (fromNav.length) return fromNav
  try {
    return [Intl.DateTimeFormat().resolvedOptions().locale]
  } catch {
    return []
  }
}

async function readStored(): Promise<AppLocale | undefined> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY)
    return isAppLocale(value) ? value : undefined
  } catch {
    return undefined
  }
}

/**
 * Provides the interface language. Order of precedence: the user's saved choice,
 * then the device language, then English. Arabic switches layout direction to RTL.
 */
export function I18nProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode
  initialLocale?: AppLocale
}) {
  const [locale, setLocaleState] = useState<AppLocale>(
    () => initialLocale ?? detectLocale(devicePreferences()),
  )
  useEffect(() => {
    if (initialLocale) return
    let live = true
    void readStored().then((stored) => {
      if (live && stored) setLocaleState(stored)
    })
    return () => {
      live = false
    }
  }, [initialLocale])
  const rtl = LOCALE_INFO[locale].rtl
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return
    document.documentElement.lang = locale
    document.documentElement.dir = rtl ? 'rtl' : 'ltr'
  }, [locale, rtl])
  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(next)
    void AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined)
  }, [])
  const value = useMemo<I18nValue>(
    () => ({
      locale,
      rtl,
      setLocale,
      t: (key, values) => translateShell(locale, key, values),
      dirStyle: { direction: rtl ? 'rtl' : 'ltr' },
    }),
    [locale, rtl, setLocale],
  )
  return (
    <I18nContext.Provider value={value}>
      <View style={[{ flex: 1 }, value.dirStyle]}>{children}</View>
    </I18nContext.Provider>
  )
}
