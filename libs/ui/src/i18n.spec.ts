import {
  APP_LOCALES,
  SHELL_MESSAGES,
  detectLocale,
  interpolate,
  matchLocale,
  translateShell,
} from '@fgc/shared'

describe('i18n', () => {
  it('matches regional tags and rejects unsupported ones', () => {
    expect(matchLocale('fr-CA')).toBe('fr')
    expect(matchLocale('AR_EG')).toBe('ar')
    expect(matchLocale('de-DE')).toBeUndefined()
  })
  it('detects the first supported device language, else English', () => {
    expect(detectLocale(['de-DE', 'es-MX', 'fr'])).toBe('es')
    expect(detectLocale(['de'])).toBe('en')
    expect(detectLocale([])).toBe('en')
  })
  it('interpolates and falls back to English', () => {
    expect(interpolate('Hi {name}', { name: 'Ana' })).toBe('Hi Ana')
    expect(translateShell('ar', 'welcome', { name: 'Ana' })).toContain('Ana')
    expect(translateShell('fr', 'signOut')).toBe('Se déconnecter')
  })
  it('translates every English key in every locale with the same placeholders', () => {
    const en = SHELL_MESSAGES.en
    for (const locale of APP_LOCALES) {
      for (const key of Object.keys(en) as (keyof typeof en)[]) {
        const text = SHELL_MESSAGES[locale][key]
        expect(text).toBeTruthy()
        expect(text?.match(/\{\w+\}/g)?.sort()).toEqual(en[key]?.match(/\{\w+\}/g)?.sort())
      }
    }
  })
})
