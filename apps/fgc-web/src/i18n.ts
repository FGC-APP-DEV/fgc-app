import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { TRANSLATIONS, type Locale } from '@fgc/shared'

const resources = (['en', 'pt', 'es', 'fr', 'ar'] as Locale[]).reduce(
  (acc, lng) => {
    acc[lng] = { translation: TRANSLATIONS[lng] }
    return acc
  },
  {} as Record<string, { translation: Record<string, string> }>,
)

void i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
