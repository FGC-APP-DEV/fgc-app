import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { TRANSLATIONS } from '@fgc/shared'

const resources = {
  en: { translation: TRANSLATIONS.en },
  pt: { translation: TRANSLATIONS.pt },
  es: { translation: TRANSLATIONS.es },
  fr: { translation: TRANSLATIONS.fr },
  ar: { translation: TRANSLATIONS.ar },
} as const

void i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
