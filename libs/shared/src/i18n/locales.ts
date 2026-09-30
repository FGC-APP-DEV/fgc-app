/**
 * Interface languages offered in the language menu.
 * English is the base language and the fallback for any missing key.
 */
export const APP_LOCALES = ['en', 'fr', 'es', 'ar'] as const
export type AppLocale = (typeof APP_LOCALES)[number]

export const DEFAULT_LOCALE: AppLocale = 'en'

export interface LocaleInfo {
  code: AppLocale
  /** Name in its own language. */
  label: string
  /** Flag emoji shown next to the name. */
  flag: string
  rtl: boolean
}

export const LOCALE_INFO: Record<AppLocale, LocaleInfo> = {
  en: { code: 'en', label: 'English', flag: '🇬🇧', rtl: false },
  fr: { code: 'fr', label: 'Français', flag: '🇫🇷', rtl: false },
  es: { code: 'es', label: 'Español', flag: '🇪🇸', rtl: false },
  ar: { code: 'ar', label: 'العربية', flag: '🇸🇦', rtl: true },
}

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === 'string' && (APP_LOCALES as readonly string[]).includes(value)
}

/** Maps a BCP-47 tag such as "fr-CA" or "ar_EG" to a supported locale, or undefined. */
export function matchLocale(tag: string | null | undefined): AppLocale | undefined {
  const base = tag?.toLowerCase().split(/[-_]/)[0]
  return isAppLocale(base) ? base : undefined
}

/** First supported locale among the device's preferred languages, else English. */
export function detectLocale(
  preferred: readonly (string | null | undefined)[],
): AppLocale {
  for (const tag of preferred) {
    const match = matchLocale(tag)
    if (match) return match
  }
  return DEFAULT_LOCALE
}

/** Replaces `{name}` placeholders. */
export function interpolate(
  template: string,
  values?: Record<string, string | number>,
): string {
  return values
    ? template.replace(/\{(\w+)\}/g, (m, key: string) =>
        key in values ? String(values[key]) : m,
      )
    : template
}
